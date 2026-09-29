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
   * POST /merchants/authenticate
   * Authenticate merchant (alias for login)
   */
  router.post('/authenticate', async (req: Request, res: Response) => {
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
        token: result.token,
        merchant: result.merchant
      });
    } catch (error) {
      logger.error('Authentication error', error as Error);
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
   * GET /merchants/profile
   * Get current merchant profile (alias for /me)
   */
  router.get('/profile', async (req: Request, res: Response) => {
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
        merchant
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
   * GET /merchants/transactions
   * List merchant transactions
   */
  router.get('/transactions', async (req: Request, res: Response) => {
    try {
      const { status, paymentMethod, startDate, endDate, limit, offset } = req.query;

      const transactions = await transactionManager.getTransactions(req.merchantId!, {
        status: status as string | undefined,
        paymentMethod: paymentMethod as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
        offset: offset ? parseInt(offset as string, 10) : 0
      });

      res.json({
        success: true,
        transactions: transactions.transactions,
        total: transactions.total
      });
    } catch (error) {
      logger.error('Get transactions error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * GET /merchants/stats
   * Get merchant statistics
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const { timeRange } = req.query;

      // Calculate date range based on timeRange
      let startDate: Date;
      const endDate = new Date();

      switch (timeRange) {
        case '24h':
          startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '7d':
        default:
          startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      const stats = await transactionManager.getStats(req.merchantId!, { startDate, endDate });
      const dailyVolume = await transactionManager.getDailyVolume(req.merchantId!, 12);
      const methodBreakdown = await transactionManager.getPaymentMethodBreakdown(req.merchantId!, { startDate, endDate });

      // Format for frontend
      const revenueChart = dailyVolume.map(d => ({
        date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: d.volume
      }));

      const paymentMethodBreakdown = methodBreakdown.map((m, i) => ({
        name: m.method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: Math.round(m.percentage),
        color: ['#22c55e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'][i % 6]
      }));

      res.json({
        success: true,
        stats: {
          totalRevenue: stats.totalVolume,
          totalTransactions: stats.totalCount,
          successRate: stats.successRate,
          activeCustomers: stats.uniqueCustomers || 0,
          revenueChange: 12.5, // Would calculate from historical data
          transactionsChange: 8.2,
          successRateChange: 0.5,
          customersChange: -2.1
        },
        revenueChart,
        paymentMethodBreakdown
      });
    } catch (error) {
      logger.error('Get stats error', error as Error);
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
