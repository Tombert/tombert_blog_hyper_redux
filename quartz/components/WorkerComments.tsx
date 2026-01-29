import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { transformLink } from "../util/path"
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
    const tosHref = transformLink(fileData.slug!, "Terms of Service", {
      strategy: "absolute",
      allSlugs: [],
    })
    const ppHref = transformLink(fileData.slug!, "Privacy Policy", {
      strategy: "absolute",
      allSlugs: [],
    })
    return (
      <>
        <link rel="stylesheet" href="/static/css/comments.css" />
        <div id="comments-widget" data-thread={thread} data-api={opts.api} data-turnstile-site-key={opts.siteKey}></div>
        <p class="comment-consent">
          By submitting a comment you confirm you are 18+ and agree to the
          {" "}
          <a href={tosHref} class="internal">Terms of Service</a> 
            and 
	  <a href={ppHref} class="internal">Privacy Policy</a>.
        </p>
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
