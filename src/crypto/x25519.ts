/**
 * X25519 Elliptic Curve Diffie-Hellman
 *
 * Curve25519 key exchange algorithm for secure shared secret generation.
 * Fast, simple, and designed for ECDH key agreement.
 * Used in modern protocols like TLS 1.3, WireGuard, Signal, and SSH.
 *
 * @example
 * ```typescript
 * import { X25519 } from './x25519.js';
 *
 * // Generate two keypairs
 * const seed1 = crypto.getRandomValues(new Uint8Array(32));
 * const seed2 = crypto.getRandomValues(new Uint8Array(32));
 * const keypair1 = X25519.keypairFromSeed(seed1);
 * const keypair2 = X25519.keypairFromSeed(seed2);
 *
 * // Perform key exchange
 * const shared1 = X25519.scalarmult(keypair1.secretKey, keypair2.publicKey);
 * const shared2 = X25519.scalarmult(keypair2.secretKey, keypair1.publicKey);
 * // shared1 === shared2 (same shared secret from both sides)
 * ```
 */

import { x25519 } from "@noble/curves/ed25519.js";

// ============================================================================
// Error Types
// ============================================================================

export class X25519Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "X25519Error";
  }
}

export class InvalidSecretKeyError extends X25519Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSecretKeyError";
  }
}

export class InvalidPublicKeyError extends X25519Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPublicKeyError";
  }
}

// ============================================================================
// Main X25519 Namespace
// ============================================================================

export namespace X25519 {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * X25519 secret key (32 bytes)
   */
  export type SecretKey = Uint8Array;

  /**
   * X25519 public key (32 bytes)
   */
  export type PublicKey = Uint8Array;

  /**
   * Shared secret from key exchange (32 bytes)
   */
  export type SharedSecret = Uint8Array;

  // ==========================================================================
  // Constants
  // ==========================================================================

  /**
   * Secret key size in bytes
   */
  export const SECRET_KEY_SIZE = 32;

  /**
   * Public key size in bytes
   */
  export const PUBLIC_KEY_SIZE = 32;

  /**
   * Shared secret size in bytes
   */
  export const SHARED_SECRET_SIZE = 32;

  // ==========================================================================
  // Key Derivation
  // ==========================================================================

  /**
   * Derive public key from secret key
   *
   * @param secretKey - 32-byte secret key
   * @returns 32-byte public key
   * @throws {InvalidSecretKeyError} If secret key is invalid
   *
   * @example
   * ```typescript
   * const secretKey = crypto.getRandomValues(new Uint8Array(32));
   * const publicKey = X25519.derivePublicKey(secretKey);
   * ```
   */
  export function derivePublicKey(secretKey: SecretKey): PublicKey {
    if (secretKey.length !== SECRET_KEY_SIZE) {
      throw new InvalidSecretKeyError(
        `Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
      );
    }

    try {
      return x25519.getPublicKey(secretKey);
    } catch (error) {
      throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
    }
  }

  // ==========================================================================
  // Key Exchange Operations
  // ==========================================================================

  /**
   * Perform X25519 scalar multiplication (ECDH)
   *
   * Computes shared secret from your secret key and their public key.
   *
   * @param secretKey - Your 32-byte secret key
   * @param publicKey - Their 32-byte public key
   * @returns 32-byte shared secret
   * @throws {InvalidSecretKeyError} If secret key is invalid
   * @throws {InvalidPublicKeyError} If public key is invalid
   *
   * @example
   * ```typescript
   * const mySecret = crypto.getRandomValues(new Uint8Array(32));
   * const theirPublic = X25519.derivePublicKey(theirSecret);
   * const shared = X25519.scalarmult(mySecret, theirPublic);
   * ```
   */
  export function scalarmult(secretKey: SecretKey, publicKey: PublicKey): SharedSecret {
    if (secretKey.length !== SECRET_KEY_SIZE) {
      throw new InvalidSecretKeyError(
        `Secret key must be ${SECRET_KEY_SIZE} bytes, got ${secretKey.length}`,
      );
    }

    if (publicKey.length !== PUBLIC_KEY_SIZE) {
      throw new InvalidPublicKeyError(
        `Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
      );
    }

    try {
      return x25519.getSharedSecret(secretKey, publicKey);
    } catch (error) {
      throw new X25519Error(`Scalar multiplication failed: ${error}`);
    }
  }

  // ==========================================================================
  // Keypair Generation
  // ==========================================================================

  /**
   * Generate X25519 keypair from seed
   *
   * @param seed - 32-byte seed for deterministic generation
   * @returns Object with secretKey and publicKey
   * @throws {InvalidSecretKeyError} If seed length is invalid
   *
   * @example
   * ```typescript
   * const seed = crypto.getRandomValues(new Uint8Array(32));
   * const keypair = X25519.keypairFromSeed(seed);
   * ```
   */
  export function keypairFromSeed(seed: Uint8Array): { secretKey: SecretKey; publicKey: PublicKey } {
    if (seed.length !== SECRET_KEY_SIZE) {
      throw new InvalidSecretKeyError(
        `Seed must be ${SECRET_KEY_SIZE} bytes, got ${seed.length}`,
      );
    }

    try {
      const publicKey = x25519.getPublicKey(seed);
      return {
        secretKey: seed,
        publicKey,
      };
    } catch (error) {
      throw new X25519Error(`Keypair generation failed: ${error}`);
    }
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate a secret key
   *
   * Checks if the secret key has correct length and can derive a public key
   *
   * @param secretKey - Secret key to validate
   * @returns True if valid, false otherwise
   */
  export function validateSecretKey(secretKey: SecretKey): boolean {
    if (secretKey.length !== SECRET_KEY_SIZE) {
      return false;
    }

    try {
      // Try to derive public key - will fail if invalid
      x25519.getPublicKey(secretKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate a public key
   *
   * Checks if the public key has correct length
   *
   * @param publicKey - Public key to validate
   * @returns True if valid, false otherwise
   */
  export function validatePublicKey(publicKey: PublicKey): boolean {
    if (publicKey.length !== PUBLIC_KEY_SIZE) {
      return false;
    }

    // Basic validation - should not be all zeros
    return publicKey.some(b => b !== 0);
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Generate random secret key
   *
   * Uses crypto.getRandomValues for secure random generation
   *
   * @returns 32-byte random secret key
   *
   * @example
   * ```typescript
   * const secretKey = X25519.generateSecretKey();
   * const publicKey = X25519.derivePublicKey(secretKey);
   * ```
   */
  export function generateSecretKey(): SecretKey {
    return crypto.getRandomValues(new Uint8Array(SECRET_KEY_SIZE));
  }

  /**
   * Generate random keypair
   *
   * Uses crypto.getRandomValues for secure random generation
   *
   * @returns Object with secretKey and publicKey
   *
   * @example
   * ```typescript
   * const keypair = X25519.generateKeypair();
   * ```
   */
  export function generateKeypair(): { secretKey: SecretKey; publicKey: PublicKey } {
    const secretKey = generateSecretKey();
    return keypairFromSeed(secretKey);
  }
}
