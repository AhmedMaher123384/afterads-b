import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { logActivity } from '../utils/activityLogger.js';
const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';



// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لا يوجد رمز مصادقة'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'رمز المصادقة غير صالح'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'رمز المصادقة غير صالح'
    });
  }
};

// Middleware to check admin permissions
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح لك بالوصول لهذه الصفحة'
    });
  }
  next();
};

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) {
      query.role = role;
    }

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    // Log activity
    await logActivity(
      req.user._id,
      req.user.name,
      req.user.role,
      'manage_user',
      `عرض قائمة المستخدمين - الصفحة ${page}`,
      req,
      true
    );

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Get user by ID (admin only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }



    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role = 'staff' } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'الاسم والبريد الإلكتروني وكلمة المرور مطلوبة'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل'
      });
    }

    // Get next ID
    const lastUser = await User.findOne({}, {}, { sort: { id: -1 } });
    const nextId = lastUser ? lastUser.id + 1 : 1;

    // Create new user
    const newUser = new User({
      id: nextId,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true
    });

    await newUser.save();

    // Log activity
    await logActivity(
      req.user._id,
      req.user.name,
      req.user.role,
      'user_created',
      `تم إنشاء مستخدم جديد: ${newUser.name} (${newUser.email})`,
      req,
      true
    );

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المستخدم بنجاح',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Validate input
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'الاسم والبريد الإلكتروني مطلوبان'
      });
    }

    // Check if email already exists (excluding current user)
    if (email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: user._id }
      });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'البريد الإلكتروني مستخدم بالفعل'
        });
      }
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString() && isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك إلغاء تفعيل حسابك الخاص'
      });
    }

    // Update user
    const oldData = {
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    };

    user.name = name.trim();
    user.email = email.toLowerCase().trim();
    if (role) user.role = role;
    if (typeof isActive === 'boolean') user.isActive = isActive;

    await user.save();

    // Log activity
    const changes = [];
    if (oldData.name !== user.name) changes.push(`الاسم: ${oldData.name} → ${user.name}`);
    if (oldData.email !== user.email) changes.push(`البريد: ${oldData.email} → ${user.email}`);
    if (oldData.role !== user.role) changes.push(`الدور: ${oldData.role} → ${user.role}`);
    if (oldData.isActive !== user.isActive) changes.push(`الحالة: ${oldData.isActive ? 'نشط' : 'غير نشط'} → ${user.isActive ? 'نشط' : 'غير نشط'}`);

    if (changes.length > 0) {
      await logActivity(
        req.user._id,
        req.user.name,
        req.user.role,
        'user_updated',
        `تم تحديث المستخدم ${user.name}: ${changes.join(', ')}`,
        req,
        true
      );
    }

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'تم تحديث المستخدم بنجاح',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكنك حذف حسابك الخاص'
      });
    }

    const userName = user.name;
    const userEmail = user.email;
    await User.findByIdAndDelete(req.params.id);

    // Log activity
    await logActivity(
      req.user._id,
      req.user.name,
      req.user.role,
      'user_deleted',
      `تم حذف المستخدم: ${userName} (${userEmail})`,
      req,
      true
    );

    res.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Admin change password for employees (without current password)
router.post('/admin-change-password/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Change password (admin privilege - no current password required)
    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Log activity
    await logActivity(
      req.user._id,
      req.user.name,
      req.user.role,
      'admin_change_password',
      `الأدمن ${req.user.name} قام بتغيير كلمة مرور المستخدم: ${user.name} (${user.email})`,
      req,
      true
    );

    res.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('Admin change password error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

// Reset user password (admin only)
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Reset password
    user.password = newPassword;
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Log activity
    await logActivity(
      req.user._id,
      req.user.name,
      req.user.role,
      'user_password_reset',
      `تم إعادة تعيين كلمة مرور المستخدم: ${user.name} (${user.email})`,
      req,
      true
    );

    res.json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في الخادم'
    });
  }
});

export default router;