/**
 * @fileoverview eth_getFilterChanges JSON-RPC method
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
 * Polling method for the filter with the given ID (created using `eth_newFilter`). Returns an array of logs, block hashes, or transaction hashes since last poll, depending on the installed filter.
 *
 * @example
 * Filter identifier: "0x01"
 * Result: ...
 *
 * Implements the `eth_getFilterChanges` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getFilterChanges";
/**
 * Result for `eth_getFilterChanges`
 *
 * Filter results
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getFilterChanges JSON-RPC request
 *
 * @param {Quantity} address
 * @returns {RequestArguments}
 */
export function GetFilterChangesRequest(address) {
	return { method, params: [address] };
}
