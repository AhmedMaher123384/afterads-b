import express from 'express';
import Portfolio from '../models/Portfolio.js';
import PortfolioCategory from '../models/PortfolioCategory.js';

const router = express.Router();

// Get all portfolios
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      featured, 
      search, 
      status,
      technology,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { isActive: true };
    
    // Filter by category
    if (category) {
      query.categoryId = parseInt(category);
    }
    
    // Filter by featured
    if (featured === 'true') {
      query.featured = true;
    }
    
    // Filter by status
    if (status) {
      query.status = status;
    }
    
    // Filter by technology
    if (technology) {
      query.technologies = { $in: [technology] };
    }
    
    // Search by text
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { technologies: { $in: [new RegExp(search, 'i')] } },
        { client: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const portfolios = await Portfolio.find(query)
      .populate('category', 'name description color icon')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Portfolio.countDocuments(query);
    
    res.json({
      success: true,
      data: portfolios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching portfolios:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolios',
      error: error.message
    });
  }
});

// Get featured portfolios
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const portfolios = await Portfolio.find({ 
      featured: true,
      isActive: true
    })
    .populate('category', 'name description color icon')
    .sort({ order: 1, createdAt: -1 })
    .limit(parseInt(limit));
    
    res.json({
      success: true,
      data: portfolios
    });
  } catch (error) {
    console.error('Error fetching featured portfolios:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured portfolios',
      error: error.message
    });
  }
});

// Get portfolios by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Check if category exists
    console.log('Looking for category with id:', parseInt(categoryId));
    const category = await PortfolioCategory.findOne({ 
      id: parseInt(categoryId)
    });
    console.log('Found category:', category);
    
    // If not found by custom id, try by _id
    if (!category) {
      const categoryById = await PortfolioCategory.findById(categoryId);
      console.log('Found category by _id:', categoryById);
    }
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio category not found'
      });
    }
    
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    const portfolios = await Portfolio.find({ 
      categoryId: parseInt(categoryId), 
      isActive: true 
    })
    .populate('category', 'name description color icon')
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));
    
    const total = await Portfolio.countDocuments({ 
      categoryId: parseInt(categoryId), 
      isActive: true 
    });
    
    res.json({
      success: true,
      data: portfolios,
      category,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching portfolios by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolios by category',
      error: error.message
    });
  }
});

// Search portfolios
router.get('/search', async (req, res) => {
  try {
    const { 
      q: searchQuery, 
      page = 1, 
      limit = 20,
      category,
      technology,
      status
    } = req.query;
    
    if (!searchQuery) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = { 
      isActive: true,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { technologies: { $in: [new RegExp(searchQuery, 'i')] } },
        { client: { $regex: searchQuery, $options: 'i' } }
      ]
    };
    
    // Additional filters
    if (category) {
      query.categoryId = parseInt(category);
    }
    
    if (technology) {
      query.technologies = { $in: [technology] };
    }
    
    if (status) {
      query.status = status;
    }
    
    const portfolios = await Portfolio.find(query)
      .populate('category', 'name description color icon')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Portfolio.countDocuments(query);
    
    res.json({
      success: true,
      data: portfolios,
      searchQuery,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching portfolios:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching portfolios',
      error: error.message
    });
  }
});

// Get portfolio by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const portfolio = await Portfolio.findOne({ 
      id: parseInt(id), 
      isActive: true 
    }).populate('category', 'name description color icon');
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching portfolio',
      error: error.message
    });
  }
});

// Create new portfolio
router.post('/', async (req, res) => {
  console.log('POST /api/portfolios called with body:', req.body);
  try {
    const {
      title,
      description,
      categoryId,
      mainImage,
      images,
      projectUrl,
      githubUrl,
      technologies,
      client,
      duration,
      status,
      featured,
      order,
      seoTitle,
      seoDescription,
      metaTitle,
      metaDescription
    } = req.body;
    
    // Validate required fields
    if (!title || !description || !categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, and category are required'
      });
    }
    
    // Check if category exists
    console.log('Looking for category with id:', parseInt(categoryId));
    const category = await PortfolioCategory.findOne({ 
      id: parseInt(categoryId)
    });
    console.log('Found category:', category);
    
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category ID'
      });
    }
    
    // Get next ID
    const lastPortfolio = await Portfolio.findOne().sort({ id: -1 });
    const nextId = lastPortfolio ? lastPortfolio.id + 1 : 1;
    
    // Create portfolio
    const portfolio = new Portfolio({
      id: nextId,
      title: title.trim(),
      description: description.trim(),
      categoryId: parseInt(categoryId),
      mainImage: mainImage?.trim() || '',
      images: images || [],
      projectUrl: projectUrl?.trim() || '',
      githubUrl: githubUrl?.trim() || '',
      technologies: technologies || [],
      client: client?.trim() || '',
      duration: duration?.trim() || '',
      status: status || 'completed',
      featured: Boolean(featured),
      order: parseInt(order) || 0,
      seoTitle: seoTitle?.trim() || '',
      seoDescription: seoDescription?.trim() || '',
      metaTitle: metaTitle?.trim() || '',
      metaDescription: metaDescription?.trim() || ''
    });
    
    await portfolio.save();
    
    // Populate category before sending response
    await portfolio.populate('category', 'name description color icon');
    
    res.status(201).json({
      success: true,
      message: 'Portfolio created successfully',
      data: portfolio
    });
  } catch (error) {
    console.error('Error creating portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating portfolio',
      error: error.message
    });
  }
});

// Update portfolio
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Find portfolio
    const portfolio = await Portfolio.findOne({ id: parseInt(id) });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    // If categoryId is being updated, validate it
    if (updateData.categoryId) {
      const category = await PortfolioCategory.findOne({ 
        id: parseInt(updateData.categoryId)
      });
      
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category ID'
        });
      }
    }
    
    // Update portfolio
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'categoryId') {
          portfolio[key] = parseInt(updateData[key]);
        } else if (key === 'featured') {
          portfolio[key] = Boolean(updateData[key]);
        } else if (key === 'order') {
          portfolio[key] = parseInt(updateData[key]) || 0;
        } else if (typeof updateData[key] === 'string') {
          portfolio[key] = updateData[key].trim();
        } else {
          portfolio[key] = updateData[key];
        }
      }
    });
    
    await portfolio.save();
    
    // Populate category before sending response
    await portfolio.populate('category', 'name description color icon');
    
    res.json({
      success: true,
      message: 'Portfolio updated successfully',
      data: portfolio
    });
  } catch (error) {
    console.error('Error updating portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating portfolio',
      error: error.message
    });
  }
});

// Delete portfolio
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const portfolio = await Portfolio.findOne({ id: parseInt(id) });
    
    if (!portfolio) {
      return res.status(404).json({
        success: false,
        message: 'Portfolio not found'
      });
    }
    
    // Soft delete by setting isActive to false
    portfolio.isActive = false;
    await portfolio.save();
    
    res.json({
      success: true,
      message: 'Portfolio deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting portfolio:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting portfolio',
      error: error.message
    });
  }
});

export default router;