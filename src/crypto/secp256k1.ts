/**
 * secp256k1/ECDSA Cryptography
 *
 * Complete ECDSA signing and verification using the secp256k1 elliptic curve.
 * All operations use the audited @noble/curves library for security.
 * Full Ethereum compatibility with v = 27/28 recovery IDs.
 *
 * @example
 * ```typescript
 * import { Secp256k1 } from './secp256k1.js';
 * import { Hash } from '../primitives/hash.js';
 *
 * // Sign a message hash
 * const messageHash = Hash.keccak256String('Hello, Ethereum!');
 * const privateKey = new Uint8Array(32); // Your private key
 * const signature = Secp256k1.sign(messageHash, privateKey);
 *
 * // Verify signature
 * const publicKey = Secp256k1.derivePublicKey(privateKey);
 * const valid = Secp256k1.verify(signature, messageHash, publicKey);
 *
 * // Recover public key from signature
 * const recovered = Secp256k1.recoverPublicKey(signature, messageHash);
 * ```
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import type { Hash } from "../primitives/hash.js";

// ============================================================================
// Error Types
// ============================================================================

export class Secp256k1Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Secp256k1Error";
  }
}

export class InvalidSignatureError extends Secp256k1Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidSignatureError";
  }
}

export class InvalidPublicKeyError extends Secp256k1Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPublicKeyError";
  }
}

export class InvalidPrivateKeyError extends Secp256k1Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPrivateKeyError";
  }
}

// ============================================================================
// Main Secp256k1 Namespace
// ============================================================================

export namespace Secp256k1 {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * ECDSA signature with Ethereum-compatible v value
   *
   * Components:
   * - r: x-coordinate of the ephemeral public key (32 bytes)
   * - s: signature proof value (32 bytes)
   * - v: recovery id (27 or 28 for Ethereum)
   */
  export type Signature = {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
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
   * secp256k1 curve order (number of points on the curve)
   */
  export const CURVE_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;

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

  // ==========================================================================
  // Signing Operations
  // ==========================================================================

  /**
   * Sign a message hash with a private key
   *
   * Uses deterministic ECDSA (RFC 6979) for signature generation.
   * Returns signature with Ethereum-compatible v value (27 or 28).
   *
   * @param messageHash - 32-byte message hash to sign
   * @param privateKey - 32-byte private key
   * @returns ECDSA signature with r, s, v components
   * @throws {InvalidPrivateKeyError} If private key is invalid
   * @throws {Secp256k1Error} If signing fails
   *
   * @example
   * ```typescript
   * const messageHash = Hash.keccak256String('Hello!');
   * const privateKey = new Uint8Array(32); // Your key
   * const signature = Secp256k1.sign(messageHash, privateKey);
   * console.log(signature.v); // 27 or 28
   * ```
   */
  export function sign(messageHash: Hash, privateKey: PrivateKey): Signature {
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      throw new InvalidPrivateKeyError(
        `Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
      );
    }

    try {
      // Sign with compact format (prehash:false since we already have the hash)
      const sigCompact = secp256k1.sign(messageHash, privateKey, {
        prehash: false,
      });

      // Extract r and s
      const r = sigCompact.slice(0, 32);
      const s = sigCompact.slice(32, 64);

      // Compute recovery bit by trying all possibilities (0-3)
      // In practice, only 0-1 are typically needed for secp256k1
      const publicKey = secp256k1.getPublicKey(privateKey, false);
      const sig = secp256k1.Signature.fromBytes(sigCompact);

      let recoveryBit = 0;
      for (let i = 0; i < 4; i++) {
        try {
          const sigWithRecovery = sig.addRecoveryBit(i);
          const recovered = sigWithRecovery.recoverPublicKey(messageHash);
          const uncompressed = recovered.toBytes(false);

          if (uncompressed.every((byte, idx) => byte === publicKey[idx])) {
            recoveryBit = i;
            break;
          }
        } catch {
          // This recovery bit doesn't work, try next
        }
      }

      // Convert recovery bit to Ethereum v (27 or 28)
      const v = 27 + recoveryBit;

      return { r, s, v };
    } catch (error) {
      throw new Secp256k1Error(`Signing failed: ${error}`);
    }
  }

  /**
   * Verify an ECDSA signature
   *
   * @param signature - ECDSA signature with r, s, v components
   * @param messageHash - 32-byte message hash that was signed
   * @param publicKey - 64-byte uncompressed public key
   * @returns true if signature is valid, false otherwise
   * @throws {InvalidPublicKeyError} If public key is invalid
   * @throws {InvalidSignatureError} If signature format is invalid
   *
   * @example
   * ```typescript
   * const valid = Secp256k1.verify(signature, messageHash, publicKey);
   * if (valid) {
   *   console.log('Signature is valid!');
   * }
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
      // Create 64-byte compact signature (r || s)
      const compactSig = concat(signature.r, signature.s);

      // Add 0x04 prefix for uncompressed public key
      const prefixedPublicKey = new Uint8Array(PUBLIC_KEY_SIZE + 1);
      prefixedPublicKey[0] = 0x04;
      prefixedPublicKey.set(publicKey, 1);

      // Verify using noble/curves with prehash:false (we already have the hash)
      return secp256k1.verify(compactSig, messageHash, prefixedPublicKey, {
        prehash: false,
      });
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Public Key Recovery
  // ==========================================================================

  /**
   * Recover public key from signature and message hash
   *
   * Uses the recovery id (v) to recover the exact public key that created
   * the signature. This is what enables Ethereum's address recovery from
   * transaction signatures.
   *
   * @param signature - ECDSA signature with r, s, v components
   * @param messageHash - 32-byte message hash that was signed
   * @returns 64-byte uncompressed public key
   * @throws {InvalidSignatureError} If signature or recovery fails
   *
   * @example
   * ```typescript
   * const recovered = Secp256k1.recoverPublicKey(signature, messageHash);
   * // recovered is 64 bytes: x || y coordinates
   * ```
   */
  export function recoverPublicKey(
    signature: Signature,
    messageHash: Hash,
  ): PublicKey {
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

    // Convert Ethereum v (27 or 28) to recovery bit (0 or 1)
    let recoveryBit: number;
    if (signature.v === 27 || signature.v === 28) {
      recoveryBit = signature.v - 27;
    } else if (signature.v === 0 || signature.v === 1) {
      recoveryBit = signature.v;
    } else {
      throw new InvalidSignatureError(
        `Invalid v value: ${signature.v} (expected 0, 1, 27, or 28)`,
      );
    }

    try {
      // Create compact signature from r and s
      const compactSig = concat(signature.r, signature.s);
      const sig = secp256k1.Signature.fromBytes(compactSig);

      // Add recovery bit and recover public key
      const sigWithRecovery = sig.addRecoveryBit(recoveryBit);
      const recovered = sigWithRecovery.recoverPublicKey(messageHash);
      const uncompressed = recovered.toBytes(false); // 65 bytes with 0x04 prefix

      if (uncompressed[0] !== 0x04) {
        throw new InvalidSignatureError("Invalid recovered public key format");
      }

      // Return 64 bytes without the 0x04 prefix
      return uncompressed.slice(1);
    } catch (error) {
      throw new InvalidSignatureError(`Public key recovery failed: ${error}`);
    }
  }

  // ==========================================================================
  // Key Derivation
  // ==========================================================================

  /**
   * Derive public key from private key
   *
   * Computes the public key point from a private key using scalar
   * multiplication on the secp256k1 curve.
   *
   * @param privateKey - 32-byte private key
   * @returns 64-byte uncompressed public key
   * @throws {InvalidPrivateKeyError} If private key is invalid
   *
   * @example
   * ```typescript
   * const privateKey = new Uint8Array(32); // Your key
   * const publicKey = Secp256k1.derivePublicKey(privateKey);
   * console.log(publicKey.length); // 64
   * ```
   */
  export function derivePublicKey(privateKey: PrivateKey): PublicKey {
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      throw new InvalidPrivateKeyError(
        `Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
      );
    }

    try {
      // Get public key from private key (uncompressed, 65 bytes with 0x04 prefix)
      const uncompressed = secp256k1.getPublicKey(privateKey, false);

      if (uncompressed[0] !== 0x04) {
        throw new InvalidPrivateKeyError("Invalid public key format");
      }

      // Return 64 bytes without the 0x04 prefix
      return uncompressed.slice(1);
    } catch (error) {
      throw new InvalidPrivateKeyError(`Key derivation failed: ${error}`);
    }
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate signature components
   *
   * Checks that r and s are within valid range [1, n-1] where n is the
   * curve order. Also enforces low-s values to prevent malleability.
   *
   * @param signature - ECDSA signature to validate
   * @returns true if signature is valid, false otherwise
   *
   * @example
   * ```typescript
   * const valid = Secp256k1.isValidSignature(signature);
   * if (!valid) {
   *   console.log('Invalid signature parameters');
   * }
   * ```
   */
  export function isValidSignature(signature: Signature): boolean {
    if (signature.r.length !== SIGNATURE_COMPONENT_SIZE) return false;
    if (signature.s.length !== SIGNATURE_COMPONENT_SIZE) return false;

    try {
      const r = bytes32ToBigInt(signature.r);
      const s = bytes32ToBigInt(signature.s);

      // r and s must be in [1, n-1]
      if (r === 0n || r >= CURVE_ORDER) return false;
      if (s === 0n || s >= CURVE_ORDER) return false;

      // Ethereum enforces s <= n/2 to prevent malleability
      const halfN = CURVE_ORDER / 2n;
      if (s > halfN) return false;

      // v must be 0, 1, 27, or 28
      if (
        signature.v !== 0 &&
        signature.v !== 1 &&
        signature.v !== 27 &&
        signature.v !== 28
      ) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate public key
   *
   * Checks that the public key is a valid point on the secp256k1 curve.
   *
   * @param publicKey - 64-byte uncompressed public key
   * @returns true if public key is valid, false otherwise
   *
   * @example
   * ```typescript
   * const valid = Secp256k1.isValidPublicKey(publicKey);
   * ```
   */
  export function isValidPublicKey(publicKey: PublicKey): boolean {
    if (publicKey.length !== PUBLIC_KEY_SIZE) return false;

    try {
      // Add 0x04 prefix for uncompressed key
      const prefixedKey = new Uint8Array(PUBLIC_KEY_SIZE + 1);
      prefixedKey[0] = 0x04;
      prefixedKey.set(publicKey, 1);

      // Try to create a point from bytes - will throw if invalid
      secp256k1.Point.fromBytes(prefixedKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate private key
   *
   * Checks that the private key is within valid range [1, n-1] where n
   * is the curve order.
   *
   * @param privateKey - 32-byte private key
   * @returns true if private key is valid, false otherwise
   *
   * @example
   * ```typescript
   * const valid = Secp256k1.isValidPrivateKey(privateKey);
   * ```
   */
  export function isValidPrivateKey(privateKey: PrivateKey): boolean {
    if (privateKey.length !== PRIVATE_KEY_SIZE) return false;

    try {
      const value = bytes32ToBigInt(privateKey);

      // Private key must be in [1, n-1]
      if (value === 0n || value >= CURVE_ORDER) return false;

      return true;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Signature Formatting
  // ==========================================================================

  /**
   * Convert signature to compact format (64 bytes: r || s)
   *
   * @param signature - ECDSA signature
   * @returns 64-byte compact signature
   *
   * @example
   * ```typescript
   * const compact = Secp256k1.Signature.toCompact.call(signature);
   * console.log(compact.length); // 64
   * ```
   */
  export namespace Signature {
    export function toCompact(this: Secp256k1.Signature): Uint8Array {
      return concat(this.r, this.s);
    }

    /**
     * Convert signature to bytes with v appended (65 bytes: r || s || v)
     *
     * @returns 65-byte signature
     *
     * @example
     * ```typescript
     * const bytes = Secp256k1.Signature.toBytes.call(signature);
     * console.log(bytes.length); // 65
     * ```
     */
    export function toBytes(this: Secp256k1.Signature): Uint8Array {
      const result = new Uint8Array(65);
      result.set(this.r, 0);
      result.set(this.s, 32);
      result[64] = this.v;
      return result;
    }

    /**
     * Create signature from compact format (64 bytes: r || s)
     *
     * @param compact - 64-byte compact signature
     * @param v - Recovery id (0, 1, 27, or 28)
     * @returns ECDSA signature
     * @throws {InvalidSignatureError} If compact data is wrong length
     *
     * @example
     * ```typescript
     * const signature = Secp256k1.Signature.fromCompact(compact, 27);
     * ```
     */
    export function fromCompact(
      compact: Uint8Array,
      v: number,
    ): Secp256k1.Signature {
      if (compact.length !== 64) {
        throw new InvalidSignatureError(
          `Compact signature must be 64 bytes, got ${compact.length}`,
        );
      }

      return {
        r: compact.slice(0, 32),
        s: compact.slice(32, 64),
        v,
      };
    }

    /**
     * Create signature from bytes with v appended (65 bytes: r || s || v)
     *
     * @param bytes - 65-byte signature
     * @returns ECDSA signature
     * @throws {InvalidSignatureError} If bytes is wrong length
     *
     * @example
     * ```typescript
     * const signature = Secp256k1.Signature.fromBytes(bytes);
     * ```
     */
    export function fromBytes(bytes: Uint8Array): Secp256k1.Signature {
      if (bytes.length !== 65) {
        throw new InvalidSignatureError(
          `Signature must be 65 bytes, got ${bytes.length}`,
        );
      }

      return {
        r: bytes.slice(0, 32),
        s: bytes.slice(32, 64),
        v: bytes[64] ?? 0,
      };
    }
  }
}

// ============================================================================
// Internal Utilities
// ============================================================================

/**
 * Convert bigint to 32-byte big-endian array (currently unused)
 */
// function _numberToBytes32(value: bigint): Uint8Array {
//   const bytes = new Uint8Array(32);
//   let v = value;
//   for (let i = 31; i >= 0; i--) {
//     bytes[i] = Number(v & 0xffn);
//     v >>= 8n;
//   }
//   return bytes;
// }

/**
 * Convert 32-byte big-endian array to bigint
 */
function bytes32ToBigInt(bytes: Uint8Array): bigint {
  if (bytes.length !== 32) {
    throw new Error(`Expected 32 bytes, got ${bytes.length}`);
  }
  let result = 0n;
  for (let i = 0; i < 32; i++) {
    result = (result << 8n) | BigInt(bytes[i] ?? 0);
  }
  return result;
}

/**
 * Concatenate multiple Uint8Arrays
 */
function concat(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// Re-export namespace as default
export default Secp256k1;
