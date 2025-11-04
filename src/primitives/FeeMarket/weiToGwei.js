// @ts-nocheck

/**
 * Convert wei to gwei for display
 *
 * @param {bigint} wei - Amount in wei
 * @returns {string} Amount in gwei (formatted with 9 decimal places)
 */
export function weiToGwei(wei) {
	const gwei = Number(wei) / 1_000_000_000;
	return gwei.toFixed(9);
}
