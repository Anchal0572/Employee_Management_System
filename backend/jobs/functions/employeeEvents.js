const inngest = require('../inngestClient');
const emailService = require('../../services/emailService');
const notificationService = require('../../services/notificationService');

/**
 * Handle Employee Created Event
 * Dispatches welcome email and internal onboarding notification
 */
const onEmployeeCreated = inngest.createFunction(
  { id: 'ems-on-employee-created', name: 'On Employee Created' },
  { event: 'ems/employee.created' },
  async ({ event, step }) => {
    const { employee } = event.data;
    if (!employee || !employee.email) {
      return { skipped: true, reason: 'No employee data or email provided' };
    }

    // Step 1: Send Welcome Email
    const emailResult = await step.run('send-welcome-email', async () => {
      return await emailService.sendWelcomeEmail(employee);
    });

    // Step 2: Create In-App Notification
    const notifResult = await step.run('create-welcome-notification', async () => {
      return await notificationService.createNotification({
        recipient: employee._id || employee.id,
        recipientRole: 'employee',
        recipientEmail: employee.email,
        title: 'Welcome to EMS!',
        message: `Welcome aboard ${employee.name || employee.firstName}! Your corporate account has been set up in ${employee.department}.`,
        type: 'employee',
        link: '/profile'
      });
    });

    return { success: true, emailResult, notifResult };
  }
);

module.exports = {
  onEmployeeCreated
};
