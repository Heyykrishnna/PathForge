import { HTTP_STATUS, createSuccessEnvelope } from '@pathforge/shared';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: '/'
  };
}

export class AuthController {
  constructor(service = authService) {
    this.service = service;
  }

  register = async (req, res, next) => {
    try {
      const result = await this.service.register(req.body);
      return res.status(HTTP_STATUS.CREATED).json(
        createSuccessEnvelope({
          user: result.user,
          profile: result.profile,
          verificationToken: env.NODE_ENV !== 'production' ? result.verificationToken : undefined
        })
      );
    } catch (error) {
      return next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const result = await this.service.login({
        ...req.body,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      return res.status(HTTP_STATUS.OK).json(
        createSuccessEnvelope({
          user: result.user,
          profile: result.profile,
          accessToken: result.accessToken
        })
      );
    } catch (error) {
      return next(error);
    }
  };

  refresh = async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      const result = await this.service.refresh({
        refreshToken,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, getCookieOptions());

      return res.status(HTTP_STATUS.OK).json(
        createSuccessEnvelope({
          accessToken: result.accessToken
        })
      );
    } catch (error) {
      return next(error);
    }
  };

  logout = async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      await this.service.logout({ refreshToken });

      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });

      return res.status(HTTP_STATUS.OK).json(
        createSuccessEnvelope({
          message: 'Logged out successfully'
        })
      );
    } catch (error) {
      return next(error);
    }
  };

  revokeAll = async (req, res, next) => {
    try {
      await this.service.revokeAllSessions(req.user.id);
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });

      return res.status(HTTP_STATUS.OK).json(
        createSuccessEnvelope({
          message: 'All active sessions revoked'
        })
      );
    } catch (error) {
      return next(error);
    }
  };

  me = async (req, res, next) => {
    try {
      const result = await this.service.getCurrentUser(req.user.id);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  verifyEmail = async (req, res, next) => {
    try {
      await this.service.verifyEmail(req.body);
      return res.status(HTTP_STATUS.OK).json(
        createSuccessEnvelope({
          message: 'Email verified successfully'
        })
      );
    } catch (error) {
      return next(error);
    }
  };

  forgotPassword = async (req, res, next) => {
    try {
      const result = await this.service.forgotPassword(req.body);
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      await this.service.resetPassword(req.body);
      return res.status(HTTP_STATUS.OK).json(
        createSuccessEnvelope({
          message: 'Password has been reset successfully'
        })
      );
    } catch (error) {
      return next(error);
    }
  };

  deleteAccount = async (req, res, next) => {
    try {
      const result = await this.service.deleteAccount(req.user.id);
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
      return res.status(HTTP_STATUS.OK).json(createSuccessEnvelope(result));
    } catch (error) {
      return next(error);
    }
  };
}

export const authController = new AuthController();

