import nacl from 'tweetnacl';
import { encodeUTF8, decodeUTF8, encodeBase64, decodeBase64 } from 'tweetnacl-util';

const LEGACY_SALT = 'smart-drawio-salt-v1';
const KEY_STORAGE_KEY = 'smart-drawio-derived-key';
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_ITERATIONS = 210000;
const PBKDF2_HASH = 'SHA-256';
const PBKDF2_ALGORITHM = 'PBKDF2';
const KDF_VERSION = 2;

function deriveLegacyKey(password) {
  const combined = LEGACY_SALT + password;
  const bytes = encodeUTF8(combined);
  return nacl.hash(bytes).slice(0, 32);
}

function getWebCrypto() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.subtle) {
    return globalThis.crypto;
  }
  throw new Error('Web Crypto API is not available');
}

function normalizeKdfMetadata(kdf) {
  if (!kdf || typeof kdf !== 'object') {
    return null;
  }

  const salt = typeof kdf.salt === 'string' ? kdf.salt : null;
  const iterations = Number.isInteger(kdf.iterations) && kdf.iterations > 0
    ? kdf.iterations
    : null;
  const algorithm = typeof kdf.algorithm === 'string' ? kdf.algorithm : PBKDF2_ALGORITHM;
  const hash = typeof kdf.hash === 'string' ? kdf.hash : PBKDF2_HASH;
  const version = Number.isInteger(kdf.version) ? kdf.version : null;

  if (!salt || !iterations || version === null || version < KDF_VERSION) {
    return null;
  }

  if (algorithm !== PBKDF2_ALGORITHM || hash !== PBKDF2_HASH) {
    return null;
  }

  return { version, algorithm, hash, iterations, salt };
}

async function derivePbkdf2Key(password, kdfMetadata) {
  const webCrypto = getWebCrypto();
  const subtle = webCrypto.subtle;
  const encoder = new TextEncoder();
  const salt = decodeBase64(kdfMetadata.salt);

  const importedKey = await subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: PBKDF2_ALGORITHM },
    false,
    ['deriveBits']
  );

  const derivedBits = await subtle.deriveBits(
    {
      name: PBKDF2_ALGORITHM,
      salt,
      iterations: kdfMetadata.iterations,
      hash: PBKDF2_HASH,
    },
    importedKey,
    256
  );

  return new Uint8Array(derivedBits);
}

function createKdfMetadata(saltBytes, iterations = PBKDF2_ITERATIONS) {
  return {
    version: KDF_VERSION,
    algorithm: PBKDF2_ALGORITHM,
    hash: PBKDF2_HASH,
    iterations,
    salt: encodeBase64(saltBytes),
  };
}

/**
 * Create key material for new encryption setup using PBKDF2
 * @param {string} password - User's master password
 * @returns {Promise<{ key: Uint8Array, kdf: { version: number, algorithm: string, hash: string, iterations: number, salt: string } }>}
 */
export async function createKeyMaterial(password) {
  const webCrypto = getWebCrypto();
  const salt = webCrypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const kdf = createKdfMetadata(salt, PBKDF2_ITERATIONS);
  const key = await derivePbkdf2Key(password, kdf);
  return { key, kdf };
}

/**
 * Derive a 32-byte key from password and KDF metadata
 * Falls back to legacy derivation when metadata is missing/legacy.
 * @param {string} password - User's master password
 * @param {{ version?: number, algorithm?: string, hash?: string, iterations?: number, salt?: string } | null} [kdfMetadata]
 * @returns {Promise<Uint8Array>} 32-byte key
 */
export async function deriveKey(password, kdfMetadata = null) {
  const normalizedKdf = normalizeKdfMetadata(kdfMetadata);
  if (!normalizedKdf) {
    return deriveLegacyKey(password);
  }

  try {
    return await derivePbkdf2Key(password, normalizedKdf);
  } catch {
    return deriveLegacyKey(password);
  }
}

/**
 * Encrypt an API key using TweetNaCl secretbox
 * @param {string} apiKey - Plain text API key
 * @param {Uint8Array} key - 32-byte encryption key
 * @param {{ version?: number, algorithm?: string, hash?: string, iterations?: number, salt?: string } | null} [kdfMetadata]
 * @returns {{ encrypted: string, nonce: string, kdf?: { version: number, algorithm: string, hash: string, iterations: number, salt: string } }}
 */
export function encryptApiKey(apiKey, key, kdfMetadata = null) {
  const nonce = nacl.randomBytes(24);
  const messageBytes = encodeUTF8(apiKey);
  const encrypted = nacl.secretbox(messageBytes, nonce, key);
  const normalizedKdf = normalizeKdfMetadata(kdfMetadata);

  const payload = {
    encrypted: encodeBase64(encrypted),
    nonce: encodeBase64(nonce),
  };

  if (normalizedKdf) {
    payload.kdf = normalizedKdf;
  }

  return payload;
}

/**
 * Decrypt an API key
 * @param {{ encrypted: string, nonce: string }} encryptedData
 * @param {Uint8Array} key - 32-byte encryption key
 * @returns {string | null} Decrypted API key or null if decryption fails
 */
export function decryptApiKey(encryptedData, key) {
  try {
    const encrypted = decodeBase64(encryptedData.encrypted);
    const nonce = decodeBase64(encryptedData.nonce);
    const decrypted = nacl.secretbox.open(encrypted, nonce, key);

    if (!decrypted) {
      return null;
    }

    return decodeUTF8(decrypted);
  } catch (e) {
    return null;
  }
}

/**
 * Check if an API key value is encrypted
 * @param {any} value - API key value from config
 * @returns {boolean}
 */
export function isEncrypted(value) {
  return value && typeof value === 'object' && 'encrypted' in value && 'nonce' in value;
}

/**
 * Cache derived key in sessionStorage
 * @param {Uint8Array} key
 */
export function cacheKey(key) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(KEY_STORAGE_KEY, encodeBase64(key));
  }
}

/**
 * Get cached key from sessionStorage
 * @returns {Uint8Array | null}
 */
export function getCachedKey() {
  if (typeof sessionStorage === 'undefined') {
    return null;
  }
  const cached = sessionStorage.getItem(KEY_STORAGE_KEY);
  if (!cached) {
    return null;
  }
  try {
    return decodeBase64(cached);
  } catch {
    return null;
  }
}

/**
 * Clear cached key
 */
export function clearCachedKey() {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(KEY_STORAGE_KEY);
  }
}

/**
 * Verify if a password matches by attempting to derive key and decrypt test data
 * @param {string} password
 * @param {{ encrypted: string, nonce: string, kdf?: { version?: number, algorithm?: string, hash?: string, iterations?: number, salt?: string } }} testData - Encrypted test value
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, testData) {
  const key = await deriveKey(password, testData?.kdf);
  const result = decryptApiKey(testData, key);
  return result !== null;
}
