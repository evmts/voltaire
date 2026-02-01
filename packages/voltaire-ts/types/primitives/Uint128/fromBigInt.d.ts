/**
 * Create Uint128 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/uint128 for Uint128 documentation
 * @since 0.0.0
 * @param {bigint} value - BigInt value
 * @returns {import('./Uint128Type.js').Uint128Type} Uint128 value
 * @throws {Error} If value is out of range
 * @example
 * ```javascript
 * import * as Uint128 from './primitives/Uint128/index.js';
 * const value = Uint128.fromBigInt(12345678901234567890n);
 * ```
 */
export function fromBigInt(value: bigint): import("./Uint128Type.js").Uint128Type;
//# sourceMappingURL=fromBigInt.d.ts.map