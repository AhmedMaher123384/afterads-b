import express from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's cart
router.get('/user/:userId/cart', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const cartItems = await Cart.find({ userId }).sort({ createdAt: -1 });
    
    // Populate product details
    const cartWithProducts = await Promise.all(
      cartItems.map(async (item) => {
        const product = await Product.findOne({ id: item.productId });
        return {
          ...item.toObject(),
          product: product || null
        };
      })
    );
    
    // Calculate total
    const total = cartWithProducts.reduce((sum, item) => {
      return sum + (item.totalPrice || item.price * item.quantity);
    }, 0);
    
    res.json({
      success: true,
      data: {
        items: cartWithProducts,
        total
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحميل سلة التسوق',
      error: error.message
    });
  }
});

// Add item to cart
router.post('/user/:userId/cart', async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1, selectedOptions = {}, addOns = [] } = req.body;
    
    // Get product details
    const product = await Product.findOne({ id: parseInt(productId) });
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'المنتج غير موجود'
      });
    }
    
    // Check if item already exists in cart
    const existingItem = await Cart.findOne({ 
      userId, 
      productId: parseInt(productId),
      selectedOptions: selectedOptions
    });
    
    if (existingItem) {
      // Update quantity
      existingItem.quantity += parseInt(quantity);
      existingItem.totalPrice = existingItem.price * existingItem.quantity + existingItem.addOnsPrice;
      await existingItem.save();
      
      return res.json({
        success: true,
        message: 'تم تحديث كمية المنتج في السلة',
        data: await getUpdatedCart(userId)
      });
    }
    
    // Calculate prices
    const basePrice = product.price;
    const addOnsPrice = addOns.reduce((sum, addon) => sum + (addon.price || 0), 0);
    const totalPrice = (basePrice * parseInt(quantity)) + addOnsPrice;
    
    // Create new cart item
    const cartItem = new Cart({
      userId,
      productId: parseInt(productId),
      productName: product.name,
      price: basePrice,
      quantity: parseInt(quantity),
      image: product.mainImage || '',
      selectedOptions,
      addOns,
      basePrice,
      addOnsPrice,
      totalPrice
    });
    
    await cartItem.save();
    
    res.json({
      success: true,
      message: 'تم إضافة المنتج إلى السلة بنجاح',
      data: await getUpdatedCart(userId)
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في إضافة المنتج للسلة',
      error: error.message
    });
  }
});

// Update cart item
router.put('/user/:userId/cart/update-options', async (req, res) => {
  try {
    const { userId } = req.params;
    const { itemId, quantity, selectedOptions, addOns } = req.body;
    
    const cartItem = await Cart.findOne({ id: parseInt(itemId), userId });
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'عنصر السلة غير موجود'
      });
    }
    
    // Update item
    if (quantity !== undefined) {
      cartItem.quantity = parseInt(quantity);
    }
    if (selectedOptions !== undefined) {
      cartItem.selectedOptions = selectedOptions;
    }
    if (addOns !== undefined) {
      cartItem.addOns = addOns;
      cartItem.addOnsPrice = addOns.reduce((sum, addon) => sum + (addon.price || 0), 0);
    }
    
    // Recalculate total price
    cartItem.totalPrice = (cartItem.basePrice * cartItem.quantity) + cartItem.addOnsPrice;
    
    await cartItem.save();
    
    res.json({
      success: true,
      message: 'تم تحديث السلة بنجاح',
      data: await getUpdatedCart(userId)
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تحديث السلة',
      error: error.message
    });
  }
});

// Remove item from cart
router.delete('/user/:userId/cart/product/:itemId', async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    
    const result = await Cart.deleteOne({ id: parseInt(itemId), userId });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'عنصر السلة غير موجود'
      });
    }
    
    res.json({
      success: true,
      message: 'تم حذف المنتج من السلة',
      data: await getUpdatedCart(userId)
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في حذف المنتج من السلة',
      error: error.message
    });
  }
});

// Clear cart
router.delete('/user/:userId/cart', async (req, res) => {
  try {
    const { userId } = req.params;
    
    await Cart.deleteMany({ userId });
    
    res.json({
      success: true,
      message: 'تم تفريغ السلة بنجاح',
      data: {
        items: [],
        total: 0
      }
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في تفريغ السلة',
      error: error.message
    });
  }
});

// Helper function to get updated cart
async function getUpdatedCart(userId) {
  const cartItems = await Cart.find({ userId }).sort({ createdAt: -1 });
  
  const cartWithProducts = await Promise.all(
    cartItems.map(async (item) => {
      const product = await Product.findOne({ id: item.productId });
      return {
        ...item.toObject(),
        product: product || null
      };
    })
  );
  
  const total = cartWithProducts.reduce((sum, item) => {
    return sum + (item.totalPrice || item.price * item.quantity);
  }, 0);
  
  return {
    items: cartWithProducts,
    total
  };
}

export default router;