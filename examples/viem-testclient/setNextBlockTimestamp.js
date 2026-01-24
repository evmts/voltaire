/**
 * Set next block timestamp - Copyable Implementation
 *
 * @module examples/viem-testclient/setNextBlockTimestamp
 */

import { Hex } from "@tevm/voltaire";

/**
 * @typedef {import('./TestClientTypes.js').SetNextBlockTimestampParameters} SetNextBlockTimestampParameters
 */

/**
 * Sets the next block's timestamp.
 *
 * @param {Object} client - Test client with request method
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {SetNextBlockTimestampParameters} params - Set timestamp parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { setNextBlockTimestamp } from './setNextBlockTimestamp.js';
 *
 * // Set next block to a specific timestamp
 * await setNextBlockTimestamp(client, { timestamp: 1671744314n });
 *
 * // Mine a block to apply the timestamp
 * await mine(client, { blocks: 1 });
 * ```
 */
export async function setNextBlockTimestamp(client, { timestamp }) {
	const timestampHex = Hex.fromBigInt(timestamp);

	await client.request({
		method: "evm_setNextBlockTimestamp",
		params: [timestampHex],
	});
}
