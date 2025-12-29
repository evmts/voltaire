/**
 * Set contract code - Copyable Implementation
 *
 * @module examples/viem-testclient/setCode
 */

import { Address } from "../../src/primitives/Address/index.js";
import * as Hex from "../../src/primitives/Hex/index.js";

/**
 * @typedef {import('./TestClientTypes.js').SetCodeParameters} SetCodeParameters
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Modifies the bytecode stored at an account's address
 *
 * @param {Object} client - Test client with mode and request method
 * @param {TestClientMode} client.mode - Client mode
 * @param {(args: {method: string, params?: unknown[]}) => Promise<unknown>} client.request - RPC request function
 * @param {SetCodeParameters} params - Set code parameters
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * import { setCode } from './setCode.js';
 *
 * await setCode(client, {
 *   address: '0xe846c6fcf817734ca4527b28ccb4aea2b6663c79',
 *   bytecode: '0x608060405260006003...',
 * });
 * ```
 */
export async function setCode(client, { address, bytecode }) {
	const addr = typeof address === "string" ? address : Address.toHex(address);
	const code =
		typeof bytecode === "string" ? bytecode : Hex.fromBytes(bytecode);

	if (client.mode === "ganache") {
		await client.request({
			method: "evm_setAccountCode",
			params: [addr, code],
		});
	} else {
		await client.request({
			method: `${client.mode}_setCode`,
			params: [addr, code],
		});
	}
}
