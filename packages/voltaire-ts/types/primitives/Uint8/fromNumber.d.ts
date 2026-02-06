/**
 * Create Uint8 from number
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {number} value - number value
 * @returns {import('./Uint8Type.js').Uint8Type} Uint8 value
 * @throws {Uint8NotIntegerError} If value is not an integer
 * @throws {Uint8NegativeError} If value is negative
 * @throws {Uint8OverflowError} If value exceeds maximum (255)
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.fromNumber(255);
 * ```
 */
export function fromNumber(value: number): import("./Uint8Type.js").Uint8Type;
//# sourceMappingURL=fromNumber.d.ts.map