/**
 * Revert to snapshot - Copyable Implementation
 *
 * @module examples/viem-testclient/revert
 */

/**
 * @typedef {import('./TestClientTypes.js').RevertParameters} RevertParameters
 */

/**
 * Revert the state of the blockchain to a previous snapshot.
 *
 * @param {Object} client - Test client with request method
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {RevertParameters} params - Revert parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { revert } from './revert.js';
 *
 * const id = await snapshot(client);
 * // Make some changes...
 * await revert(client, { id }); // State restored
 * ```
 */
export async function revert(client, { id }) {
	await client.request({
		method: "evm_revert",
		params: [id],
	});
}
