/**
 * HTTP Provider
 *
 * JSON-RPC provider implementation using HTTP transport with fetch API.
 * Supports request/response model with configurable timeout and retries.
 *
 * @module provider/HttpProvider
 */

import type { Provider } from "./Provider.js";
import type { Response, RequestOptions, ProviderEvents } from "./types.js";

/**
 * HTTP configuration options
 */
export interface HttpProviderOptions {
	/** JSON-RPC endpoint URL */
	url: string;
	/** Optional HTTP headers */
	headers?: Record<string, string>;
	/** Default request timeout in ms */
	timeout?: number;
	/** Default retry attempts */
	retry?: number;
	/** Default retry delay in ms */
	retryDelay?: number;
}

/**
 * HTTP Provider implementation
 *
 * Implements Provider interface using HTTP transport via fetch API.
 * All methods return Response<T> containing either result or error.
 *
 * @example
 * ```typescript
 * const provider = new HttpProvider({
 *   url: 'https://eth.example.com',
 *   timeout: 30000
 * });
 *
 * const blockNumber = await provider.eth_blockNumber();
 * if (!blockNumber.error) {
 *   console.log('Block:', blockNumber.result);
 * }
 * ```
 */
export class HttpProvider implements Provider {
	private url: string;
	private headers: Record<string, string>;
	private defaultTimeout: number;
	private defaultRetry: number;
	private defaultRetryDelay: number;
	private requestId = 0;

	constructor(options: HttpProviderOptions | string) {
		if (typeof options === "string") {
			this.url = options;
			this.headers = { "Content-Type": "application/json" };
			this.defaultTimeout = 30000;
			this.defaultRetry = 3;
			this.defaultRetryDelay = 1000;
		} else {
			this.url = options.url;
			this.headers = {
				"Content-Type": "application/json",
				...options.headers,
			};
			this.defaultTimeout = options.timeout ?? 30000;
			this.defaultRetry = options.retry ?? 3;
			this.defaultRetryDelay = options.retryDelay ?? 1000;
		}
	}

	/**
	 * Internal request method that handles JSON-RPC communication
	 */
	private async request<T>(
		method: string,
		params: any[] = [],
		options?: RequestOptions,
	): Promise<Response<T>> {
		const timeout = options?.timeout ?? this.defaultTimeout;
		const retry = options?.retry ?? this.defaultRetry;
		const retryDelay = options?.retryDelay ?? this.defaultRetryDelay;

		const body = JSON.stringify({
			jsonrpc: "2.0",
			id: ++this.requestId,
			method,
			params,
		});

		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= retry; attempt++) {
			try {
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeout);

				const response = await fetch(this.url, {
					method: "POST",
					headers: this.headers,
					body,
					signal: controller.signal,
				});

				clearTimeout(timeoutId);

				if (!response.ok) {
					return {
						error: {
							code: -32603,
							message: `HTTP ${response.status}: ${response.statusText}`,
						},
					};
				}

				const json: any = await response.json();

				if (json.error) {
					return { error: json.error };
				}

				return { result: json.result };
			} catch (error) {
				lastError = error as Error;

				// Don't retry on abort (timeout)
				if (lastError.name === "AbortError") {
					return {
						error: {
							code: -32603,
							message: `Request timeout after ${timeout}ms`,
						},
					};
				}

				// Retry on network errors
				if (attempt < retry) {
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
					continue;
				}
			}
		}

		return {
			error: {
				code: -32603,
				message: lastError?.message ?? "Request failed",
			},
		};
	}

	// ============================================================================
	// eth Methods
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
	// Events (Polling-based for HTTP)
	// ============================================================================

	events: ProviderEvents = {
		newHeads: async function* (this: HttpProvider) {
			// HTTP providers use polling for events
			let lastBlock = await this.eth_blockNumber();
			if (lastBlock.error) {
				throw new Error(`Failed to get initial block: ${lastBlock.error.message}`);
			}

			while (true) {
				await new Promise((resolve) => setTimeout(resolve, 1000));

				const currentBlock = await this.eth_blockNumber();
				if (currentBlock.error) continue;

				if (currentBlock.result !== lastBlock.result) {
					const block = await this.eth_getBlockByNumber(currentBlock.result, false);
					if (!block.error && block.result) {
						yield block.result;
						lastBlock = currentBlock;
					}
				}
			}
		}.bind(this),

		logs: async function* (this: HttpProvider, params?: any) {
			// Polling-based log subscription
			const filterId = await this.eth_newFilter(params ?? {});
			if (filterId.error) {
				throw new Error(`Failed to create filter: ${filterId.error.message}`);
			}

			try {
				while (true) {
					await new Promise((resolve) => setTimeout(resolve, 1000));

					const changes = await this.eth_getFilterChanges(filterId.result);
					if (!changes.error && changes.result) {
						for (const log of changes.result) {
							yield log;
						}
					}
				}
			} finally {
				await this.eth_uninstallFilter(filterId.result);
			}
		}.bind(this),

		newPendingTransactions: async function* (this: HttpProvider) {
			// Polling-based pending transaction subscription
			const filterId = await this.eth_newPendingTransactionFilter();
			if (filterId.error) {
				throw new Error(`Failed to create filter: ${filterId.error.message}`);
			}

			try {
				while (true) {
					await new Promise((resolve) => setTimeout(resolve, 1000));

					const changes = await this.eth_getFilterChanges(filterId.result);
					if (!changes.error && changes.result) {
						for (const txHash of changes.result) {
							yield txHash;
						}
					}
				}
			} finally {
				await this.eth_uninstallFilter(filterId.result);
			}
		}.bind(this),

		syncing: async function* (this: HttpProvider) {
			// Poll sync status
			while (true) {
				const status = await this.eth_syncing();
				if (!status.error) {
					yield status.result;
				}
				await new Promise((resolve) => setTimeout(resolve, 5000));
			}
		}.bind(this),
	};
}
