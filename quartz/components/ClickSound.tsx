// quartz/components/ClickSound.tsx
//
// Renders nothing. It exists purely to get the script bundled
// into postscript.js on every page.

import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore: Quartz's inline bundling system
import script from "./scripts/clicksound.inline"

const ClickSound: QuartzComponent = () => <></>

ClickSound.afterDOMLoaded = script

export default (() => ClickSound) satisfies QuartzComponentConstructor
