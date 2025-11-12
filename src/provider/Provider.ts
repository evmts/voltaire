/**
 * Provider Interface
 *
 * Type-safe Ethereum JSON-RPC provider interface with branded primitives.
 * Defines all 65 methods across eth, debug, and engine namespaces.
 *
 * @module provider/Provider
 */

import type { Response, RequestOptions, ProviderEvents } from "./types.js";

/**
 * Provider interface for Ethereum JSON-RPC communication
 *
 * Provides direct method access with branded primitive types for parameters.
 * Methods return Response<T> containing either result or error (never throws).
 *
 * @example
 * ```typescript
 * const provider: Provider = new HttpProvider('https://eth.example.com');
 *
 * const result = await provider.eth_blockNumber();
 * if (result.error) {
 *   console.error('Error:', result.error.message);
 * } else {
 *   console.log('Block:', result.result);
 * }
 * ```
 */
export interface Provider {
	// ============================================================================
	// eth Methods (40 methods)
	// ============================================================================

	/** Get list of available accounts */
	eth_accounts(options?: RequestOptions): Promise<Response<string[]>>;

	/** Get current blob base fee (EIP-4844) */
	eth_blobBaseFee(options?: RequestOptions): Promise<Response<string>>;

	/** Get most recent block number */
	eth_blockNumber(options?: RequestOptions): Promise<Response<string>>;

	/** Execute read-only contract call */
	eth_call(
		params: { to?: string; from?: string; data?: string; value?: string },
		blockTag?: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get chain ID */
	eth_chainId(options?: RequestOptions): Promise<Response<string>>;

	/** Get coinbase address */
	eth_coinbase(options?: RequestOptions): Promise<Response<string>>;

	/** Generate access list for transaction */
	eth_createAccessList(
		params: { to?: string; from?: string; data?: string },
		blockTag?: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Estimate gas for transaction */
	eth_estimateGas(
		params: { to?: string; from?: string; data?: string; value?: string },
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get historical fee data */
	eth_feeHistory(
		blockCount: string,
		newestBlock: string,
		rewardPercentiles?: number[],
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get current gas price */
	eth_gasPrice(options?: RequestOptions): Promise<Response<string>>;

	/** Get balance of address */
	eth_getBalance(
		address: string,
		blockTag?: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get block by hash */
	eth_getBlockByHash(
		blockHash: string,
		fullTransactions?: boolean,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get block by number */
	eth_getBlockByNumber(
		blockTag: string,
		fullTransactions?: boolean,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get all transaction receipts for block */
	eth_getBlockReceipts(
		blockTag: string,
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	/** Get transaction count in block by hash */
	eth_getBlockTransactionCountByHash(
		blockHash: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get transaction count in block by number */
	eth_getBlockTransactionCountByNumber(
		blockTag: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get contract code at address */
	eth_getCode(
		address: string,
		blockTag?: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get new filter entries since last poll */
	eth_getFilterChanges(
		filterId: string,
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	/** Get all logs matching filter */
	eth_getFilterLogs(
		filterId: string,
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	/** Query event logs */
	eth_getLogs(
		params: {
			fromBlock?: string;
			toBlock?: string;
			address?: string | string[];
			topics?: (string | string[] | null)[];
		},
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	/** Get Merkle proof for account and storage */
	eth_getProof(
		address: string,
		storageKeys: string[],
		blockTag?: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get storage value at position */
	eth_getStorageAt(
		address: string,
		position: string,
		blockTag?: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get transaction by block hash and index */
	eth_getTransactionByBlockHashAndIndex(
		blockHash: string,
		index: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get transaction by block number and index */
	eth_getTransactionByBlockNumberAndIndex(
		blockTag: string,
		index: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get transaction by hash */
	eth_getTransactionByHash(
		txHash: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get transaction count (nonce) for address */
	eth_getTransactionCount(
		address: string,
		blockTag?: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get transaction receipt */
	eth_getTransactionReceipt(
		txHash: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get uncle count by block hash */
	eth_getUncleCountByBlockHash(
		blockHash: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get uncle count by block number */
	eth_getUncleCountByBlockNumber(
		blockTag: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Get max priority fee per gas (EIP-1559) */
	eth_maxPriorityFeePerGas(
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Create new block filter */
	eth_newBlockFilter(options?: RequestOptions): Promise<Response<string>>;

	/** Create new log filter */
	eth_newFilter(
		params: {
			fromBlock?: string;
			toBlock?: string;
			address?: string | string[];
			topics?: (string | string[] | null)[];
		},
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Create new pending transaction filter */
	eth_newPendingTransactionFilter(
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Submit signed transaction */
	eth_sendRawTransaction(
		signedTx: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Sign and send transaction (requires unlocked account) */
	eth_sendTransaction(
		params: {
			from: string;
			to?: string;
			gas?: string;
			gasPrice?: string;
			value?: string;
			data?: string;
		},
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Sign data (deprecated, dangerous) */
	eth_sign(
		address: string,
		data: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Sign transaction (requires unlocked account) */
	eth_signTransaction(
		params: {
			from: string;
			to?: string;
			gas?: string;
			gasPrice?: string;
			value?: string;
			data?: string;
		},
		options?: RequestOptions,
	): Promise<Response<string>>;

	/** Simulate multiple transactions */
	eth_simulateV1(
		params: any,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get sync status */
	eth_syncing(options?: RequestOptions): Promise<Response<any>>;

	/** Remove filter */
	eth_uninstallFilter(
		filterId: string,
		options?: RequestOptions,
	): Promise<Response<boolean>>;

	// ============================================================================
	// debug Methods (5 methods)
	// ============================================================================

	/** Trace transaction execution */
	debug_traceTransaction(
		txHash: string,
		traceOptions?: any,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Trace all transactions in block by number */
	debug_traceBlockByNumber(
		blockTag: string,
		traceOptions?: any,
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	/** Trace all transactions in block by hash */
	debug_traceBlockByHash(
		blockHash: string,
		traceOptions?: any,
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	/** Trace call without creating transaction */
	debug_traceCall(
		params: { to?: string; from?: string; data?: string },
		blockTag?: string,
		traceOptions?: any,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get RLP-encoded raw block */
	debug_getRawBlock(
		blockTag: string,
		options?: RequestOptions,
	): Promise<Response<string>>;

	// ============================================================================
	// engine Methods (20 methods)
	// ============================================================================

	/** Validate and execute payload (Bellatrix) */
	engine_newPayloadV1(
		payload: any,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Validate and execute payload (Shanghai) */
	engine_newPayloadV2(
		payload: any,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Validate and execute payload (Cancun) */
	engine_newPayloadV3(
		payload: any,
		expectedBlobVersionedHashes?: string[],
		parentBeaconBlockRoot?: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Update forkchoice state (Bellatrix) */
	engine_forkchoiceUpdatedV1(
		forkchoiceState: any,
		payloadAttributes?: any,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Update forkchoice state (Shanghai) */
	engine_forkchoiceUpdatedV2(
		forkchoiceState: any,
		payloadAttributes?: any,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Update forkchoice state (Cancun) */
	engine_forkchoiceUpdatedV3(
		forkchoiceState: any,
		payloadAttributes?: any,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get built payload (Bellatrix) */
	engine_getPayloadV1(
		payloadId: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get built payload (Shanghai) */
	engine_getPayloadV2(
		payloadId: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get built payload (Cancun) */
	engine_getPayloadV3(
		payloadId: string,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get blob sidecars */
	engine_getBlobsV1(
		blobVersionedHashes: string[],
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	/** Exchange Engine API capabilities */
	engine_exchangeCapabilities(
		capabilities: string[],
		options?: RequestOptions,
	): Promise<Response<string[]>>;

	/** Exchange transition configuration */
	engine_exchangeTransitionConfigurationV1(
		config: any,
		options?: RequestOptions,
	): Promise<Response<any>>;

	/** Get block bodies by hash */
	engine_getPayloadBodiesByHashV1(
		blockHashes: string[],
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	/** Get block bodies by range */
	engine_getPayloadBodiesByRangeV1(
		start: string,
		count: string,
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	// Additional engine methods from execution-apis spec
	engine_getPayloadV4?(
		payloadId: string,
		options?: RequestOptions,
	): Promise<Response<any>>;
	engine_newPayloadV4?(
		payload: any,
		options?: RequestOptions,
	): Promise<Response<any>>;
	engine_forkchoiceUpdatedV4?(
		forkchoiceState: any,
		payloadAttributes?: any,
		options?: RequestOptions,
	): Promise<Response<any>>;
	engine_getPayloadBodiesByHashV2?(
		blockHashes: string[],
		options?: RequestOptions,
	): Promise<Response<any[]>>;
	engine_getPayloadBodiesByRangeV2?(
		start: string,
		count: string,
		options?: RequestOptions,
	): Promise<Response<any[]>>;
	engine_getBlobsV2?(
		blobVersionedHashes: string[],
		options?: RequestOptions,
	): Promise<Response<any[]>>;

	// ============================================================================
	// Events
	// ============================================================================

	/** Event subscription interface */
	events: ProviderEvents;
}
