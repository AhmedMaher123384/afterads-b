import mongoose from 'mongoose';

const themeWorkSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  imageMobile: {
    type: String,
    required: [true, 'صورة الهاتف مطلوبة'],
    trim: true
  },
  imageTablet: {
    type: String,
    required: [true, 'صورة التابلت مطلوبة'],
    trim: true
  },
  imageDesktop: {
    type: String,
    required: [true, 'صورة الكمبيوتر مطلوبة'],
    trim: true
  },
  link: {
    type: String,
    trim: true,
    required: [true, 'الرابط مطلوب'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'يجب أن يكون الرابط URL صحيح يبدأ بـ http أو https'
    }
  },
  clientOpinion: {
    type: String,
    trim: true,
    maxlength: [1000, 'رأي العميل يجب ألا يتجاوز 1000 حرف']
  },
  clientName: {
    type: String,
    trim: true,
    maxlength: [150, 'اسم العميل يجب ألا يتجاوز 150 حرف']
  },
  clientImage: {
    type: String,
    default: null,
    trim: true
  },
  workDate: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// فهرس بسيط لتحسين الاستعلامات الشائعة
themeWorkSchema.index({ isActive: 1, workDate: -1 });

// توليد رقم id تلقائياً
themeWorkSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastItem = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastItem ? lastItem.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const ThemeWork = mongoose.model('ThemeWork', themeWorkSchema);

export default ThemeWork;