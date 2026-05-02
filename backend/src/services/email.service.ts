import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'apikey',
    pass: process.env.SMTP_PASS,
  },
});

const fromEmail = process.env.FROM_EMAIL || 'noreply@trustlance.com';

export const sendVerificationEmail = async (
  email: string,
  otp: string,
  name: string
): Promise<void> => {
  await transporter.sendMail({
    from: `"TrustLance" <${fromEmail}>`,
    to: email,
    subject: 'Verify Your TrustLance Account',
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1A6B4A; font-size: 28px;">Welcome to TrustLance, ${name}!</h1>
        <p style="color: #3A3A3A; font-size: 16px; line-height: 1.6;">
          Your verification code is:
        </p>
        <div style="background: #EEF8F3; border: 2px solid #1A6B4A; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1A6B4A;">${otp}</span>
        </div>
        <p style="color: #6B6B6B; font-size: 14px;">This code expires in 15 minutes. Do not share it with anyone.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">
        <p style="color: #6B6B6B; font-size: 12px;">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string,
  name: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/forgot-password?token=${resetToken}`;
  await transporter.sendMail({
    from: `"TrustLance" <${fromEmail}>`,
    to: email,
    subject: 'Reset Your TrustLance Password',
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #1A6B4A; font-size: 28px;">Password Reset, ${name}</h1>
        <p style="color: #3A3A3A; font-size: 16px; line-height: 1.6;">
          Click the button below to reset your password. This link expires in 15 minutes.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" style="background: #1A6B4A; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 16px;">
            Reset Password
          </a>
        </div>
        <p style="color: #6B6B6B; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
};

export const sendAutoReleaseWarning = async (
  email: string,
  name: string,
  hoursRemaining: number,
  jobTitle: string,
  amount: number
): Promise<void> => {
  await transporter.sendMail({
    from: `"TrustLance" <${fromEmail}>`,
    to: email,
    subject: `⚠️ Auto-Release in ${hoursRemaining}h — ${jobTitle}`,
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <h1 style="color: #D4A843; font-size: 28px;">Auto-Release Warning</h1>
        <p style="color: #3A3A3A; font-size: 16px; line-height: 1.6;">
          Hi ${name}, the escrow payment of ₹${(amount / 100).toLocaleString()} for <strong>${jobTitle}</strong>
          will be automatically released to the freelancer in <strong>${hoursRemaining} hours</strong>.
        </p>
        <p style="color: #3A3A3A; font-size: 16px; line-height: 1.6;">
          Please review the delivery and approve or request revisions before the auto-release deadline.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #1A6B4A; color: white; padding: 14px 32px; border-radius: 10px; text-decoration: none; font-weight: 600;">
            Review Delivery
          </a>
        </div>
      </div>
    `,
  });
};

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAutoReleaseWarning,
};
