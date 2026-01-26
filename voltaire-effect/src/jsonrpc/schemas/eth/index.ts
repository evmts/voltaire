/**
 * @fileoverview Effect Schemas for eth_* JSON-RPC methods.
 * @module jsonrpc/schemas/eth
 * @since 0.1.0
 */

import * as S from "effect/Schema";

// =============================================================================
// Re-export individual method schemas
// =============================================================================

export * from "./accounts.js";
export * from "./blobBaseFee.js";
export * from "./blockNumber.js";
export * from "./call.js";
export * from "./chainId.js";
export * from "./coinbase.js";
export * from "./createAccessList.js";
export * from "./estimateGas.js";
export * from "./feeHistory.js";
export * from "./gasPrice.js";
export * from "./getBalance.js";
export * from "./getBlockByHash.js";
export * from "./getBlockByNumber.js";
export * from "./getBlockReceipts.js";
export * from "./getBlockTransactionCountByHash.js";
export * from "./getBlockTransactionCountByNumber.js";
export * from "./getCode.js";
export * from "./getFilterChanges.js";
export * from "./getFilterLogs.js";
export * from "./getLogs.js";
export * from "./getProof.js";
export * from "./getStorageAt.js";
export * from "./getWork.js";
export * from "./getTransactionByBlockHashAndIndex.js";
export * from "./getTransactionByBlockNumberAndIndex.js";
export * from "./getTransactionByHash.js";
export * from "./getTransactionCount.js";
export * from "./getTransactionReceipt.js";
export * from "./getUncleByBlockHashAndIndex.js";
export * from "./getUncleByBlockNumberAndIndex.js";
export * from "./getUncleCountByBlockHash.js";
export * from "./getUncleCountByBlockNumber.js";
export * from "./hashrate.js";
export * from "./maxPriorityFeePerGas.js";
export * from "./mining.js";
export * from "./newBlockFilter.js";
export * from "./newFilter.js";
export * from "./newPendingTransactionFilter.js";
export * from "./protocolVersion.js";
export * from "./sendRawTransaction.js";
export * from "./sendTransaction.js";
export * from "./sign.js";
export * from "./signTransaction.js";
export * from "./submitHashrate.js";
export * from "./submitWork.js";
export * from "./subscribe.js";
export * from "./syncing.js";
export * from "./uninstallFilter.js";
export * from "./unsubscribe.js";

// =============================================================================
// Import for union building
// =============================================================================

import { AccountsRequest } from "./accounts.js";
import { BlobBaseFeeRequest } from "./blobBaseFee.js";
import { BlockNumberRequest } from "./blockNumber.js";
import { CallRequest } from "./call.js";
import { ChainIdRequest } from "./chainId.js";
import { CoinbaseRequest } from "./coinbase.js";
import { CreateAccessListRequest } from "./createAccessList.js";
import { EstimateGasRequest } from "./estimateGas.js";
import { FeeHistoryRequest } from "./feeHistory.js";
import { GasPriceRequest } from "./gasPrice.js";
import { GetBalanceRequest } from "./getBalance.js";
import { GetBlockByHashRequest } from "./getBlockByHash.js";
import { GetBlockByNumberRequest } from "./getBlockByNumber.js";
import { GetBlockReceiptsRequest } from "./getBlockReceipts.js";
import { GetBlockTransactionCountByHashRequest } from "./getBlockTransactionCountByHash.js";
import { GetBlockTransactionCountByNumberRequest } from "./getBlockTransactionCountByNumber.js";
import { GetCodeRequest } from "./getCode.js";
import { GetFilterChangesRequest } from "./getFilterChanges.js";
import { GetFilterLogsRequest } from "./getFilterLogs.js";
import { GetLogsRequest } from "./getLogs.js";
import { GetProofRequest } from "./getProof.js";
import { GetStorageAtRequest } from "./getStorageAt.js";
import { GetWorkRequest } from "./getWork.js";
import { GetTransactionByBlockHashAndIndexRequest } from "./getTransactionByBlockHashAndIndex.js";
import { GetTransactionByBlockNumberAndIndexRequest } from "./getTransactionByBlockNumberAndIndex.js";
import { GetTransactionByHashRequest } from "./getTransactionByHash.js";
import { GetTransactionCountRequest } from "./getTransactionCount.js";
import { GetTransactionReceiptRequest } from "./getTransactionReceipt.js";
import { GetUncleByBlockHashAndIndexRequest } from "./getUncleByBlockHashAndIndex.js";
import { GetUncleByBlockNumberAndIndexRequest } from "./getUncleByBlockNumberAndIndex.js";
import { GetUncleCountByBlockHashRequest } from "./getUncleCountByBlockHash.js";
import { GetUncleCountByBlockNumberRequest } from "./getUncleCountByBlockNumber.js";
import { HashrateRequest } from "./hashrate.js";
import { MaxPriorityFeePerGasRequest } from "./maxPriorityFeePerGas.js";
import { MiningRequest } from "./mining.js";
import { NewBlockFilterRequest } from "./newBlockFilter.js";
import { NewFilterRequest } from "./newFilter.js";
import { NewPendingTransactionFilterRequest } from "./newPendingTransactionFilter.js";
import { ProtocolVersionRequest } from "./protocolVersion.js";
import { SendRawTransactionRequest } from "./sendRawTransaction.js";
import { SendTransactionRequest } from "./sendTransaction.js";
import { SignRequest } from "./sign.js";
import { SignTransactionRequest } from "./signTransaction.js";
import { SubmitHashrateRequest } from "./submitHashrate.js";
import { SubmitWorkRequest } from "./submitWork.js";
import { SubscribeRequest } from "./subscribe.js";
import { SyncingRequest } from "./syncing.js";
import { UninstallFilterRequest } from "./uninstallFilter.js";
import { UnsubscribeRequest } from "./unsubscribe.js";

// =============================================================================
// Union Schema for all eth_* requests
// =============================================================================

/**
 * Union schema for all eth_* JSON-RPC request types.
 * Discriminates on the `method` field.
 */
export const EthMethodRequest = S.Union(
	AccountsRequest,
	BlobBaseFeeRequest,
	BlockNumberRequest,
	CallRequest,
	ChainIdRequest,
	CoinbaseRequest,
	CreateAccessListRequest,
	EstimateGasRequest,
	FeeHistoryRequest,
	GasPriceRequest,
	GetBalanceRequest,
	GetBlockByHashRequest,
	GetBlockByNumberRequest,
	GetBlockReceiptsRequest,
	GetBlockTransactionCountByHashRequest,
	GetBlockTransactionCountByNumberRequest,
	GetCodeRequest,
	GetFilterChangesRequest,
	GetFilterLogsRequest,
	GetLogsRequest,
	GetProofRequest,
	GetStorageAtRequest,
	GetWorkRequest,
	GetTransactionByBlockHashAndIndexRequest,
	GetTransactionByBlockNumberAndIndexRequest,
	GetTransactionByHashRequest,
	GetTransactionCountRequest,
	GetTransactionReceiptRequest,
	GetUncleByBlockHashAndIndexRequest,
	GetUncleByBlockNumberAndIndexRequest,
	GetUncleCountByBlockHashRequest,
	GetUncleCountByBlockNumberRequest,
	HashrateRequest,
	MaxPriorityFeePerGasRequest,
	MiningRequest,
	NewBlockFilterRequest,
	NewFilterRequest,
	NewPendingTransactionFilterRequest,
	ProtocolVersionRequest,
	SendRawTransactionRequest,
	SendTransactionRequest,
	SignRequest,
	SignTransactionRequest,
	SubmitHashrateRequest,
	SubmitWorkRequest,
	SubscribeRequest,
	SyncingRequest,
	UninstallFilterRequest,
	UnsubscribeRequest,
);

/** Type for EthMethodRequest union */
export type EthMethodRequestType = S.Schema.Type<typeof EthMethodRequest>;
