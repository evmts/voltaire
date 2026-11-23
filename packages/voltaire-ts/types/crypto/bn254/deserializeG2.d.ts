/**
 * Deserialize G2 point from bytes
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {Uint8Array} bytes - 128-byte serialization (x.c0 || x.c1 || y.c0 || y.c1; EIP-197 wire order is c1 || c0)
 * @returns {import('./G2PointType.js').G2PointType} G2 point
 * @throws {Bn254Error} If bytes length is invalid (must be 128 bytes)
 * @throws {Bn254InvalidPointError} If a coordinate is >= the field modulus or the point is not on the curve
 * @throws {import('./errors.js').Bn254SubgroupCheckError} If the point is outside the G2 subgroup
 * @example
 * ```javascript
 * import { deserializeG2 } from './crypto/bn254/deserializeG2.js';
 * const bytes = new Uint8Array(128);
 * const point = deserializeG2(bytes);
 * ```
 */
export function deserializeG2(bytes: Uint8Array): import("./G2PointType.js").G2PointType;
//# sourceMappingURL=deserializeG2.d.ts.map