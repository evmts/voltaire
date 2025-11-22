/**
 * @fileoverview eth_unsubscribe JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Cancels an existing subscription.
 *
 * @example
 * Params: ["0x1"]
 * Result: true
 *
 * Implements the `eth_unsubscribe` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_unsubscribe";

/**
 * Result for `eth_unsubscribe`
 *
 * @typedef {boolean} Result
 */

/**
 * Creates an eth_unsubscribe JSON-RPC request
 *
 * @param {Quantity} subscriptionId - Subscription ID to cancel
 * @returns {RequestArguments}
 */
export function UnsubscribeRequest(subscriptionId) {
	return {
		method,
		params: [subscriptionId],
	};
}
