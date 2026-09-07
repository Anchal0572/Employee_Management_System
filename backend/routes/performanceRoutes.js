const express = require('express');
const performanceController = require('../controllers/performanceController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/goals', performanceController.getGoals);
router.post('/goals', performanceController.createGoal);
router.put('/goals/:id', performanceController.updateGoal);

module.exports = router;
