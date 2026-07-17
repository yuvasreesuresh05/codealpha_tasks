const express = require('express');
const {
  getGlobalFeed,
  getFollowingFeed,
  getPost,
  createPost,
  deletePost,
} = require('../controllers/postController');
const { getComments, addComment } = require('../controllers/commentController');
const { likePost, unlikePost, getLikes } = require('../controllers/likeController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', getGlobalFeed);
router.get('/feed', requireAuth, getFollowingFeed);
router.get('/:id', getPost);
router.post('/', requireAuth, createPost);
router.delete('/:id', requireAuth, deletePost);

// Nested comment routes
router.get('/:id/comments', getComments);
router.post('/:id/comments', requireAuth, addComment);

// Nested like routes
router.post('/:id/like', requireAuth, likePost);
router.delete('/:id/like', requireAuth, unlikePost);
router.get('/:id/likes', getLikes);

module.exports = router;
