/**
 * Check if a hardfork includes EIP-3529 (reduced refunds)
 *
 * @param {import('./types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-3529
 */
export function hasEIP3529(hardfork) {
	return (
		hardfork === "london" ||
		hardfork === "paris" ||
		hardfork === "shanghai" ||
		hardfork === "cancun"
	);
}
