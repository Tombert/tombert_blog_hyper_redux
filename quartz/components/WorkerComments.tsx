import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
// @ts-ignore
import script from "./scripts/worker-comments.inline"

interface WorkerCommentsOptions {
  api: string
  siteKey: string
}

export default ((opts: WorkerCommentsOptions) => {
  const WorkerComments: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    // mimic giscus component behavior: allow disabling via frontmatter
    const disableComment: boolean =
      typeof fileData.frontmatter?.comments !== "undefined" &&
      (!fileData.frontmatter?.comments || fileData.frontmatter?.comments === "false")
    if (disableComment) return <></>

    const thread = `/${fileData.slug ?? ''}`
    return (
      <>
        <link rel="stylesheet" href="/static/css/comments.css" />
        <div id="comments" data-thread={thread} data-api={opts.api} data-turnstile-site-key={opts.siteKey}></div>
        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
        <script src="/static/js/comments-widget.js" defer></script>
      </>
    )
  }

  // Re-init on SPA nav
  // @ts-ignore
  ;(WorkerComments as any).afterDOMLoaded = script

  return WorkerComments
}) satisfies QuartzComponentConstructor<WorkerCommentsOptions>
