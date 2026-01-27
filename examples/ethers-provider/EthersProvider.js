/**
 * Ethers v6 Style JsonRpcProvider
 *
 * An ethers v6-compatible JSON-RPC provider implementation using Voltaire primitives.
 * Supports batching, caching, retry logic, and the full ethers provider API.
 *
 * @module examples/ethers-provider
 */

import { Address } from "@tevm/voltaire";
import { BatchQueue, poll, retryWithBackoff } from "@tevm/voltaire/utils";

/**
 * @typedef {import('./EthersProviderTypes.js').EthersProviderOptions} EthersProviderOptions
 * @typedef {import('./EthersProviderTypes.js').Network} Network
 * @typedef {import('./EthersProviderTypes.js').BlockTag} BlockTag
 * @typedef {import('./EthersProviderTypes.js').FeeData} FeeData
 * @typedef {import('./EthersProviderTypes.js').Block} Block
 * @typedef {import('./EthersProviderTypes.js').Log} Log
 * @typedef {import('./EthersProviderTypes.js').TransactionReceipt} TransactionReceipt
 * @typedef {import('./EthersProviderTypes.js').TransactionResponse} TransactionResponse
 * @typedef {import('./EthersProviderTypes.js').TransactionRequest} TransactionRequest
 * @typedef {import('./EthersProviderTypes.js').Filter} Filter
 * @typedef {import('./EthersProviderTypes.js').ProviderEvent} ProviderEvent
 * @typedef {import('./EthersProviderTypes.js').Listener} Listener
 * @typedef {import('./EthersProviderTypes.js').JsonRpcPayload} JsonRpcPayload
 * @typedef {import('./EthersProviderTypes.js').JsonRpcResponse} JsonRpcResponse
 * @typedef {import('./EthersProviderTypes.js').Subscriber} Subscriber
 */

/** @type {Required<EthersProviderOptions>} */
const DEFAULT_OPTIONS = {
	cacheTimeout: 250,
	pollingInterval: 4000,
	polling: false,
	staticNetwork: null,
	batchStallTime: 10,
	batchMaxSize: 1 << 20,
	batchMaxCount: 100,
};

/**
 * Simple Network implementation
 */
export class NetworkImpl {
	/** @type {string} */
	name;
	/** @type {bigint} */
	chainId;

	/**
	 * @param {string} name
	 * @param {bigint} chainId
	 */
	constructor(name, chainId) {
		this.name = name;
		this.chainId = chainId;
	}

	clone() {
		return new NetworkImpl(this.name, this.chainId);
	}

	/**
	 * @param {any} other
	 */
	matches(other) {
		if (other == null) return false;
		if (
			typeof other === "string" ||
			typeof other === "number" ||
			typeof other === "bigint"
		) {
			try {
				return this.chainId === BigInt(other);
			} catch {
				return this.name === other;
			}
		}
		if (typeof other === "object") {
			if (other.chainId != null) {
				try {
					return this.chainId === BigInt(other.chainId);
				} catch {
					return false;
				}
			}
			if (other.name != null) {
				return this.name === other.name;
			}
		}
		return false;
	}

	/**
	 * @param {any} tx
	 */
	computeIntrinsicGas(tx) {
		let gas = 21000n;
		if (tx.to == null) gas += 32000n;
		if (tx.data) {
			for (let i = 2; i < tx.data.length; i += 2) {
				if (tx.data.substring(i, i + 2) === "00") {
					gas += 4n;
				} else {
					gas += 16n;
				}
			}
		}
		return gas;
	}

	/**
	 * @param {any} network
	 */
	static from(network) {
		if (network == null) return new NetworkImpl("mainnet", 1n);
		if (network instanceof NetworkImpl) return network.clone();
		if (typeof network === "number" || typeof network === "bigint") {
			return new NetworkImpl("unknown", BigInt(network));
		}
		if (typeof network === "string") {
			const known = KNOWN_NETWORKS[network.toLowerCase()];
			if (known) return new NetworkImpl(known.name, BigInt(known.chainId));
			return new NetworkImpl(network, 1n);
		}
		if (typeof network === "object") {
			return new NetworkImpl(network.name, BigInt(network.chainId));
		}
		throw new Error(`Invalid network: ${network}`);
	}
}

/** @type {Record<string, {name: string, chainId: number}>} */
const KNOWN_NETWORKS = {
	mainnet: { name: "mainnet", chainId: 1 },
	homestead: { name: "mainnet", chainId: 1 },
	sepolia: { name: "sepolia", chainId: 11155111 },
	goerli: { name: "goerli", chainId: 5 },
	arbitrum: { name: "arbitrum", chainId: 42161 },
	optimism: { name: "optimism", chainId: 10 },
	polygon: { name: "polygon", chainId: 137 },
	base: { name: "base", chainId: 8453 },
};

/**
 * Creates a provider error with code
 * @param {string} message
 * @param {string} code
 * @param {Record<string, unknown>} [info]
 */
function makeError(message, code, info) {
	const error = /** @type {any} */ (new Error(message));
	error.code = code;
	error.info = info;
	return error;
}

/**
 * Ethers v6 Style JsonRpcProvider
 */
export class EthersProvider {
	/** @type {string} */
	#url;
	/** @type {Required<EthersProviderOptions>} */
	#options;
	/** @type {number} */
	#nextId = 1;
	/** @type {Map<string, {promise: Promise<unknown>, timestamp: number}>} */
	#cache = new Map();
	/** @type {Network | null} */
	#network = null;
	/** @type {Promise<Network> | null} */
	#networkPromise = null;
	/** @type {boolean} */
	#destroyed = false;
	/** @type {boolean | null} */
	#pausedState = null;
	/** @type {number} */
	#lastBlockNumber = -1;
	/** @type {Map<string, {subscriber: Subscriber, listeners: Array<{listener: Listener, once: boolean}>}>} */
	#subs = new Map();
	/** @type {Map<number, {timer: ReturnType<typeof setTimeout> | null, func: () => void, time: number}>} */
	#timers = new Map();
	/** @type {number} */
	#nextTimer = 1;
	/** @type {BatchQueue<JsonRpcPayload, JsonRpcResponse> | null} */
	#batchQueue = null;
	/** @type {boolean} */
	#ready = false;

	/**
	 * @param {string} [url]
	 * @param {any} [network]
	 * @param {EthersProviderOptions} [options]
	 */
	constructor(url, network, options) {
		this.#url = url ?? "http://localhost:8545";
		this.#options = { ...DEFAULT_OPTIONS, ...options };

		// Handle static network
		const staticNetwork = this.#options.staticNetwork;
		if (staticNetwork && staticNetwork !== true) {
			this.#network =
				staticNetwork instanceof NetworkImpl
					? staticNetwork
					: NetworkImpl.from(staticNetwork);
		} else if (network && network !== "any") {
			this.#network = NetworkImpl.from(network);
		}

		// Initialize batch queue
		this.#batchQueue = new BatchQueue({
			maxBatchSize: this.#options.batchMaxCount,
			maxWaitTime: this.#options.batchStallTime,
			processBatch: async (payloads) => this.#sendBatch(payloads),
		});
	}

	get pollingInterval() {
		return this.#options.pollingInterval;
	}

	get destroyed() {
		return this.#destroyed;
	}

	get paused() {
		return this.#pausedState != null;
	}

	/**
	 * Send a batch of JSON-RPC requests
	 * @param {JsonRpcPayload[]} payloads
	 * @returns {Promise<JsonRpcResponse[]>}
	 */
	async #sendBatch(payloads) {
		const body = payloads.length === 1 ? payloads[0] : payloads;

		const response = await retryWithBackoff(
			async () => {
				const res = await fetch(this.#url, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(body),
				});
				if (!res.ok) {
					throw makeError(
						`HTTP ${res.status}: ${res.statusText}`,
						"SERVER_ERROR",
					);
				}
				return res.json();
			},
			{ maxRetries: 3, initialDelay: 100 },
		);

		// Normalize response to array
		const results = Array.isArray(response) ? response : [response];

		// Match responses to payloads by id
		return payloads.map((payload) => {
			const result = results.find((r) => r.id === payload.id);
			if (!result) {
				return {
					id: payload.id,
					jsonrpc: "2.0",
					error: { code: -32603, message: "Missing response" },
				};
			}
			return result;
		});
	}

	/**
	 * Send a JSON-RPC request
	 * @param {string} method
	 * @param {unknown[]} params
	 * @returns {Promise<unknown>}
	 */
	async send(method, params) {
		if (this.#destroyed) {
			throw makeError("provider destroyed", "UNSUPPORTED_OPERATION");
		}

		// Start provider if not ready
		if (!this.#ready) {
			this._start();
		}

		// Check cache
		const cacheKey = `${method}:${JSON.stringify(params)}`;
		if (this.#options.cacheTimeout > 0) {
			const cached = this.#cache.get(cacheKey);
			if (
				cached &&
				Date.now() - cached.timestamp < this.#options.cacheTimeout
			) {
				return cached.promise;
			}
		}

		/** @type {JsonRpcPayload} */
		const payload = {
			id: this.#nextId++,
			jsonrpc: "2.0",
			method,
			params,
		};

		const promise = this.#batchQueue
			? this.#batchQueue.add(payload).then((response) => {
					if (response.error) {
						throw this.#getRpcError(payload, response);
					}
					return response.result;
				})
			: this.#sendBatch([payload]).then((responses) => {
					const response = responses[0];
					if (response?.error) {
						throw this.#getRpcError(payload, response);
					}
					return response?.result;
				});

		// Cache the promise
		if (this.#options.cacheTimeout > 0) {
			this.#cache.set(cacheKey, { promise, timestamp: Date.now() });
			setTimeout(() => {
				const cached = this.#cache.get(cacheKey);
				if (cached?.timestamp === Date.now()) {
					this.#cache.delete(cacheKey);
				}
			}, this.#options.cacheTimeout);
		}

		return promise;
	}

	/**
	 * Convert JSON-RPC error to provider error
	 * @param {JsonRpcPayload} payload
	 * @param {JsonRpcResponse} response
	 */
	// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: compatibility layer
	#getRpcError(payload, response) {
		const error = response.error;
		if (!error) return makeError("Unknown error", "UNKNOWN_ERROR");

		const message = error.message || "Unknown error";
		const { method } = payload;

		// Map common error patterns
		if (method === "eth_estimateGas" || method === "eth_call") {
			if (message.match(/insufficient funds/i)) {
				return makeError("insufficient funds", "INSUFFICIENT_FUNDS", {
					payload,
					error,
				});
			}
			if (message.match(/nonce.*too low/i)) {
				return makeError("nonce has already been used", "NONCE_EXPIRED", {
					payload,
					error,
				});
			}
			if (message.match(/revert/i)) {
				return makeError("execution reverted", "CALL_EXCEPTION", {
					payload,
					error,
					data: error.data,
				});
			}
		}

		if (
			method === "eth_sendRawTransaction" ||
			method === "eth_sendTransaction"
		) {
			if (message.match(/insufficient funds/i)) {
				return makeError("insufficient funds", "INSUFFICIENT_FUNDS", {
					payload,
					error,
				});
			}
			if (message.match(/nonce.*too low/i)) {
				return makeError("nonce has already been used", "NONCE_EXPIRED", {
					payload,
					error,
				});
			}
			if (message.match(/replacement.*underpriced/i)) {
				return makeError("replacement fee too low", "REPLACEMENT_UNDERPRICED", {
					payload,
					error,
				});
			}
		}

		if (message.match(/user denied|rejected/i)) {
			return makeError("user rejected action", "ACTION_REJECTED", {
				payload,
				error,
			});
		}

		if (message.match(/method.*does not exist/i)) {
			return makeError("unsupported operation", "UNSUPPORTED_OPERATION", {
				operation: method,
				payload,
				error,
			});
		}

		return makeError(message, "UNKNOWN_ERROR", { payload, error });
	}

	/**
	 * Start the provider (called automatically on first request)
	 */
	_start() {
		if (this.#ready) return;
		this.#ready = true;
	}

	/**
	 * Detect the network
	 * @returns {Promise<Network>}
	 */
	async _detectNetwork() {
		if (this.#options.staticNetwork && this.#network) {
			return this.#network;
		}

		const chainId = await this.send("eth_chainId", []);
		return NetworkImpl.from(BigInt(/** @type {string} */ (chainId)));
	}

	// =========================================================================
	// Network Methods
	// =========================================================================

	/**
	 * Get the network
	 * @returns {Promise<Network>}
	 */
	async getNetwork() {
		if (this.#networkPromise == null) {
			this.#networkPromise = this._detectNetwork().then((network) => {
				this.#network = network;
				this.emit("network", network, null);
				return network;
			});
		}
		return (await this.#networkPromise).clone();
	}

	/**
	 * Get the current block number
	 * @returns {Promise<number>}
	 */
	async getBlockNumber() {
		const result = await this.send("eth_blockNumber", []);
		const blockNumber = Number(BigInt(/** @type {string} */ (result)));
		if (this.#lastBlockNumber >= 0) {
			this.#lastBlockNumber = blockNumber;
		}
		return blockNumber;
	}

	/**
	 * Get fee data
	 * @returns {Promise<FeeData>}
	 */
	async getFeeData() {
		const [block, gasPrice, priorityFee] = await Promise.all([
			this.getBlock("latest"),
			this.send("eth_gasPrice", []).catch(() => null),
			this.send("eth_maxPriorityFeePerGas", []).catch(() => null),
		]);

		const gasPriceBigInt = gasPrice
			? BigInt(/** @type {string} */ (gasPrice))
			: null;
		let maxFeePerGas = null;
		let maxPriorityFeePerGas = priorityFee
			? BigInt(/** @type {string} */ (priorityFee))
			: null;

		if (block?.baseFeePerGas) {
			if (!maxPriorityFeePerGas) {
				maxPriorityFeePerGas = 1000000000n; // 1 gwei default
			}
			maxFeePerGas = block.baseFeePerGas * 2n + maxPriorityFeePerGas;
		}

		return {
			gasPrice: gasPriceBigInt,
			maxFeePerGas,
			maxPriorityFeePerGas,
		};
	}

	// =========================================================================
	// Account Methods
	// =========================================================================

	/**
	 * Get account balance
	 * @param {string} address
	 * @param {BlockTag} [blockTag]
	 * @returns {Promise<bigint>}
	 */
	async getBalance(address, blockTag) {
		const tag = this.#formatBlockTag(blockTag);
		const result = await this.send("eth_getBalance", [
			address.toLowerCase(),
			tag,
		]);
		return BigInt(/** @type {string} */ (result));
	}

	/**
	 * Get transaction count (nonce)
	 * @param {string} address
	 * @param {BlockTag} [blockTag]
	 * @returns {Promise<number>}
	 */
	async getTransactionCount(address, blockTag) {
		const tag = this.#formatBlockTag(blockTag);
		const result = await this.send("eth_getTransactionCount", [
			address.toLowerCase(),
			tag,
		]);
		return Number(BigInt(/** @type {string} */ (result)));
	}

	/**
	 * Get contract code
	 * @param {string} address
	 * @param {BlockTag} [blockTag]
	 * @returns {Promise<string>}
	 */
	async getCode(address, blockTag) {
		const tag = this.#formatBlockTag(blockTag);
		const result = await this.send("eth_getCode", [address.toLowerCase(), tag]);
		return /** @type {string} */ (result);
	}

	/**
	 * Get storage at position
	 * @param {string} address
	 * @param {bigint} position
	 * @param {BlockTag} [blockTag]
	 * @returns {Promise<string>}
	 */
	async getStorage(address, position, blockTag) {
		const tag = this.#formatBlockTag(blockTag);
		const posHex = `0x${position.toString(16)}`;
		const result = await this.send("eth_getStorageAt", [
			address.toLowerCase(),
			posHex,
			tag,
		]);
		return /** @type {string} */ (result);
	}

	// =========================================================================
	// Execution Methods
	// =========================================================================

	/**
	 * Execute a call
	 * @param {TransactionRequest} tx
	 * @returns {Promise<string>}
	 */
	async call(tx) {
		const txObj = this.#formatTransaction(tx);
		const blockTag = this.#formatBlockTag(tx.blockTag);
		const result = await this.send("eth_call", [txObj, blockTag]);
		return /** @type {string} */ (result);
	}

	/**
	 * Estimate gas
	 * @param {TransactionRequest} tx
	 * @returns {Promise<bigint>}
	 */
	async estimateGas(tx) {
		const txObj = this.#formatTransaction(tx);
		const result = await this.send("eth_estimateGas", [txObj]);
		return BigInt(/** @type {string} */ (result));
	}

	// =========================================================================
	// Transaction Methods
	// =========================================================================

	/**
	 * Broadcast a signed transaction
	 * @param {string} signedTx
	 * @returns {Promise<TransactionResponse>}
	 */
	async broadcastTransaction(signedTx) {
		const blockNumber = await this.getBlockNumber();
		const hash = /** @type {string} */ (
			await this.send("eth_sendRawTransaction", [signedTx])
		);

		// Poll for the transaction
		const tx = await poll(() => this.getTransaction(hash), {
			interval: 1000,
			timeout: 30000,
			validate: (tx) => tx != null,
		});

		return /** @type {TransactionResponse} */ (tx);
	}

	/**
	 * Get transaction by hash
	 * @param {string} hash
	 * @returns {Promise<TransactionResponse | null>}
	 */
	async getTransaction(hash) {
		const result = await this.send("eth_getTransactionByHash", [hash]);
		if (result == null) return null;
		return this.#formatTransactionResponse(/** @type {any} */ (result));
	}

	/**
	 * Get transaction receipt
	 * @param {string} hash
	 * @returns {Promise<TransactionReceipt | null>}
	 */
	async getTransactionReceipt(hash) {
		const result = await this.send("eth_getTransactionReceipt", [hash]);
		if (result == null) return null;
		return this.#formatTransactionReceipt(/** @type {any} */ (result));
	}

	/**
	 * Wait for transaction confirmation
	 * @param {string} hash
	 * @param {number} [confirms]
	 * @param {number} [timeout]
	 * @returns {Promise<TransactionReceipt | null>}
	 */
	async waitForTransaction(hash, confirms = 1, timeout = 0) {
		if (confirms === 0) {
			return this.getTransactionReceipt(hash);
		}

		return poll(
			async () => {
				const receipt = await this.getTransactionReceipt(hash);
				if (receipt == null) return null;
				const currentBlock = await this.getBlockNumber();
				if (currentBlock - receipt.blockNumber + 1 >= confirms) {
					return receipt;
				}
				return null;
			},
			{
				interval: this.#options.pollingInterval,
				timeout: timeout || 300000,
				validate: (receipt) => receipt != null,
			},
		);
	}

	// =========================================================================
	// Block Methods
	// =========================================================================

	/**
	 * Get block by hash or tag
	 * @param {BlockTag | string} blockHashOrTag
	 * @param {boolean} [prefetchTxs]
	 * @returns {Promise<Block | null>}
	 */
	async getBlock(blockHashOrTag, prefetchTxs = false) {
		let result;

		if (typeof blockHashOrTag === "string" && blockHashOrTag.length === 66) {
			// Block hash
			result = await this.send("eth_getBlockByHash", [
				blockHashOrTag,
				prefetchTxs,
			]);
		} else {
			// Block tag
			const tag = this.#formatBlockTag(blockHashOrTag);
			result = await this.send("eth_getBlockByNumber", [tag, prefetchTxs]);
		}

		if (result == null) return null;
		return this.#formatBlock(/** @type {any} */ (result));
	}

	// =========================================================================
	// Log Methods
	// =========================================================================

	/**
	 * Get logs matching filter
	 * @param {Filter} filter
	 * @returns {Promise<Log[]>}
	 */
	async getLogs(filter) {
		const formattedFilter = this.#formatFilter(filter);
		const result = await this.send("eth_getLogs", [formattedFilter]);
		return /** @type {any[]} */ (result).map((log) => this.#formatLog(log));
	}

	// =========================================================================
	// Event Methods
	// =========================================================================

	/**
	 * @param {ProviderEvent} event
	 * @param {Listener} listener
	 * @returns {Promise<this>}
	 */
	async on(event, listener) {
		const tag = this.#getEventTag(event);
		let sub = this.#subs.get(tag);
		if (!sub) {
			sub = { subscriber: this.#createSubscriber(event), listeners: [] };
			this.#subs.set(tag, sub);
		}
		sub.listeners.push({ listener, once: false });
		if (sub.listeners.length === 1) {
			sub.subscriber.start();
		}
		return this;
	}

	/**
	 * @param {ProviderEvent} event
	 * @param {Listener} listener
	 * @returns {Promise<this>}
	 */
	async once(event, listener) {
		const tag = this.#getEventTag(event);
		let sub = this.#subs.get(tag);
		if (!sub) {
			sub = { subscriber: this.#createSubscriber(event), listeners: [] };
			this.#subs.set(tag, sub);
		}
		sub.listeners.push({ listener, once: true });
		if (sub.listeners.length === 1) {
			sub.subscriber.start();
		}
		return this;
	}

	/**
	 * @param {ProviderEvent} event
	 * @param {Listener} [listener]
	 * @returns {Promise<this>}
	 */
	async off(event, listener) {
		const tag = this.#getEventTag(event);
		const sub = this.#subs.get(tag);
		if (!sub) return this;

		if (listener) {
			const idx = sub.listeners.findIndex((l) => l.listener === listener);
			if (idx >= 0) sub.listeners.splice(idx, 1);
		}

		if (!listener || sub.listeners.length === 0) {
			sub.subscriber.stop();
			this.#subs.delete(tag);
		}
		return this;
	}

	/**
	 * @param {ProviderEvent} [event]
	 * @returns {Promise<this>}
	 */
	async removeAllListeners(event) {
		if (event) {
			const tag = this.#getEventTag(event);
			const sub = this.#subs.get(tag);
			if (sub) {
				sub.subscriber.stop();
				this.#subs.delete(tag);
			}
		} else {
			for (const [tag, sub] of this.#subs) {
				sub.subscriber.stop();
				this.#subs.delete(tag);
			}
		}
		return this;
	}

	/**
	 * @param {ProviderEvent} [event]
	 * @returns {Promise<number>}
	 */
	async listenerCount(event) {
		if (event) {
			const tag = this.#getEventTag(event);
			const sub = this.#subs.get(tag);
			return sub?.listeners.length ?? 0;
		}
		let total = 0;
		for (const sub of this.#subs.values()) {
			total += sub.listeners.length;
		}
		return total;
	}

	/**
	 * @param {ProviderEvent} [event]
	 * @returns {Promise<Listener[]>}
	 */
	async listeners(event) {
		if (event) {
			const tag = this.#getEventTag(event);
			const sub = this.#subs.get(tag);
			return sub?.listeners.map((l) => l.listener) ?? [];
		}
		/** @type {Listener[]} */
		const result = [];
		for (const sub of this.#subs.values()) {
			result.push(...sub.listeners.map((l) => l.listener));
		}
		return result;
	}

	/**
	 * @param {ProviderEvent} event
	 * @param {...unknown} args
	 * @returns {Promise<boolean>}
	 */
	async emit(event, ...args) {
		const tag = this.#getEventTag(event);
		const sub = this.#subs.get(tag);
		if (!sub || sub.listeners.length === 0) return false;

		const count = sub.listeners.length;
		sub.listeners = sub.listeners.filter(({ listener, once }) => {
			try {
				listener(...args);
			} catch {
				// Ignore listener errors
			}
			return !once;
		});

		if (sub.listeners.length === 0) {
			sub.subscriber.stop();
			this.#subs.delete(tag);
		}

		return count > 0;
	}

	// =========================================================================
	// Lifecycle Methods
	// =========================================================================

	/**
	 * Destroy the provider
	 */
	destroy() {
		this.removeAllListeners();
		for (const timerId of this.#timers.keys()) {
			this._clearTimeout(timerId);
		}
		this.#destroyed = true;
	}

	/**
	 * Pause the provider
	 * @param {boolean} [dropWhilePaused]
	 */
	pause(dropWhilePaused = false) {
		this.#lastBlockNumber = -1;
		if (this.#pausedState != null) {
			if (this.#pausedState === dropWhilePaused) return;
			throw makeError(
				"cannot change pause type; resume first",
				"UNSUPPORTED_OPERATION",
			);
		}
		this.#pausedState = dropWhilePaused;
		for (const sub of this.#subs.values()) {
			sub.subscriber.pause(dropWhilePaused);
		}
	}

	/**
	 * Resume the provider
	 */
	resume() {
		if (this.#pausedState == null) return;
		for (const sub of this.#subs.values()) {
			sub.subscriber.resume();
		}
		this.#pausedState = null;
	}

	/**
	 * Set a timeout
	 * @param {() => void} func
	 * @param {number} [timeout]
	 * @returns {number}
	 */
	_setTimeout(func, timeout = 0) {
		const timerId = this.#nextTimer++;
		if (this.paused) {
			this.#timers.set(timerId, { timer: null, func, time: timeout });
		} else {
			const timer = setTimeout(() => {
				this.#timers.delete(timerId);
				func();
			}, timeout);
			this.#timers.set(timerId, { timer, func, time: Date.now() });
		}
		return timerId;
	}

	/**
	 * Clear a timeout
	 * @param {number} timerId
	 */
	_clearTimeout(timerId) {
		const timer = this.#timers.get(timerId);
		if (!timer) return;
		if (timer.timer) clearTimeout(timer.timer);
		this.#timers.delete(timerId);
	}

	// =========================================================================
	// Internal Formatters
	// =========================================================================

	/**
	 * @param {BlockTag} [blockTag]
	 * @returns {string}
	 */
	#formatBlockTag(blockTag) {
		if (blockTag == null) return "latest";
		if (blockTag === "earliest") return "0x0";
		if (typeof blockTag === "string") {
			if (["latest", "pending", "safe", "finalized"].includes(blockTag)) {
				return blockTag;
			}
			return blockTag;
		}
		if (typeof blockTag === "number" || typeof blockTag === "bigint") {
			return `0x${BigInt(blockTag).toString(16)}`;
		}
		return "latest";
	}

	/**
	 * @param {TransactionRequest} tx
	 */
	#formatTransaction(tx) {
		/** @type {Record<string, unknown>} */
		const result = {};

		if (tx.from) result.from = tx.from.toLowerCase();
		if (tx.to) result.to = tx.to.toLowerCase();
		if (tx.data) result.data = tx.data;
		if (tx.value != null) result.value = `0x${tx.value.toString(16)}`;
		if (tx.gasLimit != null) result.gas = `0x${tx.gasLimit.toString(16)}`;
		if (tx.gasPrice != null) result.gasPrice = `0x${tx.gasPrice.toString(16)}`;
		if (tx.maxFeePerGas != null)
			result.maxFeePerGas = `0x${tx.maxFeePerGas.toString(16)}`;
		if (tx.maxPriorityFeePerGas != null)
			result.maxPriorityFeePerGas = `0x${tx.maxPriorityFeePerGas.toString(16)}`;
		if (tx.nonce != null) result.nonce = `0x${tx.nonce.toString(16)}`;
		if (tx.chainId != null) result.chainId = `0x${tx.chainId.toString(16)}`;
		if (tx.type != null) result.type = `0x${tx.type.toString(16)}`;
		if (tx.accessList) result.accessList = tx.accessList;

		return result;
	}

	/**
	 * @param {Filter} filter
	 */
	#formatFilter(filter) {
		/** @type {Record<string, unknown>} */
		const result = {};

		if (filter.address) {
			result.address = Array.isArray(filter.address)
				? filter.address.map((a) => a.toLowerCase())
				: filter.address.toLowerCase();
		}
		if (filter.topics) result.topics = filter.topics;
		if (filter.fromBlock != null)
			result.fromBlock = this.#formatBlockTag(filter.fromBlock);
		if (filter.toBlock != null)
			result.toBlock = this.#formatBlockTag(filter.toBlock);
		if (filter.blockHash) result.blockHash = filter.blockHash;

		return result;
	}

	/**
	 * @param {any} result
	 * @returns {Block}
	 */
	#formatBlock(result) {
		return {
			hash: result.hash,
			parentHash: result.parentHash,
			number: Number(BigInt(result.number)),
			timestamp: Number(BigInt(result.timestamp)),
			nonce: result.nonce,
			difficulty: BigInt(result.difficulty || 0),
			gasLimit: BigInt(result.gasLimit),
			gasUsed: BigInt(result.gasUsed),
			miner: result.miner,
			extraData: result.extraData,
			baseFeePerGas: result.baseFeePerGas ? BigInt(result.baseFeePerGas) : null,
			transactions: result.transactions,
			provider: this,
			blobGasUsed: result.blobGasUsed ? BigInt(result.blobGasUsed) : null,
			excessBlobGas: result.excessBlobGas ? BigInt(result.excessBlobGas) : null,
			parentBeaconBlockRoot: result.parentBeaconBlockRoot || null,
			stateRoot: result.stateRoot || null,
			receiptsRoot: result.receiptsRoot || null,
			prevRandao: result.mixHash || result.prevRandao || null,
		};
	}

	/**
	 * @param {any} result
	 * @returns {Log}
	 */
	#formatLog(result) {
		return {
			transactionHash: result.transactionHash,
			blockHash: result.blockHash,
			blockNumber: Number(BigInt(result.blockNumber)),
			removed: result.removed ?? false,
			address: result.address,
			data: result.data,
			topics: Object.freeze(result.topics),
			index: Number(BigInt(result.logIndex ?? result.index)),
			transactionIndex: Number(BigInt(result.transactionIndex)),
			provider: this,
		};
	}

	/**
	 * @param {any} result
	 * @returns {TransactionReceipt}
	 */
	#formatTransactionReceipt(result) {
		return {
			to: result.to,
			from: result.from,
			contractAddress: result.contractAddress,
			hash: result.transactionHash ?? result.hash,
			index: Number(BigInt(result.transactionIndex ?? result.index)),
			blockHash: result.blockHash,
			blockNumber: Number(BigInt(result.blockNumber)),
			logsBloom: result.logsBloom,
			gasUsed: BigInt(result.gasUsed),
			cumulativeGasUsed: BigInt(result.cumulativeGasUsed),
			gasPrice: BigInt(result.effectiveGasPrice || result.gasPrice || 0),
			type: Number(result.type || 0),
			status: result.status != null ? Number(BigInt(result.status)) : null,
			root: result.root || null,
			logs: (result.logs || []).map((log) => this.#formatLog(log)),
			blobGasUsed: result.blobGasUsed ? BigInt(result.blobGasUsed) : null,
			blobGasPrice: result.blobGasPrice ? BigInt(result.blobGasPrice) : null,
			provider: this,
		};
	}

	/**
	 * @param {any} result
	 * @returns {TransactionResponse}
	 */
	#formatTransactionResponse(result) {
		const provider = this;

		return {
			hash: result.hash,
			blockHash: result.blockHash,
			blockNumber:
				result.blockNumber != null ? Number(BigInt(result.blockNumber)) : null,
			index:
				result.transactionIndex != null
					? Number(BigInt(result.transactionIndex))
					: null,
			type: Number(result.type || 0),
			to: result.to,
			from: result.from,
			nonce: Number(BigInt(result.nonce)),
			gasLimit: BigInt(result.gas || result.gasLimit),
			gasPrice: BigInt(result.gasPrice || 0),
			maxPriorityFeePerGas: result.maxPriorityFeePerGas
				? BigInt(result.maxPriorityFeePerGas)
				: null,
			maxFeePerGas: result.maxFeePerGas ? BigInt(result.maxFeePerGas) : null,
			maxFeePerBlobGas: result.maxFeePerBlobGas
				? BigInt(result.maxFeePerBlobGas)
				: null,
			data: result.input ?? result.data,
			value: BigInt(result.value),
			chainId: result.chainId ? BigInt(result.chainId) : 1n,
			signature: {
				r: result.r,
				s: result.s,
				v: Number(result.v),
				yParity: result.yParity != null ? Number(result.yParity) : undefined,
			},
			accessList: result.accessList || null,
			blobVersionedHashes: result.blobVersionedHashes || null,
			provider: this,

			async wait(confirms = 1, timeout = 0) {
				return provider.waitForTransaction(result.hash, confirms, timeout);
			},

			isMined() {
				return result.blockHash != null;
			},

			async confirmations() {
				if (result.blockNumber == null) return 0;
				const currentBlock = await provider.getBlockNumber();
				return currentBlock - Number(BigInt(result.blockNumber)) + 1;
			},
		};
	}

	/**
	 * Get event tag for deduplication
	 * @param {ProviderEvent} event
	 * @returns {string}
	 */
	#getEventTag(event) {
		if (typeof event === "string") return event;
		return JSON.stringify(event);
	}

	/**
	 * Create a subscriber for an event type
	 * @param {ProviderEvent} event
	 * @returns {Subscriber}
	 */
	#createSubscriber(event) {
		const provider = this;

		if (event === "block") {
			let timer = /** @type {ReturnType<typeof setTimeout> | null} */ (null);
			let lastBlock = -1;
			let running = false;

			return {
				start() {
					if (running) return;
					running = true;
					// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: compatibility layer
					const poll = async () => {
						if (!running) return;
						try {
							const block = await provider.getBlockNumber();
							if (block > lastBlock) {
								lastBlock = block;
								provider.emit("block", block);
							}
						} catch {
							// Ignore poll errors
						}
						if (running) {
							timer = setTimeout(poll, provider.pollingInterval);
						}
					};
					poll();
				},
				stop() {
					running = false;
					if (timer) {
						clearTimeout(timer);
						timer = null;
					}
				},
				pause() {
					this.stop();
				},
				resume() {
					this.start();
				},
			};
		}

		// Default: unmanaged subscriber
		return {
			start() {},
			stop() {},
			pause() {},
			resume() {},
		};
	}
}

export default EthersProvider;
