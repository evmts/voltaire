/**
 * @fileoverview eth_getBalance JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns the balance of the account of given address.
 *
 * @example
 * Address: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
 * Block: "latest"
 * Result: "0x1cfe56f3795885980000"
 *
 * Implements the `eth_getBalance` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_getBalance";
/**
 * Result for `eth_getBalance`
 *
 * hex encoded unsigned integer
 *
 * @typedef {Quantity} Result
 */
