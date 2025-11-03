import mongoose from 'mongoose';

const portfolioCategorySchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Portfolio category name is required'],
    trim: true,
    maxlength: [100, 'Portfolio category name cannot be more than 100 characters']
  },
  parentId: {
    type: Number,
    ref: 'PortfolioCategory',
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
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
portfolioCategorySchema.index({ id: 1 });
portfolioCategorySchema.index({ name: 1 });
portfolioCategorySchema.index({ parentId: 1 });
portfolioCategorySchema.index({ order: 1 });
portfolioCategorySchema.index({ createdAt: -1 });

// Virtual for portfolios count
portfolioCategorySchema.virtual('portfoliosCount', {
  ref: 'Portfolio',
  localField: 'id',
  foreignField: 'categoryId',
  count: true,
  match: { isActive: true }
});

// Virtual for parent category
portfolioCategorySchema.virtual('parent', {
  ref: 'PortfolioCategory',
  localField: 'parentId',
  foreignField: 'id',
  justOne: true
});

// Virtual for subcategories
portfolioCategorySchema.virtual('subcategories', {
  ref: 'PortfolioCategory',
  localField: 'id',
  foreignField: 'parentId',
  match: { isActive: true }
});

// Instance methods
portfolioCategorySchema.methods.updateOrder = function(order) {
  this.order = order;
  return this.save();
};

// Static methods
portfolioCategorySchema.statics.findMainCategories = function() {
  return this.find({ 
    parentId: null,
    isActive: true
  }).sort({ order: 1, name: 1 });
};

portfolioCategorySchema.statics.findSubcategories = function(parentId) {
  return this.find({ parentId, isActive: true }).sort({ order: 1, name: 1 });
};

portfolioCategorySchema.statics.findWithPortfoliosCount = function() {
  return this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $lookup: {
        from: 'portfolios',
        localField: 'id',
        foreignField: 'categoryId',
        as: 'portfolios'
      }
    },
    {
      $addFields: {
        portfoliosCount: { $size: '$portfolios' }
      }
    },
    {
      $project: {
        portfolios: 0
      }
    },
    {
      $sort: { order: 1, name: 1 }
    }
  ]);
};

portfolioCategorySchema.statics.searchByName = function(searchText) {
  return this.find({
    name: { $regex: searchText, $options: 'i' },
    isActive: true
  }).sort({ name: 1 });
};

// Pre-save middleware to generate ID
portfolioCategorySchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastCategory = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastCategory ? lastCategory.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});



const PortfolioCategory = mongoose.model('PortfolioCategory', portfolioCategorySchema);

export default PortfolioCategory;