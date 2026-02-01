/**
 * WebSocket Provider
 *
 * JSON-RPC provider implementation using WebSocket transport for real-time
 * bidirectional communication. Supports native pub/sub for events.
 *
 * @module provider/WebSocketProvider
 */
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
export class WebSocketProvider {
    url;
    protocols;
    ws = null;
    requestId = 0;
    // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC response type varies
    pending = new Map();
    // biome-ignore lint/suspicious/noExplicitAny: subscription data type varies
    subscriptions = new Map();
    reconnect;
    reconnectDelay;
    maxReconnectAttempts;
    reconnectAttempts = 0;
    reconnectTimeout;
    isConnected = false;
    // biome-ignore lint/suspicious/noExplicitAny: event listener args vary
    eventListeners = new Map();
    constructor(options) {
        // Check for WebSocket availability before proceeding
        if (typeof globalThis.WebSocket === "undefined") {
            throw new Error("WebSocket is not available in this environment. " +
                "For Node.js, install a WebSocket polyfill like 'ws' or 'isomorphic-ws' and assign it to globalThis.WebSocket.");
        }
        if (typeof options === "string") {
            this.url = options;
            this.reconnect = true;
            this.reconnectDelay = 5000;
            this.maxReconnectAttempts = 0;
        }
        else {
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
    async connect() {
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
                    this._request("eth_chainId")
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
                    if (this.reconnect &&
                        (this.maxReconnectAttempts === 0 ||
                            this.reconnectAttempts < this.maxReconnectAttempts)) {
                        this.reconnectAttempts++;
                        this.reconnectTimeout = setTimeout(() => {
                            this.connect().catch(() => {
                                // Reconnection failed, will try again
                            });
                        }, this.reconnectDelay);
                    }
                };
            }
            catch (error) {
                reject(error);
            }
        });
    }
    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
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
    async request(args) {
        // biome-ignore lint/suspicious/noExplicitAny: params type varies
        const response = await this._request(args.method, args.params);
        if (response.error) {
            throw response.error;
        }
        return response.result;
    }
    /**
     * Internal request method that handles JSON-RPC communication
     */
    async _request(method, 
    // biome-ignore lint/suspicious/noExplicitAny: params type varies
    params = [], options) {
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
                }
                else {
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
    async subscribe(method, params = []) {
        const response = await this._request("eth_subscribe", [
            method,
            ...params,
        ]);
        if (response.error) {
            throw new Error(response.error.message);
        }
        // biome-ignore lint/style/noNonNullAssertion: result exists if no error
        return response.result;
    }
    /**
     * Unsubscribe from WebSocket event
     */
    async unsubscribe(subscriptionId) {
        await this._request("eth_unsubscribe", [subscriptionId]);
        this.subscriptions.delete(subscriptionId);
    }
    /**
     * Register event listener (EIP-1193)
     */
    on(event, listener) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set());
        }
        // biome-ignore lint/suspicious/noExplicitAny: listener type varies by event
        this.eventListeners.get(event)?.add(listener);
        return this;
    }
    /**
     * Remove event listener (EIP-1193)
     */
    removeListener(event, listener) {
        // biome-ignore lint/suspicious/noExplicitAny: listener type varies by event
        this.eventListeners.get(event)?.delete(listener);
        return this;
    }
    /**
     * Emit event to all listeners (internal use)
     */
    emit(event, ...args) {
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
    eth_accounts(options) {
        return this._request("eth_accounts", [], options);
    }
    eth_blobBaseFee(options) {
        return this._request("eth_blobBaseFee", [], options);
    }
    eth_blockNumber(options) {
        return this._request("eth_blockNumber", [], options);
    }
    // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC call params type varies
    eth_call(params, blockTag = "latest", options) {
        return this._request("eth_call", [params, blockTag], options);
    }
    eth_chainId(options) {
        return this._request("eth_chainId", [], options);
    }
    eth_coinbase(options) {
        return this._request("eth_coinbase", [], options);
    }
    eth_createAccessList(
    // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC call params type varies
    params, blockTag = "latest", options) {
        // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC response type varies
        return this._request("eth_createAccessList", [params, blockTag], options);
    }
    // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC call params type varies
    eth_estimateGas(params, options) {
        return this._request("eth_estimateGas", [params], options);
    }
    eth_feeHistory(blockCount, newestBlock, rewardPercentiles, options) {
        const params = rewardPercentiles
            ? [blockCount, newestBlock, rewardPercentiles]
            : [blockCount, newestBlock];
        // biome-ignore lint/suspicious/noExplicitAny: fee history response structure varies
        return this._request("eth_feeHistory", params, options);
    }
    eth_gasPrice(options) {
        return this._request("eth_gasPrice", [], options);
    }
    eth_getBalance(address, blockTag = "latest", options) {
        return this._request("eth_getBalance", [address, blockTag], options);
    }
    eth_getBlockByHash(blockHash, fullTransactions = false, options) {
        // biome-ignore lint/suspicious/noExplicitAny: block response varies by fullTransactions param
        return this._request("eth_getBlockByHash", [blockHash, fullTransactions], options);
    }
    eth_getBlockByNumber(blockTag, fullTransactions = false, options) {
        // biome-ignore lint/suspicious/noExplicitAny: block response varies by fullTransactions param
        return this._request("eth_getBlockByNumber", [blockTag, fullTransactions], options);
    }
    eth_getBlockReceipts(blockTag, options) {
        // biome-ignore lint/suspicious/noExplicitAny: receipt structure varies by transaction type
        return this._request("eth_getBlockReceipts", [blockTag], options);
    }
    eth_getBlockTransactionCountByHash(blockHash, options) {
        return this._request("eth_getBlockTransactionCountByHash", [blockHash], options);
    }
    eth_getBlockTransactionCountByNumber(blockTag, options) {
        return this._request("eth_getBlockTransactionCountByNumber", [blockTag], options);
    }
    eth_getCode(address, blockTag = "latest", options) {
        return this._request("eth_getCode", [address, blockTag], options);
    }
    eth_getFilterChanges(filterId, options) {
        // biome-ignore lint/suspicious/noExplicitAny: filter changes return varying types (logs or block/tx hashes)
        return this._request("eth_getFilterChanges", [filterId], options);
    }
    eth_getFilterLogs(filterId, options) {
        // biome-ignore lint/suspicious/noExplicitAny: log objects have dynamic structure
        return this._request("eth_getFilterLogs", [filterId], options);
    }
    // biome-ignore lint/suspicious/noExplicitAny: filter params have dynamic structure
    eth_getLogs(params, options) {
        // biome-ignore lint/suspicious/noExplicitAny: log objects have dynamic structure
        return this._request("eth_getLogs", [params], options);
    }
    eth_getProof(address, storageKeys, blockTag = "latest", options) {
        // biome-ignore lint/suspicious/noExplicitAny: proof response has complex nested structure
        return this._request("eth_getProof", [address, storageKeys, blockTag], options);
    }
    eth_getStorageAt(address, position, blockTag = "latest", options) {
        return this._request("eth_getStorageAt", [address, position, blockTag], options);
    }
    eth_getTransactionByBlockHashAndIndex(blockHash, index, options) {
        // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC transaction object type
        return this._request("eth_getTransactionByBlockHashAndIndex", [blockHash, index], options);
    }
    eth_getTransactionByBlockNumberAndIndex(blockTag, index, options) {
        // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC transaction object type
        return this._request("eth_getTransactionByBlockNumberAndIndex", [blockTag, index], options);
    }
    eth_getTransactionByHash(txHash, options) {
        // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC transaction object type
        return this._request("eth_getTransactionByHash", [txHash], options);
    }
    eth_getTransactionCount(address, blockTag = "latest", options) {
        return this._request("eth_getTransactionCount", [address, blockTag], options);
    }
    eth_getTransactionReceipt(txHash, options) {
        // biome-ignore lint/suspicious/noExplicitAny: JSON-RPC receipt object type
        return this._request("eth_getTransactionReceipt", [txHash], options);
    }
    eth_getUncleCountByBlockHash(blockHash, options) {
        return this._request("eth_getUncleCountByBlockHash", [blockHash], options);
    }
    eth_getUncleCountByBlockNumber(blockTag, options) {
        return this._request("eth_getUncleCountByBlockNumber", [blockTag], options);
    }
    eth_maxPriorityFeePerGas(options) {
        return this._request("eth_maxPriorityFeePerGas", [], options);
    }
    eth_newBlockFilter(options) {
        return this._request("eth_newBlockFilter", [], options);
    }
    // biome-ignore lint/suspicious/noExplicitAny: filter params type varies by filter type
    eth_newFilter(params, options) {
        return this._request("eth_newFilter", [params], options);
    }
    eth_newPendingTransactionFilter(options) {
        return this._request("eth_newPendingTransactionFilter", [], options);
    }
    eth_sendRawTransaction(signedTx, options) {
        return this._request("eth_sendRawTransaction", [signedTx], options);
    }
    // biome-ignore lint/suspicious/noExplicitAny: transaction params type varies by tx type
    eth_sendTransaction(params, options) {
        return this._request("eth_sendTransaction", [params], options);
    }
    eth_sign(address, data, options) {
        return this._request("eth_sign", [address, data], options);
    }
    // biome-ignore lint/suspicious/noExplicitAny: transaction params type varies by tx type
    eth_signTransaction(params, options) {
        return this._request("eth_signTransaction", [params], options);
    }
    // biome-ignore lint/suspicious/noExplicitAny: simulation params and response types are complex
    eth_simulateV1(params, options) {
        // biome-ignore lint/suspicious/noExplicitAny: simulation response type is complex
        return this._request("eth_simulateV1", [params], options);
    }
    eth_syncing(options) {
        // biome-ignore lint/suspicious/noExplicitAny: syncing returns false or complex sync status object
        return this._request("eth_syncing", [], options);
    }
    eth_uninstallFilter(filterId, options) {
        return this._request("eth_uninstallFilter", [filterId], options);
    }
    // ============================================================================
    // debug Methods
    // ============================================================================
    debug_traceTransaction(txHash, 
    // biome-ignore lint/suspicious/noExplicitAny: trace options vary by tracer type
    traceOptions, options) {
        const params = traceOptions ? [txHash, traceOptions] : [txHash];
        // biome-ignore lint/suspicious/noExplicitAny: trace result varies by tracer type
        return this._request("debug_traceTransaction", params, options);
    }
    debug_traceBlockByNumber(blockTag, 
    // biome-ignore lint/suspicious/noExplicitAny: trace options vary by tracer type
    traceOptions, options) {
        const params = traceOptions ? [blockTag, traceOptions] : [blockTag];
        // biome-ignore lint/suspicious/noExplicitAny: trace result varies by tracer type
        return this._request("debug_traceBlockByNumber", params, options);
    }
    debug_traceBlockByHash(blockHash, 
    // biome-ignore lint/suspicious/noExplicitAny: trace options vary by tracer type
    traceOptions, options) {
        const params = traceOptions ? [blockHash, traceOptions] : [blockHash];
        // biome-ignore lint/suspicious/noExplicitAny: trace result varies by tracer type
        return this._request("debug_traceBlockByHash", params, options);
    }
    debug_traceCall(
    // biome-ignore lint/suspicious/noExplicitAny: call params type varies
    params, blockTag = "latest", 
    // biome-ignore lint/suspicious/noExplicitAny: trace options vary by tracer type
    traceOptions, options) {
        const rpcParams = traceOptions
            ? [params, blockTag, traceOptions]
            : [params, blockTag];
        // biome-ignore lint/suspicious/noExplicitAny: trace result varies by tracer type
        return this._request("debug_traceCall", rpcParams, options);
    }
    debug_getRawBlock(blockTag, options) {
        return this._request("debug_getRawBlock", [blockTag], options);
    }
    // ============================================================================
    // engine Methods
    // ============================================================================
    // biome-ignore lint/suspicious/noExplicitAny: Engine API payload structure varies by version
    engine_newPayloadV1(payload, options) {
        // biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
        return this._request("engine_newPayloadV1", [payload], options);
    }
    // biome-ignore lint/suspicious/noExplicitAny: Engine API payload structure varies by version
    engine_newPayloadV2(payload, options) {
        // biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
        return this._request("engine_newPayloadV2", [payload], options);
    }
    engine_newPayloadV3(
    // biome-ignore lint/suspicious/noExplicitAny: Engine API payload structure varies by version
    payload, expectedBlobVersionedHashes, parentBeaconBlockRoot, options) {
        const params = [payload];
        if (expectedBlobVersionedHashes)
            params.push(expectedBlobVersionedHashes);
        if (parentBeaconBlockRoot)
            params.push(parentBeaconBlockRoot);
        // biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
        return this._request("engine_newPayloadV3", params, options);
    }
    engine_forkchoiceUpdatedV1(
    // biome-ignore lint/suspicious/noExplicitAny: Engine API forkchoice state structure
    forkchoiceState, 
    // biome-ignore lint/suspicious/noExplicitAny: Engine API payload attributes vary by version
    payloadAttributes, options) {
        const params = payloadAttributes
            ? [forkchoiceState, payloadAttributes]
            : [forkchoiceState];
        // biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
        return this._request("engine_forkchoiceUpdatedV1", params, options);
    }
    engine_forkchoiceUpdatedV2(
    // biome-ignore lint/suspicious/noExplicitAny: Engine API forkchoice state structure
    forkchoiceState, 
    // biome-ignore lint/suspicious/noExplicitAny: Engine API payload attributes vary by version
    payloadAttributes, options) {
        const params = payloadAttributes
            ? [forkchoiceState, payloadAttributes]
            : [forkchoiceState];
        // biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
        return this._request("engine_forkchoiceUpdatedV2", params, options);
    }
    engine_forkchoiceUpdatedV3(
    // biome-ignore lint/suspicious/noExplicitAny: Engine API forkchoice state structure
    forkchoiceState, 
    // biome-ignore lint/suspicious/noExplicitAny: Engine API payload attributes vary by version
    payloadAttributes, options) {
        const params = payloadAttributes
            ? [forkchoiceState, payloadAttributes]
            : [forkchoiceState];
        // biome-ignore lint/suspicious/noExplicitAny: Engine API response type varies
        return this._request("engine_forkchoiceUpdatedV3", params, options);
    }
    engine_getPayloadV1(payloadId, options) {
        // biome-ignore lint/suspicious/noExplicitAny: Engine API payload type varies by version
        return this._request("engine_getPayloadV1", [payloadId], options);
    }
    engine_getPayloadV2(payloadId, options) {
        // biome-ignore lint/suspicious/noExplicitAny: Engine API payload type varies by version
        return this._request("engine_getPayloadV2", [payloadId], options);
    }
    engine_getPayloadV3(payloadId, options) {
        // biome-ignore lint/suspicious/noExplicitAny: Engine API payload type varies by version
        return this._request("engine_getPayloadV3", [payloadId], options);
    }
    engine_getBlobsV1(blobVersionedHashes, options) {
        // biome-ignore lint/suspicious/noExplicitAny: Blob response type varies
        return this._request("engine_getBlobsV1", [blobVersionedHashes], options);
    }
    engine_exchangeCapabilities(capabilities, options) {
        return this._request("engine_exchangeCapabilities", [capabilities], options);
    }
    engine_exchangeTransitionConfigurationV1(
    // biome-ignore lint/suspicious/noExplicitAny: Engine API transition config type not yet defined
    config, options) {
        // biome-ignore lint/suspicious/noExplicitAny: Engine API response type not yet defined
        return this._request("engine_exchangeTransitionConfigurationV1", [config], options);
    }
    engine_getPayloadBodiesByHashV1(blockHashes, options) {
        // biome-ignore lint/suspicious/noExplicitAny: Engine API payload body type not yet defined
        return this._request("engine_getPayloadBodiesByHashV1", [blockHashes], options);
    }
    engine_getPayloadBodiesByRangeV1(start, count, options) {
        // biome-ignore lint/suspicious/noExplicitAny: Engine API payload body type not yet defined
        return this._request("engine_getPayloadBodiesByRangeV1", [start, count], options);
    }
    // ============================================================================
    // Events (Native WebSocket subscriptions)
    // ============================================================================
    events = {
        newHeads: async function* () {
            const subscriptionId = await this.subscribe("newHeads");
            // biome-ignore lint/suspicious/noExplicitAny: subscription data is dynamically typed from RPC
            const queue = [];
            // biome-ignore lint/suspicious/noExplicitAny: resolve callback accepts dynamic RPC data
            let resolve = null;
            // biome-ignore lint/suspicious/noExplicitAny: callback data is dynamically typed from RPC
            const callback = (data) => {
                if (resolve) {
                    resolve(data);
                    resolve = null;
                }
                else {
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
                    }
                    else {
                        yield await new Promise((r) => {
                            resolve = r;
                        });
                    }
                }
            }
            finally {
                await this.unsubscribe(subscriptionId);
            }
        }.bind(this),
        // biome-ignore lint/suspicious/noExplicitAny: WebSocket log subscription params are dynamic
        logs: async function* (params) {
            const subscriptionId = await this.subscribe("logs", params ? [params] : []);
            // biome-ignore lint/suspicious/noExplicitAny: Log event data structure varies by filter
            const queue = [];
            // biome-ignore lint/suspicious/noExplicitAny: Generic promise resolution
            let resolve = null;
            // biome-ignore lint/suspicious/noExplicitAny: Log event callback data is dynamic
            const callback = (data) => {
                if (resolve) {
                    resolve(data);
                    resolve = null;
                }
                else {
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
                    }
                    else {
                        yield await new Promise((r) => {
                            resolve = r;
                        });
                    }
                }
            }
            finally {
                await this.unsubscribe(subscriptionId);
            }
        }.bind(this),
        newPendingTransactions: async function* () {
            const subscriptionId = await this.subscribe("newPendingTransactions");
            // biome-ignore lint/suspicious/noExplicitAny: WebSocket subscription data types vary by event
            const queue = [];
            // biome-ignore lint/suspicious/noExplicitAny: Promise resolve callback for dynamic subscription data
            let resolve = null;
            // biome-ignore lint/suspicious/noExplicitAny: WebSocket subscription callback receives dynamic data
            const callback = (data) => {
                if (resolve) {
                    resolve(data);
                    resolve = null;
                }
                else {
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
                    }
                    else {
                        yield await new Promise((r) => {
                            resolve = r;
                        });
                    }
                }
            }
            finally {
                await this.unsubscribe(subscriptionId);
            }
        }.bind(this),
        syncing: async function* () {
            const subscriptionId = await this.subscribe("syncing");
            // biome-ignore lint/suspicious/noExplicitAny: WebSocket syncing data structure varies
            const queue = [];
            // biome-ignore lint/suspicious/noExplicitAny: Promise resolver accepts syncing status data
            let resolve = null;
            // biome-ignore lint/suspicious/noExplicitAny: Subscription callback receives dynamic syncing data
            const callback = (data) => {
                if (resolve) {
                    resolve(data);
                    resolve = null;
                }
                else {
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
                    }
                    else {
                        yield await new Promise((r) => {
                            resolve = r;
                        });
                    }
                }
            }
            finally {
                await this.unsubscribe(subscriptionId);
            }
        }.bind(this),
    };
}
