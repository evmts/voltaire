/**
 * @fileoverview eth_newFilter JSON-RPC method
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
 * Install a log filter in the server, allowing for later polling. Registers client interest in logs matching the filter, and returns an identifier.
 *
 * @example
 * Filter: ...
 * Result: "0x01"
 *
 * Implements the `eth_newFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_newFilter";
/**
 * Result for `eth_newFilter`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_newFilter`
 *
 * @typedef {JsonRpcRequest<'eth_newFilter', [any]>} Request
 */

/**
 * Creates a eth_newFilter JSON-RPC request
 *
 * @param {any} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function NewFilterRequest(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
