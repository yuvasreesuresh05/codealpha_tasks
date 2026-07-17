// Logic for profile.html
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

async function loadProfile() {
  const username = getQueryParam('user');
  const container = document.getElementById('profile-container');

  if (!username) {
    container.innerHTML = `<div class="error-msg">No user specified.</div>`;
    return;
  }

  try {
    const { user, isFollowing } = await Api.getProfile(username);
    const currentUser = Auth.getUser();
    const isMe = currentUser && currentUser.username === user.username;

    container.innerHTML = `
      <div class="card">
        <div class="profile-header">
          ${avatarHtml(user, 'lg')}
          <div>
            <h2 style="margin:0 0 4px 0;">${escapeHtml(user.username)}</h2>
            ${
              isMe
                ? `<a class="btn btn-secondary" href="edit-profile.html">Edit profile</a>`
                : Auth.isLoggedIn()
                ? `<button id="follow-btn" class="${isFollowing ? 'btn-secondary' : 'btn'}">${
                    isFollowing ? 'Unfollow' : 'Follow'
                  }</button>`
                : ''
            }
          </div>
        </div>
        ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ''}
        <div class="profile-stats">
          <span><strong id="follower-count">${user.followerCount}</strong> followers</span>
          <span><strong>${user.followingCount}</strong> following</span>
        </div>
      </div>

      <h3>Posts</h3>
      <div id="profile-posts"></div>
    `;

    if (!isMe && Auth.isLoggedIn()) {
      const followBtn = document.getElementById('follow-btn');
      let following = isFollowing;
      followBtn.addEventListener('click', async () => {
        followBtn.disabled = true;
        try {
          if (following) {
            await Api.unfollow(user.id);
            following = false;
          } else {
            await Api.follow(user.id);
            following = true;
          }
          followBtn.textContent = following ? 'Unfollow' : 'Follow';
          followBtn.className = following ? 'btn-secondary' : 'btn';
          const countEl = document.getElementById('follower-count');
          countEl.textContent = parseInt(countEl.textContent, 10) + (following ? 1 : -1);
        } catch (err) {
          alert(err.message);
        } finally {
          followBtn.disabled = false;
        }
      });
    }

    await loadProfilePosts(user.id);
  } catch (err) {
    container.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

async function loadProfilePosts(userId) {
  const postsEl = document.getElementById('profile-posts');
  try {
    // Reuse the global feed endpoint and filter client-side for simplicity in this basic version.
    const data = await Api.getGlobalFeed(1);
    const userPosts = data.posts.filter((p) => (p.author._id || p.author.id) === userId);

    if (userPosts.length === 0) {
      postsEl.innerHTML = `<div class="empty-state">No posts yet.</div>`;
      return;
    }

    postsEl.innerHTML = userPosts.map((p) => renderPostCard(p)).join('');
    wirePostCardEvents((postId) => {
      const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
      if (card) card.remove();
    });
  } catch (err) {
    postsEl.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  loadProfile();
});
