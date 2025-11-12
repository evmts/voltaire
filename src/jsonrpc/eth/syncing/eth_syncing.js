/**
 * @fileoverview eth_syncing JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns an object with data about the sync status or false.
 *
 * @example
 * Result: ...
 *
 * Implements the `eth_syncing` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_syncing";
/**
 * Result for `eth_syncing`
 *
 * Syncing status
 *
 * @typedef {Quantity} Result
 */
