/**
 * @fileoverview eth_getProof JSON-RPC method
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
 * Returns the merkle proof for a given account and optionally some storage keys.
 *
 * @example
 * Address: "0xe5cB067E90D5Cd1F8052B83562Ae670bA4A211a8"
 * StorageKeys: ...
 * Block: "latest"
 * Result: ...
 *
 * Implements the `eth_getProof` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getProof";
/**
 * Result for `eth_getProof`
 *
 * Account proof
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getProof`
 *
 * @typedef {JsonRpcRequest<'eth_getProof', [Address, `0x${string}`[], BlockSpec]>} Request
 */

/**
 * Creates a eth_getProof JSON-RPC request
 *
 * @param {Address} address
 * @param {`0x${string}`[]} [block]
 * @param {BlockSpec} params
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetProofRequest(address, block = "latest", params, id = null) {
	return /** @type {Request} */ (
		createRequest(method, [address, block, params], id)
	);
}
