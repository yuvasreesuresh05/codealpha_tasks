document.addEventListener('DOMContentLoaded', async () => {
  renderHeader();
  Auth.requireLogin();

  const form = document.getElementById('edit-profile-form');
  const errorEl = document.getElementById('form-error');
  const bioInput = document.getElementById('bio');
  const avatarInput = document.getElementById('avatarUrl');

  try {
    const { user } = await Api.me();
    bioInput.value = user.bio || '';
    avatarInput.value = user.avatarUrl || '';
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const { user } = await Api.updateMe({
        bio: bioInput.value.trim(),
        avatarUrl: avatarInput.value.trim(),
      });
      // Keep the cached session user in sync with the edited profile
      const current = Auth.getUser();
      Auth.setSession(Auth.getToken(), { ...current, ...user });
      window.location.href = `profile.html?user=${encodeURIComponent(user.username)}`;
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
    }
  });
});
