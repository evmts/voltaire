/**
 * @fileoverview eth_getStorageAt JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
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
 * Parameters for `eth_getStorageAt`
 *
 * @typedef {Object} Params
 * @property {Address} address - hex encoded address
 * @property {Quantity} storage slot - 32 hex encoded bytes
 * @property {BlockSpec} block - Block number, tag, or block hash
 */

export {};
/**
 * Result for `eth_getStorageAt`
 *
 * hex encoded bytes
 *
 * @typedef {Quantity} Result
 */
