const Comment = require('../models/Comment');
const Post = require('../models/Post');

async function getComments(req, res, next) {
  try {
    const comments = await Comment.find({ post: req.params.id })
      .sort({ createdAt: 1 })
      .populate('author', 'username avatarUrl');
    res.json({ comments });
  } catch (err) {
    next(err);
  }
}

async function addComment(req, res, next) {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'content is required' });
    }
    if (content.length > 300) {
      return res.status(400).json({ error: 'content must be 300 characters or fewer' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = await Comment.create({
      post: post._id,
      author: req.userId,
      content: content.trim(),
    });
    await Post.findByIdAndUpdate(post._id, { $inc: { commentCount: 1 } });

    const populated = await comment.populate('author', 'username avatarUrl');
    res.status(201).json({ comment: populated });
  } catch (err) {
    next(err);
  }
}

async function deleteComment(req, res, next) {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ error: 'Comment not found' });
    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not allowed to delete this comment' });
    }

    await comment.deleteOne();
    await Post.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ message: 'Comment deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { getComments, addComment, deleteComment };
