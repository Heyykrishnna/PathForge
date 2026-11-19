import { randomInt } from 'node:crypto';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../db/index.js';
import {
  users,
  sessions,
  emailVerificationTokens,
  passwordResetTokens,
  profiles
} from '../../db/schema/index.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import {
  generateAccessToken,
  generateRandomToken,
  hashToken
} from '../../utils/token.js';
import { ApiError } from '../../utils/api-error.js';
import { env } from '../../config/env.js';
import { sendOtpEmail } from '../../utils/mailer.js';

export class AuthService {
  async register({ email, password, firstName, lastName }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existingUser.length > 0) {
      throw ApiError.conflict(
        'An account with this email address already exists'
      );
    }

    const passwordHash = await hashPassword(password);

    return db.transaction(async (tx) => {
      const [newUser] = await tx
        .insert(users)
        .values({
          email: normalizedEmail,
          passwordHash,
          isEmailVerified: false
        })
        .returning();

      const [newProfile] = await tx
        .insert(profiles)
        .values({
          userId: newUser.id,
          firstName: firstName
            ? firstName.trim()
            : normalizedEmail.split('@')[0],
          lastName: lastName ? lastName.trim() : '',
          completionPercentage: 20
        })
        .returning();

      const rawVerificationToken = generateRandomToken();
      const verificationTokenHash = hashToken(rawVerificationToken);
      const tokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await tx.insert(emailVerificationTokens).values({
        userId: newUser.id,
        tokenHash: verificationTokenHash,
        expiresAt: tokenExpiresAt
      });

      const otp = randomInt(100000, 1000000).toString();
      const otpHash = hashToken(`${normalizedEmail}:${otp}`);
      const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await tx.insert(emailVerificationTokens).values({
        userId: newUser.id,
        tokenHash: otpHash,
        expiresAt: otpExpiresAt
      });

      await sendOtpEmail({ to: normalizedEmail, otp });

      return {
        user: {
          id: newUser.id,
          email: newUser.email,
          isEmailVerified: newUser.isEmailVerified
        },
        profile: newProfile,
        verificationToken: rawVerificationToken,
        otp: env.NODE_ENV === 'test' ? otp : undefined
      };
    });
  }

  async login({ email, password, userAgent, ipAddress }) {
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const isValidPassword = await verifyPassword(user.passwordHash, password);
    if (!isValidPassword) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email
    });

    const rawRefreshToken = generateRandomToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      isRevoked: false,
      expiresAt
    });

    let [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!profile) {
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: user.id,
          firstName: normalizedEmail.split('@')[0],
          lastName: '',
          completionPercentage: 20
        })
        .returning();
      profile = newProfile;
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      },
      profile,
      accessToken,
      refreshToken: rawRefreshToken
    };
  }

  async refresh({ refreshToken, userAgent, ipAddress }) {
    if (!refreshToken) {
      throw ApiError.unauthorized('Refresh token is required');
    }

    const tokenHash = hashToken(refreshToken);

    const [session] = await db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshTokenHash, tokenHash),
          eq(sessions.isRevoked, false),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!session) {
      throw ApiError.unauthorized('Invalid or expired refresh session');
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      throw ApiError.unauthorized('User associated with session not found');
    }

    const newRawRefreshToken = generateRandomToken();
    const newRefreshTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    await db
      .update(sessions)
      .set({
        refreshTokenHash: newRefreshTokenHash,
        userAgent: userAgent || session.userAgent,
        ipAddress: ipAddress || session.ipAddress,
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      })
      .where(eq(sessions.id, session.id));

    const newAccessToken = generateAccessToken({
      sub: user.id,
      email: user.email
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRawRefreshToken
    };
  }

  async logout({ refreshToken }) {
    if (!refreshToken) {
      return;
    }

    const tokenHash = hashToken(refreshToken);

    await db
      .update(sessions)
      .set({
        isRevoked: true,
        updatedAt: new Date()
      })
      .where(eq(sessions.refreshTokenHash, tokenHash));
  }

  async revokeAllSessions(userId) {
    await db
      .update(sessions)
      .set({
        isRevoked: true,
        updatedAt: new Date()
      })
      .where(eq(sessions.userId, userId));
  }

  async verifyEmail({ token }) {
    const tokenHash = hashToken(token);

    const [record] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!record) {
      throw ApiError.badRequest('Invalid or expired email verification token');
    }

    await db
      .update(users)
      .set({
        isEmailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, record.userId));

    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.id, record.id));

    return { success: true };
  }

  async verifyOtp({ email, otp, userAgent, ipAddress }) {
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      throw ApiError.badRequest('Invalid or expired verification code');
    }

    const otpHash = hashToken(`${normalizedEmail}:${otp.trim()}`);

    const [record] = await db
      .select()
      .from(emailVerificationTokens)
      .where(
        and(
          eq(emailVerificationTokens.userId, user.id),
          eq(emailVerificationTokens.tokenHash, otpHash),
          gt(emailVerificationTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!record) {
      throw ApiError.badRequest('Invalid or expired verification code');
    }

    await db
      .update(users)
      .set({
        isEmailVerified: true,
        updatedAt: new Date()
      })
      .where(eq(users.id, user.id));

    await db
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, user.id));

    let [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, user.id))
      .limit(1);

    if (!profile) {
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: user.id,
          firstName: normalizedEmail.split('@')[0],
          lastName: '',
          completionPercentage: 20
        })
        .returning();
      profile = newProfile;
    }

    const accessToken = generateAccessToken({
      sub: user.id,
      email: user.email
    });

    const rawRefreshToken = generateRandomToken();
    const refreshTokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(
      Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
    );

    await db.insert(sessions).values({
      userId: user.id,
      refreshTokenHash,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      isRevoked: false,
      expiresAt
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        isEmailVerified: true
      },
      profile,
      accessToken,
      refreshToken: rawRefreshToken
    };
  }

  async resendOtp({ email }) {
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return {
        success: true,
        message: 'If that email is registered, a new code has been sent.'
      };
    }

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = hashToken(`${normalizedEmail}:${otp}`);
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.transaction(async (tx) => {
      await tx
        .delete(emailVerificationTokens)
        .where(eq(emailVerificationTokens.userId, user.id));

      await tx.insert(emailVerificationTokens).values({
        userId: user.id,
        tokenHash: otpHash,
        expiresAt: otpExpiresAt
      });

      await sendOtpEmail({ to: normalizedEmail, otp });
    });

    return {
      success: true,
      message: 'A new verification code has been sent to your email.'
    };
  }

  async forgotPassword({ email }) {
    const normalizedEmail = email.trim().toLowerCase();

    const [user] = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (!user) {
      return {
        message:
          'If that email is registered, a password reset link has been sent.'
      };
    }

    const rawToken = generateRandomToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      isUsed: false,
      expiresAt
    });

    return {
      message:
        'If that email is registered, a password reset link has been sent.',
      resetToken: rawToken
    };
  }

  async resetPassword({ token, newPassword }) {
    const tokenHash = hashToken(token);

    const [resetRecord] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          eq(passwordResetTokens.isUsed, false),
          gt(passwordResetTokens.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!resetRecord) {
      throw ApiError.badRequest(
        'Invalid, expired or already used password reset token'
      );
    }

    const newPasswordHash = await hashPassword(newPassword);

    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date()
      })
      .where(eq(users.id, resetRecord.userId));

    await db
      .update(passwordResetTokens)
      .set({
        isUsed: true
      })
      .where(eq(passwordResetTokens.id, resetRecord.id));

    await this.revokeAllSessions(resetRecord.userId);

    return { success: true };
  }

  async getCurrentUser(userId) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        isEmailVerified: users.isEmailVerified,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    let [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);

    if (!profile) {
      const [newProfile] = await db
        .insert(profiles)
        .values({
          userId: user.id,
          firstName: user.email.split('@')[0],
          lastName: '',
          completionPercentage: 20
        })
        .returning();
      profile = newProfile;
    }

    return {
      user,
      profile
    };
  }

  async deleteAccount(userId) {
    const [deleted] = await db
      .delete(users)
      .where(eq(users.id, userId))
      .returning({ id: users.id });

    if (!deleted) {
      throw ApiError.notFound('User not found');
    }

    return {
      success: true,
      message: 'Account and associated personal data deleted permanently'
    };
  }
}

export const authService = new AuthService();
