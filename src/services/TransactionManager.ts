/**
 * AfriPay Transaction Manager
 * Handles transaction lifecycle, storage, and retrieval
 */

import {
  Transaction,
  TransactionStatus,
  TransactionType,
  PaymentMethod,
  Currency
} from '../types';
import { Logger } from '../utils/Logger';

export interface TransactionQuery {
  status?: TransactionStatus;
  type?: TransactionType;
  paymentMethod?: PaymentMethod;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  currency?: Currency;
  limit?: number;
  offset?: number;
}

export interface TransactionStats {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalVolume: number;
  totalFees: number;
  averageAmount: number;
  successRate: number;
}

export class TransactionManager {
  private transactions: Map<string, Transaction>;
  private referenceIndex: Map<string, string>; // reference -> id
  private merchantIndex: Map<string, Set<string>>; // merchantId -> transaction ids
  private logger: Logger;

  constructor() {
    this.transactions = new Map();
    this.referenceIndex = new Map();
    this.merchantIndex = new Map();
    this.logger = new Logger('TransactionManager');
  }

  /**
   * Create a new transaction
   */
  async create(transaction: Transaction): Promise<Transaction> {
    // Validate transaction
    this.validateTransaction(transaction);

    // Store transaction
    this.transactions.set(transaction.id, transaction);
    this.referenceIndex.set(transaction.reference, transaction.id);

    // Update merchant index
    if (!this.merchantIndex.has(transaction.merchantId)) {
      this.merchantIndex.set(transaction.merchantId, new Set());
    }
    this.merchantIndex.get(transaction.merchantId)!.add(transaction.id);

    this.logger.info(`Transaction created: ${transaction.reference}`, {
      id: transaction.id,
      amount: transaction.amount,
      currency: transaction.currency,
      status: transaction.status
    });

    return transaction;
  }

  /**
   * Find transaction by ID
   */
  async findById(id: string): Promise<Transaction | null> {
    return this.transactions.get(id) || null;
  }

  /**
   * Find transaction by reference
   */
  async findByReference(reference: string): Promise<Transaction | null> {
    const id = this.referenceIndex.get(reference);
    if (!id) return null;
    return this.transactions.get(id) || null;
  }

  /**
   * Find transactions by merchant
   */
  async findByMerchant(
    merchantId: string,
    options?: TransactionQuery
  ): Promise<{ transactions: Transaction[]; total: number }> {
    const transactionIds = this.merchantIndex.get(merchantId);

    if (!transactionIds || transactionIds.size === 0) {
      return { transactions: [], total: 0 };
    }

    let transactions: Transaction[] = [];

    for (const id of transactionIds) {
      const tx = this.transactions.get(id);
      if (tx) {
        transactions.push(tx);
      }
    }

    // Apply filters
    if (options?.status) {
      transactions = transactions.filter(tx => tx.status === options.status);
    }

    if (options?.type) {
      transactions = transactions.filter(tx => tx.type === options.type);
    }

    if (options?.paymentMethod) {
      transactions = transactions.filter(tx => tx.paymentMethod === options.paymentMethod);
    }

    if (options?.currency) {
      transactions = transactions.filter(tx => tx.currency === options.currency);
    }

    if (options?.startDate) {
      transactions = transactions.filter(tx => tx.createdAt >= options.startDate!);
    }

    if (options?.endDate) {
      transactions = transactions.filter(tx => tx.createdAt <= options.endDate!);
    }

    if (options?.minAmount !== undefined) {
      transactions = transactions.filter(tx => tx.amount >= options.minAmount!);
    }

    if (options?.maxAmount !== undefined) {
      transactions = transactions.filter(tx => tx.amount <= options.maxAmount!);
    }

    // Sort by date descending
    transactions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = transactions.length;

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    transactions = transactions.slice(offset, offset + limit);

    return { transactions, total };
  }

  /**
   * Update transaction
   */
  async update(
    reference: string,
    updates: Partial<Transaction>
  ): Promise<Transaction | null> {
    const transaction = await this.findByReference(reference);

    if (!transaction) {
      this.logger.warn(`Transaction not found for update: ${reference}`);
      return null;
    }

    const updated: Transaction = {
      ...transaction,
      ...updates,
      updatedAt: new Date()
    };

    this.transactions.set(transaction.id, updated);

    this.logger.info(`Transaction updated: ${reference}`, updates);

    return updated;
  }

  /**
   * Update transaction status
   */
  async updateStatus(
    reference: string,
    status: TransactionStatus,
    additionalData?: Partial<Transaction>
  ): Promise<Transaction | null> {
    const updates: Partial<Transaction> = {
      status,
      ...additionalData
    };

    if (status === TransactionStatus.SUCCESSFUL) {
      updates.completedAt = new Date();
    }

    return this.update(reference, updates);
  }

  /**
   * Get transaction statistics for a merchant
   */
  async getStats(
    merchantId: string,
    options?: { startDate?: Date; endDate?: Date; currency?: Currency }
  ): Promise<TransactionStats> {
    const { transactions } = await this.findByMerchant(merchantId, {
      ...options,
      limit: 100000 // Get all
    });

    const successful = transactions.filter(
      tx => tx.status === TransactionStatus.SUCCESSFUL
    );

    const failed = transactions.filter(
      tx => tx.status === TransactionStatus.FAILED
    );

    const totalVolume = successful.reduce((sum, tx) => sum + tx.amount, 0);
    const totalFees = successful.reduce((sum, tx) => sum + tx.fee, 0);

    return {
      totalTransactions: transactions.length,
      successfulTransactions: successful.length,
      failedTransactions: failed.length,
      totalVolume,
      totalFees,
      averageAmount: successful.length > 0 ? totalVolume / successful.length : 0,
      successRate: transactions.length > 0
        ? (successful.length / transactions.length) * 100
        : 0
    };
  }

  /**
   * Get daily volume summary
   */
  async getDailyVolume(
    merchantId: string,
    days: number = 30
  ): Promise<Array<{ date: string; volume: number; count: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { transactions } = await this.findByMerchant(merchantId, {
      startDate,
      endDate,
      status: TransactionStatus.SUCCESSFUL,
      limit: 100000
    });

    const dailyMap = new Map<string, { volume: number; count: number }>();

    for (const tx of transactions) {
      const date = tx.createdAt.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { volume: 0, count: 0 };
      dailyMap.set(date, {
        volume: existing.volume + tx.amount,
        count: existing.count + 1
      });
    }

    const result: Array<{ date: string; volume: number; count: number }> = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const date = d.toISOString().split('T')[0];
      const data = dailyMap.get(date) || { volume: 0, count: 0 };
      result.push({ date, ...data });
    }

    return result;
  }

  /**
   * Get payment method breakdown
   */
  async getPaymentMethodBreakdown(
    merchantId: string,
    options?: { startDate?: Date; endDate?: Date }
  ): Promise<Array<{ method: PaymentMethod; volume: number; count: number; percentage: number }>> {
    const { transactions } = await this.findByMerchant(merchantId, {
      ...options,
      status: TransactionStatus.SUCCESSFUL,
      limit: 100000
    });

    const methodMap = new Map<PaymentMethod, { volume: number; count: number }>();

    for (const tx of transactions) {
      const existing = methodMap.get(tx.paymentMethod) || { volume: 0, count: 0 };
      methodMap.set(tx.paymentMethod, {
        volume: existing.volume + tx.amount,
        count: existing.count + 1
      });
    }

    const totalVolume = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    const result: Array<{ method: PaymentMethod; volume: number; count: number; percentage: number }> = [];

    for (const [method, data] of methodMap) {
      result.push({
        method,
        ...data,
        percentage: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0
      });
    }

    // Sort by volume descending
    result.sort((a, b) => b.volume - a.volume);

    return result;
  }

  /**
   * Validate transaction data
   */
  private validateTransaction(transaction: Transaction): void {
    if (!transaction.id) {
      throw new Error('Transaction ID is required');
    }

    if (!transaction.reference) {
      throw new Error('Transaction reference is required');
    }

    if (!transaction.merchantId) {
      throw new Error('Merchant ID is required');
    }

    if (transaction.amount <= 0) {
      throw new Error('Transaction amount must be positive');
    }

    if (this.referenceIndex.has(transaction.reference)) {
      throw new Error(`Duplicate reference: ${transaction.reference}`);
    }
  }

  /**
   * Delete old transactions (for cleanup)
   */
  async cleanupOldTransactions(olderThan: Date): Promise<number> {
    let count = 0;

    for (const [id, tx] of this.transactions) {
      if (tx.createdAt < olderThan) {
        this.transactions.delete(id);
        this.referenceIndex.delete(tx.reference);

        const merchantTxs = this.merchantIndex.get(tx.merchantId);
        if (merchantTxs) {
          merchantTxs.delete(id);
        }

        count++;
      }
    }

    this.logger.info(`Cleaned up ${count} old transactions`);

    return count;
  }
}

export default TransactionManager;
