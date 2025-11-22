/**
 * @fileoverview eth_getStorageAt JSON-RPC method
 */

/**
 * @typedef {import('../../../primitives/Address/AddressType.js').AddressType} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
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
 * Creates a eth_getStorageAt JSON-RPC request
 *
 * @param {Address} address
 * @param {Quantity} [block]
 * @param {BlockSpec} params
 * @returns {RequestArguments}
 */
export function GetStorageAtRequest(address, block, params) {
	return { method, params: [address, block, params] };
}
