/**
 * @fileoverview eth_getBlockTransactionCountByHash JSON-RPC method
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
 * Returns the number of transactions in a block from a block matching the given block hash.
 *
 * @example
 * Block hash: "0xb903239f8543d04b5dc1ba6579132b143087c68db1b2168786408fcbce568238"
 * Result: "0x8"
 *
 * Implements the `eth_getBlockTransactionCountByHash` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockTransactionCountByHash";
/**
 * Result for `eth_getBlockTransactionCountByHash`
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getBlockTransactionCountByHash`
 *
 * @typedef {JsonRpcRequest<'eth_getBlockTransactionCountByHash', [Hash]>} Request
 */

/**
 * Creates a eth_getBlockTransactionCountByHash JSON-RPC request
 *
 * @param {Hash} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetBlockTransactionCountByHashRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
