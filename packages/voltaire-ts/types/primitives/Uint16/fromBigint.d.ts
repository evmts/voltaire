/**
 * Create Uint16 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint16 for Uint16 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./Uint16Type.js').Uint16Type} Uint16 value
 * @throws {Uint16NegativeError} If value is negative
 * @throws {Uint16OverflowError} If value exceeds maximum (65535)
 * @example
 * ```javascript
 * import * as Uint16 from './primitives/Uint16/index.js';
 * const value = Uint16.fromBigint(65535n);
 * ```
 */
export function fromBigint(value: bigint): import("./Uint16Type.js").Uint16Type;
//# sourceMappingURL=fromBigint.d.ts.map