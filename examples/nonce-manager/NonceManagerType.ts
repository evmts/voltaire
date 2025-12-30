/**
 * NonceManager type definitions
 *
 * @module NonceManagerType
 */

import type { AddressType } from "../../src/primitives/Address/AddressType.js";

/**
 * Address input that can be a branded AddressType or hex string
 */
export type AddressInput = AddressType | `0x${string}`;

/**
 * Parameters for nonce operations
 */
export type NonceParameters = {
	/** The address to manage nonces for */
	address: AddressInput;
	/** The chain ID (used to scope nonces per-chain) */
	chainId: number;
};

/**
 * Parameters for operations that require a provider
 */
export type NonceParametersWithProvider<TProvider = unknown> =
	NonceParameters & {
		/** Provider/client to fetch nonces from chain */
		provider: TProvider;
	};

/**
 * Source for fetching nonces from chain
 * Allows custom implementations (JSON-RPC, mock, etc.)
 */
export type NonceSource<TProvider = unknown> = {
	/**
	 * Get the current nonce from the source
	 * Should typically fetch with blockTag='pending'
	 */
	get(params: NonceParametersWithProvider<TProvider>): Promise<number> | number;

	/**
	 * Optional: notify source after nonce is consumed
	 * Useful for persistence or debugging
	 */
	set?(params: NonceParameters, nonce: number): Promise<void> | void;
};

/**
 * Options for creating a NonceManager
 */
export type CreateNonceManagerOptions<TProvider = unknown> = {
	/** Source for fetching nonces (default: jsonRpc) */
	source?: NonceSource<TProvider>;
	/** Maximum entries in LRU cache (default: 8192) */
	cacheSize?: number;
};

/**
 * NonceManager interface for managing transaction nonces
 *
 * Key concepts:
 * - Delta: local increment count before chain sync
 * - Promise: cached promise for pending chain fetch
 * - Previous nonce: last confirmed nonce to detect reorgs
 *
 * Thread-safety achieved via optimistic increment before await
 */
export type NonceManager<TProvider = unknown> = {
	/**
	 * Get and increment a nonce atomically
	 * This is the primary method for sending transactions
	 *
	 * @example
	 * ```ts
	 * const nonce = await manager.consume({ address, chainId, provider });
	 * // nonce is now reserved for this transaction
	 * ```
	 */
	consume(params: NonceParametersWithProvider<TProvider>): Promise<number>;

	/**
	 * Increment the nonce delta without fetching
	 * Use when you know a transaction will be sent
	 */
	increment(params: NonceParameters): void;

	/**
	 * Get the next nonce without incrementing
	 * Useful for dry-run or estimation
	 */
	get(params: NonceParametersWithProvider<TProvider>): Promise<number>;

	/**
	 * Reset cached nonce state for an address
	 * Forces next get() to refetch from chain
	 *
	 * Use after:
	 * - Transaction failure
	 * - Manual nonce sync
	 * - Suspected nonce mismatch
	 */
	reset(params: NonceParameters): void;

	/**
	 * Recycle a nonce after transaction failure
	 * Decrements delta to allow nonce reuse
	 */
	recycle(params: NonceParameters): void;

	/**
	 * Get current delta (pending tx count) for an address
	 * Useful for debugging
	 */
	getDelta(params: NonceParameters): number;
};

/**
 * Transaction state for tracking pending transactions
 */
export type PendingTransaction = {
	/** The nonce used for this transaction */
	nonce: number;
	/** Transaction hash if submitted */
	hash?: `0x${string}`;
	/** Timestamp when nonce was consumed */
	timestamp: number;
	/** Current status */
	status: "pending" | "confirmed" | "failed" | "replaced";
};

/**
 * Extended NonceManager with transaction tracking
 */
export type NonceManagerWithTracking<TProvider = unknown> =
	NonceManager<TProvider> & {
		/**
		 * Track a pending transaction
		 */
		trackTransaction(
			params: NonceParameters & {
				nonce: number;
				hash?: `0x${string}`;
			},
		): void;

		/**
		 * Mark a transaction as confirmed
		 */
		confirmTransaction(params: NonceParameters & { nonce: number }): void;

		/**
		 * Mark a transaction as failed (allows nonce reuse)
		 */
		failTransaction(params: NonceParameters & { nonce: number }): void;

		/**
		 * Get all pending transactions for an address
		 */
		getPendingTransactions(params: NonceParameters): PendingTransaction[];

		/**
		 * Clean up stale pending transactions
		 */
		cleanupStale(params: NonceParameters, maxAgeMs?: number): void;
	};

/**
 * Signer wrapper that automatically manages nonces
 * Similar to ethers NonceManager pattern
 */
export type ManagedSigner<TSigner> = TSigner & {
	/** The underlying signer */
	readonly signer: TSigner;
	/** The nonce manager instance */
	readonly nonceManager: NonceManager;
	/** Reset nonce state */
	resetNonce(): void;
	/** Manually increment nonce */
	incrementNonce(): void;
};

/**
 * Options for wrapping a signer with nonce management
 */
export type WrapSignerOptions<TProvider = unknown> = {
	/** Custom nonce manager (optional, creates default if not provided) */
	nonceManager?: NonceManager<TProvider>;
	/** Chain ID for nonce scoping */
	chainId: number;
};
