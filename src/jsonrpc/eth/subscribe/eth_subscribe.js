/**
 * @fileoverview eth_subscribe JSON-RPC method
 */

/**
 * @typedef {import('../../types/index.js').Quantity} Quantity
 * @typedef {import('../../../provider/types.js').RequestArguments} RequestArguments
 */

/**
 * Starts a subscription to a particular event.
 *
 * @example
 * Params: ["newHeads"]
 * Result: "0x1"
 *
 * Implements the `eth_subscribe` JSON-RPC method.
 */

/** The JSON-RPC method name */
export const method = "eth_subscribe";

/**
 * Result for `eth_subscribe`
 *
 * Subscription ID
 *
 * @typedef {Quantity} Result
 */

/**
 * Creates an eth_subscribe JSON-RPC request
 *
 * @param {string} subscriptionType - Type of subscription (e.g., "newHeads", "logs", "newPendingTransactions", "syncing")
 * @param {any} [params] - Optional subscription parameters
 * @returns {RequestArguments}
 */
export function SubscribeRequest(subscriptionType, params) {
	return {
		method,
		params: params ? [subscriptionType, params] : [subscriptionType],
	};
}
