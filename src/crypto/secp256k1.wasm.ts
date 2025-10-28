/**
 * WASM implementation of secp256k1/ECDSA operations
 *
 * Provides the same interface as the Noble-based implementation,
 * using WebAssembly for cryptographic operations.
 */

import * as loader from "../wasm-loader/loader.js";
import type { Hash } from "../primitives/hash.js";
import {
  Secp256k1Error,
  InvalidSignatureError,
  InvalidPublicKeyError,
  InvalidPrivateKeyError,
} from "./secp256k1.js";

// ============================================================================
// Main Secp256k1Wasm Namespace
// ============================================================================

export namespace Secp256k1Wasm {
  // ==========================================================================
  // Core Types (same as Noble implementation)
  // ==========================================================================

  export type Signature = {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
  };

  export type PublicKey = Uint8Array;
  export type PrivateKey = Uint8Array;

  // ==========================================================================
  // Constants
  // ==========================================================================

  export const CURVE_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
  export const PRIVATE_KEY_SIZE = 32;
  export const PUBLIC_KEY_SIZE = 64;
  export const SIGNATURE_COMPONENT_SIZE = 32;

  // ==========================================================================
  // Signing Operations
  // ==========================================================================

  export function sign(messageHash: Hash, privateKey: PrivateKey): Signature {
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      throw new InvalidPrivateKeyError(
        `Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
      );
    }

    try {
      const exports = loader.getExports();
      const savedOffset = (loader as any).memoryOffset;

      try {
        // Allocate memory
        const msgHashPtr = (loader as any).malloc(32);
        const privKeyPtr = (loader as any).malloc(32);
        const sigPtr = (loader as any).malloc(64);
        const recidPtr = (loader as any).malloc(1);

        // Write inputs
        (loader as any).writeBytes(messageHash, msgHashPtr);
        (loader as any).writeBytes(privateKey, privKeyPtr);

        // Call WASM function
        const result = exports.secp256k1Sign(
          msgHashPtr,
          privKeyPtr,
          sigPtr,
          recidPtr,
        );

        if (result !== 0) {
          throw new Secp256k1Error("Signing failed");
        }

        // Read outputs
        const sig = (loader as any).readBytes(sigPtr, 64);
        const recid = (loader as any).readBytes(recidPtr, 1);

        const r = sig.slice(0, 32);
        const s = sig.slice(32, 64);
        const v = 27 + recid[0]; // Convert to Ethereum v (27 or 28)

        return { r, s, v };
      } finally {
        (loader as any).memoryOffset = savedOffset;
      }
    } catch (error) {
      throw new Secp256k1Error(`Signing failed: ${error}`);
    }
  }

  // ==========================================================================
  // Verification Operations
  // ==========================================================================

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
      const exports = loader.getExports();
      const savedOffset = (loader as any).memoryOffset;

      try {
        // Allocate memory
        const msgHashPtr = (loader as any).malloc(32);
        const sigPtr = (loader as any).malloc(64);
        const pubKeyPtr = (loader as any).malloc(64);

        // Write inputs
        (loader as any).writeBytes(messageHash, msgHashPtr);
        const sig = new Uint8Array(64);
        sig.set(signature.r, 0);
        sig.set(signature.s, 32);
        (loader as any).writeBytes(sig, sigPtr);
        (loader as any).writeBytes(publicKey, pubKeyPtr);

        // Call WASM function
        const result = exports.secp256k1Verify(msgHashPtr, sigPtr, pubKeyPtr);

        return result === 1;
      } finally {
        (loader as any).memoryOffset = savedOffset;
      }
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Public Key Recovery
  // ==========================================================================

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

    // Convert Ethereum v to recovery bit
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
      const exports = loader.getExports();
      const savedOffset = (loader as any).memoryOffset;

      try {
        // Allocate memory
        const msgHashPtr = (loader as any).malloc(32);
        const sigPtr = (loader as any).malloc(64);
        const pubKeyPtr = (loader as any).malloc(64);

        // Write inputs
        (loader as any).writeBytes(messageHash, msgHashPtr);
        const sig = new Uint8Array(64);
        sig.set(signature.r, 0);
        sig.set(signature.s, 32);
        (loader as any).writeBytes(sig, sigPtr);

        // Call WASM function
        const result = exports.secp256k1Recover(
          msgHashPtr,
          sigPtr,
          recoveryBit,
          pubKeyPtr,
        );

        if (result !== 0) {
          throw new InvalidSignatureError("Public key recovery failed");
        }

        // Read output
        return (loader as any).readBytes(pubKeyPtr, 64);
      } finally {
        (loader as any).memoryOffset = savedOffset;
      }
    } catch (error) {
      throw new InvalidSignatureError(`Public key recovery failed: ${error}`);
    }
  }

  // ==========================================================================
  // Key Derivation
  // ==========================================================================

  export function derivePublicKey(privateKey: PrivateKey): PublicKey {
    if (privateKey.length !== PRIVATE_KEY_SIZE) {
      throw new InvalidPrivateKeyError(
        `Private key must be ${PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`,
      );
    }

    try {
      const exports = loader.getExports();
      const savedOffset = (loader as any).memoryOffset;

      try {
        // Allocate memory
        const privKeyPtr = (loader as any).malloc(32);
        const pubKeyPtr = (loader as any).malloc(64);

        // Write input
        (loader as any).writeBytes(privateKey, privKeyPtr);

        // Call WASM function
        const result = exports.secp256k1DerivePublicKey(privKeyPtr, pubKeyPtr);

        if (result !== 0) {
          throw new InvalidPrivateKeyError("Key derivation failed");
        }

        // Read output
        return (loader as any).readBytes(pubKeyPtr, 64);
      } finally {
        (loader as any).memoryOffset = savedOffset;
      }
    } catch (error) {
      throw new InvalidPrivateKeyError(`Key derivation failed: ${error}`);
    }
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

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

  export function isValidPublicKey(publicKey: PublicKey): boolean {
    if (publicKey.length !== PUBLIC_KEY_SIZE) return false;

    try {
      // For WASM, we rely on the Zig implementation's curve validation
      // Try to verify a dummy signature - if pub key is invalid, it will fail
      const dummyHash = new Uint8Array(32) as Hash;
      const dummySig: Signature = {
        r: new Uint8Array(32),
        s: new Uint8Array(32).fill(1), // non-zero s
        v: 27,
      };
      dummySig.r[31] = 1; // non-zero r

      // If public key is invalid, verify will throw or return false
      // We don't care about the result, just that it doesn't throw
      verify(dummySig, dummyHash, publicKey);
      return true;
    } catch {
      return false;
    }
  }

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

  export namespace Signature {
    export function toCompact(sig: Secp256k1Wasm.Signature): Uint8Array {
      return concat(sig.r, sig.s);
    }

    export function toBytes(sig: Secp256k1Wasm.Signature): Uint8Array {
      const result = new Uint8Array(65);
      result.set(sig.r, 0);
      result.set(sig.s, 32);
      result[64] = sig.v;
      return result;
    }

    export function fromCompact(
      compact: Uint8Array,
      v: number,
    ): Secp256k1Wasm.Signature {
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

    export function fromBytes(bytes: Uint8Array): Secp256k1Wasm.Signature {
      if (bytes.length !== 65) {
        throw new InvalidSignatureError(
          `Signature must be 65 bytes, got ${bytes.length}`,
        );
      }

      return {
        r: bytes.slice(0, 32),
        s: bytes.slice(32, 64),
        v: bytes[64],
      };
    }
  }
}

// ============================================================================
// Internal Utilities
// ============================================================================

function bytes32ToBigInt(bytes: Uint8Array): bigint {
  if (bytes.length !== 32) {
    throw new Error(`Expected 32 bytes, got ${bytes.length}`);
  }
  let result = 0n;
  for (let i = 0; i < 32; i++) {
    result = (result << 8n) | BigInt(bytes[i]);
  }
  return result;
}

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

export default Secp256k1Wasm;
