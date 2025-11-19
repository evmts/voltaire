/**
 * @fileoverview eth_getLogs JSON-RPC method
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
 * Returns an array of all logs matching the specified filter.
 *
 * @example
 * Filter: ...
 * Result: ...
 *
 * Implements the `eth_getLogs` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getLogs";
/**
 * Result for `eth_getLogs`
 *
 * Filter results
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_getLogs JSON-RPC request
 *
 * @param {any} address
 * @returns {RequestArguments}
 */
export function GetLogsRequest(address) {
	return { method, params: [address] };
}
