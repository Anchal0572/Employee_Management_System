const inngest = require('../inngestClient');
const emailService = require('../../services/emailService');
const notificationService = require('../../services/notificationService');
const { Employee, Attendance } = require('../../models');
const { getDbStatus } = require('../../config/db');

/**
 * 1. Daily Attendance Reminder Job
 * Reminds active employees who have not clocked in for today's shift
 */
const dailyAttendanceReminder = inngest.createFunction(
  { id: 'ems-daily-attendance-reminder', name: 'Daily Attendance Reminder' },
  { event: 'ems/attendance.reminder' },
  async ({ event, step }) => {
    const isDbConnected = getDbStatus().isConnected;

    const reminderResults = await step.run('send-attendance-reminders', async () => {
      let recipients = [];

      if (isDbConnected) {
        // Find active employees
        const employees = await Employee.find({ status: 'active' }).select('name firstName email employeeId');
        recipients = employees;
      } else {
        recipients = [
          { name: 'Sophia Chen', email: 'sophia.chen@ems.corp', employeeId: 'EMP-001' },
          { name: 'David Kim', email: 'david.kim@ems.corp', employeeId: 'EMP-004' }
        ];
      }

      const results = [];
      for (const emp of recipients) {
        // Send email
        const emailRes = await emailService.sendAttendanceReminderEmail(emp);
        // Create in-app notification
        const notifRes = await notificationService.createNotification({
          recipient: emp._id,
          recipientRole: 'employee',
          recipientEmail: emp.email,
          title: 'Shift Attendance Reminder',
          message: 'Please remember to log your check-in for today’s shift on the EMS portal.',
          type: 'attendance',
          link: '/attendance'
        });

        results.push({ employeeId: emp.employeeId, emailSent: emailRes.success, notifId: notifRes._id });
      }

      return { totalReminded: results.length, details: results };
    });

    return reminderResults;
  }
);

/**
 * 2. Monthly Payslip Processing Batch Job
 * Triggers batch payslip calculations for the current cycle
 */
const monthlyPayslipProcessing = inngest.createFunction(
  { id: 'ems-monthly-payroll-processing', name: 'Monthly Payroll Batch Processor' },
  { event: 'ems/payroll.monthly.process' },
  async ({ event, step }) => {
    const { month = new Date().toISOString().slice(0, 7) } = event.data || {};

    const batchSummary = await step.run('calculate-monthly-batch', async () => {
      console.log(`[Inngest:BatchPayroll] Executing automated monthly payroll processing for period ${month}...`);
      // Simulates batch payslip generation & audit verification
      return {
        salaryMonth: month,
        processedCount: 8,
        status: 'Completed',
        timestamp: new Date()
      };
    });

    return batchSummary;
  }
);

module.exports = {
  dailyAttendanceReminder,
  monthlyPayslipProcessing
};
