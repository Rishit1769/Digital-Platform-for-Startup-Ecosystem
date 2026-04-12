import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '2525'),
  auth: {
    user: process.env.SMTP_USER || 'test_user',
    pass: process.env.SMTP_PASS || 'test_pass',
  },
});

export const sendMail = async (to: string, subject: string, text: string, html?: string) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@ecosystem.app',
      to,
      subject,
      text,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendMeetingRequestedEmail = async (to: string, fromName: string, title: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>New Meeting Request</h2>
      <p>Hi there,</p>
      <p><strong>${fromName}</strong> has requested a meeting with you regarding: <em>${title}</em>.</p>
      <p>Please log in to your Ecosystem dashboard to review the proposed times and confirm.</p>
    </div>
  `;
  await sendMail(to, `Meeting Request: ${title}`, 'New Meeting Request', html);
};

export const sendMeetingStatusEmail = async (to: string, title: string, status: string, time?: string) => {
  const timeText = time ? `<p>Confirmed Time: <strong>${new Date(time).toLocaleString()}</strong></p>` : '';
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Meeting ${status.charAt(0).toUpperCase() + status.slice(1)}</h2>
      <p>Your meeting request "<em>${title}</em>" has been <strong>${status}</strong>.</p>
      ${timeText}
    </div>
  `;
  await sendMail(to, `Meeting ${status}: ${title}`, `Meeting ${status}`, html);
};

export const sendOfficeHourBookedEmail = async (to: string, studentName: string, date: string, time: string) => {
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Office Hour Booked</h2>
      <p>Hi,</p>
      <p><strong>${studentName}</strong> has booked an office hour with you on <strong>${date}</strong> safely at <strong>${time}</strong>.</p>
      <p>Log in to your dashboard to view details.</p>
    </div>
  `;
  await sendMail(to, 'New Office Hour Booking', 'New Office Hour Booking', html);
};
