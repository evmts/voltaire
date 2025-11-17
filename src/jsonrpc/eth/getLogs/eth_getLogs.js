/**
 * @fileoverview eth_getLogs JSON-RPC method
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
 * Returns an array of all logs matching the specified filter.
 *
 * @example
 * Filter: ...
 * Result: ...
 *
 * Implements the `eth_getLogs` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getLogs";
/**
 * Result for `eth_getLogs`
 *
 * Filter results
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getLogs`
 *
 * @typedef {JsonRpcRequest<'eth_getLogs', [any]>} Request
 */

/**
 * Creates a eth_getLogs JSON-RPC request
 *
 * @param {any} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetLogsRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
