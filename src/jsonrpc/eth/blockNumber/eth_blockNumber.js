/**
 * @fileoverview eth_blockNumber JSON-RPC method
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
 * Returns the number of most recent block.
 *
 * @example
 * Result: "0x2377"
 *
 * Implements the `eth_blockNumber` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_blockNumber";
/**
 * Result for `eth_blockNumber`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_blockNumber JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function BlockNumberRequest() {
	return { method };
}
