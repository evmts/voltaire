/**
 * @fileoverview eth_getTransactionByBlockNumberAndIndex JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns information about a transaction by block number and transaction index position.
 *
 * @example
 * Block: "0x1442e"
 * Transaction index: "0x2"
 * Result: ...
 *
 * Implements the `eth_getTransactionByBlockNumberAndIndex` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = 'eth_getTransactionByBlockNumberAndIndex'

/**
 * Parameters for `eth_getTransactionByBlockNumberAndIndex`
 *
 * @typedef {Object} Params
 * @property {Quantity} block - Block number or tag
 * @property {Quantity} transaction index - hex encoded unsigned integer
 */

export {}
/**
 * Result for `eth_getTransactionByBlockNumberAndIndex`
 *
 * @typedef {Quantity} Result
 */
