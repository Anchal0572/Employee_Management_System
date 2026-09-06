const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const {
  ragService,
  attendanceInsightsService,
  leaveInsightsService,
  employeeInsightsService,
  llmProvider
} = require('../services');
const { retrievalEngine } = require('../retrieval/retrievalEngine');
const { vectorStore } = require('../retrieval/vectorStore');
const { guardrails } = require('../prompts/guardrails');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health Check
app.get('/api/ai/health', (req, res) => {
  const stats = vectorStore.getStats();
  res.status(200).json({
    success: true,
    service: 'ems-ai-service',
    status: 'operational',
    provider: process.env.LLM_PROVIDER || 'mock-intelligent-engine',
    knowledgeBase: stats
  });
});

// Standalone Policy Q&A Assistant
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history, user } = req.body;
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Question message is required.' });
    }

    const result = await ragService.answerQuery({
      query: message,
      user: user || { role: 'employee' },
      history: history || []
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Standalone Attendance Insights
app.post('/api/ai/insights/attendance', (req, res) => {
  try {
    const { attendanceRecords, employees } = req.body;
    const insights = attendanceInsightsService.generateInsights(attendanceRecords || [], employees || []);
    res.status(200).json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Standalone Leave Insights
app.post('/api/ai/insights/leaves', (req, res) => {
  try {
    const { leaves, employees } = req.body;
    const insights = leaveInsightsService.generateInsights(leaves || [], employees || []);
    res.status(200).json({ success: true, data: insights });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// List Indexed Knowledge Documents
app.get('/api/ai/documents', (req, res) => {
  try {
    const docs = ragService.getIndexedDocuments();
    res.status(200).json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Re-index Knowledge Documents
app.post('/api/ai/reindex', (req, res) => {
  try {
    const stats = ragService.reindexDocuments();
    res.status(200).json({ success: true, message: 'Knowledge base re-indexed successfully.', data: stats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🧠 EMS AI Service running on port ${PORT}`);
  });
}

module.exports = {
  app,
  ragService,
  attendanceInsightsService,
  leaveInsightsService,
  employeeInsightsService,
  retrievalEngine,
  vectorStore,
  llmProvider,
  guardrails
};
