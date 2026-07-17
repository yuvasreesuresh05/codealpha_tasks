document.addEventListener('DOMContentLoaded', () => {
  renderHeader();
  if (Auth.isLoggedIn()) {
    window.location.href = 'index.html';
    return;
  }

  const form = document.getElementById('register-form');
  const errorEl = document.getElementById('form-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.style.display = 'none';

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    try {
      const { token, user } = await Api.register({ username, email, password });
      Auth.setSession(token, user);
      window.location.href = 'index.html';
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
    }
  });
});
