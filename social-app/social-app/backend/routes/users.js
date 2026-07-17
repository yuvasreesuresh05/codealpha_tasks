const express = require('express');
const {
  getProfile,
  updateMe,
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} = require('../controllers/userController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/:username', optionalAuth, getProfile);
router.put('/me', requireAuth, updateMe);
router.post('/:id/follow', requireAuth, followUser);
router.delete('/:id/follow', requireAuth, unfollowUser);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);

module.exports = router;
