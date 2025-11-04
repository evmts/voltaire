// @ts-nocheck

/**
 * Convert gwei to wei
 *
 * @param {number} gwei - Amount in gwei
 * @returns {bigint} Amount in wei
 */
export function gweiToWei(gwei) {
	return BigInt(Math.floor(gwei * 1_000_000_000));
}
