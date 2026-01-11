/**
 * AfriPay Webhook Service
 * Handles webhook delivery and retry logic
 */

import axios, { AxiosError } from 'axios';
import {
  WebhookEvent,
  WebhookPayload,
  Transaction,
  TransactionStatus
} from '../types';
import { createWebhookSignature } from '../utils/crypto';
import { Logger } from '../utils/Logger';

interface WebhookDelivery {
  id: string;
  merchantId: string;
  url: string;
  event: WebhookEvent;
  payload: WebhookPayload;
  attempts: number;
  maxAttempts: number;
  nextRetry?: Date;
  lastError?: string;
  deliveredAt?: Date;
  status: 'pending' | 'delivered' | 'failed';
}

interface MerchantWebhookConfig {
  url: string;
  secret: string;
  events: WebhookEvent[];
  isActive: boolean;
}

export class WebhookService {
  private defaultSecret: string;
  private merchantConfigs: Map<string, MerchantWebhookConfig>;
  private deliveryQueue: Map<string, WebhookDelivery>;
  private logger: Logger;

  private readonly MAX_ATTEMPTS = 5;
  private readonly RETRY_DELAYS = [60, 300, 900, 3600, 7200]; // seconds
  private readonly TIMEOUT = 30000; // 30 seconds

  constructor(defaultSecret: string) {
    this.defaultSecret = defaultSecret;
    this.merchantConfigs = new Map();
    this.deliveryQueue = new Map();
    this.logger = new Logger('WebhookService');
  }

  /**
   * Register merchant webhook configuration
   */
  registerMerchant(
    merchantId: string,
    config: MerchantWebhookConfig
  ): void {
    this.merchantConfigs.set(merchantId, config);
    this.logger.info(`Registered webhook for merchant: ${merchantId}`);
  }

  /**
   * Unregister merchant webhook
   */
  unregisterMerchant(merchantId: string): void {
    this.merchantConfigs.delete(merchantId);
  }

  /**
   * Send payment notification webhook
   */
  async sendPaymentNotification(
    merchantId: string,
    reference: string,
    status: TransactionStatus,
    transaction?: Transaction
  ): Promise<boolean> {
    const event = this.getPaymentEvent(status);
    if (!event) return false;

    const payload: WebhookPayload = {
      event,
      data: {
        transaction: transaction || {
          reference,
          status
        } as unknown as Transaction
      },
      timestamp: new Date(),
      signature: ''
    };

    return this.send(merchantId, event, payload);
  }

  /**
   * Send generic webhook event
   */
  async send(
    merchantId: string,
    event: WebhookEvent,
    payload: WebhookPayload
  ): Promise<boolean> {
    const config = this.merchantConfigs.get(merchantId);

    if (!config || !config.isActive) {
      this.logger.debug(`No active webhook config for merchant: ${merchantId}`);
      return false;
    }

    if (!config.events.includes(event)) {
      this.logger.debug(`Event ${event} not subscribed by merchant: ${merchantId}`);
      return false;
    }

    // Sign the payload
    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(payload);
    const signature = createWebhookSignature(
      payloadString,
      config.secret,
      timestamp
    );

    payload.signature = `t=${timestamp},v1=${signature}`;

    // Create delivery record
    const deliveryId = `${merchantId}_${event}_${Date.now()}`;
    const delivery: WebhookDelivery = {
      id: deliveryId,
      merchantId,
      url: config.url,
      event,
      payload,
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS,
      status: 'pending'
    };

    this.deliveryQueue.set(deliveryId, delivery);

    // Attempt delivery
    return this.attemptDelivery(delivery);
  }

  /**
   * Attempt to deliver a webhook
   */
  private async attemptDelivery(delivery: WebhookDelivery): Promise<boolean> {
    delivery.attempts++;

    try {
      const response = await axios.post(delivery.url, delivery.payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-AfriPay-Signature': delivery.payload.signature,
          'X-AfriPay-Event': delivery.event,
          'X-AfriPay-Delivery': delivery.id
        },
        timeout: this.TIMEOUT
      });

      if (response.status >= 200 && response.status < 300) {
        delivery.status = 'delivered';
        delivery.deliveredAt = new Date();

        this.logger.info(`Webhook delivered: ${delivery.id}`, {
          event: delivery.event,
          url: delivery.url,
          attempts: delivery.attempts
        });

        return true;
      }

      throw new Error(`Unexpected status code: ${response.status}`);
    } catch (error) {
      const errorMessage = error instanceof AxiosError
        ? error.message
        : 'Unknown error';

      delivery.lastError = errorMessage;

      this.logger.warn(`Webhook delivery failed: ${delivery.id}`, {
        event: delivery.event,
        attempt: delivery.attempts,
        error: errorMessage
      });

      // Schedule retry if attempts remaining
      if (delivery.attempts < delivery.maxAttempts) {
        const retryDelay = this.RETRY_DELAYS[delivery.attempts - 1] || 7200;
        delivery.nextRetry = new Date(Date.now() + retryDelay * 1000);

        this.logger.info(`Scheduling retry for ${delivery.id} in ${retryDelay}s`);

        // In production, use a job queue (Redis, Bull, etc.)
        setTimeout(() => {
          this.attemptDelivery(delivery);
        }, retryDelay * 1000);
      } else {
        delivery.status = 'failed';
        this.logger.error(`Webhook failed permanently: ${delivery.id}`, {
          event: delivery.event,
          attempts: delivery.attempts
        });
      }

      return false;
    }
  }

  /**
   * Get webhook event for transaction status
   */
  private getPaymentEvent(status: TransactionStatus): WebhookEvent | null {
    const eventMap: Partial<Record<TransactionStatus, WebhookEvent>> = {
      [TransactionStatus.SUCCESSFUL]: WebhookEvent.PAYMENT_SUCCESSFUL,
      [TransactionStatus.FAILED]: WebhookEvent.PAYMENT_FAILED,
      [TransactionStatus.PENDING]: WebhookEvent.PAYMENT_PENDING,
      [TransactionStatus.REFUNDED]: WebhookEvent.REFUND_SUCCESSFUL
    };

    return eventMap[status] || null;
  }

  /**
   * Get pending deliveries for a merchant
   */
  getPendingDeliveries(merchantId: string): WebhookDelivery[] {
    const deliveries: WebhookDelivery[] = [];

    for (const delivery of this.deliveryQueue.values()) {
      if (delivery.merchantId === merchantId && delivery.status === 'pending') {
        deliveries.push(delivery);
      }
    }

    return deliveries;
  }

  /**
   * Retry failed deliveries
   */
  async retryFailed(merchantId: string): Promise<number> {
    let retried = 0;

    for (const delivery of this.deliveryQueue.values()) {
      if (
        delivery.merchantId === merchantId &&
        delivery.status === 'failed' &&
        delivery.attempts < delivery.maxAttempts
      ) {
        delivery.status = 'pending';
        this.attemptDelivery(delivery);
        retried++;
      }
    }

    return retried;
  }

  /**
   * Get delivery statistics
   */
  getStats(merchantId: string): {
    total: number;
    delivered: number;
    pending: number;
    failed: number;
  } {
    let total = 0;
    let delivered = 0;
    let pending = 0;
    let failed = 0;

    for (const delivery of this.deliveryQueue.values()) {
      if (delivery.merchantId === merchantId) {
        total++;
        switch (delivery.status) {
          case 'delivered':
            delivered++;
            break;
          case 'pending':
            pending++;
            break;
          case 'failed':
            failed++;
            break;
        }
      }
    }

    return { total, delivered, pending, failed };
  }

  /**
   * Test webhook endpoint
   */
  async testEndpoint(url: string, secret: string): Promise<{
    success: boolean;
    statusCode?: number;
    error?: string;
    responseTime?: number;
  }> {
    const testPayload: WebhookPayload = {
      event: WebhookEvent.PAYMENT_SUCCESSFUL,
      data: {
        transaction: {
          reference: 'test_webhook',
          status: TransactionStatus.SUCCESSFUL
        } as unknown as Transaction
      },
      timestamp: new Date(),
      signature: ''
    };

    const timestamp = Math.floor(Date.now() / 1000);
    const payloadString = JSON.stringify(testPayload);
    testPayload.signature = `t=${timestamp},v1=${createWebhookSignature(
      payloadString,
      secret,
      timestamp
    )}`;

    const startTime = Date.now();

    try {
      const response = await axios.post(url, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'X-AfriPay-Signature': testPayload.signature,
          'X-AfriPay-Event': 'test',
          'X-AfriPay-Test': 'true'
        },
        timeout: this.TIMEOUT
      });

      return {
        success: response.status >= 200 && response.status < 300,
        statusCode: response.status,
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof AxiosError ? error.message : 'Unknown error',
        responseTime: Date.now() - startTime
      };
    }
  }
}

export default WebhookService;
