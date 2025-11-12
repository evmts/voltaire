/**
 * @fileoverview eth_chainId JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the chain ID of the current network.
 *
 * @example
 * Result: "0x1"
 *
 * Implements the `eth_chainId` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_chainId";
/**
 * Result for `eth_chainId`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */
