/**
 * Set account balance - Copyable Implementation
 *
 * @module examples/viem-testclient/setBalance
 */

import { Address, Hex } from "@tevm/voltaire";

/**
 * @typedef {import('./TestClientTypes.js').SetBalanceParameters} SetBalanceParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Modifies the balance of an account
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {SetBalanceParameters} params - Set balance parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { setBalance } from './setBalance.js';
 *
 * await setBalance(client, {
 *   address: '0xa5cc3c03994DB5b0d9A5eEdD10CabaB0813678AC',
 *   value: 1000000000000000000n, // 1 ETH
 * });
 * ```
 */
export async function setBalance(client, { address, value }) {
	const addr = typeof address === "string" ? address : Address.toHex(address);
	const valueHex = Hex.fromBigInt(value);

	if (client.mode === "ganache") {
		await client.request({
			method: "evm_setAccountBalance",
			params: [addr, valueHex],
		});
	} else {
		await client.request({
			method: `${client.mode}_setBalance`,
			params: [addr, valueHex],
		});
	}
}
