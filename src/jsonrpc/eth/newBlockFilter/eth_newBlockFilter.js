/**
 * @fileoverview eth_newBlockFilter JSON-RPC method
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
 * Creates a filter in the node, allowing for later polling. Registers client interest in new blocks, and returns an identifier.
 *
 * @example
 * Result: "0x01"
 *
 * Implements the `eth_newBlockFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_newBlockFilter";
/**
 * Result for `eth_newBlockFilter`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_newBlockFilter JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function NewBlockFilterRequest() {
	return { method };
}
