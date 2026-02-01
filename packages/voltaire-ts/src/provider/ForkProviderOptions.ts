/**
 * Fork Provider Configuration Types
 *
 * Options for configuring ForkProvider with upstream RPC node.
 *
 * @module provider/ForkProviderOptions
 */

import type { BlockchainFFIExports } from "../blockchain/Blockchain/index.js";
import type { StateManagerFFIExports } from "../state-manager/StateManager/index.js";
import type { Provider } from "./Provider.js";

/**
 * Fork configuration for ForkProvider
 */
export interface ForkConfig {
	/**
	 * Upstream RPC URL to fork from
	 */
	forkUrl: string;

	/**
	 * Block number to fork at
	 */
	forkBlockNumber: bigint;

	/**
	 * Optional block hash (for verification)
	 */
	forkBlockHash?: string;

	/**
	 * Max cache size for fork backend (default: 10000)
	 */
	maxCacheSize?: number;
}

/**
 * ForkProvider options
 */
export interface ForkProviderOptions {
	/**
	 * Fork configuration
	 */
	fork: ForkConfig;

	/**
	 * Chain ID (default: 1)
	 */
	chainId?: number;

	/**
	 * Optional custom RPC client
	 * If not provided, HttpProvider will be created from forkUrl
	 */
	rpcClient?: Provider;

	/**
	 * Optional preloaded FFI exports (native or WASM)
	 */
	ffi?: {
		stateManager: StateManagerFFIExports;
		blockchain: BlockchainFFIExports;
	};

	/**
	 * Force WASM loader (useful for Node/WASM tests)
	 */
	useWasm?: boolean;

	/**
	 * Optional WASM loader overrides
	 */
	wasm?: {
		stateManagerWasm?: string | URL | ArrayBuffer;
		blockchainWasm?: string | URL | ArrayBuffer;
	};
}
