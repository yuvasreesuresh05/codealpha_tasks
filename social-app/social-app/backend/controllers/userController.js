const User = require('../models/User');
const Follow = require('../models/Follow');

async function getProfile(req, res, next) {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let isFollowing = false;
    if (req.userId) {
      const rel = await Follow.findOne({ follower: req.userId, following: user._id });
      isFollowing = !!rel;
    }

    res.json({ user: user.toPublicJSON(), isFollowing });
  } catch (err) {
    next(err);
  }
}

async function updateMe(req, res, next) {
  try {
    const { bio, avatarUrl } = req.body;
    const update = {};
    if (bio !== undefined) update.bio = bio;
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl;

    const user = await User.findByIdAndUpdate(req.userId, update, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

async function followUser(req, res, next) {
  try {
    const targetId = req.params.id;

    if (targetId === req.userId) {
      return res.status(400).json({ error: 'You cannot follow yourself' });
    }

    const target = await User.findById(targetId);
    if (!target) return res.status(404).json({ error: 'User not found' });

    await Follow.create({ follower: req.userId, following: targetId });

    await User.findByIdAndUpdate(req.userId, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(targetId, { $inc: { followerCount: 1 } });

    res.status(201).json({ message: 'Followed' });
  } catch (err) {
    next(err);
  }
}

async function unfollowUser(req, res, next) {
  try {
    const targetId = req.params.id;

    const rel = await Follow.findOneAndDelete({ follower: req.userId, following: targetId });
    if (!rel) return res.status(404).json({ error: 'Not following this user' });

    await User.findByIdAndUpdate(req.userId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(targetId, { $inc: { followerCount: -1 } });

    res.json({ message: 'Unfollowed' });
  } catch (err) {
    next(err);
  }
}

async function getFollowers(req, res, next) {
  try {
    const rels = await Follow.find({ following: req.params.id }).populate('follower', 'username avatarUrl bio');
    res.json({ followers: rels.map((r) => r.follower) });
  } catch (err) {
    next(err);
  }
}

async function getFollowing(req, res, next) {
  try {
    const rels = await Follow.find({ follower: req.params.id }).populate('following', 'username avatarUrl bio');
    res.json({ following: rels.map((r) => r.following) });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateMe, followUser, unfollowUser, getFollowers, getFollowing };
