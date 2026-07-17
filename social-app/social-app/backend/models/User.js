const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    bio: { type: String, default: '', maxlength: 280 },
    avatarUrl: { type: String, default: '' },
    followerCount: { type: Number, default: 0 },
    followingCount: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

userSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    username: this.username,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    followerCount: this.followerCount,
    followingCount: this.followingCount,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
