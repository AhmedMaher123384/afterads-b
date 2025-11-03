import mongoose from 'mongoose';
import Category from './models/Category.js';
import { getMongoUri } from './config.js';

// الاتصال بقاعدة البيانات
mongoose.connect(getMongoUri(), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function checkCategories() {
  try {
    console.log('🔍 فحص الكاتيجوري والصب كاتيجوري...\n');
    
    // جلب الكاتيجوري الرئيسية
    const mainCategories = await Category.find({ parentId: null });
    console.log(`📁 عدد الكاتيجوري الرئيسية: ${mainCategories.length}\n`);
    
    let totalSubcategories = 0;
    let activeSubcategories = 0;
    
    // فحص كل كاتيجوري رئيسي
    for (const category of mainCategories) {
      const subcategories = await Category.find({ parentId: category.id });
      
      if (subcategories.length > 0) {
        console.log(`📂 الكاتيجوري الرئيسي: ${category.name} (ID: ${category.id})`);
        console.log(`   📄 عدد الصب كاتيجوري: ${subcategories.length}`);
        
        subcategories.forEach(sub => {
          console.log(`      - ${sub.name} (ID: ${sub.id}, Active: ${sub.isActive})`);
          totalSubcategories++;
          if (sub.isActive) activeSubcategories++;
        });
        console.log('');
      }
    }
    
    console.log(`📊 الإحصائيات:`);
    console.log(`   - إجمالي الصب كاتيجوري: ${totalSubcategories}`);
    console.log(`   - الصب كاتيجوري النشطة: ${activeSubcategories}`);
    console.log(`   - الصب كاتيجوري غير النشطة: ${totalSubcategories - activeSubcategories}`);
    
  } catch (error) {
    console.error('❌ خطأ في فحص البيانات:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkCategories();