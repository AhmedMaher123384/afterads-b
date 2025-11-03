import mongoose from 'mongoose';

const staticPageSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Page title is required'],
    trim: true,
    maxlength: [200, 'Page title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    required: [true, 'Page slug is required'],
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [100, 'Page slug cannot be more than 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Page content is required'],
    trim: true
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot be more than 160 characters']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  showInFooter: {
    type: Boolean,
    default: false
  },
  imageUrl: {
    type: String,
    trim: true,
    default: ''
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'SEO title cannot be more than 60 characters']
  },
  seoKeywords: {
    type: [String],
    default: []
  },
  viewCount: {
    type: Number,
    default: 0
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
staticPageSchema.index({ id: 1 });
staticPageSchema.index({ slug: 1 });
staticPageSchema.index({ isActive: 1 });
staticPageSchema.index({ showInFooter: 1 });
staticPageSchema.index({ sortOrder: 1 });
staticPageSchema.index({ createdAt: -1 });
staticPageSchema.index({ title: 'text', content: 'text' });

// Static methods
staticPageSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

staticPageSchema.statics.findActivePages = function() {
  return this.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 });
};

staticPageSchema.statics.findFooterPages = function() {
  return this.find({ isActive: true, showInFooter: true }).sort({ sortOrder: 1, title: 1 });
};

staticPageSchema.statics.searchByText = function(searchText) {
  return this.find({
    $text: { $search: searchText },
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });
};

// Instance methods
staticPageSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Pre-save middleware to auto-generate slug
staticPageSchema.pre('save', async function(next) {
  if (!this.slug && this.title) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug already exists and generate unique one
    while (await this.constructor.findOne({ slug: slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Pre-save middleware to auto-generate ID
staticPageSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastPage = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastPage ? lastPage.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const StaticPage = mongoose.model('StaticPage', staticPageSchema);

export default StaticPage;