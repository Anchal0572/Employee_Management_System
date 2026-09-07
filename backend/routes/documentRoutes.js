const express = require('express');
const documentController = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', documentController.getDocuments);
router.post('/', documentController.uploadDocument);
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
