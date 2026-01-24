/**
 * Set account nonce - Copyable Implementation
 *
 * @module examples/viem-testclient/setNonce
 */

import { Address, Hex } from "@tevm/voltaire";

/**
 * @typedef {import('./TestClientTypes.js').SetNonceParameters} SetNonceParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Modifies (overrides) the nonce of an account
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {SetNonceParameters} params - Set nonce parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { setNonce } from './setNonce.js';
 *
 * await setNonce(client, {
 *   address: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
 *   nonce: 420,
 * });
 * ```
 */
export async function setNonce(client, { address, nonce }) {
	const addr = typeof address === "string" ? address : Address.toHex(address);
	const nonceHex = Hex.fromNumber(nonce);

	await client.request({
		method: `${client.mode}_setNonce`,
		params: [addr, nonceHex],
	});
}
