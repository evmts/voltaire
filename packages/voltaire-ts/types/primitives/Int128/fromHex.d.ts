/**
 * Create Int128 from hex string (two's complement)
 *
 * @see https://voltaire.tevm.sh/primitives/int128 for Int128 documentation
 * @since 0.0.0
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./Int128Type.js').BrandedInt128} Int128 value
 * @throws {InvalidFormatError} If hex is invalid
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int128 from './primitives/Int128/index.js';
 * const a = Int128.fromHex("0x7fffffffffffffffffffffffffffffff"); // MAX
 * const b = Int128.fromHex("0x80000000000000000000000000000000"); // MIN
 * const c = Int128.fromHex("0xffffffffffffffffffffffffffffffff"); // -1
 * ```
 */
export function fromHex(hex: string): import("./Int128Type.js").BrandedInt128;
//# sourceMappingURL=fromHex.d.ts.map