import { QuartzPluginData } from "../plugins/vfile"

// Pages with `unlisted: true` in their frontmatter are still built and reachable by URL,
// but are left out of the explorer, search, graph, RSS, sitemap, folder/tag listings
// and backlinks.
export function isUnlisted(data: QuartzPluginData): boolean {
  const flag = data.frontmatter?.unlisted
  return flag === true || flag === "true"
}
