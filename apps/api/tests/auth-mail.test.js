import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import { eq } from 'drizzle-orm';
import { app } from '../src/app.js';
import { db } from '../src/db/index.js';
import { emailVerificationTokens, users } from '../src/db/schema/index.js';
import { ApiError } from '../src/utils/api-error.js';
import { sendOtpEmail } from '../src/utils/mailer.js';

vi.mock('../src/utils/mailer.js', () => ({ sendOtpEmail: vi.fn() }));

describe('Authentication email delivery failures', () => {
  const account = {
    email: `mail_retry_${Date.now()}@example.invalid`,
    password: 'SecurePassword123!',
    firstName: 'Mail',
    lastName: 'Retry'
  };

  beforeEach(() => {
    vi.mocked(sendOtpEmail).mockReset();
    vi.mocked(sendOtpEmail).mockResolvedValue({
      success: true,
      messageId: 'accepted-message'
    });
  });

  afterEach(async () => {
    await db.delete(users).where(eq(users.email, account.email));
  });

  it('allows signup to be retried after email delivery fails', async () => {
    vi.mocked(sendOtpEmail).mockRejectedValueOnce(
      ApiError.serviceUnavailable(
        'Unable to send the verification email. Please try again shortly.'
      )
    );

    const failed = await request(app)
      .post('/api/v1/auth/register')
      .send(account);

    expect(failed.status).toBe(503);
    expect(
      await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, account.email))
    ).toEqual([]);

    const retry = await request(app)
      .post('/api/v1/auth/register')
      .send(account);

    expect(retry.status).toBe(201);
    expect(sendOtpEmail).toHaveBeenLastCalledWith({
      to: account.email,
      otp: expect.stringMatching(/^\d{6}$/)
    });
  });

  it('keeps the previous code valid if resending fails', async () => {
    const registration = await request(app)
      .post('/api/v1/auth/register')
      .send(account);
    expect(registration.status).toBe(201);
    const userId = registration.body.data.user.id;
    const previousTokens = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));
    vi.mocked(sendOtpEmail).mockRejectedValueOnce(
      ApiError.serviceUnavailable(
        'Unable to send the verification email. Please try again shortly.'
      )
    );

    const resend = await request(app)
      .post('/api/v1/auth/resend-otp')
      .send({ email: account.email });

    expect(resend.status).toBe(503);
    expect(
      await db
        .select()
        .from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.userId, userId))
    ).toEqual(previousTokens);
    const verification = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ email: account.email, otp: registration.body.data.otp });
    expect(verification.status).toBe(200);
  });
});
