const express = require('express');
const announcementController = require('../controllers/announcementController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', announcementController.getFeed);
router.post('/', authorize('admin'), announcementController.createAnnouncement);
router.delete('/:id', authorize('admin'), announcementController.deleteAnnouncement);

module.exports = router;
