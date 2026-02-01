/**
 * Convert Int128 to bytes (two's complement, big-endian)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {import('./Int128Type.js').BrandedInt128} value - Int128 value
 * @returns {Uint8Array} Byte array (16 bytes)
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.from(-1n);
 * const bytes = Int128.toBytes(a); // [0xff, 0xff, ..., 0xff]
 * ```
 */
export function toBytes(value: import("./Int128Type.js").BrandedInt128): Uint8Array;
//# sourceMappingURL=toBytes.d.ts.map