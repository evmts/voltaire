/**
 * @description Mines one or more blocks
 * @param {number} [blocks] - Optional number of blocks to mine
 * @param {number} [interval] - Optional interval between blocks in seconds
 * @returns {Object} JSON-RPC request for evm_mine
 */
export function evm_mine(blocks, interval) {
	const params = [];
	if (blocks !== undefined) {
		params.push(blocks);
		if (interval !== undefined) {
			params.push(interval);
		}
	}
	return {
		method: "evm_mine",
		params,
	};
}
