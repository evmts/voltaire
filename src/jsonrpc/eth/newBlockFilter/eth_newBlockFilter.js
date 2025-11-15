/**
 * @fileoverview eth_newBlockFilter JSON-RPC method
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
 * Creates a filter in the node, allowing for later polling. Registers client interest in new blocks, and returns an identifier.
 *
 * @example
 * Result: "0x01"
 *
 * Implements the `eth_newBlockFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_newBlockFilter";
/**
 * Result for `eth_newBlockFilter`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_newBlockFilter`
 *
 * @typedef {JsonRpcRequest<'eth_newBlockFilter', []>} Request
 */

/**
 * Creates a eth_newBlockFilter JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function NewBlockFilterRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
