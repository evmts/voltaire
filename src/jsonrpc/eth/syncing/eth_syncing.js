/**
 * @fileoverview eth_syncing JSON-RPC method
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
 * Returns an object with data about the sync status or false.
 *
 * @example
 * Result: ...
 *
 * Implements the `eth_syncing` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_syncing";
/**
 * Result for `eth_syncing`
 *
 * Syncing status
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_syncing`
 *
 * @typedef {JsonRpcRequest<'eth_syncing', []>} Request
 */

/**
 * Creates a eth_syncing JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function SyncingRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
