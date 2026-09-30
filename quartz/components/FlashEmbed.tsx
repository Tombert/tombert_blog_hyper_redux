import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/flashEmbed.scss"
// @ts-ignore
import script from "./scripts/flash-embed.inline"

// Plays the SWF named in a page's `swf` frontmatter with Ruffle, which is only fetched
// on pages that actually have one.
export default (() => {
  const FlashEmbed: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const swf = fileData.frontmatter?.swf
    if (!swf) return null

    return <div class="flash-embed" data-swf={swf}></div>
  }

  FlashEmbed.css = style
  FlashEmbed.afterDOMLoaded = script
  return FlashEmbed
}) satisfies QuartzComponentConstructor
