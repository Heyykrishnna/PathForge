import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { ApiError } from './api-error.js';
import { logger } from './logger.js';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    const transportConfig = {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE || env.SMTP_PORT === 465,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000
    };

    if (env.SMTP_USER && env.SMTP_PASS) {
      transportConfig.auth = {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      };
    }

    transporter = nodemailer.createTransport(transportConfig);
  }
  return transporter;
}

export async function sendOtpEmail({ to, otp }) {
  if (env.NODE_ENV === 'test') {
    return { success: true, messageId: 'test-otp-mock-id' };
  }

  const mailOptions = {
    from: env.SMTP_FROM,
    to,
    subject: 'Your PathForge Verification Code',
    text: `Hello,

Your PathForge account verification code is: ${otp}

This code is valid for 10 minutes. If you did not request this verification code, please ignore this email.

Best regards,
PathForge Team`
  };

  try {
    const client = getTransporter();
    const info = await client.sendMail(mailOptions);
    if (!info.accepted?.length) {
      throw ApiError.serviceUnavailable();
    }
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.warn(
      { code: error.code, responseCode: error.responseCode },
      'OTP email delivery failed'
    );
    throw ApiError.serviceUnavailable(
      'Unable to send the verification email. Please try again shortly.'
    );
  }
}
