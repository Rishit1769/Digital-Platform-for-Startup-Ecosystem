"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOfficeHourBookedEmail = exports.sendMeetingStatusEmail = exports.sendMeetingRequestedEmail = exports.sendMail = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525'),
    auth: {
        user: process.env.SMTP_USER || 'test_user',
        pass: process.env.SMTP_PASS || 'test_pass',
    },
});
const sendMail = async (to, subject, text, html) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@cloudcampus.com',
            to,
            subject,
            text,
            html,
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    }
    catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};
exports.sendMail = sendMail;
const sendMeetingRequestedEmail = async (to, fromName, title) => {
    const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>New Meeting Request</h2>
      <p>Hi there,</p>
      <p><strong>${fromName}</strong> has requested a meeting with you regarding: <em>${title}</em>.</p>
      <p>Please log in to your CloudCampus dashboard to review the proposed times and confirm.</p>
    </div>
  `;
    await (0, exports.sendMail)(to, `Meeting Request: ${title}`, 'New Meeting Request', html);
};
exports.sendMeetingRequestedEmail = sendMeetingRequestedEmail;
const sendMeetingStatusEmail = async (to, title, status, time) => {
    const timeText = time ? `<p>Confirmed Time: <strong>${new Date(time).toLocaleString()}</strong></p>` : '';
    const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Meeting ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
      <p>Your meeting request "<em>${title}</em>" has been <strong>${status}</strong>.</p>
      ${timeText}
    </div>
  `;
    await (0, exports.sendMail)(to, `Meeting ${status}: ${title}`, `Meeting ${status}`, html);
};
exports.sendMeetingStatusEmail = sendMeetingStatusEmail;
const sendOfficeHourBookedEmail = async (to, studentName, date, time) => {
    const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Office Hour Booked</h2>
      <p>Hi,</p>
      <p><strong>${studentName}</strong> has booked an office hour with you on <strong>${date}</strong> safely at <strong>${time}</strong>.</p>
      <p>Log in to your dashboard to view details.</p>
    </div>
  `;
    await (0, exports.sendMail)(to, 'New Office Hour Booking', 'New Office Hour Booking', html);
};
exports.sendOfficeHourBookedEmail = sendOfficeHourBookedEmail;
