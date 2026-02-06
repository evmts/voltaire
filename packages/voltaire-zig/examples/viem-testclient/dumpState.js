/**
 * Dump state - Copyable Implementation
 *
 * @module examples/viem-testclient/dumpState
 */

/**
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Serializes the current state (including contracts code, contract's storage,
 * accounts properties, etc.) into a savable data blob.
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @returns {Promise<`0x${string}`>} Serialized state
 *
 * @example
 * ```typescript
 * import { dumpState, loadState } from './index.js';
 *
 * // Save state
 * const state = await dumpState(client);
 *
 * // Make changes...
 *
 * // Restore state
 * await loadState(client, { state });
 * ```
 */
export async function dumpState(client) {
	const state = /** @type {`0x${string}`} */ (
		await client.request({
			method: `${client.mode}_dumpState`,
		})
	);
	return state;
}
