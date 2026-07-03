/**
 * AfriPay - African Payment Processing Platform
 *
 * A unified payment gateway for Africa supporting:
 * - Mobile Money (M-Pesa, MTN MoMo, Airtel Money, Orange Money, etc.)
 * - Card Payments (Visa, Mastercard, Verve, AMEX)
 * - Bank Transfers
 * - International Transactions
 *
 * Features:
 * - Multi-currency support with real-time conversion
 * - Merchant API and SDK
 * - Webhook notifications
 * - Fraud detection
 * - PCI DSS compliant card handling
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import core components
import { PaymentProcessor } from './core/PaymentProcessor';
import { loadConfig } from './config';
import { MerchantService } from './services/MerchantService';
import { TransactionManager } from './services/TransactionManager';
import { WebhookService } from './services/WebhookService';
import { CurrencyConverter } from './services/CurrencyConverter';
import { FeeCalculator } from './services/FeeCalculator';

// Import middleware
import {
  createApiKeyAuth,
  createJwtAuth,
  createRateLimiter,
  requestId,
  requestLogger
} from './api/middleware/auth';

// Import routes
import { createPaymentRoutes, createPayoutRoutes } from './api/routes/payments';
import { createMerchantRoutes } from './api/routes/merchants';

// Import utilities
import { Logger } from './utils/Logger';

const logger = new Logger('AfriPay');

/**
 * Initialize and start the AfriPay server
 */
async function main() {
  logger.info('Starting AfriPay Payment Platform...');

  // Load configuration
  const config = loadConfig();
  logger.info(`Environment: ${config.environment}`);

  // Initialize services
  const transactionManager = new TransactionManager();
  const webhookService = new WebhookService(config.platform.webhookSecret);
  const currencyConverter = new CurrencyConverter();
  const feeCalculator = new FeeCalculator(config.fees);
  const merchantService = new MerchantService(
    config.platform.jwtSecret,
    config.platform.jwtExpiresIn
  );

  // Initialize payment processor
  const paymentProcessor = new PaymentProcessor(config);

  // Create Express app
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Secret-Key', 'X-Request-Id']
  }));

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request tracking
  app.use(requestId);
  app.use(requestLogger);

  // Rate limiting
  app.use('/api', createRateLimiter(100, 60000));

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      version: '1.0.0',
      environment: config.environment,
      timestamp: new Date().toISOString()
    });
  });

  // API documentation endpoint
  app.get('/api', (req, res) => {
    res.json({
      name: 'AfriPay API',
      version: 'v1',
      description: 'African Payment Processing Platform',
      documentation: 'https://docs.afripay.io',
      endpoints: {
        payments: {
          'POST /api/v1/payments/initialize': 'Initialize a payment',
          'GET /api/v1/payments/verify/:reference': 'Verify a payment',
          'GET /api/v1/payments/:reference': 'Get payment details',
          'GET /api/v1/payments': 'List payments',
          'POST /api/v1/payments/:reference/refund': 'Refund a payment'
        },
        payouts: {
          'POST /api/v1/payouts': 'Create a payout',
          'GET /api/v1/payouts/:reference': 'Get payout details',
          'GET /api/v1/payouts': 'List payouts'
        },
        merchants: {
          'POST /api/v1/merchants/register': 'Register merchant',
          'POST /api/v1/merchants/login': 'Login',
          'GET /api/v1/merchants/me': 'Get profile',
          'PUT /api/v1/merchants/settings': 'Update settings',
          'PUT /api/v1/merchants/webhook': 'Update webhook',
          'GET /api/v1/merchants/dashboard': 'Dashboard stats'
        }
      },
      supportedPaymentMethods: [
        'mpesa', 'mtn_momo', 'airtel_money', 'orange_money',
        'visa', 'mastercard', 'verve', 'bank_transfer'
      ],
      supportedCurrencies: [
        'NGN', 'KES', 'GHS', 'ZAR', 'TZS', 'UGX', 'RWF',
        'XOF', 'XAF', 'USD', 'EUR', 'GBP'
      ]
    });
  });

  // Public routes (no auth required)
  const publicMerchantRouter = express.Router();
  publicMerchantRouter.post('/register', createMerchantRoutes(merchantService, transactionManager).stack.find(r => r.route?.path === '/register')?.route?.stack[0]?.handle as express.RequestHandler);
  publicMerchantRouter.post('/login', createMerchantRoutes(merchantService, transactionManager).stack.find(r => r.route?.path === '/login')?.route?.stack[0]?.handle as express.RequestHandler);

  app.use('/api/v1/merchants', publicMerchantRouter);

  // Protected routes (API key auth)
  const apiKeyAuth = createApiKeyAuth(merchantService);
  const jwtAuth = createJwtAuth(merchantService);

  // Payment routes (API key auth)
  app.use('/api/v1/payments', apiKeyAuth, createPaymentRoutes(paymentProcessor));
  app.use('/api/v1/payouts', apiKeyAuth, createPayoutRoutes(paymentProcessor));

  // Merchant routes (JWT auth)
  app.use('/api/v1/merchants', jwtAuth, createMerchantRoutes(merchantService, transactionManager));

  // Webhook callback endpoints (for payment providers)
  app.post('/webhooks/mpesa', express.json(), (req, res) => {
    logger.info('M-Pesa webhook received', req.body);
    // Process M-Pesa callback
    res.json({ ResultCode: 0, ResultDesc: 'Success' });
  });

  app.post('/webhooks/mtn-momo', express.json(), (req, res) => {
    logger.info('MTN MoMo webhook received', req.body);
    // Process MTN MoMo callback
    res.status(200).send();
  });

  app.post('/webhooks/airtel', express.json(), (req, res) => {
    logger.info('Airtel Money webhook received', req.body);
    // Process Airtel callback
    res.status(200).send();
  });

  app.post('/webhooks/paystack', express.json(), (req, res) => {
    logger.info('Paystack webhook received', req.body);
    // Process Paystack callback
    res.status(200).send();
  });

  app.post('/webhooks/flutterwave', express.json(), (req, res) => {
    logger.info('Flutterwave webhook received', req.body);
    // Process Flutterwave callback
    res.status(200).send();
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found'
    });
  });

  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error('Unhandled error', err);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  });

  // Start server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`AfriPay server running on port ${PORT}`);
    logger.info(`API documentation available at http://localhost:${PORT}/api`);
  });
}

// Export components for SDK usage
export { PaymentProcessor } from './core/PaymentProcessor';
export { MerchantService } from './services/MerchantService';
export { TransactionManager } from './services/TransactionManager';
export { CurrencyConverter } from './services/CurrencyConverter';
export { FeeCalculator } from './services/FeeCalculator';
export { WebhookService } from './services/WebhookService';
export * from './types';
export { loadConfig } from './config';

// Run main if this is the entry point
if (require.main === module) {
  main().catch((error) => {
    logger.error('Failed to start server', error);
    process.exit(1);
  });
}
