/**
 * @fileoverview eth_accounts JSON-RPC method
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
 * Returns a list of addresses owned by client.
 *
 * @example
 * Result: ...
 *
 * Implements the `eth_accounts` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_accounts";
/**
 * Result for `eth_accounts`
 *
 * Accounts
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_accounts`
 *
 * @typedef {JsonRpcRequest<'eth_accounts', []>} Request
 */

/**
 * Creates a eth_accounts JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function AccountsRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
