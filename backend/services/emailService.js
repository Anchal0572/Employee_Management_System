const nodemailer = require('nodemailer');
const config = require('../config/env');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  /**
   * Initialize Nodemailer transporter with connection fallback
   */
  createTransporter() {
    if (config.email.user && config.email.pass) {
      return nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465,
        auth: {
          user: config.email.user,
          pass: config.email.pass
        }
      });
    }

    // Development / Test simulation transporter
    return {
      sendMail: async (mailOptions) => {
        if (config.isDevelopment || config.isTest) {
          console.log(`[EmailService:Simulated] To: ${mailOptions.to} | Subject: "${mailOptions.subject}"`);
        }
        return {
          messageId: `simulated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          response: '250 Message accepted (Simulated Dispatch)',
          simulated: true,
          ...mailOptions
        };
      }
    };
  }

  /**
   * Base email dispatch method
   * @param {object} options - { to, subject, html, text }
   */
  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: config.email.from || 'EMS Portal <no-reply@ems.corp>',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>?/gm, '')
      };

      const info = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: info.messageId, simulated: !!info.simulated };
    } catch (error) {
      console.error(`[EmailService Error] Failed to send email to ${to}:`, error.message);
      // Fail gracefully so background tasks don't crash the server
      return { success: false, error: error.message };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // HTML EMAIL TEMPLATE GENERATORS
  // ─────────────────────────────────────────────────────────────────────────

  wrapHtmlLayout(title, contentHtml) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; line-height: 1.5; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
          .header { background: #0f172a; padding: 24px 32px; text-align: left; }
          .header h1 { color: #ffffff; margin: 0; font-size: 18px; font-weight: 700; letter-spacing: -0.025em; }
          .header span { color: #818cf8; font-size: 12px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; display: block; margin-bottom: 4px; }
          .content { padding: 32px; }
          .footer { background: #f8fafc; border-top: 1px solid #f1f5f9; padding: 20px 32px; text-align: center; font-size: 12px; color: #64748b; }
          .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 13px; margin-top: 16px; }
          .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .tag { display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
          .tag-approved { background: #dcfce7; color: #166534; }
          .tag-pending { background: #fef3c7; color: #92400e; }
          .tag-rejected { background: #fee2e2; color: #991b1b; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <span>Enterprise Workforce Platform</span>
            <h1>${title}</h1>
          </div>
          <div class="content">
            ${contentHtml}
          </div>
          <div class="footer">
            <p>© 2026 EMS Corporation. All rights reserved.</p>
            <p style="margin-top: 4px;">This is an automated system notification. Please do not reply directly to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * 1. Welcome Email
   */
  async sendWelcomeEmail(employee) {
    const title = 'Welcome to the Team!';
    const content = `
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Welcome aboard, ${employee.firstName || employee.name}!</h2>
      <p style="color: #475569; font-size: 14px;">
        We are thrilled to welcome you to the <strong>${employee.department}</strong> department as our new <strong>${employee.designation}</strong>.
      </p>
      <div class="card">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Employee ID:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${employee.employeeId}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Corporate Email:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${employee.email}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Joining Date:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${new Date(employee.joiningDate || Date.now()).toLocaleDateString()}</td>
          </tr>
        </table>
      </div>
      <p style="color: #475569; font-size: 13px;">
        Your corporate profile and timesheet are ready. Please log in to your employee portal to check your schedule and configure your profile.
      </p>
      <a href="${config.clientUrl}/login" class="btn">Log In to Employee Portal &rarr;</a>
    `;

    return this.sendEmail({
      to: employee.email,
      subject: `Welcome to the Team, ${employee.firstName || employee.name}! - EMS Portal`,
      html: this.wrapHtmlLayout(title, content)
    });
  }

  /**
   * 2. Leave Submission Notification (to HR / Admin)
   */
  async sendLeaveSubmissionEmail(leave, employee, adminEmail = 'admin@ems.corp') {
    const title = 'New Leave Application Submitted';
    const content = `
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Leave Request Awaiting Review</h2>
      <p style="color: #475569; font-size: 14px;">
        <strong>${leave.employeeName || employee?.name}</strong> has submitted a new leave application that requires HR authorization.
      </p>
      <div class="card">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Leave Type:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${leave.leaveType} Leave</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Duration:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''} (${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Reason:</strong></td>
            <td style="padding: 6px 0; color: #0f172a; font-style: italic;">"${leave.reason}"</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Status:</strong></td>
            <td style="padding: 6px 0;"><span class="tag tag-pending">Pending Review</span></td>
          </tr>
        </table>
      </div>
      <a href="${config.clientUrl}/leaves" class="btn">Review Application in EMS &rarr;</a>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `Action Required: Leave Application from ${leave.employeeName || employee?.name}`,
      html: this.wrapHtmlLayout(title, content)
    });
  }

  /**
   * 3. Leave Approval Notification (to Employee)
   */
  async sendLeaveApprovalEmail(leave, employee, reviewerName = 'HR Administration') {
    const toEmail = employee?.email || leave.employeeEmail || 'employee@ems.corp';
    const title = 'Leave Request Approved';
    const content = `
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Great news! Your leave is approved.</h2>
      <p style="color: #475569; font-size: 14px;">
        Your formal request for <strong>${leave.leaveType} Leave</strong> has been reviewed and approved by <strong>${reviewerName}</strong>.
      </p>
      <div class="card">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Status:</strong></td>
            <td style="padding: 6px 0;"><span class="tag tag-approved">Approved</span></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Leave Period:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${new Date(leave.startDate).toLocaleDateString()} &rarr; ${new Date(leave.endDate).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Total Days:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">${leave.totalDays} day${leave.totalDays > 1 ? 's' : ''}</td>
          </tr>
          ${leave.adminComment ? `
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Reviewer Note:</strong></td>
            <td style="padding: 6px 0; color: #0f172a;">"${leave.adminComment}"</td>
          </tr>` : ''}
        </table>
      </div>
      <p style="color: #475569; font-size: 13px;">Your leave balance has been automatically reconciled.</p>
      <a href="${config.clientUrl}/leaves" class="btn">View Leave Status &rarr;</a>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `Approved: Your ${leave.leaveType} Leave Request (${leave.totalDays} days)`,
      html: this.wrapHtmlLayout(title, content)
    });
  }

  /**
   * 4. Leave Rejection Notification (to Employee)
   */
  async sendLeaveRejectionEmail(leave, employee, reviewerName = 'HR Administration', adminComment = '') {
    const toEmail = employee?.email || leave.employeeEmail || 'employee@ems.corp';
    const title = 'Leave Request Update';
    const content = `
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Leave Application Decision</h2>
      <p style="color: #475569; font-size: 14px;">
        Your request for <strong>${leave.leaveType} Leave</strong> (${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}) was reviewed by <strong>${reviewerName}</strong> and could not be approved at this time.
      </p>
      <div class="card">
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Status:</strong></td>
            <td style="padding: 6px 0;"><span class="tag tag-rejected">Rejected</span></td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b;"><strong>Reason for Decision:</strong></td>
            <td style="padding: 6px 0; color: #991b1b; font-weight: 500;">"${adminComment || leave.adminComment || 'Operational scheduling conflict'}"</td>
          </tr>
        </table>
      </div>
      <p style="color: #475569; font-size: 13px;">If you have any questions, please reach out to your HR business partner.</p>
      <a href="${config.clientUrl}/leaves" class="btn">Go to Leave Management &rarr;</a>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `Update on your ${leave.leaveType} Leave Application`,
      html: this.wrapHtmlLayout(title, content)
    });
  }

  /**
   * 5. Payslip Generated Notification (to Employee)
   */
  async sendPayslipGeneratedEmail(payslip, employee) {
    const toEmail = employee?.email || payslip.employeeEmail || 'employee@ems.corp';
    const title = 'Your Monthly Payslip is Ready';
    const content = `
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Payslip Generated for ${payslip.salaryMonth}</h2>
      <p style="color: #475569; font-size: 14px;">
        Your authoritative payslip for the pay period <strong>${payslip.salaryMonth}</strong> has been finalized and processed by finance.
      </p>
      <div class="card">
        <div style="font-size: 12px; color: #64748b;">Net Take-Home Pay</div>
        <div style="font-size: 28px; font-weight: 700; color: #0f172a; margin: 4px 0 12px;">$${Number(payslip.netSalary || 0).toLocaleString()}</div>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Gross Earnings:</td>
            <td style="padding: 4px 0; text-align: right; font-weight: 600;">$${Number(payslip.grossSalary || 0).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Total Deductions & Tax:</td>
            <td style="padding: 4px 0; text-align: right; color: #e11d48; font-weight: 600;">-$${Number((payslip.totalDeductions || 0) + (payslip.tax || 0)).toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Payment Status:</td>
            <td style="padding: 4px 0; text-align: right;"><span class="tag tag-approved">${payslip.paymentStatus || 'Processing'}</span></td>
          </tr>
        </table>
      </div>
      <a href="${config.clientUrl}/payroll/${payslip._id || payslip.id || ''}" class="btn">View & Download Payslip &rarr;</a>
    `;

    return this.sendEmail({
      to: toEmail,
      subject: `Payslip Available for ${payslip.salaryMonth} - EMS Payroll`,
      html: this.wrapHtmlLayout(title, content)
    });
  }

  /**
   * 6. Attendance Reminder Notification (to Employee)
   */
  async sendAttendanceReminderEmail(employee) {
    const title = 'Daily Shift Reminder';
    const content = `
      <h2 style="font-size: 18px; color: #0f172a; margin-top: 0;">Good morning, ${employee.firstName || employee.name}!</h2>
      <p style="color: #475569; font-size: 14px;">
        This is a friendly reminder to log your check-in for today's work shift on the EMS portal.
      </p>
      <div class="card">
        <p style="margin: 0; font-size: 13px; color: #475569;">
          Standard working shift: <strong>09:00 AM – 06:00 PM</strong><br/>
          Punctual logging ensures accurate timesheets and effortless monthly payroll verification.
        </p>
      </div>
      <a href="${config.clientUrl}/attendance" class="btn">Punch In Now &rarr;</a>
    `;

    return this.sendEmail({
      to: employee.email,
      subject: `Reminder: Please Record Your Attendance for Today - EMS`,
      html: this.wrapHtmlLayout(title, content)
    });
  }
}

module.exports = new EmailService();
