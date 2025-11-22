import mongoose from 'mongoose';

// Simplified BlogPost Schema - only essential fields
const blogPostSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: [true, 'Blog post title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: [250, 'Slug cannot be more than 250 characters']
  },
  excerpt: {
    type: String,
    required: [true, 'Blog post excerpt is required'],
    trim: true,
    maxlength: [500, 'Excerpt cannot be more than 500 characters']
  },
    content: [{
      text: {
        type: String,
        trim: true
      },
      images: [{
        url: {
          type: String,
          trim: true,
          required: true
        },
        orientation: {
          type: String,
          enum: ['horizontal', 'vertical'],
          default: 'horizontal'
        }
      }]
    }],
  featuredImage: {
    type: String,
    trim: true,
    default: ''
  },
  featuredImageFile: {
    filename: {
      type: String,
      default: ''
    },
    originalName: {
      type: String,
      default: ''
    },
    mimetype: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 0
    },
    uploadDate: {
      type: Date,
      default: Date.now
    }
  },
  author: {
    type: String,
    required: [true, 'Author is required'],
    trim: true,
    maxlength: [100, 'Author name cannot be more than 100 characters']
  },
  categories: {
    type: [String],
    default: []
  },
  // SEO fields
  metaTitle: {
    type: String,
    trim: true,
    maxlength: [60, 'Meta title cannot be more than 60 characters']
  },
  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot be more than 160 characters']
  },
  keywords: {
    type: String,
    trim: true
  },
  ogTitle: {
    type: String,
    trim: true
  },
  ogDescription: {
    type: String,
    trim: true
  },
  ogImage: {
    type: String,
    trim: true
  },
  twitterTitle: {
    type: String,
    trim: true
  },
  twitterDescription: {
    type: String,
    trim: true
  }
}, {
  timestamps: {
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  }
});

// Essential indexes only
// blogPostSchema.index({ id: 1 });
// blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ createdAt: -1 });
blogPostSchema.index({ categories: 1 });
blogPostSchema.index({ 'content.text': 'text' });

// Pre-save middleware to generate slug if not provided
blogPostSchema.pre('save', async function(next) {
  if (!this.slug && this.title) {
    // Generate base slug from title
    let baseSlug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\u0600-\u06FF\s]/g, '') // Keep Arabic characters
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    // Check if slug already exists and make it unique
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const existingPost = await this.constructor.findOne({ 
        slug: slug,
        _id: { $ne: this._id } // Exclude current document if updating
      });
      
      if (!existingPost) {
        break;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  next();
});

// Pre-save middleware to auto-assign ID
blogPostSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastPost = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastPost ? lastPost.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});
const BlogPost = mongoose.model('BlogPost', blogPostSchema);

export default BlogPost;