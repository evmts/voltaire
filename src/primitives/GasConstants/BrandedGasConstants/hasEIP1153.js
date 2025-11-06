/**
 * Check if a hardfork includes EIP-1153 (transient storage)
 *
 * @param {import('../types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-1153
 */
export function hasEIP1153(hardfork) {
	return hardfork === "cancun";
}
