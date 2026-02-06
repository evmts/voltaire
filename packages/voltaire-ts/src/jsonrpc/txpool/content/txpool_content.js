/**
 * @fileoverview txpool_content JSON-RPC method
 */

/**
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Returns the pending and queued transactions in the transaction pool.
 *
 * @example
 * Result: { "pending": {...}, "queued": {...} }
 *
 * Implements the `txpool_content` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "txpool_content";

/**
 * Result for `txpool_content`
 *
 * @typedef {{ pending: any, queued: any }} Result
 */

/**
 * Creates a txpool_content JSON-RPC request
 *
 * @returns {RequestArguments}
 */
export function ContentRequest() {
	return { method };
}
