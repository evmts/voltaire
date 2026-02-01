/**
 * Create EVM snapshot - Copyable Implementation
 *
 * @module examples/viem-testclient/snapshot
 */

/**
 * Snapshot the state of the blockchain at the current block.
 * Returns a snapshot ID that can be used with revert().
 *
 * @param {Object} client - Test client with request method
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @returns {Promise<`0x${string}`>} Snapshot ID
 *
 * @example
 * ```typescript
 * import { snapshot } from './snapshot.js';
 *
 * const id = await snapshot(client);
 * // Make some changes...
 * // Then revert: await revert(client, { id });
 * ```
 */
export async function snapshot(client) {
	const id = /** @type {`0x${string}`} */ (
		await client.request({
			method: "evm_snapshot",
		})
	);
	return id;
}
