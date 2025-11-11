/**
 * @fileoverview eth_getBlockTransactionCountByNumber JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the number of transactions in a block matching the given block number.
 *
 * @example
 * Block: "0xe8"
 * Result: "0x8"
 *
 * Implements the `eth_getBlockTransactionCountByNumber` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockTransactionCountByNumber";

/**
 * Parameters for `eth_getBlockTransactionCountByNumber`
 *
 * @typedef {Object} Params
 * @property {Quantity} block - Block number or tag
 */

export {};
/**
 * Result for `eth_getBlockTransactionCountByNumber`
 *
 * @typedef {Quantity} Result
 */
