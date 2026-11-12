import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const scryptAsync = promisify(scrypt);

@Injectable()
export class CryptoUtil {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 12;
  private readonly tagLength = 16;
  private readonly saltLength = 16;
  private readonly iterations = 100000;

  constructor(private readonly config: ConfigService) {}

  private async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
    return scryptAsync(password, salt, this.keyLength) as Promise<Buffer>;
  }

  async encrypt(plaintext: string): Promise<string> {
    const masterKey = this.config.get<string>('MFA_ENCRYPTION_KEY');
    if (!masterKey) {
      throw new Error('MFA_ENCRYPTION_KEY not configured');
    }

    const salt = randomBytes(this.saltLength);
    const iv = randomBytes(this.ivLength);
    const key = await this.deriveKey(masterKey, salt);

    const cipher = createCipheriv(this.algorithm, key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    // Format: salt:iv:ciphertext:tag (all base64)
    return [
      salt.toString('base64'),
      iv.toString('base64'),
      ciphertext.toString('base64'),
      tag.toString('base64'),
    ].join(':');
  }

  async decrypt(ciphertext: string): Promise<string> {
    const masterKey = this.config.get<string>('MFA_ENCRYPTION_KEY');
    if (!masterKey) {
      throw new Error('MFA_ENCRYPTION_KEY not configured');
    }

    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid ciphertext format');
    }

    const [saltB64, ivB64, ciphertextB64, tagB64] = parts;
    const salt = Buffer.from(saltB64, 'base64');
    const iv = Buffer.from(ivB64, 'base64');
    const encrypted = Buffer.from(ciphertextB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');

    const key = await this.deriveKey(masterKey, salt);
    const decipher = createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  }
}