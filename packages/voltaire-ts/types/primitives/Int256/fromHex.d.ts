/**
 * Create Int256 from hex string (two's complement)
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @returns {import('./Int256Type.js').BrandedInt256} Int256 value
 * @throws {InvalidFormatError} If hex is invalid
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.fromHex("0x7fffffffffffffffffffffffffffffff"); // MAX
 * const b = Int256.fromHex("0x80000000000000000000000000000000"); // MIN
 * const c = Int256.fromHex("0xffffffffffffffffffffffffffffffff"); // -1
 * ```
 */
export function fromHex(hex: string): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=fromHex.d.ts.map