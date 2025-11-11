/**
 * @fileoverview eth_sendTransaction JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Signs and submits a transaction.
 *
 * @example
 * Transaction: ...
 * Result: "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331"
 *
 * Implements the `eth_sendTransaction` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = 'eth_sendTransaction'

/**
 * Parameters for `eth_sendTransaction`
 *
 * @typedef {Object} Params
 * @property {Quantity} transaction - Transaction object generic to all types
 */

export {}
/**
 * Result for `eth_sendTransaction`
 *
 * 32 byte hex value
 *
 * @typedef {Hash} Result
 */
