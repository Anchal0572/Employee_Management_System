const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

const router = express.Router();

// Enforce authentication on all AI routes
router.use(protect);

/**
 * AI HR Assistant Q&A (Accessible to all authenticated employees and admins)
 * Enforces RBAC & prompt guardrails internally.
 */
router.post('/assistant/chat', aiController.chatWithAssistant);

/**
 * Knowledge Base Document Registry (Accessible to all authenticated users)
 */
router.get('/knowledge/documents', aiController.getKnowledgeDocuments);

/**
 * Admin-Only AI Intelligence Endpoints
 */
router.get('/insights/dashboard', authorize('admin'), aiController.getDashboardInsights);
router.get('/insights/attendance', authorize('admin'), aiController.getAttendanceInsights);
router.get('/insights/leaves', authorize('admin'), aiController.getLeaveInsights);
router.post('/knowledge/reindex', authorize('admin'), aiController.reindexKnowledge);

module.exports = router;
