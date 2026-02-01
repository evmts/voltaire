/**
 * Increase time - Copyable Implementation
 *
 * @module examples/viem-testclient/increaseTime
 */

import { Hex } from "@tevm/voltaire";

/**
 * @typedef {import('./TestClientTypes.js').IncreaseTimeParameters} IncreaseTimeParameters
 */

/**
 * Jump forward in time by the given amount of time, in seconds.
 *
 * @param {Object} client - Test client with request method
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {IncreaseTimeParameters} params - Increase time parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { increaseTime } from './increaseTime.js';
 *
 * // Advance 1 hour
 * await increaseTime(client, { seconds: 3600 });
 *
 * // Advance 1 day
 * await increaseTime(client, { seconds: 86400 });
 * ```
 */
export async function increaseTime(client, { seconds }) {
	const secondsHex = Hex.fromNumber(seconds);

	await client.request({
		method: "evm_increaseTime",
		params: [secondsHex],
	});
}
