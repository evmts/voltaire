/**
 * Verify a BLS12-381 signature
 *
 * Uses pairing check for verification.
 *
 * @param {Uint8Array} signature - Compressed G1 signature (48 bytes)
 * @param {Uint8Array} message - Original message that was signed
 * @param {Uint8Array} publicKey - Compressed G2 public key (96 bytes)
 * @returns {boolean} True if signature is valid
 * @throws {SignatureError} If verification fails due to invalid inputs
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const privateKey = Bls12381.randomPrivateKey();
 * const publicKey = Bls12381.derivePublicKey(privateKey);
 * const message = new TextEncoder().encode('Hello!');
 * const signature = Bls12381.sign(message, privateKey);
 *
 * const isValid = Bls12381.verify(signature, message, publicKey);
 * console.log(isValid); // true
 * ```
 */
export function verify(signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array): boolean;
/**
 * Verify a BLS signature with pre-computed points (advanced)
 *
 * For use when you have already deserialized the points.
 *
 * @param {import('./G2PointType.js').G2PointType} signaturePoint - Signature as G2 point
 * @param {import('./G2PointType.js').G2PointType} messagePoint - Message hash as G2 point
 * @param {import('./G1PointType.js').G1PointType} publicKeyPoint - Public key as G1 point
 * @returns {boolean} True if signature is valid
 */
export function verifyPoint(signaturePoint: import("./G2PointType.js").G2PointType, messagePoint: import("./G2PointType.js").G2PointType, publicKeyPoint: import("./G1PointType.js").G1PointType): boolean;
//# sourceMappingURL=verify.d.ts.map