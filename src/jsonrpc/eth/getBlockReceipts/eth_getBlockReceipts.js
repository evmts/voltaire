/**
 * @fileoverview eth_getBlockReceipts JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the receipts of a block by number or hash.
 *
 * @example
 * Block: "latest"
 * Result: ...
 *
 * Implements the `eth_getBlockReceipts` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBlockReceipts";
/**
 * Result for `eth_getBlockReceipts`
 *
 * @typedef {Quantity} Result
 */
