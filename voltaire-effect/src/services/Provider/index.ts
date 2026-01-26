/**
 * @fileoverview Provider module exports for read-only blockchain operations.
 *
 * @module Provider
 * @since 0.0.1
 *
 * @description
 * This module provides the provider service for querying Ethereum
 * blockchain data. It includes the service definition, layer implementation,
 * and all related types.
 *
 * Main exports:
 * - {@link ProviderService} - The service tag/interface
 * - {@link Provider} - The live implementation layer
 * - {@link ProviderError} - Error type for failed operations
 *
 * Type exports:
 * - {@link BlockTag} - Block identifier type
 * - {@link BlockType} - Block data structure
 * - {@link TransactionType} - Transaction data structure
 * - {@link ReceiptType} - Transaction receipt structure
 * - {@link LogType} - Event log structure
 * - {@link CallRequest} - eth_call parameters
 * - {@link LogFilter} - eth_getLogs parameters
 *
 * @example Typical usage
 * ```typescript
 * import { Effect } from 'effect'
 * import {
 *   ProviderService,
 *   Provider,
 *   HttpTransport
 * } from 'voltaire-effect/services'
 *
 * const program = Effect.gen(function* () {
 *   const provider = yield* ProviderService
 *   return yield* provider.getBlockNumber()
 * }).pipe(
 *   Effect.provide(Provider),
 *   Effect.provide(HttpTransport('https://mainnet.infura.io/v3/YOUR_KEY'))
 * )
 * ```
 *
 * @see {@link TransportService} - Required dependency for RPC communication
 */

// Re-export block streaming types for convenience
export type {
	BackfillOptions,
	BlockInclude,
	BlockStreamEvent,
	BlocksEvent,
	WatchOptions,
} from "@tevm/voltaire/block";
export {
	type ContractCall,
	type MulticallParams,
	type MulticallResults,
	multicall,
	type SimulateContractParams,
	type SimulateContractResult,
	type StateOverride,
	simulateContract,
} from "./actions/index.js";
export {
	type Abi,
	type ReadContractParams,
	readContract,
} from "./actions/readContract.js";
export {
	createBlockFilter,
	createEventFilter,
	createPendingTransactionFilter,
	getFilterChanges,
	getFilterLogs,
	uninstallFilter,
} from "./filters.js";
export {
	calculateBlobGasPrice,
	estimateBlobGas,
	getBlobBaseFee,
} from "./getBlobBaseFee.js";
export { Provider } from "./Provider.js";
export {
	type AccessListType,
	type AddressInput,
	type BlockTag,
	type BlockType,
	type CallRequest,
	type EventFilter,
	type FeeHistoryType,
	type FilterChanges,
	type FilterId,
	type GetBlockArgs,
	type GetBlockTransactionCountArgs,
	type GetUncleArgs,
	type HashInput,
	type LogFilter,
	type LogType,
	type ProofType,
	ProviderError,
	ProviderService,
	type ProviderShape,
	type ReceiptType,
	type StorageProofType,
	type TransactionType,
	type UncleBlockType,
} from "./ProviderService.js";
export {
	type AssetChange,
	type SimulateCallsParams,
	type SimulationResult,
	simulateCalls,
} from "./simulateCalls.js";
