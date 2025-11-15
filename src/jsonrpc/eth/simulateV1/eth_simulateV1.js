/**
 * @fileoverview eth_simulateV1 JSON-RPC method
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
 * Executes a sequence of message calls building on each other's state without creating transactions on the block chain, optionally overriding block and state data
 *
 * Implements the `eth_simulateV1` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_simulateV1";
/**
 * Result for `eth_simulateV1`
 *
 * Full results of eth_simulate
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_simulateV1`
 *
 * @typedef {JsonRpcRequest<'eth_simulateV1', [any]>} Request
 */

/**
 * Creates a eth_simulateV1 JSON-RPC request
 *
 * @param {any} address
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function SimulateV1Request(address, id = null) {
	return /** @type {Request} */ (createRequest(method, [address], id));
}
