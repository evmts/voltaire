/**
 * @fileoverview eth_getFilterChanges JSON-RPC method
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
 * Polling method for the filter with the given ID (created using `eth_newFilter`). Returns an array of logs, block hashes, or transaction hashes since last poll, depending on the installed filter.
 *
 * @example
 * Filter identifier: "0x01"
 * Result: ...
 *
 * Implements the `eth_getFilterChanges` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getFilterChanges";
/**
 * Result for `eth_getFilterChanges`
 *
 * Filter results
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getFilterChanges`
 *
 * @typedef {JsonRpcRequest<'eth_getFilterChanges', [Quantity]>} Request
 */

/**
 * Creates a eth_getFilterChanges JSON-RPC request
 *
 * @param {Quantity} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetFilterChangesRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
