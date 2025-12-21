/**
 * @fileoverview eth_estimateGas JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 * @typedef {import('../call/eth_call.js').CallParams} CallParams
 */

/**
 * Generates and returns an estimate of how much gas is necessary to allow the transaction to complete.
 *
 * @example
 * Transaction: ...
 * Result: "0x5208"
 *
 * Implements the `eth_estimateGas` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_estimateGas";
/**
 * Result for `eth_estimateGas`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_estimateGas JSON-RPC request
 *
 * @param {CallParams} address
 * @returns {RequestArguments}
 */
export function EstimateGasRequest(address) {
	return { method, params: [address] };
}
