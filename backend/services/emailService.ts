import nodemailer from "nodemailer";

// For development/mock purposes, we'll just log to console
// or use a test account if configured.
export const sendEmail = async (to: string, subject: string, html: string) => {
  const isSmtpConfigured =
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS;

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_PORT === "465",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"Business Nexus" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html,
      });
      console.log(`[EMAIL SENT] To: ${to}`);
      return true;
    } catch (error) {
      console.error("[EMAIL ERROR] SMTP failed, falling back to mock:", error);
    }
  }

  // Fallback to mock logging
  console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}`);
  console.log(`[MOCK EMAIL] Body excerpt: ${html.substring(0, 100)}...`);
  return true;
};

export const sendOTP = async (to: string, otp: string) => {
  const subject = "Your Verification Code - Business Nexus";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Security Verification</h2>
      <p>Hello,</p>
      <p>You have requested a verification code for Two-Factor Authentication.</p>
      <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827;">${otp}</span>
      </div>
      <p>Use this code to complete your security setup. This code will expire in 10 minutes.</p>
      <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
      <p style="margin-top: 40px; font-size: 12px; color: #6b7280; text-align: center;">
        &copy; 2026 Business Nexus. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail(to, subject, html);
};

export const sendResetPasswordEmail = async (
  to: string,
  resetToken: string,
) => {
  const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;
  const subject = "Reset Your Password - Business Nexus";
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
      <h2 style="color: #4f46e5; text-align: center;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>You have requested to reset your password for your Business Nexus account.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
      </div>
      <p>If the button above doesn't work, copy and paste the following link into your browser:</p>
      <p style="word-break: break-all; color: #4f46e5;">${resetLink}</p>
      <p>This link will expire in 10 minutes.</p>
      <p>If you didn't request a password reset, please ignore this email.</p>
      <p style="margin-top: 40px; font-size: 12px; color: #6b7280; text-align: center;">
        &copy; 2026 Business Nexus. All rights reserved.
      </p>
    </div>
  `;

  return sendEmail(to, subject, html);
};
