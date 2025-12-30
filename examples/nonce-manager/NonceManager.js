/**
 * NonceManager - Manages transaction nonces to prevent gaps and race conditions
 *
 * Key design decisions (extracted from ethers v6 and viem):
 *
 * 1. OPTIMISTIC INCREMENT: Increment delta BEFORE awaiting chain nonce.
 *    This allows concurrent tx submissions without blocking.
 *
 * 2. DELTA TRACKING: Track local increments separate from chain nonce.
 *    Final nonce = chain_nonce + delta
 *
 * 3. PROMISE CACHING: Cache the pending chain fetch promise.
 *    Multiple concurrent gets share the same fetch.
 *
 * 4. PREVIOUS NONCE TRACKING: Remember last confirmed nonce.
 *    If chain returns lower nonce, use previous+1 (handles reorgs).
 *
 * 5. AUTO-RESET: Reset delta and promise after chain fetch completes.
 *    Next batch of txs will refetch fresh nonce.
 *
 * @module NonceManager
 */

import * as Address from "../../src/primitives/Address/index.js";
import { NonceStateError } from "./errors.js";

/**
 * @typedef {import('./NonceManagerType.js').NonceManager} NonceManager
 * @typedef {import('./NonceManagerType.js').NonceSource} NonceSource
 * @typedef {import('./NonceManagerType.js').CreateNonceManagerOptions} CreateNonceManagerOptions
 * @typedef {import('./NonceManagerType.js').NonceParameters} NonceParameters
 * @typedef {import('./NonceManagerType.js').NonceParametersWithProvider} NonceParametersWithProvider
 */

/**
 * Simple LRU cache implementation
 * @template T
 */
class LruMap {
	/** @type {Map<string, T>} */
	#map = new Map();
	/** @type {number} */
	#maxSize;

	/**
	 * @param {number} maxSize
	 */
	constructor(maxSize) {
		this.#maxSize = maxSize;
	}

	/**
	 * @param {string} key
	 * @returns {T | undefined}
	 */
	get(key) {
		const value = this.#map.get(key);
		if (value !== undefined) {
			// Move to end (most recently used)
			this.#map.delete(key);
			this.#map.set(key, value);
		}
		return value;
	}

	/**
	 * @param {string} key
	 * @param {T} value
	 */
	set(key, value) {
		// Delete first to update position if exists
		this.#map.delete(key);
		this.#map.set(key, value);

		// Evict oldest if over capacity
		if (this.#map.size > this.#maxSize) {
			const firstKey = this.#map.keys().next().value;
			if (firstKey) this.#map.delete(firstKey);
		}
	}

	/**
	 * @param {string} key
	 */
	delete(key) {
		this.#map.delete(key);
	}

	/**
	 * @param {string} key
	 * @returns {boolean}
	 */
	has(key) {
		return this.#map.has(key);
	}

	clear() {
		this.#map.clear();
	}
}

/**
 * Normalize address to lowercase hex string for consistent keys
 * @param {import('./NonceManagerType.js').AddressInput} address
 * @returns {string}
 */
function normalizeAddress(address) {
	if (typeof address === "string") {
		return address.toLowerCase();
	}
	// AddressType (Uint8Array)
	return Address.toHex(address).toLowerCase();
}

/**
 * Create a cache key from address and chainId
 * @param {NonceParameters} params
 * @returns {string}
 */
function getKey(params) {
	return `${normalizeAddress(params.address)}.${params.chainId}`;
}

/**
 * JSON-RPC nonce source
 * Fetches nonces using eth_getTransactionCount with 'pending' block tag
 *
 * @template TProvider
 * @returns {NonceSource<TProvider>}
 */
export function jsonRpc() {
	return {
		/**
		 * @param {NonceParametersWithProvider} params
		 * @returns {Promise<number>}
		 */
		async get(params) {
			const { address, provider } = params;
			const addressHex = normalizeAddress(address);

			// Support various provider interfaces
			// 1. viem client: client.request({ method, params })
			// 2. ethers provider: provider.getTransactionCount(address, 'pending')
			// 3. generic: { getTransactionCount: (address, tag) => number }

			if (typeof provider.getTransactionCount === "function") {
				// ethers-style or custom provider
				return provider.getTransactionCount(addressHex, "pending");
			}

			if (typeof provider.request === "function") {
				// viem-style client
				const result = await provider.request({
					method: "eth_getTransactionCount",
					params: [addressHex, "pending"],
				});
				// Result is hex string
				return typeof result === "string"
					? Number.parseInt(result, 16)
					: result;
			}

			throw new Error(
				"Provider must have getTransactionCount or request method",
			);
		},

		/**
		 * @param {NonceParameters} _params
		 * @param {number} _nonce
		 */
		set(_params, _nonce) {
			// No-op for JSON-RPC source
			// Could be used for logging or persistence
		},
	};
}

/**
 * In-memory nonce source for testing
 * @returns {NonceSource<unknown> & { setNonce: (address: string, chainId: number, nonce: number) => void }}
 */
export function inMemory() {
	/** @type {Map<string, number>} */
	const nonces = new Map();

	return {
		get(params) {
			const key = getKey(params);
			return nonces.get(key) ?? 0;
		},
		set(params, nonce) {
			const key = getKey(params);
			nonces.set(key, nonce + 1); // Store next expected nonce
		},
		setNonce(address, chainId, nonce) {
			const key = `${address.toLowerCase()}.${chainId}`;
			nonces.set(key, nonce);
		},
	};
}

/**
 * Creates a NonceManager for auto-incrementing transaction nonces
 *
 * Thread-safe design:
 * - Increment delta BEFORE awaiting, so concurrent calls get unique nonces
 * - Cache promise to share single chain fetch across concurrent calls
 * - Track previous nonce to handle reorgs gracefully
 *
 * @template TProvider
 * @param {CreateNonceManagerOptions<TProvider>} [options]
 * @returns {import('./NonceManagerType.js').NonceManager<TProvider>}
 *
 * @example
 * ```ts
 * const manager = createNonceManager({ source: jsonRpc() });
 *
 * // Concurrent transaction submission
 * const [nonce1, nonce2, nonce3] = await Promise.all([
 *   manager.consume({ address, chainId, provider }),
 *   manager.consume({ address, chainId, provider }),
 *   manager.consume({ address, chainId, provider }),
 * ]);
 * // nonce1, nonce2, nonce3 are sequential
 * ```
 */
export function createNonceManager(options = {}) {
	const { source = jsonRpc(), cacheSize = 8192 } = options;

	// Delta: local increment count (pending txs not yet confirmed)
	/** @type {Map<string, number>} */
	const deltaMap = new Map();

	// Previous nonce: last known confirmed nonce (for reorg detection)
	/** @type {LruMap<number>} */
	const nonceMap = new LruMap(cacheSize);

	// Promise cache: shared pending chain fetch
	/** @type {Map<string, Promise<number>>} */
	const promiseMap = new Map();

	return {
		/**
		 * Get and increment nonce atomically
		 * @param {NonceParametersWithProvider<TProvider>} params
		 * @returns {Promise<number>}
		 */
		async consume(params) {
			const key = getKey(params);

			// Get nonce promise FIRST (before increment)
			const promise = this.get(params);

			// Increment delta BEFORE await (optimistic)
			this.increment(params);

			// Now await the nonce
			const nonce = await promise;

			// Notify source (for persistence/logging)
			if (source.set) {
				await source.set(params, nonce);
			}

			// Update previous nonce cache
			nonceMap.set(key, nonce);

			return nonce;
		},

		/**
		 * Increment delta for address
		 * @param {NonceParameters} params
		 */
		increment(params) {
			const key = getKey(params);
			const delta = deltaMap.get(key) ?? 0;
			deltaMap.set(key, delta + 1);
		},

		/**
		 * Get next nonce (without incrementing)
		 * @param {NonceParametersWithProvider<TProvider>} params
		 * @returns {Promise<number>}
		 */
		async get(params) {
			const key = getKey(params);

			// Check for cached promise
			let promise = promiseMap.get(key);

			if (!promise) {
				// Create new fetch promise
				promise = (async () => {
					try {
						// Fetch from source
						const nonce = await source.get(params);

						// Check against previous nonce (reorg detection)
						const previousNonce = nonceMap.get(key) ?? 0;
						if (previousNonce > 0 && nonce <= previousNonce) {
							// Chain nonce is stale, use previous + 1
							return previousNonce + 1;
						}

						// Clear previous nonce (fresh start)
						nonceMap.delete(key);
						return nonce;
					} finally {
						// Reset after fetch completes (next batch gets fresh fetch)
						this.reset(params);
					}
				})();

				promiseMap.set(key, promise);
			}

			// Add current delta to fetched nonce
			const delta = deltaMap.get(key) ?? 0;
			return delta + (await promise);
		},

		/**
		 * Reset nonce state (forces refetch on next get)
		 * @param {NonceParameters} params
		 */
		reset(params) {
			const key = getKey(params);
			deltaMap.delete(key);
			promiseMap.delete(key);
		},

		/**
		 * Recycle nonce after tx failure (decrement delta)
		 * @param {NonceParameters} params
		 */
		recycle(params) {
			const key = getKey(params);
			const delta = deltaMap.get(key) ?? 0;
			if (delta <= 0) {
				throw new NonceStateError("Cannot recycle: no pending nonces", {
					address: normalizeAddress(params.address),
					chainId: params.chainId,
					delta,
				});
			}
			deltaMap.set(key, delta - 1);
		},

		/**
		 * Get current delta (pending tx count)
		 * @param {NonceParameters} params
		 * @returns {number}
		 */
		getDelta(params) {
			const key = getKey(params);
			return deltaMap.get(key) ?? 0;
		},
	};
}

/**
 * Default NonceManager with JSON-RPC source
 * @type {import('./NonceManagerType.js').NonceManager<unknown>}
 */
export const nonceManager = createNonceManager({ source: jsonRpc() });

/**
 * Wrap a signer with automatic nonce management
 * Similar to ethers NonceManager pattern
 *
 * @template TSigner
 * @param {TSigner} signer - Signer to wrap
 * @param {import('./NonceManagerType.js').WrapSignerOptions} options
 * @returns {import('./NonceManagerType.js').ManagedSigner<TSigner>}
 *
 * @example
 * ```ts
 * const managedSigner = wrapSigner(wallet, { chainId: 1 });
 *
 * // Nonces are managed automatically
 * await managedSigner.sendTransaction({ to, value });
 * await managedSigner.sendTransaction({ to, value });
 * ```
 */
export function wrapSigner(signer, options) {
	const { chainId, nonceManager: manager = createNonceManager() } = options;

	// Validate signer has required methods
	if (typeof signer.getAddress !== "function") {
		throw new Error("Signer must have getAddress method");
	}
	if (typeof signer.sendTransaction !== "function") {
		throw new Error("Signer must have sendTransaction method");
	}

	// Get provider from signer
	const getProvider = () => {
		if (signer.provider) return signer.provider;
		throw new Error("Signer must have a provider");
	};

	// Create wrapped signer
	const wrapped = Object.create(signer);

	// Override sendTransaction
	wrapped.sendTransaction = async function (tx) {
		const address = await signer.getAddress();
		const provider = getProvider();

		// Get nonce from manager
		const nonce = await manager.consume({ address, chainId, provider });

		try {
			// Populate tx with nonce
			const populatedTx = { ...tx, nonce };
			return await signer.sendTransaction(populatedTx);
		} catch (error) {
			// Recycle nonce on failure (tx wasn't sent)
			try {
				manager.recycle({ address, chainId });
			} catch {
				// Ignore recycle errors
			}
			throw error;
		}
	};

	// Add management methods
	Object.defineProperties(wrapped, {
		signer: {
			value: signer,
			writable: false,
			enumerable: true,
		},
		nonceManager: {
			value: manager,
			writable: false,
			enumerable: true,
		},
	});

	wrapped.resetNonce = async function () {
		const address = await signer.getAddress();
		manager.reset({ address, chainId });
	};

	wrapped.incrementNonce = async function () {
		const address = await signer.getAddress();
		manager.increment({ address, chainId });
	};

	return wrapped;
}
