import express from 'express';
import ActivityLog from '../models/ActivityLog.js';
import LoginLog from '../models/LoginLog.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// GET /api/logs/activity - جلب سجلات النشاط
router.get('/activity', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      orderId,
      startDate,
      endDate,
      search,
      orderOnly = 'true' // إضافة فلتر لإظهار أنشطة الطلبات فقط
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // فلترة لإظهار أنشطة الطلبات فقط (التي تحتوي على orderId أو orderNumber)
    if (orderOnly === 'true') {
      query.$or = [
        { orderId: { $exists: true, $ne: null } },
        { orderNumber: { $exists: true, $ne: null } }
      ];
    }

    // فلترة حسب المستخدم
    if (userId) {
      query.userId = userId;
    }

    // فلترة حسب نوع النشاط
    if (action) {
      query.action = action;
    }

    // فلترة حسب رقم الطلب
    if (orderId) {
      query.orderId = orderId;
    }

    // فلترة حسب التاريخ
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }

    // البحث في التفاصيل أو اسم المستخدم
    if (search) {
      const searchQuery = [
        { userName: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
      
      if (query.$or) {
        // إذا كان هناك فلتر orderOnly، نحتاج لدمج الشروط
        query.$and = [
          { $or: query.$or },
          { $or: searchQuery }
        ];
        delete query.$or;
      } else {
        query.$or = searchQuery;
      }
    }

    const [logs, total] = await Promise.all([
      ActivityLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ActivityLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجلات النشاط'
    });
  }
});

// GET /api/logs/login - جلب سجلات الدخول
router.get('/login', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      success,
      startDate,
      endDate,
      search
    } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    // فلترة حسب المستخدم
    if (userId) {
      query.userId = userId;
    }

    // فلترة حسب نجاح/فشل الدخول
    if (success !== undefined) {
      query.success = success === 'true';
    }

    // فلترة حسب التاريخ
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // البحث في اسم المستخدم أو البريد الإلكتروني
    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { ipAddress: { $regex: search, $options: 'i' } }
      ];
    }

    const [logs, total] = await Promise.all([
      LoginLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      LoginLog.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching login logs:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب سجلات الدخول'
    });
  }
});

// GET /api/logs/activity/stats - إحصائيات سجلات النشاط
router.get('/activity/stats', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp.$lte = new Date(endDate);
      }
    }

    const [actionStats, userStats, totalLogs] = await Promise.all([
      // إحصائيات حسب نوع النشاط
      ActivityLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // إحصائيات حسب المستخدم
      ActivityLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: { userId: '$userId', userName: '$userName' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      // إجمالي السجلات
      ActivityLog.countDocuments(dateFilter)
    ]);

    res.json({
      success: true,
      data: {
        actionStats,
        userStats,
        totalLogs
      }
    });
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات النشاط'
    });
  }
});

// GET /api/logs/login/stats - إحصائيات سجلات الدخول
router.get('/login/stats', authenticateToken, requireRole(['admin', 'staff']), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    
    if (startDate || endDate) {
      dateFilter.timestamp = {};
      if (startDate) {
        dateFilter.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.timestamp.$lte = new Date(endDate);
      }
    }

    const [successStats, failureReasons, totalAttempts] = await Promise.all([
      // إحصائيات النجاح/الفشل
      LoginLog.aggregate([
        { $match: dateFilter },
        { $group: { _id: '$success', count: { $sum: 1 } } }
      ]),
      // أسباب الفشل
      LoginLog.aggregate([
        { $match: { ...dateFilter, success: false } },
        { $group: { _id: '$failureReason', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // إجمالي المحاولات
      LoginLog.countDocuments(dateFilter)
    ]);

    res.json({
      success: true,
      data: {
        successStats,
        failureReasons,
        totalAttempts
      }
    });
  } catch (error) {
    console.error('Error fetching login stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب إحصائيات الدخول'
    });
  }
});

// DELETE /api/logs/activity - مسح جميع سجلات النشاط
router.delete('/activity', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await ActivityLog.deleteMany({});
    
    res.json({
      success: true,
      message: `تم مسح ${result.deletedCount} سجل نشاط بنجاح`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في مسح سجلات النشاط'
    });
  }
});

// DELETE /api/logs/login - مسح جميع سجلات الدخول
router.delete('/login', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await LoginLog.deleteMany({});
    
    res.json({
      success: true,
      message: `تم مسح ${result.deletedCount} سجل دخول بنجاح`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Error clearing login logs:', error);
    res.status(500).json({
      success: false,
      message: 'خطأ في مسح سجلات الدخول'
    });
  }
});

export default router;