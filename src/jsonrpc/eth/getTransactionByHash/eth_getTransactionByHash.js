/**
 * @fileoverview eth_getTransactionByHash JSON-RPC method
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
 * Returns the information about a transaction requested by transaction hash.
 *
 * @example
 * Transaction hash: "0xa52be92809541220ee0aaaede6047d9a6c5d0cd96a517c854d944ee70a0ebb44"
 * Result: ...
 *
 * Implements the `eth_getTransactionByHash` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getTransactionByHash";
/**
 * Result for `eth_getTransactionByHash`
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getTransactionByHash`
 *
 * @typedef {JsonRpcRequest<'eth_getTransactionByHash', [Hash]>} Request
 */

/**
 * Creates a eth_getTransactionByHash JSON-RPC request
 *
 * @param {Hash} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetTransactionByHashRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
