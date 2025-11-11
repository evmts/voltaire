/**
 * Eth JSON-RPC Methods
 *
 * This module provides a type-safe mapping of eth namespace methods to their types.
 * All imports are kept separate to maintain tree-shakability.
 */

// Method imports - each import is separate for tree-shaking
import * as eth_accounts from './accounts/eth_accounts.js'
import * as eth_blobBaseFee from './blobBaseFee/eth_blobBaseFee.js'
import * as eth_blockNumber from './blockNumber/eth_blockNumber.js'
import * as eth_call from './call/eth_call.js'
import * as eth_chainId from './chainId/eth_chainId.js'
import * as eth_coinbase from './coinbase/eth_coinbase.js'
import * as eth_createAccessList from './createAccessList/eth_createAccessList.js'
import * as eth_estimateGas from './estimateGas/eth_estimateGas.js'
import * as eth_feeHistory from './feeHistory/eth_feeHistory.js'
import * as eth_gasPrice from './gasPrice/eth_gasPrice.js'
import * as eth_getBalance from './getBalance/eth_getBalance.js'
import * as eth_getBlockByHash from './getBlockByHash/eth_getBlockByHash.js'
import * as eth_getBlockByNumber from './getBlockByNumber/eth_getBlockByNumber.js'
import * as eth_getBlockReceipts from './getBlockReceipts/eth_getBlockReceipts.js'
import * as eth_getBlockTransactionCountByHash from './getBlockTransactionCountByHash/eth_getBlockTransactionCountByHash.js'
import * as eth_getBlockTransactionCountByNumber from './getBlockTransactionCountByNumber/eth_getBlockTransactionCountByNumber.js'
import * as eth_getCode from './getCode/eth_getCode.js'
import * as eth_getFilterChanges from './getFilterChanges/eth_getFilterChanges.js'
import * as eth_getFilterLogs from './getFilterLogs/eth_getFilterLogs.js'
import * as eth_getLogs from './getLogs/eth_getLogs.js'
import * as eth_getProof from './getProof/eth_getProof.js'
import * as eth_getStorageAt from './getStorageAt/eth_getStorageAt.js'
import * as eth_getTransactionByBlockHashAndIndex from './getTransactionByBlockHashAndIndex/eth_getTransactionByBlockHashAndIndex.js'
import * as eth_getTransactionByBlockNumberAndIndex from './getTransactionByBlockNumberAndIndex/eth_getTransactionByBlockNumberAndIndex.js'
import * as eth_getTransactionByHash from './getTransactionByHash/eth_getTransactionByHash.js'
import * as eth_getTransactionCount from './getTransactionCount/eth_getTransactionCount.js'
import * as eth_getTransactionReceipt from './getTransactionReceipt/eth_getTransactionReceipt.js'
import * as eth_getUncleCountByBlockHash from './getUncleCountByBlockHash/eth_getUncleCountByBlockHash.js'
import * as eth_getUncleCountByBlockNumber from './getUncleCountByBlockNumber/eth_getUncleCountByBlockNumber.js'
import * as eth_maxPriorityFeePerGas from './maxPriorityFeePerGas/eth_maxPriorityFeePerGas.js'
import * as eth_newBlockFilter from './newBlockFilter/eth_newBlockFilter.js'
import * as eth_newFilter from './newFilter/eth_newFilter.js'
import * as eth_newPendingTransactionFilter from './newPendingTransactionFilter/eth_newPendingTransactionFilter.js'
import * as eth_sendRawTransaction from './sendRawTransaction/eth_sendRawTransaction.js'
import * as eth_sendTransaction from './sendTransaction/eth_sendTransaction.js'
import * as eth_sign from './sign/eth_sign.js'
import * as eth_signTransaction from './signTransaction/eth_signTransaction.js'
import * as eth_simulateV1 from './simulateV1/eth_simulateV1.js'
import * as eth_syncing from './syncing/eth_syncing.js'
import * as eth_uninstallFilter from './uninstallFilter/eth_uninstallFilter.js'

/**
 * Method name enum - provides string literals for each method
 *
 * @typedef {(typeof EthMethod)[keyof typeof EthMethod]} EthMethod
 */
export const EthMethod = {
  eth_accounts: 'eth_accounts',
  eth_blobBaseFee: 'eth_blobBaseFee',
  eth_blockNumber: 'eth_blockNumber',
  eth_call: 'eth_call',
  eth_chainId: 'eth_chainId',
  eth_coinbase: 'eth_coinbase',
  eth_createAccessList: 'eth_createAccessList',
  eth_estimateGas: 'eth_estimateGas',
  eth_feeHistory: 'eth_feeHistory',
  eth_gasPrice: 'eth_gasPrice',
  eth_getBalance: 'eth_getBalance',
  eth_getBlockByHash: 'eth_getBlockByHash',
  eth_getBlockByNumber: 'eth_getBlockByNumber',
  eth_getBlockReceipts: 'eth_getBlockReceipts',
  eth_getBlockTransactionCountByHash: 'eth_getBlockTransactionCountByHash',
  eth_getBlockTransactionCountByNumber: 'eth_getBlockTransactionCountByNumber',
  eth_getCode: 'eth_getCode',
  eth_getFilterChanges: 'eth_getFilterChanges',
  eth_getFilterLogs: 'eth_getFilterLogs',
  eth_getLogs: 'eth_getLogs',
  eth_getProof: 'eth_getProof',
  eth_getStorageAt: 'eth_getStorageAt',
  eth_getTransactionByBlockHashAndIndex: 'eth_getTransactionByBlockHashAndIndex',
  eth_getTransactionByBlockNumberAndIndex: 'eth_getTransactionByBlockNumberAndIndex',
  eth_getTransactionByHash: 'eth_getTransactionByHash',
  eth_getTransactionCount: 'eth_getTransactionCount',
  eth_getTransactionReceipt: 'eth_getTransactionReceipt',
  eth_getUncleCountByBlockHash: 'eth_getUncleCountByBlockHash',
  eth_getUncleCountByBlockNumber: 'eth_getUncleCountByBlockNumber',
  eth_maxPriorityFeePerGas: 'eth_maxPriorityFeePerGas',
  eth_newBlockFilter: 'eth_newBlockFilter',
  eth_newFilter: 'eth_newFilter',
  eth_newPendingTransactionFilter: 'eth_newPendingTransactionFilter',
  eth_sendRawTransaction: 'eth_sendRawTransaction',
  eth_sendTransaction: 'eth_sendTransaction',
  eth_sign: 'eth_sign',
  eth_signTransaction: 'eth_signTransaction',
  eth_simulateV1: 'eth_simulateV1',
  eth_syncing: 'eth_syncing',
  eth_uninstallFilter: 'eth_uninstallFilter',
}

// Re-export individual method modules for direct access (tree-shakable)
export {
  eth_accounts,
  eth_blobBaseFee,
  eth_blockNumber,
  eth_call,
  eth_chainId,
  eth_coinbase,
  eth_createAccessList,
  eth_estimateGas,
  eth_feeHistory,
  eth_gasPrice,
  eth_getBalance,
  eth_getBlockByHash,
  eth_getBlockByNumber,
  eth_getBlockReceipts,
  eth_getBlockTransactionCountByHash,
  eth_getBlockTransactionCountByNumber,
  eth_getCode,
  eth_getFilterChanges,
  eth_getFilterLogs,
  eth_getLogs,
  eth_getProof,
  eth_getStorageAt,
  eth_getTransactionByBlockHashAndIndex,
  eth_getTransactionByBlockNumberAndIndex,
  eth_getTransactionByHash,
  eth_getTransactionCount,
  eth_getTransactionReceipt,
  eth_getUncleCountByBlockHash,
  eth_getUncleCountByBlockNumber,
  eth_maxPriorityFeePerGas,
  eth_newBlockFilter,
  eth_newFilter,
  eth_newPendingTransactionFilter,
  eth_sendRawTransaction,
  eth_sendTransaction,
  eth_sign,
  eth_signTransaction,
  eth_simulateV1,
  eth_syncing,
  eth_uninstallFilter,
}
