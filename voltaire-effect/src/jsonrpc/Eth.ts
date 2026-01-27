import { nextId } from "./IdCounter.js";
import type { JsonRpcRequestType } from "./Request.js";

function makeRequest(
	method: string,
	params: unknown[] = [],
): JsonRpcRequestType {
	return {
		jsonrpc: "2.0",
		method,
		params,
		id: nextId(),
	};
}

export const AccountsRequest = () => makeRequest("eth_accounts");
export const BlobBaseFeeRequest = () => makeRequest("eth_blobBaseFee");
export const BlockNumberRequest = () => makeRequest("eth_blockNumber");
export const CallRequest = (
	tx: unknown,
	blockTag: string = "latest",
	stateOverride?: unknown,
	blockOverrides?: unknown,
) => {
	const params: unknown[] = [tx, blockTag];
	if (stateOverride !== undefined) {
		params.push(stateOverride);
	}
	if (blockOverrides !== undefined) {
		// Ensure stateOverride is included (even if undefined) when blockOverrides is present
		if (stateOverride === undefined) {
			params.push(undefined);
		}
		params.push(blockOverrides);
	}
	return makeRequest("eth_call", params);
};
export const ChainIdRequest = () => makeRequest("eth_chainId");
export const CoinbaseRequest = () => makeRequest("eth_coinbase");
export const CreateAccessListRequest = (tx: unknown) =>
	makeRequest("eth_createAccessList", [tx]);
export const EstimateGasRequest = (
	tx: unknown,
	blockTag?: string,
	stateOverride?: unknown,
) => {
	const params: unknown[] = [tx];
	if (blockTag !== undefined) {
		params.push(blockTag);
	}
	if (stateOverride !== undefined) {
		// Ensure blockTag is included when stateOverride is present
		if (blockTag === undefined) {
			params.push("latest");
		}
		params.push(stateOverride);
	}
	return makeRequest("eth_estimateGas", params);
};
export const FeeHistoryRequest = (
	blockCount: number | string,
	newestBlock: string,
	rewardPercentiles: number[],
) =>
	makeRequest("eth_feeHistory", [blockCount, newestBlock, rewardPercentiles]);
export const GasPriceRequest = () => makeRequest("eth_gasPrice");
export const GetBalanceRequest = (
	address: string,
	blockTag: string = "latest",
) => makeRequest("eth_getBalance", [address, blockTag]);
export const GetBlockByHashRequest = (hash: string, fullTx: boolean = false) =>
	makeRequest("eth_getBlockByHash", [hash, fullTx]);
export const GetBlockByNumberRequest = (
	blockNumber: string,
	fullTx: boolean = false,
) => makeRequest("eth_getBlockByNumber", [blockNumber, fullTx]);
export const GetBlockReceiptsRequest = (blockId: string) =>
	makeRequest("eth_getBlockReceipts", [blockId]);
export const GetBlockTransactionCountByHashRequest = (hash: string) =>
	makeRequest("eth_getBlockTransactionCountByHash", [hash]);
export const GetBlockTransactionCountByNumberRequest = (blockNumber: string) =>
	makeRequest("eth_getBlockTransactionCountByNumber", [blockNumber]);
export const GetCodeRequest = (address: string, blockTag: string = "latest") =>
	makeRequest("eth_getCode", [address, blockTag]);
export const GetFilterChangesRequest = (filterId: string) =>
	makeRequest("eth_getFilterChanges", [filterId]);
export const GetFilterLogsRequest = (filterId: string) =>
	makeRequest("eth_getFilterLogs", [filterId]);
export const GetLogsRequest = (filter: unknown) =>
	makeRequest("eth_getLogs", [filter]);
export const GetProofRequest = (
	address: string,
	storageKeys: string[],
	blockTag: string = "latest",
) => makeRequest("eth_getProof", [address, storageKeys, blockTag]);
export const GetStorageAtRequest = (
	address: string,
	slot: string,
	blockTag: string = "latest",
) => makeRequest("eth_getStorageAt", [address, slot, blockTag]);
export const GetTransactionByBlockHashAndIndexRequest = (
	blockHash: string,
	index: string,
) => makeRequest("eth_getTransactionByBlockHashAndIndex", [blockHash, index]);
export const GetTransactionByBlockNumberAndIndexRequest = (
	blockNumber: string,
	index: string,
) =>
	makeRequest("eth_getTransactionByBlockNumberAndIndex", [blockNumber, index]);
export const GetTransactionByHashRequest = (hash: string) =>
	makeRequest("eth_getTransactionByHash", [hash]);
export const GetTransactionCountRequest = (
	address: string,
	blockTag: string = "latest",
) => makeRequest("eth_getTransactionCount", [address, blockTag]);
export const GetTransactionReceiptRequest = (hash: string) =>
	makeRequest("eth_getTransactionReceipt", [hash]);
export const GetUncleCountByBlockHashRequest = (hash: string) =>
	makeRequest("eth_getUncleCountByBlockHash", [hash]);
export const GetUncleCountByBlockNumberRequest = (blockNumber: string) =>
	makeRequest("eth_getUncleCountByBlockNumber", [blockNumber]);
export const GetUncleByBlockHashAndIndexRequest = (
	blockHash: string,
	index: string,
) => makeRequest("eth_getUncleByBlockHashAndIndex", [blockHash, index]);
export const GetUncleByBlockNumberAndIndexRequest = (
	blockNumber: string,
	index: string,
) => makeRequest("eth_getUncleByBlockNumberAndIndex", [blockNumber, index]);
export const MaxPriorityFeePerGasRequest = () =>
	makeRequest("eth_maxPriorityFeePerGas");
export const NewBlockFilterRequest = () => makeRequest("eth_newBlockFilter");
export const NewFilterRequest = (filter: unknown) =>
	makeRequest("eth_newFilter", [filter]);
export const NewPendingTransactionFilterRequest = () =>
	makeRequest("eth_newPendingTransactionFilter");
export const SendRawTransactionRequest = (signedTx: string) =>
	makeRequest("eth_sendRawTransaction", [signedTx]);
export const SendTransactionRequest = (tx: unknown) =>
	makeRequest("eth_sendTransaction", [tx]);
export const SignRequest = (address: string, message: string) =>
	makeRequest("eth_sign", [address, message]);
export const SignTransactionRequest = (tx: unknown) =>
	makeRequest("eth_signTransaction", [tx]);
export const SimulateV1Request = (
	calls: unknown[],
	blockTag: string = "latest",
) => makeRequest("eth_simulateV1", [calls, blockTag]);
export const SimulateV2Request = (
	payload: unknown,
	blockTag: string = "latest",
) => makeRequest("eth_simulateV2", [payload, blockTag]);
export const SyncingRequest = () => makeRequest("eth_syncing");
export const UninstallFilterRequest = (filterId: string) =>
	makeRequest("eth_uninstallFilter", [filterId]);
export const SubscribeRequest = (...args: unknown[]) =>
	makeRequest("eth_subscribe", args);
export const UnsubscribeRequest = (subscriptionId: string) =>
	makeRequest("eth_unsubscribe", [subscriptionId]);
export const GetWorkRequest = () => makeRequest("eth_getWork");
export const SubmitWorkRequest = (
	nonce: string,
	powHash: string,
	mixDigest: string,
) => makeRequest("eth_submitWork", [nonce, powHash, mixDigest]);
export const SubmitHashrateRequest = (hashrate: string, id: string) =>
	makeRequest("eth_submitHashrate", [hashrate, id]);
export const HashrateRequest = () => makeRequest("eth_hashrate");
export const MiningRequest = () => makeRequest("eth_mining");
export const ProtocolVersionRequest = () => makeRequest("eth_protocolVersion");

export const Eth = {
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
	GetTransactionByBlockHashAndIndexRequest,
	GetTransactionByBlockNumberAndIndexRequest,
	GetTransactionByHashRequest,
	GetTransactionCountRequest,
	GetTransactionReceiptRequest,
	GetUncleCountByBlockHashRequest,
	GetUncleCountByBlockNumberRequest,
	GetUncleByBlockHashAndIndexRequest,
	GetUncleByBlockNumberAndIndexRequest,
	MaxPriorityFeePerGasRequest,
	NewBlockFilterRequest,
	NewFilterRequest,
	NewPendingTransactionFilterRequest,
	SendRawTransactionRequest,
	SendTransactionRequest,
	SignRequest,
	SignTransactionRequest,
	SimulateV1Request,
	SimulateV2Request,
	SyncingRequest,
	UninstallFilterRequest,
	SubscribeRequest,
	UnsubscribeRequest,
	GetWorkRequest,
	SubmitWorkRequest,
	SubmitHashrateRequest,
	HashrateRequest,
	MiningRequest,
	ProtocolVersionRequest,
};
