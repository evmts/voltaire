/**
 * Check if a hardfork includes EIP-2929 (cold/warm access costs)
 *
 * @param {import('../types.js').Hardfork} hardfork - EVM hardfork
 * @returns {boolean} Whether hardfork includes EIP-2929
 */
export function hasEIP2929(hardfork) {
	return (
		hardfork === "berlin" ||
		hardfork === "london" ||
		hardfork === "paris" ||
		hardfork === "shanghai" ||
		hardfork === "cancun"
	);
}
