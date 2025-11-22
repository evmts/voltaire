/**
 * @fileoverview eth_coinbase JSON-RPC method
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
 * Returns the client coinbase address.
 *
 * @example
 * Result: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
 *
 * Implements the `eth_coinbase` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_coinbase";
/**
 * Result for `eth_coinbase`
 *
 * hex encoded address
 *
 * @typedef {Address} Result
 */

/**
 * Creates a eth_coinbase JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function CoinbaseRequest() {
	return { method };
}
