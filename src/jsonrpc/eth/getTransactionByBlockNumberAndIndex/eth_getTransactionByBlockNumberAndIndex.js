/**
 * @fileoverview eth_getTransactionByBlockNumberAndIndex JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns information about a transaction by block number and transaction index position.
 *
 * @example
 * Block: "0x1442e"
 * Transaction index: "0x2"
 * Result: ...
 *
 * Implements the `eth_getTransactionByBlockNumberAndIndex` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getTransactionByBlockNumberAndIndex";
/**
 * Result for `eth_getTransactionByBlockNumberAndIndex`
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getTransactionByBlockNumberAndIndex JSON-RPC request
 *
 * @param {BlockSpec} address
 * @param {Quantity} block
 * @returns {RequestArguments}
 */
export function GetTransactionByBlockNumberAndIndexRequest(address, block) {
	return { method, params: [address, block] };
}
