/**
 * @fileoverview eth_coinbase JSON-RPC method
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
 * Returns the client coinbase address.
 *
 * @example
 * Result: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
 *
 * Implements the `eth_coinbase` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_coinbase";
/**
 * Result for `eth_coinbase`
 *
 * hex encoded address
 *
 * @typedef {Address} Result
 */

/**
 * Request for `eth_coinbase`
 *
 * @typedef {JsonRpcRequest<'eth_coinbase', []>} Request
 */

/**
 * Creates a eth_coinbase JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function CoinbaseRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
