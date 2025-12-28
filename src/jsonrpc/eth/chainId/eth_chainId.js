/**
 * @fileoverview eth_chainId JSON-RPC method
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
 * Returns the chain ID of the current network.
 *
 * @example
 * Result: "0x1"
 *
 * Implements the `eth_chainId` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_chainId";
/**
 * Result for `eth_chainId`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_chainId JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function ChainIdRequest() {
	return { method };
}
