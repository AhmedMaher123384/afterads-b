import AnnouncementBar from '../models/announcementBar.js';

// ============================================ 
// إنشاء شريط إعلان جديد
// ============================================
export const createAnnouncementBar = async (req, res) => {
  try {
    const { 
      content, 
      link, 
      backgroundColor, 
      textColor,
      isActive 
    } = req.body;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'المحتوى مطلوب' 
      });
    }

    const announcementBar = new AnnouncementBar({
      content,
      link: link || null,
      backgroundColor: backgroundColor || '#000000',
      textColor: textColor || '#FFFFFF',
      isActive: isActive !== undefined ? isActive : true
    });

    await announcementBar.save();

    res.status(201).json({
      success: true,
      message: 'تم إنشاء شريط الإعلان بنجاح',
      data: announcementBar
    });
  } catch (error) {
    console.error('Error creating announcement bar:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'حدث خطأ أثناء إنشاء شريط الإعلان' 
    });
  }
};

// ============================================
// جلب شريط الإعلان النشط
// ============================================
export const getActiveAnnouncementBar = async (req, res) => {
  try {
    const announcementBar = await AnnouncementBar.findOne({ 
      isActive: true 
    }).sort({ createdAt: -1 });

    if (!announcementBar) {
      return res.status(404).json({ 
        success: false,
        error: 'لا يوجد شريط إعلان نشط' 
      });
    }

    res.json({
      success: true,
      data: announcementBar
    });
  } catch (error) {
    console.error('Error fetching active announcement bar:', error);
    res.status(500).json({ 
      success: false,
      error: 'حدث خطأ أثناء جلب شريط الإعلان' 
    });
  }
};

// ============================================
// جلب كل شرائط الإعلان مع Pagination
// ============================================
export const getAllAnnouncementBars = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [announcementBars, total] = await Promise.all([
      AnnouncementBar.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AnnouncementBar.countDocuments()
    ]);

    res.json({
      success: true,
      data: announcementBars,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching announcement bars:', error);
    res.status(500).json({ 
      success: false,
      error: 'حدث خطأ أثناء جلب شرائط الإعلان' 
    });
  }
};

// ============================================
// جلب شريط إعلان واحد بالـ ID
// ============================================
export const getAnnouncementBarById = async (req, res) => {
  try {
    const { id } = req.params;

    const announcementBar = await AnnouncementBar.findById(id);

    if (!announcementBar) {
      return res.status(404).json({ 
        success: false,
        error: 'شريط الإعلان غير موجود' 
      });
    }

    res.json({
      success: true,
      data: announcementBar
    });
  } catch (error) {
    console.error('Error fetching announcement bar:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'ID غير صحيح' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'حدث خطأ أثناء جلب شريط الإعلان' 
    });
  }
};

// ============================================
// تحديث شريط إعلان
// ============================================
export const updateAnnouncementBar = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, link, backgroundColor, textColor, isActive } = req.body;

    // Validation
    if (content && content.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'المحتوى لا يمكن أن يكون فارغاً' 
      });
    }

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (link !== undefined) updateData.link = link || null;
    if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
    if (textColor !== undefined) updateData.textColor = textColor;
    if (isActive !== undefined) updateData.isActive = isActive;

    const announcementBar = await AnnouncementBar.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!announcementBar) {
      return res.status(404).json({ 
        success: false,
        error: 'شريط الإعلان غير موجود' 
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث شريط الإعلان بنجاح',
      data: announcementBar
    });
  } catch (error) {
    console.error('Error updating announcement bar:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false,
        error: error.message 
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'ID غير صحيح' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'حدث خطأ أثناء تحديث شريط الإعلان' 
    });
  }
};

// ============================================
// حذف شريط إعلان
// ============================================
export const deleteAnnouncementBar = async (req, res) => {
  try {
    const { id } = req.params;

    const announcementBar = await AnnouncementBar.findByIdAndDelete(id);

    if (!announcementBar) {
      return res.status(404).json({ 
        success: false,
        error: 'شريط الإعلان غير موجود' 
      });
    }

    res.json({
      success: true,
      message: 'تم حذف شريط الإعلان بنجاح',
      data: announcementBar
    });
  } catch (error) {
    console.error('Error deleting announcement bar:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'ID غير صحيح' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'حدث خطأ أثناء حذف شريط الإعلان' 
    });
  }
};

// ============================================
// تفعيل/إلغاء تفعيل شريط إعلان
// ============================================
export const toggleAnnouncementBar = async (req, res) => {
  try {
    const { id } = req.params;

    const currentBar = await AnnouncementBar.findById(id);

    if (!currentBar) {
      return res.status(404).json({ 
        success: false,
        error: 'شريط الإعلان غير موجود' 
      });
    }

    currentBar.isActive = !currentBar.isActive;
    await currentBar.save();

    res.json({
      success: true,
      message: `تم ${currentBar.isActive ? 'تفعيل' : 'إلغاء تفعيل'} شريط الإعلان`,
      data: currentBar
    });
  } catch (error) {
    console.error('Error toggling announcement bar:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        success: false,
        error: 'ID غير صحيح' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'حدث خطأ أثناء تغيير حالة شريط الإعلان' 
    });
  }
};

export default {
  createAnnouncementBar,
  getActiveAnnouncementBar,
  getAllAnnouncementBars,
  getAnnouncementBarById,
  updateAnnouncementBar,
  deleteAnnouncementBar,
  toggleAnnouncementBar
};


 