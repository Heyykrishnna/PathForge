import { ApiError } from '../utils/api-error.js';

export function createRateLimiter({
  windowMs = 15 * 60 * 1000,
  maxRequests = 20,
  message = 'Too many requests. Please try again later.',
  keyGenerator = (req) => req.ip || 'unknown'
} = {}) {
  const store = new Map();

  return (req, res, next) => {
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();
    const record = store.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > record.resetAt) {
      record.count = 0;
      record.resetAt = now + windowMs;
    }

    if (record.count >= maxRequests) {
      res.setHeader('Retry-After', Math.ceil((record.resetAt - now) / 1000));
      return next(new ApiError(429, 'RATE_LIMITED', message));
    }

    record.count += 1;
    store.set(key, record);

    if (store.size > 10000) {
      for (const [k, v] of store.entries()) {
        if (now > v.resetAt) {
          store.delete(k);
        }
      }
    }

    return next();
  };
}

export const loginRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many login attempts. Please try again later.',
  keyGenerator: (req) => `${req.ip}_${req.body?.email || 'anonymous'}`
});

export const registerRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 10,
  message: 'Too many registration attempts. Please try again later.',
  keyGenerator: (req) => req.ip || 'anonymous'
});

export const analysisRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 30,
  message: 'Analysis request rate limit reached. Please wait before running more analyses.',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous'
});

export const uploadRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 15,
  message: 'Resume upload rate limit reached. Please wait before uploading again.',
  keyGenerator: (req) => req.user?.id || req.ip || 'anonymous'
});
