import { beforeEach, describe, expect, it, vi } from 'vitest';

const { sendMail, createTransport, settings } = vi.hoisted(() => ({
  sendMail: vi.fn(),
  createTransport: vi.fn(),
  settings: {
    NODE_ENV: 'development',
    LOG_LEVEL: 'fatal',
    SMTP_HOST: 'smtp.example.invalid',
    SMTP_PORT: 587,
    SMTP_SECURE: false,
    SMTP_USER: 'sender@example.invalid',
    SMTP_PASS: 'test-mail-password',
    SMTP_FROM: 'PathForge <sender@example.invalid>'
  }
}));

vi.mock('nodemailer', () => ({ default: { createTransport } }));
vi.mock('../src/config/env.js', () => ({ env: settings }));

describe('OTP email delivery', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    createTransport.mockReturnValue({ sendMail });
    settings.SMTP_PORT = 587;
    settings.SMTP_SECURE = false;
  });

  it('sends the code through the configured SMTP transport', async () => {
    sendMail.mockResolvedValue({
      accepted: ['student@example.invalid'],
      messageId: 'accepted-message'
    });
    const { sendOtpEmail } = await import('../src/utils/mailer.js');

    await expect(
      sendOtpEmail({ to: 'student@example.invalid', otp: '123456' })
    ).resolves.toEqual({
      success: true,
      messageId: 'accepted-message'
    });
    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        host: settings.SMTP_HOST,
        port: 587,
        secure: false,
        auth: { user: settings.SMTP_USER, pass: settings.SMTP_PASS }
      })
    );
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'student@example.invalid',
        from: settings.SMTP_FROM,
        text: expect.stringContaining('123456')
      })
    );
  });

  it('reports delivery failure without logging the code or exposing provider errors', async () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => {});
    sendMail.mockRejectedValue(
      new Error('Provider rejected test-mail-password')
    );
    const { sendOtpEmail } = await import('../src/utils/mailer.js');

    try {
      await expect(
        sendOtpEmail({ to: 'student@example.invalid', otp: '123456' })
      ).rejects.toMatchObject({
        statusCode: 503,
        message:
          'Unable to send the verification email. Please try again shortly.'
      });
      expect(warning).not.toHaveBeenCalled();
    } finally {
      warning.mockRestore();
    }
  });

  it('does not report success when SMTP accepts no recipients', async () => {
    sendMail.mockResolvedValue({
      accepted: [],
      rejected: ['student@example.invalid']
    });
    const { sendOtpEmail } = await import('../src/utils/mailer.js');

    await expect(
      sendOtpEmail({ to: 'student@example.invalid', otp: '123456' })
    ).rejects.toMatchObject({
      statusCode: 503
    });
  });

  it('uses implicit TLS on port 465', async () => {
    settings.SMTP_PORT = 465;
    sendMail.mockResolvedValue({
      accepted: ['student@example.invalid'],
      messageId: 'accepted-message'
    });
    const { sendOtpEmail } = await import('../src/utils/mailer.js');

    await sendOtpEmail({ to: 'student@example.invalid', otp: '123456' });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 465, secure: true })
    );
  });
});
