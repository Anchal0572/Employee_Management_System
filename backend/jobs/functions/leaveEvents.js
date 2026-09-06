const inngest = require('../inngestClient');
const emailService = require('../../services/emailService');
const notificationService = require('../../services/notificationService');

/**
 * 1. On Leave Submitted Event
 * Dispatches notification and email to HR / Administrators
 */
const onLeaveSubmitted = inngest.createFunction(
  { id: 'ems-on-leave-submitted', name: 'On Leave Submitted' },
  { event: 'ems/leave.submitted' },
  async ({ event, step }) => {
    const { leave, employee } = event.data;

    // Step 1: In-App notification for Admin role
    const notifResult = await step.run('notify-admins-leave-submitted', async () => {
      return await notificationService.createNotification({
        recipientRole: 'admin',
        title: 'New Leave Application',
        message: `${leave.employeeName} submitted a ${leave.leaveType} leave request for ${leave.totalDays} day(s).`,
        type: 'leave',
        link: '/leaves'
      });
    });

    // Step 2: Email alert to HR
    const emailResult = await step.run('email-admin-leave-submitted', async () => {
      return await emailService.sendLeaveSubmissionEmail(leave, employee);
    });

    return { success: true, notifResult, emailResult };
  }
);

/**
 * 2. On Leave Approved Event
 * Dispatches notification and approval email to the Employee
 */
const onLeaveApproved = inngest.createFunction(
  { id: 'ems-on-leave-approved', name: 'On Leave Approved' },
  { event: 'ems/leave.approved' },
  async ({ event, step }) => {
    const { leave, employee, reviewerName } = event.data;

    const notifResult = await step.run('notify-employee-leave-approved', async () => {
      return await notificationService.createNotification({
        recipient: leave.employee || employee?._id,
        recipientRole: 'employee',
        recipientEmail: employee?.email || leave.employeeEmail,
        title: 'Leave Request Approved',
        message: `Your ${leave.leaveType} leave (${leave.totalDays} days) has been approved by ${reviewerName || 'HR Administration'}.`,
        type: 'leave',
        link: '/leaves'
      });
    });

    const emailResult = await step.run('email-employee-leave-approved', async () => {
      return await emailService.sendLeaveApprovalEmail(leave, employee, reviewerName);
    });

    return { success: true, notifResult, emailResult };
  }
);

/**
 * 3. On Leave Rejected Event
 * Dispatches notification and decision email to the Employee
 */
const onLeaveRejected = inngest.createFunction(
  { id: 'ems-on-leave-rejected', name: 'On Leave Rejected' },
  { event: 'ems/leave.rejected' },
  async ({ event, step }) => {
    const { leave, employee, reviewerName, adminComment } = event.data;

    const notifResult = await step.run('notify-employee-leave-rejected', async () => {
      return await notificationService.createNotification({
        recipient: leave.employee || employee?._id,
        recipientRole: 'employee',
        recipientEmail: employee?.email || leave.employeeEmail,
        title: 'Leave Request Rejected',
        message: `Your ${leave.leaveType} leave request was reviewed by ${reviewerName || 'HR Administration'} and rejected.${adminComment ? ` Reason: "${adminComment}"` : ''}`,
        type: 'leave',
        link: '/leaves'
      });
    });

    const emailResult = await step.run('email-employee-leave-rejected', async () => {
      return await emailService.sendLeaveRejectionEmail(leave, employee, reviewerName, adminComment);
    });

    return { success: true, notifResult, emailResult };
  }
);

module.exports = {
  onLeaveSubmitted,
  onLeaveApproved,
  onLeaveRejected
};
