import express from 'express';
import Category from '../models/Category.js';

const router = express.Router();

// Get all categories (main categories only, no subcategories)
router.get('/', async (req, res) => {
  try {
    const { categoryType } = req.query;
    const query = { 
      isActive: true,
      parentId: null // Only get main categories, not subcategories
    };
    
    // Filter by category type
    if (categoryType) {
      query.categoryType = categoryType;
    }
    
    const categories = await Category.find(query)
      .sort({ order: 1, name: 1 })
      .populate('subcategories')
      .populate('productsCount');
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get main categories (no parent)
router.get('/main', async (req, res) => {
  try {
    const categories = await Category.findMainCategories()
      .populate('subcategories')
      .populate('productsCount');
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching main categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get ALL categories (for debugging) - TEMPORARY
router.get('/debug/all', async (req, res) => {
  try {
    const categories = await Category.find({})
      .sort({ createdAt: -1 });
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get subcategories by parent ID
router.get('/subcategories/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;
    const categories = await Category.findSubcategories(parseInt(parentId))
      .populate('productsCount');
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ id: parseInt(id), isActive: true })
      .populate('parent')
      .populate('subcategories')
      .populate('productsCount');
    
    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found',
        message: 'Category with this ID does not exist or is inactive'
      });
    }
    
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Create new category
router.post('/', async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    const { 
      name, name_ar, name_en, 
      description, description_ar, description_en, 
      image, parentId, order, 
      seoTitle, seoTitle_ar, seoTitle_en,
      seoDescription, seoDescription_ar, seoDescription_en 
    } = req.body;
    console.log('Extracted fields:', { name, name_ar, name_en, description, description_ar, description_en });
    
    if (!name) {
      return res.status(400).json({ 
        error: 'Validation error',
        message: 'Category name is required'
      });
    }
    
    const categoryData = {
      name,
      name_ar: name_ar || '',
      name_en: name_en || '',
      description,
      description_ar: description_ar || '',
      description_en: description_en || '',
      image,
      parentId: parentId || null,
      order: order || 0,
      seoTitle,
      seoTitle_ar: seoTitle_ar || '',
      seoTitle_en: seoTitle_en || '',
      seoDescription,
      seoDescription_ar: seoDescription_ar || '',
      seoDescription_en: seoDescription_en || ''
    };
    
    console.log('🔍 Creating category with data:', categoryData);
    
    const newCategory = new Category(categoryData);
    console.log('🔍 Category before save:', newCategory.toObject());
    
    const savedCategory = await newCategory.save();
    console.log('🔍 Category after save:', savedCategory.toObject());
    res.status(201).json(savedCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid category data',
        details: validationErrors
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: 'Duplicate error',
        message: `Category with this ${field} already exists`
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Update category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, name_ar, name_en,
      description, description_ar, description_en,
      image, parentId, order, 
      seoTitle, seoTitle_ar, seoTitle_en,
      seoDescription, seoDescription_ar, seoDescription_en,
      isActive 
    } = req.body;
    
    const category = await Category.findOne({ id: parseInt(id) });
    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found',
        message: 'Category with this ID does not exist'
      });
    }
    
    // Update fields
    if (name !== undefined) category.name = name;
    if (name_ar !== undefined) category.name_ar = name_ar;
    if (name_en !== undefined) category.name_en = name_en;
    if (description !== undefined) category.description = description;
    if (description_ar !== undefined) category.description_ar = description_ar;
    if (description_en !== undefined) category.description_en = description_en;
    if (image !== undefined) category.image = image;
    if (parentId !== undefined) category.parentId = parentId || null;
    if (order !== undefined) category.order = order;
    if (seoTitle !== undefined) category.seoTitle = seoTitle;
    if (seoTitle_ar !== undefined) category.seoTitle_ar = seoTitle_ar;
    if (seoTitle_en !== undefined) category.seoTitle_en = seoTitle_en;
    if (seoDescription !== undefined) category.seoDescription = seoDescription;
    if (seoDescription_ar !== undefined) category.seoDescription_ar = seoDescription_ar;
    if (seoDescription_en !== undefined) category.seoDescription_en = seoDescription_en;
    if (isActive !== undefined) category.isActive = isActive;
    
    const updatedCategory = await category.save();
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid category data',
        details: validationErrors
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Delete category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findOne({ id: parseInt(id) });
    if (!category) {
      return res.status(404).json({ 
        error: 'Category not found',
        message: 'Category with this ID does not exist'
      });
    }
    
    // Check if category has subcategories
    const subcategories = await Category.find({ parentId: parseInt(id) });
    if (subcategories.length > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete category',
        message: 'Category has subcategories. Please delete or move subcategories first.'
      });
    }
    
    await Category.deleteOne({ id: parseInt(id) });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;