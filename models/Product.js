import mongoose from 'mongoose';



// Main Product Schema
const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  // Multilingual name fields
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [200, 'Product name cannot be more than 200 characters']
  },
  name_ar: {
    type: String,
    trim: true,
    maxlength: [200, 'Arabic product name cannot be more than 200 characters'],
    default: ''
  },
  name_en: {
    type: String,
    trim: true,
    maxlength: [200, 'English product name cannot be more than 200 characters'],
    default: ''
  },
  
  // Multilingual short description fields
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [300, 'Short description cannot be more than 300 characters'],
    default: ''
  },
  shortDescription_ar: {
    type: String,
    trim: true,
    maxlength: [300, 'Arabic short description cannot be more than 300 characters'],
    default: ''
  },
  shortDescription_en: {
    type: String,
    trim: true,
    maxlength: [300, 'English short description cannot be more than 300 characters'],
    default: ''
  },
  
  // Multilingual description fields
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [5000, 'Product description cannot be more than 5000 characters']
  },
  description_ar: {
    type: String,
    trim: true,
    maxlength: [5000, 'Arabic product description cannot be more than 5000 characters'],
    default: ''
  },
  description_en: {
    type: String,
    trim: true,
    maxlength: [5000, 'English product description cannot be more than 5000 characters'],
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative'],
    default: null
  },
  isAvailable: {
    type: Boolean,
    required: [true, 'Product availability is required'],
    default: true
  },
  categoryId: {
    type: Number,
    required: [true, 'Category ID is required'],
    ref: 'Category'
  },
  subcategoryId: {
    type: Number,
    ref: 'Category',
    default: null
  },
  productType: {
    type: String,
    enum: ['product', 'theme'],
    default: 'product',
    required: [true, 'Product type is required']
  },
  
  // FAQ Section with multilingual support
  faqs: [{
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'FAQ question cannot be more than 200 characters']
    },
    question_ar: {
      type: String,
      trim: true,
      maxlength: [200, 'Arabic FAQ question cannot be more than 200 characters'],
      default: ''
    },
    question_en: {
      type: String,
      trim: true,
      maxlength: [200, 'English FAQ question cannot be more than 200 characters'],
      default: ''
    },
    answer: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'FAQ answer cannot be more than 1000 characters']
    },
    answer_ar: {
      type: String,
      trim: true,
      maxlength: [1000, 'Arabic FAQ answer cannot be more than 1000 characters'],
      default: ''
    },
    answer_en: {
      type: String,
      trim: true,
      maxlength: [1000, 'English FAQ answer cannot be more than 1000 characters'],
      default: ''
    }
  }],
  
  // Add-ons/Additional Services with multilingual support
  addOns: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Add-on name cannot be more than 100 characters']
    },
    name_ar: {
      type: String,
      trim: true,
      maxlength: [100, 'Arabic add-on name cannot be more than 100 characters'],
      default: ''
    },
    name_en: {
      type: String,
      trim: true,
      maxlength: [100, 'English add-on name cannot be more than 100 characters'],
      default: ''
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Add-on price cannot be negative']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Add-on description cannot be more than 300 characters'],
      default: ''
    },
    description_ar: {
      type: String,
      trim: true,
      maxlength: [300, 'Arabic add-on description cannot be more than 300 characters'],
      default: ''
    },
    description_en: {
      type: String,
      trim: true,
      maxlength: [300, 'English add-on description cannot be more than 300 characters'],
      default: ''
    }
  }],
  
  // Dynamic Product Options (Colors, Sizes, Dimensions, etc.)
  productOptions: [{
    type: {
      type: String,
      required: true,
      enum: ['dropdown', 'radio', 'checkbox', 'text', 'number', 'color'],
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Option name cannot be more than 100 characters']
    },
    name_ar: {
      type: String,
      trim: true,
      maxlength: [100, 'Arabic option name cannot be more than 100 characters'],
      default: ''
    },
    name_en: {
      type: String,
      trim: true,
      maxlength: [100, 'English option name cannot be more than 100 characters'],
      default: ''
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: [150, 'Option label cannot be more than 150 characters']
    },
    label_ar: {
      type: String,
      trim: true,
      maxlength: [150, 'Arabic option label cannot be more than 150 characters'],
      default: ''
    },
    label_en: {
      type: String,
      trim: true,
      maxlength: [150, 'English option label cannot be more than 150 characters'],
      default: ''
    },
    required: {
      type: Boolean,
      default: false
    },
    options: [{
      value: {
        type: String,
        required: true,
        trim: true
      },
      label: {
        type: String,
        required: true,
        trim: true
      },
      label_ar: {
        type: String,
        trim: true,
        default: ''
      },
      label_en: {
        type: String,
        trim: true,
        default: ''
      },
      priceModifier: {
        type: Number,
        default: 0
      },
      colorCode: {
        type: String,
        trim: true,
        default: ''
      }
    }],
    placeholder: {
      type: String,
      trim: true,
      default: ''
    },
    placeholder_ar: {
      type: String,
      trim: true,
      default: ''
    },
    placeholder_en: {
      type: String,
      trim: true,
      default: ''
    },
    validation: {
      min: {
        type: Number,
        default: null
      },
      max: {
        type: Number,
        default: null
      },
      pattern: {
        type: String,
        trim: true,
        default: ''
      }
    },
    order: {
      type: Number,
      default: 0
    }
  }],
  
  mainImage: {
    type: String,
    trim: true,
    default: ''
  },
  detailedImages: {
    type: [String],
    default: []
  },

  isActive: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  tags: {
    type: [String],
    default: []
  },
  // SEO fields with multilingual support
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
  },
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot be more than 60 characters'],
    default: ''
  },
  metaTitle_ar: {
    type: String,
    trim: true,
    maxlength: [60, 'Arabic meta title cannot be more than 60 characters'],
    default: ''
  },
  metaTitle_en: {
    type: String,
    trim: true,
    maxlength: [60, 'English meta title cannot be more than 60 characters'],
    default: ''
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot be more than 160 characters'],
    default: ''
  },
  metaDescription_ar: {
    type: String,
    trim: true,
    maxlength: [160, 'Arabic meta description cannot be more than 160 characters'],
    default: ''
  },
  metaDescription_en: {
    type: String,
    trim: true,
    maxlength: [160, 'English meta description cannot be more than 160 characters'],
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

// Indexes for better performance
productSchema.index({ id: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ subcategoryId: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ price: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ featured: 1 });
productSchema.index({ productType: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for category relationship
productSchema.virtual('category', {
  ref: 'Category',
  localField: 'categoryId',
  foreignField: 'id',
  justOne: true
});

// Virtual for subcategory relationship
productSchema.virtual('subcategory', {
  ref: 'Category',
  localField: 'subcategoryId',
  foreignField: 'id',
  justOne: true
});

// Instance methods
productSchema.methods.isInStock = function() {
  return this.isAvailable;
};

productSchema.methods.setAvailability = function(availability) {
  this.isAvailable = availability;
  return this.save();
};

productSchema.methods.markAsAvailable = function() {
  this.isAvailable = true;
  return this.save();
};

productSchema.methods.markAsUnavailable = function() {
  this.isAvailable = false;
  return this.save();
};

// Multilingual helper methods
productSchema.methods.getLocalizedContent = function(language = 'ar') {
  const lang = language === 'en' ? 'en' : 'ar';
  
  return {
    name: this[`name_${lang}`] || this.name,
    shortDescription: this[`shortDescription_${lang}`] || this.shortDescription,
    description: this[`description_${lang}`] || this.description,
    seoTitle: this[`seoTitle_${lang}`] || this.seoTitle,
    seoDescription: this[`seoDescription_${lang}`] || this.seoDescription,
    metaTitle: this[`metaTitle_${lang}`] || this.metaTitle,
    metaDescription: this[`metaDescription_${lang}`] || this.metaDescription,
    faqs: this.faqs.map(faq => ({
      question: faq[`question_${lang}`] || faq.question,
      answer: faq[`answer_${lang}`] || faq.answer
    })),
    addOns: this.addOns.map(addOn => ({
      name: addOn[`name_${lang}`] || addOn.name,
      description: addOn[`description_${lang}`] || addOn.description,
      price: addOn.price
    }))
  };
};

productSchema.methods.toLocalizedJSON = function(language = 'ar') {
  const obj = this.toObject();
  const localizedContent = this.getLocalizedContent(language);
  
  return {
    ...obj,
    ...localizedContent
  };
};



// Static methods
productSchema.statics.findByCategory = function(categoryId) {
  return this.find({ categoryId, isActive: true }).sort({ createdAt: -1 });
};

productSchema.statics.findBySubcategory = function(subcategoryId) {
  return this.find({ subcategoryId, isActive: true }).sort({ createdAt: -1 });
};

productSchema.statics.findByCategoryAndSubcategory = function(categoryId, subcategoryId = null) {
  const query = { categoryId, isActive: true };
  if (subcategoryId) {
    query.subcategoryId = subcategoryId;
  }
  return this.find(query).sort({ createdAt: -1 });
};



productSchema.statics.findFeatured = function() {
  return this.find({ featured: true, isActive: true }).sort({ createdAt: -1 });
};

productSchema.statics.searchByText = function(searchText) {
  return this.find({
    $text: { $search: searchText },
    isActive: true
  }).sort({ score: { $meta: 'textScore' } });
};

productSchema.statics.findUnavailable = function() {
  return this.find({ 
    isAvailable: false,
    isActive: true 
  }).sort({ createdAt: -1 });
};

productSchema.statics.findAvailable = function() {
  return this.find({ 
    isAvailable: true,
    isActive: true 
  }).sort({ createdAt: -1 });
};

productSchema.statics.findByType = function(productType) {
  return this.find({ 
    productType,
    isActive: true 
  }).sort({ createdAt: -1 });
};

productSchema.statics.findThemes = function() {
  return this.find({ 
    productType: 'theme',
    isActive: true 
  }).sort({ createdAt: -1 });
};

productSchema.statics.findProducts = function() {
  return this.find({ 
    productType: 'product',
    isActive: true 
  }).sort({ createdAt: -1 });
};

// Pre-save middleware
productSchema.pre('save', function(next) {
  // Auto-generate SEO fields if not provided
  if (!this.seoTitle && this.name) {
    this.seoTitle = this.name.substring(0, 60);
  }
  
  if (!this.seoDescription && this.description) {
    this.seoDescription = this.description.substring(0, 160);
  }
  
  // Dynamic options can be set manually if needed
  
  next();
});

// Auto-generate unique ID for new products
productSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    const lastProduct = await this.constructor.findOne().sort({ id: -1 });
    this.id = lastProduct ? lastProduct.id + 1 : 1;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);

export default Product;