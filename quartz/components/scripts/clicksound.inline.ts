// quartz/components/scripts/clicksound.inline.ts
//
// UI click + hover sounds, synthesised with Web Audio.
//
//   clickSound.play("blip")     // hear one
//   clickSound.set("blip")      // switch and remember
//   clickSound.volume(0.9)      // 0–1
//   clickSound.toggle()         // mute / unmute
//   clickSound.hover(false)     // turn hover sounds off
//
// Whatever you settle on, copy it back into DEFAULT_PRESET / DEFAULT_VOLUME
// so visitors get it on first load.

type Preset = {
  wave: OscillatorType
  from: number // starting pitch, Hz
  to: number // ending pitch, Hz
  attack: number // seconds to full volume
  decay: number // seconds to silence
  noise: number // 0–1, how much noise transient
  noiseDecay: number // seconds
  filter: BiquadFilterType
  cutoff: number // Hz
  q: number
  gain: number // per-preset trim to keep the five roughly level-matched
}

const PRESETS: Record<string, Preset> = {
  // Sharp and mechanical. Closest to a keyboard or a real switch.
  tick: {
    wave: "triangle",
    from: 2200,
    to: 1500,
    attack: 0.001,
    decay: 0.024,
    noise: 1,
    noiseDecay: 0.016,
    filter: "bandpass",
    cutoff: 2000,
    q: 0.8,
    gain: 1.1,
  },

  // Dry and plasticky. A mouse button rather than a keyboard.
  click: {
    wave: "sine",
    from: 1600,
    to: 600,
    attack: 0.001,
    decay: 0.035,
    noise: 0.6,
    noiseDecay: 0.018,
    filter: "highpass",
    cutoff: 600,
    q: 0.7,
    gain: 1,
  },

  // Soft and bubbly, pitch bends upward. The friendly app-UI sound.
  pop: {
    wave: "sine",
    from: 500,
    to: 1000,
    attack: 0.002,
    decay: 0.06,
    noise: 0.15,
    noiseDecay: 0.012,
    filter: "lowpass",
    cutoff: 5000,
    q: 0.8,
    gain: 0.9,
  },

  // Square wave, unmistakably game menu. Harmonically rich, so it
  // needs less makeup gain than the others.
  blip: {
    wave: "square",
    from: 900,
    to: 620,
    attack: 0.001,
    decay: 0.05,
    noise: 0.08,
    noiseDecay: 0.01,
    filter: "lowpass",
    cutoff: 3200,
    q: 1,
    gain: 0.45,
  },

  // The low one. Bass is perceived as quieter than mids at equal
  // amplitude, so this carries the most makeup gain of the five.
  thock: {
    wave: "sine",
    from: 190,
    to: 70,
    attack: 0.005,
    decay: 0.09,
    noise: 0.5,
    noiseDecay: 0.03,
    filter: "lowpass",
    cutoff: 1400,
    q: 0.7,
    gain: 1.7,
  },
}

const DEFAULT_PRESET = "click"
const DEFAULT_VOLUME = 0.75
const HOVER_ENABLED = true

// Hover sounds are the same preset, quieter, higher, shorter.
const HOVER_PITCH = 1.6
const HOVER_GAIN = 0.4
const HOVER_DECAY = 0.6
const HOVER_THROTTLE = 70 // ms between hover sounds

// Both hover and click sounds only fire on elements matching this
// selector. Currently just links — widen it (e.g. add ", button")
// if you want other interactive elements to make sound too.
const SOUND_TARGETS = "a[href]"

// Repeated identical clicks sound robotic. A few percent of random
// pitch drift on each one fixes it.
const PITCH_JITTER = 0.04

// Bumped suffix so old stored volumes from a previous version don't
// override the new default.
const KEY = {
  preset: "click-sound-preset-2",
  volume: "click-sound-volume-2",
  muted: "click-sound",
  hover: "click-sound-hover",
}

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {}
}

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noiseBuffer: AudioBuffer | null = null

function getContext(): AudioContext | null {
  const AC = window.AudioContext ?? (window as any).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === "suspended") void ctx.resume()
  return ctx
}

// One persistent master chain: gain into a limiter, then out.
// The limiter is what lets the level sit high without the louder
// presets crackling.
function getMaster(ac: AudioContext): GainNode {
  if (!master) {
    master = ac.createGain()
    const limiter = ac.createDynamicsCompressor()
    limiter.threshold.value = -8
    limiter.knee.value = 6
    limiter.ratio.value = 10
    limiter.attack.value = 0.002
    limiter.release.value = 0.08
    master.connect(limiter)
    limiter.connect(ac.destination)
  }
  master.gain.value = currentVolume()
  return master
}

function getNoise(ac: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    const len = Math.floor(ac.sampleRate * 0.05)
    noiseBuffer = ac.createBuffer(1, len, ac.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / len)
    }
  }
  return noiseBuffer
}

function currentPreset(): Preset {
  const name = read(KEY.preset) ?? DEFAULT_PRESET
  return PRESETS[name] ?? PRESETS[DEFAULT_PRESET]
}

function currentVolume(): number {
  const stored = read(KEY.volume)
  const v = stored === null ? DEFAULT_VOLUME : parseFloat(stored)
  return Number.isFinite(v) ? Math.min(Math.max(v, 0), 1) : DEFAULT_VOLUME
}

function isMuted(): boolean {
  return read(KEY.muted) === "off"
}

function hoverOn(): boolean {
  const stored = read(KEY.hover)
  return stored === null ? HOVER_ENABLED : stored === "on"
}

function play(preset: Preset, pitchScale = 1, gainScale = 1, decayScale = 1) {
  const ac = getContext()
  if (!ac) return

  const t = ac.currentTime
  const jitter = 1 + (Math.random() * 2 - 1) * PITCH_JITTER
  const from = preset.from * pitchScale * jitter
  const to = preset.to * pitchScale * jitter
  const decay = preset.decay * decayScale

  const out = ac.createGain()
  out.gain.value = preset.gain * gainScale

  const filter = ac.createBiquadFilter()
  filter.type = preset.filter
  filter.frequency.value = preset.cutoff * pitchScale
  filter.Q.value = preset.q
  filter.connect(out)
  out.connect(getMaster(ac))

  // Tonal body
  const osc = ac.createOscillator()
  const oscGain = ac.createGain()
  osc.type = preset.wave
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(to, 20), t + decay * 0.7)
  oscGain.gain.setValueAtTime(0.0001, t)
  oscGain.gain.exponentialRampToValueAtTime(1, t + preset.attack)
  oscGain.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  osc.connect(oscGain).connect(filter)
  osc.start(t)
  osc.stop(t + decay + 0.02)

  // Noise transient — this is what makes it read as a click and not a beep
  if (preset.noise > 0) {
    const nDecay = preset.noiseDecay * decayScale
    const noise = ac.createBufferSource()
    noise.buffer = getNoise(ac)
    const nGain = ac.createGain()
    nGain.gain.setValueAtTime(preset.noise, t)
    nGain.gain.exponentialRampToValueAtTime(0.0001, t + nDecay)
    noise.connect(nGain).connect(filter)
    noise.start(t)
    noise.stop(t + nDecay + 0.01)
  }
}

// Attach once — this listener lives on `document` and Quartz re-runs
// postscript on SPA navigation, so it would otherwise stack up.
const w = window as any
if (!w.__clickSoundReady) {
  w.__clickSoundReady = true

  document.addEventListener(
    "pointerdown",
    (e) => {
      if ((e as PointerEvent).button !== 0) return
      if (isMuted()) return
      const target = (e.target as Element | null)?.closest?.(SOUND_TARGETS)
      if (!target) return
      play(currentPreset())
    },
    { capture: true, passive: true },
  )

  // Hover: only on real pointers. Touch devices fire synthetic hover
  // events on tap, which would double up with the click sound.
  const finePointer =
    window.matchMedia?.("(hover: hover) and (pointer: fine)").matches ?? false

  if (finePointer) {
    let lastTarget: Element | null = null
    let lastTime = 0

    document.addEventListener(
      "pointerover",
      (e) => {
        if (isMuted() || !hoverOn()) return
        const target = (e.target as Element | null)?.closest?.(SOUND_TARGETS)
        if (!target || target === lastTarget) return

        const now = performance.now()
        if (now - lastTime < HOVER_THROTTLE) return

        lastTarget = target
        lastTime = now
        play(currentPreset(), HOVER_PITCH, HOVER_GAIN, HOVER_DECAY)
      },
      { capture: true, passive: true },
    )

    document.addEventListener(
      "pointerout",
      (e) => {
        const target = (e.target as Element | null)?.closest?.(SOUND_TARGETS)
        if (target === lastTarget) lastTarget = null
      },
      { capture: true, passive: true },
    )
  }

  w.clickSound = {
    presets: Object.keys(PRESETS),
    play(name?: string) {
      play(name ? (PRESETS[name] ?? currentPreset()) : currentPreset())
    },
    set(name: string) {
      if (!PRESETS[name]) return `unknown preset — try ${Object.keys(PRESETS).join(", ")}`
      write(KEY.preset, name)
      play(PRESETS[name])
      return name
    },
    volume(v: number) {
      write(KEY.volume, String(v))
      play(currentPreset())
      return v
    },
    hover(on: boolean) {
      write(KEY.hover, on ? "on" : "off")
      return on
    },
    toggle() {
      const next = isMuted() ? "on" : "off"
      write(KEY.muted, next)
      return next
    },
  }
}
