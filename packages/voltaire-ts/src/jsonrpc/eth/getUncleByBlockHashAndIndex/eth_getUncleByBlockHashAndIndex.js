/**
 * @fileoverview eth_getUncleByBlockHashAndIndex JSON-RPC method
 */

/**
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').Block} Block
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns information about an uncle of a block by hash and uncle index position.
 *
 * @example
 * Params: ["0x...", "0x0"]
 * Result: { ... } (Block object)
 *
 * Implements the `eth_getUncleByBlockHashAndIndex` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getUncleByBlockHashAndIndex";

/**
 * Result for `eth_getUncleByBlockHashAndIndex`
 *
 * @typedef {Block | null} Result
 */

/**
 * Creates an eth_getUncleByBlockHashAndIndex JSON-RPC request
 *
 * @param {Hash} blockHash - Hash of a block
 * @param {Quantity} index - The uncle's index position
 * @returns {RequestArguments}
 */
export function GetUncleByBlockHashAndIndexRequest(blockHash, index) {
	return {
		method,
		params: [blockHash, index],
	};
}
