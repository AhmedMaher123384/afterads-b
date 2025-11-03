import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

console.log('Wishlist router loaded successfully');

// Get user's wishlist
router.get('/user/:userId/wishlist', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const wishlistItems = await Wishlist.find({ userId }).sort({ createdAt: -1 });
    
    // Populate product details
    const wishlistWithProducts = await Promise.all(
      wishlistItems.map(async (item) => {
        const product = await Product.findOne({ id: item.productId });
        return {
          ...item.toObject(),
          product: product || null
        };
      })
    );
    
    res.json({
      success: true,
      data: wishlistWithProducts
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحميل قائمة المفضلة',
      error: error.message
    });
  }
});

// Add item to wishlist
router.post('/user/:userId/wishlist', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, productName, price, image } = req.body;
    
    // Check if product exists
    const product = await Product.findOne({ id: parseInt(productId) });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }
    
    // Check if item already exists in wishlist
    const existingItem = await Wishlist.findOne({ 
      userId, 
      productId: parseInt(productId)
    });
    
    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: 'المنتج موجود بالفعل في المفضلة'
      });
    }
    
    // Create new wishlist item
    const wishlistItem = new Wishlist({
      userId,
      productId: parseInt(productId),
      productName: productName || product.name,
      price: price || product.price,
      image: image || product.mainImage || ''
    });
    
    await wishlistItem.save();
    
    res.json({
      success: true,
      message: 'تم إضافة المنتج إلى المفضلة بنجاح',
      data: await getUpdatedWishlist(userId)
    });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في إضافة المنتج للمفضلة',
      error: error.message
    });
  }
});

// Check if product is in wishlist
router.get('/user/:userId/wishlist/check/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    const existingItem = await Wishlist.findOne({ 
      userId, 
      productId: parseInt(productId)
    });
    
    res.json({
      success: true,
      data: {
        inWishlist: !!existingItem,
        item: existingItem || null
      }
    });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في فحص المفضلة',
      error: error.message
    });
  }
});

// Clear wishlist
console.log('Registering DELETE /user/:userId/wishlist route');
router.delete('/user/:userId/wishlist', async (req, res) => {
  console.log('DELETE /user/:userId/wishlist route called');
  try {
    const { userId } = req.params;
    
    await Wishlist.deleteMany({ userId });
    
    res.json({
      success: true,
      message: 'تم تفريغ المفضلة بنجاح',
      data: []
    });
  } catch (error) {
    console.error('Error clearing wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تفريغ المفضلة',
      error: error.message
    });
  }
});

// Remove item from wishlist
router.delete('/user/:userId/wishlist/product/:productId', async (req, res) => {
  try {
    const { userId, productId } = req.params;
    
    const result = await Wishlist.deleteOne({ 
      userId, 
      productId: parseInt(productId)
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود في المفضلة'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف المنتج من المفضلة',
      data: await getUpdatedWishlist(userId)
    });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في حذف المنتج من المفضلة',
      error: error.message
    });
  }
});

// Helper function to get updated wishlist
async function getUpdatedWishlist(userId) {
  const wishlistItems = await Wishlist.find({ userId }).sort({ createdAt: -1 });
  
  const wishlistWithProducts = await Promise.all(
    wishlistItems.map(async (item) => {
      const product = await Product.findOne({ id: item.productId });
      return {
        ...item.toObject(),
        product: product || null
      };
    })
  );
  
  return wishlistWithProducts;
}

export default router;