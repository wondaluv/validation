/**
 * AfriPay Authentication Middleware
 * API key and JWT token validation
 */

import { Request, Response, NextFunction } from 'express';
import { MerchantService } from '../../services/MerchantService';
import { Logger } from '../../utils/Logger';

const logger = new Logger('AuthMiddleware');

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      merchantId?: string;
      merchant?: {
        id: string;
        businessName: string;
        email: string;
        country: string;
        isLive: boolean;
        isVerified: boolean;
      };
    }
  }
}

/**
 * Create API key authentication middleware
 */
export function createApiKeyAuth(merchantService: MerchantService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader) {
        res.status(401).json({
          success: false,
          message: 'Missing authorization header'
        });
        return;
      }

      // Support both "Bearer" and direct API key
      let apiKey: string;
      let secretKey: string | undefined;

      if (authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
        secretKey = req.headers['x-secret-key'] as string;
      } else if (authHeader.startsWith('sk_')) {
        // Using secret key directly (for simple integrations)
        secretKey = authHeader;
        apiKey = req.headers['x-api-key'] as string || '';
      } else {
        apiKey = authHeader;
        secretKey = req.headers['x-secret-key'] as string;
      }

      if (!apiKey || !apiKey.startsWith('pk_')) {
        res.status(401).json({
          success: false,
          message: 'Invalid API key format'
        });
        return;
      }

      const result = await merchantService.authenticateApiKey(apiKey, secretKey || '');

      if (!result.success || !result.merchant) {
        res.status(401).json({
          success: false,
          message: result.message || 'Invalid API key'
        });
        return;
      }

      // Attach merchant to request
      req.merchantId = result.merchant.id;
      req.merchant = {
        id: result.merchant.id,
        businessName: result.merchant.businessName,
        email: result.merchant.email,
        country: result.merchant.country,
        isLive: result.merchant.isLive,
        isVerified: result.merchant.isVerified
      };

      next();
    } catch (error) {
      logger.error('API key authentication failed', error as Error);
      res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  };
}

/**
 * Create JWT authentication middleware
 */
export function createJwtAuth(merchantService: MerchantService) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Missing or invalid authorization header'
        });
        return;
      }

      const token = authHeader.substring(7);
      const result = merchantService.verifyToken(token);

      if (!result.valid || !result.merchantId) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
        return;
      }

      const merchant = await merchantService.getMerchant(result.merchantId);

      if (!merchant) {
        res.status(401).json({
          success: false,
          message: 'Merchant not found'
        });
        return;
      }

      req.merchantId = merchant.id;
      req.merchant = {
        id: merchant.id,
        businessName: merchant.businessName,
        email: merchant.email,
        country: merchant.country,
        isLive: merchant.isLive,
        isVerified: merchant.isVerified
      };

      next();
    } catch (error) {
      logger.error('JWT authentication failed', error as Error);
      res.status(500).json({
        success: false,
        message: 'Authentication error'
      });
    }
  };
}

/**
 * Require live mode middleware
 */
export function requireLiveMode(req: Request, res: Response, next: NextFunction): void {
  if (!req.merchant?.isLive) {
    res.status(403).json({
      success: false,
      message: 'This operation requires live mode. Please activate your account.'
    });
    return;
  }
  next();
}

/**
 * Require verified account middleware
 */
export function requireVerified(req: Request, res: Response, next: NextFunction): void {
  if (!req.merchant?.isVerified) {
    res.status(403).json({
      success: false,
      message: 'This operation requires a verified account.'
    });
    return;
  }
  next();
}

/**
 * Rate limiting middleware
 */
export function createRateLimiter(
  maxRequests: number = 100,
  windowMs: number = 60000
) {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.merchantId || req.ip || 'anonymous';
    const now = Date.now();

    let record = requests.get(key);

    if (!record || record.resetAt < now) {
      record = { count: 0, resetAt: now + windowMs };
      requests.set(key, record);
    }

    record.count++;

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - record.count));
    res.setHeader('X-RateLimit-Reset', record.resetAt);

    if (record.count > maxRequests) {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please try again later.'
      });
      return;
    }

    next();
  };
}

/**
 * Request ID middleware
 */
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const id = req.headers['x-request-id'] as string ||
    `req_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;

  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);

  next();
}

/**
 * Request logging middleware
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  const requestId = req.headers['x-request-id'];

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path}`, {
      requestId,
      merchantId: req.merchantId,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
  });

  next();
}
