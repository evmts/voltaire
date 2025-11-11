/**
 * @fileoverview eth_getTransactionByHash JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the information about a transaction requested by transaction hash.
 *
 * @example
 * Transaction hash: "0xa52be92809541220ee0aaaede6047d9a6c5d0cd96a517c854d944ee70a0ebb44"
 * Result: ...
 *
 * Implements the `eth_getTransactionByHash` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = 'eth_getTransactionByHash'

/**
 * Parameters for `eth_getTransactionByHash`
 *
 * @typedef {Object} Params
 * @property {Hash} transaction hash - 32 byte hex value
 */

export {}
/**
 * Result for `eth_getTransactionByHash`
 *
 * @typedef {Quantity} Result
 */
