const sequence = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
].join()

let recent: string[] = []

// registered once; the listener lives on `document`, so it survives SPA navigation
document.addEventListener("keydown", (e: KeyboardEvent) => {
  // don't eat keystrokes meant for the search box or the comment form
  if (
    e.target instanceof Element &&
    e.target.closest("input, textarea, select, [contenteditable]")
  ) {
    return
  }

  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key
  recent = [...recent, key].slice(-10)
  if (recent.join() !== sequence) return
  recent = []

  const encoded = document.getElementById("konami")?.dataset.k
  if (!encoded) return

  const url = new URL("/" + atob(encoded), window.location.origin)
  if (url.pathname === window.location.pathname) return

  if (typeof window.spaNavigate === "function") {
    window.spaNavigate(url)
  } else {
    window.location.assign(url)
  }
})
