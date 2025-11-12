/**
 * WebSocket Provider
 *
 * JSON-RPC provider implementation using WebSocket transport for real-time
 * bidirectional communication. Supports native pub/sub for events.
 *
 * @module provider/WebSocketProvider
 */

import type { Provider } from "./Provider.js";
import type { Response, RequestOptions, ProviderEvents } from "./types.js";

/**
 * WebSocket configuration options
 */
export interface WebSocketProviderOptions {
	/** WebSocket endpoint URL */
	url: string;
	/** WebSocket protocols */
	protocols?: string | string[];
	/** Reconnect automatically on disconnect */
	reconnect?: boolean;
	/** Reconnect delay in ms */
	reconnectDelay?: number;
	/** Max reconnect attempts (0 = infinite) */
	maxReconnectAttempts?: number;
}

/**
 * WebSocket Provider implementation
 *
 * Implements Provider interface using WebSocket transport for real-time
 * communication. Supports native pub/sub subscriptions for events.
 *
 * @example
 * ```typescript
 * const provider = new WebSocketProvider({
 *   url: 'wss://eth.example.com',
 *   reconnect: true
 * });
 *
 * await provider.connect();
 *
 * const blockNumber = await provider.eth_blockNumber();
 * console.log('Block:', blockNumber.result);
 * ```
 */
export class WebSocketProvider implements Provider {
	private url: string;
	private protocols?: string | string[];
	private ws: WebSocket | null = null;
	private requestId = 0;
	private pending = new Map<number, (response: any) => void>();
	private subscriptions = new Map<string, Set<(data: any) => void>>();
	private reconnect: boolean;
	private reconnectDelay: number;
	private maxReconnectAttempts: number;
	private reconnectAttempts = 0;
	private reconnectTimeout?: ReturnType<typeof setTimeout>;
	private isConnected = false;

	constructor(options: WebSocketProviderOptions | string) {
		if (typeof options === "string") {
			this.url = options;
			this.reconnect = true;
			this.reconnectDelay = 5000;
			this.maxReconnectAttempts = 0;
		} else {
			this.url = options.url;
			this.protocols = options.protocols;
			this.reconnect = options.reconnect ?? true;
			this.reconnectDelay = options.reconnectDelay ?? 5000;
			this.maxReconnectAttempts = options.maxReconnectAttempts ?? 0;
		}
	}

	/**
	 * Connect to WebSocket server
	 */
	async connect(): Promise<void> {
		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(this.url, this.protocols);

				this.ws.onopen = () => {
					this.isConnected = true;
					this.reconnectAttempts = 0;
					if (this.reconnectTimeout) {
						clearTimeout(this.reconnectTimeout);
						this.reconnectTimeout = undefined;
					}
					resolve();
				};

				this.ws.onmessage = (event) => {
					const message = JSON.parse(event.data);

					// Handle subscription notifications
					if (message.method === "eth_subscription") {
						const subscriptionId = message.params.subscription;
						const callbacks = this.subscriptions.get(subscriptionId);
						if (callbacks) {
							for (const callback of callbacks) {
								callback(message.params.result);
							}
						}
						return;
					}

					// Handle RPC responses
					const callback = this.pending.get(message.id);
					if (callback) {
						callback(message);
						this.pending.delete(message.id);
					}
				};

				this.ws.onerror = (error) => {
					if (!this.isConnected) {
						reject(error);
					}
				};

				this.ws.onclose = () => {
					this.isConnected = false;

					// Attempt reconnection
					if (
						this.reconnect &&
						(this.maxReconnectAttempts === 0 ||
							this.reconnectAttempts < this.maxReconnectAttempts)
					) {
						this.reconnectAttempts++;
						this.reconnectTimeout = setTimeout(() => {
							this.connect().catch(() => {
								// Reconnection failed, will try again
							});
						}, this.reconnectDelay);
					}
				};
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Disconnect from WebSocket server
	 */
	disconnect(): void {
		this.reconnect = false;
		if (this.reconnectTimeout) {
			clearTimeout(this.reconnectTimeout);
		}
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.isConnected = false;
	}

	/**
	 * Internal request method that handles JSON-RPC communication
	 */
	private async request<T>(
		method: string,
		params: any[] = [],
		options?: RequestOptions,
	): Promise<Response<T>> {
		if (!this.isConnected || !this.ws) {
			return {
				error: {
					code: -32603,
					message: "WebSocket not connected",
				},
			};
		}

		const timeout = options?.timeout ?? 30000;
		const id = ++this.requestId;

		const request = JSON.stringify({
			jsonrpc: "2.0",
			id,
			method,
			params,
		});

		return new Promise((resolve) => {
			const timeoutId = setTimeout(() => {
				this.pending.delete(id);
				resolve({
					error: {
						code: -32603,
						message: `Request timeout after ${timeout}ms`,
					},
				});
			}, timeout);

			this.pending.set(id, (response) => {
				clearTimeout(timeoutId);

				if (response.error) {
					resolve({ error: response.error });
				} else {
					resolve({ result: response.result });
				}
			});

			this.ws!.send(request);
		});
	}

	/**
	 * Subscribe to WebSocket event
	 */
	private async subscribe(method: string, params: any[] = []): Promise<string> {
		const response = await this.request<string>("eth_subscribe", [method, ...params]);
		if (response.error) {
			throw new Error(response.error.message);
		}
		return response.result;
	}

	/**
	 * Unsubscribe from WebSocket event
	 */
	private async unsubscribe(subscriptionId: string): Promise<void> {
		await this.request("eth_unsubscribe", [subscriptionId]);
		this.subscriptions.delete(subscriptionId);
	}

	// ============================================================================
	// eth Methods (same as HttpProvider)
	// ============================================================================

	eth_accounts(options?: RequestOptions) {
		return this.request<string[]>("eth_accounts", [], options);
	}

	eth_blobBaseFee(options?: RequestOptions) {
		return this.request<string>("eth_blobBaseFee", [], options);
	}

	eth_blockNumber(options?: RequestOptions) {
		return this.request<string>("eth_blockNumber", [], options);
	}

	eth_call(params: any, blockTag = "latest", options?: RequestOptions) {
		return this.request<string>("eth_call", [params, blockTag], options);
	}

	eth_chainId(options?: RequestOptions) {
		return this.request<string>("eth_chainId", [], options);
	}

	eth_coinbase(options?: RequestOptions) {
		return this.request<string>("eth_coinbase", [], options);
	}

	eth_createAccessList(params: any, blockTag = "latest", options?: RequestOptions) {
		return this.request<any>("eth_createAccessList", [params, blockTag], options);
	}

	eth_estimateGas(params: any, options?: RequestOptions) {
		return this.request<string>("eth_estimateGas", [params], options);
	}

	eth_feeHistory(
		blockCount: string,
		newestBlock: string,
		rewardPercentiles?: number[],
		options?: RequestOptions,
	) {
		const params = rewardPercentiles
			? [blockCount, newestBlock, rewardPercentiles]
			: [blockCount, newestBlock];
		return this.request<any>("eth_feeHistory", params, options);
	}

	eth_gasPrice(options?: RequestOptions) {
		return this.request<string>("eth_gasPrice", [], options);
	}

	eth_getBalance(address: string, blockTag = "latest", options?: RequestOptions) {
		return this.request<string>("eth_getBalance", [address, blockTag], options);
	}

	eth_getBlockByHash(
		blockHash: string,
		fullTransactions = false,
		options?: RequestOptions,
	) {
		return this.request<any>("eth_getBlockByHash", [blockHash, fullTransactions], options);
	}

	eth_getBlockByNumber(
		blockTag: string,
		fullTransactions = false,
		options?: RequestOptions,
	) {
		return this.request<any>("eth_getBlockByNumber", [blockTag, fullTransactions], options);
	}

	eth_getBlockReceipts(blockTag: string, options?: RequestOptions) {
		return this.request<any[]>("eth_getBlockReceipts", [blockTag], options);
	}

	eth_getBlockTransactionCountByHash(blockHash: string, options?: RequestOptions) {
		return this.request<string>("eth_getBlockTransactionCountByHash", [blockHash], options);
	}

	eth_getBlockTransactionCountByNumber(blockTag: string, options?: RequestOptions) {
		return this.request<string>("eth_getBlockTransactionCountByNumber", [blockTag], options);
	}

	eth_getCode(address: string, blockTag = "latest", options?: RequestOptions) {
		return this.request<string>("eth_getCode", [address, blockTag], options);
	}

	eth_getFilterChanges(filterId: string, options?: RequestOptions) {
		return this.request<any[]>("eth_getFilterChanges", [filterId], options);
	}

	eth_getFilterLogs(filterId: string, options?: RequestOptions) {
		return this.request<any[]>("eth_getFilterLogs", [filterId], options);
	}

	eth_getLogs(params: any, options?: RequestOptions) {
		return this.request<any[]>("eth_getLogs", [params], options);
	}

	eth_getProof(
		address: string,
		storageKeys: string[],
		blockTag = "latest",
		options?: RequestOptions,
	) {
		return this.request<any>("eth_getProof", [address, storageKeys, blockTag], options);
	}

	eth_getStorageAt(
		address: string,
		position: string,
		blockTag = "latest",
		options?: RequestOptions,
	) {
		return this.request<string>("eth_getStorageAt", [address, position, blockTag], options);
	}

	eth_getTransactionByBlockHashAndIndex(
		blockHash: string,
		index: string,
		options?: RequestOptions,
	) {
		return this.request<any>("eth_getTransactionByBlockHashAndIndex", [blockHash, index], options);
	}

	eth_getTransactionByBlockNumberAndIndex(
		blockTag: string,
		index: string,
		options?: RequestOptions,
	) {
		return this.request<any>("eth_getTransactionByBlockNumberAndIndex", [blockTag, index], options);
	}

	eth_getTransactionByHash(txHash: string, options?: RequestOptions) {
		return this.request<any>("eth_getTransactionByHash", [txHash], options);
	}

	eth_getTransactionCount(address: string, blockTag = "latest", options?: RequestOptions) {
		return this.request<string>("eth_getTransactionCount", [address, blockTag], options);
	}

	eth_getTransactionReceipt(txHash: string, options?: RequestOptions) {
		return this.request<any>("eth_getTransactionReceipt", [txHash], options);
	}

	eth_getUncleCountByBlockHash(blockHash: string, options?: RequestOptions) {
		return this.request<string>("eth_getUncleCountByBlockHash", [blockHash], options);
	}

	eth_getUncleCountByBlockNumber(blockTag: string, options?: RequestOptions) {
		return this.request<string>("eth_getUncleCountByBlockNumber", [blockTag], options);
	}

	eth_maxPriorityFeePerGas(options?: RequestOptions) {
		return this.request<string>("eth_maxPriorityFeePerGas", [], options);
	}

	eth_newBlockFilter(options?: RequestOptions) {
		return this.request<string>("eth_newBlockFilter", [], options);
	}

	eth_newFilter(params: any, options?: RequestOptions) {
		return this.request<string>("eth_newFilter", [params], options);
	}

	eth_newPendingTransactionFilter(options?: RequestOptions) {
		return this.request<string>("eth_newPendingTransactionFilter", [], options);
	}

	eth_sendRawTransaction(signedTx: string, options?: RequestOptions) {
		return this.request<string>("eth_sendRawTransaction", [signedTx], options);
	}

	eth_sendTransaction(params: any, options?: RequestOptions) {
		return this.request<string>("eth_sendTransaction", [params], options);
	}

	eth_sign(address: string, data: string, options?: RequestOptions) {
		return this.request<string>("eth_sign", [address, data], options);
	}

	eth_signTransaction(params: any, options?: RequestOptions) {
		return this.request<string>("eth_signTransaction", [params], options);
	}

	eth_simulateV1(params: any, options?: RequestOptions) {
		return this.request<any>("eth_simulateV1", [params], options);
	}

	eth_syncing(options?: RequestOptions) {
		return this.request<any>("eth_syncing", [], options);
	}

	eth_uninstallFilter(filterId: string, options?: RequestOptions) {
		return this.request<boolean>("eth_uninstallFilter", [filterId], options);
	}

	// ============================================================================
	// debug Methods
	// ============================================================================

	debug_traceTransaction(
		txHash: string,
		traceOptions?: any,
		options?: RequestOptions,
	) {
		const params = traceOptions ? [txHash, traceOptions] : [txHash];
		return this.request<any>("debug_traceTransaction", params, options);
	}

	debug_traceBlockByNumber(
		blockTag: string,
		traceOptions?: any,
		options?: RequestOptions,
	) {
		const params = traceOptions ? [blockTag, traceOptions] : [blockTag];
		return this.request<any[]>("debug_traceBlockByNumber", params, options);
	}

	debug_traceBlockByHash(
		blockHash: string,
		traceOptions?: any,
		options?: RequestOptions,
	) {
		const params = traceOptions ? [blockHash, traceOptions] : [blockHash];
		return this.request<any[]>("debug_traceBlockByHash", params, options);
	}

	debug_traceCall(
		params: any,
		blockTag = "latest",
		traceOptions?: any,
		options?: RequestOptions,
	) {
		const rpcParams = traceOptions ? [params, blockTag, traceOptions] : [params, blockTag];
		return this.request<any>("debug_traceCall", rpcParams, options);
	}

	debug_getRawBlock(blockTag: string, options?: RequestOptions) {
		return this.request<string>("debug_getRawBlock", [blockTag], options);
	}

	// ============================================================================
	// engine Methods
	// ============================================================================

	engine_newPayloadV1(payload: any, options?: RequestOptions) {
		return this.request<any>("engine_newPayloadV1", [payload], options);
	}

	engine_newPayloadV2(payload: any, options?: RequestOptions) {
		return this.request<any>("engine_newPayloadV2", [payload], options);
	}

	engine_newPayloadV3(
		payload: any,
		expectedBlobVersionedHashes?: string[],
		parentBeaconBlockRoot?: string,
		options?: RequestOptions,
	) {
		const params = [payload];
		if (expectedBlobVersionedHashes) params.push(expectedBlobVersionedHashes);
		if (parentBeaconBlockRoot) params.push(parentBeaconBlockRoot);
		return this.request<any>("engine_newPayloadV3", params, options);
	}

	engine_forkchoiceUpdatedV1(
		forkchoiceState: any,
		payloadAttributes?: any,
		options?: RequestOptions,
	) {
		const params = payloadAttributes
			? [forkchoiceState, payloadAttributes]
			: [forkchoiceState];
		return this.request<any>("engine_forkchoiceUpdatedV1", params, options);
	}

	engine_forkchoiceUpdatedV2(
		forkchoiceState: any,
		payloadAttributes?: any,
		options?: RequestOptions,
	) {
		const params = payloadAttributes
			? [forkchoiceState, payloadAttributes]
			: [forkchoiceState];
		return this.request<any>("engine_forkchoiceUpdatedV2", params, options);
	}

	engine_forkchoiceUpdatedV3(
		forkchoiceState: any,
		payloadAttributes?: any,
		options?: RequestOptions,
	) {
		const params = payloadAttributes
			? [forkchoiceState, payloadAttributes]
			: [forkchoiceState];
		return this.request<any>("engine_forkchoiceUpdatedV3", params, options);
	}

	engine_getPayloadV1(payloadId: string, options?: RequestOptions) {
		return this.request<any>("engine_getPayloadV1", [payloadId], options);
	}

	engine_getPayloadV2(payloadId: string, options?: RequestOptions) {
		return this.request<any>("engine_getPayloadV2", [payloadId], options);
	}

	engine_getPayloadV3(payloadId: string, options?: RequestOptions) {
		return this.request<any>("engine_getPayloadV3", [payloadId], options);
	}

	engine_getBlobsV1(blobVersionedHashes: string[], options?: RequestOptions) {
		return this.request<any[]>("engine_getBlobsV1", [blobVersionedHashes], options);
	}

	engine_exchangeCapabilities(capabilities: string[], options?: RequestOptions) {
		return this.request<string[]>("engine_exchangeCapabilities", [capabilities], options);
	}

	engine_exchangeTransitionConfigurationV1(config: any, options?: RequestOptions) {
		return this.request<any>("engine_exchangeTransitionConfigurationV1", [config], options);
	}

	engine_getPayloadBodiesByHashV1(blockHashes: string[], options?: RequestOptions) {
		return this.request<any[]>("engine_getPayloadBodiesByHashV1", [blockHashes], options);
	}

	engine_getPayloadBodiesByRangeV1(
		start: string,
		count: string,
		options?: RequestOptions,
	) {
		return this.request<any[]>("engine_getPayloadBodiesByRangeV1", [start, count], options);
	}

	// ============================================================================
	// Events (Native WebSocket subscriptions)
	// ============================================================================

	events: ProviderEvents = {
		newHeads: async function* (this: WebSocketProvider) {
			const subscriptionId = await this.subscribe("newHeads");
			const queue: any[] = [];
			let resolve: ((value: any) => void) | null = null;

			const callback = (data: any) => {
				if (resolve) {
					resolve(data);
					resolve = null;
				} else {
					queue.push(data);
				}
			};

			if (!this.subscriptions.has(subscriptionId)) {
				this.subscriptions.set(subscriptionId, new Set());
			}
			this.subscriptions.get(subscriptionId)!.add(callback);

			try {
				while (true) {
					if (queue.length > 0) {
						yield queue.shift();
					} else {
						yield await new Promise((r) => {
							resolve = r;
						});
					}
				}
			} finally {
				await this.unsubscribe(subscriptionId);
			}
		}.bind(this),

		logs: async function* (this: WebSocketProvider, params?: any) {
			const subscriptionId = await this.subscribe("logs", params ? [params] : []);
			const queue: any[] = [];
			let resolve: ((value: any) => void) | null = null;

			const callback = (data: any) => {
				if (resolve) {
					resolve(data);
					resolve = null;
				} else {
					queue.push(data);
				}
			};

			if (!this.subscriptions.has(subscriptionId)) {
				this.subscriptions.set(subscriptionId, new Set());
			}
			this.subscriptions.get(subscriptionId)!.add(callback);

			try {
				while (true) {
					if (queue.length > 0) {
						yield queue.shift();
					} else {
						yield await new Promise((r) => {
							resolve = r;
						});
					}
				}
			} finally {
				await this.unsubscribe(subscriptionId);
			}
		}.bind(this),

		newPendingTransactions: async function* (this: WebSocketProvider) {
			const subscriptionId = await this.subscribe("newPendingTransactions");
			const queue: any[] = [];
			let resolve: ((value: any) => void) | null = null;

			const callback = (data: any) => {
				if (resolve) {
					resolve(data);
					resolve = null;
				} else {
					queue.push(data);
				}
			};

			if (!this.subscriptions.has(subscriptionId)) {
				this.subscriptions.set(subscriptionId, new Set());
			}
			this.subscriptions.get(subscriptionId)!.add(callback);

			try {
				while (true) {
					if (queue.length > 0) {
						yield queue.shift();
					} else {
						yield await new Promise((r) => {
							resolve = r;
						});
					}
				}
			} finally {
				await this.unsubscribe(subscriptionId);
			}
		}.bind(this),

		syncing: async function* (this: WebSocketProvider) {
			const subscriptionId = await this.subscribe("syncing");
			const queue: any[] = [];
			let resolve: ((value: any) => void) | null = null;

			const callback = (data: any) => {
				if (resolve) {
					resolve(data);
					resolve = null;
				} else {
					queue.push(data);
				}
			};

			if (!this.subscriptions.has(subscriptionId)) {
				this.subscriptions.set(subscriptionId, new Set());
			}
			this.subscriptions.get(subscriptionId)!.add(callback);

			try {
				while (true) {
					if (queue.length > 0) {
						yield queue.shift();
					} else {
						yield await new Promise((r) => {
							resolve = r;
						});
					}
				}
			} finally {
				await this.unsubscribe(subscriptionId);
			}
		}.bind(this),
	};
}
