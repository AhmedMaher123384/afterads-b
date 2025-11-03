import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';
import Category from '../models/Category.js';

const router = express.Router();

// محاكاة __dirname في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعدادات Multer لرفع الصور
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/images/');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 20
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('فقط ملفات الصور مسموحة!'), false);
    }
  }
});

// Middleware للتعامل مع جميع أنواع الملفات
const uploadFiles = upload.any();

// Get all products
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      featured, 
      search, 
      minPrice, 
      maxPrice, 
      productType,
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
    
    // Filter by product type
    if (productType) {
      query.productType = productType;
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Search by text
    if (search) {
      query.$text = { $search: search };
    }
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find(query)
      .populate('category')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add hasRequiredOptions field to each product
    const productsWithRequiredOptions = products.map(product => {
      const productObj = product.toObject();
      productObj.hasRequiredOptions = product.productOptions && 
        product.productOptions.some(option => option.required);
      return productObj;
    });
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products: productsWithRequiredOptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get featured products
router.get('/featured', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const products = await Product.findFeatured()
      .populate('category')
      .limit(parseInt(limit));
    
    // Add hasRequiredOptions field to each product
    const productsWithRequiredOptions = products.map(product => {
      const productObj = product.toObject();
      productObj.hasRequiredOptions = product.productOptions && 
        product.productOptions.some(option => option.required);
      return productObj;
    });
    
    res.json(productsWithRequiredOptions);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get products by category
router.get('/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.findByCategory(parseInt(categoryId))
      .populate('category')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add hasRequiredOptions field to each product
    const productsWithRequiredOptions = products.map(product => {
      const productObj = product.toObject();
      productObj.hasRequiredOptions = product.productOptions && 
        product.productOptions.some(option => option.required);
      return productObj;
    });
    
    const total = await Product.countDocuments({ 
      categoryId: parseInt(categoryId), 
      isActive: true 
    });
    
    res.json({
      products: productsWithRequiredOptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get products by subcategory
router.get('/subcategory/:subcategoryId', async (req, res) => {
  try {
    const { subcategoryId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort options
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const products = await Product.find({ 
      subcategoryId: parseInt(subcategoryId), 
      isActive: true 
    })
      .populate('category')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add hasRequiredOptions field to each product
    const productsWithRequiredOptions = products.map(product => {
      const productObj = product.toObject();
      productObj.hasRequiredOptions = product.productOptions && 
        product.productOptions.some(option => option.required);
      return productObj;
    });
    
    const total = await Product.countDocuments({ 
      subcategoryId: parseInt(subcategoryId), 
      isActive: true 
    });
    
    res.json({
      products: productsWithRequiredOptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products by subcategory:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        error: 'Search query required',
        message: 'Please provide a search query'
      });
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const products = await Product.searchByText(q)
      .populate('category')
      .skip(skip)
      .limit(parseInt(limit));
    
    // Add hasRequiredOptions field to each product
    const productsWithRequiredOptions = products.map(product => {
      const productObj = product.toObject();
      productObj.hasRequiredOptions = product.productOptions && 
        product.productOptions.some(option => option.required);
      return productObj;
    });
    
    const total = await Product.countDocuments({ 
      $text: { $search: q }, 
      isActive: true 
    });
    
    res.json({
      products: productsWithRequiredOptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get unavailable products
router.get('/unavailable', async (req, res) => {
  try {
    const products = await Product.findUnavailable()
      .populate('category');
    
    // Add hasRequiredOptions field to each product
    const productsWithRequiredOptions = products.map(product => {
      const productObj = product.toObject();
      productObj.hasRequiredOptions = product.productOptions && 
        product.productOptions.some(option => option.required);
      return productObj;
    });
    
    res.json(productsWithRequiredOptions);
  } catch (error) {
    console.error('Error fetching unavailable products:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get available products
router.get('/available', async (req, res) => {
  try {
    const products = await Product.findAvailable()
      .populate('category');
    
    // Add hasRequiredOptions field to each product
    const productsWithRequiredOptions = products.map(product => {
      const productObj = product.toObject();
      productObj.hasRequiredOptions = product.productOptions && 
        product.productOptions.some(option => option.required);
      return productObj;
    });
    
    res.json(productsWithRequiredOptions);
  } catch (error) {
    console.error('Error fetching available products:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({ id: parseInt(id), isActive: true })
      .populate('category');
    
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: 'Product with this ID does not exist or is inactive'
      });
    }
    
    // Add hasRequiredOptions field to the product
    const productObj = product.toObject();
    productObj.hasRequiredOptions = product.productOptions && 
      product.productOptions.some(option => option.required);
    
    res.json(productObj);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Create new product
router.post('/', uploadFiles, async (req, res) => {
  try {
    console.log('🔍 Backend received req.body:', req.body);
    console.log('🔍 Backend received req.files:', req.files);
    
    const {
      name,
      name_ar,
      name_en,
      shortDescription,
      shortDescription_ar,
      shortDescription_en,
      description,
      description_ar,
      description_en,
      price,
      originalPrice,
      isAvailable,
      categoryId,
      subcategoryId,
      mainImage,
      detailedImages,
      featured,
      tags,
      seoTitle,
      seoTitle_ar,
      seoTitle_en,
      seoDescription,
      seoDescription_ar,
      seoDescription_en,
      metaTitle,
      metaTitle_ar,
      metaTitle_en,
      metaDescription,
      metaDescription_ar,
      metaDescription_en,
      faqs,
      addOns,
      productOptions
    } = req.body;
    
    console.log('🔍 Extracted fields:');
    console.log('  name:', name);
    console.log('  description:', description);
    console.log('  price:', price);
    console.log('  categoryId:', categoryId);
    console.log('Received subcategoryId:', subcategoryId, 'Type:', typeof subcategoryId);
    
    // Validate required fields
    if (!name || !description || !price || !categoryId || categoryId === '' || categoryId === 'null' || categoryId === 'undefined') {
      console.log('❌ Validation failed - missing required fields');
      console.log('  name:', name);
      console.log('  description:', description);
      console.log('  price:', price);
      console.log('  categoryId:', categoryId);
      return res.status(400).json({ 
        error: 'Validation error',
        message: 'Name, description, price, and category are required'
      });
    }
    
    // Check if category exists
    const category = await Category.findOne({ id: parseInt(categoryId), isActive: true });
    if (!category) {
      return res.status(400).json({ 
        error: 'Invalid category',
        message: 'Category does not exist or is inactive'
      });
    }
    
    // Process uploaded files
    let processedMainImage = mainImage || '';
    let processedDetailedImages = detailedImages || [];
    
    if (req.files && req.files.length > 0) {
      console.log('🔍 Processing uploaded files:', req.files.length);
      
      // Find main image file
      const mainImageFile = req.files.find(file => file.fieldname === 'mainImage');
      if (mainImageFile) {
        processedMainImage = mainImageFile.filename;
        console.log('✅ Main image processed:', processedMainImage);
      }
      
      // Find detailed images files
      const detailedImageFiles = req.files.filter(file => file.fieldname === 'detailedImages');
      if (detailedImageFiles.length > 0) {
        processedDetailedImages = detailedImageFiles.map(file => file.filename);
        console.log('✅ Detailed images processed:', processedDetailedImages);
      }
    }

    // Get the next ID
    const lastProduct = await Product.findOne().sort({ id: -1 });
    const nextId = lastProduct ? lastProduct.id + 1 : 1;
    
    const subcategoryIdValue = subcategoryId ? parseInt(subcategoryId) : null;
    console.log('Processed subcategoryId:', subcategoryIdValue);
    console.log('About to create product with subcategoryId:', subcategoryIdValue);
    
    // Debug: Log the data being used to create the product
    console.log('🔍 Creating product with data:');
    console.log('  - id:', nextId);
    console.log('  - name:', name);
    console.log('  - name_ar:', name_ar);
    console.log('  - name_en:', name_en);
    console.log('  - description:', description);
    console.log('  - description_ar:', description_ar);
    console.log('  - description_en:', description_en);
    console.log('  - price:', parseFloat(price));
    console.log('  - categoryId:', parseInt(categoryId));
    console.log('  - subcategoryId:', subcategoryIdValue);
    console.log('  - mainImage:', processedMainImage);
    console.log('  - detailedImages:', processedDetailedImages);
    console.log('  - featured:', featured);
    console.log('  - tags:', tags);
    console.log('  - faqs:', faqs);
    console.log('  - addOns:', addOns);

    const newProduct = new Product({
      id: nextId,
      name,
      name_ar: name_ar || '',
      name_en: name_en || '',
      shortDescription,
      shortDescription_ar: shortDescription_ar || '',
      shortDescription_en: shortDescription_en || '',
      description,
      description_ar: description_ar || '',
      description_en: description_en || '',
      price: parseFloat(price),
      originalPrice: originalPrice ? parseFloat(originalPrice) : null,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      categoryId: parseInt(categoryId),
      subcategoryId: subcategoryIdValue,
      mainImage: processedMainImage,
      detailedImages: processedDetailedImages,
      featured: featured || false,
      tags: tags || [],
      seoTitle,
      seoTitle_ar: seoTitle_ar || '',
      seoTitle_en: seoTitle_en || '',
      seoDescription,
      seoDescription_ar: seoDescription_ar || '',
      seoDescription_en: seoDescription_en || '',
      metaTitle,
      metaTitle_ar: metaTitle_ar || '',
      metaTitle_en: metaTitle_en || '',
      metaDescription,
      metaDescription_ar: metaDescription_ar || '',
      metaDescription_en: metaDescription_en || '',
      faqs: (() => {
        try {
          console.log('🔍 Raw faqs received:', faqs);
          const parsed = faqs ? (typeof faqs === 'string' ? JSON.parse(faqs) : faqs) : [];
          console.log('🔍 Parsed faqs:', JSON.stringify(parsed, null, 2));
          return parsed;
        } catch (error) {
          console.error('❌ Error parsing faqs:', error);
          console.log('faqs value:', faqs);
          return [];
        }
      })(),
      addOns: (() => {
        try {
          console.log('🔍 Raw addOns received:', addOns);
          const parsed = addOns ? (typeof addOns === 'string' ? JSON.parse(addOns) : addOns) : [];
          console.log('🔍 Parsed addOns:', JSON.stringify(parsed, null, 2));
          return parsed;
        } catch (error) {
          console.error('❌ Error parsing addOns:', error);
          console.log('addOns value:', addOns);
          return [];
        }
      })(),
      productOptions: (() => {
        try {
          console.log('🔍 Raw productOptions received:', productOptions);
          const parsed = productOptions ? (typeof productOptions === 'string' ? JSON.parse(productOptions) : productOptions) : [];
          console.log('🔍 Parsed productOptions:', JSON.stringify(parsed, null, 2));
          return parsed;
        } catch (error) {
          console.error('❌ Error parsing productOptions:', error);
          console.log('productOptions value:', productOptions);
          return [];
        }
      })()
    });
    
    console.log('newProduct.subcategoryId after creation:', newProduct.subcategoryId);
    console.log('🔍 Complete product object before save:', JSON.stringify(newProduct.toObject(), null, 2));
    
    const savedProduct = await newProduct.save();
    const populatedProduct = await Product.findOne({ id: savedProduct.id }).populate('category');
    
    res.status(201).json(populatedProduct);
  } catch (error) {
    console.error('❌ Error creating product:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    if (error.name === 'ValidationError') {
      console.error('❌ Validation errors details:');
      Object.keys(error.errors).forEach(field => {
        console.error(`  - ${field}: ${error.errors[field].message}`);
      });
      
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid product data',
        details: validationErrors
      });
    }
    
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        error: 'Duplicate error',
        message: `Product with this ${field} already exists`
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Update product
router.put('/:id', uploadFiles, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const product = await Product.findOne({ id: parseInt(id) });
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: 'Product with this ID does not exist'
      });
    }
    
    // If categoryId is being updated, check if it exists
    if (updateData.categoryId) {
      const category = await Category.findOne({ id: parseInt(updateData.categoryId), isActive: true });
      if (!category) {
        return res.status(400).json({ 
          error: 'Invalid category',
          message: 'Category does not exist or is inactive'
        });
      }
    }
    
    // Process uploaded files
    if (req.files && req.files.length > 0) {
      console.log('🔍 Processing uploaded files for update:', req.files.length);
      
      // Find main image file
      const mainImageFile = req.files.find(file => file.fieldname === 'mainImage');
      if (mainImageFile) {
        updateData.mainImage = mainImageFile.filename;
        console.log('✅ Main image updated:', updateData.mainImage);
      }
      
      // Find detailed images files
      const detailedImageFiles = req.files.filter(file => file.fieldname === 'detailedImages');
      if (detailedImageFiles.length > 0) {
        updateData.detailedImages = detailedImageFiles.map(file => file.filename);
        console.log('✅ Detailed images updated:', updateData.detailedImages);
      }
    }

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'price' || key === 'originalPrice') {
          product[key] = parseFloat(updateData[key]);
        } else if (key === 'categoryId') {
          product[key] = parseInt(updateData[key]);
        } else if (key === 'isAvailable') {
          product[key] = Boolean(updateData[key]);
        } else if (key === 'productOptions') {
          product[key] = typeof updateData[key] === 'string' ? JSON.parse(updateData[key]) : updateData[key];
        } else {
          product[key] = updateData[key];
        }
      }
    });
    
    console.log('Product object before save:', product);
    console.log('subcategoryId before save:', product.subcategoryId);
    
    const updatedProduct = await product.save();
    const populatedProduct = await Product.findOne({ id: updatedProduct.id }).populate('category');
    
    res.json(populatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid product data',
        details: validationErrors
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({ id: parseInt(id) });
    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        message: 'Product with this ID does not exist'
      });
    }
    
    await Product.deleteOne({ id: parseInt(id) });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

export default router;