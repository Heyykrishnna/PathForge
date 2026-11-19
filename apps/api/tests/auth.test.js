import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Auth Module Integration Tests', () => {
  const testUser = {
    email: `student_${Date.now()}@example.com`,
    password: 'SecurePassword123!',
    firstName: 'John',
    lastName: 'Francisco'
  };

  let verificationToken = '';
  let accessToken = '';
  let refreshCookie = '';

  it('registers a new user with valid details', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.isEmailVerified).toBe(false);
    expect(res.body.data.profile.firstName).toBe('John');
    expect(res.body.data.profile.lastName).toBe('Francisco');
    expect(res.body.data.verificationToken).toBeDefined();

    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|SecurePassword123!/i);

    verificationToken = res.body.data.verificationToken;
  });

  it('rejects duplicate email registration safely', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'shortpass@example.com',
        password: 'short',
        firstName: 'Short',
        lastName: 'Pass'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('verifies email with single-use verification token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: verificationToken });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toMatch(/verified/i);

    const reuseRes = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: verificationToken });

    expect(reuseRes.status).toBe(400);
  });

  it('rejects invalid password with generic authentication error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  it('logs in verified user and returns access token and refresh cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const cookieHeader = Array.isArray(cookies) ? cookies.join(';') : cookies;
    expect(cookieHeader).toMatch(/refreshToken=/);
    expect(cookieHeader).toMatch(/HttpOnly/i);

    accessToken = res.body.data.accessToken;
    refreshCookie = cookieHeader;
  });

  it('denies access to protected endpoint without access token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  it('allows access to protected endpoint with valid access token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.profile.firstName).toBe('John');
  });

  it('rotates refresh token and invalidates old refresh session', async () => {
    const res = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();

    const newCookies = res.headers['set-cookie'];
    const newCookieHeader = Array.isArray(newCookies) ? newCookies.join(';') : newCookies;
    expect(newCookieHeader).toMatch(/refreshToken=/);

    const oldTokenReuse = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(oldTokenReuse.status).toBe(401);

    refreshCookie = newCookieHeader;
  });

  it('revokes active session on logout', async () => {
    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', refreshCookie);

    expect(logoutRes.status).toBe(200);

    const refreshAfterLogout = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', refreshCookie);

    expect(refreshAfterLogout.status).toBe(401);
  });

  it('completes forgot-password and reset-password flow', async () => {
    const forgotRes = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ email: testUser.email });

    expect(forgotRes.status).toBe(200);
    expect(forgotRes.body.data.resetToken).toBeDefined();

    const resetToken = forgotRes.body.data.resetToken;
    const newPassword = 'BrandNewPassword123!';

    const resetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword
      });

    expect(resetRes.status).toBe(200);

    const reuseResetRes = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: resetToken,
        newPassword: 'AnotherPassword123!'
      });

    expect(reuseResetRes.status).toBe(400);

    const loginWithNewPass = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: newPassword
      });

    expect(loginWithNewPass.status).toBe(200);
  });

  it('verifies user with 6-digit email otp and syncs profile', async () => {
    const otpUser = {
      email: `otp_student_${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      firstName: 'Alex',
      lastName: 'Taylor'
    };

    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send(otpUser);

    expect(regRes.status).toBe(201);
    expect(regRes.body.data.otp).toBeDefined();
    expect(regRes.body.data.profile.firstName).toBe('Alex');

    const invalidOtpRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: otpUser.email,
        otp: '000000'
      });

    expect(invalidOtpRes.status).toBe(400);

    const validOtpRes = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({
        email: otpUser.email,
        otp: regRes.body.data.otp
      });

    expect(validOtpRes.status).toBe(200);
    expect(validOtpRes.body.data.accessToken).toBeDefined();
    expect(validOtpRes.body.data.profile.firstName).toBe('Alex');

    const resendRes = await request(app)
      .post('/api/v1/auth/resend-otp')
      .send({ email: otpUser.email });

    expect(resendRes.status).toBe(200);
  });
});
