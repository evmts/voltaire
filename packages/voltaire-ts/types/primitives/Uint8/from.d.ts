/**
 * Create Uint8 from number or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {number | string} value - number or decimal/hex string
 * @returns {import('./Uint8Type.js').Uint8Type} Uint8 value
 * @throws {InvalidFormatError} If value is not a valid integer
 * @throws {IntegerUnderflowError} If value is negative
 * @throws {IntegerOverflowError} If value exceeds 255
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const a = Uint8.from(100);
 * const b = Uint8.from("255");
 * const c = Uint8.from("0xff");
 * ```
 */
export function from(value: number | string): import("./Uint8Type.js").Uint8Type;
//# sourceMappingURL=from.d.ts.map