/**
 * @fileoverview eth_feeHistory JSON-RPC method
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
 * Transaction fee history
 *
 * @example
 * blockCount: "0x5"
 * newestblock: "latest"
 * rewardPercentiles: ...
 * Result: ...
 *
 * Implements the `eth_feeHistory` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_feeHistory";
/**
 * Result for `eth_feeHistory`
 *
 * feeHistoryResults
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates a eth_feeHistory JSON-RPC request
 *
 * @param {Quantity} address
 * @param {BlockSpec} block
 * @param {number[]} params
 * @returns {RequestArguments}
 */
export function FeeHistoryRequest(address, block, params) {
	return { method, params: [address, block, params] };
}
