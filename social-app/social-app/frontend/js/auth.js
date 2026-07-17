// Handles token/session storage and the current logged-in user.
const Auth = {
  TOKEN_KEY: 'social_app_token',
  USER_KEY: 'social_app_user',

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(this.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  setSession(token, user) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  // Redirect to login if not authenticated. Call at the top of protected pages.
  requireLogin() {
    if (!this.isLoggedIn()) {
      window.location.href = 'login.html';
    }
  },

  logout() {
    this.clearSession();
    window.location.href = 'login.html';
  },
};
