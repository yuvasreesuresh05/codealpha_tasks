// Logic for post.html (single post + comment thread)
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function loadPost() {
  const postId = getQueryParam('id');
  const container = document.getElementById('post-container');

  if (!postId) {
    container.innerHTML = `<div class="error-msg">No post specified.</div>`;
    return;
  }

  try {
    const { post } = await Api.getPost(postId);
    container.innerHTML = renderPostCard(post);
    wirePostCardEvents(() => {
      window.location.href = 'index.html';
    });

    await loadComments(postId);
  } catch (err) {
    container.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function loadComments(postId) {
  const listEl = document.getElementById('comments-list');
  try {
    const { comments } = await Api.getComments(postId);
    const currentUser = Auth.getUser();

    if (comments.length === 0) {
      listEl.innerHTML = `<div class="empty-state">No comments yet.</div>`;
      return;
    }

    listEl.innerHTML = comments
      .map((c) => {
        const isOwner = currentUser && (c.author._id === currentUser.id || c.author.id === currentUser.id);
        return `
          <div class="comment" data-comment-id="${c._id}">
            ${avatarHtml(c.author)}
            <div class="bubble">
              <div class="username">${escapeHtml(c.author.username)}
                <span class="time">· ${timeAgo(c.createdAt)}</span>
              </div>
              <div class="content">${escapeHtml(c.content)}</div>
              ${isOwner ? `<button class="btn-ghost delete-comment-btn" data-comment-id="${c._id}">Delete</button>` : ''}
            </div>
          </div>
        `;
      })
      .join('');

    listEl.querySelectorAll('.delete-comment-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this comment?')) return;
        try {
          await Api.deleteComment(btn.dataset.commentId);
          document.querySelector(`.comment[data-comment-id="${btn.dataset.commentId}"]`).remove();
        } catch (err) {
          alert(err.message);
        }
      });
    });
  } catch (err) {
    listEl.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  const postId = getQueryParam('id');
  loadPost();

  const form = document.getElementById('comment-form');
  if (Auth.isLoggedIn()) {
    form.style.display = 'flex';
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const textarea = document.getElementById('comment-text');
      const content = textarea.value.trim();
      if (!content) return;

      const submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      try {
        await Api.addComment(postId, content);
        textarea.value = '';
        await loadComments(postId);
      } catch (err) {
        alert(err.message);
      } finally {
        submitBtn.disabled = false;
      }
    });
  } else {
    form.style.display = 'none';
  }
});
