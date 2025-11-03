import mongoose from 'mongoose';

// Main Testimonial Schema
const testimonialSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  position: {
    type: String,
    trim: true,
    maxlength: [100, 'Position cannot be more than 100 characters'],
    default: ''
  },
  image: {
    type: String,
    trim: true,
    default: ''
  },
  testimonial: {
    type: String,
    required: [true, 'Testimonial content is required'],
    trim: true,
    maxlength: [1000, 'Testimonial cannot be more than 1000 characters']
  },
  rating: {
    type: Number,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5'],
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
testimonialSchema.index({ id: 1 });
testimonialSchema.index({ createdAt: -1 });
testimonialSchema.index({ name: 'text', testimonial: 'text' });
testimonialSchema.index({ isActive: 1 });
testimonialSchema.index({ featured: 1 });
testimonialSchema.index({ rating: -1 });

// Static methods
testimonialSchema.statics.searchByText = function(searchText) {
  return this.find({
    $text: { $search: searchText },
    isActive: true
  }).sort({ score: { $meta: 'textScore' }, createdAt: -1 });
};

testimonialSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

testimonialSchema.statics.findFeatured = function() {
  return this.find({ featured: true, isActive: true }).sort({ createdAt: -1 });
};

testimonialSchema.statics.findByRating = function(minRating = 1) {
  return this.find({ rating: { $gte: minRating }, isActive: true }).sort({ rating: -1, createdAt: -1 });
};

// Pre-save middleware to auto-generate ID
testimonialSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastTestimonial = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastTestimonial ? lastTestimonial.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Testimonial = mongoose.model('Testimonial', testimonialSchema);

export default Testimonial;