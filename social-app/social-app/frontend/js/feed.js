// Logic for index.html (the feed page).
let currentTab = 'global'; // 'global' | 'following'
let currentPage = 1;
let loading = false;

async function loadFeed(reset = true) {
  if (loading) return;
  loading = true;

  if (reset) {
    currentPage = 1;
    document.getElementById('feed-list').innerHTML = '';
  }

  const listEl = document.getElementById('feed-list');
  const loadMoreBtn = document.getElementById('load-more-btn');

  try {
    const data =
      currentTab === 'following' ? await Api.getFollowingFeed(currentPage) : await Api.getGlobalFeed(currentPage);

    if (reset && data.posts.length === 0) {
      listEl.innerHTML = `<div class="empty-state">
        ${currentTab === 'following' ? "No posts yet from people you follow. Try the global feed!" : "No posts yet. Be the first to share something!"}
      </div>`;
    } else {
      listEl.insertAdjacentHTML('beforeend', data.posts.map((p) => renderPostCard(p)).join(''));
      wirePostCardEvents((postId) => {
        const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
        if (card) card.remove();
      });
    }

    loadMoreBtn.style.display = data.posts.length === data.limit ? 'block' : 'none';
  } catch (err) {
    listEl.innerHTML = `<div class="error-msg">${escapeHtml(err.message)}</div>`;
  } finally {
    loading = false;
  }
}

function setTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.feed-toggle button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  loadFeed(true);
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeader();

  const globalTab = document.getElementById('tab-global');
  const followingTab = document.getElementById('tab-following');
  globalTab.addEventListener('click', () => setTab('global'));
  followingTab.addEventListener('click', () => setTab('following'));

  if (!Auth.isLoggedIn()) {
    followingTab.disabled = true;
    followingTab.title = 'Log in to see this feed';
  }

  const composer = document.getElementById('composer');
  if (Auth.isLoggedIn()) {
    composer.style.display = 'block';
    const textarea = document.getElementById('composer-text');
    const charCount = document.getElementById('char-count');
    const postBtn = document.getElementById('composer-submit');

    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      charCount.textContent = `${len}/500`;
      charCount.classList.toggle('over', len > 500);
      postBtn.disabled = len === 0 || len > 500;
    });

    postBtn.addEventListener('click', async () => {
      const content = textarea.value.trim();
      if (!content) return;
      postBtn.disabled = true;
      try {
        await Api.createPost({ content });
        textarea.value = '';
        charCount.textContent = '0/500';
        setTab(currentTab === 'following' ? 'following' : 'global');
      } catch (err) {
        alert(err.message);
      } finally {
        postBtn.disabled = false;
      }
    });
  } else {
    composer.style.display = 'none';
  }

  document.getElementById('load-more-btn').addEventListener('click', () => {
    currentPage += 1;
    loadFeed(false);
  });

  loadFeed(true);
});
