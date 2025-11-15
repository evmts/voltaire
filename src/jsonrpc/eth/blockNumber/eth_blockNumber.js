/**
 * @fileoverview eth_blockNumber JSON-RPC method
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
 * Request for `eth_blockNumber`
 *
 * @typedef {JsonRpcRequest<'eth_blockNumber', []>} Request
 */

/**
 * Creates a eth_blockNumber JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function BlockNumberRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
