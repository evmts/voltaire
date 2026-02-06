/**
 * Create Uint32 from number
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {number} value - number value
 * @returns {import('./Uint32Type.js').Uint32Type} Uint32 value
 * @throws {Uint32NotSafeIntegerError} If value is not a safe integer
 * @throws {Uint32NotIntegerError} If value is not an integer
 * @throws {Uint32NegativeError} If value is negative
 * @throws {Uint32OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.fromNumber(42);
 * ```
 */
export function fromNumber(value: number): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=fromNumber.d.ts.map