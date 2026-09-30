const RUFFLE_SRC = "https://unpkg.com/@ruffle-rs/ruffle@0.6.0/ruffle.js"

let ruffleLoaded: Promise<void> | undefined

function loadRuffle(): Promise<void> {
  ruffleLoaded ??= new Promise((resolve, reject) => {
    const w = window as any
    w.RufflePlayer = w.RufflePlayer || {}
    // we create players ourselves; don't have Ruffle scan the page for <object>/<embed>
    w.RufflePlayer.config = { polyfills: false }

    const s = document.createElement("script")
    s.src = RUFFLE_SRC
    // keep the SPA router from stripping it out of <head> on navigation
    s.setAttribute("spa-preserve", "")
    s.onload = () => resolve()
    s.onerror = () => {
      ruffleLoaded = undefined
      s.remove()
      reject(new Error(`failed to load ${RUFFLE_SRC}`))
    }
    document.head.appendChild(s)
  })
  return ruffleLoaded
}

document.addEventListener("nav", async () => {
  const containers = document.querySelectorAll<HTMLElement>(".flash-embed")
  if (containers.length === 0) return

  try {
    await loadRuffle()
  } catch {
    containers.forEach((c) => (c.textContent = "Couldn't load the Flash player (Ruffle)."))
    return
  }

  const ruffle = (window as any).RufflePlayer.newest()
  for (const container of containers) {
    // the reader may have navigated away while Ruffle was downloading
    if (!container.isConnected) continue

    const player = ruffle.createPlayer()
    player.addEventListener("loadedmetadata", () => {
      const { width, height } = player.ruffle().metadata
      if (width && height) container.style.aspectRatio = `${width} / ${height}`
    })
    // Ruffle tears the player down itself when it's removed from the DOM
    container.replaceChildren(player)
    player.ruffle().load(container.dataset.swf)
  }
})
