import crypto from 'crypto';
import logger from './logger';

type EncryptedPayload = {
  iv: string;
  content: string;
  tag: string;
};

function getServerKey() {
  const keyHex = process.env.SYNKRYPT_SERVER_KEY;
  if (!keyHex || keyHex.length !== 64) {
    logger.error('SYNKRYPT_SERVER_KEY must be set to a 64-character hex string for web-managed crypto.');
    throw new Error('SYNKRYPT_SERVER_KEY must be set to a 64-character hex string for web-managed crypto.');
  }
  return Buffer.from(keyHex, 'hex');
}

export function randomHex(size = 32) {
  return crypto.randomBytes(size).toString('hex');
}

export function encryptForServer(plaintext: string): EncryptedPayload {
  try {
    const key = getServerKey();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    logger.debug('Data encrypted for server storage');
    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
      tag: tag.toString('hex'),
    };
  } catch (err: any) {
    logger.error({ err: err.message }, 'Encryption for server failed');
    throw err;
  }
}

export function decryptFromServer(payload: EncryptedPayload): string {
  try {
    const key = getServerKey();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.content, 'hex')),
      decipher.final(),
    ]);
    logger.debug('Data decrypted from server storage');
    return decrypted.toString('utf8');
  } catch (err: any) {
    logger.error({ err: err.message }, 'Decryption from server failed');
    throw err;
  }
}

export function encryptSecretValue(plaintext: string, secretKeyHex: string): EncryptedPayload {
  try {
    const key = Buffer.from(secretKeyHex, 'hex');
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();

    logger.debug('Secret value encrypted');
    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex'),
      tag: tag.toString('hex'),
    };
  } catch (err: any) {
    logger.error({ err: err.message }, 'Secret encryption failed');
    throw err;
  }
}

export function wrapKeyForUser(publicKeyPem: string, plaintext: string) {
  try {
    const result = crypto.publicEncrypt(publicKeyPem, Buffer.from(plaintext, 'utf8')).toString('hex');
    logger.debug('Key wrapped for user via RSA public key');
    return result;
  } catch (err: any) {
    logger.error({ err: err.message }, 'Key wrapping failed');
    throw err;
  }
}
