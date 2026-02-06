/**
 * Create Uint128 from bigint, number, or string (standard form)
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./Uint128Type.js').Uint128Type} Uint128 value
 * @throws {Uint128NotIntegerError} If number is not an integer
 * @throws {Uint128NegativeError} If value is negative
 * @throws {Uint128OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const a = Uint128.from(100n);
 * const b = Uint128.from("255");
 * const c = Uint128.from("0xff");
 * const d = Uint128.from(42);
 * ```
 */
export function from(value: bigint | number | string): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=from.d.ts.map