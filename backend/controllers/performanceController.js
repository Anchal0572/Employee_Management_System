const performanceService = require('../services/performanceService');
const asyncHandler = require('../utils/asyncHandler');

class PerformanceController {
  getGoals = asyncHandler(async (req, res) => {
    const { quarter, status } = req.query;
    const result = await performanceService.getGoals({
      user: req.user,
      quarter,
      status
    });

    res.status(200).json({
      success: true,
      data: result.goals,
      scorecard: result.scorecard
    });
  });

  createGoal = asyncHandler(async (req, res) => {
    const goal = await performanceService.createGoal(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Performance Goal & OKR created successfully',
      data: goal
    });
  });

  updateGoal = asyncHandler(async (req, res) => {
    const goal = await performanceService.updateGoal(req.params.id, req.body, req.user);
    res.status(200).json({
      success: true,
      message: 'Goal progress and feedback updated successfully',
      data: goal
    });
  });
}

module.exports = new PerformanceController();
