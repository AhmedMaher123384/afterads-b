import express from 'express';
import componentController from '../Controller/themecrdcontrooler.js'; // ✅ صححت الاسم

console.log('✅ ThemeCard router loaded');

const router = express.Router();

router.get('/', componentController.getAllComponents);
router.get('/:id', componentController.getComponentById);
router.post('/', componentController.createComponent);
router.put('/:id', componentController.updateComponent);
router.delete('/:id', componentController.deleteComponent);
router.post('/bulk-delete', componentController.bulkDeleteComponents);
router.patch('/update-order', componentController.updateDisplayOrder);

export default router; 