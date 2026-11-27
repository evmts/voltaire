/**
 * secp256k1 synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS Secp256k1.
 */
import { addPoints } from "../../crypto/Secp256k1/addPoints.js";
import { CURVE_ORDER, PRIVATE_KEY_SIZE, PUBLIC_KEY_SIZE, SIGNATURE_COMPONENT_SIZE } from "../../crypto/Secp256k1/constants.js";
import { ecdh } from "../../crypto/Secp256k1/ecdh.js";
import { isValidPrivateKey } from "../../crypto/Secp256k1/isValidPrivateKey.js";
import { isValidPublicKey } from "../../crypto/Secp256k1/isValidPublicKey.js";
import * as PublicKeyMethods from "../../crypto/Secp256k1/PublicKey/index.js";
import type { Secp256k1PublicKeyType } from "../../crypto/Secp256k1/Secp256k1PublicKeyType.js";
import * as SignatureMethods from "../../crypto/Secp256k1/Signature/index.js";
import type { Secp256k1SignatureType } from "../../crypto/Secp256k1/SignatureType.js";
import { scalarMultiply } from "../../crypto/Secp256k1/scalarMultiply.js";
import { type HashType } from "../../primitives/Hash/index.js";
import * as PrivateKeyMethods from "../../primitives/PrivateKey/index.js";
import type { PrivateKeyType } from "../../primitives/PrivateKey/PrivateKeyType.js";
export interface SignOptions {
    extraEntropy?: Uint8Array | boolean;
}
/**
 * Sign a 32-byte message hash with a 32-byte secp256k1 private key via native Zig FFI.
 */
export declare function sign(messageHash: HashType, privateKey: PrivateKeyType, options?: SignOptions): Secp256k1SignatureType;
/**
 * Sign a pre-hashed 32-byte digest with a private key via native Zig FFI.
 */
export declare function signHash(hash: HashType, privateKey: PrivateKeyType): Secp256k1SignatureType;
/**
 * Verify an ECDSA signature against a 32-byte message hash and 64-byte uncompressed public key.
 */
export declare function verify(signature: Secp256k1SignatureType, messageHash: HashType, publicKey: Secp256k1PublicKeyType): boolean;
/**
 * Verify an ECDSA signature against a pre-hashed 32-byte digest.
 */
export declare function verifyHash(signature: Secp256k1SignatureType, hash: HashType, publicKey: Secp256k1PublicKeyType): boolean;
/**
 * Recover 64-byte uncompressed public key from signature and 32-byte message hash.
 */
export declare function recoverPublicKey(signature: {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
}, messageHash: HashType): Secp256k1PublicKeyType;
/**
 * Recover 64-byte uncompressed public key from signature and pre-hashed 32-byte digest.
 */
export declare function recoverPublicKeyFromHash(signature: {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
}, hash: HashType): Secp256k1PublicKeyType;
/**
 * Derive 64-byte uncompressed public key from 32-byte private key via native Zig FFI.
 */
export declare function derivePublicKey(privateKey: PrivateKeyType): Secp256k1PublicKeyType;
/**
 * Validate signature components (low-s, valid r/s bounds, valid v) via native Zig FFI.
 */
export declare function isValidSignature(signature: Secp256k1SignatureType): boolean;
/**
 * Generate a cryptographically secure random 32-byte secp256k1 private key via native Zig FFI.
 */
export declare function randomPrivateKey(): Uint8Array;
/**
 * Generate a secp256k1 keypair using native Zig FFI.
 */
export declare function createKeyPair(): {
    privateKey: PrivateKeyType;
    publicKey: Secp256k1PublicKeyType;
};
export declare const Signature: typeof SignatureMethods;
export declare const PublicKey: typeof PublicKeyMethods;
export declare const PrivateKey: typeof PrivateKeyMethods;
export { addPoints, CURVE_ORDER, ecdh, ecdh as getSharedSecret, isValidPrivateKey, isValidPublicKey, PRIVATE_KEY_SIZE, PUBLIC_KEY_SIZE, SIGNATURE_COMPONENT_SIZE, scalarMultiply, };
export declare const Secp256k1: {
    sign: typeof sign;
    signHash: typeof signHash;
    verify: typeof verify;
    verifyHash: typeof verifyHash;
    recoverPublicKey: typeof recoverPublicKey;
    recoverPublicKeyFromHash: typeof recoverPublicKeyFromHash;
    derivePublicKey: typeof derivePublicKey;
    isValidSignature: typeof isValidSignature;
    isValidPublicKey: typeof isValidPublicKey;
    isValidPrivateKey: typeof isValidPrivateKey;
    randomPrivateKey: typeof randomPrivateKey;
    createKeyPair: typeof createKeyPair;
    ecdh: typeof ecdh;
    getSharedSecret: typeof ecdh;
    addPoints: typeof addPoints;
    scalarMultiply: typeof scalarMultiply;
    Signature: typeof SignatureMethods;
    PublicKey: typeof PublicKeyMethods;
    PrivateKey: typeof PrivateKeyMethods;
    CURVE_ORDER: bigint;
    PRIVATE_KEY_SIZE: number;
    PUBLIC_KEY_SIZE: number;
    SIGNATURE_COMPONENT_SIZE: number;
};
//# sourceMappingURL=Secp256k1.native.d.ts.map