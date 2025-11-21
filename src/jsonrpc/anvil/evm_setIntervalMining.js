/**
 * @description Sets the mining interval in seconds (0 disables interval mining)
 * @param {number} interval - Interval in seconds
 * @returns {Object} JSON-RPC request for evm_setIntervalMining
 */
export function evm_setIntervalMining(interval) {
	return {
		method: "evm_setIntervalMining",
		params: [interval],
	};
}
