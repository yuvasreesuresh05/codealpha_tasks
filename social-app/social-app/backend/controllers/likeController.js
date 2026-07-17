const Like = require('../models/Like');
const Post = require('../models/Post');

async function likePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    await Like.create({ post: post._id, user: req.userId });
    await Post.findByIdAndUpdate(post._id, { $inc: { likeCount: 1 } });

    res.status(201).json({ message: 'Liked' });
  } catch (err) {
    next(err);
  }
}

async function unlikePost(req, res, next) {
  try {
    const like = await Like.findOneAndDelete({ post: req.params.id, user: req.userId });
    if (!like) return res.status(404).json({ error: 'Like not found' });

    await Post.findByIdAndUpdate(req.params.id, { $inc: { likeCount: -1 } });

    res.json({ message: 'Unliked' });
  } catch (err) {
    next(err);
  }
}

async function getLikes(req, res, next) {
  try {
    const likes = await Like.find({ post: req.params.id }).populate('user', 'username avatarUrl');
    res.json({ likes: likes.map((l) => l.user) });
  } catch (err) {
    next(err);
  }
}

module.exports = { likePost, unlikePost, getLikes };
