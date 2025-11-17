/**
 * @fileoverview eth_feeHistory JSON-RPC method
 */

import { createRequest } from "../../types/JsonRpcRequest.js";

/**
 * @typedef {import('../../types/index.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../types/JsonRpcRequest.js').JsonRpcRequest} JsonRpcRequest
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
 * Request for `eth_feeHistory`
 *
 * @typedef {JsonRpcRequest<'eth_feeHistory', [Quantity, BlockSpec, number[]]>} Request
 */

/**
 * Creates a eth_feeHistory JSON-RPC request
 *
 * @param {Quantity} address
 * @param {BlockSpec} block
 * @param {number[]} params
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function FeeHistoryRequest(address, block, params, id = null) {
	return /** @type {Request} */ (
		createRequest(method, [address, block, params], id)
	);
}
