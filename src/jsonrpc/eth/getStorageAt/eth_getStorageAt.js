/**
 * @fileoverview eth_getStorageAt JSON-RPC method
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
 * Returns the value from a storage position at a given address.
 *
 * @example
 * Address: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
 * Storage slot: "0x0"
 * Block: "latest"
 * Result: "0x0000000000000000000000000000000000000000000000000000000000000000"
 *
 * Implements the `eth_getStorageAt` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getStorageAt";
/**
 * Result for `eth_getStorageAt`
 *
 * hex encoded bytes
 *
 * @typedef {Quantity} Result
 */

/**
 * Request for `eth_getStorageAt`
 *
 * @typedef {JsonRpcRequest<'eth_getStorageAt', [Address, Quantity, BlockSpec]>} Request
 */

/**
 * Creates a eth_getStorageAt JSON-RPC request
 *
 * @param {Address} address
 * @param {Quantity} [block]
 * @param {BlockSpec} params
 * @param {number | string | null} [id] - Optional request ID
 * @returns {Request}
 */
export function GetStorageAtRequest(
	address,
	block = "latest",
	params,
	id = null,
) {
	return /** @type {Request} */ (
		createRequest(method, [address, block, params], id)
	);
}
