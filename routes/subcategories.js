import express from 'express';
import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// إعدادات Multer لرفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images/categories/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'subcategory-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

const uploadImage = upload.single('mainImage');

// Get all subcategories
router.get('/', async (req, res) => {
  try {
    const { parentId, active } = req.query;
    let query = { parentId: { $ne: null } }; // Only subcategories
    
    if (parentId) {
      query.parentId = parentId;
    }
    
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    const subcategories = await Category.find(query)
      .populate('productsCount')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: subcategories
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
});

// Get subcategories by parent category
router.get('/by-parent/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;
    const { active = 'true' } = req.query;
    
    // Convert parentId to number since our model uses numeric id
    const parentIdNum = parseInt(parentId);
    if (isNaN(parentIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent category ID'
      });
    }
    
    // Verify parent category exists using numeric id
    const parentCategory = await Category.findOne({ id: parentIdNum });
    if (!parentCategory) {
      return res.status(404).json({
        success: false,
        message: 'Parent category not found'
      });
    }
    
    let query = { parentId: parentIdNum };
    if (active !== undefined) {
      query.isActive = active === 'true';
    }
    
    const subcategories = await Category.find(query)
      .populate('productsCount')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: subcategories,
      parent: parentCategory
    });
  } catch (error) {
    console.error('Error fetching subcategories by parent:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategories',
      error: error.message
    });
  }
});

// Get single subcategory
router.get('/:id', async (req, res) => {
  try {
    const subcategory = await Category.findOne({ 
      _id: req.params.id, 
      parentId: { $ne: null } 
    }).populate('productsCount');
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }
    
    res.json({
      success: true,
      data: subcategory
    });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subcategory',
      error: error.message
    });
  }
});

// Create new subcategory
router.post('/', uploadImage, [
  body('parentId').notEmpty().withMessage('Parent category is required'),
  // Custom validation to ensure at least one name is provided
  body().custom((value, { req }) => {
    const { name_ar, name_en } = req.body;
    if (!name_ar || name_ar.trim() === '') {
      if (!name_en || name_en.trim() === '') {
        throw new Error('At least one name (Arabic or English) is required');
      }
    }
    return true;
  }),
  // Custom validation to ensure at least one description is provided
  body().custom((value, { req }) => {
    const { description_ar, description_en } = req.body;
    if (!description_ar || description_ar.trim() === '') {
      if (!description_en || description_en.trim() === '') {
        throw new Error('At least one description (Arabic or English) is required');
      }
    }
    return true;
  })
], async (req, res) => {
  console.log('=== SUBCATEGORIES ROUTE START ===');
  console.log('Request body:', req.body);
  try {
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name_ar, name_en, description_ar, description_en, parentId } = req.body;
    
    // Create name field (required by Category model) - use Arabic name as primary
    const name = name_ar || name_en;
    // Create description field - use Arabic description as primary
    const description = description_ar || description_en;
    console.log('🔍 Created name field:', name);
    console.log('🔍 name_ar:', name_ar);
    console.log('🔍 name_en:', name_en);
    console.log('🔍 Created description field:', description);
    console.log('🔍 description_ar:', description_ar);
    console.log('🔍 description_en:', description_en);
    
    // Convert parentId to number
    const parentIdNum = parseInt(parentId);
    if (isNaN(parentIdNum)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent category ID'
      });
    }
    
    // Verify parent category exists and is not a subcategory itself
    console.log('🔍 Looking for parent category with id:', parentIdNum);
    const parentCategory = await Category.findOne({ 
      id: parentIdNum, 
      parentId: null 
    });
    console.log('🔍 Found parent category:', parentCategory ? 'YES' : 'NO');
    
    if (!parentCategory) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parent category. Parent must be a main category, not a subcategory.'
      });
    }
    
    // Get next available ID
    console.log('🔍 Getting next available ID...');
    const lastCategory = await Category.findOne().sort({ id: -1 });
    console.log('🔍 Last category found:', lastCategory ? lastCategory.id : 'NONE');
    const nextId = lastCategory ? lastCategory.id + 1 : 1;
    console.log('🔍 Next ID will be:', nextId);

    // Check if subcategory with same name already exists under this parent
    const existingSubcategory = await Category.findOne({
      parentId: parentIdNum,
      $or: [
        { 'name_ar': name_ar },
        { 'name_en': name_en }
      ]
    });

    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: 'A subcategory with this name already exists under the selected parent category'
      });
    }

    // Handle image upload
    let imagePath = '';
    if (req.file) {
      imagePath = `/images/categories/${req.file.filename}`;
      console.log('🖼️ Image uploaded:', imagePath);
    }

    const subcategory = new Category({
      id: nextId,
      name: name,
      description: description,
      name_ar: name_ar,
      name_en: name_en,
      description_ar: description_ar,
      description_en: description_en,
      image: imagePath,
      parentId: parentIdNum,
      categoryType: 'regular',
      isActive: true
    });
    
    await subcategory.save();
    
    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: subcategory
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating subcategory',
      error: error.message
    });
  }
});

// Delete subcategory
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // Optional force parameter
    
    // Find the subcategory to delete
    const subcategory = await Category.findOne({ 
      id: parseInt(id), 
      parentId: { $ne: null } 
    });
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }
    
    // Check if there are any products using this subcategory
    const productsUsingSubcategory = await Product.find({ 
      subcategoryId: parseInt(id) 
    });
    
    if (productsUsingSubcategory.length > 0) {
      if (force === 'true') {
        // Force delete: Remove subcategory association from products
        await Product.updateMany(
          { subcategoryId: parseInt(id) },
          { $unset: { subcategoryId: "" } }
        );
        console.log(`Removed subcategory association from ${productsUsingSubcategory.length} products`);
      } else {
        // Return info about products using this subcategory
        return res.status(400).json({
          success: false,
          message: `Cannot delete subcategory. ${productsUsingSubcategory.length} product(s) are using this subcategory.`,
          productsCount: productsUsingSubcategory.length,
          canForceDelete: true
        });
      }
    }
    
    // Delete the subcategory
    await Category.deleteOne({ id: parseInt(id) });
    
    const message = productsUsingSubcategory.length > 0 
      ? `Subcategory deleted successfully. ${productsUsingSubcategory.length} product(s) were updated to remove subcategory association.`
      : 'Subcategory deleted successfully';
    
    res.json({
      success: true,
      message: message,
      productsUpdated: productsUsingSubcategory.length
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subcategory',
      error: error.message
    });
  }
});

export default router;