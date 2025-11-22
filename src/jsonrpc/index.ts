/**
 * JSON-RPC - Ethereum JSON-RPC Type System
 *
 * Type-safe Ethereum JSON-RPC method definitions generated from the official OpenRPC specification.
 * Provides complete type coverage for eth, debug, and engine namespaces.
 *
 * @module jsonrpc
 */

// Re-export all JSON-RPC types and methods
export * from "./JsonRpc.js";

// Export namespace-specific methods for tree-shakable imports
export * as eth from "./eth/methods.js";
export * as debug from "./debug/methods.js";
export * as engine from "./engine/methods.js";
export * as wallet from "./wallet/methods.js";
export * as anvil from "./anvil/methods.js";
export * as hardhat from "./hardhat/methods.js";

// Export shared types
export * as types from "./types/index.js";

// ============================================================================
// Rpc Namespace - Request Constructor API
// ============================================================================

import * as _anvilMethods from "./anvil/methods.js";
/**
 * Rpc namespace - Modern API for creating JSON-RPC requests
 *
 * @example
 * ```typescript
 * import { Rpc } from './jsonrpc'
 *
 * // Create requests with branded types
 * const balanceReq = Rpc.Eth.GetBalanceRequest('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0', 'latest')
 * const callReq = Rpc.Eth.CallRequest({ to: '0x...', data: '0x...' }, 'latest')
 * const blockReq = Rpc.Eth.GetBlockByNumberRequest('0x1', false)
 * const switchChain = Rpc.Wallet.SwitchEthereumChainRequest('0x1')
 * ```
 */
import * as _ethMethods from "./eth/methods.js";
import * as _hardhatMethods from "./hardhat/methods.js";
import * as _walletMethods from "./wallet/methods.js";

export namespace Rpc {
	/**
	 * Eth namespace - Request constructors for eth_ methods
	 */
	export const Eth = {
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
	};

	/**
	 * Wallet namespace - Request constructors for wallet_ methods (EIP-3326, EIP-747)
	 */
	export const Wallet = {
		SwitchEthereumChainRequest: _walletMethods.WalletSwitchEthereumChainRequest,
		AddEthereumChainRequest: _walletMethods.WalletAddEthereumChainRequest,
		WatchAssetRequest: _walletMethods.WalletWatchAssetRequest,
		RequestPermissionsRequest: _walletMethods.WalletRequestPermissionsRequest,
		GetPermissionsRequest: _walletMethods.WalletGetPermissionsRequest,
		RevokePermissionsRequest: _walletMethods.WalletRevokePermissionsRequest,
	};

	/**
	 * Anvil namespace - Request constructors for Anvil/Foundry testing methods
	 */
	export const Anvil = _anvilMethods;

	/**
	 * Hardhat namespace - Request constructors for Hardhat Network methods
	 */
	export const Hardhat = _hardhatMethods;
}
