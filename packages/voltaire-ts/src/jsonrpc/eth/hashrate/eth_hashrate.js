/**
 * @fileoverview eth_hashrate JSON-RPC method
 */

/**
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the number of hashes per second that the node is mining with.
 *
 * @example
 * Result: "0x38a"
 *
 * Implements the `eth_hashrate` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_hashrate";

/**
 * Result for `eth_hashrate`
 *
 * Hexadecimal of hashes per second
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates an eth_hashrate JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function HashrateRequest() {
	return { method };
}
