/**
 * Check if a hardfork includes EIP-3860 (initcode size limit)
 *
 * @param {import('../types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-3860
 */
export function hasEIP3860(hardfork) {
	return hardfork === "shanghai" || hardfork === "cancun";
}
