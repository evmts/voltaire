/**
 * Check if a hardfork includes EIP-4844 (blob transactions)
 *
 * @param {import('../types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-4844
 */
export function hasEIP4844(hardfork) {
	return hardfork === "cancun";
}
