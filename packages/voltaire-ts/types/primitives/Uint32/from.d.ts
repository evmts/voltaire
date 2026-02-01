/**
 * Create Uint32 from number, bigint, or string
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {number | bigint | string} value - number, bigint, or decimal/hex string
 * @returns {import('./Uint32Type.js').Uint32Type} Uint32 value
 * @throws {Uint32NotSafeIntegerError} If value is not a safe integer
 * @throws {Uint32NotIntegerError} If value is not an integer
 * @throws {Uint32NegativeError} If value is negative
 * @throws {Uint32OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const a = Uint32.from(100);
 * const b = Uint32.from("255");
 * const c = Uint32.from("0xff");
 * const d = Uint32.from(42n);
 * ```
 */
export function from(value: number | bigint | string): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=from.d.ts.map