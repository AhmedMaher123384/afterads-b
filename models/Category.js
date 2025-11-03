import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    maxlength: [100, 'Category name cannot be more than 100 characters']
  },
  name_ar: {
    type: String,
    trim: true,
    maxlength: [100, 'Arabic category name cannot be more than 100 characters'],
    default: ''
  },
  name_en: {
    type: String,
    trim: true,
    maxlength: [100, 'English category name cannot be more than 100 characters'],
    default: ''
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Category description cannot be more than 500 characters']
  },
  description_ar: {
    type: String,
    trim: true,
    maxlength: [500, 'Arabic category description cannot be more than 500 characters'],
    default: ''
  },
  description_en: {
    type: String,
    trim: true,
    maxlength: [500, 'English category description cannot be more than 500 characters'],
    default: ''
  },
  image: {
    type: String,
    trim: true,
    default: ''
  },
  categoryType: {
    type: String,
    enum: ['regular', 'themes'],
    default: 'regular',
    required: [true, 'Category type is required']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  parentId: {
    type: Number,
    default: null
  },
  order: {
    type: Number,
    default: 0
  },
  seoTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'SEO title cannot be more than 60 characters']
  },
  seoTitle_ar: {
    type: String,
    trim: true,
    maxlength: [60, 'Arabic SEO title cannot be more than 60 characters'],
    default: ''
  },
  seoTitle_en: {
    type: String,
    trim: true,
    maxlength: [60, 'English SEO title cannot be more than 60 characters'],
    default: ''
  },
  seoDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'SEO description cannot be more than 160 characters']
  },
  seoDescription_ar: {
    type: String,
    trim: true,
    maxlength: [160, 'Arabic SEO description cannot be more than 160 characters'],
    default: ''
  },
  seoDescription_en: {
    type: String,
    trim: true,
    maxlength: [160, 'English SEO description cannot be more than 160 characters'],
    default: ''
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ id: 1 });
categorySchema.index({ name: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ parentId: 1 });
categorySchema.index({ order: 1 });
categorySchema.index({ categoryType: 1 });

// Virtual fields
categorySchema.virtual('productsCount', {
  ref: 'Product',
  localField: 'id',
  foreignField: 'subcategoryId',
  count: true,
  match: { isActive: true }
});

categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: 'id',
  foreignField: 'parentId',
  match: { isActive: true }
});

// Static methods
categorySchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ order: 1, name: 1 });
};

categorySchema.statics.findMainCategories = function() {
  return this.find({ 
    isActive: true, 
    $or: [{ parentId: null }, { parentId: { $exists: false } }]
  }).sort({ order: 1, name: 1 });
};

categorySchema.statics.findSubcategories = function(parentId) {
  return this.find({ parentId, isActive: true }).sort({ order: 1, name: 1 });
};

categorySchema.statics.findByType = function(categoryType) {
  return this.find({ 
    categoryType,
    isActive: true 
  }).sort({ order: 1, name: 1 });
};

categorySchema.statics.findRegularCategories = function() {
  return this.find({ 
    categoryType: 'regular',
    isActive: true,
    $or: [{ parentId: null }, { parentId: { $exists: false } }]
  }).sort({ order: 1, name: 1 });
};

categorySchema.statics.findThemeCategories = function() {
  return this.find({ 
    categoryType: 'themes',
    isActive: true 
  }).sort({ order: 1, name: 1 });
};

// Auto-generate unique ID for new categories
categorySchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    const lastCategory = await this.constructor.findOne().sort({ id: -1 });
    this.id = lastCategory ? lastCategory.id + 1 : 1;
  }
  
  // Auto-generate SEO fields if not provided
  if (!this.seoTitle && this.name) {
    this.seoTitle = this.name.substring(0, 60);
  }
  
  if (!this.seoDescription && this.description) {
    this.seoDescription = this.description.substring(0, 160);
  }
  
  next();
});

const Category = mongoose.model('Category', categorySchema);

export default Category;