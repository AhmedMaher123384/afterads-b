import express from 'express';
import Customer from '../models/Customer.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import mongoose from 'mongoose';
import multer from 'multer';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// تحديد __dirname و __filename في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// JWT Secret (تُستخدم في middleware/auth.js عادةً)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// إعدادات Multer لرفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/images/users/');
    // إنشاء المجلد إذا لم يكن موجودًا
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fieldName = file.fieldname; // 'avatar' أو 'storeLogo' أو 'storeImage'
    cb(null, `${fieldName}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 ميغابايت
    files: 3 // الحد الأقصى للملفات في طلب واحد
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('فقط ملفات الصور مسموحة!'), false);
    }
  }
});

// Middleware لرفع صور المتجر والصورة الشخصية
const uploadStoreImages = upload.fields([
  { name: 'storeLogo', maxCount: 1 },
  { name: 'storeImage', maxCount: 1 }
]);

const uploadAvatar = upload.single('avatar');

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { search, limit, page } = req.query;
    let customers;

    if (search) {
      customers = await Customer.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } },
          { storeName: { $regex: search, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });
    } else {
      customers = await Customer.find({}).sort({ createdAt: -1 });
    }

    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;

    const total = customers.length;
    const paginatedCustomers = customers.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      customers: paginatedCustomers,
      total,
      page: pageNum,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    });

    console.log(`✅ Found ${customers.length} customers`);
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get customer by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let customer;
    
    if (mongoose.Types.ObjectId.isValid(id)) {
      customer = await Customer.findById(id).select('-password'); // إخفاء كلمة المرور
    } else {
      customer = await Customer.findOne({ id: parseInt(id) }).select('-password');
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found', message: `No customer found with ID: ${id}` });
    }

    res.json({ customer });
    console.log(`✅ Found customer: ${customer.name}`);
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
// Create new customer
router.post('/', async (req, res) => {
  try {
    const customerData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      city: req.body.city,
      address: req.body.address || '',
      password: req.body.password,
      status: req.body.status || 'active',
      storeName: req.body.storeName,
      storeLink: req.body.storeLink,
      storeLogo: req.body.storeLogo,
      storeImage: req.body.storeImage,
      avatar: req.body.avatar,
      firstName: req.body.firstName,
      lastName: req.body.lastName
    };

    const newCustomer = new Customer(customerData);
    const savedCustomer = await newCustomer.save();

    res.status(201).json({ customer: savedCustomer, message: 'Customer created successfully' });
    console.log(`✅ Created customer: ${savedCustomer.name}`);
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', message: error.message, details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Update customer (by admin/staff)
router.put('/:id', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found', message: `No customer found with ID: ${id}` });
    }

    const allowedFields = [
      'name', 'email', 'phone', 'city', 'address', 'password', 'status',
      'firstName', 'lastName', 'storeName', 'storeLink', 'storeLogo', 'storeImage', 'avatar',
      'customerGroup' // ✅ إضافة هذا الحقل
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        customer[field] = req.body[field];
      }
    });

    const updatedCustomer = await customer.save();
    res.json({ customer: updatedCustomer, message: 'Customer updated successfully' });
    console.log(`✅ Updated customer: ${updatedCustomer.name}`);
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', message: error.message, details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    let customer;

    if (mongoose.Types.ObjectId.isValid(id)) {
      customer = await Customer.findById(id);
    }
    if (!customer && !isNaN(id)) {
      customer = await Customer.findOne({ id: parseInt(id) });
    }
    if (!customer) {
      customer = await Customer.findOne({ id: id });
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found', message: `No customer found with ID: ${id}` });
    }

    await Customer.deleteOne({ _id: customer._id });
    res.json({ message: 'Customer deleted successfully', deletedCustomer: customer });
    console.log(`✅ Deleted customer: ${customer.name}`);
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Get customer statistics
router.get('/stats', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
    });

    res.json({ totalCustomers, newCustomersThisMonth });
    console.log(`✅ Customer stats: ${totalCustomers} total, ${newCustomersThisMonth} new this month`);
  } catch (error) {
    console.error('❌ Error fetching customer stats:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Update own profile (for customers)
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      city,
      address,
      firstName,
      lastName,
      storeName,
      storeLink,
      avatar,
      storeLogo,
      storeImage,
      customerGroup // ✅ إضافة هذا الحقل
    } = req.body;

    let customer;
    if (mongoose.Types.ObjectId.isValid(id)) {
      customer = await Customer.findById(id);
    } else {
      customer = await Customer.findOne({ id: parseInt(id) });
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'الاسم والبريد الإلكتروني مطلوبان' });
    }

    if (email.toLowerCase() !== customer.email.toLowerCase()) {
      const existingCustomer = await Customer.findOne({
        email: email.toLowerCase(),
        _id: { $ne: customer._id }
      });
      if (existingCustomer) {
        return res.status(400).json({ success: false, message: 'البريد الإلكتروني مستخدم بالفعل' });
      }
    }

    customer.name = name.trim();
    customer.email = email.toLowerCase().trim();
    if (firstName !== undefined) customer.firstName = (firstName || '').trim();
    if (lastName !== undefined) customer.lastName = (lastName || '').trim();
    if (phone !== undefined) customer.phone = (phone || '').trim();
    if (city !== undefined) customer.city = (city || '').trim();
    if (address !== undefined) customer.address = (address || '').trim();
    if (storeName !== undefined) customer.storeName = (storeName || '').trim();
    if (storeLink !== undefined) customer.storeLink = (storeLink || '').trim();
    if (avatar !== undefined) customer.avatar = (avatar || '').trim();
    if (storeLogo !== undefined) customer.storeLogo = (storeLogo || '').trim();
    if (storeImage !== undefined) customer.storeImage = (storeImage || '').trim();
    if (customerGroup !== undefined) customer.customerGroup = (customerGroup || 'regular').trim(); // ✅ إضافة

    const updatedCustomer = await customer.save();

    res.json({
      success: true,
      message: 'تم تحديث البيانات بنجاح',
      data: updatedCustomer
    });
    console.log(`✅ Customer updated own profile: ${updatedCustomer.name}`);
  } catch (error) {
    console.error('❌ Error updating customer profile:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: 'خطأ في البيانات المدخلة', details: error.errors });
    }
    res.status(500).json({ success: false, message: 'خطأ في الخادم', error: error.message });
  }
}); 

// Change password for customers
router.post('/change-password/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية والجديدة مطلوبتان' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
    }

    // ✅ التعديل: البحث بـ _id أو id
    let customer;
    if (mongoose.Types.ObjectId.isValid(id)) {
      customer = await Customer.findById(id);
    } else {
      customer = await Customer.findOne({ id: parseInt(id) });
    }

    if (!customer) {
      return res.status(404).json({ success: false, message: 'العميل غير موجود' });
    }

    const isCurrentPasswordValid = await customer.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ success: false, message: 'كلمة المرور الحالية غير صحيحة' });
    }

    customer.password = newPassword;
    await customer.save();

    res.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
    console.log(`✅ Customer password changed: ${customer.name}`);
  } catch (error) {
    console.error('❌ Error changing customer password:', error);
    res.status(500).json({ success: false, message: 'خطأ في الخادم', error: error.message });
  }
});
// رفع صورة شخصية (avatar)
// رفع صورة شخصية (avatar)
router.post('/upload-avatar', uploadAvatar, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم تحميل أي صورة' });
    }

    const avatarUrl = `/images/users/${req.file.filename}`;
    
    // ✅ إضافة: تحديث العميل في قاعدة البيانات
    const customerId = req.body.customerId || req.query.customerId;
    if (customerId) {
      let customer;
      if (mongoose.Types.ObjectId.isValid(customerId)) {
        customer = await Customer.findById(customerId);
      } else {
        customer = await Customer.findOne({ id: parseInt(customerId) });
      }
      
      if (customer) {
        customer.avatar = avatarUrl;
        await customer.save();
      }
    }
    
    res.json({ success: true, data: { url: avatarUrl } });
  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    res.status(500).json({ success: false, message: 'فشل تحميل الصورة' });
  }
});
// رفع شعار المتجر
router.post('/upload-store-logo', upload.single('storeLogo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم تحميل أي صورة' });
    }

    const logoUrl = `/images/users/${req.file.filename}`;
    res.json({ success: true, data: { storeLogo: logoUrl } });
  } catch (error) {
    console.error('❌ Error uploading store logo:', error);
    res.status(500).json({ success: false, message: 'فشل تحميل الصورة' });
  }
});

// رفع صورة المتجر
router.post('/upload-store-image', upload.single('storeImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'لم يتم تحميل أي صورة' });
    }

    const imageUrl = `/images/users/${req.file.filename}`;
    res.json({ success: true, data: { storeImage: imageUrl } });
  } catch (error) {
    console.error('❌ Error uploading store image:', error);
    res.status(500).json({ success: false, message: 'فشل تحميل الصورة' });
  }
});

export default router;