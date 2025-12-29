/**
 * Drop transaction - Copyable Implementation
 *
 * @module examples/viem-testclient/dropTransaction
 */

/**
 * @typedef {import('./TestClientTypes.js').DropTransactionParameters} DropTransactionParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Removes a transaction from the mempool.
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {DropTransactionParameters} params - Drop transaction parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { dropTransaction } from './dropTransaction.js';
 *
 * await dropTransaction(client, {
 *   hash: '0xe58dceb6b20b03965bb678e27d141e151d7d4efc2334c2d6a49b9fac523f7364',
 * });
 * ```
 */
export async function dropTransaction(client, { hash }) {
	await client.request({
		method: `${client.mode}_dropTransaction`,
		params: [hash],
	});
}
