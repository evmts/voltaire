/**
 * @fileoverview eth_getFilterLogs JSON-RPC method
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
 * Returns an array of all logs matching the filter with the given ID (created using `eth_newFilter`).
 *
 * @example
 * Filter identifier: "0x01"
 * Result: ...
 *
 * Implements the `eth_getFilterLogs` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getFilterLogs";
/**
 * Result for `eth_getFilterLogs`
 *
 * Filter results
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getFilterLogs JSON-RPC request
 *
 * @param {Quantity} address
 * @returns {RequestArguments}
 */
export function GetFilterLogsRequest(address) {
	return { method, params: [address] };
}
