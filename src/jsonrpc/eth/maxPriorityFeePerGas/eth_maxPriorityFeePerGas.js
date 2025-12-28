/**
 * @fileoverview eth_maxPriorityFeePerGas JSON-RPC method
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
 * Returns the current maxPriorityFeePerGas per gas in wei.
 *
 * @example
 * Result: "0x773c23ba"
 *
 * Implements the `eth_maxPriorityFeePerGas` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_maxPriorityFeePerGas";
/**
 * Result for `eth_maxPriorityFeePerGas`
 *
 * Max priority fee per gas
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_maxPriorityFeePerGas JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function MaxPriorityFeePerGasRequest() {
	return { method };
}
