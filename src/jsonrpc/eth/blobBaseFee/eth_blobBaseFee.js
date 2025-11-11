/**
 * @fileoverview eth_blobBaseFee JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the base fee per blob gas in wei.
 *
 * @example
 * Result: "0x3f5694c1f"
 *
 * Implements the `eth_blobBaseFee` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_blobBaseFee";

/**
 * Parameters for `eth_blobBaseFee`
 *
 * @typedef {Object} Params
 */

export {};
/**
 * Result for `eth_blobBaseFee`
 *
 * Blob gas base fee
 *
 * @typedef {Quantity} Result
 */
