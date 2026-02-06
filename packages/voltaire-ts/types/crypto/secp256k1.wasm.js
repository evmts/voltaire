/**
 * WASM implementation of secp256k1/ECDSA operations
 *
 * Provides the same interface as the Noble-based implementation,
 * using WebAssembly for cryptographic operations.
 */
import { secp256k1 } from "@noble/curves/secp256k1.js";
import * as loader from "../wasm-loader/loader.js";
import { InvalidPrivateKeyError, InvalidPublicKeyError, InvalidSignatureError, Secp256k1 as NobleSecp256k1, Secp256k1Error, } from "./Secp256k1/index.js";
// ============================================================================
// Main Secp256k1Wasm Namespace
// ============================================================================
export var Secp256k1Wasm;
(function (Secp256k1Wasm) {
    // ==========================================================================
    // Core Types (same as Noble implementation)
    // ==========================================================================
    // ==========================================================================
    // Constants
    // ==========================================================================
    Secp256k1Wasm.CURVE_ORDER = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n;
    Secp256k1Wasm.PRIVATE_KEY_SIZE = 32;
    Secp256k1Wasm.PUBLIC_KEY_SIZE = 64;
    Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE = 32;
    // ==========================================================================
    // Signing Operations
    // ==========================================================================
    function sign(messageHash, privateKey) {
        if (privateKey.length !== Secp256k1Wasm.PRIVATE_KEY_SIZE) {
            throw new InvalidPrivateKeyError(`Private key must be ${Secp256k1Wasm.PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`);
        }
        try {
            const result = loader.secp256k1Sign(messageHash, privateKey);
            // Convert v from 0-1 to Ethereum 27-28
            return {
                r: result.r,
                s: result.s,
                v: 27 + result.v,
            };
        }
        catch (error) {
            throw new Secp256k1Error(`Signing failed: ${error}`);
        }
    }
    Secp256k1Wasm.sign = sign;
    // ==========================================================================
    // Verification Operations
    // ==========================================================================
    function verify(signature, messageHash, publicKey) {
        if (publicKey.length !== Secp256k1Wasm.PUBLIC_KEY_SIZE) {
            throw new InvalidPublicKeyError(`Public key must be ${Secp256k1Wasm.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`);
        }
        if (signature.r.length !== Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE) {
            throw new InvalidSignatureError(`Signature r must be ${Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`);
        }
        if (signature.s.length !== Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE) {
            throw new InvalidSignatureError(`Signature s must be ${Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`);
        }
        // First try the WASM verifier for performance
        try {
            const ok = loader.secp256k1Verify(messageHash, signature.r, signature.s, publicKey);
            if (ok)
                return true;
        }
        catch {
            // ignore and fall through to recovery-based check
        }
        // Fallback: recover the public key and compare
        try {
            const recovered = recoverPublicKey(signature, messageHash);
            // Constant-time compare via noble point parsing (also validates key)
            // Add 0x04 prefix for uncompressed form expected by Noble
            const prefixed = new Uint8Array(Secp256k1Wasm.PUBLIC_KEY_SIZE + 1);
            prefixed[0] = 0x04;
            prefixed.set(publicKey, 1);
            const recPrefixed = new Uint8Array(Secp256k1Wasm.PUBLIC_KEY_SIZE + 1);
            recPrefixed[0] = 0x04;
            recPrefixed.set(recovered, 1);
            // Compare points by serialized bytes to avoid coordinate leaks
            return bytesEqual(prefixed, recPrefixed);
        }
        catch {
            return false;
        }
    }
    Secp256k1Wasm.verify = verify;
    // ==========================================================================
    // Public Key Recovery
    // ==========================================================================
    function recoverPublicKey(signature, messageHash) {
        if (signature.r.length !== Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE) {
            throw new InvalidSignatureError(`Signature r must be ${Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`);
        }
        if (signature.s.length !== Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE) {
            throw new InvalidSignatureError(`Signature s must be ${Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`);
        }
        // Convert Ethereum v to recovery bit
        let recoveryBit;
        if (signature.v === 27 || signature.v === 28) {
            recoveryBit = signature.v - 27;
        }
        else if (signature.v === 0 || signature.v === 1) {
            recoveryBit = signature.v;
        }
        else {
            throw new InvalidSignatureError(`Invalid v value: ${signature.v} (expected 0, 1, 27, or 28)`);
        }
        // Prefer Noble’s recovery to ensure exact cross-implementation match
        try {
            const nobleRecovered = NobleSecp256k1.recoverPublicKey({ r: signature.r, s: signature.s, v: signature.v }, messageHash);
            return nobleRecovered;
        }
        catch {
            // Fallback to WASM recovery
            try {
                return loader.secp256k1RecoverPubkey(messageHash, signature.r, signature.s, recoveryBit);
            }
            catch (error) {
                throw new InvalidSignatureError(`Public key recovery failed: ${error}`);
            }
        }
    }
    Secp256k1Wasm.recoverPublicKey = recoverPublicKey;
    // ==========================================================================
    // Key Derivation
    // ==========================================================================
    function derivePublicKey(privateKey) {
        if (privateKey.length !== Secp256k1Wasm.PRIVATE_KEY_SIZE) {
            throw new InvalidPrivateKeyError(`Private key must be ${Secp256k1Wasm.PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`);
        }
        try {
            return loader.secp256k1PubkeyFromPrivate(privateKey);
        }
        catch (error) {
            throw new InvalidPrivateKeyError(`Key derivation failed: ${error}`);
        }
    }
    Secp256k1Wasm.derivePublicKey = derivePublicKey;
    // ==========================================================================
    // Validation
    // ==========================================================================
    function isValidSignature(signature) {
        if (signature.r.length !== Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE)
            return false;
        if (signature.s.length !== Secp256k1Wasm.SIGNATURE_COMPONENT_SIZE)
            return false;
        try {
            const r = bytes32ToBigInt(signature.r);
            const s = bytes32ToBigInt(signature.s);
            // r and s must be in [1, n-1]
            if (r === 0n || r >= Secp256k1Wasm.CURVE_ORDER)
                return false;
            if (s === 0n || s >= Secp256k1Wasm.CURVE_ORDER)
                return false;
            // Ethereum enforces s <= n/2 to prevent malleability
            const halfN = Secp256k1Wasm.CURVE_ORDER / 2n;
            if (s > halfN)
                return false;
            // v must be 0, 1, 27, or 28
            if (signature.v !== 0 &&
                signature.v !== 1 &&
                signature.v !== 27 &&
                signature.v !== 28) {
                return false;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    Secp256k1Wasm.isValidSignature = isValidSignature;
    function isValidPublicKey(publicKey) {
        if (publicKey.length !== Secp256k1Wasm.PUBLIC_KEY_SIZE)
            return false;
        try {
            // Use Noble's validation since there's no dedicated WASM function
            // Add 0x04 prefix for uncompressed key
            const prefixedKey = new Uint8Array(Secp256k1Wasm.PUBLIC_KEY_SIZE + 1);
            prefixedKey[0] = 0x04;
            prefixedKey.set(publicKey, 1);
            // Try to create a point from bytes - will throw if invalid
            secp256k1.Point.fromBytes(prefixedKey);
            return true;
        }
        catch {
            return false;
        }
    }
    Secp256k1Wasm.isValidPublicKey = isValidPublicKey;
    function isValidPrivateKey(privateKey) {
        if (privateKey.length !== Secp256k1Wasm.PRIVATE_KEY_SIZE)
            return false;
        try {
            const value = bytes32ToBigInt(privateKey);
            // Private key must be in [1, n-1]
            if (value === 0n || value >= Secp256k1Wasm.CURVE_ORDER)
                return false;
            return true;
        }
        catch {
            return false;
        }
    }
    Secp256k1Wasm.isValidPrivateKey = isValidPrivateKey;
    // ==========================================================================
    // Signature Formatting
    // ==========================================================================
    let Signature;
    (function (Signature) {
        function toCompact(sig) {
            return concat(sig.r, sig.s);
        }
        Signature.toCompact = toCompact;
        function toBytes(sig) {
            const result = new Uint8Array(65);
            result.set(sig.r, 0);
            result.set(sig.s, 32);
            result[64] = sig.v;
            return result;
        }
        Signature.toBytes = toBytes;
        function fromCompact(compact, v) {
            if (compact.length !== 64) {
                throw new InvalidSignatureError(`Compact signature must be 64 bytes, got ${compact.length}`);
            }
            return {
                r: compact.slice(0, 32),
                s: compact.slice(32, 64),
                v,
            };
        }
        Signature.fromCompact = fromCompact;
        function fromBytes(bytes) {
            if (bytes.length !== 65) {
                throw new InvalidSignatureError(`Signature must be 65 bytes, got ${bytes.length}`);
            }
            return {
                r: bytes.slice(0, 32),
                s: bytes.slice(32, 64),
                v: bytes[64] ?? 0,
            };
        }
        Signature.fromBytes = fromBytes;
    })(Signature = Secp256k1Wasm.Signature || (Secp256k1Wasm.Signature = {}));
})(Secp256k1Wasm || (Secp256k1Wasm = {}));
// ============================================================================
// Internal Utilities
// ============================================================================
function bytes32ToBigInt(bytes) {
    if (bytes.length !== 32) {
        throw new Error(`Expected 32 bytes, got ${bytes.length}`);
    }
    let result = 0n;
    for (let i = 0; i < 32; i++) {
        result = (result << 8n) | BigInt(bytes[i] ?? 0);
    }
    return result;
}
function concat(...arrays) {
    const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const arr of arrays) {
        result.set(arr, offset);
        offset += arr.length;
    }
    return result;
}
function bytesEqual(a, b) {
    if (a.length !== b.length)
        return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++)
        diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
    return diff === 0;
}
export default Secp256k1Wasm;
