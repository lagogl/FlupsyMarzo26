import crypto from 'crypto';

const VERSION = 1;

function encryptionKey(): Buffer {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('SESSION_SECRET non configurato per la tracciabilità pubblica');
  }
  return crypto.createHash('sha256').update(`public-traceability:${secret}`).digest();
}

export function createPublicTraceabilityToken(saleId: number): string {
  if (!Number.isInteger(saleId) || saleId <= 0) throw new Error('ID vendita non valido');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const payload = Buffer.from(JSON.stringify({ v: VERSION, saleId }), 'utf8');
  const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64url');
}

export function readPublicTraceabilityToken(token: string): number | null {
  try {
    const packed = Buffer.from(token, 'base64url');
    if (packed.length < 29 || packed.length > 256) return null;
    const iv = packed.subarray(0, 12);
    const tag = packed.subarray(12, 28);
    const encrypted = packed.subarray(28);
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), iv);
    decipher.setAuthTag(tag);
    const decoded = JSON.parse(Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'));
    return decoded?.v === VERSION && Number.isInteger(decoded?.saleId) && decoded.saleId > 0
      ? decoded.saleId
      : null;
  } catch {
    return null;
  }
}