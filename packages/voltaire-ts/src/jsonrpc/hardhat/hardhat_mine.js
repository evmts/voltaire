/**
 * @description Mines one or more blocks
 * @param {string} [blocks] - Hex-encoded number of blocks to mine (default: "0x1")
 * @param {string} [interval] - Hex-encoded interval between blocks in seconds
 * @returns {Object} JSON-RPC request for hardhat_mine
 */
export function hardhat_mine(blocks, interval) {
	const params = [];
	if (blocks !== undefined) {
		params.push(blocks);
		if (interval !== undefined) {
			params.push(interval);
		}
	}
	return {
		method: "hardhat_mine",
		params,
	};
}
