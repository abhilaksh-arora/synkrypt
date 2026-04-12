import crypto from 'crypto';

type EncryptedPayload = {
  iv: string;
  content: string;
  tag: string;
};

function getServerKey() {
  const keyHex = process.env.SYNKRYPT_SERVER_KEY;
  if (!keyHex || keyHex.length !== 64) {
    throw new Error('SYNKRYPT_SERVER_KEY must be set to a 64-character hex string for web-managed crypto.');
  }
  return Buffer.from(keyHex, 'hex');
}

export function randomHex(size = 32) {
  return crypto.randomBytes(size).toString('hex');
}

export function encryptForServer(plaintext: string): EncryptedPayload {
  const key = getServerKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function decryptFromServer(payload: EncryptedPayload): string {
  const key = getServerKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(payload.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(payload.tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(payload.content, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function encryptSecretValue(plaintext: string, secretKeyHex: string): EncryptedPayload {
  const key = Buffer.from(secretKeyHex, 'hex');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    iv: iv.toString('hex'),
    content: encrypted.toString('hex'),
    tag: tag.toString('hex'),
  };
}

export function wrapKeyForUser(publicKeyPem: string, plaintext: string) {
  return crypto.publicEncrypt(publicKeyPem, Buffer.from(plaintext, 'utf8')).toString('hex');
}
