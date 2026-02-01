/**
 * Serialize G1 point to bytes (64 bytes: x || y)
 *
 * @see https://voltaire.tevm.sh/crypto for BN254 cryptography documentation
 * @since 0.0.0
 * @param {import('./G1PointType.js').G1PointType} point - G1 point
 * @returns {Uint8Array} 64-byte serialization
 * @throws {never}
 * @example
 * ```javascript
 * import { serializeG1 } from './crypto/bn254/serializeG1.js';
 * import * as G1 from './crypto/bn254/G1/index.js';
 * const point = G1.generator();
 * const bytes = serializeG1(point);
 * ```
 */
export function serializeG1(point: import("./G1PointType.js").G1PointType): Uint8Array;
//# sourceMappingURL=serializeG1.d.ts.map