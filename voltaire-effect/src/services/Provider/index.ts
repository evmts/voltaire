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
 * - {@link ProviderResponseError} - Invalid or unexpected responses
 * - {@link ProviderNotFoundError} - Missing resources
 * - {@link ProviderValidationError} - Invalid inputs
 * - {@link ProviderTimeoutError} - Timeout while waiting
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
export { Blocks } from "./Blocks.js";
export { Account } from "./Account.js";
export { Transaction } from "./Transaction.js";
export { Simulation } from "./Simulation.js";
export { Events } from "./Events.js";
export { Network } from "./Network.js";
export { Streaming } from "./Streaming.js";
export { BlocksService, type BlocksShape } from "./BlocksService.js";
export { AccountService, type AccountShape } from "./AccountService.js";
export { TransactionService, type TransactionShape } from "./TransactionService.js";
export {
	SimulationService,
	type SimulationShape,
	type SimulateV1Payload,
	type SimulateV1Result,
	type SimulateV1BlockResult,
	type SimulateV1CallResult,
	type SimulateV2Payload,
	type SimulateV2Result,
} from "./SimulationService.js";
export { EventsService, type EventsShape } from "./EventsService.js";
export {
	NetworkService,
	type NetworkShape,
	type SyncingStatus,
	type WorkResult,
} from "./NetworkService.js";
export { StreamingService, type StreamingShape } from "./StreamingService.js";
export {
	type AccessListInput,
	type AccessListType,
	type AddressInput,
	type BackfillBlocksError,
	type BlockTag,
	type BlockType,
	type CallError,
	type CallRequest,
	type CreateAccessListError,
	type CreateBlockFilterError,
	type CreateEventFilterError,
	type CreatePendingTransactionFilterError,
	type EstimateGasError,
	type EventFilter,
	type FeeHistoryType,
	type FilterChanges,
	type FilterId,
	type GetBalanceError,
	type GetBlobBaseFeeError,
	type GetBlockArgs,
	type GetBlockError,
	type GetBlockReceiptsArgs,
	type GetBlockReceiptsError,
	type GetBlockNumberError,
	type GetBlockTransactionCountArgs,
	type GetBlockTransactionCountError,
	type GetChainIdError,
	type GetAccountsError,
	type GetCoinbaseError,
	type GetSyncingError,
	type NetVersionError,
	type GetProtocolVersionError,
	type GetMiningError,
	type GetHashrateError,
	type GetWorkError,
	type SubmitWorkError,
	type SubmitHashrateError,
	type GetCodeError,
	type GetFeeHistoryError,
	type GetFilterChangesError,
	type GetFilterLogsError,
	type GetGasPriceError,
	type GetLogsError,
	type GetMaxPriorityFeePerGasError,
	type GetProofError,
	type GetStorageAtError,
	type GetTransactionConfirmationsError,
	type GetTransactionCountError,
	type GetTransactionError,
	type GetTransactionByBlockHashAndIndexError,
	type GetTransactionByBlockNumberAndIndexError,
	type GetTransactionReceiptError,
	type GetUncleArgs,
	type GetUncleCountArgs,
	type GetUncleCountError,
	type GetUncleError,
	type HashInput,
	type LogFilter,
	type LogType,
	type ProofType,
	type RpcTransactionRequest,
	type TransactionIndexInput,
	ProviderConfirmationsPendingError,
	type ProviderError,
	ProviderNotFoundError,
	ProviderReceiptPendingError,
	ProviderResponseError,
	ProviderService,
	type ProviderShape,
	ProviderStreamError,
	ProviderTimeoutError,
	ProviderValidationError,
	type ReceiptType,
	type SendRawTransactionError,
	type SendTransactionError,
	type SignError,
	type SignTransactionError,
	type SimulateV1Error,
	type SimulateV2Error,
	type SubscribeError,
	type StorageProofType,
	type TransactionType,
	type UncleBlockType,
	type UnsubscribeError,
	type UninstallFilterError,
	type WaitForTransactionReceiptError,
	type WatchBlocksError,
} from "./ProviderService.js";
export {
	type AssetChange,
	type SimulateCallsError,
	type SimulateCallsParams,
	type SimulationResult,
	simulateCalls,
} from "./simulateCalls.js";
