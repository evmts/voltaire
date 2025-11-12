/**
 * @fileoverview eth_accounts JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Address} Address
 * @typedef {import('../../types/index.js').Hash} Hash
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../types/index.js').BlockTag} BlockTag
 * @typedef {import('../../types/index.js').BlockSpec} BlockSpec
 */

/**
 * Returns a list of addresses owned by client.
 *
 * @example
 * Result: ...
 *
 * Implements the `eth_accounts` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_accounts";
/**
 * Result for `eth_accounts`
 *
 * Accounts
 *
 * @typedef {Quantity} Result
 */
