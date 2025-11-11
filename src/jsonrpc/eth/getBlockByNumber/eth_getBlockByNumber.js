/**
 * @fileoverview eth_getBlockByNumber JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns information about a block by number.
 *
 * @example
 * block: "0x68b3"
 * Hydrated transactions: false
 * Result: ...
 *
 * Implements the `eth_getBlockByNumber` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockByNumber";

/**
 * Parameters for `eth_getBlockByNumber`
 *
 * @typedef {Object} Params
 * @property {Quantity} block - Block number or tag
 * @property {Quantity} hydrated transactions - hydrated
 */

export {};
/**
 * Result for `eth_getBlockByNumber`
 *
 * @typedef {Quantity} Result
 */
