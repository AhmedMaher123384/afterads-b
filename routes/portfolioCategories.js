import express from 'express';
import PortfolioCategory from '../models/PortfolioCategory.js';

const router = express.Router();

// Get all portfolio categories
router.get('/', async (req, res) => {
  try {
    const { withCount } = req.query;
    const query = { isActive: true };
    
    let categories;
    
    if (withCount === 'true') {
      // Get categories with portfolios count using aggregation
      categories = await PortfolioCategory.findWithPortfoliosCount();
    } else {
      categories = await PortfolioCategory.find(query)
        .sort({ order: 1, name: 1 })
        .populate('subcategories')
        .populate('portfoliosCount');
    }
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching portfolio categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching portfolio categories',
      error: error.message 
    });
  }
});

// Get main portfolio categories (no parent)
router.get('/main', async (req, res) => {
  try {
    const categories = await PortfolioCategory.find({ parentId: null, isActive: true })
      .sort({ order: 1, name: 1 });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching main portfolio categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching main portfolio categories',
      error: error.message 
    });
  }
});



// Get subcategories by parent ID
router.get('/subcategories/:parentId', async (req, res) => {
  try {
    const { parentId } = req.params;
    
    const categories = await PortfolioCategory.findSubcategories(parseInt(parentId))
      .populate('portfoliosCount');
    
    res.json({
      success: true,
      data: categories
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

// Search portfolio categories
router.get('/search', async (req, res) => {
  try {
    const { q: searchQuery } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const categories = await PortfolioCategory.searchByName(searchQuery)
      .populate('portfoliosCount');
    
    res.json({
      success: true,
      data: categories,
      searchQuery
    });
  } catch (error) {
    console.error('Error searching portfolio categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error searching portfolio categories',
      error: error.message 
    });
  }
});

// Get portfolio category by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await PortfolioCategory.findOne({ 
      id: parseInt(id), 
      isActive: true 
    })
    .populate('parent')
    .populate('subcategories')
    .populate('portfoliosCount');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching portfolio category:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching portfolio category',
      error: error.message 
    });
  }
});

// Create new portfolio category
router.post('/', async (req, res) => {
  try {
    const {
      name,
      parentId,
      order
    } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    // Check if parent category exists (if parentId provided)
    if (parentId) {
      const parentCategory = await PortfolioCategory.findOne({ 
        id: parseInt(parentId)
      });
      
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category ID'
        });
      }
    }
    
    // Get next ID
    const lastCategory = await PortfolioCategory.findOne().sort({ id: -1 });
    const nextId = lastCategory ? lastCategory.id + 1 : 1;
    
    // Create category
    const category = new PortfolioCategory({
      id: nextId,
      name: name.trim(),
      parentId: parentId ? parseInt(parentId) : null,
      order: parseInt(order) || 0
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      message: 'Portfolio category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating portfolio category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating portfolio category',
      error: error.message
    });
  }
});

// Update portfolio category
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find category
    const category = await PortfolioCategory.findOne({ id: parseInt(id) });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio category not found'
      });
    }
    
    // If parentId is being updated, validate it
    if (updateData.parentId) {
      const parentCategory = await PortfolioCategory.findOne({ 
        id: parseInt(updateData.parentId), 
        isActive: true 
      });
      
      if (!parentCategory) {
        return res.status(400).json({
          success: false,
          message: 'Invalid parent category ID'
        });
      }
      
      // Prevent circular reference
      if (parseInt(updateData.parentId) === parseInt(id)) {
        return res.status(400).json({
          success: false,
          message: 'Category cannot be its own parent'
        });
      }
    }
    
    // Update category
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'parentId') {
          category[key] = updateData[key] ? parseInt(updateData[key]) : null;
        } else if (key === 'featured') {
          category[key] = Boolean(updateData[key]);
        } else if (key === 'order') {
          category[key] = parseInt(updateData[key]) || 0;
        } else if (typeof updateData[key] === 'string') {
          category[key] = updateData[key].trim();
        } else {
          category[key] = updateData[key];
        }
      }
    });
    
    await category.save();
    
    res.json({
      success: true,
      message: 'Portfolio category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating portfolio category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating portfolio category',
      error: error.message
    });
  }
});

// Delete portfolio category
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await PortfolioCategory.findOne({ id: parseInt(id) });
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio category not found'
      });
    }
    
    // Check if category has portfolios
    const Portfolio = (await import('../models/Portfolio.js')).default;
    const portfoliosCount = await Portfolio.countDocuments({ 
      categoryId: parseInt(id), 
      isActive: true 
    });
    
    if (portfoliosCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${portfoliosCount} active portfolio(s).`
      });
    }
    
    // Check if category has subcategories
    const subcategoriesCount = await PortfolioCategory.countDocuments({ 
      parentId: parseInt(id), 
      isActive: true 
    });
    
    if (subcategoriesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. It has ${subcategoriesCount} active subcategory(ies).`
      });
    }
    
    // Soft delete by setting isActive to false
    category.isActive = false;
    await category.save();
    
    res.json({
      success: true,
      message: 'Portfolio category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting portfolio category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting portfolio category',
      error: error.message
    });
  }
});

export default router;