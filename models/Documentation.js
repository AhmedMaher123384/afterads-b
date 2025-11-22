import mongoose from 'mongoose';

// المستوى الرابع: Content (المحتوى)
const contentBlockSchema = new mongoose.Schema({
  text: { type: String, trim: true },
  images: [{
    url: { type: String, trim: true, required: true },
    orientation: { type: String, enum: ['horizontal', 'vertical'], default: 'horizontal' }
  }]
}, { _id: false });

// المستوى الثالث: Sub-Classification (التصنيف الفرعي)
const subClassificationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  icon: { type: String, trim: true },
  order: { type: Number, default: 0 }
}, { _id: false });

// المستوى الثالث: Documentation
const documentationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  icon: { type: String, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, default: 0 },
  classificationId: { type: String, trim: true },
  content: [contentBlockSchema],
  metadata: {
    totalViews: { type: Number, default: 0 },
    lastViewed: { type: Date }
  }
}, { _id: false });

// المستوى الثاني: Category
const categorySchema = new mongoose.Schema({
  id: { type: String, required: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true },
  icon: { type: String, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, default: 0 },
  mainClassificationId: { type: String, trim: true }, // ✅ ربط بالتصنيف الرئيسي
  classifications: [subClassificationSchema],
  documentations: [documentationSchema],
  isActive: { type: Boolean, default: true },
  metadata: {
    totalViews: { type: Number, default: 0 },
    totalDocs: { type: Number, default: 0 },
    totalClassifications: { type: Number, default: 0 }
  }
}, { _id: false });

// ✅ المستوى الأول: Main Classification (التصنيف الرئيسي الأكبر)
const mainClassificationSchema = new mongoose.Schema({
  id: { type: String, unique: true, sparse: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  icon: { type: String, trim: true },
  description: { type: String, trim: true },
  order: { type: Number, default: 0 },
  color: { type: String, trim: true }, // لون مميز للتصنيف
  categories: [categorySchema], // الفئات التابعة لهذا التصنيف
  isActive: { type: Boolean, default: true },
  metadata: {
    totalViews: { type: Number, default: 0 },
    totalCategories: { type: Number, default: 0 },
    totalDocs: { type: Number, default: 0 }
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
mainClassificationSchema.index({ id: 1 });
mainClassificationSchema.index({ slug: 1 });
mainClassificationSchema.index({ isActive: 1 });
mainClassificationSchema.index({ order: 1 });
mainClassificationSchema.index({ 'categories.slug': 1 });
mainClassificationSchema.index({ 'categories.documentations.slug': 1 });
mainClassificationSchema.index({ 
  title: 'text', 
  'categories.title': 'text',
  'categories.documentations.title': 'text',
  'categories.documentations.content.text': 'text' 
});

// Static Methods
mainClassificationSchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug, isActive: true });
};

mainClassificationSchema.statics.getAllStructure = function() {
  return this.find({ isActive: true }).sort({ order: 1 });
};

mainClassificationSchema.statics.searchByText = function(searchText) {
  return this.find({ 
    $text: { $search: searchText }, 
    isActive: true 
  }).sort({ score: { $meta: 'textScore' } });
};

// Pre-save Hooks
mainClassificationSchema.pre('save', async function(next) {
  // Auto-generate slug للـ Main Classification
  if (!this.slug && this.title) {
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    let slug = baseSlug;
    let counter = 1;
    const query = this.isNew 
      ? { slug: slug } 
      : { slug: slug, _id: { $ne: this._id } };
      
    while (await this.constructor.findOne(query)) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      query.slug = slug;
    }
    this.slug = slug;
  }

  // Auto-generate slugs للـ categories
  if (this.categories && this.categories.length > 0) {
    for (let category of this.categories) {
      if (!category.slug && category.title) {
        let baseSlug = category.title
          .toLowerCase()
          .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .trim();
        category.slug = baseSlug;
      }
      
      if (!category.id) {
        category.id = `${this.id}-cat-${category.slug}`;
      }

      // Auto-generate slugs للـ classifications
      if (category.classifications && category.classifications.length > 0) {
        for (let classification of category.classifications) {
          if (!classification.slug && classification.title) {
            let baseSlug = classification.title
              .toLowerCase()
              .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim();
            classification.slug = baseSlug;
          }
          
          if (!classification.id) {
            classification.id = `${category.id}-class-${classification.slug}`;
          }
        }
      }

      // Auto-generate slugs للـ documentations
      if (category.documentations && category.documentations.length > 0) {
        for (let doc of category.documentations) {
          if (!doc.slug && doc.title) {
            let baseSlug = doc.title
              .toLowerCase()
              .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .trim();
            doc.slug = baseSlug;
          }
          
          if (!doc.id) {
            doc.id = `${category.id}-${doc.slug}`;
          }
        }
      }

      // Update category metadata
      category.metadata = category.metadata || {};
      category.metadata.totalDocs = category.documentations?.length || 0;
      category.metadata.totalClassifications = category.classifications?.length || 0;
    }
  }

  // Update main classification metadata
  this.metadata.totalCategories = this.categories?.length || 0;
  this.metadata.totalDocs = this.categories?.reduce((sum, cat) => sum + (cat.documentations?.length || 0), 0) || 0;

  next();
});

// Auto-increment ID للـ Main Classification
mainClassificationSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastDoc = await this.constructor.findOne().sort({ _id: -1 }).lean();
      
      if (lastDoc && lastDoc.id) {
        const match = lastDoc.id.match(/main-(\d+)/);
        const lastNum = match ? parseInt(match[1]) : 0;
        this.id = `main-${lastNum + 1}`;
      } else {
        this.id = 'main-1';
      }
    } catch (error) {
      console.error('Error generating ID:', error);
      return next(error);
    }
  }
  next();
});

const Documentation = mongoose.model('Documentation', mainClassificationSchema);

export default Documentation;