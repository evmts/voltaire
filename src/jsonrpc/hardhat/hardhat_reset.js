/**
 * @description Resets the fork to a fresh state or a specific block
 * @param {{ forking?: { jsonRpcUrl?: string; blockNumber?: number } }} [config] - Optional reset configuration
 * @returns {Object} JSON-RPC request for hardhat_reset
 */
export function hardhat_reset(config) {
	return {
		method: "hardhat_reset",
		params: config ? [config] : [],
	};
}
