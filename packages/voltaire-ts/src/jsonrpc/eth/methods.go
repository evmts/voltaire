package eth

// Package eth provides Eth JSON-RPC methods.
//
// This file provides a type-safe mapping of eth namespace methods.

// Method name constants
const (
	MethodEthAccounts = "eth_accounts"
	MethodEthBlobBaseFee = "eth_blobBaseFee"
	MethodEthBlockNumber = "eth_blockNumber"
	MethodEthCall = "eth_call"
	MethodEthChainId = "eth_chainId"
	MethodEthCoinbase = "eth_coinbase"
	MethodEthCreateAccessList = "eth_createAccessList"
	MethodEthEstimateGas = "eth_estimateGas"
	MethodEthFeeHistory = "eth_feeHistory"
	MethodEthGasPrice = "eth_gasPrice"
	MethodEthGetBalance = "eth_getBalance"
	MethodEthGetBlockByHash = "eth_getBlockByHash"
	MethodEthGetBlockByNumber = "eth_getBlockByNumber"
	MethodEthGetBlockReceipts = "eth_getBlockReceipts"
	MethodEthGetBlockTransactionCountByHash = "eth_getBlockTransactionCountByHash"
	MethodEthGetBlockTransactionCountByNumber = "eth_getBlockTransactionCountByNumber"
	MethodEthGetCode = "eth_getCode"
	MethodEthGetFilterChanges = "eth_getFilterChanges"
	MethodEthGetFilterLogs = "eth_getFilterLogs"
	MethodEthGetLogs = "eth_getLogs"
	MethodEthGetProof = "eth_getProof"
	MethodEthGetStorageAt = "eth_getStorageAt"
	MethodEthGetTransactionByBlockHashAndIndex = "eth_getTransactionByBlockHashAndIndex"
	MethodEthGetTransactionByBlockNumberAndIndex = "eth_getTransactionByBlockNumberAndIndex"
	MethodEthGetTransactionByHash = "eth_getTransactionByHash"
	MethodEthGetTransactionCount = "eth_getTransactionCount"
	MethodEthGetTransactionReceipt = "eth_getTransactionReceipt"
	MethodEthGetUncleCountByBlockHash = "eth_getUncleCountByBlockHash"
	MethodEthGetUncleCountByBlockNumber = "eth_getUncleCountByBlockNumber"
	MethodEthMaxPriorityFeePerGas = "eth_maxPriorityFeePerGas"
	MethodEthNewBlockFilter = "eth_newBlockFilter"
	MethodEthNewFilter = "eth_newFilter"
	MethodEthNewPendingTransactionFilter = "eth_newPendingTransactionFilter"
	MethodEthSendRawTransaction = "eth_sendRawTransaction"
	MethodEthSendTransaction = "eth_sendTransaction"
	MethodEthSign = "eth_sign"
	MethodEthSignTransaction = "eth_signTransaction"
	MethodEthSimulateV1 = "eth_simulateV1"
	MethodEthSyncing = "eth_syncing"
	MethodEthUninstallFilter = "eth_uninstallFilter"
)

// MethodRegistry maps method names to their string identifiers
var MethodRegistry = map[string]string{
	"eth_accounts": MethodEthAccounts,
	"eth_blobBaseFee": MethodEthBlobBaseFee,
	"eth_blockNumber": MethodEthBlockNumber,
	"eth_call": MethodEthCall,
	"eth_chainId": MethodEthChainId,
	"eth_coinbase": MethodEthCoinbase,
	"eth_createAccessList": MethodEthCreateAccessList,
	"eth_estimateGas": MethodEthEstimateGas,
	"eth_feeHistory": MethodEthFeeHistory,
	"eth_gasPrice": MethodEthGasPrice,
	"eth_getBalance": MethodEthGetBalance,
	"eth_getBlockByHash": MethodEthGetBlockByHash,
	"eth_getBlockByNumber": MethodEthGetBlockByNumber,
	"eth_getBlockReceipts": MethodEthGetBlockReceipts,
	"eth_getBlockTransactionCountByHash": MethodEthGetBlockTransactionCountByHash,
	"eth_getBlockTransactionCountByNumber": MethodEthGetBlockTransactionCountByNumber,
	"eth_getCode": MethodEthGetCode,
	"eth_getFilterChanges": MethodEthGetFilterChanges,
	"eth_getFilterLogs": MethodEthGetFilterLogs,
	"eth_getLogs": MethodEthGetLogs,
	"eth_getProof": MethodEthGetProof,
	"eth_getStorageAt": MethodEthGetStorageAt,
	"eth_getTransactionByBlockHashAndIndex": MethodEthGetTransactionByBlockHashAndIndex,
	"eth_getTransactionByBlockNumberAndIndex": MethodEthGetTransactionByBlockNumberAndIndex,
	"eth_getTransactionByHash": MethodEthGetTransactionByHash,
	"eth_getTransactionCount": MethodEthGetTransactionCount,
	"eth_getTransactionReceipt": MethodEthGetTransactionReceipt,
	"eth_getUncleCountByBlockHash": MethodEthGetUncleCountByBlockHash,
	"eth_getUncleCountByBlockNumber": MethodEthGetUncleCountByBlockNumber,
	"eth_maxPriorityFeePerGas": MethodEthMaxPriorityFeePerGas,
	"eth_newBlockFilter": MethodEthNewBlockFilter,
	"eth_newFilter": MethodEthNewFilter,
	"eth_newPendingTransactionFilter": MethodEthNewPendingTransactionFilter,
	"eth_sendRawTransaction": MethodEthSendRawTransaction,
	"eth_sendTransaction": MethodEthSendTransaction,
	"eth_sign": MethodEthSign,
	"eth_signTransaction": MethodEthSignTransaction,
	"eth_simulateV1": MethodEthSimulateV1,
	"eth_syncing": MethodEthSyncing,
	"eth_uninstallFilter": MethodEthUninstallFilter,
}
