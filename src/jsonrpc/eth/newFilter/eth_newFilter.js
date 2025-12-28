/**
 * @fileoverview eth_newFilter JSON-RPC method
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
 * Install a log filter in the server, allowing for later polling. Registers client interest in logs matching the filter, and returns an identifier.
 *
 * @example
 * Filter: ...
 * Result: "0x01"
 *
 * Implements the `eth_newFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_newFilter";
/**
 * Result for `eth_newFilter`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_newFilter JSON-RPC request
 *
 * @param {any} address
 * @returns {RequestArguments}
 */
export function NewFilterRequest(address) {
	return { method, params: [address] };
}
