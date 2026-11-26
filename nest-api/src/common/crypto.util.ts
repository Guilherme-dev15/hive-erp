import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const PREFIX = 'v1';

function getEncryptionKey(): Buffer {
  const configured = process.env.GATEWAY_TOKEN_ENCRYPTION_KEY?.trim();
  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('GATEWAY_TOKEN_ENCRYPTION_KEY não configurada em produção');
    }
    return createHash('sha256')
      .update('dev-gateway-encryption-key-not-for-prod')
      .digest();
  }
  return createHash('sha256').update(configured).digest();
}

export function encryptSecret(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Segredo vazio não pode ser criptografado');
  }
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decryptSecret(ciphertext: string): string {
  if (!ciphertext || typeof ciphertext !== 'string') {
    throw new Error('Ciphertext inválido');
  }
  const parts = ciphertext.split(':');
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new Error('Formato de segredo criptografado inválido');
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(dataB64, 'base64');
  if (iv.length !== IV_LENGTH || authTag.length !== 16) {
    throw new Error('Parâmetros criptográficos inválidos');
  }
  const key = getEncryptionKey();
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}
