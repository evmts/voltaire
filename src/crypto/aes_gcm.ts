/**
 * AES-GCM (Galois/Counter Mode) Authenticated Encryption
 *
 * Provides authenticated encryption using AES in GCM mode.
 * Uses native WebCrypto API for optimal performance and security.
 * Supports both AES-128-GCM and AES-256-GCM.
 *
 * @example
 * ```typescript
 * import { AesGcm } from './aes_gcm.js';
 *
 * // Generate key
 * const key = await AesGcm.generateKey(256);
 *
 * // Encrypt data
 * const plaintext = new TextEncoder().encode('Hello, world!');
 * const nonce = crypto.getRandomValues(new Uint8Array(12));
 * const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
 *
 * // Decrypt data
 * const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
 * ```
 */

// ============================================================================
// Error Types
// ============================================================================

export class AesGcmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AesGcmError";
  }
}

export class InvalidKeyError extends AesGcmError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidKeyError";
  }
}

export class InvalidNonceError extends AesGcmError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidNonceError";
  }
}

export class DecryptionError extends AesGcmError {
  constructor(message: string) {
    super(message);
    this.name = "DecryptionError";
  }
}

// ============================================================================
// Main AesGcm Namespace
// ============================================================================

export namespace AesGcm {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  export type Key = CryptoKey;
  export type KeyMaterial = Uint8Array;

  // ==========================================================================
  // Constants
  // ==========================================================================

  export const AES128_KEY_SIZE = 16;
  export const AES256_KEY_SIZE = 32;
  export const NONCE_SIZE = 12;
  export const TAG_SIZE = 16;

  // ==========================================================================
  // Key Generation
  // ==========================================================================

  /**
   * Generate AES-GCM key
   *
   * @param bits - Key size in bits (128 or 256)
   * @returns CryptoKey for use with WebCrypto API
   *
   * @example
   * ```typescript
   * const key128 = await AesGcm.generateKey(128);
   * const key256 = await AesGcm.generateKey(256);
   * ```
   */
  export async function generateKey(bits: 128 | 256): Promise<Key> {
    try {
      return await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: bits,
        },
        true,
        ["encrypt", "decrypt"],
      );
    } catch (error) {
      throw new AesGcmError(`Key generation failed: ${error}`);
    }
  }

  /**
   * Import raw key material as CryptoKey
   *
   * @param keyMaterial - 16-byte (128-bit) or 32-byte (256-bit) key
   * @returns CryptoKey for use with WebCrypto API
   *
   * @example
   * ```typescript
   * const keyBytes = crypto.getRandomValues(new Uint8Array(32));
   * const key = await AesGcm.importKey(keyBytes);
   * ```
   */
  export async function importKey(keyMaterial: KeyMaterial): Promise<Key> {
    if (keyMaterial.length !== AES128_KEY_SIZE && keyMaterial.length !== AES256_KEY_SIZE) {
      throw new InvalidKeyError(
        `Key must be ${AES128_KEY_SIZE} or ${AES256_KEY_SIZE} bytes, got ${keyMaterial.length}`,
      );
    }

    try {
      return await crypto.subtle.importKey(
        "raw",
        keyMaterial,
        { name: "AES-GCM" },
        true,
        ["encrypt", "decrypt"],
      );
    } catch (error) {
      throw new InvalidKeyError(`Key import failed: ${error}`);
    }
  }

  /**
   * Export CryptoKey to raw bytes
   *
   * @param key - CryptoKey to export
   * @returns Raw key bytes
   *
   * @example
   * ```typescript
   * const key = await AesGcm.generateKey(256);
   * const keyBytes = await AesGcm.exportKey(key);
   * ```
   */
  export async function exportKey(key: Key): Promise<Uint8Array> {
    try {
      const exported = await crypto.subtle.exportKey("raw", key);
      return new Uint8Array(exported);
    } catch (error) {
      throw new InvalidKeyError(`Key export failed: ${error}`);
    }
  }

  // ==========================================================================
  // Encryption Operations
  // ==========================================================================

  /**
   * Encrypt data with AES-GCM
   *
   * @param plaintext - Data to encrypt
   * @param key - AES key (128 or 256 bit)
   * @param nonce - 12-byte nonce (IV)
   * @param additionalData - Optional additional authenticated data
   * @returns Ciphertext with authentication tag appended
   *
   * @example
   * ```typescript
   * const plaintext = new TextEncoder().encode('Secret message');
   * const key = await AesGcm.generateKey(256);
   * const nonce = crypto.getRandomValues(new Uint8Array(12));
   * const ciphertext = await AesGcm.encrypt(plaintext, key, nonce);
   * ```
   */
  export async function encrypt(
    plaintext: Uint8Array,
    key: Key,
    nonce: Uint8Array,
    additionalData?: Uint8Array,
  ): Promise<Uint8Array> {
    if (nonce.length !== NONCE_SIZE) {
      throw new InvalidNonceError(
        `Nonce must be ${NONCE_SIZE} bytes, got ${nonce.length}`,
      );
    }

    try {
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: nonce,
          additionalData,
          tagLength: TAG_SIZE * 8,
        },
        key,
        plaintext,
      );

      return new Uint8Array(ciphertext);
    } catch (error) {
      throw new AesGcmError(`Encryption failed: ${error}`);
    }
  }

  // ==========================================================================
  // Decryption Operations
  // ==========================================================================

  /**
   * Decrypt data with AES-GCM
   *
   * @param ciphertext - Encrypted data with authentication tag
   * @param key - AES key (128 or 256 bit)
   * @param nonce - 12-byte nonce (IV) used during encryption
   * @param additionalData - Optional additional authenticated data
   * @returns Decrypted plaintext
   * @throws {DecryptionError} If authentication fails or decryption error
   *
   * @example
   * ```typescript
   * const decrypted = await AesGcm.decrypt(ciphertext, key, nonce);
   * const message = new TextDecoder().decode(decrypted);
   * ```
   */
  export async function decrypt(
    ciphertext: Uint8Array,
    key: Key,
    nonce: Uint8Array,
    additionalData?: Uint8Array,
  ): Promise<Uint8Array> {
    if (nonce.length !== NONCE_SIZE) {
      throw new InvalidNonceError(
        `Nonce must be ${NONCE_SIZE} bytes, got ${nonce.length}`,
      );
    }

    if (ciphertext.length < TAG_SIZE) {
      throw new DecryptionError("Ciphertext too short to contain authentication tag");
    }

    try {
      const plaintext = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: nonce,
          additionalData,
          tagLength: TAG_SIZE * 8,
        },
        key,
        ciphertext,
      );

      return new Uint8Array(plaintext);
    } catch (error) {
      throw new DecryptionError(`Decryption failed (invalid key, nonce, or corrupted data): ${error}`);
    }
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Generate random nonce
   *
   * @returns 12-byte random nonce
   *
   * @example
   * ```typescript
   * const nonce = AesGcm.generateNonce();
   * ```
   */
  export function generateNonce(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(NONCE_SIZE));
  }

  /**
   * Derive key from password using PBKDF2
   *
   * @param password - Password string or bytes
   * @param salt - Salt for key derivation (at least 16 bytes recommended)
   * @param iterations - Number of iterations (at least 100000 recommended)
   * @param bits - Key size in bits (128 or 256)
   * @returns Derived CryptoKey
   *
   * @example
   * ```typescript
   * const salt = crypto.getRandomValues(new Uint8Array(16));
   * const key = await AesGcm.deriveKey('mypassword', salt, 100000, 256);
   * ```
   */
  export async function deriveKey(
    password: string | Uint8Array,
    salt: Uint8Array,
    iterations: number,
    bits: 128 | 256,
  ): Promise<Key> {
    try {
      const passwordBytes = typeof password === "string"
        ? new TextEncoder().encode(password)
        : password;

      const baseKey = await crypto.subtle.importKey(
        "raw",
        passwordBytes,
        { name: "PBKDF2" },
        false,
        ["deriveBits", "deriveKey"],
      );

      return await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt,
          iterations,
          hash: "SHA-256",
        },
        baseKey,
        { name: "AES-GCM", length: bits },
        true,
        ["encrypt", "decrypt"],
      );
    } catch (error) {
      throw new AesGcmError(`Key derivation failed: ${error}`);
    }
  }
}
