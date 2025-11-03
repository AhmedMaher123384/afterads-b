import mongoose from 'mongoose';
import Category from './models/Category.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/ghems', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function testCategoryCreation() {
  try {
    console.log('🔍 Testing category creation...');
    
    const categoryData = {
      name: 'تصنيف اختبار مباشر',
      name_ar: 'تصنيف اختبار مباشر',
      name_en: 'Direct Test Category',
      description: 'وصف اختبار مباشر',
      description_ar: 'وصف اختبار مباشر',
      description_en: 'Direct test description'
    };
    
    console.log('🔍 Creating category with data:', categoryData);
    
    const newCategory = new Category(categoryData);
    console.log('🔍 Category before save:', newCategory.toObject());
    
    const savedCategory = await newCategory.save();
    console.log('🔍 Category after save:', savedCategory.toObject());
    
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

testCategoryCreation();