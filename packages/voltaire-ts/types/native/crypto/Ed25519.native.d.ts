/**
 * Ed25519 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS Ed25519.
 */
import { PUBLIC_KEY_SIZE, SECRET_KEY_SIZE, SEED_SIZE, SIGNATURE_SIZE } from "../../crypto/Ed25519/constants.js";
import { isValidPublicKey } from "../../crypto/Ed25519/isValidPublicKey.js";
import type { PublicKey } from "../../crypto/Ed25519/PublicKey.js";
import type { SecretKey } from "../../crypto/Ed25519/SecretKey.js";
import type { Seed } from "../../crypto/Ed25519/Seed.js";
import type { Signature } from "../../crypto/Ed25519/Signature.js";
import { validatePublicKey } from "../../crypto/Ed25519/validatePublicKey.js";
import { validateSecretKey } from "../../crypto/Ed25519/validateSecretKey.js";
import { validateSeed } from "../../crypto/Ed25519/validateSeed.js";
/**
 * Sign a message with a 32-byte Ed25519 secret key (seed) via native Zig FFI.
 */
export declare function sign(message: Uint8Array, secretKey: SecretKey): Signature;
/**
 * Verify a 64-byte Ed25519 signature over a message with a 32-byte public key via native Zig FFI.
 */
export declare function verify(signature: Signature, message: Uint8Array, publicKey: PublicKey): boolean;
/**
 * Derive 32-byte Ed25519 public key from 32-byte secret key (verified through native Zig FFI).
 */
export declare function derivePublicKey(secretKey: SecretKey): PublicKey;
/**
 * Generate Ed25519 keypair from 32-byte seed.
 */
export declare function keypairFromSeed(seed: Seed): {
    secretKey: SecretKey;
    publicKey: PublicKey;
};
export { isValidPublicKey, PUBLIC_KEY_SIZE, SECRET_KEY_SIZE, SEED_SIZE, SIGNATURE_SIZE, validatePublicKey, validateSecretKey, validateSeed, };
export declare const Ed25519: {
    keypairFromSeed: typeof keypairFromSeed;
    sign: typeof sign;
    verify: typeof verify;
    derivePublicKey: typeof derivePublicKey;
    validateSecretKey: typeof validateSecretKey;
    validatePublicKey: typeof validatePublicKey;
    isValidPublicKey: typeof isValidPublicKey;
    validateSeed: typeof validateSeed;
    SECRET_KEY_SIZE: 32;
    PUBLIC_KEY_SIZE: 32;
    SIGNATURE_SIZE: 64;
    SEED_SIZE: 32;
};
//# sourceMappingURL=Ed25519.native.d.ts.map