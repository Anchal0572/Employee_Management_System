/**
 * AI Attendance Insights Service
 * 
 * Analyzes employee attendance records for:
 * - Unusual absenteeism patterns
 * - Frequent late arrivals (post-grace period)
 * - Attendance trend shifts across periods
 * - Department-level punctuality patterns
 * 
 * Generates explainable, advisory-only insights for HR administrators.
 */

class AttendanceInsightsService {
  /**
   * Generates actionable attendance insights
   * @param {Array<object>} attendanceRecords - List of attendance entries
   * @param {Array<object>} employees - List of employee objects
   * @returns {Array<object>} Structured AI insights
   */
  generateInsights(attendanceRecords = [], employees = []) {
    const insights = [];
    const now = new Date();

    if (!attendanceRecords || attendanceRecords.length === 0) {
      return [
        {
          id: 'att-info-001',
          category: 'attendance',
          title: 'Insufficient Attendance Data',
          insight: 'Not enough attendance entries logged in the selected timeframe to extract statistical trends.',
          supportingMetric: '0 records evaluated',
          severity: 'low',
          recommendation: 'Ensure employees register regular digital clock-ins via the attendance portal.',
          generatedAt: now.toISOString()
        }
      ];
    }

    const total = attendanceRecords.length;
    let presentCount = 0;
    let lateCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;

    const dayOfWeekAbsences = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }; // Mon-Fri
    const dayOfWeekTotal = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const empLateCounts = new Map();
    const deptAttendance = {};

    attendanceRecords.forEach(rec => {
      const status = (rec.status || 'present').toLowerCase();
      const date = rec.date ? new Date(rec.date) : new Date();
      const day = date.getDay();

      if (day >= 1 && day <= 5) {
        dayOfWeekTotal[day] = (dayOfWeekTotal[day] || 0) + 1;
        if (status === 'absent') {
          dayOfWeekAbsences[day] = (dayOfWeekAbsences[day] || 0) + 1;
        }
      }

      if (status === 'present') presentCount++;
      else if (status === 'absent') absentCount++;
      else if (status === 'late') {
        lateCount++;
        const empKey = rec.employeeName || rec.employeeId || 'Unknown';
        empLateCounts.set(empKey, (empLateCounts.get(empKey) || 0) + 1);
      } else if (status === 'half-day') halfDayCount++;

      // Department tracking
      const dept = rec.department || 'General';
      if (!deptAttendance[dept]) {
        deptAttendance[dept] = { total: 0, present: 0, late: 0, absent: 0 };
      }
      deptAttendance[dept].total++;
      if (status === 'present') deptAttendance[dept].present++;
      if (status === 'late') deptAttendance[dept].late++;
      if (status === 'absent') deptAttendance[dept].absent++;
    });

    const attendanceRate = Math.round((presentCount / total) * 100);
    const lateRate = Math.round((lateCount / total) * 100);
    const absentRate = Math.round((absentCount / total) * 100);

    // 1. Pattern: Overall Punctuality & Late Arrivals
    if (lateRate >= 12) {
      insights.push({
        id: 'att-late-001',
        category: 'attendance',
        title: 'Elevated Late Arrival Frequency',
        insight: `Late arrival rate is currently at ${lateRate}%, which exceeds the healthy organization threshold (8%).`,
        supportingMetric: `${lateCount} late clock-ins logged out of ${total} total records (${lateRate}%)`,
        severity: 'medium',
        recommendation: 'Send an automated reminder regarding the 15-minute grace period (up to 09:15 AM) and review commute constraints.',
        generatedAt: now.toISOString()
      });
    } else {
      insights.push({
        id: 'att-late-002',
        category: 'attendance',
        title: 'Healthy Punctuality Index',
        insight: `Overall late arrival rate remains well-controlled at ${lateRate}%, comfortably within standard tolerance.`,
        supportingMetric: `${presentCount + lateCount} on-time/grace check-ins out of ${total} (${100 - absentRate}%)`,
        severity: 'low',
        recommendation: 'Maintain existing schedule policies and acknowledge teams maintaining consistent punctuality.',
        generatedAt: now.toISOString()
      });
    }

    // 2. Pattern: Monday/Friday Absenteeism Clustering
    const monRate = dayOfWeekTotal[1] ? Math.round((dayOfWeekAbsences[1] / dayOfWeekTotal[1]) * 100) : 0;
    const midWeekAbsences = (dayOfWeekAbsences[2] + dayOfWeekAbsences[3] + dayOfWeekAbsences[4]);
    const midWeekTotal = (dayOfWeekTotal[2] + dayOfWeekTotal[3] + dayOfWeekTotal[4]);
    const midWeekRate = midWeekTotal ? Math.round((midWeekAbsences / midWeekTotal) * 100) : 0;

    if (monRate > midWeekRate + 10) {
      insights.push({
        id: 'att-abs-001',
        category: 'attendance',
        title: 'Monday Absenteeism Discrepancy',
        insight: `Absenteeism rate on Mondays (${monRate}%) is noticeably higher than mid-week averages (${midWeekRate}%).`,
        supportingMetric: `Monday Absence: ${monRate}% vs Mid-week Average: ${midWeekRate}%`,
        severity: 'medium',
        recommendation: 'Evaluate if project sprints starting on Mondays are contributing to fatigue; consider flexible Monday hybrid options.',
        generatedAt: now.toISOString()
      });
    }

    // 3. Pattern: Department-Level Variations
    const deptKeys = Object.keys(deptAttendance);
    if (deptKeys.length > 1) {
      let lowestDept = null;
      let lowestRate = 100;

      deptKeys.forEach(dept => {
        const stats = deptAttendance[dept];
        if (stats.total >= 3) {
          const rate = Math.round((stats.present / stats.total) * 100);
          if (rate < lowestRate) {
            lowestRate = rate;
            lowestDept = dept;
          }
        }
      });

      if (lowestDept && lowestRate < 85) {
        insights.push({
          id: 'att-dept-001',
          category: 'attendance',
          title: `Department Trend: ${lowestDept}`,
          insight: `${lowestDept} has an attendance compliance rate of ${lowestRate}%, lower than organizational average (${attendanceRate}%).`,
          supportingMetric: `${lowestDept}: ${lowestRate}% attendance rate vs Org Avg: ${attendanceRate}%`,
          severity: lowestRate < 75 ? 'high' : 'medium',
          recommendation: `Engage with the ${lowestDept} manager to understand specific operational challenges or project delivery crunch periods.`,
          generatedAt: now.toISOString()
        });
      }
    }

    // 4. Pattern: Overall Workforce Attendance Trend
    if (attendanceRate >= 90) {
      insights.push({
        id: 'att-trend-001',
        category: 'attendance',
        title: 'Robust Overall Attendance',
        insight: `Workforce attendance is strong at ${attendanceRate}%, indicating high team engagement and operational stability.`,
        supportingMetric: `${presentCount} verified present records (${attendanceRate}%)`,
        severity: 'low',
        recommendation: 'Continue current wellness programs and ensure timely recognition of consistent contributors.',
        generatedAt: now.toISOString()
      });
    } else {
      insights.push({
        id: 'att-trend-002',
        category: 'attendance',
        title: 'Attendance Rate Below Optimal Benchmark',
        insight: `Overall attendance rate is ${attendanceRate}%, falling slightly beneath the recommended 92% benchmark.`,
        supportingMetric: `Current Rate: ${attendanceRate}% (Target: 92%+)`,
        severity: 'medium',
        recommendation: 'Check seasonal illness patterns and review pending leave applications that may not yet be reconciled.',
        generatedAt: now.toISOString()
      });
    }

    return insights;
  }
}

const defaultAttendanceInsightsService = new AttendanceInsightsService();
module.exports = {
  AttendanceInsightsService,
  attendanceInsightsService: defaultAttendanceInsightsService
};
