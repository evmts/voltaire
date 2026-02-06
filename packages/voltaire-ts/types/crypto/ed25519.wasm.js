/**
 * Ed25519 operations implementation
 *
 * Uses @noble/curves Ed25519 implementation since WASM exports
 * are not yet available in Zig 0.15.1 (API changed).
 */
import { ed25519 } from "@noble/curves/ed25519.js";
// ============================================================================
// Main Ed25519Wasm Namespace
// ============================================================================
export var Ed25519Wasm;
(function (Ed25519Wasm) {
    // ==========================================================================
    // Core Types
    // ==========================================================================
    // ==========================================================================
    // Constants
    // ==========================================================================
    Ed25519Wasm.SECRET_KEY_SIZE = 64;
    Ed25519Wasm.PUBLIC_KEY_SIZE = 32;
    Ed25519Wasm.SIGNATURE_SIZE = 64;
    Ed25519Wasm.SEED_SIZE = 32;
    // ==========================================================================
    // Errors
    // ==========================================================================
    class Ed25519Error extends Error {
        _tag = "Ed25519Error";
        constructor(message) {
            super(message);
            this.name = "Ed25519Error";
        }
    }
    Ed25519Wasm.Ed25519Error = Ed25519Error;
    class InvalidSignatureError extends Ed25519Error {
        _tag = "InvalidSignatureError";
        constructor(message) {
            super(message);
            this.name = "InvalidSignatureError";
        }
    }
    Ed25519Wasm.InvalidSignatureError = InvalidSignatureError;
    class InvalidPublicKeyError extends Ed25519Error {
        _tag = "InvalidPublicKeyError";
        constructor(message) {
            super(message);
            this.name = "InvalidPublicKeyError";
        }
    }
    Ed25519Wasm.InvalidPublicKeyError = InvalidPublicKeyError;
    class InvalidSecretKeyError extends Ed25519Error {
        _tag = "InvalidSecretKeyError";
        constructor(message) {
            super(message);
            this.name = "InvalidSecretKeyError";
        }
    }
    Ed25519Wasm.InvalidSecretKeyError = InvalidSecretKeyError;
    class InvalidSeedError extends Ed25519Error {
        _tag = "InvalidSeedError";
        constructor(message) {
            super(message);
            this.name = "InvalidSeedError";
        }
    }
    Ed25519Wasm.InvalidSeedError = InvalidSeedError;
    // ==========================================================================
    // Keypair Generation
    // ==========================================================================
    function keypairFromSeed(seed) {
        if (seed.length !== Ed25519Wasm.SEED_SIZE) {
            throw new InvalidSeedError(`Seed must be ${Ed25519Wasm.SEED_SIZE} bytes, got ${seed.length}`);
        }
        try {
            const publicKey = ed25519.getPublicKey(seed);
            // Ed25519 secret key is 64 bytes: seed (32) + public key (32)
            const secretKey = new Uint8Array(64);
            secretKey.set(seed, 0);
            secretKey.set(publicKey, 32);
            return { secretKey, publicKey };
        }
        catch (error) {
            throw new Ed25519Error(`Keypair generation failed: ${error}`);
        }
    }
    Ed25519Wasm.keypairFromSeed = keypairFromSeed;
    // ==========================================================================
    // Signing Operations
    // ==========================================================================
    function sign(message, secretKey) {
        if (secretKey.length !== Ed25519Wasm.SECRET_KEY_SIZE) {
            throw new InvalidSecretKeyError(`Secret key must be ${Ed25519Wasm.SECRET_KEY_SIZE} bytes, got ${secretKey.length}`);
        }
        try {
            // Use first 32 bytes as seed for signing
            const seed = secretKey.slice(0, 32);
            return ed25519.sign(message, seed);
        }
        catch (error) {
            throw new Ed25519Error(`Signing failed: ${error}`);
        }
    }
    Ed25519Wasm.sign = sign;
    // ==========================================================================
    // Verification Operations
    // ==========================================================================
    function verify(signature, message, publicKey) {
        if (publicKey.length !== Ed25519Wasm.PUBLIC_KEY_SIZE) {
            throw new InvalidPublicKeyError(`Public key must be ${Ed25519Wasm.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`);
        }
        if (signature.length !== Ed25519Wasm.SIGNATURE_SIZE) {
            throw new InvalidSignatureError(`Signature must be ${Ed25519Wasm.SIGNATURE_SIZE} bytes, got ${signature.length}`);
        }
        try {
            return ed25519.verify(signature, message, publicKey);
        }
        catch {
            return false;
        }
    }
    Ed25519Wasm.verify = verify;
    // ==========================================================================
    // Key Derivation
    // ==========================================================================
    function derivePublicKey(secretKey) {
        // Allow both 32-byte seed and 64-byte secret key
        if (secretKey.length === Ed25519Wasm.SEED_SIZE) {
            // Treat as seed, derive public key
            try {
                return ed25519.getPublicKey(secretKey);
            }
            catch (error) {
                throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
            }
        }
        if (secretKey.length !== Ed25519Wasm.SECRET_KEY_SIZE) {
            throw new InvalidSecretKeyError(`Secret key must be ${Ed25519Wasm.SECRET_KEY_SIZE} bytes, got ${secretKey.length}`);
        }
        try {
            // Public key is stored in last 32 bytes of 64-byte secret key
            return secretKey.slice(32, 64);
        }
        catch (error) {
            throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
        }
    }
    Ed25519Wasm.derivePublicKey = derivePublicKey;
    // ==========================================================================
    // Validation
    // ==========================================================================
    function validateSecretKey(secretKey) {
        return secretKey.length === Ed25519Wasm.SECRET_KEY_SIZE;
    }
    Ed25519Wasm.validateSecretKey = validateSecretKey;
    function validatePublicKey(publicKey) {
        if (publicKey.length !== Ed25519Wasm.PUBLIC_KEY_SIZE) {
            return false;
        }
        // Basic check - should not be all zeros
        return publicKey.some((b) => b !== 0);
    }
    Ed25519Wasm.validatePublicKey = validatePublicKey;
    function validateSeed(seed) {
        return seed.length === Ed25519Wasm.SEED_SIZE;
    }
    Ed25519Wasm.validateSeed = validateSeed;
})(Ed25519Wasm || (Ed25519Wasm = {}));
