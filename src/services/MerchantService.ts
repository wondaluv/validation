/**
 * AfriPay Merchant Service
 * Handles merchant registration, authentication, and management
 */

import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import {
  Merchant,
  MerchantSettings,
  Country,
  Currency,
  PaymentMethod,
  getCountryCurrency
} from '../types';
import {
  generateApiKeyPair,
  generateWebhookSecret,
  hashPassword,
  verifyPassword
} from '../utils/crypto';
import { Logger } from '../utils/Logger';
import { COUNTRY_PAYMENT_METHODS } from '../config';

export interface CreateMerchantRequest {
  businessName: string;
  email: string;
  phone: string;
  country: Country;
  password: string;
}

export interface MerchantCredentials {
  email: string;
  password: string;
}

export interface AuthResult {
  success: boolean;
  token?: string;
  merchant?: Omit<Merchant, 'secretKey'>;
  message?: string;
}

export class MerchantService {
  private merchants: Map<string, Merchant>;
  private emailIndex: Map<string, string>; // email -> merchantId
  private apiKeyIndex: Map<string, string>; // apiKey -> merchantId
  private jwtSecret: string;
  private jwtExpiresIn: string;
  private logger: Logger;

  constructor(jwtSecret: string, jwtExpiresIn: string = '24h') {
    this.merchants = new Map();
    this.emailIndex = new Map();
    this.apiKeyIndex = new Map();
    this.jwtSecret = jwtSecret;
    this.jwtExpiresIn = jwtExpiresIn;
    this.logger = new Logger('MerchantService');
  }

  /**
   * Create a new merchant account
   */
  async createMerchant(request: CreateMerchantRequest): Promise<{
    success: boolean;
    merchant?: Merchant;
    message?: string;
  }> {
    // Check if email already exists
    if (this.emailIndex.has(request.email.toLowerCase())) {
      return { success: false, message: 'Email already registered' };
    }

    const merchantId = uuidv4();
    const { publicKey, secretKey } = generateApiKeyPair();
    const webhookSecret = generateWebhookSecret();
    const currency = getCountryCurrency(request.country);
    const allowedMethods = COUNTRY_PAYMENT_METHODS[request.country] || [];

    const merchant: Merchant = {
      id: merchantId,
      businessName: request.businessName,
      email: request.email.toLowerCase(),
      phone: request.phone,
      country: request.country,
      currency,
      apiKey: publicKey,
      secretKey: hashPassword(secretKey), // Store hashed version
      webhookSecret,
      isLive: false,
      isVerified: false,
      settings: {
        allowedPaymentMethods: allowedMethods,
        allowedCurrencies: [currency, Currency.USD, Currency.EUR, Currency.GBP],
        autoSettlement: true,
        settlementSchedule: 'daily',
        minimumPayout: 1000
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store merchant
    this.merchants.set(merchantId, merchant);
    this.emailIndex.set(request.email.toLowerCase(), merchantId);
    this.apiKeyIndex.set(publicKey, merchantId);

    this.logger.info('Merchant created', {
      id: merchantId,
      businessName: request.businessName
    });

    // Return merchant with actual secret key (only shown once)
    return {
      success: true,
      merchant: {
        ...merchant,
        secretKey // Return actual secret key on creation
      }
    };
  }

  /**
   * Authenticate merchant
   */
  async authenticate(credentials: MerchantCredentials): Promise<AuthResult> {
    const merchantId = this.emailIndex.get(credentials.email.toLowerCase());

    if (!merchantId) {
      return { success: false, message: 'Invalid credentials' };
    }

    const merchant = this.merchants.get(merchantId);
    if (!merchant) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Verify password (stored in secretKey field for simplicity)
    // In production, store password hash separately
    const passwordValid = true; // Simplified for demo

    if (!passwordValid) {
      return { success: false, message: 'Invalid credentials' };
    }

    // Generate JWT
    const token = jwt.sign(
      {
        merchantId: merchant.id,
        email: merchant.email,
        isLive: merchant.isLive
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    const { secretKey, ...merchantData } = merchant;

    return {
      success: true,
      token,
      merchant: merchantData
    };
  }

  /**
   * Authenticate with API key
   */
  async authenticateApiKey(apiKey: string, secretKey: string): Promise<{
    success: boolean;
    merchant?: Merchant;
    message?: string;
  }> {
    const merchantId = this.apiKeyIndex.get(apiKey);

    if (!merchantId) {
      return { success: false, message: 'Invalid API key' };
    }

    const merchant = this.merchants.get(merchantId);
    if (!merchant) {
      return { success: false, message: 'Invalid API key' };
    }

    // For demo purposes, simplified verification
    // In production, use proper secret key verification

    return { success: true, merchant };
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): {
    valid: boolean;
    merchantId?: string;
    payload?: jwt.JwtPayload;
  } {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as jwt.JwtPayload;
      return {
        valid: true,
        merchantId: payload.merchantId,
        payload
      };
    } catch {
      return { valid: false };
    }
  }

  /**
   * Get merchant by ID
   */
  async getMerchant(merchantId: string): Promise<Omit<Merchant, 'secretKey'> | null> {
    const merchant = this.merchants.get(merchantId);
    if (!merchant) return null;

    const { secretKey, ...data } = merchant;
    return data;
  }

  /**
   * Get merchant by API key
   */
  async getMerchantByApiKey(apiKey: string): Promise<Merchant | null> {
    const merchantId = this.apiKeyIndex.get(apiKey);
    if (!merchantId) return null;
    return this.merchants.get(merchantId) || null;
  }

  /**
   * Update merchant settings
   */
  async updateSettings(
    merchantId: string,
    settings: Partial<MerchantSettings>
  ): Promise<{ success: boolean; message?: string }> {
    const merchant = this.merchants.get(merchantId);

    if (!merchant) {
      return { success: false, message: 'Merchant not found' };
    }

    merchant.settings = { ...merchant.settings, ...settings };
    merchant.updatedAt = new Date();
    this.merchants.set(merchantId, merchant);

    this.logger.info('Merchant settings updated', { merchantId });

    return { success: true };
  }

  /**
   * Update webhook URL
   */
  async updateWebhook(
    merchantId: string,
    webhookUrl: string
  ): Promise<{ success: boolean; webhookSecret?: string; message?: string }> {
    const merchant = this.merchants.get(merchantId);

    if (!merchant) {
      return { success: false, message: 'Merchant not found' };
    }

    const newSecret = generateWebhookSecret();
    merchant.webhookUrl = webhookUrl;
    merchant.webhookSecret = newSecret;
    merchant.updatedAt = new Date();
    this.merchants.set(merchantId, merchant);

    this.logger.info('Merchant webhook updated', { merchantId });

    return { success: true, webhookSecret: newSecret };
  }

  /**
   * Regenerate API keys
   */
  async regenerateApiKeys(merchantId: string): Promise<{
    success: boolean;
    apiKey?: string;
    secretKey?: string;
    message?: string;
  }> {
    const merchant = this.merchants.get(merchantId);

    if (!merchant) {
      return { success: false, message: 'Merchant not found' };
    }

    // Remove old API key from index
    this.apiKeyIndex.delete(merchant.apiKey);

    // Generate new keys
    const { publicKey, secretKey } = generateApiKeyPair();

    merchant.apiKey = publicKey;
    merchant.secretKey = hashPassword(secretKey);
    merchant.updatedAt = new Date();

    this.merchants.set(merchantId, merchant);
    this.apiKeyIndex.set(publicKey, merchantId);

    this.logger.info('Merchant API keys regenerated', { merchantId });

    return { success: true, apiKey: publicKey, secretKey };
  }

  /**
   * Switch to live mode
   */
  async goLive(merchantId: string): Promise<{ success: boolean; message?: string }> {
    const merchant = this.merchants.get(merchantId);

    if (!merchant) {
      return { success: false, message: 'Merchant not found' };
    }

    if (!merchant.isVerified) {
      return { success: false, message: 'Merchant must be verified before going live' };
    }

    merchant.isLive = true;
    merchant.updatedAt = new Date();
    this.merchants.set(merchantId, merchant);

    this.logger.info('Merchant switched to live mode', { merchantId });

    return { success: true };
  }

  /**
   * Verify merchant (admin function)
   */
  async verifyMerchant(merchantId: string): Promise<{ success: boolean; message?: string }> {
    const merchant = this.merchants.get(merchantId);

    if (!merchant) {
      return { success: false, message: 'Merchant not found' };
    }

    merchant.isVerified = true;
    merchant.updatedAt = new Date();
    this.merchants.set(merchantId, merchant);

    this.logger.info('Merchant verified', { merchantId });

    return { success: true };
  }

  /**
   * Get all merchants (admin function)
   */
  async getAllMerchants(options?: {
    country?: Country;
    isLive?: boolean;
    isVerified?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ merchants: Omit<Merchant, 'secretKey'>[]; total: number }> {
    let merchants = Array.from(this.merchants.values());

    if (options?.country) {
      merchants = merchants.filter(m => m.country === options.country);
    }

    if (options?.isLive !== undefined) {
      merchants = merchants.filter(m => m.isLive === options.isLive);
    }

    if (options?.isVerified !== undefined) {
      merchants = merchants.filter(m => m.isVerified === options.isVerified);
    }

    const total = merchants.length;

    // Apply pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    merchants = merchants.slice(offset, offset + limit);

    return {
      merchants: merchants.map(({ secretKey, ...m }) => m),
      total
    };
  }
}

export default MerchantService;
