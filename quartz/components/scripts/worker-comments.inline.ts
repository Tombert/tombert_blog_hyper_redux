// Re-initialize custom comments widget after Quartz SPA navigation
document.addEventListener("nav", () => {
  const existing = document.querySelector('#comments') as HTMLElement | null
  if (!existing) return

  // Replace the container with a fresh node to clear old state/listeners
  const fresh = existing.cloneNode(false) as HTMLElement
  fresh.innerHTML = '<div class="comments-loading">Loading comments…</div>'
  existing.replaceWith(fresh)

  // Ensure Turnstile API is present (loaded once globally)
  if (!document.querySelector('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]')) {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    s.defer = true
    document.head.appendChild(s)
  }

  const init = (window as any).__cmtInit
  if (typeof init === 'function') {
    try { init(fresh) } catch {}
  }
})
