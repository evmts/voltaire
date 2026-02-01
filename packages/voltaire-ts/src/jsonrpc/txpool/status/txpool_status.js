/**
 * @fileoverview txpool_status JSON-RPC method
 */

/**
 * @typedef {import('../../index.js').Quantity} Quantity
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the number of pending and queued transactions in the transaction pool.
 *
 * @example
 * Result: { "pending": "0x0", "queued": "0x0" }
 *
 * Implements the `txpool_status` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "txpool_status";

/**
 * Result for `txpool_status`
 *
 * @typedef {{ pending: Quantity, queued: Quantity }} Result
 */

/**
 * Creates a txpool_status JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function StatusRequest() {
	return { method };
}
