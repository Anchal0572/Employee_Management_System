const express = require('express');
const healthController = require('../controllers/healthController');

const router = express.Router();

router.get('/', healthController.getHealth);
router.get('/details', healthController.getDetailedHealth);

module.exports = router;
