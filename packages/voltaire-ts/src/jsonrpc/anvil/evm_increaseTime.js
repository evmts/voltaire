/**
 * @description Increases the timestamp of the next block by the given amount
 * @param {number} seconds - Seconds to increase
 * @returns {Object} JSON-RPC request for evm_increaseTime
 */
export function evm_increaseTime(seconds) {
	return {
		method: "evm_increaseTime",
		params: [seconds],
	};
}
