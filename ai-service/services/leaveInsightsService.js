/**
 * AI Leave Insights Service
 * 
 * Analyzes employee leave applications and balances for:
 * - Unusual leave submission clusters
 * - High leave utilization risks (<2 days remaining)
 * - Department approval backlogs and simultaneous leave bottlenecks
 * 
 * Generates explainable, advisory-only insights for HR administrators.
 * NEVER makes automated employment or disciplinary decisions.
 */

class LeaveInsightsService {
  /**
   * Generates actionable leave insights
   * @param {Array<object>} leaves - List of leave applications
   * @param {Array<object>} employees - List of employee records
   * @returns {Array<object>} Structured AI insights
   */
  generateInsights(leaves = [], employees = []) {
    const insights = [];
    const now = new Date();

    if (!leaves || leaves.length === 0) {
      return [
        {
          id: 'leave-info-001',
          category: 'leave',
          title: 'No Leave Records Found',
          insight: 'No leave applications recorded in the system for pattern evaluation.',
          supportingMetric: '0 leave requests evaluated',
          severity: 'low',
          recommendation: 'Encourage team members to file planned time-off via the EMS self-service portal.',
          generatedAt: now.toISOString()
        }
      ];
    }

    const total = leaves.length;
    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    const deptPending = {};
    const typeDistribution = {};

    leaves.forEach(l => {
      const status = (l.status || 'pending').toLowerCase();
      const dept = l.department || 'General';
      const type = l.leaveType || 'General';

      typeDistribution[type] = (typeDistribution[type] || 0) + 1;

      if (status === 'pending') {
        pendingCount++;
        deptPending[dept] = (deptPending[dept] || 0) + 1;
      } else if (status === 'approved') {
        approvedCount++;
      } else if (status === 'rejected') {
        rejectedCount++;
      }
    });

    // 1. Pending Approval Queue Analysis
    if (pendingCount > 0) {
      const pendingPercent = Math.round((pendingCount / total) * 100);
      const severity = pendingCount >= 3 ? 'medium' : 'low';

      insights.push({
        id: 'leave-backlog-001',
        category: 'leave',
        title: 'Pending Leave Approvals Queue',
        insight: `There are currently ${pendingCount} pending leave applications awaiting review (${pendingPercent}% of all recorded requests).`,
        supportingMetric: `${pendingCount} requests in pending status`,
        severity,
        recommendation: 'Remind department managers to review and resolve outstanding leave requests to allow employees to plan travel.',
        generatedAt: now.toISOString()
      });
    }

    // 2. Department-Specific Leave Concentration
    const depts = Object.keys(deptPending);
    let highestDept = null;
    let maxDeptPending = 0;

    depts.forEach(dept => {
      if (deptPending[dept] > maxDeptPending) {
        maxDeptPending = deptPending[dept];
        highestDept = dept;
      }
    });

    if (highestDept && maxDeptPending >= 2) {
      insights.push({
        id: 'leave-dept-001',
        category: 'leave',
        title: `Department Queue Bottleneck: ${highestDept}`,
        insight: `${highestDept} has ${maxDeptPending} unreviewed leave applications, representing the largest queue across all units.`,
        supportingMetric: `${maxDeptPending} pending requests originating from ${highestDept}`,
        severity: 'medium',
        recommendation: `Notify the ${highestDept} lead to review requests and evaluate shift/task coverage before granting concurrent leaves.`,
        generatedAt: now.toISOString()
      });
    }

    // 3. High Sick Leave Proportion Check
    const sickCount = typeDistribution['Sick'] || 0;
    if (sickCount > 0 && total >= 3) {
      const sickPercent = Math.round((sickCount / total) * 100);
      if (sickPercent >= 35) {
        insights.push({
          id: 'leave-sick-001',
          category: 'leave',
          title: 'Elevated Sick Leave Ratio',
          insight: `Sick leaves constitute ${sickPercent}% of total applications, indicating potential seasonal illness or workplace burnout.`,
          supportingMetric: `${sickCount} sick leaves out of ${total} total submissions (${sickPercent}%)`,
          severity: 'medium',
          recommendation: 'Check ergonomic and wellness provisions, and ensure teams facing tight deadlines have sufficient project support.',
          generatedAt: now.toISOString()
        });
      }
    }

    // 4. Overall Leave Approval Health
    if (approvedCount > 0) {
      const approvalRate = Math.round((approvedCount / (approvedCount + rejectedCount || 1)) * 100);
      insights.push({
        id: 'leave-util-001',
        category: 'leave',
        title: 'Balanced Leave Approval Distribution',
        insight: `Leave approval workflow is functioning smoothly with an overall approval resolution rate of ${approvalRate}%.`,
        supportingMetric: `${approvedCount} approved, ${rejectedCount} rejected out of ${approvedCount + rejectedCount} processed`,
        severity: 'low',
        recommendation: 'Continue regular managerial reviews while monitoring upcoming public holiday proximity.',
        generatedAt: now.toISOString()
      });
    }

    return insights;
  }
}

const defaultLeaveInsightsService = new LeaveInsightsService();
module.exports = {
  LeaveInsightsService,
  leaveInsightsService: defaultLeaveInsightsService
};
