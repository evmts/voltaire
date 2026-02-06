/**
 * WebSocket Provider
 *
 * JSON-RPC provider implementation using WebSocket transport for real-time
 * bidirectional communication. Supports native pub/sub for events.
 *
 * @module provider/WebSocketProvider
 */
import type { Provider } from "./Provider.js";
import type { ProviderEvent, ProviderEventMap, ProviderEvents, RequestArguments, RequestOptions, Response } from "./types.js";
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
export declare class WebSocketProvider implements Provider {
    private url;
    private protocols?;
    private ws;
    private requestId;
    private pending;
    private subscriptions;
    private reconnect;
    private reconnectDelay;
    private maxReconnectAttempts;
    private reconnectAttempts;
    private reconnectTimeout?;
    private isConnected;
    private eventListeners;
    constructor(options: WebSocketProviderOptions | string);
    /**
     * Connect to WebSocket server
     */
    connect(): Promise<void>;
    /**
     * Disconnect from WebSocket server
     */
    disconnect(): void;
    /**
     * EIP-1193 request method (public interface)
     * Submits JSON-RPC request and returns result or throws RpcError
     */
    request(args: RequestArguments): Promise<unknown>;
    /**
     * Internal request method that handles JSON-RPC communication
     */
    private _request;
    /**
     * Subscribe to WebSocket event
     */
    private subscribe;
    /**
     * Unsubscribe from WebSocket event
     */
    private unsubscribe;
    /**
     * Register event listener (EIP-1193)
     */
    on<E extends ProviderEvent>(event: E, listener: (...args: ProviderEventMap[E]) => void): this;
    /**
     * Remove event listener (EIP-1193)
     */
    removeListener<E extends ProviderEvent>(event: E, listener: (...args: ProviderEventMap[E]) => void): this;
    /**
     * Emit event to all listeners (internal use)
     */
    protected emit<E extends ProviderEvent>(event: E, ...args: ProviderEventMap[E]): void;
    eth_accounts(options?: RequestOptions): Promise<Response<string[]>>;
    eth_blobBaseFee(options?: RequestOptions): Promise<Response<string>>;
    eth_blockNumber(options?: RequestOptions): Promise<Response<string>>;
    eth_call(params: any, blockTag?: string, options?: RequestOptions): Promise<Response<string>>;
    eth_chainId(options?: RequestOptions): Promise<Response<string>>;
    eth_coinbase(options?: RequestOptions): Promise<Response<string>>;
    eth_createAccessList(params: any, blockTag?: string, options?: RequestOptions): Promise<Response<any>>;
    eth_estimateGas(params: any, options?: RequestOptions): Promise<Response<string>>;
    eth_feeHistory(blockCount: string, newestBlock: string, rewardPercentiles?: number[], options?: RequestOptions): Promise<Response<any>>;
    eth_gasPrice(options?: RequestOptions): Promise<Response<string>>;
    eth_getBalance(address: string, blockTag?: string, options?: RequestOptions): Promise<Response<string>>;
    eth_getBlockByHash(blockHash: string, fullTransactions?: boolean, options?: RequestOptions): Promise<Response<any>>;
    eth_getBlockByNumber(blockTag: string, fullTransactions?: boolean, options?: RequestOptions): Promise<Response<any>>;
    eth_getBlockReceipts(blockTag: string, options?: RequestOptions): Promise<Response<any[]>>;
    eth_getBlockTransactionCountByHash(blockHash: string, options?: RequestOptions): Promise<Response<string>>;
    eth_getBlockTransactionCountByNumber(blockTag: string, options?: RequestOptions): Promise<Response<string>>;
    eth_getCode(address: string, blockTag?: string, options?: RequestOptions): Promise<Response<string>>;
    eth_getFilterChanges(filterId: string, options?: RequestOptions): Promise<Response<any[]>>;
    eth_getFilterLogs(filterId: string, options?: RequestOptions): Promise<Response<any[]>>;
    eth_getLogs(params: any, options?: RequestOptions): Promise<Response<any[]>>;
    eth_getProof(address: string, storageKeys: string[], blockTag?: string, options?: RequestOptions): Promise<Response<any>>;
    eth_getStorageAt(address: string, position: string, blockTag?: string, options?: RequestOptions): Promise<Response<string>>;
    eth_getTransactionByBlockHashAndIndex(blockHash: string, index: string, options?: RequestOptions): Promise<Response<any>>;
    eth_getTransactionByBlockNumberAndIndex(blockTag: string, index: string, options?: RequestOptions): Promise<Response<any>>;
    eth_getTransactionByHash(txHash: string, options?: RequestOptions): Promise<Response<any>>;
    eth_getTransactionCount(address: string, blockTag?: string, options?: RequestOptions): Promise<Response<string>>;
    eth_getTransactionReceipt(txHash: string, options?: RequestOptions): Promise<Response<any>>;
    eth_getUncleCountByBlockHash(blockHash: string, options?: RequestOptions): Promise<Response<string>>;
    eth_getUncleCountByBlockNumber(blockTag: string, options?: RequestOptions): Promise<Response<string>>;
    eth_maxPriorityFeePerGas(options?: RequestOptions): Promise<Response<string>>;
    eth_newBlockFilter(options?: RequestOptions): Promise<Response<string>>;
    eth_newFilter(params: any, options?: RequestOptions): Promise<Response<string>>;
    eth_newPendingTransactionFilter(options?: RequestOptions): Promise<Response<string>>;
    eth_sendRawTransaction(signedTx: string, options?: RequestOptions): Promise<Response<string>>;
    eth_sendTransaction(params: any, options?: RequestOptions): Promise<Response<string>>;
    eth_sign(address: string, data: string, options?: RequestOptions): Promise<Response<string>>;
    eth_signTransaction(params: any, options?: RequestOptions): Promise<Response<string>>;
    eth_simulateV1(params: any, options?: RequestOptions): Promise<Response<any>>;
    eth_syncing(options?: RequestOptions): Promise<Response<any>>;
    eth_uninstallFilter(filterId: string, options?: RequestOptions): Promise<Response<boolean>>;
    debug_traceTransaction(txHash: string, traceOptions?: any, options?: RequestOptions): Promise<Response<any>>;
    debug_traceBlockByNumber(blockTag: string, traceOptions?: any, options?: RequestOptions): Promise<Response<any[]>>;
    debug_traceBlockByHash(blockHash: string, traceOptions?: any, options?: RequestOptions): Promise<Response<any[]>>;
    debug_traceCall(params: any, blockTag?: string, traceOptions?: any, options?: RequestOptions): Promise<Response<any>>;
    debug_getRawBlock(blockTag: string, options?: RequestOptions): Promise<Response<string>>;
    engine_newPayloadV1(payload: any, options?: RequestOptions): Promise<Response<any>>;
    engine_newPayloadV2(payload: any, options?: RequestOptions): Promise<Response<any>>;
    engine_newPayloadV3(payload: any, expectedBlobVersionedHashes?: string[], parentBeaconBlockRoot?: string, options?: RequestOptions): Promise<Response<any>>;
    engine_forkchoiceUpdatedV1(forkchoiceState: any, payloadAttributes?: any, options?: RequestOptions): Promise<Response<any>>;
    engine_forkchoiceUpdatedV2(forkchoiceState: any, payloadAttributes?: any, options?: RequestOptions): Promise<Response<any>>;
    engine_forkchoiceUpdatedV3(forkchoiceState: any, payloadAttributes?: any, options?: RequestOptions): Promise<Response<any>>;
    engine_getPayloadV1(payloadId: string, options?: RequestOptions): Promise<Response<any>>;
    engine_getPayloadV2(payloadId: string, options?: RequestOptions): Promise<Response<any>>;
    engine_getPayloadV3(payloadId: string, options?: RequestOptions): Promise<Response<any>>;
    engine_getBlobsV1(blobVersionedHashes: string[], options?: RequestOptions): Promise<Response<any[]>>;
    engine_exchangeCapabilities(capabilities: string[], options?: RequestOptions): Promise<Response<string[]>>;
    engine_exchangeTransitionConfigurationV1(config: any, options?: RequestOptions): Promise<Response<any>>;
    engine_getPayloadBodiesByHashV1(blockHashes: string[], options?: RequestOptions): Promise<Response<any[]>>;
    engine_getPayloadBodiesByRangeV1(start: string, count: string, options?: RequestOptions): Promise<Response<any[]>>;
    events: ProviderEvents;
}
//# sourceMappingURL=WebSocketProvider.d.ts.map