// Shared helpers used across pages: header/nav rendering, formatting, post card renderer.

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function initials(username) {
  return (username || '?').slice(0, 2).toUpperCase();
}

function timeAgo(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  const ranges = [
    ['y', 31536000],
    ['mo', 2592000],
    ['d', 86400],
    ['h', 3600],
    ['m', 60],
  ];

  for (const [label, secondsInUnit] of ranges) {
    const value = Math.floor(seconds / secondsInUnit);
    if (value >= 1) return `${value}${label} ago`;
  }
  return 'just now';
}

function avatarHtml(user, size = '') {
  const cls = size ? `avatar ${size}` : 'avatar';
  if (user && user.avatarUrl) {
    return `<div class="${cls}"><img src="${escapeHtml(user.avatarUrl)}" alt="${escapeHtml(user.username)}"></div>`;
  }
  return `<div class="${cls}">${escapeHtml(initials(user && user.username))}</div>`;
}

// Renders the shared site header/nav. Call once per page inside a <div id="app-header"></div>.
function renderHeader() {
  const el = document.getElementById('app-header');
  if (!el) return;

  const loggedIn = Auth.isLoggedIn();
  const user = Auth.getUser();

  el.innerHTML = `
    <header class="app-header">
      <div class="container">
        <a class="brand" href="index.html">MiniSocial</a>
        <div class="nav-right">
          ${
            loggedIn
              ? `
            <a href="profile.html?user=${encodeURIComponent(user.username)}" title="Your profile">
              ${avatarHtml(user)}
            </a>
            <button class="btn-ghost" id="logout-btn">Log out</button>
          `
              : `
            <a class="btn-secondary btn" href="login.html">Log in</a>
            <a class="btn" href="register.html">Sign up</a>
          `
          }
        </div>
      </div>
    </header>
  `;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());
}

// Renders a single post card. `post` comes from the API; `currentUsername` (optional)
// lets us show the delete button for posts owned by the logged-in user.
function renderPostCard(post, { likedByMe = false } = {}) {
  const user = Auth.getUser();
  const isOwner = user && post.author && (post.author._id === user.id || post.author.id === user.id);

  return `
    <article class="post-card" data-post-id="${post._id}">
      <div class="post-header">
        <a href="profile.html?user=${encodeURIComponent(post.author.username)}">
          ${avatarHtml(post.author)}
        </a>
        <div class="meta">
          <a class="username" href="profile.html?user=${encodeURIComponent(post.author.username)}">
            ${escapeHtml(post.author.username)}
          </a>
          <span class="time">${timeAgo(post.createdAt)}</span>
        </div>
      </div>
      <a href="post.html?id=${post._id}" style="color:inherit;text-decoration:none;">
        <div class="post-content">${escapeHtml(post.content)}</div>
        ${post.imageUrl ? `<img class="post-image" src="${escapeHtml(post.imageUrl)}" alt="post image">` : ''}
      </a>
      <div class="post-actions">
        <button class="action-btn like-btn ${likedByMe ? 'liked' : ''}" data-post-id="${post._id}">
          ${likedByMe ? '♥' : '♡'} <span class="like-count">${post.likeCount || 0}</span>
        </button>
        <a class="action-btn" href="post.html?id=${post._id}">
          💬 <span>${post.commentCount || 0}</span>
        </a>
        ${isOwner ? `<button class="action-btn delete-post-btn" data-post-id="${post._id}">🗑 Delete</button>` : ''}
      </div>
    </article>
  `;
}

// Wires up like/unlike + delete handlers for all post cards currently in the DOM.
// `onDeleted(postId)` is called after a successful delete so the page can remove the card.
function wirePostCardEvents(onDeleted) {
  document.querySelectorAll('.like-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!Auth.isLoggedIn()) {
        window.location.href = 'login.html';
        return;
      }
      const postId = btn.dataset.postId;
      const countEl = btn.querySelector('.like-count');
      const wasLiked = btn.classList.contains('liked');

      btn.disabled = true;
      try {
        if (wasLiked) {
          await Api.unlike(postId);
          btn.classList.remove('liked');
          btn.innerHTML = `♡ <span class="like-count">${Math.max(0, parseInt(countEl.textContent, 10) - 1)}</span>`;
        } else {
          await Api.like(postId);
          btn.classList.add('liked');
          btn.innerHTML = `♥ <span class="like-count">${parseInt(countEl.textContent, 10) + 1}</span>`;
        }
      } catch (err) {
        alert(err.message);
      } finally {
        btn.disabled = false;
      }
    });
  });

  document.querySelectorAll('.delete-post-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this post?')) return;
      const postId = btn.dataset.postId;
      try {
        await Api.deletePost(postId);
        if (onDeleted) onDeleted(postId);
      } catch (err) {
        alert(err.message);
      }
    });
  });
}
