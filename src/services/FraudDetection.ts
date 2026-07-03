/**
 * AfriPay Fraud Detection Service
 * Risk assessment and fraud prevention
 */

import { Currency, PaymentMethod, Country } from '../types';
import { Logger } from '../utils/Logger';

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface RiskAssessment {
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  flags: string[];
  recommendation: 'allow' | 'review' | 'block';
  details: Record<string, unknown>;
}

export interface TransactionContext {
  amount: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  customerPhone: string;
  customerEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  merchantId: string;
  country?: Country;
  metadata?: Record<string, unknown>;
}

interface CustomerProfile {
  phone: string;
  transactionCount: number;
  totalVolume: number;
  firstTransaction: Date;
  lastTransaction: Date;
  failedAttempts: number;
  chargebacks: number;
  countries: Set<string>;
  paymentMethods: Set<PaymentMethod>;
  averageAmount: number;
}

export class FraudDetectionService {
  private customerProfiles: Map<string, CustomerProfile>;
  private blockedIPs: Set<string>;
  private blockedPhones: Set<string>;
  private suspiciousPatterns: Map<string, number>;
  private logger: Logger;

  // Thresholds
  private readonly MAX_DAILY_TRANSACTIONS = 50;
  private readonly MAX_DAILY_VOLUME_MULTIPLIER = 10;
  private readonly HIGH_RISK_AMOUNT_THRESHOLD = 100000; // Amount in base currency
  private readonly VELOCITY_WINDOW_MS = 3600000; // 1 hour
  private readonly MAX_VELOCITY_TRANSACTIONS = 10;

  constructor() {
    this.customerProfiles = new Map();
    this.blockedIPs = new Set();
    this.blockedPhones = new Set();
    this.suspiciousPatterns = new Map();
    this.logger = new Logger('FraudDetection');
  }

  /**
   * Assess transaction risk
   */
  async assessRisk(context: TransactionContext): Promise<RiskAssessment> {
    const flags: string[] = [];
    let riskScore = 0;

    // Check blocklists
    if (this.isBlocked(context)) {
      return {
        riskLevel: RiskLevel.CRITICAL,
        riskScore: 100,
        flags: ['BLOCKED_ENTITY'],
        recommendation: 'block',
        details: { reason: 'Entity is blocklisted' }
      };
    }

    // Get or create customer profile
    const profile = this.getCustomerProfile(context.customerPhone);

    // Rule 1: New customer with high amount
    if (!profile && context.amount > this.HIGH_RISK_AMOUNT_THRESHOLD) {
      flags.push('NEW_CUSTOMER_HIGH_AMOUNT');
      riskScore += 25;
    }

    // Rule 2: Check velocity (too many transactions in short time)
    const velocityRisk = this.checkVelocity(context.customerPhone);
    if (velocityRisk.exceeded) {
      flags.push('VELOCITY_EXCEEDED');
      riskScore += velocityRisk.score;
    }

    // Rule 3: Unusual transaction amount
    if (profile) {
      const amountRisk = this.checkAmountAnomaly(context.amount, profile);
      if (amountRisk.unusual) {
        flags.push('UNUSUAL_AMOUNT');
        riskScore += amountRisk.score;
      }
    }

    // Rule 4: Geographic anomaly
    if (context.country && profile) {
      if (!profile.countries.has(context.country)) {
        flags.push('NEW_COUNTRY');
        riskScore += 15;
      }
    }

    // Rule 5: New payment method for existing customer
    if (profile && !profile.paymentMethods.has(context.paymentMethod)) {
      flags.push('NEW_PAYMENT_METHOD');
      riskScore += 10;
    }

    // Rule 6: Failed attempts history
    if (profile && profile.failedAttempts > 3) {
      flags.push('MULTIPLE_FAILURES');
      riskScore += 20;
    }

    // Rule 7: Chargeback history
    if (profile && profile.chargebacks > 0) {
      flags.push('CHARGEBACK_HISTORY');
      riskScore += 30 * profile.chargebacks;
    }

    // Rule 8: Suspicious IP patterns
    if (context.ipAddress) {
      const ipRisk = this.checkIPRisk(context.ipAddress);
      if (ipRisk.suspicious) {
        flags.push('SUSPICIOUS_IP');
        riskScore += ipRisk.score;
      }
    }

    // Rule 9: Time-based anomaly (unusual hours)
    const hour = new Date().getHours();
    if (hour >= 1 && hour <= 5) {
      flags.push('OFF_HOURS_TRANSACTION');
      riskScore += 5;
    }

    // Rule 10: Device/User agent analysis
    if (context.userAgent) {
      const deviceRisk = this.checkDeviceRisk(context.userAgent);
      if (deviceRisk.suspicious) {
        flags.push('SUSPICIOUS_DEVICE');
        riskScore += deviceRisk.score;
      }
    }

    // Cap score at 100
    riskScore = Math.min(riskScore, 100);

    // Determine risk level
    let riskLevel: RiskLevel;
    let recommendation: 'allow' | 'review' | 'block';

    if (riskScore >= 80) {
      riskLevel = RiskLevel.CRITICAL;
      recommendation = 'block';
    } else if (riskScore >= 60) {
      riskLevel = RiskLevel.HIGH;
      recommendation = 'review';
    } else if (riskScore >= 30) {
      riskLevel = RiskLevel.MEDIUM;
      recommendation = 'review';
    } else {
      riskLevel = RiskLevel.LOW;
      recommendation = 'allow';
    }

    // Log assessment
    if (riskScore >= 30) {
      this.logger.warn('Elevated risk detected', {
        phone: context.customerPhone.slice(-4),
        riskScore,
        flags
      });
    }

    return {
      riskLevel,
      riskScore,
      flags,
      recommendation,
      details: {
        customerHistory: profile ? {
          transactionCount: profile.transactionCount,
          totalVolume: profile.totalVolume,
          chargebacks: profile.chargebacks
        } : null
      }
    };
  }

  /**
   * Record transaction outcome for learning
   */
  recordTransaction(
    phone: string,
    amount: number,
    currency: Currency,
    paymentMethod: PaymentMethod,
    country: Country,
    successful: boolean
  ): void {
    let profile = this.customerProfiles.get(phone);

    if (!profile) {
      profile = {
        phone,
        transactionCount: 0,
        totalVolume: 0,
        firstTransaction: new Date(),
        lastTransaction: new Date(),
        failedAttempts: 0,
        chargebacks: 0,
        countries: new Set(),
        paymentMethods: new Set(),
        averageAmount: 0
      };
      this.customerProfiles.set(phone, profile);
    }

    profile.lastTransaction = new Date();
    profile.countries.add(country);
    profile.paymentMethods.add(paymentMethod);

    if (successful) {
      profile.transactionCount++;
      profile.totalVolume += amount;
      profile.averageAmount = profile.totalVolume / profile.transactionCount;
    } else {
      profile.failedAttempts++;
    }

    // Track velocity
    const velocityKey = `velocity:${phone}`;
    const currentVelocity = this.suspiciousPatterns.get(velocityKey) || 0;
    this.suspiciousPatterns.set(velocityKey, currentVelocity + 1);

    // Clear velocity after window
    setTimeout(() => {
      const current = this.suspiciousPatterns.get(velocityKey) || 0;
      this.suspiciousPatterns.set(velocityKey, Math.max(0, current - 1));
    }, this.VELOCITY_WINDOW_MS);
  }

  /**
   * Record chargeback
   */
  recordChargeback(phone: string): void {
    const profile = this.customerProfiles.get(phone);
    if (profile) {
      profile.chargebacks++;

      // Auto-block after 3 chargebacks
      if (profile.chargebacks >= 3) {
        this.blockPhone(phone);
      }
    }
  }

  /**
   * Block phone number
   */
  blockPhone(phone: string): void {
    this.blockedPhones.add(phone);
    this.logger.warn(`Phone blocked: ${phone.slice(-4)}`);
  }

  /**
   * Block IP address
   */
  blockIP(ip: string): void {
    this.blockedIPs.add(ip);
    this.logger.warn(`IP blocked: ${ip}`);
  }

  /**
   * Unblock phone number
   */
  unblockPhone(phone: string): void {
    this.blockedPhones.delete(phone);
  }

  /**
   * Unblock IP address
   */
  unblockIP(ip: string): void {
    this.blockedIPs.delete(ip);
  }

  // Private helper methods

  private isBlocked(context: TransactionContext): boolean {
    if (this.blockedPhones.has(context.customerPhone)) {
      return true;
    }
    if (context.ipAddress && this.blockedIPs.has(context.ipAddress)) {
      return true;
    }
    return false;
  }

  private getCustomerProfile(phone: string): CustomerProfile | undefined {
    return this.customerProfiles.get(phone);
  }

  private checkVelocity(phone: string): { exceeded: boolean; score: number } {
    const velocityKey = `velocity:${phone}`;
    const count = this.suspiciousPatterns.get(velocityKey) || 0;

    if (count > this.MAX_VELOCITY_TRANSACTIONS) {
      return { exceeded: true, score: 40 };
    } else if (count > this.MAX_VELOCITY_TRANSACTIONS / 2) {
      return { exceeded: true, score: 20 };
    }

    return { exceeded: false, score: 0 };
  }

  private checkAmountAnomaly(
    amount: number,
    profile: CustomerProfile
  ): { unusual: boolean; score: number } {
    if (profile.transactionCount < 5) {
      return { unusual: false, score: 0 };
    }

    const ratio = amount / profile.averageAmount;

    if (ratio > 10) {
      return { unusual: true, score: 30 };
    } else if (ratio > 5) {
      return { unusual: true, score: 20 };
    } else if (ratio > 3) {
      return { unusual: true, score: 10 };
    }

    return { unusual: false, score: 0 };
  }

  private checkIPRisk(ip: string): { suspicious: boolean; score: number } {
    // Check for known VPN/proxy patterns
    // In production, use IP reputation service

    // Check if multiple accounts using same IP
    // This is a simplified check
    return { suspicious: false, score: 0 };
  }

  private checkDeviceRisk(userAgent: string): { suspicious: boolean; score: number } {
    const ua = userAgent.toLowerCase();

    // Suspicious user agents
    if (
      ua.includes('curl') ||
      ua.includes('wget') ||
      ua.includes('python-requests') ||
      ua.includes('postman')
    ) {
      return { suspicious: true, score: 15 };
    }

    // Very old browsers
    if (
      ua.includes('msie 6') ||
      ua.includes('msie 7') ||
      ua.includes('msie 8')
    ) {
      return { suspicious: true, score: 20 };
    }

    return { suspicious: false, score: 0 };
  }

  /**
   * Get fraud statistics
   */
  getStats(): {
    totalCustomers: number;
    blockedPhones: number;
    blockedIPs: number;
    highRiskCustomers: number;
  } {
    let highRiskCustomers = 0;

    for (const profile of this.customerProfiles.values()) {
      if (profile.chargebacks > 0 || profile.failedAttempts > 5) {
        highRiskCustomers++;
      }
    }

    return {
      totalCustomers: this.customerProfiles.size,
      blockedPhones: this.blockedPhones.size,
      blockedIPs: this.blockedIPs.size,
      highRiskCustomers
    };
  }
}

export default FraudDetectionService;
