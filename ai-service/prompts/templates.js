/**
 * Prompt Formatting Templates for RAG and AI Services
 */

function formatRAGPrompt({ query, contextText, userRole = 'employee', userName = 'Employee' }) {
  if (!contextText || contextText.trim().length === 0) {
    return `User Role: ${userRole} (${userName})
Question: ${query}

Note: No relevant company policy documentation was found in the knowledge base for this question.`;
  }

  return `COMPANY POLICY CONTEXT:
==================================================
${contextText}
==================================================

USER DETAILS:
- Role: ${userRole}
- Name: ${userName}

USER QUESTION:
${query}

INSTRUCTIONS:
Provide a clear, grounded response relying STRICTLY on the policy context above. Cite the relevant policy section or document when answering. If the context does not answer the question, clearly advise the user to contact HR.`;
}

function formatAttendanceAnalysisPrompt({ summaryStats, anomalies }) {
  return `Analyze the following aggregated workforce attendance data:
Total Records Analyzed: ${summaryStats.totalRecords}
Overall Attendance Rate: ${summaryStats.attendanceRate}%
Absenteeism Rate: ${summaryStats.absenteeismRate}%
Late Arrival Rate: ${summaryStats.lateArrivalRate}%

Detected Potential Anomalies:
${JSON.stringify(anomalies, null, 2)}

Generate structured insights covering:
1. Absenteeism trends
2. Punctuality patterns
3. Department variations
4. Advisory recommendations (non-punitive)`;
}

module.exports = {
  formatRAGPrompt,
  formatAttendanceAnalysisPrompt
};
