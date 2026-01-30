/* Minimal comments widget for the Cloudflare Worker API
   Usage in your page template:
   <div id="comments-widget" data-thread="/path-or-slug" data-api="https://comments.example.com"></div>
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
    const authorAttr = escapeHTML(c.author_name);
    const cls = c.depth === 0 ? 'cmt root' : 'cmt reply';
    const trip = c.tripcode ? `<span class=\"trip\">!!${escapeHTML(c.tripcode)}</span>` : '';
    return `
      <div class="${cls}" data-id="${c.id}" data-depth="${c.depth}" data-author="${authorAttr}" style="margin-left:${c.depth * 16}px">
        <div class="meta"><strong>${escapeHTML(c.author_name)}</strong> ${trip} • ${new Date(c.created_at).toLocaleString()}</div>
        <div class="body">${escapeHTML(c.content)}</div>
        <button class="reply-btn" data-id="${c.id}">Reply</button>
        ${childHtml}
      </div>`;
  }

  function renderCaptcha(el, sitekey, onToken) {
    const tryRender = () => {
      if (!el || !sitekey) return;
      if (window.turnstile && typeof window.turnstile.render === 'function') {
        try {
          window.turnstile.render(el, {
            sitekey,
            callback: (token) => {
              try { onToken && onToken(token); } catch {}
            }
          });
          return;
        } catch {}
      }
      setTimeout(tryRender, 300);
    };
    tryRender();
  }

  function render(container, data, cfg) {
    const roots = buildTree(data.comments);
    const list = roots.map(renderComment).join("");
    const form = `
      <div class="new-comment">
        <h4>Leave a comment</h4>
        <form id="comment-form">
          <input type="text" name="author_name" placeholder="Your name" maxlength="80" required />
          <input type="password" name="trip" placeholder="Trip password (optional)" />
          
          <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
          <textarea name="content" rows="4" maxlength="2000" placeholder="Be nice. This is a public comment.  Do not share any information that you do not want to be publicly available." required></textarea>
          <input type="hidden" name="parent_id" />
          <input type="hidden" name="turnstile_token" />
          <div class="cmt-turnstile" data-sitekey="${container.dataset.turnstileSiteKey || ''}"></div>
          <button type="submit">Post</button>
        </form>
      </div>`;
    container.innerHTML = `<div class="comments-list">${list || '<em>No comments yet.</em>'}</div>${form}`;
    const mainSubmitBtn = container.querySelector('#comment-form button[type="submit"]');
    if (mainSubmitBtn) mainSubmitBtn.disabled = true;

    // Ensure Turnstile renders for dynamically-inserted widget
    const ensureCaptcha = () => {
      const el = container.querySelector('.cmt-turnstile');
      const sitekey = container.dataset.turnstileSiteKey || '';
      if (!el || !sitekey) return;
      renderCaptcha(el, sitekey, function (token) {
        const inp = container.querySelector('input[name="turnstile_token"]');
        if (inp) inp.value = token;
        if (mainSubmitBtn) mainSubmitBtn.disabled = false;
      });
    };
    ensureCaptcha();

    // Reply buttons
    container.querySelectorAll('.reply-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const commentEl = btn.closest('.cmt');
        if (!commentEl) return;
        // Remove any existing inline reply
        const existing = container.querySelector('.inline-reply');
        if (existing && existing.parentElement) existing.parentElement.removeChild(existing);
        const wrap = document.createElement('div');
        wrap.className = 'inline-reply';
        const sitekey = container.dataset.turnstileSiteKey || '';
        const startedAt = Date.now();
        const replyingTo = commentEl.getAttribute('data-author') || '';
        wrap.innerHTML = `
          <form class="reply-form" style="margin:8px 0 16px 0">
            <div class="replying-to">Replying to <strong>${escapeHTML(replyingTo)}</strong></div>
            <input type="hidden" name="parent_id" value="${btn.dataset.id}" />
            <input type="hidden" name="turnstile_token" />
            <input type="text" name="author_name" placeholder="Your name" maxlength="80" required style="display:block;margin:4px 0;" />
            <input type="password" name="trip" placeholder="Trip password (optional)" style="display:block;margin:4px 0;" />
            
            <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
            <textarea name="content" rows="3" maxlength="2000" placeholder="Reply..." required style="display:block;margin:4px 0;"></textarea>
            <div class="cmt-turnstile" data-sitekey="${sitekey}" style="margin:4px 0;"></div>
            <div>
              <button type="submit">Reply</button>
              <button type="button" class="cancel-reply" style="margin-left:8px;">Cancel</button>
            </div>
          </form>`;
        commentEl.appendChild(wrap);

        const replySubmitBtn = wrap.querySelector('button[type="submit"]');
        if (replySubmitBtn) replySubmitBtn.disabled = true;
        const cEl = wrap.querySelector('.cmt-turnstile');
        renderCaptcha(cEl, sitekey, function (token) {
          const inp = wrap.querySelector('input[name="turnstile_token"]');
          if (inp) inp.value = token;
          if (replySubmitBtn) replySubmitBtn.disabled = false;
        });

        wrap.querySelector('.cancel-reply').addEventListener('click', () => {
          if (wrap.parentElement) wrap.parentElement.removeChild(wrap);
        });

        wrap.querySelector('form').addEventListener('submit', async (e) => {
          e.preventDefault();
        const payload = Object.fromEntries(new FormData(e.currentTarget).entries());
        const body = {
          thread: cfg.thread,
          parent_id: payload.parent_id || null,
          author_name: (payload.author_name || '').toString(),
          trip: payload.trip ? payload.trip.toString() : null,
          content: (payload.content || '').toString(),
          website: payload.website ? payload.website.toString() : '',
          turnstile_token: payload.turnstile_token ? payload.turnstile_token.toString() : '',
          started_at: startedAt,
        };
          const submitBtn = e.currentTarget.querySelector('button[type="submit"]');
          if (submitBtn) submitBtn.disabled = true;
          const res = await fetch(`${cfg.api}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            credentials: 'omit'
          });
          if (!res.ok) {
            const t = await res.text();
            alert(`Failed to post: ${res.status} ${t}`);
            try {
              const data = await fetchJSON(`${cfg.api}/comments?thread=${encodeURIComponent(cfg.thread)}`);
              render(container, data, cfg);
            } catch {}
            if (submitBtn) submitBtn.disabled = false;
            return;
          }
          const data2 = await res.json();
          render(container, data2, cfg);
          if (submitBtn) submitBtn.disabled = false;
        });
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
    try { container.innerHTML = '<div class="comments-loading">Loading comments…</div>'; } catch {}

    // Expose Turnstile callback to window
    window.__cmtTurnstileCb = function(token) {
      const el = container.querySelector('input[name="turnstile_token"]');
      if (el) el.value = token;
    };

    function refresh() {
      fetchJSON(`${api}/comments?thread=${encodeURIComponent(thread)}`)
        .then(data => render(container, data, { api, thread }))
        .catch(err => { container.innerHTML = `<div class="error">Error: ${err.message}</div>`; });
    }

    if (container.dataset.cmtBound !== '1') {
    container.addEventListener('submit', async (e) => {
      const form = e.target.closest('#comment-form');
      if (!form) return;
      e.preventDefault();
      const payload = Object.fromEntries(new FormData(form).entries());
      const body = {
        thread,
        parent_id: payload.parent_id || null,
        author_name: (payload.author_name || '').toString(),
        trip: payload.trip ? payload.trip.toString() : null,
        content: (payload.content || '').toString(),
        website: payload.website ? payload.website.toString() : '',
        turnstile_token: payload.turnstile_token ? payload.turnstile_token.toString() : '',
        started_at: startedAt,
      };
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      const res = await fetch(`${api}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'omit'
      });
      if (!res.ok) {
        const t = await res.text();
        alert(`Failed to post: ${res.status} ${t}`);
        try { refresh(); } catch {}
        if (submitBtn) submitBtn.disabled = false;
        return;
      }
      const data = await res.json();
      render(container, data, { api, thread });
      startedAt = Date.now();
      if (submitBtn) submitBtn.disabled = false;
    });
    container.dataset.cmtBound = '1';
    }

    refresh();
  }

  window.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('#comments-widget');
    if (container) init(container);
  });

  // Expose init for SPA navigation re-runs
  try { window.__cmtInit = init; } catch {}
})();
