/**
 * @fileoverview eth_getTransactionByBlockHashAndIndex JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns information about a transaction by block hash and transaction index position.
 *
 * @example
 * Block hash: "0xbf137c3a7a1ebdfac21252765e5d7f40d115c2757e4a4abee929be88c624fdb7"
 * Transaction index: "0x2"
 * Result: ...
 *
 * Implements the `eth_getTransactionByBlockHashAndIndex` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getTransactionByBlockHashAndIndex";
/**
 * Result for `eth_getTransactionByBlockHashAndIndex`
 *
 * @typedef {Quantity} Result
 */
