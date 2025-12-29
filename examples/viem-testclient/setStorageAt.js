/**
 * Set storage slot - Copyable Implementation
 *
 * @module examples/viem-testclient/setStorageAt
 */

import { Address } from "../../src/primitives/Address/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";

/**
 * @typedef {import('./TestClientTypes.js').SetStorageAtParameters} SetStorageAtParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Writes to a slot of an account's storage
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {SetStorageAtParameters} params - Set storage parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { setStorageAt } from './setStorageAt.js';
 *
 * await setStorageAt(client, {
 *   address: '0xe846c6fcf817734ca4527b28ccb4aea2b6663c79',
 *   index: 2,
 *   value: '0x0000000000000000000000000000000000000000000000000000000000000069',
 * });
 * ```
 */
export async function setStorageAt(client, { address, index, value }) {
	const addr = typeof address === "string" ? address : Address.toHex(address);
	const indexHex =
		typeof index === "number" ? Hex.fromNumber(index) : String(index);
	const valueHex = typeof value === "string" ? value : Hex.fromBytes(value);

	await client.request({
		method: `${client.mode}_setStorageAt`,
		params: [addr, indexHex, valueHex],
	});
}
