/**
 * @fileoverview eth_newPendingTransactionFilter JSON-RPC method
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
 * Creates a filter in the node, allowing for later polling. Registers client interest in new transactions, and returns an identifier.
 *
 * @example
 * Result: "0x01"
 *
 * Implements the `eth_newPendingTransactionFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_newPendingTransactionFilter";
/**
 * Result for `eth_newPendingTransactionFilter`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_newPendingTransactionFilter`
 *
 * @typedef {JsonRpcRequest<'eth_newPendingTransactionFilter', []>} Request
 */

/**
 * Creates a eth_newPendingTransactionFilter JSON-RPC request
 *
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function NewPendingTransactionFilterRequest(id = null) {
	return /** @type {Request} */ (createRequest(method, [], id));
}
