const inngest = require('./inngestClient');

/**
 * Event-Driven Asynchronous Dispatcher
 * Safely dispatches events to Inngest background workers in a fire-and-forget
 * manner so HTTP controllers NEVER wait for long-running email/notification processes.
 */
class EventDispatcher {
  /**
   * Dispatch an asynchronous event
   * @param {string} name - Event name (e.g. 'ems/employee.created')
   * @param {object} data - Event payload data
   */
  dispatch(name, data = {}) {
    // Non-blocking asynchronous execution via setImmediate / background promise
    setImmediate(async () => {
      try {
        await inngest.send({
          name,
          data,
          ts: Date.now()
        });
        if (process.env.NODE_ENV !== 'test') {
          console.log(`[Inngest:EventEmitted] -> "${name}"`);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.warn(`[Inngest Dispatch Error] Could not dispatch event "${name}":`, err.message);
        }
      }
    });
  }

  // Helper convenience methods for standard EMS events
  employeeCreated(employee) {
    this.dispatch('ems/employee.created', { employee });
  }

  leaveSubmitted(leave, employee) {
    this.dispatch('ems/leave.submitted', { leave, employee });
  }

  leaveApproved(leave, employee, reviewerName) {
    this.dispatch('ems/leave.approved', { leave, employee, reviewerName });
  }

  leaveRejected(leave, employee, reviewerName, adminComment) {
    this.dispatch('ems/leave.rejected', { leave, employee, reviewerName, adminComment });
  }

  payslipGenerated(payslip, employee) {
    this.dispatch('ems/payslip.generated', { payslip, employee });
  }

  attendanceReminder(employee) {
    this.dispatch('ems/attendance.reminder', { employee });
  }
}

module.exports = new EventDispatcher();
