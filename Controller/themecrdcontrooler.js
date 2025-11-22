import Component from '../models/ThemeCard.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعداد Multer
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = 'uploads/components';
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'component-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('يُسمح فقط بالصور (jpeg, jpg, png, gif, webp)'));
    }
  }
}).single('backgroundImage');

// ✅ GET All Components
export const getAllComponents = async (req, res) => {
  try {
    const { isActive, page = 1, limit = 50, sortBy = 'displayOrder' } = req.query;
    
    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const components = await Component.find(query)
      .sort({ [sortBy]: 1, orderNumber: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const count = await Component.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: components,
      pagination: {
        total: count,
        page: parseInt(page),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب العناصر',
      error: error.message
    });
  }
};

// ✅ GET Single Component
export const getComponentById = async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);
    
    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'العنصر غير موجود'
      });
    }
    
    res.status(200).json({
      success: true,
      data: component
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في جلب العنصر',
      error: error.message
    });
  }
};

// ✅ CREATE Component (يدعم JSON و form-data)
export const createComponent = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      // ✅ دعم كل من JSON و form-data
      let features = req.body.features || [];
      
      if (typeof features === 'string') {
        try {
          features = JSON.parse(features);
        } catch (e) {
          return res.status(400).json({
            success: false,
            message: 'صيغة features غير صحيحة. يجب أن تكون array'
          });
        }
      }
      
      const componentData = {
        title: req.body.title,
        description: req.body.description,
        overlayText: req.body.overlayText,
        orderNumber: req.body.orderNumber,
        features: features,
        category: req.body.category || 'عنصر متقدم',
        isActive: req.body.isActive !== 'false' && req.body.isActive !== false,
        displayOrder: req.body.displayOrder || 0,
        icon: req.body.icon
      };
      
      if (req.file) {
        componentData.backgroundImage = `/uploads/components/${req.file.filename}`;
      }
      
      const component = await Component.create(componentData);
      
      res.status(201).json({
        success: true,
        message: 'تم إنشاء العنصر بنجاح',
        data: component
      });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      res.status(400).json({
        success: false,
        message: 'خطأ في إنشاء العنصر',
        error: error.message
      });
    }
  });
};

// ✅ UPDATE Component (يدعم JSON و form-data)
export const updateComponent = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      });
    }
    
    try {
      const component = await Component.findById(req.params.id);
      
      if (!component) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(() => {});
        }
        return res.status(404).json({
          success: false,
          message: 'العنصر غير موجود'
        });
      }
      
      const updateData = {
        title: req.body.title || component.title,
        description: req.body.description || component.description,
        overlayText: req.body.overlayText !== undefined ? req.body.overlayText : component.overlayText,
        orderNumber: req.body.orderNumber || component.orderNumber,
        category: req.body.category || component.category,
        displayOrder: req.body.displayOrder !== undefined ? req.body.displayOrder : component.displayOrder,
        isActive: req.body.isActive !== undefined ? (req.body.isActive === 'true' || req.body.isActive === true) : component.isActive
      };
      
      // ✅ دعم features من JSON و form-data
      if (req.body.features !== undefined) {
        let features = req.body.features;
        if (typeof features === 'string') {
          try {
            features = JSON.parse(features);
          } catch (e) {
            if (req.file) {
              await fs.unlink(req.file.path).catch(() => {});
            }
            return res.status(400).json({
              success: false,
              message: 'صيغة features غير صحيحة'
            });
          }
        }
        updateData.features = features;
      }
      
      if (req.file) {
        if (component.backgroundImage) {
          const oldImagePath = path.join(__dirname, '..', component.backgroundImage);
          await fs.unlink(oldImagePath).catch(() => {});
        }
        updateData.backgroundImage = `/uploads/components/${req.file.filename}`;
      }
      
      const updatedComponent = await Component.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );
      
      res.status(200).json({
        success: true,
        message: 'تم تحديث العنصر بنجاح',
        data: updatedComponent
      });
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }
      
      res.status(400).json({
        success: false,
        message: 'خطأ في تحديث العنصر',
        error: error.message
      });
    }
  });
};

// ✅ DELETE Component
export const deleteComponent = async (req, res) => {
  try {
    const component = await Component.findById(req.params.id);
    
    if (!component) {
      return res.status(404).json({
        success: false,
        message: 'العنصر غير موجود'
      });
    }
    
    if (component.backgroundImage) {
      const imagePath = path.join(__dirname, '..', component.backgroundImage);
      await fs.unlink(imagePath).catch(() => {});
    }
    
    await Component.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'تم حذف العنصر بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف العنصر',
      error: error.message
    });
  }
};

// ✅ BULK DELETE
export const bulkDeleteComponents = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يجب تحديد معرفات العناصر للحذف'
      });
    }
    
    const components = await Component.find({ _id: { $in: ids } });
    
    for (const component of components) {
      if (component.backgroundImage) {
        const imagePath = path.join(__dirname, '..', component.backgroundImage);
        await fs.unlink(imagePath).catch(() => {});
      }
    }
    
    const result = await Component.deleteMany({ _id: { $in: ids } });
    
    res.status(200).json({
      success: true,
      message: `تم حذف ${result.deletedCount} عنصر بنجاح`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في الحذف المتعدد',
      error: error.message
    });
  }
};

// ✅ UPDATE Order
export const updateDisplayOrder = async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'بيانات الترتيب غير صحيحة'
      });
    }
    
    const bulkOps = updates.map(item => ({
      updateOne: {
        filter: { _id: item.id },
        update: { displayOrder: item.displayOrder }
      }
    }));
    
    await Component.bulkWrite(bulkOps);
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث الترتيب بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في تحديث الترتيب',
      error: error.message
    });
  }
};

export default {
  getAllComponents,
  getComponentById,
  createComponent,
  updateComponent,
  deleteComponent,
  bulkDeleteComponents,
  updateDisplayOrder
};