/**
 * @fileoverview eth_getTransactionByBlockNumberAndIndex JSON-RPC method
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
 * Returns information about a transaction by block number and transaction index position.
 *
 * @example
 * Block: "0x1442e"
 * Transaction index: "0x2"
 * Result: ...
 *
 * Implements the `eth_getTransactionByBlockNumberAndIndex` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getTransactionByBlockNumberAndIndex";
/**
 * Result for `eth_getTransactionByBlockNumberAndIndex`
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getTransactionByBlockNumberAndIndex`
 *
 * @typedef {JsonRpcRequest<'eth_getTransactionByBlockNumberAndIndex', [BlockSpec, Quantity]>} Request
 */

/**
 * Creates a eth_getTransactionByBlockNumberAndIndex JSON-RPC request
 *
 * @param {BlockSpec} address
 * @param {Quantity} block
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetTransactionByBlockNumberAndIndexRequest(
	address,
	block,
	id = null,
) {
	return /** @type {Request} */ (createRequest(method, [address, block], id));
}
