import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  productId: {
    type: Number,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  userName: {
    type: String,
    required: true,
    maxlength: 100
  },
  userEmail: {
    type: String,
    required: true,
    maxlength: 255
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 5
  },

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Auto-increment id field
commentSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastComment = await this.constructor.findOne({}, {}, { sort: { 'id': -1 } });
    this.id = lastComment ? lastComment.id + 1 : 1;
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Comment', commentSchema);