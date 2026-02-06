/**
 * Serialize G2 point to bytes (128 bytes: x.c0 || x.c1 || y.c0 || y.c1)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('./G2PointType.js').G2PointType} point - G2 point
 * @returns {Uint8Array} 128-byte serialization
 * @throws {never}
 * @example
 * ```javascript
 * import { serializeG2 } from './crypto/bn254/serializeG2.js';
 * import * as G2 from './crypto/bn254/G2/index.js';
 * const point = G2.generator();
 * const bytes = serializeG2(point);
 * ```
 */
export function serializeG2(point: import("./G2PointType.js").G2PointType): Uint8Array;
//# sourceMappingURL=serializeG2.d.ts.map