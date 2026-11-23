/**
 * Convert gwei to wei, flooring any fractional wei.
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {number} gwei - Amount in gwei
 * @returns {bigint} Amount in wei
 * @throws {RangeError} If gwei is non-finite or exceeds the supported magnitude
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const wei = FeeMarket.gweiToWei(1.5); // 1_500_000_000n
 * ```
 */
export function gweiToWei(gwei: number): bigint;
//# sourceMappingURL=gweiToWei.d.ts.map