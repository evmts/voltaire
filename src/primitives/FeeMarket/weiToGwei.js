// @ts-nocheck

/**
 * Convert wei to gwei for display
 *
 * @see https://voltaire.tevm.sh/primitives/feemarket for FeeMarket documentation
 * @since 0.0.0
 * @param {bigint} wei - Amount in wei
 * @returns {string} Amount in gwei (formatted with 9 decimal places)
 * @throws {never}
 * @example
 * ```javascript
 * import * as FeeMarket from './primitives/FeeMarket/index.js';
 * const gwei = FeeMarket.weiToGwei(1_500_000_000n); // "1.500000000"
 * ```
 */
export function weiToGwei(wei) {
	const gwei = Number(wei) / 1_000_000_000;
	return gwei.toFixed(9);
}
