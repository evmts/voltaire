/**
 * @fileoverview eth_simulateV1 JSON-RPC method
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
 * Executes a sequence of message calls building on each other's state without creating transactions on the block chain, optionally overriding block and state data
 *
 * Implements the `eth_simulateV1` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_simulateV1";
/**
 * Result for `eth_simulateV1`
 *
 * Full results of eth_simulate
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_simulateV1 JSON-RPC request
 *
 * @param {any} address
 * @returns {RequestArguments}
 */
export function SimulateV1Request(address) {
	return { method, params: [address] };
}
