import express from 'express';
import Comment from '../models/Comment.js';
import Product from '../models/Product.js';

const router = express.Router();

// Get all comments with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search, 
      productId, 
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query;
    
    let query = {};
    
    // Add filters if provided
    if (productId) {
      query.productId = parseInt(productId);
    }
    

    
    if (search) {
      query.$or = [
        { content: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    
    // Pagination
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const skip = (pageNum - 1) * limitNum;
    
    // Get total count for pagination
    const total = await Comment.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);
    
    // Get comments (show all comments regardless of approval status)
    const comments = await Comment.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Add product information to each comment
    const commentsWithProducts = await Promise.all(
      comments.map(async (comment) => {
        const product = await Product.findOne({ id: comment.productId });
        return {
          ...comment.toObject(),
          productName: product ? product.name : 'منتج غير موجود',
          productImage: product ? product.mainImage : null
        };
      })
    );

    res.json({
      comments: commentsWithProducts,
      total,
      page: pageNum,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Get comments for a specific product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get all comments for the product (no approval filter)
    const query = { productId: parseInt(productId) };
    
    const comments = await Comment.find(query)
      .sort({ createdAt: -1 });
    
    // Add product information to each comment
    const commentsWithProducts = await Promise.all(
      comments.map(async (comment) => {
        const product = await Product.findOne({ id: comment.productId });
        return {
          ...comment.toObject(),
          productName: product ? product.name : 'منتج غير موجود',
          productImage: product ? product.mainImage : null
        };
      })
    );
    
    res.json(commentsWithProducts);
  } catch (error) {
    console.error('Error fetching product comments:', error);
    res.status(500).json({ error: 'Failed to fetch product comments' });
  }
});

// Get a single comment by ID
router.get('/:id', async (req, res) => {
  try {
    const comment = await Comment.findOne({ id: parseInt(req.params.id) });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json(comment);
  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
});

// Create a new comment
router.post('/', async (req, res) => {
  try {
    const { productId, userId, userName, userEmail, content, rating } = req.body;
    
    // Validation
    if (!productId || !userId || !userName || !userEmail || !content) {
      return res.status(400).json({ 
        error: 'Missing required fields: productId, userId, userName, userEmail, content' 
      });
    }
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5' 
      });
    }
    
    const comment = new Comment({
      productId: parseInt(productId),
      userId: parseInt(userId),
      userName,
      userEmail,
      content,
      rating: rating ? parseInt(rating) : undefined,
      isApproved: false // Comments need approval by default
    });
    
    await comment.save();
    
    res.status(201).json(comment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

// Toggle comment approval status


// Update a comment
router.put('/:id', async (req, res) => {
  try {
    const { content, rating } = req.body;
    
    const comment = await Comment.findOne({ id: parseInt(req.params.id) });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (content) comment.content = content;
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
      comment.rating = parseInt(rating);
    }
    
    comment.updatedAt = new Date();
    
    await comment.save();
    
    res.json(comment);
  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
router.delete('/:id', async (req, res) => {
  try {
    const comment = await Comment.findOneAndDelete({ _id: req.params.id });
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;