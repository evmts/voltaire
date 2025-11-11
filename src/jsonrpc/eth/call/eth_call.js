/**
 * @fileoverview eth_call JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Executes a new message call immediately without creating a transaction on the block chain.
 *
 * @example
 * Transaction: ...
 * Block: "latest"
 * Result: "0x"
 *
 * Implements the `eth_call` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = 'eth_call'

/**
 * Parameters for `eth_call`
 *
 * @typedef {Object} Params
 * @property {Quantity} transaction - Transaction object generic to all types
 * @property {BlockSpec} block - Block number, tag, or block hash
 */

export {}
/**
 * Result for `eth_call`
 *
 * hex encoded bytes
 *
 * @typedef {Quantity} Result
 */
