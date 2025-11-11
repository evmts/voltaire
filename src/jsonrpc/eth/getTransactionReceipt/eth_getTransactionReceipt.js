/**
 * @fileoverview eth_getTransactionReceipt JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the receipt of a transaction by transaction hash.
 *
 * @example
 * Transaction hash: "0x504ce587a65bdbdb6414a0c6c16d86a04dd79bfcc4f2950eec9634b30ce5370f"
 * Result: ...
 *
 * Implements the `eth_getTransactionReceipt` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getTransactionReceipt";

/**
 * Parameters for `eth_getTransactionReceipt`
 *
 * @typedef {Object} Params
 * @property {Hash} transaction hash - 32 byte hex value
 */

export {};
/**
 * Result for `eth_getTransactionReceipt`
 *
 * @typedef {Quantity} Result
 */
