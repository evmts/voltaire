/**
 * @fileoverview txpool_inspect JSON-RPC method
 */

/**
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns a textual summary of the pending and queued transactions in the transaction pool.
 *
 * @example
 * Result: { "pending": {...}, "queued": {...} }
 *
 * Implements the `txpool_inspect` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "txpool_inspect";

/**
 * Result for `txpool_inspect`
 *
 * @typedef {{ pending: any, queued: any }} Result
 */

/**
 * Creates a txpool_inspect JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function InspectRequest() {
	return { method };
}
