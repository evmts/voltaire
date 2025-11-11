/**
 * @fileoverview eth_newBlockFilter JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Creates a filter in the node, allowing for later polling. Registers client interest in new blocks, and returns an identifier.
 *
 * @example
 * Result: "0x01"
 *
 * Implements the `eth_newBlockFilter` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_newBlockFilter";

/**
 * Parameters for `eth_newBlockFilter`
 *
 * @typedef {Object} Params
 */

export {};
/**
 * Result for `eth_newBlockFilter`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */
