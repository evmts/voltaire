/**
 * @fileoverview eth_getTransactionCount JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the nonce of an account in the state. NOTE: The name eth_getTransactionCount reflects the historical fact that an account's nonce and sent transaction count were the same. After the Pectra fork, with the inclusion of EIP-7702, this is no longer true.
 *
 * @example
 * Address: "0xc94770007dda54cF92009BFF0dE90c06F603a09f"
 * Block: "latest"
 * Result: "0x1"
 *
 * Implements the `eth_getTransactionCount` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getTransactionCount";
/**
 * Result for `eth_getTransactionCount`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */
