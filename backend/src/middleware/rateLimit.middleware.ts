import { Request, Response, NextFunction } from 'express';
import redis from '../config/redis';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

export const createRateLimit = (options: RateLimitOptions) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const key = `${options.keyPrefix}:${ip}`;

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, Math.ceil(options.windowMs / 1000));
      }

      if (current > options.maxRequests) {
        const ttl = await redis.ttl(key);
        res.status(429).json({
          message: 'Too many requests. Please try again later.',
          retryAfter: ttl,
        });
        return;
      }

      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, options.maxRequests - current));

      next();
    } catch (error) {
      // If Redis is down, allow the request through
      console.error('Rate limit error:', error);
      next();
    }
  };
};

// Pre-configured rate limiters
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50,
  keyPrefix: 'rl:auth',
});

export const apiRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyPrefix: 'rl:api',
});

export const uploadRateLimit = createRateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10,
  keyPrefix: 'rl:upload',
});
