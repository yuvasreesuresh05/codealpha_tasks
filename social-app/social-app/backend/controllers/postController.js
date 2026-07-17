const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Like = require('../models/Like');
const Follow = require('../models/Follow');

function paginationParams(req) {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

// GET /api/posts - global feed, paginated
async function getGlobalFeed(req, res, next) {
  try {
    const { page, limit, skip } = paginationParams(req);
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatarUrl');

    res.json({ posts, page, limit });
  } catch (err) {
    next(err);
  }
}

// GET /api/posts/feed - posts from followed users + self
async function getFollowingFeed(req, res, next) {
  try {
    const { page, limit, skip } = paginationParams(req);

    const rels = await Follow.find({ follower: req.userId }).select('following');
    const ids = rels.map((r) => r.following);
    ids.push(req.userId);

    const posts = await Post.find({ author: { $in: ids } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username avatarUrl');

    res.json({ posts, page, limit });
  } catch (err) {
    next(err);
  }
}

async function getPost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id).populate('author', 'username avatarUrl');
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (err) {
    next(err);
  }
}

async function createPost(req, res, next) {
  try {
    const { content, imageUrl } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }
    if (content.length > 500) {
      return res.status(400).json({ error: 'content must be 500 characters or fewer' });
    }

    const post = await Post.create({
      author: req.userId,
      content: content.trim(),
      imageUrl: imageUrl || '',
    });
    const populated = await post.populate('author', 'username avatarUrl');

    res.status(201).json({ post: populated });
  } catch (err) {
    next(err);
  }
}

async function deletePost(req, res, next) {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not allowed to delete this post' });
    }

    // Cascade cleanup: remove comments and likes belonging to this post
    await Comment.deleteMany({ post: post._id });
    await Like.deleteMany({ post: post._id });
    await post.deleteOne();

    res.json({ message: 'Post deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getGlobalFeed, getFollowingFeed, getPost, createPost, deletePost };
