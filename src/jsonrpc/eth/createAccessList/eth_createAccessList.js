/**
 * @fileoverview eth_createAccessList JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Generates an access list for a transaction.
 *
 * @example
 * Transaction: ...
 * Block: "latest"
 * Result: ...
 *
 * Implements the `eth_createAccessList` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_createAccessList";
/**
 * Result for `eth_createAccessList`
 *
 * Access list result
 *
 * @typedef {Quantity} Result
 */
