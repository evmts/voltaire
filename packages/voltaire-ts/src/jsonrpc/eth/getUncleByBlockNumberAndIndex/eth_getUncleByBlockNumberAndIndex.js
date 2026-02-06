/**
 * @fileoverview eth_getUncleByBlockNumberAndIndex JSON-RPC method
 */

/**
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 * @typedef {import('../../index.js').Block} Block
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns information about an uncle of a block by number and uncle index position.
 *
 * @example
 * Params: ["0x29c", "0x0"]
 * Result: { ... } (Block object)
 *
 * Implements the `eth_getUncleByBlockNumberAndIndex` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getUncleByBlockNumberAndIndex";

/**
 * Result for `eth_getUncleByBlockNumberAndIndex`
 *
 * @typedef {Block | null} Result
 */

/**
 * Creates an eth_getUncleByBlockNumberAndIndex JSON-RPC request
 *
 * @param {BlockSpec} blockNumber - Block number or tag
 * @param {Quantity} index - The uncle's index position
 * @returns {RequestArguments}
 */
export function GetUncleByBlockNumberAndIndexRequest(blockNumber, index) {
	return {
		method,
		params: [blockNumber, index],
	};
}
