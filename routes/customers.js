import express from 'express';
import Customer from '../models/Customer.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { search, limit, page } = req.query;
    let customers;
    
    if (search) {
      // Text search
      customers = await Customer.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } }
        ]
      }).sort({ createdAt: -1 });
    } else {
      // Get all customers with simple sorting
      customers = await Customer.find({})
        .sort({ createdAt: -1 });
    }
    
    // Pagination
    const limitNum = parseInt(limit) || 50;
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    
    const total = customers.length;
    const paginatedCustomers = customers.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum);
    
    // Always return consistent format
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
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📄 Fetching customer by ID:', id);
    
    const customer = await Customer.findOne({ id: parseInt(id) });
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'Customer not found',
        message: `No customer found with ID: ${id}`
      });
    }
    
    res.json({ customer });
    console.log(`✅ Found customer: ${customer.name}`);
  } catch (error) {
    console.error('❌ Error fetching customer:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Create new customer
router.post('/', async (req, res) => {
  try {
    console.log('📝 Creating new customer:', req.body);
    
    const customerData = {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      city: req.body.city,
      address: req.body.address || ''
    };
    
    const newCustomer = new Customer(customerData);
    const savedCustomer = await newCustomer.save();
    
    res.status(201).json({ 
      customer: savedCustomer,
      message: 'Customer created successfully'
    });
    
    console.log(`✅ Created customer: ${savedCustomer.name}`);
  } catch (error) {
    console.error('❌ Error creating customer:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Update customer
router.put('/:id', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Updating customer:', id, req.body);
    
    const customer = await Customer.findOne({ id: parseInt(id) });
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'Customer not found',
        message: `No customer found with ID: ${id}`
      });
    }
    
    // Update fields - only allow name, email, phone, city, and address
    const allowedFields = ['name', 'email', 'phone', 'city', 'address'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        customer[field] = req.body[field];
      }
    });
    
    const updatedCustomer = await customer.save();
    
    res.json({ 
      customer: updatedCustomer,
      message: 'Customer updated successfully'
    });
    
    console.log(`✅ Updated customer: ${updatedCustomer.name}`);
  } catch (error) {
    console.error('❌ Error updating customer:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting customer:', id);
    
    const customer = await Customer.findOne({ id: parseInt(id) });
    
    if (!customer) {
      return res.status(404).json({ 
        error: 'Customer not found',
        message: `No customer found with ID: ${id}`
      });
    }
    
    await Customer.deleteOne({ id: parseInt(id) });
    
    res.json({ 
      message: 'Customer deleted successfully',
      deletedCustomer: customer
    });
    
    console.log(`✅ Deleted customer: ${customer.name}`);
  } catch (error) {
    console.error('❌ Error deleting customer:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get customer statistics
router.get('/stats', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const totalCustomers = await Customer.countDocuments();
    const newCustomersThisMonth = await Customer.countDocuments({
      createdAt: {
        $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      }
    });
    
    res.json({
      totalCustomers,
      newCustomersThisMonth
    });
    
    console.log(`✅ Customer stats: ${totalCustomers} total, ${newCustomersThisMonth} new this month`);
  } catch (error) {
    console.error('❌ Error fetching customer stats:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Update own profile (for customers)
router.put('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, city, address } = req.body;
    
    console.log('📝 Customer updating own profile:', id, req.body);
    
    const customer = await Customer.findOne({ id: parseInt(id) });
    
    if (!customer) {
      return res.status(404).json({ 
        success: false,
        message: 'العميل غير موجود'
      });
    }

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'الاسم والبريد الإلكتروني مطلوبان'
      });
    }

    // Check if email already exists (excluding current customer)
    if (email.toLowerCase() !== customer.email.toLowerCase()) {
      const existingCustomer = await Customer.findOne({ 
        email: email.toLowerCase(),
        id: { $ne: customer.id }
      });
      if (existingCustomer) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مستخدم بالفعل'
        });
      }
    }

    // Update customer profile fields
    customer.name = name.trim();
    customer.email = email.toLowerCase().trim();
    if (phone) customer.phone = phone.trim();
    if (city) customer.city = city.trim();
    if (address) customer.address = address.trim();

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
      return res.status(400).json({
        success: false,
        message: 'خطأ في البيانات المدخلة',
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Change password for customers
router.post('/change-password/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    console.log('🔐 Customer changing password:', id);
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية والجديدة مطلوبتان'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'
      });
    }

    const customer = await Customer.findOne({ id: parseInt(id) });
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'العميل غير موجود'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await customer.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الحالية غير صحيحة'
      });
    }

    // Update password
    customer.password = newPassword;
    await customer.save();

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

    console.log(`✅ Customer password changed: ${customer.name}`);
  } catch (error) {
    console.error('❌ Error changing customer password:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

export default router;