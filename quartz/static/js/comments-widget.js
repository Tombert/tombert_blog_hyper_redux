/* Minimal comments widget for the Cloudflare Worker API
   Usage in your page template:
   <div id="comments" data-thread="/path-or-slug" data-api="https://comments.example.com"></div>
   <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" defer></script>
   <script src="/path/to/widget.js" defer></script>
*/
(function () {
  function escapeHTML(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  function buildTree(flat) {
    const byId = new Map();
    flat.forEach(c => { c.children = []; byId.set(c.id, c); });
    const roots = [];
    flat.forEach(c => {
      if (c.parent_id && byId.has(c.parent_id)) byId.get(c.parent_id).children.push(c);
      else roots.push(c);
    });
    return roots;
  }

  function renderComment(c) {
    const childHtml = c.children.map(renderComment).join("");
    return `
      <div class="cmt" data-id="${c.id}" style="margin-left:${c.depth * 16}px">
        <div class="meta"><strong>${escapeHTML(c.author_name)}</strong> • ${new Date(c.created_at).toLocaleString()}</div>
        <div class="body">${escapeHTML(c.content)}</div>
        <button class="reply-btn" data-id="${c.id}">Reply</button>
        ${childHtml}
      </div>`;
  }

  function render(container, data) {
    const roots = buildTree(data.comments);
    const list = roots.map(renderComment).join("");
    const form = `
      <div class="new-comment">
        <h4>Leave a comment</h4>
        <form id="comment-form">
          <input type="text" name="author_name" placeholder="Your name" maxlength="80" required />
          <input type="email" name="email" placeholder="Email (optional)" />
          <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
          <textarea name="content" rows="4" maxlength="2000" placeholder="Be nice." required></textarea>
          <input type="hidden" name="parent_id" />
          <input type="hidden" name="turnstile_token" />
          <div id="cf-turnstile" class="cf-turnstile" data-sitekey="${container.dataset.turnstileSiteKey || ''}" data-callback="__cmtTurnstileCb"></div>
          <button type="submit">Post</button>
        </form>
      </div>`;
    container.innerHTML = `<div class="comments-list">${list || '<em>No comments yet.</em>'}</div>${form}`;

    // Reply buttons
    container.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelector('input[name="parent_id"]').value = btn.dataset.id;
        container.querySelector('textarea[name="content"]').focus();
      });
    });
  }

  async function fetchJSON(url) {
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new Error('Failed to fetch');
    return res.json();
  }

  function init(container) {
    const api = (container.dataset.api || 'http://localhost:8787').replace(/\/$/, '');
    const thread = container.dataset.thread || location.pathname;
    let startedAt = Date.now();

    // Expose Turnstile callback to window
    window.__cmtTurnstileCb = function(token) {
      const el = container.querySelector('input[name="turnstile_token"]');
      if (el) el.value = token;
    };

    function refresh() {
      fetchJSON(`${api}/comments?thread=${encodeURIComponent(thread)}`)
        .then(data => render(container, data))
        .catch(err => { container.innerHTML = `<div class="error">Error: ${err.message}</div>`; });
    }

    container.addEventListener('submit', async (e) => {
      const form = e.target.closest('#comment-form');
      if (!form) return;
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      const body = {
        thread,
        parent_id: payload.parent_id || null,
        author_name: (payload.author_name || '').toString(),
        email: payload.email ? payload.email.toString() : null,
        content: (payload.content || '').toString(),
        website: payload.website ? payload.website.toString() : '',
        turnstile_token: payload.turnstile_token ? payload.turnstile_token.toString() : '',
        started_at: startedAt,
      };
      const res = await fetch(`${api}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'omit'
      });
      if (!res.ok) {
        const t = await res.text();
        alert(`Failed to post: ${res.status} ${t}`);
        return;
      }
      const data = await res.json();
      render(container, data);
      startedAt = Date.now();
      // Reset Turnstile (if available)
      if (window.turnstile && container.querySelector('#cf-turnstile')) {
        try { window.turnstile.reset(container.querySelector('#cf-turnstile')); } catch {}
      }
    });

    refresh();
  }

  window.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('#comments');
    if (container) init(container);
  });
})();

