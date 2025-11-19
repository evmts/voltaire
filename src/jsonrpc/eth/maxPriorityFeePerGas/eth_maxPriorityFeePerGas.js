/**
 * @fileoverview eth_maxPriorityFeePerGas JSON-RPC method
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
