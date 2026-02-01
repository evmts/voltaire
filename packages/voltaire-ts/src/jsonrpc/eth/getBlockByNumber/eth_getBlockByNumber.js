/**
 * @fileoverview eth_getBlockByNumber JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../index.js').Hash} Hash
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../index.js').BlockTag} BlockTag
 * @typedef {import('../../index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns information about a block by number.
 *
 * @example
 * block: "0x68b3"
 * Hydrated transactions: false
 * Result: ...
 *
 * Implements the `eth_getBlockByNumber` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockByNumber";
/**
 * Result for `eth_getBlockByNumber`
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getBlockByNumber JSON-RPC request
 *
 * @param {BlockSpec} block - Block number, tag, or block hash
 * @param {boolean} [fullTransactions=false] - If true, returns full transaction objects
 * @returns {RequestArguments}
 */
export function GetBlockByNumberRequest(block, fullTransactions = false) {
	return { method, params: [block, fullTransactions] };
}
