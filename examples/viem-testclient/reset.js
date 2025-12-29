/**
 * Reset fork - Copyable Implementation
 *
 * @module examples/viem-testclient/reset
 */

/**
 * @typedef {import('./TestClientTypes.js').ResetParameters} ResetParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Resets fork back to its original state.
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {ResetParameters} [params] - Reset parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { reset } from './reset.js';
 *
 * // Reset to original fork state
 * await reset(client);
 *
 * // Reset to specific block
 * await reset(client, { blockNumber: 69420n });
 *
 * // Reset with new fork URL and block
 * await reset(client, {
 *   jsonRpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/...',
 *   blockNumber: 18000000n,
 * });
 * ```
 */
export async function reset(client, { blockNumber, jsonRpcUrl } = {}) {
	await client.request({
		method: `${client.mode}_reset`,
		params: [
			{
				forking: {
					blockNumber: blockNumber !== undefined ? Number(blockNumber) : undefined,
					jsonRpcUrl,
				},
			},
		],
	});
}
