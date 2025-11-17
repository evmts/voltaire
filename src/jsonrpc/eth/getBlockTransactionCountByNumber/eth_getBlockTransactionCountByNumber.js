/**
 * @fileoverview eth_getBlockTransactionCountByNumber JSON-RPC method
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
 * Returns the number of transactions in a block matching the given block number.
 *
 * @example
 * Block: "0xe8"
 * Result: "0x8"
 *
 * Implements the `eth_getBlockTransactionCountByNumber` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockTransactionCountByNumber";
/**
 * Result for `eth_getBlockTransactionCountByNumber`
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getBlockTransactionCountByNumber`
 *
 * @typedef {JsonRpcRequest<'eth_getBlockTransactionCountByNumber', [BlockSpec]>} Request
 */

/**
 * Creates a eth_getBlockTransactionCountByNumber JSON-RPC request
 *
 * @param {BlockSpec} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetBlockTransactionCountByNumberRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
