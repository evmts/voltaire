/**
 * X25519 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS X25519.
 */
import { PUBLIC_KEY_SIZE, SECRET_KEY_SIZE, SHARED_SECRET_SIZE } from "../../crypto/X25519/constants.js";
import { generateSecretKey } from "../../crypto/X25519/generateSecretKey.js";
import { isValidPublicKey } from "../../crypto/X25519/isValidPublicKey.js";
import { isWeakPublicKey } from "../../crypto/X25519/isWeakPublicKey.js";
import type { PublicKey } from "../../crypto/X25519/PublicKey.js";
import type { SecretKey } from "../../crypto/X25519/SecretKey.js";
import type { SharedSecret } from "../../crypto/X25519/SharedSecret.js";
import { validatePublicKey } from "../../crypto/X25519/validatePublicKey.js";
import { validateSecretKey } from "../../crypto/X25519/validateSecretKey.js";
/**
 * Derive 32-byte X25519 public key from 32-byte secret key via native Zig FFI.
 */
export declare function derivePublicKey(secretKey: SecretKey): PublicKey;
/**
 * Compute 32-byte X25519 ECDH shared secret via native Zig FFI.
 */
export declare function scalarmult(secretKey: SecretKey, publicKey: PublicKey): SharedSecret;
/**
 * Generate deterministic X25519 keypair from 32-byte seed via native Zig FFI.
 */
export declare function keypairFromSeed(seed: Uint8Array): {
    secretKey: SecretKey;
    publicKey: PublicKey;
};
/**
 * Generate random X25519 keypair backed by native key derivation.
 */
export declare function generateKeypair(): {
    secretKey: SecretKey;
    publicKey: PublicKey;
};
export { generateSecretKey, isValidPublicKey, isWeakPublicKey, PUBLIC_KEY_SIZE, SECRET_KEY_SIZE, SHARED_SECRET_SIZE, validatePublicKey, validateSecretKey, };
export declare const X25519: {
    derivePublicKey: typeof derivePublicKey;
    scalarmult: typeof scalarmult;
    keypairFromSeed: typeof keypairFromSeed;
    generateSecretKey: typeof generateSecretKey;
    generateKeypair: typeof generateKeypair;
    validateSecretKey: typeof validateSecretKey;
    validatePublicKey: typeof validatePublicKey;
    isValidPublicKey: typeof isValidPublicKey;
    isWeakPublicKey: typeof isWeakPublicKey;
    SECRET_KEY_SIZE: 32;
    PUBLIC_KEY_SIZE: 32;
    SHARED_SECRET_SIZE: 32;
};
//# sourceMappingURL=X25519.native.d.ts.map