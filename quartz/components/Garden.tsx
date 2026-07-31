// quartz/components/Garden.tsx
//
// Homepage-only pixel garden with fireflies. Rendered via
// ConditionalRender in quartz.layout.ts so it only shows up on the
// index page — see the setup notes for that piece.

import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore: Quartz's inline bundling system
import script from "./scripts/garden.inline"
import style from "./styles/garden.scss"

const Garden: QuartzComponent = () => <canvas id="garden-canvas" class="garden-canvas" />

Garden.afterDOMLoaded = script
Garden.css = style

export default (() => Garden) satisfies QuartzComponentConstructor
