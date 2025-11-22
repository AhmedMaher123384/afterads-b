// routes/announcementBar.routes.js
import express from 'express';
import announcementBarController from '../Controller/announcementcontroller.js';
const router = express.Router();

router.post('', announcementBarController.createAnnouncementBar);
router.get('/active', announcementBarController.getActiveAnnouncementBar);
router.get('', announcementBarController.getAllAnnouncementBars);
router.get('/:id', announcementBarController.getAnnouncementBarById);
router.put('/:id', announcementBarController.updateAnnouncementBar);
router.delete('/:id', announcementBarController.deleteAnnouncementBar);
router.patch('/:id/toggle', announcementBarController.toggleAnnouncementBar);

export default router;