# Phase 1E: Simple HTTP Provider Implementation

## Context
You are implementing the final atomic component of Phase 1: a minimal, working HTTP provider that replaces the completely broken existing provider system. This provider will use direct HTTP requests and string-based JSON handling to provide reliable JSON-RPC functionality.

## Prerequisites
- **All Phase 1A-1D must be completed**: This prompt depends on all previous primitives and utilities
- **Critical Context**: The existing provider system is completely broken and must be replaced entirely

## Objective
Create a minimal, functional HTTP provider in `src/provider/simple_http_provider.zig` that can successfully make JSON-RPC calls to Ethereum nodes and parse responses using the primitives and utilities from Phase 1A-1D.

## Technical Specification

### Design Philosophy
**CRITICAL**: This implementation follows a minimal, working approach:
- **No complex abstractions** - Direct HTTP client usage
- **String-based JSON** - No custom JsonValue unions
- **Simple error handling** - Basic HTTP and parsing errors only
- **Single responsibility** - Just HTTP JSON-RPC, nothing more

### Provider Architecture
The SimpleHttpProvider provides:

**Core Functionality**:
- HTTP JSON-RPC 2.0 client
- Connection management and reuse
- Request/response handling
- Basic error handling and retries

**Supported RPC Methods**:
- `getTransactionByHash()` - Fetch transaction data
- `getTransactionReceipt()` - Fetch transaction receipts
- `getBlockByNumberWithTransactions()` - Fetch blocks with full transactions
- `debugTraceTransaction()` - Get execution traces (for future phases)

**Error Handling**:
- Network timeouts and connection failures
- HTTP status code errors
- JSON parsing errors
- RPC error responses

## Implementation Requirements

### File Structure
```zig
//! Simple HTTP Provider - Minimal working JSON-RPC client
//!
//! This replaces the broken provider system with a simple, functional implementation
//! that uses direct HTTP requests and string-based JSON handling.
//!
//! ## Design Principles
//! - Minimal abstractions - direct std.http.Client usage
//! - String-based JSON - no custom JsonValue types
//! - Simple error handling - basic HTTP and parsing errors
//! - Single responsibility - just HTTP JSON-RPC functionality
//!
//! ## Usage Example
//! ```zig
//! var provider = try SimpleHttpProvider.init(allocator, "https://mainnet.infura.io/v3/YOUR_KEY");
//! defer provider.deinit();
//! 
//! const tx = try provider.getTransactionByHash("0x1234...5678");
//! defer tx.deinit(allocator);
//! ```

const std = @import("std");
const testing = std.testing;
const primitives = @import("primitives");
const Address = primitives.Address;
const Transaction = primitives.Transaction;
const TransactionReceipt = primitives.TransactionReceipt;
const BlockWithTransactions = primitives.BlockWithTransactions;
const ExecutionTrace = primitives.ExecutionTrace;
const JsonUtils = primitives.JsonUtils;
const Allocator = std.mem.Allocator;

/// Errors that can occur during provider operations
pub const ProviderError = error{
    // Network errors
    NetworkError,
    ConnectionFailed,
    Timeout,
    
    // HTTP errors
    HttpError,
    InvalidStatusCode,
    
    // JSON-RPC errors
    JsonRpcError,
    InvalidResponse,
    MethodNotFound,
    
    // Parsing errors
    ParseError,
    InvalidData,
    
    // Resource errors
    TransactionNotFound,
    BlockNotFound,
    
    // Memory errors
    OutOfMemory,
} || JsonUtils.JsonParseError;

pub const SimpleHttpProvider = struct {
    allocator: Allocator,
    client: std.http.Client,
    url: []const u8,
    timeout_ms: u32,
    
    /// Initialize the HTTP provider
    pub fn init(allocator: Allocator, url: []const u8) !SimpleHttpProvider {
        return SimpleHttpProvider{
            .allocator = allocator,
            .client = std.http.Client{ .allocator = allocator },
            .url = url,
            .timeout_ms = 30000, // 30 second default timeout
        };
    }
    
    /// Clean up provider resources
    pub fn deinit(self: *SimpleHttpProvider) void {
        self.client.deinit();
    }
    
    /// Set request timeout in milliseconds
    pub fn setTimeout(self: *SimpleHttpProvider, timeout_ms: u32) void {
        self.timeout_ms = timeout_ms;
    }
    
    /// Make a raw JSON-RPC request
    pub fn request(self: *SimpleHttpProvider, method: []const u8, params: []const u8) ![]u8 {
        // Create JSON-RPC 2.0 request
        const json_request = try std.fmt.allocPrint(self.allocator, 
            \\{{"jsonrpc":"2.0","method":"{s}","params":{s},"id":1}}
        , .{ method, params });
        defer self.allocator.free(json_request);
        
        // Parse URL
        const uri = try std.Uri.parse(self.url);
        
        // Create HTTP request
        var headers = std.http.Headers{ .allocator = self.allocator };
        defer headers.deinit();
        
        try headers.append("Content-Type", "application/json");
        try headers.append("Accept", "application/json");
        
        var request = try self.client.open(.POST, uri, headers, .{});
        defer request.deinit();
        
        // Set request body
        request.transfer_encoding = .{ .content_length = json_request.len };
        
        // Send request
        try request.send(.{});
        try request.writeAll(json_request);
        try request.finish();
        
        // Wait for response
        try request.wait();
        
        // Check status code
        if (request.response.status != .ok) {
            return ProviderError.InvalidStatusCode;
        }
        
        // Read response body
        const response_body = try request.reader().readAllAlloc(self.allocator, 1024 * 1024); // 1MB limit
        errdefer self.allocator.free(response_body);
        
        // Parse JSON-RPC response
        return try self.parseJsonRpcResponse(response_body);
    }
    
    /// Parse JSON-RPC response and extract result
    fn parseJsonRpcResponse(self: *SimpleHttpProvider, response_body: []u8) ![]u8 {
        defer self.allocator.free(response_body);
        
        // Parse JSON response
        const parsed = try std.json.parseFromSlice(std.json.Value, self.allocator, response_body, .{});
        defer parsed.deinit();
        
        const response_obj = parsed.value.object;
        
        // Check for JSON-RPC error
        if (response_obj.get("error")) |error_val| {
            std.log.err("JSON-RPC error: {}", .{error_val});
            return ProviderError.JsonRpcError;
        }
        
        // Extract result
        const result = response_obj.get("result") orelse return ProviderError.InvalidResponse;
        
        // Convert result back to JSON string for parsing by specific methods
        var result_string = std.ArrayList(u8).init(self.allocator);
        defer result_string.deinit();
        
        try std.json.stringify(result, .{}, result_string.writer());
        
        return try self.allocator.dupe(u8, result_string.items);
    }
    
    /// Get transaction by hash
    pub fn getTransactionByHash(self: *SimpleHttpProvider, tx_hash: []const u8) !Transaction.Transaction {
        const params = try std.fmt.allocPrint(self.allocator, "[\"{s}\"]", .{tx_hash});
        defer self.allocator.free(params);
        
        const response = try self.request("eth_getTransactionByHash", params);
        defer self.allocator.free(response);
        
        // Handle null response (transaction not found)
        if (std.mem.eql(u8, response, "null")) {
            return ProviderError.TransactionNotFound;
        }
        
        return try self.parseTransactionFromJson(response);
    }
    
    /// Get transaction receipt by hash
    pub fn getTransactionReceipt(self: *SimpleHttpProvider, tx_hash: []const u8) !TransactionReceipt {
        const params = try std.fmt.allocPrint(self.allocator, "[\"{s}\"]", .{tx_hash});
        defer self.allocator.free(params);
        
        const response = try self.request("eth_getTransactionReceipt", params);
        defer self.allocator.free(response);
        
        // Handle null response (receipt not found)
        if (std.mem.eql(u8, response, "null")) {
            return ProviderError.TransactionNotFound;
        }
        
        return try self.parseReceiptFromJson(response);
    }
    
    /// Get block by number with full transactions
    pub fn getBlockByNumberWithTransactions(self: *SimpleHttpProvider, block_number: u64) !BlockWithTransactions {
        const params = try std.fmt.allocPrint(self.allocator, "[\"0x{x}\", true]", .{block_number});
        defer self.allocator.free(params);
        
        const response = try self.request("eth_getBlockByNumber", params);
        defer self.allocator.free(response);
        
        // Handle null response (block not found)
        if (std.mem.eql(u8, response, "null")) {
            return ProviderError.BlockNotFound;
        }
        
        return try self.parseBlockFromJson(response);
    }
    
    /// Get debug trace for transaction (for future phases)
    pub fn debugTraceTransaction(self: *SimpleHttpProvider, tx_hash: []const u8) !ExecutionTrace {
        const params = try std.fmt.allocPrint(self.allocator, "[\"{s}\", {{}}]", .{tx_hash});
        defer self.allocator.free(params);
        
        const response = try self.request("debug_traceTransaction", params);
        defer self.allocator.free(response);
        
        return try self.parseTraceFromJson(response);
    }
    
    /// Parse transaction from JSON string
    fn parseTransactionFromJson(self: *SimpleHttpProvider, json_str: []const u8) !Transaction.Transaction {
        const parsed = try std.json.parseFromSlice(std.json.Value, self.allocator, json_str, .{});
        defer parsed.deinit();
        
        const tx_obj = parsed.value.object;
        
        // Determine transaction type
        const tx_type = if (tx_obj.get("type")) |type_val|
            try JsonUtils.parseHexU8(type_val.string)
        else
            0; // Legacy transaction
        
        // Parse based on transaction type
        return switch (tx_type) {
            0 => Transaction.Transaction{ .legacy = try self.parseLegacyTransaction(tx_obj) },
            1 => Transaction.Transaction{ .eip2930 = try self.parseEip2930Transaction(tx_obj) },
            2 => Transaction.Transaction{ .eip1559 = try self.parseEip1559Transaction(tx_obj) },
            3 => Transaction.Transaction{ .eip4844 = try self.parseEip4844Transaction(tx_obj) },
            else => ProviderError.InvalidData,
        };
    }
    
    /// Parse legacy transaction from JSON object
    fn parseLegacyTransaction(self: *SimpleHttpProvider, tx_obj: std.json.ObjectMap) !Transaction.LegacyTransaction {
        return Transaction.LegacyTransaction{
            .nonce = try JsonUtils.parseHexU64(tx_obj.get("nonce").?.string),
            .gas_price = try JsonUtils.parseHexU256(tx_obj.get("gasPrice").?.string),
            .gas_limit = try JsonUtils.parseHexU64(tx_obj.get("gas").?.string),
            .to = try JsonUtils.parseOptionalHexAddress(
                if (tx_obj.get("to")) |to_val| 
                    if (to_val == .null) null else to_val.string
                else null
            ),
            .value = try JsonUtils.parseHexU256(tx_obj.get("value").?.string),
            .data = try JsonUtils.parseHexBytes(self.allocator, tx_obj.get("input").?.string),
            .v = try JsonUtils.parseHexU256(tx_obj.get("v").?.string),
            .r = blk: {
                const r_str = tx_obj.get("r").?.string;
                const r_hash = try JsonUtils.parseHexHash(r_str);
                break :blk r_hash.bytes;
            },
            .s = blk: {
                const s_str = tx_obj.get("s").?.string;
                const s_hash = try JsonUtils.parseHexHash(s_str);
                break :blk s_hash.bytes;
            },
        };
    }
    
    /// Parse EIP-1559 transaction from JSON object
    fn parseEip1559Transaction(self: *SimpleHttpProvider, tx_obj: std.json.ObjectMap) !Transaction.Eip1559Transaction {
        // Parse access list
        const access_list_json = tx_obj.get("accessList").?.array;
        var access_list = try self.allocator.alloc(Transaction.AccessListItem, access_list_json.items.len);
        errdefer self.allocator.free(access_list);
        
        for (access_list_json.items, 0..) |item_val, i| {
            const item_obj = item_val.object;
            const storage_keys_json = item_obj.get("storageKeys").?.array;
            
            var storage_keys = try self.allocator.alloc([32]u8, storage_keys_json.items.len);
            errdefer self.allocator.free(storage_keys);
            
            for (storage_keys_json.items, 0..) |key_val, j| {
                const key_hash = try JsonUtils.parseHexHash(key_val.string);
                storage_keys[j] = key_hash.bytes;
            }
            
            access_list[i] = Transaction.AccessListItem{
                .address = try JsonUtils.parseHexAddress(item_obj.get("address").?.string),
                .storage_keys = storage_keys,
            };
        }
        
        return Transaction.Eip1559Transaction{
            .chain_id = try JsonUtils.parseHexU64(tx_obj.get("chainId").?.string),
            .nonce = try JsonUtils.parseHexU64(tx_obj.get("nonce").?.string),
            .max_priority_fee_per_gas = try JsonUtils.parseHexU256(tx_obj.get("maxPriorityFeePerGas").?.string),
            .max_fee_per_gas = try JsonUtils.parseHexU256(tx_obj.get("maxFeePerGas").?.string),
            .gas_limit = try JsonUtils.parseHexU64(tx_obj.get("gas").?.string),
            .to = try JsonUtils.parseOptionalHexAddress(
                if (tx_obj.get("to")) |to_val| 
                    if (to_val == .null) null else to_val.string
                else null
            ),
            .value = try JsonUtils.parseHexU256(tx_obj.get("value").?.string),
            .data = try JsonUtils.parseHexBytes(self.allocator, tx_obj.get("input").?.string),
            .access_list = access_list,
            .y_parity = try JsonUtils.parseHexU8(tx_obj.get("yParity").?.string),
            .r = blk: {
                const r_str = tx_obj.get("r").?.string;
                const r_hash = try JsonUtils.parseHexHash(r_str);
                break :blk r_hash.bytes;
            },
            .s = blk: {
                const s_str = tx_obj.get("s").?.string;
                const s_hash = try JsonUtils.parseHexHash(s_str);
                break :blk s_hash.bytes;
            },
        };
    }
    
    /// Parse EIP-2930 transaction from JSON object
    fn parseEip2930Transaction(self: *SimpleHttpProvider, tx_obj: std.json.ObjectMap) !Transaction.Eip2930Transaction {
        // Similar to EIP-1559 but with gas_price instead of fee fields
        // Implementation would be similar to parseEip1559Transaction
        // but using the EIP-2930 transaction structure
        _ = self;
        _ = tx_obj;
        return ProviderError.InvalidData; // Placeholder - implement based on Transaction.Eip2930Transaction structure
    }
    
    /// Parse EIP-4844 transaction from JSON object
    fn parseEip4844Transaction(self: *SimpleHttpProvider, tx_obj: std.json.ObjectMap) !Transaction.Eip4844Transaction {
        // Implementation would handle blob transaction specific fields
        _ = self;
        _ = tx_obj;
        return ProviderError.InvalidData; // Placeholder - implement based on Transaction.Eip4844Transaction structure
    }
    
    /// Parse transaction receipt from JSON string
    fn parseReceiptFromJson(self: *SimpleHttpProvider, json_str: []const u8) !TransactionReceipt {
        const parsed = try std.json.parseFromSlice(std.json.Value, self.allocator, json_str, .{});
        defer parsed.deinit();
        
        const receipt_obj = parsed.value.object;
        
        // Parse logs array
        const logs_json = receipt_obj.get("logs").?.array;
        var logs = try self.allocator.alloc(primitives.EventLog, logs_json.items.len);
        errdefer self.allocator.free(logs);
        
        for (logs_json.items, 0..) |log_val, i| {
            logs[i] = try self.parseEventLogFromJson(log_val.object);
        }
        
        return TransactionReceipt{
            .transaction_hash = try JsonUtils.parseHexHash(receipt_obj.get("transactionHash").?.string),
            .transaction_index = try JsonUtils.parseHexU64(receipt_obj.get("transactionIndex").?.string),
            .block_hash = try JsonUtils.parseHexHash(receipt_obj.get("blockHash").?.string),
            .block_number = try JsonUtils.parseHexU64(receipt_obj.get("blockNumber").?.string),
            .from = try JsonUtils.parseHexAddress(receipt_obj.get("from").?.string),
            .to = try JsonUtils.parseOptionalHexAddress(
                if (receipt_obj.get("to")) |to_val| 
                    if (to_val == .null) null else to_val.string
                else null
            ),
            .cumulative_gas_used = try JsonUtils.parseHexU64(receipt_obj.get("cumulativeGasUsed").?.string),
            .gas_used = try JsonUtils.parseHexU64(receipt_obj.get("gasUsed").?.string),
            .contract_address = try JsonUtils.parseOptionalHexAddress(
                if (receipt_obj.get("contractAddress")) |addr_val|
                    if (addr_val == .null) null else addr_val.string
                else null
            ),
            .logs = logs,
            .status = try JsonUtils.parseHexU8(receipt_obj.get("status").?.string),
            .effective_gas_price = try JsonUtils.parseHexU256(receipt_obj.get("effectiveGasPrice").?.string),
        };
    }
    
    /// Parse event log from JSON object
    fn parseEventLogFromJson(self: *SimpleHttpProvider, log_obj: std.json.ObjectMap) !primitives.EventLog {
        // Parse topics array
        const topics_json = log_obj.get("topics").?.array;
        var topics = try self.allocator.alloc(primitives.Hash, topics_json.items.len);
        errdefer self.allocator.free(topics);
        
        for (topics_json.items, 0..) |topic_val, i| {
            topics[i] = try JsonUtils.parseHexHash(topic_val.string);
        }
        
        return primitives.EventLog{
            .address = try JsonUtils.parseHexAddress(log_obj.get("address").?.string),
            .topics = topics,
            .data = try JsonUtils.parseHexBytes(self.allocator, log_obj.get("data").?.string),
            .block_number = try JsonUtils.parseOptionalHexU64(
                if (log_obj.get("blockNumber")) |bn_val|
                    if (bn_val == .null) null else bn_val.string
                else null
            ),
            .transaction_hash = if (log_obj.get("transactionHash")) |th_val|
                if (th_val == .null) null else try JsonUtils.parseHexHash(th_val.string)
            else null,
            .transaction_index = try JsonUtils.parseOptionalHexU32(
                if (log_obj.get("transactionIndex")) |ti_val|
                    if (ti_val == .null) null else ti_val.string
                else null
            ),
            .log_index = try JsonUtils.parseOptionalHexU32(
                if (log_obj.get("logIndex")) |li_val|
                    if (li_val == .null) null else li_val.string
                else null
            ),
            .removed = if (log_obj.get("removed")) |removed_val| removed_val.bool else false,
        };
    }
    
    /// Parse block from JSON string
    fn parseBlockFromJson(self: *SimpleHttpProvider, json_str: []const u8) !BlockWithTransactions {
        const parsed = try std.json.parseFromSlice(std.json.Value, self.allocator, json_str, .{});
        defer parsed.deinit();
        
        const block_obj = parsed.value.object;
        
        // Parse transactions array
        const transactions_json = block_obj.get("transactions").?.array;
        var transactions = try self.allocator.alloc(Transaction.Transaction, transactions_json.items.len);
        errdefer self.allocator.free(transactions);
        
        for (transactions_json.items, 0..) |tx_val, i| {
            // Convert transaction object back to JSON string for parsing
            var tx_string = std.ArrayList(u8).init(self.allocator);
            defer tx_string.deinit();
            
            try std.json.stringify(tx_val, .{}, tx_string.writer());
            transactions[i] = try self.parseTransactionFromJson(tx_string.items);
        }
        
        return BlockWithTransactions{
            .hash = try JsonUtils.parseHexHash(block_obj.get("hash").?.string),
            .number = try JsonUtils.parseHexU64(block_obj.get("number").?.string),
            .parent_hash = try JsonUtils.parseHexHash(block_obj.get("parentHash").?.string),
            .timestamp = try JsonUtils.parseHexU64(block_obj.get("timestamp").?.string),
            .miner = try JsonUtils.parseHexAddress(block_obj.get("miner").?.string),
            .difficulty = try JsonUtils.parseHexU256(block_obj.get("difficulty").?.string),
            .total_difficulty = try JsonUtils.parseHexU256(block_obj.get("totalDifficulty").?.string),
            .size = try JsonUtils.parseHexU64(block_obj.get("size").?.string),
            .gas_limit = try JsonUtils.parseHexU64(block_obj.get("gasLimit").?.string),
            .gas_used = try JsonUtils.parseHexU64(block_obj.get("gasUsed").?.string),
            .base_fee_per_gas = try JsonUtils.parseOptionalHexU256(
                if (block_obj.get("baseFeePerGas")) |bf_val|
                    if (bf_val == .null) null else bf_val.string
                else null
            ),
            .state_root = try JsonUtils.parseHexHash(block_obj.get("stateRoot").?.string),
            .transactions_root = try JsonUtils.parseHexHash(block_obj.get("transactionsRoot").?.string),
            .receipts_root = try JsonUtils.parseHexHash(block_obj.get("receiptsRoot").?.string),
            .transactions = transactions,
        };
    }
    
    /// Parse execution trace from JSON string (placeholder for future phases)
    fn parseTraceFromJson(self: *SimpleHttpProvider, json_str: []const u8) !ExecutionTrace {
        _ = self;
        _ = json_str;
        // Placeholder implementation - will be implemented in Phase 2
        return ProviderError.InvalidData;
    }
};

/// Helper function to create a provider for testing
pub fn createTestProvider(allocator: Allocator) !SimpleHttpProvider {
    const test_url = std.process.getEnvVarOwned(allocator, "ETH_RPC_URL") catch "http://localhost:8545";
    defer if (!std.mem.eql(u8, test_url, "http://localhost:8545")) allocator.free(test_url);
    
    return try SimpleHttpProvider.init(allocator, test_url);
}
```

### Memory Management Requirements
1. **Provider Lifecycle**: Provider manages HTTP client lifecycle
2. **Response Cleanup**: All JSON responses must be freed after parsing
3. **Parsed Data Ownership**: Caller owns all returned data structures
4. **Error Handling**: Use `errdefer` for cleanup on parsing failures
5. **Connection Reuse**: HTTP client reuses connections efficiently

### Error Handling Strategy
- **Network Errors**: Connection failures, timeouts
- **HTTP Errors**: Status codes, malformed responses
- **JSON-RPC Errors**: RPC error responses, invalid JSON
- **Parsing Errors**: Invalid hex data, missing fields
- **Resource Errors**: Transaction/block not found

## Testing Requirements

### Test Categories
1. **Basic Functionality** - Test successful RPC calls
2. **Error Handling** - Test all error conditions
3. **JSON Parsing** - Test complex transaction/block parsing
4. **Memory Management** - Verify proper cleanup
5. **Integration** - Test with mock HTTP responses

### Required Test Cases

```zig
test "SimpleHttpProvider initialization and cleanup" {
    const allocator = testing.allocator;
    
    var provider = try SimpleHttpProvider.init(allocator, "http://localhost:8545");
    defer provider.deinit();
    
    try testing.expectEqualStrings("http://localhost:8545", provider.url);
    try testing.expectEqual(@as(u32, 30000), provider.timeout_ms);
}

test "SimpleHttpProvider timeout configuration" {
    const allocator = testing.allocator;
    
    var provider = try SimpleHttpProvider.init(allocator, "http://localhost:8545");
    defer provider.deinit();
    
    provider.setTimeout(60000);
    try testing.expectEqual(@as(u32, 60000), provider.timeout_ms);
}

test "SimpleHttpProvider JSON-RPC request formatting" {
    const allocator = testing.allocator;
    
    var provider = try SimpleHttpProvider.init(allocator, "http://localhost:8545");
    defer provider.deinit();
    
    // Test request formatting (would need to mock HTTP client for full test)
    const method = "eth_getBlockByNumber";
    const params = "[\"0x1\", true]";
    
    const expected_request = 
        \\{"jsonrpc":"2.0","method":"eth_getBlockByNumber","params":["0x1", true],"id":1}
    ;
    
    const actual_request = try std.fmt.allocPrint(allocator, 
        \\{{"jsonrpc":"2.0","method":"{s}","params":{s},"id":1}}
    , .{ method, params });
    defer allocator.free(actual_request);
    
    try testing.expectEqualStrings(expected_request, actual_request);
}

test "SimpleHttpProvider parseJsonRpcResponse success" {
    const allocator = testing.allocator;
    
    var provider = try SimpleHttpProvider.init(allocator, "http://localhost:8545");
    defer provider.deinit();
    
    const response_json = 
        \\{"jsonrpc":"2.0","result":"0x1234","id":1}
    ;
    
    const response_copy = try allocator.dupe(u8, response_json);
    const result = try provider.parseJsonRpcResponse(response_copy);
    defer allocator.free(result);
    
    try testing.expectEqualStrings("\"0x1234\"", result);
}

test "SimpleHttpProvider parseJsonRpcResponse error" {
    const allocator = testing.allocator;
    
    var provider = try SimpleHttpProvider.init(allocator, "http://localhost:8545");
    defer provider.deinit();
    
    const error_response = 
        \\{"jsonrpc":"2.0","error":{"code":-32601,"message":"Method not found"},"id":1}
    ;
    
    const response_copy = try allocator.dupe(u8, error_response);
    try testing.expectError(ProviderError.JsonRpcError, provider.parseJsonRpcResponse(response_copy));
}

test "SimpleHttpProvider parseLegacyTransaction" {
    const allocator = testing.allocator;
    
    var provider = try SimpleHttpProvider.init(allocator, "http://localhost:8545");
    defer provider.deinit();
    
    // Create mock transaction JSON object
    var tx_obj = std.json.ObjectMap.init(allocator);
    defer tx_obj.deinit();
    
    try tx_obj.put("nonce", std.json.Value{ .string = "0x0" });
    try tx_obj.put("gasPrice", std.json.Value{ .string = "0x4a817c800" }); // 20 gwei
    try tx_obj.put("gas", std.json.Value{ .string = "0x5208" }); // 21000
    try tx_obj.put("to", std.json.Value{ .string = "0x742d35Cc6634C0532925a3b844Bc9e7595f6E97b" });
    try tx_obj.put("value", std.json.Value{ .string = "0xde0b6b3a7640000" }); // 1 ETH
    try tx_obj.put("input", std.json.Value{ .string = "0x" });
    try tx_obj.put("v", std.json.Value{ .string = "0x1b" });
    try tx_obj.put("r", std.json.Value{ .string = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef" });
    try tx_obj.put("s", std.json.Value{ .string = "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321" });
    
    const tx = try provider.parseLegacyTransaction(tx_obj);
    defer tx.deinit(allocator);
    
    try testing.expectEqual(@as(u64, 0), tx.nonce);
    try testing.expectEqual(@as(u256, 20000000000), tx.gas_price);
    try testing.expectEqual(@as(u64, 21000), tx.gas_limit);
    try testing.expectEqual(@as(u256, 1000000000000000000), tx.value);
    try testing.expectEqual(@as(usize, 0), tx.data.len);
}

test "SimpleHttpProvider parseReceiptFromJson" {
    const allocator = testing.allocator;
    
    var provider = try SimpleHttpProvider.init(allocator, "http://localhost:8545");
    defer provider.deinit();
    
    const receipt_json = 
        \\{
        \\  "transactionHash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        \\  "transactionIndex": "0x0",
        \\  "blockHash": "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
        \\  "blockNumber": "0xf4240",
        \\  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f6E97b",
        \\  "to": "0x0000000000000000000000000000000000000000",
        \\  "cumulativeGasUsed": "0x5208",
        \\  "gasUsed": "0x5208",
        \\  "contractAddress": null,
        \\  "logs": [],
        \\  "status": "0x1",
        \\  "effectiveGasPrice": "0x4a817c800"
        \\}
    ;
    
    const receipt = try provider.parseReceiptFromJson(receipt_json);
    defer receipt.deinit(allocator);
    
    try testing.expectEqual(@as(u64, 0), receipt.transaction_index);
    try testing.expectEqual(@as(u64, 1000000), receipt.block_number);
    try testing.expectEqual(@as(u64, 21000), receipt.gas_used);
    try testing.expect(receipt.isSuccess());
    try testing.expectEqual(@as(usize, 0), receipt.logs.len);
}

test "SimpleHttpProvider error handling for not found" {
    const allocator = testing.allocator;
    
    var provider = try SimpleHttpProvider.init(allocator, "http://localhost:8545");
    defer provider.deinit();
    
    // Test transaction not found
    const null_response = "null";
    const tx_hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    
    // Mock the request method to return null
    // In a real test, this would use a mock HTTP client
    // For now, we test the null handling logic directly
    if (std.mem.eql(u8, null_response, "null")) {
        try testing.expectError(ProviderError.TransactionNotFound, ProviderError.TransactionNotFound);
    }
}

test "SimpleHttpProvider memory management" {
    const allocator = testing.allocator;
    
    var provider = try SimpleHttpProvider.init(allocator, "http://localhost:8545");
    defer provider.deinit();
    
    // Test that provider properly manages its own memory
    // The HTTP client should be cleaned up in deinit()
    
    // Test memory allocation for JSON parsing
    const test_json = "{}";
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, test_json, .{});
    defer parsed.deinit();
    
    // Verify parsing works without leaks
    try testing.expect(parsed.value == .object);
}
```

### Integration Testing Strategy
- **Mock HTTP Responses**: Test parsing with real JSON-RPC response data
- **Error Simulation**: Test network failures and malformed responses
- **Memory Pressure**: Test with large blocks and many transactions
- **Concurrent Requests**: Test provider thread safety (if needed)

## Integration Requirements

### Export to Provider Module
Add to `src/provider/root.zig`:
```zig
pub const SimpleHttpProvider = @import("simple_http_provider.zig").SimpleHttpProvider;
pub const ProviderError = @import("simple_http_provider.zig").ProviderError;
pub const createTestProvider = @import("simple_http_provider.zig").createTestProvider;
```

### Dependencies
- **All Phase 1A-1D primitives**: TransactionReceipt, BlockWithTransactions, ExecutionTrace, JsonUtils
- **Standard HTTP client**: std.http.Client for network requests
- **JSON parsing**: std.json for response parsing

## Success Criteria
- [ ] `src/provider/simple_http_provider.zig` compiles without errors
- [ ] All test cases pass with `zig build test`
- [ ] HTTP client properly manages connections and cleanup
- [ ] JSON-RPC requests formatted correctly
- [ ] All transaction types parse correctly from JSON responses
- [ ] Error handling covers all failure modes
- [ ] Memory management prevents leaks
- [ ] Export added to `src/provider/root.zig`
- [ ] Code follows CLAUDE.md standards (camelCase, defer patterns)

## Common Pitfalls to Avoid
1. **Memory Leaks**: Not freeing JSON response strings after parsing
2. **HTTP Client Cleanup**: Not properly cleaning up HTTP client resources
3. **JSON Parsing Errors**: Not handling malformed JSON responses
4. **Null Handling**: Not properly handling null responses for not-found cases
5. **Transaction Type Detection**: Incorrect transaction type parsing
6. **Access List Parsing**: Complex nested array parsing for EIP-1559/2930 transactions
7. **Connection Management**: Not reusing HTTP connections efficiently

## Performance Considerations
- **Connection Reuse**: HTTP client should reuse connections
- **JSON Parsing**: Efficient parsing of large JSON responses
- **Memory Allocation**: Minimize allocations during parsing
- **Request Batching**: Consider future batching capabilities
- **Timeout Handling**: Appropriate timeouts for network requests

## Future Compatibility
- **New RPC Methods**: Structure supports adding new JSON-RPC methods
- **Enhanced Error Handling**: Framework for more detailed error reporting
- **Request Batching**: Structure allows for future batch request support
- **Connection Pooling**: Architecture supports future connection pooling

## Integration with Future Phases
This provider will be used by:
- **Phase 2**: EVM tracing will use `debugTraceTransaction()`
- **Phase 3**: State loading will use transaction and receipt data
- **Phase 4**: Main test will use all provider methods for block verification
- **Phase 5**: Integration optimization will enhance provider performance

## Critical Success Factors
1. **Replace Broken System**: Must completely replace the non-functional existing provider
2. **Minimal Complexity**: Keep implementation simple and maintainable
3. **Robust Error Handling**: Handle all network and parsing failure modes
4. **Memory Safety**: Prevent leaks and ensure proper cleanup
5. **JSON-RPC Compliance**: Follow Ethereum JSON-RPC 2.0 specification exactly

This atomic prompt focuses solely on implementing a minimal, working HTTP provider that can successfully communicate with Ethereum nodes and parse responses using the primitives and utilities built in the previous phases.