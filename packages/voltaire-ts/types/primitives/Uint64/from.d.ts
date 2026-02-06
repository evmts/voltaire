/**
 * Create Uint64 from bigint, number, or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint64 for Uint64 documentation
 * @since 0.0.0
 * @param {bigint | number | string} value - bigint, number, or decimal/hex string
 * @returns {import('./Uint64Type.js').Uint64Type} Uint64 value
 * @throws {Uint64NotIntegerError} If number is not an integer
 * @throws {Uint64NegativeError} If value is negative
 * @throws {Uint64OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint64 from './primitives/Uint64/index.js';
 * const a = Uint64.from(100n);
 * const b = Uint64.from("18446744073709551615");
 * const c = Uint64.from("0xffffffffffffffff");
 * const d = Uint64.from(42);
 * ```
 */
export function from(value: bigint | number | string): import("./Uint64Type.js").Uint64Type;
//# sourceMappingURL=from.d.ts.map