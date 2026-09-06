const inngest = require('../inngestClient');
const emailService = require('../../services/emailService');
const notificationService = require('../../services/notificationService');

/**
 * Handle Payslip Generated Event
 * Dispatches notification and payslip ready email to the employee
 */
const onPayslipGenerated = inngest.createFunction(
  { id: 'ems-on-payslip-generated', name: 'On Payslip Generated' },
  { event: 'ems/payslip.generated' },
  async ({ event, step }) => {
    const { payslip, employee } = event.data;

    // Step 1: In-App Notification
    const notifResult = await step.run('notify-employee-payslip-generated', async () => {
      return await notificationService.createNotification({
        recipient: payslip.employee || employee?._id,
        recipientRole: 'employee',
        recipientEmail: employee?.email || payslip.employeeEmail,
        title: `Payslip Issued for ${payslip.salaryMonth}`,
        message: `Your net salary of $${Number(payslip.netSalary || 0).toLocaleString()} for ${payslip.salaryMonth} has been calculated and is available to view.`,
        type: 'payroll',
        link: `/payroll/${payslip._id || payslip.id}`
      });
    });

    // Step 2: Email Notification
    const emailResult = await step.run('email-employee-payslip-generated', async () => {
      return await emailService.sendPayslipGeneratedEmail(payslip, employee);
    });

    return { success: true, notifResult, emailResult };
  }
);

module.exports = {
  onPayslipGenerated
};
