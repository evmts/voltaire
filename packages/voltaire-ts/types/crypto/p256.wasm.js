/**
 * WASM implementation of P256 (secp256r1) operations
 *
 * Provides cryptographic operations for NIST P-256 curve
 * using WebAssembly for performance.
 */
import * as loader from "../wasm-loader/loader.js";
// ============================================================================
// Main P256Wasm Namespace
// ============================================================================
export var P256Wasm;
(function (P256Wasm) {
    // ==========================================================================
    // Core Types
    // ==========================================================================
    // ==========================================================================
    // Constants
    // ==========================================================================
    P256Wasm.CURVE_ORDER = 0xffffffff00000000ffffffffffffffffbce6faada7179e84f3b9cac2fc632551n;
    P256Wasm.PRIVATE_KEY_SIZE = 32;
    P256Wasm.PUBLIC_KEY_SIZE = 64;
    P256Wasm.SIGNATURE_COMPONENT_SIZE = 32;
    P256Wasm.SHARED_SECRET_SIZE = 32;
    // ==========================================================================
    // Errors
    // ==========================================================================
    class P256Error extends Error {
        _tag = "P256Error";
        constructor(message) {
            super(message);
            this.name = "P256Error";
        }
    }
    P256Wasm.P256Error = P256Error;
    class InvalidSignatureError extends P256Error {
        _tag = "InvalidSignatureError";
        constructor(message) {
            super(message);
            this.name = "InvalidSignatureError";
        }
    }
    P256Wasm.InvalidSignatureError = InvalidSignatureError;
    class InvalidPublicKeyError extends P256Error {
        _tag = "InvalidPublicKeyError";
        constructor(message) {
            super(message);
            this.name = "InvalidPublicKeyError";
        }
    }
    P256Wasm.InvalidPublicKeyError = InvalidPublicKeyError;
    class InvalidPrivateKeyError extends P256Error {
        _tag = "InvalidPrivateKeyError";
        constructor(message) {
            super(message);
            this.name = "InvalidPrivateKeyError";
        }
    }
    P256Wasm.InvalidPrivateKeyError = InvalidPrivateKeyError;
    // ==========================================================================
    // Signing Operations
    // ==========================================================================
    function sign(messageHash, privateKey) {
        if (privateKey.length !== P256Wasm.PRIVATE_KEY_SIZE) {
            throw new InvalidPrivateKeyError(`Private key must be ${P256Wasm.PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`);
        }
        try {
            const result = loader.p256Sign(messageHash, privateKey);
            return {
                r: result.slice(0, 32),
                s: result.slice(32, 64),
            };
        }
        catch (error) {
            throw new P256Error(`Signing failed: ${error}`);
        }
    }
    P256Wasm.sign = sign;
    // ==========================================================================
    // Verification Operations
    // ==========================================================================
    function verify(signature, messageHash, publicKey) {
        if (publicKey.length !== P256Wasm.PUBLIC_KEY_SIZE) {
            throw new InvalidPublicKeyError(`Public key must be ${P256Wasm.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`);
        }
        if (signature.r.length !== P256Wasm.SIGNATURE_COMPONENT_SIZE) {
            throw new InvalidSignatureError(`Signature r must be ${P256Wasm.SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.r.length}`);
        }
        if (signature.s.length !== P256Wasm.SIGNATURE_COMPONENT_SIZE) {
            throw new InvalidSignatureError(`Signature s must be ${P256Wasm.SIGNATURE_COMPONENT_SIZE} bytes, got ${signature.s.length}`);
        }
        // Validate signature components
        let r = 0n;
        for (let i = 0; i < 32; i++) {
            r = (r << 8n) | BigInt(signature.r[i] ?? 0);
        }
        let s = 0n;
        for (let i = 0; i < 32; i++) {
            s = (s << 8n) | BigInt(signature.s[i] ?? 0);
        }
        // Reject invalid ranges
        if (r === 0n || r >= P256Wasm.CURVE_ORDER)
            return false;
        if (s === 0n || s >= P256Wasm.CURVE_ORDER)
            return false;
        try {
            const sig = new Uint8Array(64);
            sig.set(signature.r, 0);
            sig.set(signature.s, 32);
            return loader.p256Verify(messageHash, sig, publicKey);
        }
        catch {
            return false;
        }
    }
    P256Wasm.verify = verify;
    // ==========================================================================
    // Key Derivation
    // ==========================================================================
    function derivePublicKey(privateKey) {
        if (privateKey.length !== P256Wasm.PRIVATE_KEY_SIZE) {
            throw new InvalidPrivateKeyError(`Private key must be ${P256Wasm.PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`);
        }
        // Validate private key is in valid range [1, n-1]
        if (!validatePrivateKey(privateKey)) {
            throw new InvalidPrivateKeyError("Private key must be in range [1, n-1]");
        }
        try {
            return loader.p256DerivePublicKey(privateKey);
        }
        catch (error) {
            throw new InvalidPrivateKeyError(`Failed to derive public key: ${error}`);
        }
    }
    P256Wasm.derivePublicKey = derivePublicKey;
    // ==========================================================================
    // ECDH Operations
    // ==========================================================================
    function ecdh(privateKey, publicKey) {
        if (privateKey.length !== P256Wasm.PRIVATE_KEY_SIZE) {
            throw new InvalidPrivateKeyError(`Private key must be ${P256Wasm.PRIVATE_KEY_SIZE} bytes, got ${privateKey.length}`);
        }
        if (publicKey.length !== P256Wasm.PUBLIC_KEY_SIZE) {
            throw new InvalidPublicKeyError(`Public key must be ${P256Wasm.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`);
        }
        try {
            return loader.p256Ecdh(privateKey, publicKey);
        }
        catch (error) {
            throw new P256Error(`ECDH failed: ${error}`);
        }
    }
    P256Wasm.ecdh = ecdh;
    // ==========================================================================
    // Validation
    // ==========================================================================
    function validatePrivateKey(privateKey) {
        if (privateKey.length !== P256Wasm.PRIVATE_KEY_SIZE) {
            return false;
        }
        // Check if key is in valid range [1, n-1]
        const keyBigInt = BigInt(`0x${Array.from(privateKey)
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("")}`);
        return keyBigInt > 0n && keyBigInt < P256Wasm.CURVE_ORDER;
    }
    P256Wasm.validatePrivateKey = validatePrivateKey;
    function validatePublicKey(publicKey) {
        if (publicKey.length !== P256Wasm.PUBLIC_KEY_SIZE) {
            return false;
        }
        // Basic validation - should be on curve, but checking that requires curve ops
        // For now just check it's not all zeros
        return publicKey.some((b) => b !== 0);
    }
    P256Wasm.validatePublicKey = validatePublicKey;
})(P256Wasm || (P256Wasm = {}));
