/**
 * @fileoverview eth_uninstallFilter JSON-RPC method
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
 * Uninstalls a filter with given id.
 *
 * @example
 * Filter identifier: "0x01"
 * Result: true
 *
 * Implements the `eth_uninstallFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_uninstallFilter";
/**
 * Result for `eth_uninstallFilter`
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_uninstallFilter`
 *
 * @typedef {JsonRpcRequest<'eth_uninstallFilter', [Quantity]>} Request
 */

/**
 * Creates a eth_uninstallFilter JSON-RPC request
 *
 * @param {Quantity} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function UninstallFilterRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
