/**
 * P256 (secp256r1) synchronous native implementation using Zig C ABI (Bun FFI / Node-API).
 * Drop-in 1:1 replacement for pure JS P256.
 */
import { CURVE_B, CURVE_ORDER, FIELD_PRIME, PRIVATE_KEY_SIZE, PUBLIC_KEY_SIZE, SHARED_SECRET_SIZE, SIGNATURE_COMPONENT_SIZE } from "../../crypto/P256/constants.js";
import { isValidPublicKey } from "../../crypto/P256/isValidPublicKey.js";
import type { P256Constructor } from "../../crypto/P256/P256Constructor.js";
import type { P256PrivateKeyType } from "../../crypto/P256/P256PrivateKeyType.js";
import type { P256PublicKeyType } from "../../crypto/P256/P256PublicKeyType.js";
import type { P256SignatureType } from "../../crypto/P256/P256SignatureType.js";
import { randomPrivateKey } from "../../crypto/P256/randomPrivateKey.js";
import { validatePrivateKey } from "../../crypto/P256/validatePrivateKey.js";
import { validatePublicKey } from "../../crypto/P256/validatePublicKey.js";
import type { SHA256Hash } from "../../crypto/SHA256/SHA256HashType.js";
import { type HashType } from "../../primitives/Hash/index.js";
export interface P256SignOptions {
    extraEntropy?: boolean | Uint8Array;
    lowS?: boolean;
}
/**
 * Sign a 32-byte message hash with a 32-byte P-256 private key via native Zig FFI.
 */
export declare function sign(messageHash: HashType | SHA256Hash | Uint8Array, privateKey: P256PrivateKeyType, options?: P256SignOptions): P256SignatureType;
/**
 * Verify a P-256 ECDSA signature over a 32-byte message hash via native Zig FFI.
 */
export declare function verify(signature: P256SignatureType, messageHash: HashType | SHA256Hash | Uint8Array, publicKey: P256PublicKeyType): boolean;
/**
 * Derive 64-byte uncompressed P-256 public key from 32-byte private key via native Zig FFI.
 */
export declare function derivePublicKey(privateKey: P256PrivateKeyType): P256PublicKeyType;
/**
 * Perform P-256 ECDH shared secret computation via native Zig FFI.
 */
export declare function ecdh(privateKey: P256PrivateKeyType, publicKey: P256PublicKeyType): Uint8Array;
export { CURVE_B, CURVE_ORDER, FIELD_PRIME, isValidPublicKey, PRIVATE_KEY_SIZE, PUBLIC_KEY_SIZE, randomPrivateKey, SHARED_SECRET_SIZE, SIGNATURE_COMPONENT_SIZE, validatePrivateKey, validatePublicKey, };
export declare const P256: P256Constructor;
//# sourceMappingURL=P256.native.d.ts.map