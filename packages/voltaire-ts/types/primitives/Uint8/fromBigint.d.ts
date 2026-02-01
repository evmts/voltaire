/**
 * Create Uint8 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint8 for Uint8 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./Uint8Type.js').Uint8Type} Uint8 value
 * @throws {Uint8NegativeError} If value is negative
 * @throws {Uint8OverflowError} If value exceeds maximum (255)
 * @example
 * ```javascript
 * import * as Uint8 from './primitives/Uint8/index.js';
 * const value = Uint8.fromBigint(255n);
 * ```
 */
export function fromBigint(value: bigint): import("./Uint8Type.js").Uint8Type;
//# sourceMappingURL=fromBigint.d.ts.map