/**
 * Test Client - Copyable Implementation
 *
 * This module provides a viem-compatible test client abstraction for
 * interacting with local test nodes (Anvil, Hardhat, Ganache).
 *
 * Copy this entire directory into your codebase and customize as needed.
 *
 * @module examples/viem-testclient
 *
 * @example
 * ```typescript
 * import { createTestClient } from './examples/viem-testclient/index.js';
 *
 * const client = createTestClient({
 *   mode: 'anvil',
 *   provider: myProvider,
 * });
 *
 * // Mine blocks
 * await client.mine({ blocks: 1 });
 *
 * // Set balance
 * await client.setBalance({ address: '0x...', value: 1000n });
 *
 * // Impersonate account
 * await client.impersonateAccount({ address: '0x...' });
 *
 * // Snapshot/revert
 * const id = await client.snapshot();
 * await client.revert({ id });
 * ```
 */

// Main factory
export { createTestClient } from "./createTestClient.js";

// Individual actions (for tree-shaking)
export { mine } from "./mine.js";
export { setBalance } from "./setBalance.js";
export { setCode } from "./setCode.js";
export { setStorageAt } from "./setStorageAt.js";
export { setNonce } from "./setNonce.js";
export { impersonateAccount } from "./impersonateAccount.js";
export { stopImpersonatingAccount } from "./stopImpersonatingAccount.js";
export { snapshot } from "./snapshot.js";
export { revert } from "./revert.js";
export { increaseTime } from "./increaseTime.js";
export { setNextBlockTimestamp } from "./setNextBlockTimestamp.js";
export { dropTransaction } from "./dropTransaction.js";
export { reset } from "./reset.js";
export { dumpState } from "./dumpState.js";
export { loadState } from "./loadState.js";
export { setAutomine } from "./setAutomine.js";

// Types
export type {
	TestClient,
	TestClientMode,
	TestClientOptions,
	Provider,
	Chain,
	Transport,
	MineParameters,
	SetBalanceParameters,
	SetCodeParameters,
	SetStorageAtParameters,
	SetNonceParameters,
	ImpersonateAccountParameters,
	StopImpersonatingAccountParameters,
	RevertParameters,
	IncreaseTimeParameters,
	SetNextBlockTimestampParameters,
	DropTransactionParameters,
	ResetParameters,
	LoadStateParameters,
} from "./TestClientTypes.js";

// Errors
export {
	UnsupportedModeError,
	TestActionError,
	SnapshotError,
	ImpersonationError,
	StateManipulationError,
	TimeManipulationError,
	MiningError,
} from "./errors.js";
