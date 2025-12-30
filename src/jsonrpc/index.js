/**
 * JSON-RPC module - Ethereum JSON-RPC Type System
 */

// Re-export all JSON-RPC envelope types as namespaces
export * as JsonRpcVersion from "./JsonRpcVersion/index.js";
export * as JsonRpcId from "./JsonRpcId/index.js";
export * as JsonRpcError from "./JsonRpcError/index.js";
export * as JsonRpcRequest from "./JsonRpcRequest/index.js";
export * as JsonRpcResponse from "./JsonRpcResponse/index.js";
export * as BatchRequest from "./BatchRequest/index.js";
export * as BatchResponse from "./BatchResponse/index.js";

// Export base primitive types
export {
	Quantity,
	Hash,
	BlockTag,
	BlockSpec,
	Data,
	Block,
} from "./base-types.js";

// Legacy helper
export { createRequest } from "./JsonRpcRequest.js";

import * as _anvilMethods from "./anvil/methods.js";
// Export namespace-specific methods for tree-shakable imports
import * as _ethMethods from "./eth/methods.js";
import * as _hardhatMethods from "./hardhat/methods.js";
import * as _netMethods from "./net/methods.js";
import * as _txpoolMethods from "./txpool/methods.js";
import * as _walletMethods from "./wallet/methods.js";
import * as _web3Methods from "./web3/methods.js";

export * as eth from "./eth/methods.js";
export * as anvil from "./anvil/methods.js";
export * as hardhat from "./hardhat/methods.js";
export * as net from "./net/methods.js";
export * as txpool from "./txpool/methods.js";
export * as wallet from "./wallet/methods.js";
export * as web3 from "./web3/methods.js";

/**
 * Rpc namespace - Modern API for creating JSON-RPC requests
 */
export const Rpc = {
	Eth: {
		AccountsRequest: _ethMethods.AccountsRequest,
		BlobBaseFeeRequest: _ethMethods.BlobBaseFeeRequest,
		BlockNumberRequest: _ethMethods.BlockNumberRequest,
		CallRequest: _ethMethods.CallRequest,
		ChainIdRequest: _ethMethods.ChainIdRequest,
		CoinbaseRequest: _ethMethods.CoinbaseRequest,
		CreateAccessListRequest: _ethMethods.CreateAccessListRequest,
		EstimateGasRequest: _ethMethods.EstimateGasRequest,
		FeeHistoryRequest: _ethMethods.FeeHistoryRequest,
		GasPriceRequest: _ethMethods.GasPriceRequest,
		GetBalanceRequest: _ethMethods.GetBalanceRequest,
		GetBlockByHashRequest: _ethMethods.GetBlockByHashRequest,
		GetBlockByNumberRequest: _ethMethods.GetBlockByNumberRequest,
		GetBlockReceiptsRequest: _ethMethods.GetBlockReceiptsRequest,
		GetBlockTransactionCountByHashRequest:
			_ethMethods.GetBlockTransactionCountByHashRequest,
		GetBlockTransactionCountByNumberRequest:
			_ethMethods.GetBlockTransactionCountByNumberRequest,
		GetCodeRequest: _ethMethods.GetCodeRequest,
		GetFilterChangesRequest: _ethMethods.GetFilterChangesRequest,
		GetFilterLogsRequest: _ethMethods.GetFilterLogsRequest,
		GetLogsRequest: _ethMethods.GetLogsRequest,
		GetProofRequest: _ethMethods.GetProofRequest,
		GetStorageAtRequest: _ethMethods.GetStorageAtRequest,
		GetTransactionByBlockHashAndIndexRequest:
			_ethMethods.GetTransactionByBlockHashAndIndexRequest,
		GetTransactionByBlockNumberAndIndexRequest:
			_ethMethods.GetTransactionByBlockNumberAndIndexRequest,
		GetTransactionByHashRequest: _ethMethods.GetTransactionByHashRequest,
		GetTransactionCountRequest: _ethMethods.GetTransactionCountRequest,
		GetTransactionReceiptRequest: _ethMethods.GetTransactionReceiptRequest,
		GetUncleCountByBlockHashRequest:
			_ethMethods.GetUncleCountByBlockHashRequest,
		GetUncleCountByBlockNumberRequest:
			_ethMethods.GetUncleCountByBlockNumberRequest,
		GetUncleByBlockHashAndIndexRequest:
			_ethMethods.GetUncleByBlockHashAndIndexRequest,
		GetUncleByBlockNumberAndIndexRequest:
			_ethMethods.GetUncleByBlockNumberAndIndexRequest,
		MaxPriorityFeePerGasRequest: _ethMethods.MaxPriorityFeePerGasRequest,
		NewBlockFilterRequest: _ethMethods.NewBlockFilterRequest,
		NewFilterRequest: _ethMethods.NewFilterRequest,
		NewPendingTransactionFilterRequest:
			_ethMethods.NewPendingTransactionFilterRequest,
		SendRawTransactionRequest: _ethMethods.SendRawTransactionRequest,
		SendTransactionRequest: _ethMethods.SendTransactionRequest,
		SignRequest: _ethMethods.SignRequest,
		SignTransactionRequest: _ethMethods.SignTransactionRequest,
		SimulateV1Request: _ethMethods.SimulateV1Request,
		SyncingRequest: _ethMethods.SyncingRequest,
		UninstallFilterRequest: _ethMethods.UninstallFilterRequest,
		SubscribeRequest: _ethMethods.SubscribeRequest,
		UnsubscribeRequest: _ethMethods.UnsubscribeRequest,
		GetWorkRequest: _ethMethods.GetWorkRequest,
		SubmitWorkRequest: _ethMethods.SubmitWorkRequest,
		SubmitHashrateRequest: _ethMethods.SubmitHashrateRequest,
		HashrateRequest: _ethMethods.HashrateRequest,
		MiningRequest: _ethMethods.MiningRequest,
		ProtocolVersionRequest: _ethMethods.ProtocolVersionRequest,
	},
	Wallet: {
		SwitchEthereumChainRequest: _walletMethods.WalletSwitchEthereumChainRequest,
		AddEthereumChainRequest: _walletMethods.WalletAddEthereumChainRequest,
		WatchAssetRequest: _walletMethods.WalletWatchAssetRequest,
		RequestPermissionsRequest: _walletMethods.WalletRequestPermissionsRequest,
		GetPermissionsRequest: _walletMethods.WalletGetPermissionsRequest,
		RevokePermissionsRequest: _walletMethods.WalletRevokePermissionsRequest,
	},
	Anvil: _anvilMethods,
	Hardhat: _hardhatMethods,
	Web3: {
		ClientVersionRequest: _web3Methods.ClientVersionRequest,
		Sha3Request: _web3Methods.Sha3Request,
	},
	Net: {
		VersionRequest: _netMethods.VersionRequest,
		ListeningRequest: _netMethods.ListeningRequest,
		PeerCountRequest: _netMethods.PeerCountRequest,
	},
	Txpool: {
		StatusRequest: _txpoolMethods.StatusRequest,
		ContentRequest: _txpoolMethods.ContentRequest,
		InspectRequest: _txpoolMethods.InspectRequest,
	},
};
