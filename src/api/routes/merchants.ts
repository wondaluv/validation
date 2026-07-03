/**
 * AfriPay Merchant API Routes
 * Account management and dashboard endpoints
 */

import { Router, Request, Response } from 'express';
import { MerchantService } from '../../services/MerchantService';
import { TransactionManager } from '../../services/TransactionManager';
import { MerchantRegistrationSchema } from '../../utils/validators';
import { Logger } from '../../utils/Logger';

const logger = new Logger('MerchantRoutes');

export function createMerchantRoutes(
  merchantService: MerchantService,
  transactionManager: TransactionManager
): Router {
  const router = Router();

  /**
   * POST /merchants/register
   * Register a new merchant
   */
  router.post('/register', async (req: Request, res: Response) => {
    try {
      const validation = MerchantRegistrationSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validation.error.errors
        });
        return;
      }

      const result = await merchantService.createMerchant(validation.data);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Merchant registered successfully',
        data: {
          merchant: result.merchant,
          apiKey: result.merchant?.apiKey,
          secretKey: result.merchant?.secretKey // Only shown once
        }
      });
    } catch (error) {
      logger.error('Merchant registration error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * POST /merchants/login
   * Authenticate merchant
   */
  router.post('/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
        return;
      }

      const result = await merchantService.authenticate({ email, password });

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      res.json({
        success: true,
        data: {
          token: result.token,
          merchant: result.merchant
        }
      });
    } catch (error) {
      logger.error('Login error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * GET /merchants/me
   * Get current merchant profile
   */
  router.get('/me', async (req: Request, res: Response) => {
    try {
      const merchant = await merchantService.getMerchant(req.merchantId!);

      if (!merchant) {
        res.status(404).json({
          success: false,
          message: 'Merchant not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { merchant }
      });
    } catch (error) {
      logger.error('Get profile error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * PUT /merchants/settings
   * Update merchant settings
   */
  router.put('/settings', async (req: Request, res: Response) => {
    try {
      const result = await merchantService.updateSettings(
        req.merchantId!,
        req.body
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Update settings error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * PUT /merchants/webhook
   * Update webhook configuration
   */
  router.put('/webhook', async (req: Request, res: Response) => {
    try {
      const { url } = req.body;

      if (!url) {
        res.status(400).json({
          success: false,
          message: 'Webhook URL is required'
        });
        return;
      }

      const result = await merchantService.updateWebhook(req.merchantId!, url);

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.success ? 'Webhook updated' : result.message,
        data: result.success ? { webhookSecret: result.webhookSecret } : undefined
      });
    } catch (error) {
      logger.error('Update webhook error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * POST /merchants/regenerate-keys
   * Regenerate API keys
   */
  router.post('/regenerate-keys', async (req: Request, res: Response) => {
    try {
      const result = await merchantService.regenerateApiKeys(req.merchantId!);

      res.status(result.success ? 200 : 400).json({
        success: result.success,
        message: result.success ? 'API keys regenerated' : result.message,
        data: result.success ? {
          apiKey: result.apiKey,
          secretKey: result.secretKey // Only shown once
        } : undefined
      });
    } catch (error) {
      logger.error('Regenerate keys error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * GET /merchants/dashboard
   * Get dashboard statistics
   */
  router.get('/dashboard', async (req: Request, res: Response) => {
    try {
      const { startDate, endDate } = req.query;

      const stats = await transactionManager.getStats(req.merchantId!, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined
      });

      const dailyVolume = await transactionManager.getDailyVolume(
        req.merchantId!,
        30
      );

      const methodBreakdown = await transactionManager.getPaymentMethodBreakdown(
        req.merchantId!,
        {
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined
        }
      );

      res.json({
        success: true,
        data: {
          stats,
          dailyVolume,
          methodBreakdown
        }
      });
    } catch (error) {
      logger.error('Dashboard error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * POST /merchants/go-live
   * Switch to live mode
   */
  router.post('/go-live', async (req: Request, res: Response) => {
    try {
      const result = await merchantService.goLive(req.merchantId!);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Go live error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  return router;
}

export default createMerchantRoutes;
