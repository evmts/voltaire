/**
 * @fileoverview eth_mining JSON-RPC method
 */

/**
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns true if client is actively mining new blocks.
 *
 * @example
 * Result: true
 *
 * Implements the `eth_mining` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_mining";

/**
 * Result for `eth_mining`
 *
 * @typedef {boolean} Result
 */

/**
 * Creates an eth_mining JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function MiningRequest() {
	return { method };
}
