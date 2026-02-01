/**
 * Create Uint16 from number
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {number} value - number value
 * @returns {import('./Uint16Type.js').Uint16Type} Uint16 value
 * @throws {Uint16NotIntegerError} If value is not an integer
 * @throws {Uint16NegativeError} If value is negative
 * @throws {Uint16OverflowError} If value exceeds maximum (65535)
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.fromNumber(65535);
 * ```
 */
export function fromNumber(value: number): import("./Uint16Type.js").Uint16Type;
//# sourceMappingURL=fromNumber.d.ts.map