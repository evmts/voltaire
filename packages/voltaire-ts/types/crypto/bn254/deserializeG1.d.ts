/**
 * Deserialize G1 point from bytes
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 64-byte serialization
 * @returns {import('./G1PointType.js').G1PointType} G1 point
 * @throws {Bn254Error} If bytes length is invalid (must be 64 bytes)
 * @example
 * ```javascript
 * import { deserializeG1 } from './crypto/bn254/deserializeG1.js';
 * const bytes = new Uint8Array(64);
 * const point = deserializeG1(bytes);
 * ```
 */
export function deserializeG1(bytes: Uint8Array): import("./G1PointType.js").G1PointType;
//# sourceMappingURL=deserializeG1.d.ts.map