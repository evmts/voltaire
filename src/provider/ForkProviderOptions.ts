/**
 * Fork Provider Configuration Types
 *
 * Options for configuring ForkProvider with upstream RPC node.
 *
 * @module provider/ForkProviderOptions
 */

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
}
