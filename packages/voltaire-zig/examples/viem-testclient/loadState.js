/**
 * Load state - Copyable Implementation
 *
 * @module examples/viem-testclient/loadState
 */

/**
 * @typedef {import('./TestClientTypes.js').LoadStateParameters} LoadStateParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Adds state previously dumped with dumpState to the current chain.
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {LoadStateParameters} params - Load state parameters
 * @returns {Promise<void>}
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
export async function loadState(client, { state }) {
	await client.request({
		method: `${client.mode}_loadState`,
		params: [state],
	});
}
