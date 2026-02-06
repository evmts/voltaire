/**
 * Create Int256 from bigint
 *
 * @see https://voltaire.tevm.sh/primitives/int256 for Int256 documentation
 * @since 0.0.0
 * @param {bigint} value - BigInt value
 * @returns {import('./Int256Type.js').BrandedInt256} Int256 value
 * @throws {IntegerOverflowError} If value exceeds maximum
 * @throws {IntegerUnderflowError} If value is below minimum
 * @example
 * ```javascript
 * import * as Int256 from './primitives/Int256/index.js';
 * const a = Int256.fromBigInt(-42n);
 * const b = Int256.fromBigInt(100n);
 * ```
 */
export function fromBigInt(value: bigint): import("./Int256Type.js").BrandedInt256;
//# sourceMappingURL=fromBigInt.d.ts.map