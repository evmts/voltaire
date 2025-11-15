/**
 * @fileoverview eth_getFilterLogs JSON-RPC method
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
 * Returns an array of all logs matching the filter with the given ID (created using `eth_newFilter`).
 *
 * @example
 * Filter identifier: "0x01"
 * Result: ...
 *
 * Implements the `eth_getFilterLogs` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getFilterLogs";
/**
 * Result for `eth_getFilterLogs`
 *
 * Filter results
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getFilterLogs`
 *
 * @typedef {JsonRpcRequest<'eth_getFilterLogs', [Quantity]>} Request
 */

/**
 * Creates a eth_getFilterLogs JSON-RPC request
 *
 * @param {Quantity} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetFilterLogsRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
