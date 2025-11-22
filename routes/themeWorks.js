import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ThemeWork from '../models/ThemeWork.js';

const router = express.Router();

// محاكاة __dirname في ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// إعدادات Multer لرفع الصور الثلاث
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
    fileSize: 10 * 1024 * 1024, // 10MB لكل ملف
    files: 4
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('فقط ملفات الصور مسموحة!'), false);
    }
  }
});

const uploadThreeImages = upload.fields([
  { name: 'imageMobile', maxCount: 1 },
  { name: 'imageTablet', maxCount: 1 },
  { name: 'imageDesktop', maxCount: 1 },
  { name: 'clientImage', maxCount: 1 }
]);

// GET: جلب الأعمال مع ترقيم الصفحات
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      isActive,
      sortBy = 'workDate',
      sortOrder = 'desc'
    } = req.query;

    const query = {};
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const items = await ThemeWork.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ThemeWork.countDocuments(query);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching theme works:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب الأعمال', error: error.message });
  }
});

// GET: عنصر محدد بالمعرف العددي
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ThemeWork.findOne({ id: parseInt(id) });
    if (!item) {
      return res.status(404).json({ success: false, message: 'العنصر غير موجود' });
    }
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Error fetching theme work:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب العنصر', error: error.message });
  }
});

// POST: إنشاء عنصر جديد بثلاث صور + رابط + رأي العميل + تاريخ
router.post('/', (req, res) => {
  uploadThreeImages(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const files = req.files || {};
      const mobile = files.imageMobile?.[0];
      const tablet = files.imageTablet?.[0];
      const desktop = files.imageDesktop?.[0];

      if (!mobile || !tablet || !desktop) {
        return res.status(400).json({ success: false, message: 'يجب رفع ثلاث صور: للهاتف والتابلت والكمبيوتر' });
      }

      const { link, clientOpinion, clientName, workDate } = req.body;
      const clientImageFile = files.clientImage?.[0];

      const item = new ThemeWork({
        imageMobile: `/images/${mobile.filename}`,
        imageTablet: `/images/${tablet.filename}`,
        imageDesktop: `/images/${desktop.filename}`,
        link: (link || '').trim(),
        clientOpinion: (clientOpinion || '').trim(),
        clientName: (clientName || '').trim(),
        clientImage: clientImageFile ? `/images/${clientImageFile.filename}` : null,
        workDate: workDate ? new Date(workDate) : Date.now(),
        isActive: true
      });

      await item.save();
      res.status(201).json({ success: true, message: 'تم إنشاء العنصر بنجاح', data: item });
    } catch (error) {
      console.error('Error creating theme work:', error);
      res.status(500).json({ success: false, message: 'خطأ في إنشاء العنصر', error: error.message });
    }
  });
});

// PUT: تحديث عنصر، مع إمكانية استبدال أي من الصور الثلاث
router.put('/:id', (req, res) => {
  uploadThreeImages(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      const { id } = req.params;
      const item = await ThemeWork.findOne({ id: parseInt(id) });
      if (!item) {
        return res.status(404).json({ success: false, message: 'العنصر غير موجود' });
      }

      const files = req.files || {};
      const mobile = files.imageMobile?.[0];
      const tablet = files.imageTablet?.[0];
      const desktop = files.imageDesktop?.[0];
      const clientImageFile = files.clientImage?.[0];

      const updateData = {};
      if (mobile) updateData.imageMobile = `/images/${mobile.filename}`;
      if (tablet) updateData.imageTablet = `/images/${tablet.filename}`;
      if (desktop) updateData.imageDesktop = `/images/${desktop.filename}`;

      const { link, clientOpinion, clientName, workDate, isActive } = req.body;
      if (link !== undefined) updateData.link = (link || '').trim();
      if (clientOpinion !== undefined) updateData.clientOpinion = (clientOpinion || '').trim();
      if (clientName !== undefined) updateData.clientName = (clientName || '').trim();
      if (workDate !== undefined) updateData.workDate = workDate ? new Date(workDate) : item.workDate;
      if (isActive !== undefined) updateData.isActive = (isActive === 'true' || isActive === true);
      if (clientImageFile) updateData.clientImage = `/images/${clientImageFile.filename}`;

      const updated = await ThemeWork.findOneAndUpdate(
        { id: parseInt(id) },
        updateData,
        { new: true, runValidators: true }
      );

      res.json({ success: true, message: 'تم تحديث العنصر بنجاح', data: updated });
    } catch (error) {
      console.error('Error updating theme work:', error);
      res.status(500).json({ success: false, message: 'خطأ في تحديث العنصر', error: error.message });
    }
  });
});

// DELETE: حذف منطقي (إلغاء التفعيل)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ThemeWork.findOne({ id: parseInt(id) });
    if (!item) {
      return res.status(404).json({ success: false, message: 'العنصر غير موجود' });
    }
    item.isActive = false;
    await item.save();
    res.json({ success: true, message: 'تم حذف العنصر (إلغاء التفعيل) بنجاح' });
  } catch (error) {
    console.error('Error deleting theme work:', error);
    res.status(500).json({ success: false, message: 'خطأ في حذف العنصر', error: error.message });
  }
});

export default router;