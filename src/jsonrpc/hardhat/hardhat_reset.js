/**
 * @description Resets the fork to a fresh state or a specific block
 * @param {Object} [config] - Optional reset configuration
 * @param {string} [config.forking.jsonRpcUrl] - URL to fork from
 * @param {number} [config.forking.blockNumber] - Block number to fork from
 * @returns {Object} JSON-RPC request for hardhat_reset
 */
export function hardhat_reset(config) {
	return {
		method: "hardhat_reset",
		params: config ? [config] : [],
	};
}
