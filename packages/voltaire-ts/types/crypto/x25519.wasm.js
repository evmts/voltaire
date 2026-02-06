/**
 * WASM implementation of X25519 operations
 *
 * Provides Curve25519 Diffie-Hellman key exchange
 * using WebAssembly for performance.
 */
import * as loader from "../wasm-loader/loader.js";
// ============================================================================
// Main X25519Wasm Namespace
// ============================================================================
export var X25519Wasm;
(function (X25519Wasm) {
    // ==========================================================================
    // Core Types
    // ==========================================================================
    // ==========================================================================
    // Constants
    // ==========================================================================
    X25519Wasm.SECRET_KEY_SIZE = 32;
    X25519Wasm.PUBLIC_KEY_SIZE = 32;
    X25519Wasm.SHARED_SECRET_SIZE = 32;
    // ==========================================================================
    // Errors
    // ==========================================================================
    class X25519Error extends Error {
        _tag = "X25519Error";
        constructor(message) {
            super(message);
            this.name = "X25519Error";
        }
    }
    X25519Wasm.X25519Error = X25519Error;
    class InvalidSecretKeyError extends X25519Error {
        _tag = "InvalidSecretKeyError";
        constructor(message) {
            super(message);
            this.name = "InvalidSecretKeyError";
        }
    }
    X25519Wasm.InvalidSecretKeyError = InvalidSecretKeyError;
    class InvalidPublicKeyError extends X25519Error {
        _tag = "InvalidPublicKeyError";
        constructor(message) {
            super(message);
            this.name = "InvalidPublicKeyError";
        }
    }
    X25519Wasm.InvalidPublicKeyError = InvalidPublicKeyError;
    // ==========================================================================
    // Key Derivation
    // ==========================================================================
    function derivePublicKey(secretKey) {
        if (secretKey.length !== X25519Wasm.SECRET_KEY_SIZE) {
            throw new InvalidSecretKeyError(`Secret key must be ${X25519Wasm.SECRET_KEY_SIZE} bytes, got ${secretKey.length}`);
        }
        try {
            return loader.x25519DerivePublicKey(secretKey);
        }
        catch (error) {
            throw new InvalidSecretKeyError(`Failed to derive public key: ${error}`);
        }
    }
    X25519Wasm.derivePublicKey = derivePublicKey;
    // ==========================================================================
    // Key Exchange Operations
    // ==========================================================================
    function scalarmult(secretKey, publicKey) {
        if (secretKey.length !== X25519Wasm.SECRET_KEY_SIZE) {
            throw new InvalidSecretKeyError(`Secret key must be ${X25519Wasm.SECRET_KEY_SIZE} bytes, got ${secretKey.length}`);
        }
        if (publicKey.length !== X25519Wasm.PUBLIC_KEY_SIZE) {
            throw new InvalidPublicKeyError(`Public key must be ${X25519Wasm.PUBLIC_KEY_SIZE} bytes, got ${publicKey.length}`);
        }
        try {
            return loader.x25519Scalarmult(secretKey, publicKey);
        }
        catch (error) {
            throw new X25519Error(`Scalar multiplication failed: ${error}`);
        }
    }
    X25519Wasm.scalarmult = scalarmult;
    // ==========================================================================
    // Keypair Generation
    // ==========================================================================
    function keypairFromSeed(seed) {
        if (seed.length !== X25519Wasm.SECRET_KEY_SIZE) {
            throw new InvalidSecretKeyError(`Seed must be ${X25519Wasm.SECRET_KEY_SIZE} bytes, got ${seed.length}`);
        }
        try {
            return loader.x25519KeypairFromSeed(seed);
        }
        catch (error) {
            throw new X25519Error(`Keypair generation failed: ${error}`);
        }
    }
    X25519Wasm.keypairFromSeed = keypairFromSeed;
    // ==========================================================================
    // Validation
    // ==========================================================================
    function validateSecretKey(secretKey) {
        return secretKey.length === X25519Wasm.SECRET_KEY_SIZE;
    }
    X25519Wasm.validateSecretKey = validateSecretKey;
    function validatePublicKey(publicKey) {
        if (publicKey.length !== X25519Wasm.PUBLIC_KEY_SIZE) {
            return false;
        }
        // Basic check - should not be all zeros
        return publicKey.some((b) => b !== 0);
    }
    X25519Wasm.validatePublicKey = validatePublicKey;
})(X25519Wasm || (X25519Wasm = {}));
