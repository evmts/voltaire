/**
 * Sign a message using BLS12-381
 *
 * Uses the Ethereum consensus "short signatures" scheme:
 * - Signature = privateKey * H(message) where H maps to G1
 * - Signatures are 48 bytes (compressed G1 point)
 *
 * @param {Uint8Array} message - Message to sign
 * @param {Uint8Array} privateKey - 32-byte private key (scalar in Fr)
 * @returns {Uint8Array} Signature as compressed G1 point (48 bytes)
 * @throws {InvalidScalarError} If private key is invalid
 * @throws {SignatureError} If signing fails
 * @example
 * ```javascript
 * import { Bls12381 } from './crypto/Bls12381/index.js';
 *
 * const privateKey = Bls12381.randomPrivateKey();
 * const message = new TextEncoder().encode('Hello, Ethereum!');
 * const signature = Bls12381.sign(message, privateKey);
 * ```
 */
export function sign(message: Uint8Array, privateKey: Uint8Array): Uint8Array;
/**
 * Sign a pre-hashed message (G2 point) using BLS12-381
 *
 * For advanced use when you have already hashed the message to G2.
 *
 * @param {import('./G2PointType.js').G2PointType} messagePoint - Message as G2 point
 * @param {Uint8Array} privateKey - 32-byte private key (scalar in Fr)
 * @returns {import('./G2PointType.js').G2PointType} Signature as G2 point (projective)
 * @throws {InvalidScalarError} If private key is invalid
 * @throws {SignatureError} If signing fails
 */
export function signPoint(messagePoint: import("./G2PointType.js").G2PointType, privateKey: Uint8Array): import("./G2PointType.js").G2PointType;
//# sourceMappingURL=sign.d.ts.map