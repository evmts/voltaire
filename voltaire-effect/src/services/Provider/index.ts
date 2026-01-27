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
 * } from 'voltaire-effect'
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
export { Account } from "./Account.js";
export { AccountService, type AccountShape } from "./AccountService.js";
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
export { Blocks } from "./Blocks.js";
export { BlocksService, type BlocksShape } from "./BlocksService.js";
export { Events } from "./Events.js";
export { EventsService, type EventsShape } from "./EventsService.js";
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
export { Network } from "./Network.js";
export {
	NetworkService,
	type NetworkShape,
	type SyncingStatus,
	type WorkResult,
} from "./NetworkService.js";
export { Provider } from "./Provider.js";
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
	type GetAccountsError,
	type GetBalanceError,
	type GetBlobBaseFeeError,
	type GetBlockArgs,
	type GetBlockError,
	type GetBlockNumberError,
	type GetBlockReceiptsArgs,
	type GetBlockReceiptsError,
	type GetBlockTransactionCountArgs,
	type GetBlockTransactionCountError,
	type GetChainIdError,
	type GetCodeError,
	type GetCoinbaseError,
	type GetFeeHistoryError,
	type GetFilterChangesError,
	type GetFilterLogsError,
	type GetGasPriceError,
	type GetHashrateError,
	type GetLogsError,
	type GetMaxPriorityFeePerGasError,
	type GetMiningError,
	type GetProofError,
	type GetProtocolVersionError,
	type GetStorageAtError,
	type GetSyncingError,
	type GetTransactionByBlockHashAndIndexError,
	type GetTransactionByBlockNumberAndIndexError,
	type GetTransactionConfirmationsError,
	type GetTransactionCountError,
	type GetTransactionError,
	type GetTransactionReceiptError,
	type GetUncleArgs,
	type GetUncleCountArgs,
	type GetUncleCountError,
	type GetUncleError,
	type GetWorkError,
	type HashInput,
	type LogFilter,
	type LogType,
	type NetVersionError,
	type ProofType,
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
	type RpcTransactionRequest,
	type SendRawTransactionError,
	type SendTransactionError,
	type SignError,
	type SignTransactionError,
	type SimulateV1Error,
	type SimulateV2Error,
	type StorageProofType,
	type SubmitHashrateError,
	type SubmitWorkError,
	type SubscribeError,
	type TransactionIndexInput,
	type TransactionType,
	type UncleBlockType,
	type UninstallFilterError,
	type UnsubscribeError,
	type WaitForTransactionReceiptError,
	type WatchBlocksError,
} from "./ProviderService.js";
export { Simulation } from "./Simulation.js";
export {
	type SimulateV1BlockResult,
	type SimulateV1CallResult,
	type SimulateV1Payload,
	type SimulateV1Result,
	type SimulateV2Payload,
	type SimulateV2Result,
	SimulationService,
	type SimulationShape,
} from "./SimulationService.js";
export { Streaming } from "./Streaming.js";
export { StreamingService, type StreamingShape } from "./StreamingService.js";
export {
	type AssetChange,
	type SimulateCallsError,
	type SimulateCallsParams,
	type SimulationResult,
	simulateCalls,
} from "./simulateCalls.js";
export { Transaction } from "./Transaction.js";
export {
	TransactionService,
	type TransactionShape,
} from "./TransactionService.js";
