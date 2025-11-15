/**
 * @fileoverview eth_getBlockByNumber JSON-RPC method
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
 * Returns information about a block by number.
 *
 * @example
 * block: "0x68b3"
 * Hydrated transactions: false
 * Result: ...
 *
 * Implements the `eth_getBlockByNumber` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockByNumber";
/**
 * Result for `eth_getBlockByNumber`
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getBlockByNumber`
 *
 * @typedef {JsonRpcRequest<'eth_getBlockByNumber', [BlockSpec, boolean]>} Request
 */

/**
 * Creates a eth_getBlockByNumber JSON-RPC request
 *
 * @param {BlockSpec} block - Block number, tag, or block hash
 * @param {boolean} [fullTransactions=false] - If true, returns full transaction objects
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetBlockByNumberRequest(
	block,
	fullTransactions = false,
	id = null,
) {
	return /** @type {Request} */ (
		createRequest(method, [block, fullTransactions], id)
	);
}
