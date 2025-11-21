/**
 * @description Sets the block gas limit
 * @param {string} gasLimit - Hex-encoded gas limit
 * @returns {Object} JSON-RPC request for evm_setBlockGasLimit
 */
export function evm_setBlockGasLimit(gasLimit) {
	return {
		method: "evm_setBlockGasLimit",
		params: [gasLimit],
	};
}
