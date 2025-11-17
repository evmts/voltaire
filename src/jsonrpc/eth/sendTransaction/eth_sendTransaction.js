/**
 * @fileoverview eth_sendTransaction JSON-RPC method
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
 * Signs and submits a transaction.
 *
 * @example
 * Transaction: ...
 * Result: "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331"
 *
 * Implements the `eth_sendTransaction` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_sendTransaction";
/**
 * Result for `eth_sendTransaction`
 *
 * 32 byte hex value
 *
 * @typedef {Hash} Result
 */

/**
 * Request for `eth_sendTransaction`
 *
 * @typedef {JsonRpcRequest<'eth_sendTransaction', [any]>} Request
 */

/**
 * Creates a eth_sendTransaction JSON-RPC request
 *
 * @param {any} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function SendTransactionRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
