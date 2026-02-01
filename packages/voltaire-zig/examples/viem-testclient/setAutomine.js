/**
 * Set automine - Copyable Implementation
 *
 * @module examples/viem-testclient/setAutomine
 */

/**
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Enables or disables the automatic mining of new blocks with each new transaction
 * submitted to the network.
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {boolean} enabled - Whether to enable automine
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { setAutomine, mine } from './index.js';
 *
 * // Disable automine for batch operations
 * await setAutomine(client, false);
 *
 * // Send multiple transactions...
 *
 * // Mine them all at once
 * await mine(client, { blocks: 1 });
 *
 * // Re-enable automine
 * await setAutomine(client, true);
 * ```
 */
export async function setAutomine(client, enabled) {
	if (client.mode === "ganache") {
		if (enabled) {
			await client.request({ method: "miner_start" });
		} else {
			await client.request({ method: "miner_stop" });
		}
	} else {
		await client.request({
			method: "evm_setAutomine",
			params: [enabled],
		});
	}
}
