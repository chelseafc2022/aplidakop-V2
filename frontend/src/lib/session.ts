const SESSION_VERSION = 1;
export const SESSION_COOKIE_NAME = 'aplidakop_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60;

type SessionPayload = {
  version: number;
  accessToken: string;
  expiresAt: number;
};

function encodeBase64Url(value: Uint8Array): string {
  let binary = '';
  for (const byte of value) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim();
  if (!secret || secret.length < 32 || secret === 'replace-with-at-least-32-random-characters') {
    throw new Error('SESSION_SECRET wajib berupa nilai acak minimal 32 karakter.');
  }
  return secret;
}

async function getEncryptionKey(): Promise<CryptoKey> {
  const encodedSecret = new TextEncoder().encode(getSessionSecret());
  const digest = await crypto.subtle.digest('SHA-256', encodedSecret);
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

function getBackendTokenExpiry(accessToken: string): number | null {
  try {
    const payloadPart = accessToken.split('.')[1];
    if (!payloadPart) return null;
    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(payloadPart)));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export async function sealSession(accessToken: string): Promise<string> {
  if (!accessToken || accessToken.length > 16_384) throw new Error('Token backend tidak valid.');

  const now = Date.now();
  const backendExpiry = getBackendTokenExpiry(accessToken);
  const expiresAt = Math.min(
    now + SESSION_MAX_AGE_SECONDS * 1000,
    backendExpiry && backendExpiry > now ? backendExpiry : Number.POSITIVE_INFINITY,
  );
  if (!Number.isFinite(expiresAt)) {
    throw new Error('Token backend wajib memiliki waktu kedaluwarsa.');
  }

  const payload: SessionPayload = { version: SESSION_VERSION, accessToken, expiresAt };
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await getEncryptionKey(),
    new TextEncoder().encode(JSON.stringify(payload)),
  );

  return `${encodeBase64Url(iv)}.${encodeBase64Url(new Uint8Array(ciphertext))}`;
}

export async function openSession(value: string | undefined): Promise<SessionPayload | null> {
  if (!value || value.length > 24_000) return null;
  const [encodedIv, encodedCiphertext, extra] = value.split('.');
  if (!encodedIv || !encodedCiphertext || extra) return null;

  try {
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decodeBase64Url(encodedIv) },
      await getEncryptionKey(),
      decodeBase64Url(encodedCiphertext),
    );
    const payload = JSON.parse(new TextDecoder().decode(plaintext)) as SessionPayload;
    if (
      payload.version !== SESSION_VERSION ||
      typeof payload.accessToken !== 'string' ||
      typeof payload.expiresAt !== 'number' ||
      payload.expiresAt <= Date.now()
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};
