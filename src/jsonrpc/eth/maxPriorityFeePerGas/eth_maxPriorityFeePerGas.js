/**
 * @fileoverview eth_maxPriorityFeePerGas JSON-RPC method
 */

import { createRequest } from "../../types/JsonRpcRequest.js";

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../types/JsonRpcRequest.js').JsonRpcRequest} JsonRpcRequest
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
 * Request for `eth_maxPriorityFeePerGas`
 *
 * @typedef {JsonRpcRequest<'eth_maxPriorityFeePerGas', []>} Request
 */

/**
 * Creates a eth_maxPriorityFeePerGas JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function MaxPriorityFeePerGasRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
