/**
 * Mine blocks - Copyable Implementation
 *
 * @module examples/viem-testclient/mine
 */

import { Hex } from "@tevm/voltaire";

/**
 * @typedef {import('./TestClientTypes.js').MineParameters} MineParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Mine a specified number of blocks
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {MineParameters} params - Mine parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { mine } from './mine.js';
 *
 * await mine(client, { blocks: 1 });
 * await mine(client, { blocks: 10, interval: 12 });
 * ```
 */
export async function mine(client, { blocks, interval }) {
	const blocksHex = Hex.fromNumber(blocks);
	const intervalHex = Hex.fromNumber(interval ?? 0);

	if (client.mode === "ganache") {
		await client.request({
			method: "evm_mine",
			params: [{ blocks: blocksHex }],
		});
	} else {
		await client.request({
			method: `${client.mode}_mine`,
			params: [blocksHex, intervalHex],
		});
	}
}
