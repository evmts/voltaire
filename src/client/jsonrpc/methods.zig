const std = @import("std");
const Allocator = std.mem.Allocator;

// Import comprehensive JSON-RPC types
const JsonRpcRequest = @import("types.zig").JsonRpcRequest;
const JsonRpcResponse = @import("types.zig").JsonRpcResponse;
const JsonValue = @import("types.zig").JsonValue;
const JsonRpcError = @import("types.zig").JsonRpcError;
const JsonRpcMethod = @import("types.zig").JsonRpcMethod;
const generateId = @import("types.zig").generateId;

// Import type aliases
const Address = @import("types.zig").Address;
const Hash = @import("types.zig").Hash;
const Hex = @import("types.zig").Hex;
const U64Hex = @import("types.zig").U64Hex;
const U256Hex = @import("types.zig").U256Hex;
const BlockNumber = @import("types.zig").BlockNumber;
const BlockTag = @import("types.zig").BlockTag;

// Import response types
const TransactionObject = @import("types.zig").TransactionObject;
const BlockResponse = @import("types.zig").BlockResponse;
const TransactionResponse = @import("types.zig").TransactionResponse;
const TransactionReceiptResponse = @import("types.zig").TransactionReceiptResponse;
const LogResponse = @import("types.zig").LogResponse;
const LogFilter = @import("types.zig").LogFilter;
const FeeHistoryResponse = @import("types.zig").FeeHistoryResponse;
const SyncingResponse = @import("types.zig").SyncingResponse;
const TypedData = @import("types.zig").TypedData;

// Import method type definitions
const EthAccounts = @import("types.zig").EthAccounts;
const EthBlockNumber = @import("types.zig").EthBlockNumber;
const EthCall = @import("types.zig").EthCall;
const EthChainId = @import("types.zig").EthChainId;
const EthCoinbase = @import("types.zig").EthCoinbase;
const EthEstimateGas = @import("types.zig").EthEstimateGas;
const EthFeeHistory = @import("types.zig").EthFeeHistory;
const EthGasPrice = @import("types.zig").EthGasPrice;
const EthGetBalance = @import("types.zig").EthGetBalance;
const EthGetBlockByHash = @import("types.zig").EthGetBlockByHash;
const EthGetBlockByNumber = @import("types.zig").EthGetBlockByNumber;
const EthGetCode = @import("types.zig").EthGetCode;
const EthGetLogs = @import("types.zig").EthGetLogs;
const EthGetStorageAt = @import("types.zig").EthGetStorageAt;
const EthGetTransactionByHash = @import("types.zig").EthGetTransactionByHash;
const EthGetTransactionCount = @import("types.zig").EthGetTransactionCount;
const EthGetTransactionReceipt = @import("types.zig").EthGetTransactionReceipt;
const EthSendRawTransaction = @import("types.zig").EthSendRawTransaction;
const EthSendTransaction = @import("types.zig").EthSendTransaction;
const EthSign = @import("types.zig").EthSign;
const EthSignTransaction = @import("types.zig").EthSignTransaction;
const EthSignTypedDataV4 = @import("types.zig").EthSignTypedDataV4;
const EthSyncing = @import("types.zig").EthSyncing;

// Net methods
const NetListening = @import("types.zig").NetListening;
const NetPeerCount = @import("types.zig").NetPeerCount;
const NetVersion = @import("types.zig").NetVersion;

// Web3 methods
const Web3ClientVersion = @import("types.zig").Web3ClientVersion;
const Web3Sha3 = @import("types.zig").Web3Sha3;

// =============================================================================
// Comprehensive JSON-RPC Method Helpers (viem-style)
// =============================================================================

/// Main JSON-RPC helper namespace similar to viem's approach
pub const jsonrpc = struct {

    // =============================================================================
    // ETH Methods
    // =============================================================================

    /// Get the list of accounts
    pub const accounts = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_accounts.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) ![]Address {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toArray();
        }
    };

    /// Get current block number
    pub const blockNumber = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_blockNumber.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !U64Hex {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Execute a contract call
    pub const call = struct {
        pub fn request(transaction: TransactionObject, block: BlockNumber) JsonRpcRequest {
            // TODO: Properly serialize transaction and block parameters
            _ = transaction;
            _ = block;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_call.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Hex {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Get chain ID
    pub const chainId = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_chainId.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !u64 {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toU64();
        }
    };

    /// Get coinbase address
    pub const coinbase = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_coinbase.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Address {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Estimate gas for a transaction
    pub const estimateGas = struct {
        pub fn request(transaction: TransactionObject, block: ?BlockNumber) JsonRpcRequest {
            // TODO: Properly serialize transaction and block parameters
            _ = transaction;
            _ = block;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_estimateGas.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !u64 {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toU64();
        }
    };

    /// Get current gas price
    pub const gasPrice = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_gasPrice.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !u64 {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toU64();
        }
    };

    /// Get balance of an account
    pub const getBalance = struct {
        pub fn request(address: Address, block: BlockNumber) JsonRpcRequest {
            // TODO: Properly serialize parameters as array
            _ = address;
            _ = block;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_getBalance.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !U256Hex {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Get block by hash
    pub const getBlockByHash = struct {
        pub fn request(blockHash: Hash, fullTransactions: bool) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = blockHash;
            _ = fullTransactions;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_getBlockByHash.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !?BlockResponse {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return null;
            // TODO: Properly deserialize block response
            _ = result;
            return null; // Simplified for now
        }
    };

    /// Get block by number
    pub const getBlockByNumber = struct {
        pub fn request(block: BlockNumber, fullTransactions: bool) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = block;
            _ = fullTransactions;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_getBlockByNumber.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !?BlockResponse {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return null;
            // TODO: Properly deserialize block response
            _ = result;
            return null; // Simplified for now
        }
    };

    /// Get code at address
    pub const getCode = struct {
        pub fn request(address: Address, block: BlockNumber) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = address;
            _ = block;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_getCode.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Hex {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Get logs
    pub const getLogs = struct {
        pub fn request(filter: LogFilter) JsonRpcRequest {
            // TODO: Properly serialize filter
            _ = filter;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_getLogs.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) ![]LogResponse {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toArray();
        }
    };

    /// Get storage at position
    pub const getStorageAt = struct {
        pub fn request(address: Address, position: U256Hex, block: BlockNumber) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = address;
            _ = position;
            _ = block;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_getStorageAt.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Hash {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Get transaction by hash
    pub const getTransactionByHash = struct {
        pub fn request(transactionHash: Hash) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = transactionHash;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_getTransactionByHash.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !?TransactionResponse {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return null;
            // TODO: Properly deserialize transaction response
            _ = result;
            return null; // Simplified for now
        }
    };

    /// Get transaction count (nonce)
    pub const getTransactionCount = struct {
        pub fn request(address: Address, block: BlockNumber) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = address;
            _ = block;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_getTransactionCount.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !u64 {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toU64();
        }
    };

    /// Get transaction receipt
    pub const getTransactionReceipt = struct {
        pub fn request(transactionHash: Hash) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = transactionHash;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_getTransactionReceipt.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !?TransactionReceiptResponse {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return null;
            // TODO: Properly deserialize transaction receipt response
            _ = result;
            return null; // Simplified for now
        }
    };

    /// Send raw transaction
    pub const sendRawTransaction = struct {
        pub fn request(data: Hex) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = data;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_sendRawTransaction.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Hash {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Send transaction
    pub const sendTransaction = struct {
        pub fn request(transaction: TransactionObject) JsonRpcRequest {
            // TODO: Properly serialize transaction
            _ = transaction;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_sendTransaction.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Hash {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Sign message
    pub const sign = struct {
        pub fn request(address: Address, data: Hex) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = address;
            _ = data;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_sign.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Hex {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Sign transaction
    pub const signTransaction = struct {
        pub fn request(transaction: TransactionObject) JsonRpcRequest {
            // TODO: Properly serialize transaction
            _ = transaction;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_signTransaction.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Hex {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Sign typed data (EIP-712)
    pub const signTypedData = struct {
        pub fn request(address: Address, typedData: TypedData) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = address;
            _ = typedData;
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_signTypedData_v4.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Hex {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Get syncing status
    pub const syncing = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.eth_syncing.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !union(enum) {
            syncing: SyncingResponse,
            not_syncing: bool,
        } {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;

            // Check if result is a boolean (false means not syncing)
            if (result.toBool()) |is_syncing| {
                if (!is_syncing) {
                    return .{ .not_syncing = false };
                }
            } else |_| {
                // If not a boolean, it should be a syncing object
                // TODO: Properly deserialize syncing response
                return .{ .not_syncing = false }; // Simplified for now
            }

            return .{ .not_syncing = false }; // Simplified for now
        }
    };

    // =============================================================================
    // NET Methods
    // =============================================================================

    /// Check if client is listening for network connections
    pub const netListening = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.net_listening.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !bool {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toBool();
        }
    };

    /// Get number of peers
    pub const netPeerCount = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.net_peerCount.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !u64 {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toU64();
        }
    };

    /// Get network version
    pub const netVersion = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.net_version.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) ![]const u8 {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    // =============================================================================
    // WEB3 Methods
    // =============================================================================

    /// Get client version
    pub const web3ClientVersion = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = JsonRpcMethod.web3_clientVersion.getMethodName(),
                .params = JsonValue{ .null = {} },
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) ![]const u8 {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };

    /// Calculate Keccak-256 hash
    pub const web3Sha3 = struct {
        pub fn request(data: Hex) JsonRpcRequest {
            // TODO: Properly serialize parameters
            _ = data;
            return JsonRpcRequest{
                .method = JsonRpcMethod.web3_sha3.getMethodName(),
                .params = JsonValue{ .null = {} }, // Simplified for now
                .id = generateId(),
            };
        }

        pub fn response(res: JsonRpcResponse) !Hash {
            if (res.isError()) return error.JsonRpcError;
            const result = res.result orelse return error.InvalidResponse;
            return result.toString();
        }
    };
};

// =============================================================================
// Utility Functions
// =============================================================================

/// Create a generic JsonRpcRequest for any method
pub fn createRequest(method: JsonRpcMethod, params: JsonValue) JsonRpcRequest {
    return JsonRpcRequest{
        .method = method.getMethodName(),
        .params = params,
        .id = generateId(),
    };
}

/// Handle JSON-RPC error responses
pub fn handleError(res: JsonRpcResponse) !void {
    if (res.err) |err| {
        std.debug.print("JSON-RPC Error {d}: {s}\n", .{ err.code, err.message });
        return error.JsonRpcError;
    }
}

/// Create a basic JsonValue array from strings (helper for parameter serialization)
pub fn createArrayParams(allocator: Allocator, items: []const []const u8) !JsonValue {
    var json_items = try allocator.alloc(JsonValue, items.len);
    for (items, 0..) |item, i| {
        json_items[i] = JsonValue.fromString(item);
    }
    return JsonValue.fromArray(json_items);
}

/// Create a basic JsonValue object from key-value pairs (helper for parameter serialization)
pub fn createObjectParams(allocator: Allocator, pairs: []const struct { key: []const u8, value: JsonValue }) !JsonValue {
    var map = std.StringHashMap(JsonValue).init(allocator);
    for (pairs) |pair| {
        try map.put(pair.key, pair.value);
    }
    return JsonValue.fromObject(map);
}

// =============================================================================
// Type-safe Method Builders (Advanced Usage)
// =============================================================================

/// Type-safe method builder for eth_getBalance
pub fn buildGetBalanceRequest(address: Address, block: BlockNumber, allocator: Allocator) !JsonRpcRequest {
    const params = try createArrayParams(allocator, &[_][]const u8{
        address,
        switch (block) {
            .number => |n| try std.fmt.allocPrint(allocator, "0x{x}", .{n}),
            .tag => |t| t.toString(),
        },
    });
    return createRequest(JsonRpcMethod.eth_getBalance, params);
}

/// Type-safe method builder for eth_call
pub fn buildCallRequest(transaction: TransactionObject, block: BlockNumber, allocator: Allocator) !JsonRpcRequest {
    // TODO: Properly serialize transaction object
    _ = transaction;
    const params = try createArrayParams(allocator, &[_][]const u8{
        "{}", // Simplified transaction object
        switch (block) {
            .number => |n| try std.fmt.allocPrint(allocator, "0x{x}", .{n}),
            .tag => |t| t.toString(),
        },
    });
    return createRequest(JsonRpcMethod.eth_call, params);
}

/// Type-safe method builder for eth_sendTransaction
pub fn buildSendTransactionRequest(transaction: TransactionObject, allocator: Allocator) !JsonRpcRequest {
    // TODO: Properly serialize transaction object
    _ = transaction;
    const params = try createArrayParams(allocator, &[_][]const u8{
        "{}", // Simplified transaction object
    });
    return createRequest(JsonRpcMethod.eth_sendTransaction, params);
}

// =============================================================================
// Tests
// =============================================================================

test "jsonrpc.chainId request/response" {
    const req = jsonrpc.chainId.request();
    try std.testing.expectEqualStrings("eth_chainId", req.method);
    try std.testing.expectEqualStrings("2.0", req.jsonrpc);

    const response = JsonRpcResponse{
        .result = JsonValue.fromString("0x1"),
        .err = null,
        .id = 1,
    };

    const chain_id = try jsonrpc.chainId.response(response);
    try std.testing.expectEqual(@as(u64, 1), chain_id);
}

test "jsonrpc.blockNumber request/response" {
    const req = jsonrpc.blockNumber.request();
    try std.testing.expectEqualStrings("eth_blockNumber", req.method);

    const response = JsonRpcResponse{
        .result = JsonValue.fromString("0x1234"),
        .err = null,
        .id = 1,
    };

    const block_num = try jsonrpc.blockNumber.response(response);
    try std.testing.expectEqualStrings("0x1234", block_num);
}

test "jsonrpc.gasPrice request/response" {
    const req = jsonrpc.gasPrice.request();
    try std.testing.expectEqualStrings("eth_gasPrice", req.method);

    const response = JsonRpcResponse{
        .result = JsonValue.fromString("0x9c7652400"),
        .err = null,
        .id = 1,
    };

    const gas_price = try jsonrpc.gasPrice.response(response);
    try std.testing.expectEqual(@as(u64, 42000000000), gas_price);
}

test "jsonrpc error handling" {
    const response = JsonRpcResponse{
        .result = null,
        .err = JsonRpcError.init(-32000, "execution reverted"),
        .id = 1,
    };

    const result = jsonrpc.chainId.response(response);
    try std.testing.expectError(error.JsonRpcError, result);
}

test "createRequest utility" {
    const req = createRequest(JsonRpcMethod.eth_chainId, JsonValue{ .null = {} });
    try std.testing.expectEqualStrings("eth_chainId", req.method);
    try std.testing.expectEqualStrings("2.0", req.jsonrpc);
}

test "JsonRpcMethod enum values" {
    try std.testing.expectEqualStrings("eth_chainId", JsonRpcMethod.eth_chainId.getMethodName());
    try std.testing.expectEqualStrings("eth_getBalance", JsonRpcMethod.eth_getBalance.getMethodName());
    try std.testing.expectEqualStrings("net_version", JsonRpcMethod.net_version.getMethodName());
    try std.testing.expectEqualStrings("web3_clientVersion", JsonRpcMethod.web3_clientVersion.getMethodName());
}
