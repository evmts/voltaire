/**
 * @fileoverview Free functions for Provider operations.
 *
 * @module Provider/functions
 * @since 0.4.0
 */

// Block operations
export { getBlockNumber } from "./getBlockNumber.js";
export { getBlock } from "./getBlock.js";
export { getBlockTransactionCount } from "./getBlockTransactionCount.js";
export { getBlockReceipts } from "./getBlockReceipts.js";
export { getUncle } from "./getUncle.js";
export { getUncleCount } from "./getUncleCount.js";

// Account operations
export { getBalance } from "./getBalance.js";
export { getTransactionCount } from "./getTransactionCount.js";
export { getCode } from "./getCode.js";
export { getStorageAt } from "./getStorageAt.js";
export { getProof } from "./getProof.js";

// Transaction operations
export { getTransaction } from "./getTransaction.js";
export { getTransactionReceipt } from "./getTransactionReceipt.js";
export { getTransactionByBlockHashAndIndex } from "./getTransactionByBlockHashAndIndex.js";
export { getTransactionByBlockNumberAndIndex } from "./getTransactionByBlockNumberAndIndex.js";
export { sendRawTransaction } from "./sendRawTransaction.js";
export { getTransactionConfirmations } from "./getTransactionConfirmations.js";
export { waitForTransactionReceipt, type WaitForTransactionReceiptOptions } from "./waitForTransactionReceipt.js";

// Call and simulation operations
export { call } from "./call.js";
export { estimateGas } from "./estimateGas.js";
export { createAccessList, type CreateAccessListResult } from "./createAccessList.js";
export { simulateV1 } from "./simulateV1.js";
export { simulateV2 } from "./simulateV2.js";

// Event/Log operations
export { getLogs } from "./getLogs.js";
export { createEventFilter } from "./createEventFilter.js";
export { createBlockFilter } from "./createBlockFilter.js";
export { createPendingTransactionFilter } from "./createPendingTransactionFilter.js";
export { getFilterChanges } from "./getFilterChanges.js";
export { getFilterLogs } from "./getFilterLogs.js";
export { uninstallFilter } from "./uninstallFilter.js";

// Network operations
export { getChainId } from "./getChainId.js";
export { getGasPrice } from "./getGasPrice.js";
export { getMaxPriorityFeePerGas } from "./getMaxPriorityFeePerGas.js";
export { getFeeHistory } from "./getFeeHistory.js";
export { getBlobBaseFee } from "./getBlobBaseFee.js";
export { getSyncing } from "./getSyncing.js";
export { getAccounts } from "./getAccounts.js";
export { getCoinbase } from "./getCoinbase.js";
export { netVersion } from "./netVersion.js";
export { getProtocolVersion } from "./getProtocolVersion.js";
export { getMining } from "./getMining.js";
export { getHashrate } from "./getHashrate.js";

// Streaming operations
export { watchBlocks } from "./watchBlocks.js";
export { backfillBlocks } from "./backfillBlocks.js";

// Subscription operations
export { subscribe } from "./subscribe.js";
export { unsubscribe } from "./unsubscribe.js";

// Node-dependent operations (unlocked accounts)
export { sendTransaction } from "./sendTransaction.js";
export { sign } from "./sign.js";
export { signTransaction } from "./signTransaction.js";
