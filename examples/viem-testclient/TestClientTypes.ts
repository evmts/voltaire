/**
 * Test Client Type Definitions - Copyable Implementation
 *
 * This is a reference implementation of test client types.
 * Copy this into your codebase and customize as needed.
 *
 * @module examples/viem-testclient/TestClientTypes
 */

import type { AddressType } from "../../src/primitives/Address/AddressType.js";
import type { HexType } from "../../src/primitives/Hex/HexType.js";

/**
 * Supported test client modes
 */
export type TestClientMode = "anvil" | "hardhat" | "ganache";

/**
 * EIP-1193 Provider interface
 */
export interface Provider {
	request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

/**
 * Chain configuration
 */
export interface Chain {
	id: number;
	name: string;
	rpcUrls?: {
		default: { http: string[] };
	};
}

/**
 * Transport configuration
 */
export interface Transport {
	type: string;
	url?: string;
}

/**
 * Test client configuration options
 */
export interface TestClientOptions {
	/** Test client mode - determines RPC method prefixes */
	mode: TestClientMode;
	/** Chain configuration */
	chain?: Chain;
	/** Transport (HTTP, WebSocket, etc.) */
	transport?: Transport;
	/** Provider instance (alternative to transport) */
	provider?: Provider;
	/** Client key identifier */
	key?: string;
	/** Client name */
	name?: string;
}

/**
 * Mine parameters
 */
export interface MineParameters {
	/** Number of blocks to mine */
	blocks: number;
	/** Optional interval between blocks in seconds */
	interval?: number;
}

/**
 * Set balance parameters
 */
export interface SetBalanceParameters {
	/** Account address */
	address: AddressType | `0x${string}`;
	/** Balance value in wei */
	value: bigint;
}

/**
 * Set code parameters
 */
export interface SetCodeParameters {
	/** Contract address */
	address: AddressType | `0x${string}`;
	/** Contract bytecode */
	bytecode: HexType | `0x${string}`;
}

/**
 * Set storage parameters
 */
export interface SetStorageAtParameters {
	/** Contract address */
	address: AddressType | `0x${string}`;
	/** Storage slot index */
	index: number | `0x${string}`;
	/** Storage value (32 bytes) */
	value: HexType | `0x${string}`;
}

/**
 * Set nonce parameters
 */
export interface SetNonceParameters {
	/** Account address */
	address: AddressType | `0x${string}`;
	/** New nonce value */
	nonce: number;
}

/**
 * Impersonate account parameters
 */
export interface ImpersonateAccountParameters {
	/** Address to impersonate */
	address: AddressType | `0x${string}`;
}

/**
 * Stop impersonating account parameters
 */
export interface StopImpersonatingAccountParameters {
	/** Address to stop impersonating */
	address: AddressType | `0x${string}`;
}

/**
 * Revert parameters
 */
export interface RevertParameters {
	/** Snapshot ID to revert to */
	id: `0x${string}`;
}

/**
 * Increase time parameters
 */
export interface IncreaseTimeParameters {
	/** Seconds to advance */
	seconds: number;
}

/**
 * Set next block timestamp parameters
 */
export interface SetNextBlockTimestampParameters {
	/** Unix timestamp for next block */
	timestamp: bigint;
}

/**
 * Drop transaction parameters
 */
export interface DropTransactionParameters {
	/** Transaction hash to remove from mempool */
	hash: `0x${string}`;
}

/**
 * Reset parameters
 */
export interface ResetParameters {
	/** Block number to fork from */
	blockNumber?: bigint;
	/** JSON-RPC URL to fork from */
	jsonRpcUrl?: string;
}

/**
 * Load state parameters
 */
export interface LoadStateParameters {
	/** Serialized state from dumpState */
	state: `0x${string}`;
}

/**
 * Test client instance with all test actions
 */
export interface TestClient {
	/** Client mode */
	readonly mode: TestClientMode;
	/** Client key */
	readonly key: string;
	/** Client name */
	readonly name: string;

	/**
	 * Mine blocks
	 * @example
	 * await client.mine({ blocks: 1 })
	 */
	mine(params: MineParameters): Promise<void>;

	/**
	 * Set account balance
	 * @example
	 * await client.setBalance({ address: '0x...', value: parseEther('100') })
	 */
	setBalance(params: SetBalanceParameters): Promise<void>;

	/**
	 * Set contract bytecode
	 * @example
	 * await client.setCode({ address: '0x...', bytecode: '0x6080...' })
	 */
	setCode(params: SetCodeParameters): Promise<void>;

	/**
	 * Set storage slot value
	 * @example
	 * await client.setStorageAt({ address: '0x...', index: 0, value: '0x...' })
	 */
	setStorageAt(params: SetStorageAtParameters): Promise<void>;

	/**
	 * Set account nonce
	 * @example
	 * await client.setNonce({ address: '0x...', nonce: 5 })
	 */
	setNonce(params: SetNonceParameters): Promise<void>;

	/**
	 * Impersonate account (send txs without private key)
	 * @example
	 * await client.impersonateAccount({ address: '0x...' })
	 */
	impersonateAccount(params: ImpersonateAccountParameters): Promise<void>;

	/**
	 * Stop impersonating account
	 * @example
	 * await client.stopImpersonatingAccount({ address: '0x...' })
	 */
	stopImpersonatingAccount(
		params: StopImpersonatingAccountParameters,
	): Promise<void>;

	/**
	 * Create EVM snapshot
	 * @returns Snapshot ID
	 * @example
	 * const id = await client.snapshot()
	 */
	snapshot(): Promise<`0x${string}`>;

	/**
	 * Revert to snapshot
	 * @example
	 * await client.revert({ id: '0x1' })
	 */
	revert(params: RevertParameters): Promise<void>;

	/**
	 * Advance time by seconds
	 * @example
	 * await client.increaseTime({ seconds: 3600 })
	 */
	increaseTime(params: IncreaseTimeParameters): Promise<void>;

	/**
	 * Set timestamp for next block
	 * @example
	 * await client.setNextBlockTimestamp({ timestamp: 1671744314n })
	 */
	setNextBlockTimestamp(params: SetNextBlockTimestampParameters): Promise<void>;

	/**
	 * Remove transaction from mempool
	 * @example
	 * await client.dropTransaction({ hash: '0x...' })
	 */
	dropTransaction(params: DropTransactionParameters): Promise<void>;

	/**
	 * Reset fork to original state
	 * @example
	 * await client.reset({ blockNumber: 69420n })
	 */
	reset(params?: ResetParameters): Promise<void>;

	/**
	 * Serialize current state
	 * @returns Hex-encoded state
	 * @example
	 * const state = await client.dumpState()
	 */
	dumpState(): Promise<`0x${string}`>;

	/**
	 * Load serialized state
	 * @example
	 * await client.loadState({ state: '0x...' })
	 */
	loadState(params: LoadStateParameters): Promise<void>;

	/**
	 * Enable/disable automine
	 * @example
	 * await client.setAutomine(false)
	 */
	setAutomine(enabled: boolean): Promise<void>;

	/**
	 * Make RPC request
	 */
	request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}
