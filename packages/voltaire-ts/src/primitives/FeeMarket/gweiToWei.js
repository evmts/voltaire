const WEI_DECIMALS = 9;
const MAX_GWEI = Number.MAX_VALUE / 1_000_000_000;

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
export function gweiToWei(gwei) {
	// Preserve the numeric coercion and overflow errors of the original conversion.
	const amount = +gwei;
	if (!Number.isFinite(amount)) return BigInt(amount);
	if (Math.abs(amount) > MAX_GWEI) {
		return BigInt(amount < 0 ? -Infinity : Infinity);
	}

	const [significand = "0", exponent = "0"] = amount.toString().split("e");
	const [whole = "0", fraction = ""] = significand.split(".");
	const digits = BigInt(whole + fraction);
	const scale = WEI_DECIMALS + Number(exponent) - fraction.length;
	if (scale >= 0) return digits * 10n ** BigInt(scale);

	const divisor = 10n ** BigInt(-scale);
	const wei = digits / divisor;
	// BigInt division truncates toward zero, so adjust negative fractions to floor.
	return digits % divisor < 0n ? wei - 1n : wei;
}
