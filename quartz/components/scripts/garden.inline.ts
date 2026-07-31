// quartz/components/scripts/garden.inline.ts
//
// A small pixel-art garden with fireflies drifting over it, for the
// homepage only. The garden itself is drawn once at low resolution
// (GW x GH) and scaled up with pixel smoothing off, so it stays crisp
// rather than blurring into a photo. The fireflies are drawn fresh
// every frame on top, unscaled, so their glow stays soft against the
// blocky ground — that contrast is deliberate, not a mismatch.
//
// SEED is fixed rather than randomised per page load, so the garden
// looks the same to every visitor and on every rebuild. Change it (or
// swap in Date.now()-based seeding) if you'd rather it varied.

const SEED = 11
const GW = 140,
  GH = 34,
  SOIL = 6

const COL: Record<string, string> = {
  a: "#4c6656",
  b: "#7fa08c",
  c: "#e8b74d",
  d: "#3a4d40",
}

type PlantPixel = [number, number, string]

const fern: PlantPixel[] = [
  [0, 0, "a"], [0, 1, "a"], [0, 2, "a"], [0, 3, "a"], [0, 4, "a"], [0, 5, "a"],
  [-2, 1, "b"], [2, 1, "b"], [-1, 2, "b"], [1, 2, "b"], [-2, 3, "b"], [2, 3, "b"],
  [-1, 4, "b"], [1, 4, "b"], [0, 6, "b"],
]
const tuft: PlantPixel[] = [
  [0, 0, "a"], [-1, 1, "b"], [0, 1, "b"], [1, 1, "b"],
  [-1, 2, "b"], [0, 2, "b"], [1, 2, "b"], [0, 3, "b"],
]
const flower: PlantPixel[] = [
  [0, 0, "a"], [0, 1, "a"], [0, 2, "a"], [0, 3, "a"], [0, 4, "a"], [0, 5, "a"],
  [-1, 2, "b"], [1, 3, "b"],
  [-1, 6, "c"], [0, 6, "c"], [1, 6, "c"], [0, 7, "c"],
]
const bush: PlantPixel[] = [
  [-3, 0, "a"], [3, 0, "a"],
  [-2, 1, "b"], [-1, 1, "b"], [0, 1, "b"], [1, 1, "b"], [2, 1, "b"],
  [-1, 2, "b"], [0, 2, "b"], [1, 2, "b"],
]
const grassClump: PlantPixel[] = [
  [-2, 0, "a"], [-2, 1, "a"], [-2, 2, "b"],
  [-1, 0, "a"], [-1, 1, "b"], [-1, 2, "b"], [-1, 3, "b"],
  [0, 0, "a"], [0, 1, "a"], [0, 2, "b"], [0, 3, "b"], [0, 4, "b"],
  [1, 0, "a"], [1, 1, "b"], [1, 2, "b"],
  [2, 0, "a"], [2, 1, "a"], [2, 2, "b"],
]
const sapling: PlantPixel[] = [
  [0, 0, "a"], [0, 1, "a"], [0, 2, "a"], [0, 3, "a"], [0, 4, "a"], [0, 5, "a"], [0, 6, "a"],
  [-1, 6, "b"], [0, 7, "b"], [1, 6, "b"], [-1, 7, "b"], [1, 7, "b"], [0, 8, "b"],
]
const mushroom: PlantPixel[] = [
  [-2, 0, "d"], [-2, 1, "c"], [-3, 1, "c"], [-1, 1, "c"],
  [1, 0, "d"], [1, 2, "c"], [0, 2, "c"], [2, 2, "c"], [1, 3, "c"],
]
const vine: PlantPixel[] = [
  [0, 0, "a"], [1, 1, "b"], [0, 2, "a"], [-1, 3, "b"], [0, 4, "a"], [1, 5, "b"], [0, 6, "a"],
]
const plants = [fern, tuft, flower, bush, grassClump, sapling, mushroom, vine]

function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function buildScene(): HTMLCanvasElement {
  const off = document.createElement("canvas")
  off.width = GW
  off.height = GH
  const octx = off.getContext("2d")!
  const rnd = seededRandom(SEED)

  octx.fillStyle = "#fdfdfc"
  octx.fillRect(0, 0, GW, GH)
  octx.fillStyle = COL.d
  octx.fillRect(0, GH - SOIL, GW, SOIL)

  function stamp(px: number, py: number, pattern: PlantPixel[], mirror: boolean, accent: boolean, scale: number) {
    pattern.forEach(([dx, dy, c]) => {
      const sy = Math.round(dy * scale)
      const x = px + (mirror ? -dx : dx)
      const y = py - sy
      if (x >= 0 && x < GW && y >= 0 && y < GH) {
        octx.fillStyle = COL[c]
        octx.fillRect(x, y, 1, 1)
      }
    })
    if (accent) {
      const x = px
      const y = py - Math.round(2 * scale)
      if (x >= 0 && x < GW && y >= 0 && y < GH) {
        octx.fillStyle = COL.c
        octx.fillRect(x, y, 1, 1)
      }
    }
  }

  let x = 2
  while (x < GW - 2) {
    const p = plants[Math.floor(rnd() * plants.length)]
    const baseY = GH - SOIL
    const scale = 0.7 + rnd() * 0.9
    stamp(x, baseY, p, rnd() > 0.5, rnd() < 0.2, scale)
    x += 3 + Math.floor(rnd() * 5)
  }
  for (let i = 0; i < 20; i++) {
    if (rnd() < 0.5) {
      const px = Math.floor(rnd() * GW)
      const py = GH - SOIL - 1 - Math.floor(rnd() * 2)
      octx.fillStyle = COL.b
      octx.fillRect(px, py, 1, 1)
    }
  }

  return off
}

interface Firefly {
  x: number
  y: number
  vx: number
  vy: number
  ph: number
  freq: number
  r: number
}

function initGarden(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  const scene = buildScene()

  function size() {
    canvas.width = canvas.clientWidth * devicePixelRatio
    canvas.height = canvas.clientHeight * devicePixelRatio
  }
  size()
  window.addEventListener("resize", size)

  let mx = -9999,
    my = -9999
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect()
    mx = (e.clientX - r.left) * devicePixelRatio
    my = (e.clientY - r.top) * devicePixelRatio
  })
  canvas.addEventListener("pointerleave", () => {
    mx = -9999
    my = -9999
  })

  const flies: Firefly[] = Array.from({ length: 16 }, () => ({
    x: Math.random(),
    y: 0.2 + Math.random() * 0.55,
    vx: (Math.random() - 0.5) * 0.0006,
    vy: (Math.random() - 0.5) * 0.0004,
    ph: Math.random() * Math.PI * 2,
    freq: 0.02 + Math.random() * 0.02,
    r: 2 + Math.random() * 1.5,
  }))

  let t = 0
  let running = true
  document.addEventListener("visibilitychange", () => {
    running = document.visibilityState === "visible"
    if (running) requestAnimationFrame(draw)
  })

  function draw() {
    if (!running) return
    const w = canvas.width,
      h = canvas.height
    ctx!.imageSmoothingEnabled = false
    ctx!.drawImage(scene, 0, 0, GW, GH, 0, 0, w, h)

    flies.forEach((f) => {
      let dx = f.vx,
        dy = f.vy
      const fx = f.x * w,
        fy = f.y * h
      const ddx = fx - mx,
        ddy = fy - my
      const dist = Math.sqrt(ddx * ddx + ddy * ddy)
      if (dist < w * 0.12 && dist > 0) {
        dx += (ddx / dist) * 0.0009
        dy += (ddy / dist) * 0.0009
      }
      f.x += dx
      f.y += dy
      if (f.x < 0) f.x = 1
      if (f.x > 1) f.x = 0
      if (f.y < 0.15) f.y = 0.15
      if (f.y > 0.9) f.y = 0.9

      const glow = (Math.sin(t * f.freq + f.ph) + 1) / 2
      const alpha = 0.15 + glow * 0.75
      const cx = f.x * w,
        cy = f.y * h
      const rad = f.r * devicePixelRatio * (1 + glow * 1.5)

      const g = ctx!.createRadialGradient(cx, cy, 0, cx, cy, rad * 5)
      g.addColorStop(0, `rgba(201,120,27,${alpha * 0.5})`)
      g.addColorStop(1, "rgba(201,120,27,0)")
      ctx!.fillStyle = g
      ctx!.beginPath()
      ctx!.arc(cx, cy, rad * 5, 0, 7)
      ctx!.fill()

      ctx!.fillStyle = `rgba(159,90,15,${alpha})`
      ctx!.beginPath()
      ctx!.arc(cx, cy, rad, 0, 7)
      ctx!.fill()
    })

    t += 1
    requestAnimationFrame(draw)
  }
  draw()
}

const canvas = document.getElementById("garden-canvas") as HTMLCanvasElement | null
if (canvas) initGarden(canvas)
