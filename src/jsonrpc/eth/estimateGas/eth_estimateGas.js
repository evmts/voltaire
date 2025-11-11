/**
 * @fileoverview eth_estimateGas JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Generates and returns an estimate of how much gas is necessary to allow the transaction to complete.
 *
 * @example
 * Transaction: ...
 * Result: "0x5208"
 *
 * Implements the `eth_estimateGas` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = 'eth_estimateGas'

/**
 * Parameters for `eth_estimateGas`
 *
 * @typedef {Object} Params
 * @property {Quantity} transaction - Transaction object generic to all types
 * @property {Quantity} block - Block number or tag
 */

export {}
/**
 * Result for `eth_estimateGas`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */
