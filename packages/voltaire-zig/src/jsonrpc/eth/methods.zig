const std = @import("std");

// Import all eth method modules
const eth_accounts = @import("accounts/eth_accounts.zig");
const eth_blobBaseFee = @import("blobBaseFee/eth_blobBaseFee.zig");
const eth_blockNumber = @import("blockNumber/eth_blockNumber.zig");
const eth_call = @import("call/eth_call.zig");
const eth_chainId = @import("chainId/eth_chainId.zig");
const eth_coinbase = @import("coinbase/eth_coinbase.zig");
const eth_createAccessList = @import("createAccessList/eth_createAccessList.zig");
const eth_estimateGas = @import("estimateGas/eth_estimateGas.zig");
const eth_feeHistory = @import("feeHistory/eth_feeHistory.zig");
const eth_gasPrice = @import("gasPrice/eth_gasPrice.zig");
const eth_getBalance = @import("getBalance/eth_getBalance.zig");
const eth_getBlockByHash = @import("getBlockByHash/eth_getBlockByHash.zig");
const eth_getBlockByNumber = @import("getBlockByNumber/eth_getBlockByNumber.zig");
const eth_getBlockReceipts = @import("getBlockReceipts/eth_getBlockReceipts.zig");
const eth_getBlockTransactionCountByHash = @import("getBlockTransactionCountByHash/eth_getBlockTransactionCountByHash.zig");
const eth_getBlockTransactionCountByNumber = @import("getBlockTransactionCountByNumber/eth_getBlockTransactionCountByNumber.zig");
const eth_getCode = @import("getCode/eth_getCode.zig");
const eth_getFilterChanges = @import("getFilterChanges/eth_getFilterChanges.zig");
const eth_getFilterLogs = @import("getFilterLogs/eth_getFilterLogs.zig");
const eth_getLogs = @import("getLogs/eth_getLogs.zig");
const eth_getProof = @import("getProof/eth_getProof.zig");
const eth_getStorageAt = @import("getStorageAt/eth_getStorageAt.zig");
const eth_getTransactionByBlockHashAndIndex = @import("getTransactionByBlockHashAndIndex/eth_getTransactionByBlockHashAndIndex.zig");
const eth_getTransactionByBlockNumberAndIndex = @import("getTransactionByBlockNumberAndIndex/eth_getTransactionByBlockNumberAndIndex.zig");
const eth_getTransactionByHash = @import("getTransactionByHash/eth_getTransactionByHash.zig");
const eth_getTransactionCount = @import("getTransactionCount/eth_getTransactionCount.zig");
const eth_getTransactionReceipt = @import("getTransactionReceipt/eth_getTransactionReceipt.zig");
const eth_getUncleCountByBlockHash = @import("getUncleCountByBlockHash/eth_getUncleCountByBlockHash.zig");
const eth_getUncleCountByBlockNumber = @import("getUncleCountByBlockNumber/eth_getUncleCountByBlockNumber.zig");
const eth_maxPriorityFeePerGas = @import("maxPriorityFeePerGas/eth_maxPriorityFeePerGas.zig");
const eth_newBlockFilter = @import("newBlockFilter/eth_newBlockFilter.zig");
const eth_newFilter = @import("newFilter/eth_newFilter.zig");
const eth_newPendingTransactionFilter = @import("newPendingTransactionFilter/eth_newPendingTransactionFilter.zig");
const eth_sendRawTransaction = @import("sendRawTransaction/eth_sendRawTransaction.zig");
const eth_sendTransaction = @import("sendTransaction/eth_sendTransaction.zig");
const eth_sign = @import("sign/eth_sign.zig");
const eth_signTransaction = @import("signTransaction/eth_signTransaction.zig");
const eth_simulateV1 = @import("simulateV1/eth_simulateV1.zig");
const eth_syncing = @import("syncing/eth_syncing.zig");
const eth_uninstallFilter = @import("uninstallFilter/eth_uninstallFilter.zig");

/// Tagged union of all eth namespace methods
/// Maps method names to their corresponding parameter and result types
pub const EthMethod = union(enum) {
    eth_accounts: struct {
        params: eth_accounts.Params,
        result: eth_accounts.Result,
    },
    eth_blobBaseFee: struct {
        params: eth_blobBaseFee.Params,
        result: eth_blobBaseFee.Result,
    },
    eth_blockNumber: struct {
        params: eth_blockNumber.Params,
        result: eth_blockNumber.Result,
    },
    eth_call: struct {
        params: eth_call.Params,
        result: eth_call.Result,
    },
    eth_chainId: struct {
        params: eth_chainId.Params,
        result: eth_chainId.Result,
    },
    eth_coinbase: struct {
        params: eth_coinbase.Params,
        result: eth_coinbase.Result,
    },
    eth_createAccessList: struct {
        params: eth_createAccessList.Params,
        result: eth_createAccessList.Result,
    },
    eth_estimateGas: struct {
        params: eth_estimateGas.Params,
        result: eth_estimateGas.Result,
    },
    eth_feeHistory: struct {
        params: eth_feeHistory.Params,
        result: eth_feeHistory.Result,
    },
    eth_gasPrice: struct {
        params: eth_gasPrice.Params,
        result: eth_gasPrice.Result,
    },
    eth_getBalance: struct {
        params: eth_getBalance.Params,
        result: eth_getBalance.Result,
    },
    eth_getBlockByHash: struct {
        params: eth_getBlockByHash.Params,
        result: eth_getBlockByHash.Result,
    },
    eth_getBlockByNumber: struct {
        params: eth_getBlockByNumber.Params,
        result: eth_getBlockByNumber.Result,
    },
    eth_getBlockReceipts: struct {
        params: eth_getBlockReceipts.Params,
        result: eth_getBlockReceipts.Result,
    },
    eth_getBlockTransactionCountByHash: struct {
        params: eth_getBlockTransactionCountByHash.Params,
        result: eth_getBlockTransactionCountByHash.Result,
    },
    eth_getBlockTransactionCountByNumber: struct {
        params: eth_getBlockTransactionCountByNumber.Params,
        result: eth_getBlockTransactionCountByNumber.Result,
    },
    eth_getCode: struct {
        params: eth_getCode.Params,
        result: eth_getCode.Result,
    },
    eth_getFilterChanges: struct {
        params: eth_getFilterChanges.Params,
        result: eth_getFilterChanges.Result,
    },
    eth_getFilterLogs: struct {
        params: eth_getFilterLogs.Params,
        result: eth_getFilterLogs.Result,
    },
    eth_getLogs: struct {
        params: eth_getLogs.Params,
        result: eth_getLogs.Result,
    },
    eth_getProof: struct {
        params: eth_getProof.Params,
        result: eth_getProof.Result,
    },
    eth_getStorageAt: struct {
        params: eth_getStorageAt.Params,
        result: eth_getStorageAt.Result,
    },
    eth_getTransactionByBlockHashAndIndex: struct {
        params: eth_getTransactionByBlockHashAndIndex.Params,
        result: eth_getTransactionByBlockHashAndIndex.Result,
    },
    eth_getTransactionByBlockNumberAndIndex: struct {
        params: eth_getTransactionByBlockNumberAndIndex.Params,
        result: eth_getTransactionByBlockNumberAndIndex.Result,
    },
    eth_getTransactionByHash: struct {
        params: eth_getTransactionByHash.Params,
        result: eth_getTransactionByHash.Result,
    },
    eth_getTransactionCount: struct {
        params: eth_getTransactionCount.Params,
        result: eth_getTransactionCount.Result,
    },
    eth_getTransactionReceipt: struct {
        params: eth_getTransactionReceipt.Params,
        result: eth_getTransactionReceipt.Result,
    },
    eth_getUncleCountByBlockHash: struct {
        params: eth_getUncleCountByBlockHash.Params,
        result: eth_getUncleCountByBlockHash.Result,
    },
    eth_getUncleCountByBlockNumber: struct {
        params: eth_getUncleCountByBlockNumber.Params,
        result: eth_getUncleCountByBlockNumber.Result,
    },
    eth_maxPriorityFeePerGas: struct {
        params: eth_maxPriorityFeePerGas.Params,
        result: eth_maxPriorityFeePerGas.Result,
    },
    eth_newBlockFilter: struct {
        params: eth_newBlockFilter.Params,
        result: eth_newBlockFilter.Result,
    },
    eth_newFilter: struct {
        params: eth_newFilter.Params,
        result: eth_newFilter.Result,
    },
    eth_newPendingTransactionFilter: struct {
        params: eth_newPendingTransactionFilter.Params,
        result: eth_newPendingTransactionFilter.Result,
    },
    eth_sendRawTransaction: struct {
        params: eth_sendRawTransaction.Params,
        result: eth_sendRawTransaction.Result,
    },
    eth_sendTransaction: struct {
        params: eth_sendTransaction.Params,
        result: eth_sendTransaction.Result,
    },
    eth_sign: struct {
        params: eth_sign.Params,
        result: eth_sign.Result,
    },
    eth_signTransaction: struct {
        params: eth_signTransaction.Params,
        result: eth_signTransaction.Result,
    },
    eth_simulateV1: struct {
        params: eth_simulateV1.Params,
        result: eth_simulateV1.Result,
    },
    eth_syncing: struct {
        params: eth_syncing.Params,
        result: eth_syncing.Result,
    },
    eth_uninstallFilter: struct {
        params: eth_uninstallFilter.Params,
        result: eth_uninstallFilter.Result,
    },

    /// Get the method name string from the union tag
    pub fn methodName(self: EthMethod) []const u8 {
        return switch (self) {
            .eth_accounts => eth_accounts.method,
            .eth_blobBaseFee => eth_blobBaseFee.method,
            .eth_blockNumber => eth_blockNumber.method,
            .eth_call => eth_call.method,
            .eth_chainId => eth_chainId.method,
            .eth_coinbase => eth_coinbase.method,
            .eth_createAccessList => eth_createAccessList.method,
            .eth_estimateGas => eth_estimateGas.method,
            .eth_feeHistory => eth_feeHistory.method,
            .eth_gasPrice => eth_gasPrice.method,
            .eth_getBalance => eth_getBalance.method,
            .eth_getBlockByHash => eth_getBlockByHash.method,
            .eth_getBlockByNumber => eth_getBlockByNumber.method,
            .eth_getBlockReceipts => eth_getBlockReceipts.method,
            .eth_getBlockTransactionCountByHash => eth_getBlockTransactionCountByHash.method,
            .eth_getBlockTransactionCountByNumber => eth_getBlockTransactionCountByNumber.method,
            .eth_getCode => eth_getCode.method,
            .eth_getFilterChanges => eth_getFilterChanges.method,
            .eth_getFilterLogs => eth_getFilterLogs.method,
            .eth_getLogs => eth_getLogs.method,
            .eth_getProof => eth_getProof.method,
            .eth_getStorageAt => eth_getStorageAt.method,
            .eth_getTransactionByBlockHashAndIndex => eth_getTransactionByBlockHashAndIndex.method,
            .eth_getTransactionByBlockNumberAndIndex => eth_getTransactionByBlockNumberAndIndex.method,
            .eth_getTransactionByHash => eth_getTransactionByHash.method,
            .eth_getTransactionCount => eth_getTransactionCount.method,
            .eth_getTransactionReceipt => eth_getTransactionReceipt.method,
            .eth_getUncleCountByBlockHash => eth_getUncleCountByBlockHash.method,
            .eth_getUncleCountByBlockNumber => eth_getUncleCountByBlockNumber.method,
            .eth_maxPriorityFeePerGas => eth_maxPriorityFeePerGas.method,
            .eth_newBlockFilter => eth_newBlockFilter.method,
            .eth_newFilter => eth_newFilter.method,
            .eth_newPendingTransactionFilter => eth_newPendingTransactionFilter.method,
            .eth_sendRawTransaction => eth_sendRawTransaction.method,
            .eth_sendTransaction => eth_sendTransaction.method,
            .eth_sign => eth_sign.method,
            .eth_signTransaction => eth_signTransaction.method,
            .eth_simulateV1 => eth_simulateV1.method,
            .eth_syncing => eth_syncing.method,
            .eth_uninstallFilter => eth_uninstallFilter.method,
        };
    }

    /// Parse method name string to enum tag
    pub fn fromMethodName(method_name: []const u8) !std.meta.Tag(EthMethod) {
        const map = std.StaticStringMap(std.meta.Tag(EthMethod)).initComptime(.{
            .{ "eth_accounts", .eth_accounts },
            .{ "eth_blobBaseFee", .eth_blobBaseFee },
            .{ "eth_blockNumber", .eth_blockNumber },
            .{ "eth_call", .eth_call },
            .{ "eth_chainId", .eth_chainId },
            .{ "eth_coinbase", .eth_coinbase },
            .{ "eth_createAccessList", .eth_createAccessList },
            .{ "eth_estimateGas", .eth_estimateGas },
            .{ "eth_feeHistory", .eth_feeHistory },
            .{ "eth_gasPrice", .eth_gasPrice },
            .{ "eth_getBalance", .eth_getBalance },
            .{ "eth_getBlockByHash", .eth_getBlockByHash },
            .{ "eth_getBlockByNumber", .eth_getBlockByNumber },
            .{ "eth_getBlockReceipts", .eth_getBlockReceipts },
            .{ "eth_getBlockTransactionCountByHash", .eth_getBlockTransactionCountByHash },
            .{ "eth_getBlockTransactionCountByNumber", .eth_getBlockTransactionCountByNumber },
            .{ "eth_getCode", .eth_getCode },
            .{ "eth_getFilterChanges", .eth_getFilterChanges },
            .{ "eth_getFilterLogs", .eth_getFilterLogs },
            .{ "eth_getLogs", .eth_getLogs },
            .{ "eth_getProof", .eth_getProof },
            .{ "eth_getStorageAt", .eth_getStorageAt },
            .{ "eth_getTransactionByBlockHashAndIndex", .eth_getTransactionByBlockHashAndIndex },
            .{ "eth_getTransactionByBlockNumberAndIndex", .eth_getTransactionByBlockNumberAndIndex },
            .{ "eth_getTransactionByHash", .eth_getTransactionByHash },
            .{ "eth_getTransactionCount", .eth_getTransactionCount },
            .{ "eth_getTransactionReceipt", .eth_getTransactionReceipt },
            .{ "eth_getUncleCountByBlockHash", .eth_getUncleCountByBlockHash },
            .{ "eth_getUncleCountByBlockNumber", .eth_getUncleCountByBlockNumber },
            .{ "eth_maxPriorityFeePerGas", .eth_maxPriorityFeePerGas },
            .{ "eth_newBlockFilter", .eth_newBlockFilter },
            .{ "eth_newFilter", .eth_newFilter },
            .{ "eth_newPendingTransactionFilter", .eth_newPendingTransactionFilter },
            .{ "eth_sendRawTransaction", .eth_sendRawTransaction },
            .{ "eth_sendTransaction", .eth_sendTransaction },
            .{ "eth_sign", .eth_sign },
            .{ "eth_signTransaction", .eth_signTransaction },
            .{ "eth_simulateV1", .eth_simulateV1 },
            .{ "eth_syncing", .eth_syncing },
            .{ "eth_uninstallFilter", .eth_uninstallFilter },
        });

        return map.get(method_name) orelse error.UnknownMethod;
    }
};
