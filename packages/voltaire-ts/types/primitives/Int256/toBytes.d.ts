/**
 * Convert Int256 to bytes (two's complement, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int256 documentation
 * @since 0.0.0
 * @param {import('./Int256Type.js').BrandedInt256} value - Int256 value
 * @returns {Uint8Array} Byte array (32 bytes)
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.from(-1n);
 * const bytes = Int256.toBytes(a); // [0xff, 0xff, ..., 0xff]
 * ```
 */
export function toBytes(value: import("./Int256Type.js").BrandedInt256): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map