/**
 * @fileoverview eth_getBlockReceipts JSON-RPC method
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
 * Returns the receipts of a block by number or hash.
 *
 * @example
 * Block: "latest"
 * Result: ...
 *
 * Implements the `eth_getBlockReceipts` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockReceipts";
/**
 * Result for `eth_getBlockReceipts`
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getBlockReceipts JSON-RPC request
 *
 * @param {BlockSpec} address
 * @returns {RequestArguments}
 */
export function GetBlockReceiptsRequest(address) {
	return { method, params: [address] };
}
