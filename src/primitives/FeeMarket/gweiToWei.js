// @ts-nocheck

/**
 * Convert gwei to wei
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {number} gwei - Amount in gwei
 * @returns {bigint} Amount in wei
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const wei = FeeMarket.gweiToWei(1.5); // 1_500_000_000n
 * ```
 */
export function gweiToWei(gwei) {
	return BigInt(Math.floor(gwei * 1_000_000_000));
}
