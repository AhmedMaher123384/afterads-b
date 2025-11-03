import mongoose from 'mongoose';

// Portfolio Schema
const portfolioSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Portfolio title is required'],
    trim: true,
    maxlength: [200, 'Portfolio title cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Portfolio description is required'],
    trim: true,
    maxlength: [2000, 'Portfolio description cannot be more than 2000 characters']
  },
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot be more than 300 characters'],
    default: ''
  },
  categoryId: {
    type: Number,
    required: [true, 'Portfolio category ID is required'],
    ref: 'PortfolioCategory'
  },
  projectUrl: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty string
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Project URL must be a valid URL starting with http:// or https://'
    }
  },
  demoUrl: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty string
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Demo URL must be a valid URL starting with http:// or https://'
    }
  },
  githubUrl: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty string
        return /^https?:\/\/(www\.)?github\.com\/.+/.test(v);
      },
      message: 'GitHub URL must be a valid GitHub repository URL'
    }
  },
  technologies: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 20;
      },
      message: 'Cannot have more than 20 technologies'
    }
  },
  client: {
    type: String,
    trim: true,
    maxlength: [100, 'Client name cannot be more than 100 characters'],
    default: ''
  },
  projectDate: {
    type: Date,
    default: Date.now
  },
  duration: {
    type: String,
    trim: true,
    maxlength: [50, 'Duration cannot be more than 50 characters'],
    default: ''
  },
  status: {
    type: String,
    enum: ['completed', 'in-progress', 'on-hold', 'cancelled'],
    default: 'completed',
    required: [true, 'Portfolio status is required']
  },
  featured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  mainImage: {
    type: String,
    trim: true,
    default: ''
  },
  images: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 10;
      },
      message: 'Cannot have more than 10 images'
    }
  },
  tags: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        return v.length <= 15;
      },
      message: 'Cannot have more than 15 tags'
    }
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'SEO title cannot be more than 60 characters']
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'SEO description cannot be more than 160 characters']
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot be more than 60 characters'],
    default: ''
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot be more than 160 characters'],
    default: ''
  },
  viewCount: {
    type: Number,
    default: 0,
    min: [0, 'View count cannot be negative']
  },
  likes: {
    type: Number,
    default: 0,
    min: [0, 'Likes count cannot be negative']
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
portfolioSchema.index({ id: 1 });
portfolioSchema.index({ categoryId: 1 });
portfolioSchema.index({ title: 'text', description: 'text' });
portfolioSchema.index({ status: 1 });
portfolioSchema.index({ isActive: 1 });
portfolioSchema.index({ featured: 1 });
portfolioSchema.index({ projectDate: -1 });
portfolioSchema.index({ createdAt: -1 });
portfolioSchema.index({ tags: 1 });
portfolioSchema.index({ technologies: 1 });

// Virtual for category population
portfolioSchema.virtual('category', {
  ref: 'PortfolioCategory',
  localField: 'categoryId',
  foreignField: 'id',
  justOne: true
});

// Instance methods
portfolioSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

portfolioSchema.methods.incrementLikes = function() {
  this.likes += 1;
  return this.save();
};

portfolioSchema.methods.decrementLikes = function() {
  if (this.likes > 0) {
    this.likes -= 1;
  }
  return this.save();
};

portfolioSchema.methods.setFeatured = function(featured) {
  this.featured = featured;
  return this.save();
};

portfolioSchema.methods.setActive = function(active) {
  this.isActive = active;
  return this.save();
};

// Static methods
portfolioSchema.statics.findByCategory = function(categoryId) {
  return this.find({ categoryId, isActive: true });
};

portfolioSchema.statics.findFeatured = function() {
  return this.find({ featured: true, isActive: true }).sort({ createdAt: -1 });
};

portfolioSchema.statics.findByStatus = function(status) {
  return this.find({ status, isActive: true }).sort({ projectDate: -1 });
};

portfolioSchema.statics.searchByText = function(searchText) {
  return this.find({
    $text: { $search: searchText },
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });
};

portfolioSchema.statics.findByTechnology = function(technology) {
  return this.find({ 
    technologies: { $in: [technology] },
    isActive: true 
  }).sort({ createdAt: -1 });
};

portfolioSchema.statics.findByTag = function(tag) {
  return this.find({ 
    tags: { $in: [tag] },
    isActive: true 
  }).sort({ createdAt: -1 });
};

portfolioSchema.statics.findRecent = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(limit);
};

portfolioSchema.statics.findPopular = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ viewCount: -1, likes: -1 })
    .limit(limit);
};

// Pre-save middleware to generate ID
portfolioSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastPortfolio = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastPortfolio ? lastPortfolio.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware for SEO fields
portfolioSchema.pre('save', function(next) {
  if (!this.seoTitle) {
    this.seoTitle = this.title;
  }
  if (!this.seoDescription) {
    this.seoDescription = this.shortDescription || this.description.substring(0, 160);
  }
  if (!this.metaTitle) {
    this.metaTitle = this.title;
  }
  if (!this.metaDescription) {
    this.metaDescription = this.shortDescription || this.description.substring(0, 160);
  }
  next();
});

const Portfolio = mongoose.model('Portfolio', portfolioSchema);

export default Portfolio;