/**
 * Send Raw Transaction
 *
 * Sends a signed transaction to the network.
 *
 * @module sendRawTransaction
 */

/**
 * Send a signed transaction to the network
 *
 * @param {import('./WalletClientTypes.js').Client} client
 * @param {Object} params
 * @param {string} params.serializedTransaction - Signed transaction hex string
 * @returns {Promise<string>} Transaction hash
 *
 * @example
 * ```javascript
 * import { createWalletClient, http } from './index.js';
 *
 * const client = createWalletClient({
 *   transport: http('https://mainnet.infura.io/v3/...'),
 * });
 *
 * const hash = await client.sendRawTransaction({
 *   serializedTransaction: '0x02f850018203118080825208...',
 * });
 * ```
 */
export async function sendRawTransaction(client, { serializedTransaction }) {
	return client.request(
		{
			method: "eth_sendRawTransaction",
			params: [serializedTransaction],
		},
		{ retryCount: 0 },
	);
}

/**
 * Factory: Create sendRawTransaction (no dependencies needed)
 *
 * @returns {Function}
 */
export function SendRawTransaction() {
	return async function sendRawTransaction(client, { serializedTransaction }) {
		return client.request(
			{
				method: "eth_sendRawTransaction",
				params: [serializedTransaction],
			},
			{ retryCount: 0 },
		);
	};
}

export default sendRawTransaction;
