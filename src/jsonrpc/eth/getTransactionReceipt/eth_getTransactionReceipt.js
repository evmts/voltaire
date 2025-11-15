/**
 * @fileoverview eth_getTransactionReceipt JSON-RPC method
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
 * Returns the receipt of a transaction by transaction hash.
 *
 * @example
 * Transaction hash: "0x504ce587a65bdbdb6414a0c6c16d86a04dd79bfcc4f2950eec9634b30ce5370f"
 * Result: ...
 *
 * Implements the `eth_getTransactionReceipt` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getTransactionReceipt";
/**
 * Result for `eth_getTransactionReceipt`
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getTransactionReceipt`
 *
 * @typedef {JsonRpcRequest<'eth_getTransactionReceipt', [Hash]>} Request
 */

/**
 * Creates a eth_getTransactionReceipt JSON-RPC request
 *
 * @param {Hash} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetTransactionReceiptRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
