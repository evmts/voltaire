/**
 * @fileoverview eth_getUncleCountByBlockNumber JSON-RPC method
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
 * Returns the number of transactions in a block matching the given block number.
 *
 * @example
 * Block: "0xe8"
 * Result: "0x1"
 *
 * Implements the `eth_getUncleCountByBlockNumber` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getUncleCountByBlockNumber";
/**
 * Result for `eth_getUncleCountByBlockNumber`
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getUncleCountByBlockNumber JSON-RPC request
 *
 * @param {BlockSpec} address
 * @returns {RequestArguments}
 */
export function GetUncleCountByBlockNumberRequest(address) {
	return { method, params: [address] };
}
