import mongoose from 'mongoose';

// Main Client Schema
const clientSchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Client name is required'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  logo: {
    type: String,
    required: [true, 'Client logo is required'],
    trim: true
  },
  website: {
    type: String,
    required: [true, 'Client website link is required'],
    trim: true
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
clientSchema.index({ id: 1 });
clientSchema.index({ createdAt: -1 });
clientSchema.index({ name: 'text' });

// Static methods
clientSchema.statics.searchByText = function(searchText) {
  return this.find({
    $text: { $search: searchText }
  }).sort({ score: { $meta: 'textScore' }, createdAt: -1 });
};

// Pre-save middleware to auto-generate ID
clientSchema.pre('save', async function(next) {
  if (this.isNew && !this.id) {
    try {
      const lastClient = await this.constructor.findOne({}, {}, { sort: { id: -1 } });
      this.id = lastClient ? lastClient.id + 1 : 1;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const Client = mongoose.model('Client', clientSchema);

export default Client;