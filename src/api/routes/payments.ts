/**
 * AfriPay Payment API Routes
 * RESTful endpoints for payment operations
 */

import { Router, Request, Response } from 'express';
import { PaymentProcessor } from '../../core/PaymentProcessor';
import { InitializePaymentSchema, PayoutSchema } from '../../utils/validators';
import { Logger } from '../../utils/Logger';

const logger = new Logger('PaymentRoutes');

export function createPaymentRoutes(paymentProcessor: PaymentProcessor): Router {
  const router = Router();

  /**
   * POST /payments/initialize
   * Initialize a new payment
   */
  router.post('/initialize', async (req: Request, res: Response) => {
    try {
      const validation = InitializePaymentSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validation.error.errors
        });
        return;
      }

      const result = await paymentProcessor.initializePayment(
        req.merchantId!,
        validation.data
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Payment initialization error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * GET /payments/verify/:reference
   * Verify a payment by reference
   */
  router.get('/verify/:reference', async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;

      if (!reference) {
        res.status(400).json({
          success: false,
          message: 'Reference is required'
        });
        return;
      }

      const result = await paymentProcessor.verifyPayment(reference);

      // Ensure transaction belongs to this merchant
      if (result.data?.transaction &&
          result.data.transaction.merchantId !== req.merchantId) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
        return;
      }

      res.status(result.success ? 200 : 404).json(result);
    } catch (error) {
      logger.error('Payment verification error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * GET /payments/:reference
   * Get payment details
   */
  router.get('/:reference', async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;

      const transaction = await paymentProcessor.getTransaction(reference);

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
        return;
      }

      // Ensure transaction belongs to this merchant
      if (transaction.merchantId !== req.merchantId) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { transaction }
      });
    } catch (error) {
      logger.error('Get payment error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * GET /payments
   * List all payments for merchant
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const {
        status,
        type,
        startDate,
        endDate,
        limit = '50',
        offset = '0'
      } = req.query;

      const result = await paymentProcessor.getMerchantTransactions(
        req.merchantId!,
        {
          status: status as string | undefined,
          type: type as string | undefined,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10)
        }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('List payments error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * POST /payments/:reference/refund
   * Refund a payment
   */
  router.post('/:reference/refund', async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;
      const { amount, reason } = req.body;

      // Verify transaction belongs to merchant
      const transaction = await paymentProcessor.getTransaction(reference);

      if (!transaction || transaction.merchantId !== req.merchantId) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
        return;
      }

      const result = await paymentProcessor.processRefund(reference, amount, reason);

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Refund error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  return router;
}

export function createPayoutRoutes(paymentProcessor: PaymentProcessor): Router {
  const router = Router();

  /**
   * POST /payouts
   * Create a new payout
   */
  router.post('/', async (req: Request, res: Response) => {
    try {
      const validation = PayoutSchema.safeParse(req.body);

      if (!validation.success) {
        res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: validation.error.errors
        });
        return;
      }

      const result = await paymentProcessor.processPayout(
        req.merchantId!,
        validation.data
      );

      res.status(result.success ? 200 : 400).json(result);
    } catch (error) {
      logger.error('Payout error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * GET /payouts/:reference
   * Get payout status
   */
  router.get('/:reference', async (req: Request, res: Response) => {
    try {
      const { reference } = req.params;

      const transaction = await paymentProcessor.getTransaction(reference);

      if (!transaction || transaction.merchantId !== req.merchantId) {
        res.status(404).json({
          success: false,
          message: 'Payout not found'
        });
        return;
      }

      res.json({
        success: true,
        data: { payout: transaction }
      });
    } catch (error) {
      logger.error('Get payout error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * GET /payouts
   * List all payouts
   */
  router.get('/', async (req: Request, res: Response) => {
    try {
      const { limit = '50', offset = '0' } = req.query;

      const result = await paymentProcessor.getMerchantTransactions(
        req.merchantId!,
        {
          type: 'payout',
          limit: parseInt(limit as string, 10),
          offset: parseInt(offset as string, 10)
        }
      );

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('List payouts error', error as Error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  return router;
}

export default { createPaymentRoutes, createPayoutRoutes };
