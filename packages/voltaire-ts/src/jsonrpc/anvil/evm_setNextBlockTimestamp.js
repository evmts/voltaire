/**
 * @description Sets the timestamp of the next block
 * @param {number} timestamp - Unix timestamp for next block
 * @returns {Object} JSON-RPC request for evm_setNextBlockTimestamp
 */
export function evm_setNextBlockTimestamp(timestamp) {
	return {
		method: "evm_setNextBlockTimestamp",
		params: [timestamp],
	};
}
