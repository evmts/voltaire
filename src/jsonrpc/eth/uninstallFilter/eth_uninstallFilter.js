/**
 * @fileoverview eth_uninstallFilter JSON-RPC method
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
 * Uninstalls a filter with given id.
 *
 * @example
 * Filter identifier: "0x01"
 * Result: true
 *
 * Implements the `eth_uninstallFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_uninstallFilter";
/**
 * Result for `eth_uninstallFilter`
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_uninstallFilter JSON-RPC request
 *
 * @param {Quantity} address
 * @returns {RequestArguments}
 */
export function UninstallFilterRequest(address) {
	return { method, params: [address] };
}
