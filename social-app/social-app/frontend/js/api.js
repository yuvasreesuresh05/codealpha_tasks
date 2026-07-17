// Thin wrapper around fetch() for talking to the backend API.
const API_BASE = '/api';

async function apiRequest(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = Auth.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // No JSON body (e.g. some error responses)
  }

  if (!res.ok) {
    const message = (data && data.error) || `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data;
}

const Api = {
  // Auth
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: payload }),
  me: () => apiRequest('/auth/me', { auth: true }),

  // Users
  getProfile: (username) => apiRequest(`/users/${encodeURIComponent(username)}`, { auth: true }),
  updateMe: (payload) => apiRequest('/users/me', { method: 'PUT', body: payload, auth: true }),
  follow: (id) => apiRequest(`/users/${id}/follow`, { method: 'POST', auth: true }),
  unfollow: (id) => apiRequest(`/users/${id}/follow`, { method: 'DELETE', auth: true }),
  getFollowers: (id) => apiRequest(`/users/${id}/followers`),
  getFollowing: (id) => apiRequest(`/users/${id}/following`),

  // Posts
  getGlobalFeed: (page = 1) => apiRequest(`/posts?page=${page}&limit=10`),
  getFollowingFeed: (page = 1) => apiRequest(`/posts/feed?page=${page}&limit=10`, { auth: true }),
  getPost: (id) => apiRequest(`/posts/${id}`),
  createPost: (payload) => apiRequest('/posts', { method: 'POST', body: payload, auth: true }),
  deletePost: (id) => apiRequest(`/posts/${id}`, { method: 'DELETE', auth: true }),

  // Comments
  getComments: (postId) => apiRequest(`/posts/${postId}/comments`),
  addComment: (postId, content) =>
    apiRequest(`/posts/${postId}/comments`, { method: 'POST', body: { content }, auth: true }),
  deleteComment: (commentId) => apiRequest(`/comments/${commentId}`, { method: 'DELETE', auth: true }),

  // Likes
  like: (postId) => apiRequest(`/posts/${postId}/like`, { method: 'POST', auth: true }),
  unlike: (postId) => apiRequest(`/posts/${postId}/like`, { method: 'DELETE', auth: true }),
  getLikes: (postId) => apiRequest(`/posts/${postId}/likes`),
};
