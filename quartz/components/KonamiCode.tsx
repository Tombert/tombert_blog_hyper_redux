import { QuartzComponent, QuartzComponentConstructor } from "./types"
// @ts-ignore
import script from "./scripts/konami.inline"

interface KonamiCodeOptions {
  // slug of the page to jump to, e.g. "Projects/Space-Invaders-Clone"
  target: string
}

export default ((opts: KonamiCodeOptions) => {
  // base64 so the destination doesn't turn up in a casual view-source or ctrl-F
  const encoded = Buffer.from(opts.target).toString("base64")

  const KonamiCode: QuartzComponent = () => <span id="konami" data-k={encoded} hidden />

  KonamiCode.afterDOMLoaded = script
  return KonamiCode
}) satisfies QuartzComponentConstructor<KonamiCodeOptions>
