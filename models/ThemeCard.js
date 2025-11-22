import mongoose from 'mongoose';

const componentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'عنوان العنصر مطلوب'],
    trim: true,
    maxlength: [200, 'العنوان يجب ألا يتجاوز 200 حرف']
  },
  
  description: {
    type: String,
    required: [true, 'وصف العنصر مطلوب'],
    trim: true,
    maxlength: [1000, 'الوصف يجب ألا يتجاوز 1000 حرف']
  },
  
  backgroundImage: {
    type: String,
    default: null
  },
  
  overlayText: {
    type: String,
    trim: true,
    maxlength: [300, 'النص يجب ألا يتجاوز 300 حرف']
  },
  
  orderNumber: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  
  features: [{
    type: String,
    trim: true
  }],
  
  category: {
    type: String,
    default: 'عنصر متقدم',
    trim: true
  },
    icon: {
    type: String,
    trim: true,
   required: true
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  displayOrder: {
    type: Number,
    default: 0
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

componentSchema.index({ displayOrder: 1, orderNumber: 1 });
componentSchema.index({ isActive: 1, displayOrder: 1 });

componentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Component = mongoose.model('Component', componentSchema);

export default Component;