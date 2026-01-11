/**
 * AfriPay Core Payment Processor
 * Central orchestrator for all payment operations
 */

import { v4 as uuidv4 } from 'uuid';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  Currency,
  Country,
  InitializePaymentRequest,
  InitializePaymentResponse,
  VerifyPaymentResponse,
  PayoutRequest,
  PayoutResponse,
  Merchant,
  Customer,
  isMobileMoneyMethod,
  isCardMethod
} from '../types';
import { AfriPayConfig, loadConfig } from '../config';
import { FeeCalculator } from '../services/FeeCalculator';
import { CurrencyConverter } from '../services/CurrencyConverter';
import { TransactionManager } from '../services/TransactionManager';
import { WebhookService } from '../services/WebhookService';
import { Logger } from '../utils/Logger';

// Provider interfaces
import { MobileMoneyProvider } from '../providers/mobile-money/MobileMoneyProvider';
import { CardProvider } from '../providers/cards/CardProvider';
import { BankTransferProvider } from '../providers/bank-transfer/BankTransferProvider';

export class PaymentProcessor {
  private config: AfriPayConfig;
  private feeCalculator: FeeCalculator;
  private currencyConverter: CurrencyConverter;
  private transactionManager: TransactionManager;
  private webhookService: WebhookService;
  private logger: Logger;

  // Payment providers
  private mobileMoneyProvider?: MobileMoneyProvider;
  private cardProvider?: CardProvider;
  private bankTransferProvider?: BankTransferProvider;

  constructor(config?: Partial<AfriPayConfig>) {
    this.config = { ...loadConfig(), ...config };
    this.logger = new Logger('PaymentProcessor');
    this.feeCalculator = new FeeCalculator(this.config.fees);
    this.currencyConverter = new CurrencyConverter();
    this.transactionManager = new TransactionManager();
    this.webhookService = new WebhookService(this.config.platform.webhookSecret);

    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Initialize mobile money provider
    this.mobileMoneyProvider = new MobileMoneyProvider({
      mpesa: this.config.mpesa,
      mtnMomo: this.config.mtnMomo,
      airtelMoney: this.config.airtelMoney,
      environment: this.config.environment
    });

    // Initialize card provider
    if (this.config.cardProcessor) {
      this.cardProvider = new CardProvider(this.config.cardProcessor);
    }

    // Initialize bank transfer provider
    this.bankTransferProvider = new BankTransferProvider(this.config);

    this.logger.info('Payment providers initialized');
  }

  /**
   * Initialize a new payment
   */
  async initializePayment(
    merchantId: string,
    request: InitializePaymentRequest
  ): Promise<InitializePaymentResponse> {
    const reference = request.reference || this.generateReference();

    this.logger.info(`Initializing payment: ${reference}`, {
      merchantId,
      amount: request.amount,
      currency: request.currency
    });

    try {
      // Validate request
      this.validatePaymentRequest(request);

      // Calculate fees
      const paymentMethod = request.paymentMethod || this.detectPaymentMethod(request);
      const fee = this.feeCalculator.calculateFee(
        request.amount,
        request.currency,
        paymentMethod
      );

      // Create transaction record
      const transaction = await this.transactionManager.create({
        id: uuidv4(),
        reference,
        merchantId,
        type: TransactionType.PAYMENT,
        status: TransactionStatus.PENDING,
        paymentMethod,
        amount: request.amount,
        currency: request.currency,
        fee,
        netAmount: request.amount - fee,
        description: request.description,
        metadata: request.metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Process payment based on method
      let result: InitializePaymentResponse;

      if (isMobileMoneyMethod(paymentMethod)) {
        result = await this.processMobileMoneyPayment(transaction, request);
      } else if (isCardMethod(paymentMethod)) {
        result = await this.processCardPayment(transaction, request);
      } else if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
        result = await this.processBankTransfer(transaction, request);
      } else if (paymentMethod === PaymentMethod.USSD) {
        result = await this.processUSSDPayment(transaction, request);
      } else {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

      return result;
    } catch (error) {
      this.logger.error('Payment initialization failed', error);
      return {
        success: false,
        message: 'Payment initialization failed',
        error: {
          code: 'INIT_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Verify a payment by reference
   */
  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    this.logger.info(`Verifying payment: ${reference}`);

    try {
      const transaction = await this.transactionManager.findByReference(reference);

      if (!transaction) {
        return {
          success: false,
          message: 'Transaction not found',
          error: {
            code: 'NOT_FOUND',
            message: 'No transaction found with the provided reference'
          }
        };
      }

      // If still pending, check with provider
      if (transaction.status === TransactionStatus.PENDING ||
          transaction.status === TransactionStatus.PROCESSING) {
        await this.syncTransactionStatus(transaction);
      }

      // Get fresh transaction data
      const updatedTransaction = await this.transactionManager.findByReference(reference);

      return {
        success: true,
        message: 'Transaction retrieved successfully',
        data: {
          transaction: updatedTransaction!
        }
      };
    } catch (error) {
      this.logger.error('Payment verification failed', error);
      return {
        success: false,
        message: 'Verification failed',
        error: {
          code: 'VERIFY_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Process a payout/disbursement
   */
  async processPayout(
    merchantId: string,
    request: PayoutRequest
  ): Promise<PayoutResponse> {
    const reference = request.reference || this.generateReference('PO');

    this.logger.info(`Processing payout: ${reference}`, {
      merchantId,
      amount: request.amount,
      currency: request.currency,
      recipientType: request.recipient.type
    });

    try {
      // Calculate payout fee
      const fee = this.feeCalculator.calculatePayoutFee(
        request.amount,
        request.currency
      );

      // Create payout transaction
      const transaction = await this.transactionManager.create({
        id: uuidv4(),
        reference,
        merchantId,
        type: TransactionType.PAYOUT,
        status: TransactionStatus.PENDING,
        paymentMethod: request.recipient.type === 'mobile_money'
          ? request.recipient.provider || PaymentMethod.MPESA
          : PaymentMethod.BANK_TRANSFER,
        amount: request.amount,
        currency: request.currency,
        fee,
        netAmount: request.amount - fee,
        description: request.description,
        metadata: {
          ...request.metadata,
          recipient: request.recipient
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Process based on recipient type
      if (request.recipient.type === 'mobile_money') {
        return this.processMobileMoneyPayout(transaction, request);
      } else {
        return this.processBankPayout(transaction, request);
      }
    } catch (error) {
      this.logger.error('Payout processing failed', error);
      return {
        success: false,
        transactionId: '',
        reference,
        status: TransactionStatus.FAILED,
        message: error instanceof Error ? error.message : 'Payout failed'
      };
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    reference: string,
    amount?: number,
    reason?: string
  ): Promise<{ success: boolean; refundId?: string; message: string }> {
    this.logger.info(`Processing refund for: ${reference}`);

    try {
      const transaction = await this.transactionManager.findByReference(reference);

      if (!transaction) {
        return { success: false, message: 'Transaction not found' };
      }

      if (transaction.status !== TransactionStatus.SUCCESSFUL) {
        return { success: false, message: 'Only successful transactions can be refunded' };
      }

      const refundAmount = amount || transaction.amount;
      if (refundAmount > transaction.amount) {
        return { success: false, message: 'Refund amount exceeds transaction amount' };
      }

      // Create refund transaction
      const refundReference = this.generateReference('RF');
      const refundTransaction = await this.transactionManager.create({
        id: uuidv4(),
        reference: refundReference,
        merchantId: transaction.merchantId,
        type: TransactionType.REFUND,
        status: TransactionStatus.PENDING,
        paymentMethod: transaction.paymentMethod,
        amount: refundAmount,
        currency: transaction.currency,
        fee: 0,
        netAmount: refundAmount,
        description: reason || `Refund for ${reference}`,
        metadata: {
          originalTransaction: reference,
          reason
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Process refund through appropriate provider
      if (isMobileMoneyMethod(transaction.paymentMethod)) {
        await this.mobileMoneyProvider?.processRefund(transaction, refundAmount);
      } else if (isCardMethod(transaction.paymentMethod)) {
        await this.cardProvider?.processRefund(transaction, refundAmount);
      }

      // Update statuses
      await this.transactionManager.updateStatus(
        refundReference,
        TransactionStatus.SUCCESSFUL
      );

      const newStatus = refundAmount === transaction.amount
        ? TransactionStatus.REFUNDED
        : TransactionStatus.PARTIALLY_REFUNDED;

      await this.transactionManager.updateStatus(reference, newStatus);

      return {
        success: true,
        refundId: refundReference,
        message: 'Refund processed successfully'
      };
    } catch (error) {
      this.logger.error('Refund processing failed', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Refund failed'
      };
    }
  }

  /**
   * Get transaction by reference
   */
  async getTransaction(reference: string): Promise<Transaction | null> {
    return this.transactionManager.findByReference(reference);
  }

  /**
   * Get merchant transactions
   */
  async getMerchantTransactions(
    merchantId: string,
    options?: {
      status?: TransactionStatus;
      type?: TransactionType;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<{ transactions: Transaction[]; total: number }> {
    return this.transactionManager.findByMerchant(merchantId, options);
  }

  // ==========================================
  // Private Methods
  // ==========================================

  private validatePaymentRequest(request: InitializePaymentRequest): void {
    if (!request.amount || request.amount <= 0) {
      throw new Error('Invalid amount');
    }
    if (!request.currency) {
      throw new Error('Currency is required');
    }
    if (!request.phone && !request.email) {
      throw new Error('Phone number or email is required');
    }
  }

  private detectPaymentMethod(request: InitializePaymentRequest): PaymentMethod {
    // Default detection logic based on phone number prefix
    if (request.phone) {
      if (request.phone.startsWith('254')) {
        return PaymentMethod.MPESA;
      }
      if (request.phone.startsWith('233')) {
        return PaymentMethod.MTN_MOMO;
      }
      if (request.phone.startsWith('256')) {
        return PaymentMethod.MTN_MOMO;
      }
    }

    // Default to card if email provided
    if (request.email) {
      return PaymentMethod.VISA;
    }

    return PaymentMethod.MPESA;
  }

  private generateReference(prefix: string = 'AP'): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  private async processMobileMoneyPayment(
    transaction: Transaction,
    request: InitializePaymentRequest
  ): Promise<InitializePaymentResponse> {
    if (!this.mobileMoneyProvider) {
      throw new Error('Mobile money provider not configured');
    }

    const result = await this.mobileMoneyProvider.initiatePayment({
      amount: request.amount,
      currency: request.currency,
      phone: request.phone!,
      provider: transaction.paymentMethod,
      reference: transaction.reference,
      description: request.description,
      metadata: request.metadata
    });

    // Update transaction with provider reference
    await this.transactionManager.update(transaction.reference, {
      providerReference: result.providerReference,
      status: result.status
    });

    return {
      success: result.success,
      message: result.message,
      data: result.success
        ? {
            reference: transaction.reference,
            transactionId: transaction.id,
            paymentInstructions: result.promptSent
              ? 'A payment prompt has been sent to your phone. Please enter your PIN to complete.'
              : undefined,
            ussdCode: result.ussdCode
          }
        : undefined
    };
  }

  private async processCardPayment(
    transaction: Transaction,
    request: InitializePaymentRequest
  ): Promise<InitializePaymentResponse> {
    if (!this.cardProvider) {
      throw new Error('Card payment provider not configured');
    }

    const result = await this.cardProvider.initiatePayment({
      amount: request.amount,
      currency: request.currency,
      email: request.email!,
      reference: transaction.reference,
      callbackUrl: request.callbackUrl,
      metadata: request.metadata
    });

    // Update transaction
    await this.transactionManager.update(transaction.reference, {
      providerReference: result.providerReference,
      status: TransactionStatus.PROCESSING
    });

    return {
      success: true,
      message: 'Payment initialized',
      data: {
        reference: transaction.reference,
        transactionId: transaction.id,
        authorizationUrl: result.authorizationUrl
      }
    };
  }

  private async processBankTransfer(
    transaction: Transaction,
    request: InitializePaymentRequest
  ): Promise<InitializePaymentResponse> {
    if (!this.bankTransferProvider) {
      throw new Error('Bank transfer provider not configured');
    }

    const result = await this.bankTransferProvider.initiateTransfer({
      amount: request.amount,
      currency: request.currency,
      reference: transaction.reference
    });

    return {
      success: true,
      message: 'Bank transfer initiated',
      data: {
        reference: transaction.reference,
        transactionId: transaction.id,
        paymentInstructions: result.instructions
      }
    };
  }

  private async processUSSDPayment(
    transaction: Transaction,
    request: InitializePaymentRequest
  ): Promise<InitializePaymentResponse> {
    // Generate USSD code for Nigerian banks
    const ussdCode = this.generateUSSDCode(transaction, request);

    return {
      success: true,
      message: 'USSD payment initiated',
      data: {
        reference: transaction.reference,
        transactionId: transaction.id,
        ussdCode,
        paymentInstructions: `Dial ${ussdCode} on your phone to complete payment`,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
      }
    };
  }

  private generateUSSDCode(transaction: Transaction, request: InitializePaymentRequest): string {
    // Generate bank-specific USSD code (Nigerian banks)
    return `*737*2*${Math.floor(request.amount)}*${transaction.reference.slice(-10)}#`;
  }

  private async processMobileMoneyPayout(
    transaction: Transaction,
    request: PayoutRequest
  ): Promise<PayoutResponse> {
    if (!this.mobileMoneyProvider) {
      throw new Error('Mobile money provider not configured');
    }

    const result = await this.mobileMoneyProvider.processPayout({
      amount: request.amount,
      currency: request.currency,
      phone: request.recipient.phone!,
      provider: request.recipient.provider || PaymentMethod.MPESA,
      reference: transaction.reference
    });

    await this.transactionManager.updateStatus(
      transaction.reference,
      result.success ? TransactionStatus.SUCCESSFUL : TransactionStatus.FAILED
    );

    return {
      success: result.success,
      transactionId: transaction.id,
      reference: transaction.reference,
      status: result.success ? TransactionStatus.SUCCESSFUL : TransactionStatus.FAILED,
      message: result.message
    };
  }

  private async processBankPayout(
    transaction: Transaction,
    request: PayoutRequest
  ): Promise<PayoutResponse> {
    if (!this.bankTransferProvider) {
      throw new Error('Bank transfer provider not configured');
    }

    const result = await this.bankTransferProvider.processPayout({
      amount: request.amount,
      currency: request.currency,
      accountNumber: request.recipient.accountNumber!,
      bankCode: request.recipient.bankCode!,
      accountName: request.recipient.accountName!,
      reference: transaction.reference
    });

    await this.transactionManager.updateStatus(
      transaction.reference,
      result.success ? TransactionStatus.PROCESSING : TransactionStatus.FAILED
    );

    return {
      success: result.success,
      transactionId: transaction.id,
      reference: transaction.reference,
      status: result.success ? TransactionStatus.PROCESSING : TransactionStatus.FAILED,
      message: result.message,
      estimatedArrival: result.success ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined
    };
  }

  private async syncTransactionStatus(transaction: Transaction): Promise<void> {
    // Query provider for current status
    let providerStatus: TransactionStatus | null = null;

    if (isMobileMoneyMethod(transaction.paymentMethod)) {
      providerStatus = await this.mobileMoneyProvider?.checkStatus(
        transaction.providerReference || transaction.reference
      ) || null;
    } else if (isCardMethod(transaction.paymentMethod)) {
      providerStatus = await this.cardProvider?.checkStatus(
        transaction.providerReference || transaction.reference
      ) || null;
    }

    if (providerStatus && providerStatus !== transaction.status) {
      await this.transactionManager.updateStatus(transaction.reference, providerStatus);

      // Send webhook if status changed to terminal state
      if (
        providerStatus === TransactionStatus.SUCCESSFUL ||
        providerStatus === TransactionStatus.FAILED
      ) {
        await this.webhookService.sendPaymentNotification(
          transaction.merchantId,
          transaction.reference,
          providerStatus
        );
      }
    }
  }
}

export default PaymentProcessor;
