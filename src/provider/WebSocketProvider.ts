/**
 * WebSocket Provider
 *
 * JSON-RPC provider implementation using WebSocket transport for real-time
 * bidirectional communication. Supports native pub/sub for events.
 *
 * @module provider/WebSocketProvider
 */

import type { Provider } from "./Provider.js";
import type {
	ProviderEvent,
	ProviderEventMap,
	ProviderEvents,
	RequestArguments,
	RequestOptions,
	Response,
} from "./types.js";

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
	// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC response type varies
	private pending = new Map<number, (response: any) => void>();
	// biome-ignore lint/suspicious/noExplicitAny: subscription data type varies
	private subscriptions = new Map<string, Set<(data: any) => void>>();
	private reconnect: boolean;
	private reconnectDelay: number;
	private maxReconnectAttempts: number;
	private reconnectAttempts = 0;
	private reconnectTimeout?: ReturnType<typeof setTimeout>;
	private isConnected = false;
	// biome-ignore lint/suspicious/noExplicitAny: event listener args vary
	private eventListeners: Map<ProviderEvent, Set<(...args: any[]) => void>> =
		new Map();

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
					// Emit connect event - need to get chainId
					this._request<string>("eth_chainId")
						.then((response) => {
							if (response.result) {
								this.emit("connect", { chainId: response.result });
							}
						})
						.catch(() => {
							// Ignore error, just don't emit connect event
						});
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

					// Emit disconnect event
					this.emit("disconnect", {
						code: 4900,
						message: "WebSocket connection closed",
					});

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
	 * EIP-1193 request method (public interface)
	 * Submits JSON-RPC request and returns result or throws RpcError
	 */
	async request(args: RequestArguments): Promise<unknown> {
		// biome-ignore lint/suspicious/noExplicitAny: params type varies
		const response = await this._request(args.method, args.params as any[]);
		if (response.error) {
			throw response.error;
		}
		return response.result;
	}

	/**
	 * Internal request method that handles JSON-RPC communication
	 */
	private async _request<T>(
		method: string,
		// biome-ignore lint/suspicious/noExplicitAny: params type varies
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

			this.ws?.send(request);
		});
	}

	/**
	 * Subscribe to WebSocket event
	 */
	// biome-ignore lint/suspicious/noExplicitAny: params type varies
	private async subscribe(method: string, params: any[] = []): Promise<string> {
		const response = await this._request<string>("eth_subscribe", [
			method,
			...params,
		]);
		if (response.error) {
			throw new Error(response.error.message);
		}
		// biome-ignore lint/style/noNonNullAssertion: result exists if no error
		return response.result!;
	}

	/**
	 * Unsubscribe from WebSocket event
	 */
	private async unsubscribe(subscriptionId: string): Promise<void> {
		await this._request("eth_unsubscribe", [subscriptionId]);
		this.subscriptions.delete(subscriptionId);
	}

	/**
	 * Register event listener (EIP-1193)
	 */
	on<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, new Set());
		}
		// biome-ignore lint/suspicious/noExplicitAny: listener type varies by event
		this.eventListeners.get(event)?.add(listener as any);
		return this;
	}

	/**
	 * Remove event listener (EIP-1193)
	 */
	removeListener<E extends ProviderEvent>(
		event: E,
		listener: (...args: ProviderEventMap[E]) => void,
	): this {
		// biome-ignore lint/suspicious/noExplicitAny: listener type varies by event
		this.eventListeners.get(event)?.delete(listener as any);
		return this;
	}

	/**
	 * Emit event to all listeners (internal use)
	 */
	protected emit<E extends ProviderEvent>(
		event: E,
		...args: ProviderEventMap[E]
	): void {
		const listeners = this.eventListeners.get(event);
		if (listeners) {
			listeners.forEach((listener) => {
				listener(...args);
			});
		}
	}

	// ============================================================================
	// eth Methods (same as HttpProvider)
	// ============================================================================

	eth_accounts(options?: RequestOptions) {
		return this._request<string[]>("eth_accounts", [], options);
	}

	eth_blobBaseFee(options?: RequestOptions) {
		return this._request<string>("eth_blobBaseFee", [], options);
	}

	eth_blockNumber(options?: RequestOptions) {
		return this._request<string>("eth_blockNumber", [], options);
	}

	// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC call params type varies
	eth_call(params: any, blockTag = "latest", options?: RequestOptions) {
		return this._request<string>("eth_call", [params, blockTag], options);
	}

	eth_chainId(options?: RequestOptions) {
		return this._request<string>("eth_chainId", [], options);
	}

	eth_coinbase(options?: RequestOptions) {
		return this._request<string>("eth_coinbase", [], options);
	}

	eth_createAccessList(
		// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC call params type varies
		params: any,
		blockTag = "latest",
		options?: RequestOptions,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC response type varies
		return this._request<any>(
			"eth_createAccessList",
			[params, blockTag],
			options,
		);
	}

	// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC call params type varies
	eth_estimateGas(params: any, options?: RequestOptions) {
		return this._request<string>("eth_estimateGas", [params], options);
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
		// biome-ignore lint/suspicious/noExplicitAny: fee history response structure varies
		return this._request<any>("eth_feeHistory", params, options);
	}

	eth_gasPrice(options?: RequestOptions) {
		return this._request<string>("eth_gasPrice", [], options);
	}

	eth_getBalance(
		address: string,
		blockTag = "latest",
		options?: RequestOptions,
	) {
		return this._request<string>(
			"eth_getBalance",
			[address, blockTag],
			options,
		);
	}

	eth_getBlockByHash(
		blockHash: string,
		fullTransactions = false,
		options?: RequestOptions,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: block response varies by fullTransactions param
		return this._request<any>(
			"eth_getBlockByHash",
			[blockHash, fullTransactions],
			options,
		);
	}

	eth_getBlockByNumber(
		blockTag: string,
		fullTransactions = false,
		options?: RequestOptions,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: block response varies by fullTransactions param
		return this._request<any>(
			"eth_getBlockByNumber",
			[blockTag, fullTransactions],
			options,
		);
	}

	eth_getBlockReceipts(blockTag: string, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: receipt structure varies by transaction type
		return this._request<any[]>("eth_getBlockReceipts", [blockTag], options);
	}

	eth_getBlockTransactionCountByHash(
		blockHash: string,
		options?: RequestOptions,
	) {
		return this._request<string>(
			"eth_getBlockTransactionCountByHash",
			[blockHash],
			options,
		);
	}

	eth_getBlockTransactionCountByNumber(
		blockTag: string,
		options?: RequestOptions,
	) {
		return this._request<string>(
			"eth_getBlockTransactionCountByNumber",
			[blockTag],
			options,
		);
	}

	eth_getCode(address: string, blockTag = "latest", options?: RequestOptions) {
		return this._request<string>("eth_getCode", [address, blockTag], options);
	}

	eth_getFilterChanges(filterId: string, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: filter changes return varying types (logs or block/tx hashes)
		return this._request<any[]>("eth_getFilterChanges", [filterId], options);
	}

	eth_getFilterLogs(filterId: string, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: log objects have dynamic structure
		return this._request<any[]>("eth_getFilterLogs", [filterId], options);
	}

	// biome-ignore lint/suspicious/noExplicitAny: filter params have dynamic structure
	eth_getLogs(params: any, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: log objects have dynamic structure
		return this._request<any[]>("eth_getLogs", [params], options);
	}

	eth_getProof(
		address: string,
		storageKeys: string[],
		blockTag = "latest",
		options?: RequestOptions,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: proof response has complex nested structure
		return this._request<any>(
			"eth_getProof",
			[address, storageKeys, blockTag],
			options,
		);
	}

	eth_getStorageAt(
		address: string,
		position: string,
		blockTag = "latest",
		options?: RequestOptions,
	) {
		return this._request<string>(
			"eth_getStorageAt",
			[address, position, blockTag],
			options,
		);
	}

	eth_getTransactionByBlockHashAndIndex(
		blockHash: string,
		index: string,
		options?: RequestOptions,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC transaction object type
		return this._request<any>(
			"eth_getTransactionByBlockHashAndIndex",
			[blockHash, index],
			options,
		);
	}

	eth_getTransactionByBlockNumberAndIndex(
		blockTag: string,
		index: string,
		options?: RequestOptions,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC transaction object type
		return this._request<any>(
			"eth_getTransactionByBlockNumberAndIndex",
			[blockTag, index],
			options,
		);
	}

	eth_getTransactionByHash(txHash: string, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC transaction object type
		return this._request<any>("eth_getTransactionByHash", [txHash], options);
	}

	eth_getTransactionCount(
		address: string,
		blockTag = "latest",
		options?: RequestOptions,
	) {
		return this._request<string>(
			"eth_getTransactionCount",
			[address, blockTag],
			options,
		);
	}

	eth_getTransactionReceipt(txHash: string, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: JSON-RPC receipt object type
		return this._request<any>("eth_getTransactionReceipt", [txHash], options);
	}

	eth_getUncleCountByBlockHash(blockHash: string, options?: RequestOptions) {
		return this._request<string>(
			"eth_getUncleCountByBlockHash",
			[blockHash],
			options,
		);
	}

	eth_getUncleCountByBlockNumber(blockTag: string, options?: RequestOptions) {
		return this._request<string>(
			"eth_getUncleCountByBlockNumber",
			[blockTag],
			options,
		);
	}

	eth_maxPriorityFeePerGas(options?: RequestOptions) {
		return this._request<string>("eth_maxPriorityFeePerGas", [], options);
	}

	eth_newBlockFilter(options?: RequestOptions) {
		return this._request<string>("eth_newBlockFilter", [], options);
	}

	// biome-ignore lint/suspicious/noExplicitAny: filter params type varies by filter type
	eth_newFilter(params: any, options?: RequestOptions) {
		return this._request<string>("eth_newFilter", [params], options);
	}

	eth_newPendingTransactionFilter(options?: RequestOptions) {
		return this._request<string>(
			"eth_newPendingTransactionFilter",
			[],
			options,
		);
	}

	eth_sendRawTransaction(signedTx: string, options?: RequestOptions) {
		return this._request<string>("eth_sendRawTransaction", [signedTx], options);
	}

	// biome-ignore lint/suspicious/noExplicitAny: transaction params type varies by tx type
	eth_sendTransaction(params: any, options?: RequestOptions) {
		return this._request<string>("eth_sendTransaction", [params], options);
	}

	eth_sign(address: string, data: string, options?: RequestOptions) {
		return this._request<string>("eth_sign", [address, data], options);
	}

	// biome-ignore lint/suspicious/noExplicitAny: transaction params type varies by tx type
	eth_signTransaction(params: any, options?: RequestOptions) {
		return this._request<string>("eth_signTransaction", [params], options);
	}

	// biome-ignore lint/suspicious/noExplicitAny: simulation params and response types are complex
	eth_simulateV1(params: any, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: simulation response type is complex
		return this._request<any>("eth_simulateV1", [params], options);
	}

	eth_syncing(options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: syncing returns false or complex sync status object
		return this._request<any>("eth_syncing", [], options);
	}

	eth_uninstallFilter(filterId: string, options?: RequestOptions) {
		return this._request<boolean>("eth_uninstallFilter", [filterId], options);
	}

	// ============================================================================
	// debug Methods
	// ============================================================================

	debug_traceTransaction(
		txHash: string,
		// biome-ignore lint/suspicious/noExplicitAny: trace options vary by tracer type
		traceOptions?: any,
		options?: RequestOptions,
	) {
		const params = traceOptions ? [txHash, traceOptions] : [txHash];
		// biome-ignore lint/suspicious/noExplicitAny: trace result varies by tracer type
		return this._request<any>("debug_traceTransaction", params, options);
	}

	debug_traceBlockByNumber(
		blockTag: string,
		// biome-ignore lint/suspicious/noExplicitAny: trace options vary by tracer type
		traceOptions?: any,
		options?: RequestOptions,
	) {
		const params = traceOptions ? [blockTag, traceOptions] : [blockTag];
		// biome-ignore lint/suspicious/noExplicitAny: trace result varies by tracer type
		return this._request<any[]>("debug_traceBlockByNumber", params, options);
	}

	debug_traceBlockByHash(
		blockHash: string,
		// biome-ignore lint/suspicious/noExplicitAny: trace options vary by tracer type
		traceOptions?: any,
		options?: RequestOptions,
	) {
		const params = traceOptions ? [blockHash, traceOptions] : [blockHash];
		// biome-ignore lint/suspicious/noExplicitAny: trace result varies by tracer type
		return this._request<any[]>("debug_traceBlockByHash", params, options);
	}

	debug_traceCall(
		// biome-ignore lint/suspicious/noExplicitAny: call params type varies
		params: any,
		blockTag = "latest",
		// biome-ignore lint/suspicious/noExplicitAny: trace options vary by tracer type
		traceOptions?: any,
		options?: RequestOptions,
	) {
		const rpcParams = traceOptions
			? [params, blockTag, traceOptions]
			: [params, blockTag];
		// biome-ignore lint/suspicious/noExplicitAny: trace result varies by tracer type
		return this._request<any>("debug_traceCall", rpcParams, options);
	}

	debug_getRawBlock(blockTag: string, options?: RequestOptions) {
		return this._request<string>("debug_getRawBlock", [blockTag], options);
	}

	// ============================================================================
	// engine Methods
	// ============================================================================

	// biome-ignore lint/suspicious/noExplicitAny: Engine API payload structure varies by version
	engine_newPayloadV1(payload: any, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
		return this._request<any>("engine_newPayloadV1", [payload], options);
	}

	// biome-ignore lint/suspicious/noExplicitAny: Engine API payload structure varies by version
	engine_newPayloadV2(payload: any, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
		return this._request<any>("engine_newPayloadV2", [payload], options);
	}

	engine_newPayloadV3(
		// biome-ignore lint/suspicious/noExplicitAny: Engine API payload structure varies by version
		payload: any,
		expectedBlobVersionedHashes?: string[],
		parentBeaconBlockRoot?: string,
		options?: RequestOptions,
	) {
		const params = [payload];
		if (expectedBlobVersionedHashes) params.push(expectedBlobVersionedHashes);
		if (parentBeaconBlockRoot) params.push(parentBeaconBlockRoot);
		// biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
		return this._request<any>("engine_newPayloadV3", params, options);
	}

	engine_forkchoiceUpdatedV1(
		// biome-ignore lint/suspicious/noExplicitAny: Engine API forkchoice state structure
		forkchoiceState: any,
		// biome-ignore lint/suspicious/noExplicitAny: Engine API payload attributes vary by version
		payloadAttributes?: any,
		options?: RequestOptions,
	) {
		const params = payloadAttributes
			? [forkchoiceState, payloadAttributes]
			: [forkchoiceState];
		// biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
		return this._request<any>("engine_forkchoiceUpdatedV1", params, options);
	}

	engine_forkchoiceUpdatedV2(
		// biome-ignore lint/suspicious/noExplicitAny: Engine API forkchoice state structure
		forkchoiceState: any,
		// biome-ignore lint/suspicious/noExplicitAny: Engine API payload attributes vary by version
		payloadAttributes?: any,
		options?: RequestOptions,
	) {
		const params = payloadAttributes
			? [forkchoiceState, payloadAttributes]
			: [forkchoiceState];
		// biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
		return this._request<any>("engine_forkchoiceUpdatedV2", params, options);
	}

	engine_forkchoiceUpdatedV3(
		// biome-ignore lint/suspicious/noExplicitAny: Engine API forkchoice state structure
		forkchoiceState: any,
		// biome-ignore lint/suspicious/noExplicitAny: Engine API payload attributes vary by version
		payloadAttributes?: any,
		options?: RequestOptions,
	) {
		const params = payloadAttributes
			? [forkchoiceState, payloadAttributes]
			: [forkchoiceState];
		// biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
		return this._request<any>("engine_forkchoiceUpdatedV3", params, options);
	}

	engine_getPayloadV1(payloadId: string, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: Engine API payload type varies by version
		return this._request<any>("engine_getPayloadV1", [payloadId], options);
	}

	engine_getPayloadV2(payloadId: string, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: Engine API payload type varies by version
		return this._request<any>("engine_getPayloadV2", [payloadId], options);
	}

	engine_getPayloadV3(payloadId: string, options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: Engine API payload type varies by version
		return this._request<any>("engine_getPayloadV3", [payloadId], options);
	}

	engine_getBlobsV1(blobVersionedHashes: string[], options?: RequestOptions) {
		// biome-ignore lint/suspicious/noExplicitAny: Blob response type varies
		return this._request<any[]>(
			"engine_getBlobsV1",
			[blobVersionedHashes],
			options,
		);
	}

	engine_exchangeCapabilities(
		capabilities: string[],
		options?: RequestOptions,
	) {
		return this._request<string[]>(
			"engine_exchangeCapabilities",
			[capabilities],
			options,
		);
	}

	engine_exchangeTransitionConfigurationV1(
		// biome-ignore lint/suspicious/noExplicitAny: Engine API transition config type not yet defined
		config: any,
		options?: RequestOptions,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: Engine API response type not yet defined
		return this._request<any>(
			"engine_exchangeTransitionConfigurationV1",
			[config],
			options,
		);
	}

	engine_getPayloadBodiesByHashV1(
		blockHashes: string[],
		options?: RequestOptions,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: Engine API payload body type not yet defined
		return this._request<any[]>(
			"engine_getPayloadBodiesByHashV1",
			[blockHashes],
			options,
		);
	}

	engine_getPayloadBodiesByRangeV1(
		start: string,
		count: string,
		options?: RequestOptions,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: Engine API payload body type not yet defined
		return this._request<any[]>(
			"engine_getPayloadBodiesByRangeV1",
			[start, count],
			options,
		);
	}

	// ============================================================================
	// Events (Native WebSocket subscriptions)
	// ============================================================================

	events: ProviderEvents = {
		newHeads: async function* (this: WebSocketProvider) {
			const subscriptionId = await this.subscribe("newHeads");
			// biome-ignore lint/suspicious/noExplicitAny: subscription data is dynamically typed from RPC
			const queue: any[] = [];
			// biome-ignore lint/suspicious/noExplicitAny: resolve callback accepts dynamic RPC data
			let resolve: ((value: any) => void) | null = null;

			// biome-ignore lint/suspicious/noExplicitAny: callback data is dynamically typed from RPC
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
			this.subscriptions.get(subscriptionId)?.add(callback);

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

		// biome-ignore lint/suspicious/noExplicitAny: WebSocket log subscription params are dynamic
		logs: async function* (this: WebSocketProvider, params?: any) {
			const subscriptionId = await this.subscribe(
				"logs",
				params ? [params] : [],
			);
			// biome-ignore lint/suspicious/noExplicitAny: Log event data structure varies by filter
			const queue: any[] = [];
			// biome-ignore lint/suspicious/noExplicitAny: Generic promise resolution
			let resolve: ((value: any) => void) | null = null;

			// biome-ignore lint/suspicious/noExplicitAny: Log event callback data is dynamic
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
			this.subscriptions.get(subscriptionId)?.add(callback);

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
			// biome-ignore lint/suspicious/noExplicitAny: WebSocket subscription data types vary by event
			const queue: any[] = [];
			// biome-ignore lint/suspicious/noExplicitAny: Promise resolve callback for dynamic subscription data
			let resolve: ((value: any) => void) | null = null;

			// biome-ignore lint/suspicious/noExplicitAny: WebSocket subscription callback receives dynamic data
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
			this.subscriptions.get(subscriptionId)?.add(callback);

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
			// biome-ignore lint/suspicious/noExplicitAny: WebSocket syncing data structure varies
			const queue: any[] = [];
			// biome-ignore lint/suspicious/noExplicitAny: Promise resolver accepts syncing status data
			let resolve: ((value: any) => void) | null = null;

			// biome-ignore lint/suspicious/noExplicitAny: Subscription callback receives dynamic syncing data
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
			this.subscriptions.get(subscriptionId)?.add(callback);

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
