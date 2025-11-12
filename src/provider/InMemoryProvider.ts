/**
 * In-Memory Provider
 *
 * Provider implementation that executes transactions using Voltaire's built-in EVM.
 * This provider maintains its own blockchain state in memory for testing and development.
 *
 * @module provider/InMemoryProvider
 * @placeholder This implementation will be completed when EVM documentation is finalized
 */

import type { Provider } from "./Provider.js";
import type { Response, RequestOptions, ProviderEvents } from "./types.js";

/**
 * In-Memory Provider configuration options
 */
export interface InMemoryProviderOptions {
	/** Initial fork block number */
	forkBlockNumber?: number;
	/** Fork from URL (optional) */
	forkUrl?: string;
	/** Chain ID */
	chainId?: number;
	/** Mining mode: auto, interval, or manual */
	mining?: "auto" | "interval" | "manual";
	/** Mining interval in ms (when mode is 'interval') */
	miningInterval?: number;
	/** Initial accounts with balances */
	accounts?: Array<{
		address: string;
		balance: string;
		privateKey?: string;
	}>;
}

/**
 * In-Memory Provider implementation
 *
 * **PLACEHOLDER**: This provider will use Voltaire's built-in EVM to execute
 * transactions and maintain blockchain state in memory.
 *
 * This implementation is being developed alongside the EVM module and will be
 * completed when the EVM documentation is finalized.
 *
 * ## Planned Features
 *
 * - **Local EVM execution** - Full transaction simulation without external node
 * - **State management** - In-memory state with snapshot/revert capabilities
 * - **Instant mining** - Configurable block production (auto/interval/manual)
 * - **Fork mode** - Fork from mainnet or testnet at any block
 * - **Testing utilities** - Impersonate accounts, manipulate time, set balances
 * - **Zero latency** - No network requests, instant responses
 *
 * @example
 * ```typescript
 * // Future usage (not yet implemented)
 * const provider = new InMemoryProvider({
 *   chainId: 1,
 *   forkUrl: 'https://eth-mainnet.example.com',
 *   forkBlockNumber: 18000000,
 *   accounts: [
 *     {
 *       address: '0x...',
 *       balance: '0x10000000000000000000000' // 100000 ETH
 *     }
 *   ]
 * });
 *
 * await provider.start();
 *
 * // Execute transactions against local EVM
 * const result = await provider.eth_call({
 *   to: '0x...',
 *   data: '0x...'
 * });
 * ```
 *
 * @see https://voltaire.tevm.sh/evm for EVM documentation (coming soon)
 */
export class InMemoryProvider implements Provider {
	constructor(_options?: InMemoryProviderOptions) {
		throw new Error(
			"InMemoryProvider is not yet implemented. " +
				"This provider will be completed when the EVM module is documented. " +
				"For now, use HttpProvider or WebSocketProvider to connect to external nodes.",
		);
	}

	// ============================================================================
	// Placeholder method implementations
	// ============================================================================
	//
	// All methods throw an error indicating the provider is not yet implemented.
	// These will be replaced with actual EVM execution when the module is ready.

	private notImplemented(): never {
		throw new Error(
			"InMemoryProvider is not yet implemented. " +
				"This provider will be completed when the EVM module is documented.",
		);
	}

	// eth methods
	eth_accounts(_options?: RequestOptions): Promise<Response<string[]>> {
		return this.notImplemented();
	}
	eth_blobBaseFee(_options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_blockNumber(_options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_call(_params: any, _blockTag?: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_chainId(_options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_coinbase(_options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_createAccessList(_params: any, _blockTag?: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_estimateGas(_params: any, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_feeHistory(_blockCount: string, _newestBlock: string, _rewardPercentiles?: number[], _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_gasPrice(_options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_getBalance(_address: string, _blockTag?: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_getBlockByHash(_blockHash: string, _fullTransactions?: boolean, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_getBlockByNumber(_blockTag: string, _fullTransactions?: boolean, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_getBlockReceipts(_blockTag: string, _options?: RequestOptions): Promise<Response<any[]>> {
		return this.notImplemented();
	}
	eth_getBlockTransactionCountByHash(_blockHash: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_getBlockTransactionCountByNumber(_blockTag: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_getCode(_address: string, _blockTag?: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_getFilterChanges(_filterId: string, _options?: RequestOptions): Promise<Response<any[]>> {
		return this.notImplemented();
	}
	eth_getFilterLogs(_filterId: string, _options?: RequestOptions): Promise<Response<any[]>> {
		return this.notImplemented();
	}
	eth_getLogs(_params: any, _options?: RequestOptions): Promise<Response<any[]>> {
		return this.notImplemented();
	}
	eth_getProof(_address: string, _storageKeys: string[], _blockTag?: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_getStorageAt(_address: string, _position: string, _blockTag?: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_getTransactionByBlockHashAndIndex(_blockHash: string, _index: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_getTransactionByBlockNumberAndIndex(_blockTag: string, _index: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_getTransactionByHash(_txHash: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_getTransactionCount(_address: string, _blockTag?: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_getTransactionReceipt(_txHash: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_getUncleCountByBlockHash(_blockHash: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_getUncleCountByBlockNumber(_blockTag: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_maxPriorityFeePerGas(_options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_newBlockFilter(_options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_newFilter(_params: any, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_newPendingTransactionFilter(_options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_sendRawTransaction(_signedTx: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_sendTransaction(_params: any, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_sign(_address: string, _data: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_signTransaction(_params: any, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}
	eth_simulateV1(_params: any, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_syncing(_options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	eth_uninstallFilter(_filterId: string, _options?: RequestOptions): Promise<Response<boolean>> {
		return this.notImplemented();
	}

	// debug methods
	debug_traceTransaction(_txHash: string, _traceOptions?: any, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	debug_traceBlockByNumber(_blockTag: string, _traceOptions?: any, _options?: RequestOptions): Promise<Response<any[]>> {
		return this.notImplemented();
	}
	debug_traceBlockByHash(_blockHash: string, _traceOptions?: any, _options?: RequestOptions): Promise<Response<any[]>> {
		return this.notImplemented();
	}
	debug_traceCall(_params: any, _blockTag?: string, _traceOptions?: any, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	debug_getRawBlock(_blockTag: string, _options?: RequestOptions): Promise<Response<string>> {
		return this.notImplemented();
	}

	// engine methods
	engine_newPayloadV1(_payload: any, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_newPayloadV2(_payload: any, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_newPayloadV3(_payload: any, _expectedBlobVersionedHashes?: string[], _parentBeaconBlockRoot?: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_forkchoiceUpdatedV1(_forkchoiceState: any, _payloadAttributes?: any, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_forkchoiceUpdatedV2(_forkchoiceState: any, _payloadAttributes?: any, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_forkchoiceUpdatedV3(_forkchoiceState: any, _payloadAttributes?: any, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_getPayloadV1(_payloadId: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_getPayloadV2(_payloadId: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_getPayloadV3(_payloadId: string, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_getBlobsV1(_blobVersionedHashes: string[], _options?: RequestOptions): Promise<Response<any[]>> {
		return this.notImplemented();
	}
	engine_exchangeCapabilities(_capabilities: string[], _options?: RequestOptions): Promise<Response<string[]>> {
		return this.notImplemented();
	}
	engine_exchangeTransitionConfigurationV1(_config: any, _options?: RequestOptions): Promise<Response<any>> {
		return this.notImplemented();
	}
	engine_getPayloadBodiesByHashV1(_blockHashes: string[], _options?: RequestOptions): Promise<Response<any[]>> {
		return this.notImplemented();
	}
	engine_getPayloadBodiesByRangeV1(_start: string, _count: string, _options?: RequestOptions): Promise<Response<any[]>> {
		return this.notImplemented();
	}

	// Events placeholder
	events: ProviderEvents = {
		async *newHeads() {
			throw new Error("InMemoryProvider events not yet implemented");
		},
		async *logs() {
			throw new Error("InMemoryProvider events not yet implemented");
		},
		async *newPendingTransactions() {
			throw new Error("InMemoryProvider events not yet implemented");
		},
		async *syncing() {
			throw new Error("InMemoryProvider events not yet implemented");
		},
	};
}
