/**
 * Derive a BLS12-381 public key from a private key
 *
 * Public key = privateKey * G2_generator
 *
 * @param {Uint8Array} privateKey - 32-byte private key (scalar in Fr)
 * @returns {Uint8Array} Compressed G2 public key (96 bytes)
 * @throws {InvalidScalarError} If private key is invalid
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const privateKey = Bls12381.randomPrivateKey();
 * const publicKey = Bls12381.derivePublicKey(privateKey);
 * console.log(publicKey.length); // 96
 * ```
 */
export function derivePublicKey(privateKey: Uint8Array): Uint8Array;
/**
 * Derive a BLS12-381 public key as a G1 point (uncompressed)
 *
 * @param {Uint8Array} privateKey - 32-byte private key
 * @returns {import('./G1PointType.js').G1PointType} Public key as G1 point
 * @throws {InvalidScalarError} If private key is invalid
 */
export function derivePublicKeyPoint(privateKey: Uint8Array): import("./G1PointType.js").G1PointType;
//# sourceMappingURL=derivePublicKey.d.ts.map