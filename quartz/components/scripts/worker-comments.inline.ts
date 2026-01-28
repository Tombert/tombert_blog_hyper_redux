// Re-initialize custom comments widget after Quartz SPA navigation
document.addEventListener("nav", () => {
  const container = document.querySelector('#comments') as HTMLElement | null
  if (!container) return

  // Ensure Turnstile API is present (loaded once globally)
  if (!document.querySelector('script[src*="challenges.cloudflare.com/turnstile/v0/api.js"]')) {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
    s.defer = true
    document.head.appendChild(s)
  }

  const init = (window as any).__cmtInit
  if (typeof init === 'function') {
    try { init(container) } catch {}
  }
})

