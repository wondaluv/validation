/**
 * AfriPay Cryptographic Utilities
 * Secure encryption and hashing for sensitive data
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 64;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Generate a secure random string
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate API key pair
 */
export function generateApiKeyPair(): { publicKey: string; secretKey: string } {
  return {
    publicKey: `pk_${generateSecureToken(16)}`,
    secretKey: `sk_${generateSecureToken(32)}`
  };
}

/**
 * Generate webhook secret
 */
export function generateWebhookSecret(): string {
  return `whsec_${generateSecureToken(24)}`;
}

/**
 * Hash a password using PBKDF2
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(':');
  const salt = Buffer.from(saltHex, 'hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
  return hash.toString('hex') === hashHex;
}

/**
 * Encrypt sensitive data
 */
export function encrypt(plaintext: string, encryptionKey: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.scryptSync(encryptionKey, 'afripay-salt', KEY_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(ciphertext: string, encryptionKey: string): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = crypto.scryptSync(encryptionKey, 'afripay-salt', KEY_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Create HMAC signature for webhooks
 */
export function createWebhookSignature(
  payload: string,
  secret: string,
  timestamp: number
): string {
  const signedPayload = `${timestamp}.${payload}`;
  return crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: number,
  tolerance: number = 300 // 5 minutes
): boolean {
  const currentTime = Math.floor(Date.now() / 1000);

  // Check timestamp tolerance
  if (Math.abs(currentTime - timestamp) > tolerance) {
    return false;
  }

  const expectedSignature = createWebhookSignature(payload, secret, timestamp);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Mask sensitive data (e.g., card numbers, phone numbers)
 */
export function maskSensitiveData(data: string, visibleStart: number = 4, visibleEnd: number = 4): string {
  if (data.length <= visibleStart + visibleEnd) {
    return '*'.repeat(data.length);
  }

  const start = data.slice(0, visibleStart);
  const end = data.slice(-visibleEnd);
  const masked = '*'.repeat(data.length - visibleStart - visibleEnd);

  return `${start}${masked}${end}`;
}

/**
 * Generate a transaction reference
 */
export function generateTransactionReference(prefix: string = 'TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Hash card number for storage (for card fingerprinting)
 */
export function hashCardNumber(cardNumber: string): string {
  return crypto
    .createHash('sha256')
    .update(cardNumber.replace(/\s/g, ''))
    .digest('hex');
}
