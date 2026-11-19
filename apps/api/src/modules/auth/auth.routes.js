import { Router } from 'express';
import { authController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validate.js';
import { authenticate } from '../../middleware/authenticate.js';
import { loginRateLimiter, registerRateLimiter } from '../../middleware/rate-limiter.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  verifyOtpSchema,
  resendOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '@pathforge/shared';

export const authRouter = Router();

authRouter.post('/register', registerRateLimiter, validateRequest({ body: registerSchema }), authController.register);
authRouter.post('/login', loginRateLimiter, validateRequest({ body: loginSchema }), authController.login);
authRouter.post('/refresh', authController.refresh);
authRouter.post('/logout', authController.logout);
authRouter.post('/revoke-all', authenticate, authController.revokeAll);
authRouter.get('/me', authenticate, authController.me);
authRouter.delete('/account', authenticate, authController.deleteAccount);
authRouter.post('/verify-email', validateRequest({ body: verifyEmailSchema }), authController.verifyEmail);
authRouter.post('/verify-otp', validateRequest({ body: verifyOtpSchema }), authController.verifyOtp);
authRouter.post('/resend-otp', validateRequest({ body: resendOtpSchema }), authController.resendOtp);
authRouter.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), authController.forgotPassword);
authRouter.post('/reset-password', validateRequest({ body: resetPasswordSchema }), authController.resetPassword);

