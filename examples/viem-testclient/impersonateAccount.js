/**
 * Impersonate account - Copyable Implementation
 *
 * @module examples/viem-testclient/impersonateAccount
 */

import { Address } from "@tevm/voltaire";

/**
 * @typedef {import('./TestClientTypes.js').ImpersonateAccountParameters} ImpersonateAccountParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Impersonate an account or contract address.
 * This lets you send transactions from that account even if you don't have access to its private key.
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {ImpersonateAccountParameters} params - Impersonate parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { impersonateAccount } from './impersonateAccount.js';
 *
 * await impersonateAccount(client, {
 *   address: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 * });
 *
 * // Now you can send transactions as this address
 * ```
 */
export async function impersonateAccount(client, { address }) {
	const addr = typeof address === "string" ? address : Address.toHex(address);

	await client.request({
		method: `${client.mode}_impersonateAccount`,
		params: [addr],
	});
}
