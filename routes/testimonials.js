import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Testimonial from '../models/Testimonial.js';

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
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Only one image per testimonial
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('فقط ملفات الصور مسموحة!'), false);
    }
  }
});

const uploadImage = upload.single('image');

const router = express.Router();

// Get all testimonials
router.get('/', async (req, res) => {
  try {
    const { search, limit, page } = req.query;
    let testimonials;
    
    if (search) {
      // Text search
      testimonials = await Testimonial.searchByText(search);
    } else {
      // Get all active testimonials with simple sorting
      testimonials = await Testimonial.findActive();
    }
    
    // Pagination with smaller default limit for performance
    const limitNum = Math.min(parseInt(limit) || 10, 20); // Max 20 items per page
    const pageNum = parseInt(page) || 1;
    const skip = (pageNum - 1) * limitNum;
    
    const total = testimonials.length;
    
    // Convert base64 images to URLs for better performance
    const optimizedTestimonials = testimonials.map(testimonial => {
      const testimonialObj = testimonial.toObject ? testimonial.toObject() : testimonial;
      
      // If image is base64, convert to a placeholder or URL
      if (testimonialObj.image && testimonialObj.image.startsWith('data:')) {
        testimonialObj.image = `/api/testimonials/${testimonialObj.id}/image`;
      }
      
      return testimonialObj;
    });
    
    const paginatedTestimonials = optimizedTestimonials.slice(skip, skip + limitNum);
    const totalPages = Math.ceil(total / limitNum);
    
    // Always return consistent format
    res.json({
      testimonials: paginatedTestimonials,
      total,
      page: pageNum,
      totalPages,
      hasNext: pageNum < totalPages,
      hasPrev: pageNum > 1
    });
    
    console.log(`✅ Found ${testimonials.length} testimonials`);
  } catch (error) {
    console.error('❌ Error fetching testimonials:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Get testimonial image by ID
router.get('/:id/image', async (req, res) => {
  try {
    const testimonial = await Testimonial.findOne({ id: parseInt(req.params.id) });
    
    if (!testimonial) {
      return res.status(404).json({ error: 'Testimonial not found' });
    }
    
    if (!testimonial.image) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // Handle both old base64 format and new file path format
    if (testimonial.image.startsWith('data:')) {
      // Legacy base64 format
      const matches = testimonial.image.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ error: 'Invalid image format' });
      }
      
      const contentType = matches[1];
      const base64Data = matches[2];
      const imageBuffer = Buffer.from(base64Data, 'base64');
      
      res.set({
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length,
        'Cache-Control': 'public, max-age=31536000' // Cache for 1 year
      });
      
      res.send(imageBuffer);
    } else {
      // New file path format - redirect to static file serving
      const imagePath = `/images/${testimonial.image}`;
      res.redirect(imagePath);
    }
  } catch (error) {
    console.error('❌ Error fetching testimonial image:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get testimonial by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('📄 Fetching testimonial by ID:', id);
    
    const testimonial = await Testimonial.findOne({ id: parseInt(id) });
    
    if (!testimonial) {
      return res.status(404).json({ 
        error: 'Testimonial not found',
        message: `No testimonial found with ID: ${id}`
      });
    }
    
    res.json({ testimonial });
    console.log(`✅ Found testimonial: ${testimonial.name}`);
  } catch (error) {
    console.error('❌ Error fetching testimonial:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Create new testimonial
router.post('/', uploadImage, async (req, res) => {
  try {
    console.log('📝 Creating new testimonial - req.body:', req.body);
    console.log('📝 req.body keys:', Object.keys(req.body));
    console.log('📝 req.body.name:', req.body.name);
    console.log('📝 req.body.testimonial:', req.body.testimonial);
    console.log('📁 Uploaded file:', req.file);
    
    const testimonialData = {
      name: req.body.name,
      position: req.body.position || '',
      testimonial: req.body.testimonial,
      rating: req.body.rating ? parseInt(req.body.rating) : 5,
      isActive: req.body.isActive !== undefined ? req.body.isActive === 'true' : true,
      featured: req.body.featured !== undefined ? req.body.featured === 'true' : false
    };
    
    console.log('📝 testimonialData:', testimonialData);
    
    // Handle image upload
    if (req.file) {
      testimonialData.image = `/images/${req.file.filename}`;
    }
    
    const newTestimonial = new Testimonial(testimonialData);
    const savedTestimonial = await newTestimonial.save();
    
    res.status(201).json({ 
      testimonial: savedTestimonial,
      message: 'Testimonial created successfully'
    });
    
    console.log(`✅ Created testimonial: ${savedTestimonial.name}`);
  } catch (error) {
    console.error('❌ Error creating testimonial:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Update testimonial
router.put('/:id', uploadImage, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Updating testimonial:', id, req.body);
    console.log('📁 Uploaded file:', req.file);
    
    const testimonial = await Testimonial.findOne({ id: parseInt(id) });
    
    if (!testimonial) {
      return res.status(404).json({ 
        error: 'Testimonial not found',
        message: `No testimonial found with ID: ${id}`
      });
    }
    
    // Update fields - allow all new fields
    const allowedFields = ['name', 'position', 'testimonial', 'rating', 'isActive', 'featured'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'rating') {
          testimonial[field] = parseInt(req.body[field]);
        } else if (field === 'isActive' || field === 'featured') {
          testimonial[field] = req.body[field] === 'true';
        } else {
          testimonial[field] = req.body[field];
        }
      }
    });
    
    // Handle image upload
    if (req.file) {
      testimonial.image = `/images/${req.file.filename}`;
    }
    
    const updatedTestimonial = await testimonial.save();
    
    res.json({ 
      testimonial: updatedTestimonial,
      message: 'Testimonial updated successfully'
    });
    
    console.log(`✅ Updated testimonial: ${updatedTestimonial.name}`);
  } catch (error) {
    console.error('❌ Error updating testimonial:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        message: error.message,
        details: error.errors
      });
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Delete testimonial
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Deleting testimonial:', id);
    
    const testimonial = await Testimonial.findOne({ id: parseInt(id) });
    
    if (!testimonial) {
      return res.status(404).json({ 
        error: 'Testimonial not found',
        message: `No testimonial found with ID: ${id}`
      });
    }
    
    await Testimonial.deleteOne({ id: parseInt(id) });
    
    res.json({ 
      message: 'Testimonial deleted successfully',
      deletedTestimonial: testimonial
    });
    
    console.log(`✅ Deleted testimonial: ${testimonial.name}`);
  } catch (error) {
    console.error('❌ Error deleting testimonial:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});



export default router;