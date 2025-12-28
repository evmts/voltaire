/**
 * @fileoverview eth_newPendingTransactionFilter JSON-RPC method
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
 * Creates a filter in the node, allowing for later polling. Registers client interest in new transactions, and returns an identifier.
 *
 * @example
 * Result: "0x01"
 *
 * Implements the `eth_newPendingTransactionFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_newPendingTransactionFilter";
/**
 * Result for `eth_newPendingTransactionFilter`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_newPendingTransactionFilter JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function NewPendingTransactionFilterRequest() {
	return { method };
}
