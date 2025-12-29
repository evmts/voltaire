/**
 * Test Client Factory - Copyable Implementation
 *
 * This is a reference implementation of a test client abstraction.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-testclient/createTestClient
 */

import { mine } from "./mine.js";
import { setBalance } from "./setBalance.js";
import { setCode } from "./setCode.js";
import { setStorageAt } from "./setStorageAt.js";
import { setNonce } from "./setNonce.js";
import { impersonateAccount } from "./impersonateAccount.js";
import { stopImpersonatingAccount } from "./stopImpersonatingAccount.js";
import { snapshot } from "./snapshot.js";
import { revert } from "./revert.js";
import { increaseTime } from "./increaseTime.js";
import { setNextBlockTimestamp } from "./setNextBlockTimestamp.js";
import { dropTransaction } from "./dropTransaction.js";
import { reset } from "./reset.js";
import { dumpState } from "./dumpState.js";
import { loadState } from "./loadState.js";
import { setAutomine } from "./setAutomine.js";

/**
 * @typedef {import('./TestClientTypes.js').TestClientOptions} TestClientOptions
 * @typedef {import('./TestClientTypes.js').TestClient} TestClient
 * @typedef {import('./TestClientTypes.js').TestClientMode} TestClientMode
 */

/**
 * Create a test client for interacting with local test nodes (Anvil, Hardhat, Ganache).
 *
 * The test client provides methods for:
 * - **Mining**: Control block production
 * - **State Manipulation**: Set balances, code, storage, nonces
 * - **Impersonation**: Send transactions as any address
 * - **Snapshots**: Save and restore EVM state
 * - **Time Manipulation**: Control block timestamps
 *
 * @param {TestClientOptions} options - Client configuration
 * @returns {TestClient} Test client instance
 *
 * @example
 * ```typescript
 * import { createTestClient } from './createTestClient.js';
 *
 * // Create client for Anvil
 * const client = createTestClient({
 *   mode: 'anvil',
 *   provider: {
 *     request: async ({ method, params }) => {
 *       const response = await fetch('http://localhost:8545', {
 *         method: 'POST',
 *         headers: { 'Content-Type': 'application/json' },
 *         body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
 *       });
 *       const json = await response.json();
 *       if (json.error) throw new Error(json.error.message);
 *       return json.result;
 *     },
 *   },
 * });
 *
 * // Mine blocks
 * await client.mine({ blocks: 10 });
 *
 * // Set balance
 * await client.setBalance({
 *   address: '0x...',
 *   value: 1000000000000000000n,
 * });
 *
 * // Snapshot and revert
 * const id = await client.snapshot();
 * // ... make changes ...
 * await client.revert({ id });
 * ```
 */
export function createTestClient(options) {
	const {
		mode,
		provider,
		key = "test",
		name = "Test Client",
	} = options;

	if (!provider) {
		throw new Error("Provider is required for createTestClient");
	}

	/**
	 * Make an RPC request
	 * @param {{ method: string, params?: unknown[] }} args
	 * @returns {Promise<unknown>}
	 */
	const request = async (args) => {
		return provider.request(args);
	};

	/** @type {{ mode: TestClientMode, request: typeof request }} */
	const clientBase = { mode, request };

	/** @type {TestClient} */
	const client = {
		mode,
		key,
		name,
		request,

		mine: (params) => mine(clientBase, params),
		setBalance: (params) => setBalance(clientBase, params),
		setCode: (params) => setCode(clientBase, params),
		setStorageAt: (params) => setStorageAt(clientBase, params),
		setNonce: (params) => setNonce(clientBase, params),
		impersonateAccount: (params) => impersonateAccount(clientBase, params),
		stopImpersonatingAccount: (params) =>
			stopImpersonatingAccount(clientBase, params),
		snapshot: () => snapshot(clientBase),
		revert: (params) => revert(clientBase, params),
		increaseTime: (params) => increaseTime(clientBase, params),
		setNextBlockTimestamp: (params) =>
			setNextBlockTimestamp(clientBase, params),
		dropTransaction: (params) => dropTransaction(clientBase, params),
		reset: (params) => reset(clientBase, params),
		dumpState: () => dumpState(clientBase),
		loadState: (params) => loadState(clientBase, params),
		setAutomine: (enabled) => setAutomine(clientBase, enabled),
	};

	return client;
}
