/**
 * Create Uint32 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint32 for Uint32 documentation
 * @since 0.0.0
 * @param {bigint} value - bigint value
 * @returns {import('./Uint32Type.js').Uint32Type} Uint32 value
 * @throws {Uint32NegativeError} If value is negative
 * @throws {Uint32OverflowError} If value exceeds maximum
 * @example
 * ```javascript
 * import * as Uint32 from './primitives/Uint32/index.js';
 * const value = Uint32.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value: bigint): import("./Uint32Type.js").Uint32Type;
//# sourceMappingURL=fromBigInt.d.ts.map