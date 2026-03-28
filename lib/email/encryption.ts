import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

// Get encryption key from environment
const ENCRYPTION_KEY = process.env.EMAIL_ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  throw new Error('EMAIL_ENCRYPTION_KEY environment variable is required');
}

// Derive a 32-byte key from the environment variable using scrypt
const key = scryptSync(ENCRYPTION_KEY, 'salt', 32);

/**
 * Encrypt a string using AES-256-GCM
 */
export function encrypt(text: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a string encrypted with the encrypt() function
 */
export function decrypt(encryptedText: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
  
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted text format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
