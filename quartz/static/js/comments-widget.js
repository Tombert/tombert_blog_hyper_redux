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

    // Ensure Turnstile renders for dynamically-inserted widget
    const ensureCaptcha = () => {
      const el = container.querySelector('#cf-turnstile');
      const sitekey = container.dataset.turnstileSiteKey || '';
      if (!el || !sitekey) return;
      renderCaptcha(el, sitekey, function (token) {
        const inp = container.querySelector('input[name="turnstile_token"]');
        if (inp) inp.value = token;
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
        wrap.innerHTML = `
          <form class="reply-form" style="margin:8px 0 16px 0">
            <input type="hidden" name="parent_id" value="${btn.dataset.id}" />
            <input type="hidden" name="turnstile_token" />
            <input type="text" name="author_name" placeholder="Your name" maxlength="80" required style="display:block;margin:4px 0;" />
            <input type="email" name="email" placeholder="Email (optional)" style="display:block;margin:4px 0;" />
            <input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off" />
            <textarea name="content" rows="3" maxlength="2000" placeholder="Reply..." required style="display:block;margin:4px 0;"></textarea>
            <div class="cf-turnstile" data-sitekey="${sitekey}" style="margin:4px 0;"></div>
            <div>
              <button type="submit">Reply</button>
              <button type="button" class="cancel-reply" style="margin-left:8px;">Cancel</button>
            </div>
          </form>`;
        commentEl.appendChild(wrap);

        const cEl = wrap.querySelector('.cf-turnstile');
        renderCaptcha(cEl, sitekey, function (token) {
          const inp = wrap.querySelector('input[name="turnstile_token"]');
          if (inp) inp.value = token;
        });

        wrap.querySelector('.cancel-reply').addEventListener('click', () => {
          if (wrap.parentElement) wrap.parentElement.removeChild(wrap);
        });

        wrap.querySelector('form').addEventListener('submit', async (e) => {
          e.preventDefault();
          const payload = Object.fromEntries(new FormData(e.target).entries());
          const body = {
            thread: cfg.thread,
            parent_id: payload.parent_id || null,
            author_name: (payload.author_name || '').toString(),
            email: payload.email ? payload.email.toString() : null,
            content: (payload.content || '').toString(),
            website: payload.website ? payload.website.toString() : '',
            turnstile_token: payload.turnstile_token ? payload.turnstile_token.toString() : '',
            started_at: startedAt,
          };
          const res = await fetch(`${cfg.api}/comments`, {
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
          const data2 = await res.json();
          render(container, data2, cfg);
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
      render(container, data, { api, thread });
      startedAt = Date.now();
      // Reset Turnstile (if available)
      const el = container.querySelector('#cf-turnstile');
      if (window.turnstile && el) {
        try { window.turnstile.reset(el); } catch {}
        // re-render to get a fresh token
        try {
          const sitekey = container.dataset.turnstileSiteKey || '';
          window.turnstile.render(el, {
            sitekey,
            callback: function (token) {
              const inp = container.querySelector('input[name="turnstile_token"]');
              if (inp) inp.value = token;
            }
          });
        } catch {}
      }
    });

    refresh();
  }

  window.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('#comments');
    if (container) init(container);
  });
})();
