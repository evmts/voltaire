/**
 * @fileoverview eth_getBlockTransactionCountByHash JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the number of transactions in a block from a block matching the given block hash.
 *
 * @example
 * Block hash: "0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238"
 * Result: "0x8"
 *
 * Implements the `eth_getBlockTransactionCountByHash` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockTransactionCountByHash";
/**
 * Result for `eth_getBlockTransactionCountByHash`
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getBlockTransactionCountByHash JSON-RPC request
 *
 * @param {Hash} address
 * @returns {RequestArguments}
 */
export function GetBlockTransactionCountByHashRequest(address) {
	return { method, params: [address] };
}
