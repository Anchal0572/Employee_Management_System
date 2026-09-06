const inngest = require('./inngestClient');
const eventDispatcher = require('./eventDispatcher');

// Import all event-driven functions
const { onEmployeeCreated } = require('./functions/employeeEvents');
const { onLeaveSubmitted, onLeaveApproved, onLeaveRejected } = require('./functions/leaveEvents');
const { onPayslipGenerated } = require('./functions/payrollEvents');
const { dailyAttendanceReminder, monthlyPayslipProcessing } = require('./functions/cronJobs');

/**
 * Background jobs registry for EMS
 */
const functions = [
  onEmployeeCreated,
  onLeaveSubmitted,
  onLeaveApproved,
  onLeaveRejected,
  onPayslipGenerated,
  dailyAttendanceReminder,
  monthlyPayslipProcessing
];

module.exports = {
  inngest,
  functions,
  eventDispatcher
};
