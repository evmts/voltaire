/**
 * P256 (secp256r1) Cryptography
 *
 * Complete ECDSA signing and verification using the NIST P-256 elliptic curve.
 * Also known as secp256r1 or prime256v1.
 * Used for WebAuthn, iOS Secure Enclave, and modern cryptographic applications.
 *
 * @example
 * ```typescript
 * import { P256 } from './p256.js';
 * import { Hash } from '../primitives/Hash/index.js';
 *
 * // Sign a message hash
 * const messageHash = Hash.keccak256String('Hello!');
 * const privateKey = new Uint8Array(32); // Your private key
 * const signature = P256.sign(messageHash, privateKey);
 *
 * // Verify signature
 * const publicKey = P256.derivePublicKey(privateKey);
 * const valid = P256.verify(signature, messageHash, publicKey);
 *
 * // ECDH key exchange
 * const sharedSecret = P256.ecdh(privateKey, publicKey);
 * ```
 */

import { p256 } from "@noble/curves/nist.js";
import type { Hash } from "../primitives/Hash/index.js";

// ============================================================================
// Error Types
// ============================================================================

export class P256Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "P256Error";
  }
}

export class InvalidSignatureError extends P256Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSignatureError";
  }
}

export class InvalidPublicKeyError extends P256Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPublicKeyError";
  }
}

export class InvalidPrivateKeyError extends P256Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPrivateKeyError";
  }
}

// ============================================================================
// Main P256 Namespace
// ============================================================================

export namespace P256 {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * ECDSA signature (r, s components)
   *
   * Components:
   * - r: x-coordinate of the ephemeral public key (32 bytes)
   * - s: signature proof value (32 bytes)
   */
  export type Signature = {
    r: Uint8Array;
    s: Uint8Array;
  };

  /**
   * Uncompressed public key (64 bytes)
   *
   * Format: x-coordinate (32 bytes) || y-coordinate (32 bytes)
   */
  export type PublicKey = Uint8Array;

  /**
   * Private key (32 bytes scalar value)
   */
  export type PrivateKey = Uint8Array;

  // ==========================================================================
  // Constants
  // ==========================================================================

  /**
   * P256 curve order (number of points on the curve)
   */
  export const CURVE_ORDER = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;

  /**
   * Private key size in bytes
   */
  export const PRIVATE_KEY_SIZE = 32;

  /**
   * Uncompressed public key size in bytes (64 bytes, no prefix)
   */
  export const PUBLIC_KEY_SIZE = 64;

  /**
   * Signature component size in bytes (r and s are each 32 bytes)
   */
  export const SIGNATURE_COMPONENT_SIZE = 32;

  /**
   * ECDH shared secret size in bytes
   */
  export const SHARED_SECRET_SIZE = 32;

  // ==========================================================================
  // Signing Operations
  // ==========================================================================

  /**
   * Sign a message hash with a private key
   *
   * Uses deterministic ECDSA (RFC 6979) for signature generation.
   *
   * @param messageHash - 32-byte message hash to sign
   * @param privateKey - 32-byte private key
   * @returns ECDSA signature with r, s components
   * @throws {InvalidPrivateKeyError} If private key is invalid
   * @throws {P256Error} If signing fails
   *
   * @example
   * ```typescript
   * const messageHash = Hash.keccak256String('Hello!');
   * const privateKey = new Uint8Array(32); // Your key
   * const signature = P256.sign(messageHash, privateKey);
   * ```
   */
  export function sign(messageHash: Hash, privateKey: PrivateKey): Signature {
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      throw new InvalidPrivateKeyError(
        `Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
      );
    }

    try {
      const sig = p256.sign(messageHash, privateKey);
      return {
        r: sig.slice(0, 32),
        s: sig.slice(32, 64),
      };
    } catch (error) {
      throw new P256Error(`Signing failed: ${error}`);
    }
  }

  // ==========================================================================
  // Verification Operations
  // ==========================================================================

  /**
   * Verify an ECDSA signature
   *
   * @param signature - ECDSA signature to verify
   * @param messageHash - 32-byte message hash that was signed
   * @param publicKey - 64-byte uncompressed public key
   * @returns True if signature is valid, false otherwise
   * @throws {InvalidPublicKeyError} If public key format is invalid
   * @throws {InvalidSignatureError} If signature format is invalid
   *
   * @example
   * ```typescript
   * const valid = P256.verify(signature, messageHash, publicKey);
   * if (valid) console.log('Signature is valid!');
   * ```
   */
  export function verify(
    signature: Signature,
    messageHash: Hash,
    publicKey: PublicKey,
  ): boolean {
    if (publicKey.length !== PUBLIC_KEY_SIZE) {
      throw new InvalidPublicKeyError(
        `Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
      );
    }

    if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) {
      throw new InvalidSignatureError(
        `Signature r must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`,
      );
    }

    if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) {
      throw new InvalidSignatureError(
        `Signature s must be ${SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`,
      );
    }

    try {
      // Combine r and s into compact signature format
      const compactSig = new Uint8Array(64);
      compactSig.set(signature.r, 0);
      compactSig.set(signature.s, 32);

      // Add 0x04 prefix for uncompressed public key
      const fullPublicKey = new Uint8Array(65);
      fullPublicKey[0] = 0x04;
      fullPublicKey.set(publicKey, 1);

      return p256.verify(compactSig, messageHash, fullPublicKey);
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Key Derivation
  // ==========================================================================

  /**
   * Derive public key from private key
   *
   * @param privateKey - 32-byte private key
   * @returns 64-byte uncompressed public key (x || y coordinates)
   * @throws {InvalidPrivateKeyError} If private key is invalid
   *
   * @example
   * ```typescript
   * const privateKey = new Uint8Array(32);
   * const publicKey = P256.derivePublicKey(privateKey);
   * ```
   */
  export function derivePublicKey(privateKey: PrivateKey): PublicKey {
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      throw new InvalidPrivateKeyError(
        `Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
      );
    }

    try {
      const pubKey = p256.getPublicKey(privateKey);
      // Remove 0x04 prefix for uncompressed format
      return pubKey.slice(1);
    } catch (error) {
      throw new InvalidPrivateKeyError(`Failed to derive public key: ${error}`);
    }
  }

  // ==========================================================================
  // ECDH Operations
  // ==========================================================================

  /**
   * Perform ECDH key exchange
   *
   * Computes shared secret from your private key and their public key.
   * Returns the x-coordinate of the shared point.
   *
   * @param privateKey - Your 32-byte private key
   * @param publicKey - Their 64-byte uncompressed public key
   * @returns 32-byte shared secret
   * @throws {InvalidPrivateKeyError} If private key is invalid
   * @throws {InvalidPublicKeyError} If public key is invalid
   *
   * @example
   * ```typescript
   * const myPrivateKey = new Uint8Array(32);
   * const theirPublicKey = P256.derivePublicKey(theirPrivateKey);
   * const sharedSecret = P256.ecdh(myPrivateKey, theirPublicKey);
   * ```
   */
  export function ecdh(privateKey: PrivateKey, publicKey: PublicKey): Uint8Array {
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      throw new InvalidPrivateKeyError(
        `Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
      );
    }

    if (publicKey.length !== PUBLIC_KEY_SIZE) {
      throw new InvalidPublicKeyError(
        `Public key must be ${PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`,
      );
    }

    try {
      // Add 0x04 prefix for uncompressed public key
      const fullPublicKey = new Uint8Array(65);
      fullPublicKey[0] = 0x04;
      fullPublicKey.set(publicKey, 1);

      const shared = p256.getSharedSecret(privateKey, fullPublicKey);
      // Return x-coordinate only (standard ECDH)
      return shared.slice(1, 33);
    } catch (error) {
      throw new P256Error(`ECDH failed: ${error}`);
    }
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate a private key
   *
   * Checks if the private key is in the valid range [1, n-1]
   *
   * @param privateKey - Private key to validate
   * @returns True if valid, false otherwise
   */
  export function validatePrivateKey(privateKey: PrivateKey): boolean {
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      return false;
    }

    try {
      // Try to derive public key - will fail if invalid
      p256.getPublicKey(privateKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate a public key
   *
   * Checks if the public key is a valid point on the P256 curve
   *
   * @param publicKey - Public key to validate
   * @returns True if valid, false otherwise
   */
  export function validatePublicKey(publicKey: PublicKey): boolean {
    if (publicKey.length !== PUBLIC_KEY_SIZE) {
      return false;
    }

    try {
      // Add 0x04 prefix for validation
      const fullPublicKey = new Uint8Array(65);
      fullPublicKey[0] = 0x04;
      fullPublicKey.set(publicKey, 1);

      // Try to verify with dummy sig - will fail if invalid key
      const dummySig = new Uint8Array(64);
      const dummyMsg = new Uint8Array(32);
      p256.verify(dummySig, dummyMsg, fullPublicKey);
      return true;
    } catch {
      return false;
    }
  }
}
