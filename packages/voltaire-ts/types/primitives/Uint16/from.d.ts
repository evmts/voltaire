/**
 * Create Uint16 from number or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {number | string} value - number or decimal/hex string
 * @returns {import('./Uint16Type.js').Uint16Type} Uint16 value
 * @throws {Uint16InvalidHexError} If string is invalid
 * @throws {Uint16NotIntegerError} If value is not an integer
 * @throws {Uint16NegativeError} If value is negative
 * @throws {Uint16OverflowError} If value exceeds maximum (65535)
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const a = Uint16.from(1000);
 * const b = Uint16.from("65535");
 * const c = Uint16.from("0xffff");
 * ```
 */
export function from(value: number | string): import("./Uint16Type.js").Uint16Type;
//# sourceMappingURL=from.d.ts.map