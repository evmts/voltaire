/**
 * Stop impersonating account - Copyable Implementation
 *
 * @module examples/viem-testclient/stopImpersonatingAccount
 */

import { Address } from "@tevm/voltaire";

/**
 * @typedef {import('./TestClientTypes.js').StopImpersonatingAccountParameters} StopImpersonatingAccountParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Stop impersonating an account after having previously used impersonateAccount.
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {StopImpersonatingAccountParameters} params - Stop impersonating parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { stopImpersonatingAccount } from './stopImpersonatingAccount.js';
 *
 * await stopImpersonatingAccount(client, {
 *   address: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
 * });
 * ```
 */
export async function stopImpersonatingAccount(client, { address }) {
	const addr = typeof address === "string" ? address : Address.toHex(address);

	await client.request({
		method: `${client.mode}_stopImpersonatingAccount`,
		params: [addr],
	});
}
