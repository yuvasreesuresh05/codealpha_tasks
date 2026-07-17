const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 500 },
    imageUrl: { type: String, default: '' },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

postSchema.index({ author: 1, createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
