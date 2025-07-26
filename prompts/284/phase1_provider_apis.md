# Phase 1: Enhanced Provider APIs for Block Verification Test

## Context
You are implementing Phase 1 of a comprehensive block verification test for block 23000000. This phase focuses on extending both the primitives package (for data structures) and provider package (for RPC methods) to support comprehensive block and transaction verification.

## CRITICAL ARCHITECTURE NOTE
⚠️ **The current provider package is completely broken and non-functional.** See `src/provider/README.md` for details. This phase requires a complete rewrite of the provider system using a minimal, working approach.

## Current State Analysis

### Primitives Package (`src/primitives/`)
**Existing Core Types**:
- `transaction.zig` - All Ethereum transaction types (Legacy, EIP-1559, EIP-4844, etc.)
- `event_log.zig` - Event/log structures for contract events
- `address.zig` - 20-byte Ethereum addresses with checksumming
- `hex.zig` - Hexadecimal encoding utilities
- `rlp.zig` - RLP encoding/decoding

**Missing Types Needed**:
- Transaction receipts with proper data structures
- Enhanced block structures with full transaction objects
- Debug trace structures for execution analysis

### Provider Package (`src/provider/`)
**Current Status**: ❌ **COMPLETELY BROKEN**
- All transport implementations fail to compile
- JSON serialization architecture is fundamentally flawed
- Hardfork tests are disabled due to provider failures

**Required Functionality**:
1. `getTransactionByHash()` - fetch individual transaction data
2. `getTransactionReceipt()` - fetch transaction receipts
3. `getBlockByNumberWithTransactions()` - fetch blocks with full transaction objects
4. `debugTraceTransaction()` - get execution traces for comparison

## Implementation Requirements

### Task Overview
Extend the provider system to support comprehensive block and transaction data fetching with proper type safety and error handling.

### Required New Methods

<details>
<summary><strong>1. Enhanced Block Fetching</strong></summary>

```zig
// In src/provider/provider.zig
pub fn getBlockByNumberWithTransactions(self: *Provider, block_number: u64) !BlockWithTransactions {
    var params = std.json.Array.init(self.allocator);
    defer params.deinit();
    
    const blockHex = try std.fmt.allocPrint(self.allocator, "0x{x}", .{block_number});
    defer self.allocator.free(blockHex);
    
    try params.append(std.json.Value{ .string = blockHex });
    try params.append(std.json.Value{ .bool = true }); // Include full transaction objects
    
    const result = try self.request("eth_getBlockByNumber", std.json.Value{ .array = params });
    defer self.allocator.free(result);
    
    return try parseBlockWithTransactions(self.allocator, result);
}
```
</details>

<details>
<summary><strong>2. Transaction Fetching</strong></summary>

```zig
pub fn getTransactionByHash(self: *Provider, tx_hash: []const u8) !Transaction {
    var params = std.json.Array.init(self.allocator);
    defer params.deinit();
    
    try params.append(std.json.Value{ .string = tx_hash });
    
    const result = try self.request("eth_getTransactionByHash", std.json.Value{ .array = params });
    defer self.allocator.free(result);
    
    return try parseTransaction(self.allocator, result);
}
```
</details>

<details>
<summary><strong>3. Transaction Receipt Fetching</strong></summary>

```zig
pub fn getTransactionReceipt(self: *Provider, tx_hash: []const u8) !TransactionReceipt {
    var params = std.json.Array.init(self.allocator);
    defer params.deinit();
    
    try params.append(std.json.Value{ .string = tx_hash });
    
    const result = try self.request("eth_getTransactionReceipt", std.json.Value{ .array = params });
    defer self.allocator.free(result);
    
    return try parseTransactionReceipt(self.allocator, result);
}
```
</details>

<details>
<summary><strong>4. Debug Tracing (Future Phase 2 Integration)</strong></summary>

```zig
pub const TraceOptions = struct {
    disable_storage: bool = false,
    disable_memory: bool = false,
    disable_stack: bool = false,
    tracer: ?[]const u8 = null,
};

pub fn debugTraceTransaction(self: *Provider, tx_hash: []const u8, options: TraceOptions) !ExecutionTrace {
    var params = std.json.Array.init(self.allocator);
    defer params.deinit();
    
    try params.append(std.json.Value{ .string = tx_hash });
    
    // Convert options to JSON object
    var options_obj = std.json.ObjectMap.init(self.allocator);
    defer options_obj.deinit();
    
    try options_obj.put("disableStorage", std.json.Value{ .bool = options.disable_storage });
    try options_obj.put("disableMemory", std.json.Value{ .bool = options.disable_memory });
    try options_obj.put("disableStack", std.json.Value{ .bool = options.disable_stack });
    
    try params.append(std.json.Value{ .object = options_obj });
    
    const result = try self.request("debug_traceTransaction", std.json.Value{ .array = params });
    defer self.allocator.free(result);
    
    return try parseExecutionTrace(self.allocator, result);
}
```
</details>

## Implementation Requirements

### Part A: Primitives Package Extensions
**CRITICAL**: All data structures must be implemented in `src/primitives/` as single-purpose, reusable types.

<details>
<summary><strong>1. Transaction Receipt Structure</strong></summary>

**File: `src/primitives/receipt.zig`**
```zig
//! Transaction Receipt - Ethereum transaction execution results
//!
//! Represents the result of executing a transaction, including gas usage,
//! contract creation, event logs, and execution status.

const std = @import("std");
const Address = @import("address.zig").Address;
const EventLog = @import("event_log.zig").EventLog;
const crypto_pkg = @import("crypto");
const Hash = crypto_pkg.Hash;

pub const TransactionReceipt = struct {
    transaction_hash: Hash,
    transaction_index: u64,
    block_hash: Hash,
    block_number: u64,
    from: Address,
    to: ?Address,
    cumulative_gas_used: u64,
    gas_used: u64,
    contract_address: ?Address,
    logs: []EventLog,
    status: u8, // 1 for success, 0 for failure
    effective_gas_price: u256,
    
    pub fn deinit(self: *const TransactionReceipt, allocator: std.mem.Allocator) void {
        for (self.logs) |log| {
            log.deinit(allocator);
        }
        allocator.free(self.logs);
    }
    
    pub fn isSuccess(self: *const TransactionReceipt) bool {
        return self.status == 1;
    }
};

// Add to src/primitives/root.zig exports
pub const TransactionReceipt = @import("receipt.zig").TransactionReceipt;
```
</details>

<details>
<summary><strong>2. Enhanced Block Structure</strong></summary>

**File: `src/primitives/block.zig`**
```zig
//! Ethereum Block - Complete block data with transactions
//!
//! Represents a full Ethereum block including all transaction data,
//! not just transaction hashes.

const std = @import("std");
const Transaction = @import("transaction.zig");
const crypto_pkg = @import("crypto");
const Hash = crypto_pkg.Hash;

pub const BlockWithTransactions = struct {
    hash: Hash,
    number: u64,
    timestamp: u64,
    gas_limit: u64,
    gas_used: u64,
    base_fee_per_gas: ?u256,
    transactions: []Transaction.Transaction,
    parent_hash: Hash,
    state_root: Hash,
    receipts_root: Hash,
    transactions_root: Hash,
    miner: Address,
    difficulty: u256,
    total_difficulty: u256,
    size: u64,
    
    pub fn deinit(self: *const BlockWithTransactions, allocator: std.mem.Allocator) void {
        for (self.transactions) |*tx| {
            tx.deinit(allocator);
        }
        allocator.free(self.transactions);
    }
    
    pub fn getTransactionCount(self: *const BlockWithTransactions) usize {
        return self.transactions.len;
    }
};

// Add to src/primitives/root.zig exports
pub const BlockWithTransactions = @import("block.zig").BlockWithTransactions;
```
</details>

<details>
<summary><strong>3. Debug Trace Structures</strong></summary>

**File: `src/primitives/trace.zig`**
```zig
//! EVM Execution Trace - Debug trace data structures
//!
//! Represents detailed execution traces from debug_traceTransaction RPC calls.

const std = @import("std");
const crypto_pkg = @import("crypto");
const Hash = crypto_pkg.Hash;

pub const ExecutionTrace = struct {
    gas_used: u64,
    failed: bool,
    return_value: []u8,
    struct_logs: []StructLog,
    
    pub fn deinit(self: *const ExecutionTrace, allocator: std.mem.Allocator) void {
        allocator.free(self.return_value);
        for (self.struct_logs) |*log| {
            log.deinit(allocator);
        }
        allocator.free(self.struct_logs);
    }
};

pub const StructLog = struct {
    pc: u64,
    op: []const u8,
    gas: u64,
    gas_cost: u64,
    depth: u32,
    stack: []u256,
    memory: []u8,
    storage: std.HashMap(Hash, Hash, std.hash_map.StringContext, 80),
    
    pub fn deinit(self: *const StructLog, allocator: std.mem.Allocator) void {
        allocator.free(self.op);
        allocator.free(self.stack);
        allocator.free(self.memory);
        self.storage.deinit();
    }
};

// Add to src/primitives/root.zig exports
pub const ExecutionTrace = @import("trace.zig").ExecutionTrace;
pub const StructLog = @import("trace.zig").StructLog;
```
</details>

### JSON Parsing Implementation

<details>
<summary><strong>Parsing Functions to Implement</strong></summary>

```zig
// In src/provider/json_parsers.zig
fn parseTransaction(allocator: std.mem.Allocator, json_str: []const u8) !Transaction {
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json_str, .{});
    defer parsed.deinit();
    
    const tx_obj = parsed.value.object;
    
    // Parse transaction type
    const tx_type = if (tx_obj.get("type")) |type_val|
        try std.fmt.parseInt(u8, type_val.string[2..], 16) // Remove "0x" prefix
    else
        0; // Legacy transaction
    
    // Parse based on transaction type
    return switch (tx_type) {
        0 => try parseLegacyTransaction(allocator, tx_obj),
        1 => try parseEip2930Transaction(allocator, tx_obj),
        2 => try parseEip1559Transaction(allocator, tx_obj),
        3 => try parseEip4844Transaction(allocator, tx_obj),
        else => error.UnsupportedTransactionType,
    };
}

fn parseTransactionReceipt(allocator: std.mem.Allocator, json_str: []const u8) !TransactionReceipt {
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json_str, .{});
    defer parsed.deinit();
    
    const receipt_obj = parsed.value.object;
    
    // Parse logs array
    const logs_array = receipt_obj.get("logs").?.array;
    var logs = try allocator.alloc(EventLog, logs_array.items.len);
    
    for (logs_array.items, 0..) |log_val, i| {
        logs[i] = try parseEventLog(allocator, log_val.object);
    }
    
    return TransactionReceipt{
        .transaction_hash = try Hash.fromHex(receipt_obj.get("transactionHash").?.string),
        .transaction_index = try parseHexU64(receipt_obj.get("transactionIndex").?.string),
        .block_hash = try Hash.fromHex(receipt_obj.get("blockHash").?.string),
        .block_number = try parseHexU64(receipt_obj.get("blockNumber").?.string),
        .from = try Address.fromHex(receipt_obj.get("from").?.string),
        .to = if (receipt_obj.get("to")) |to_val| 
            if (to_val == .null) null else try Address.fromHex(to_val.string)
        else null,
        .cumulative_gas_used = try parseHexU64(receipt_obj.get("cumulativeGasUsed").?.string),
        .gas_used = try parseHexU64(receipt_obj.get("gasUsed").?.string),
        .contract_address = if (receipt_obj.get("contractAddress")) |addr_val|
            if (addr_val == .null) null else try Address.fromHex(addr_val.string)
        else null,
        .logs = logs,
        .status = try parseHexU8(receipt_obj.get("status").?.string),
        .effective_gas_price = try parseHexU256(receipt_obj.get("effectiveGasPrice").?.string),
    };
}
```
</details>

### Error Handling Enhancement

<details>
<summary><strong>Enhanced Error Types</strong></summary>

```zig
// In src/provider/provider.zig
pub const ProviderError = error{
    // Existing errors
    TransportError,
    JsonRpcError,
    InvalidResponse,
    NetworkError,
    Timeout,
    InvalidRequest,
    OutOfMemory,
    
    // New errors for enhanced functionality
    TransactionNotFound,
    BlockNotFound,
    InvalidTransactionHash,
    InvalidBlockNumber,
    UnsupportedTransactionType,
    MalformedReceipt,
    TraceNotAvailable,
    DebugApiNotSupported,
} || std.mem.Allocator.Error;
```
</details>

### Part B: Provider Package Complete Rewrite
**CRITICAL**: The existing provider is completely broken. Implement a minimal, working HTTP-only provider.

<details>
<summary><strong>1. Minimal Working Provider</strong></summary>

**File: `src/provider/simple_http_provider.zig`**
```zig
//! Simple HTTP Provider - Minimal working JSON-RPC client
//!
//! This replaces the broken provider system with a simple, functional implementation.

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;
const Transaction = primitives.Transaction;
const TransactionReceipt = primitives.TransactionReceipt;
const BlockWithTransactions = primitives.BlockWithTransactions;
const ExecutionTrace = primitives.ExecutionTrace;

pub const SimpleHttpProvider = struct {
    allocator: std.mem.Allocator,
    client: std.http.Client,
    url: []const u8,
    
    pub fn init(allocator: std.mem.Allocator, url: []const u8) !SimpleHttpProvider {
        return SimpleHttpProvider{
            .allocator = allocator,
            .client = std.http.Client{ .allocator = allocator },
            .url = url,
        };
    }
    
    pub fn deinit(self: *SimpleHttpProvider) void {
        self.client.deinit();
    }
    
    pub fn request(self: *SimpleHttpProvider, method: []const u8, params: []const u8) ![]u8 {
        const json_request = try std.fmt.allocPrint(self.allocator, 
            \\{{"jsonrpc":"2.0","method":"{s}","params":{s},"id":1}}
        , .{ method, params });
        defer self.allocator.free(json_request);
        
        // Direct HTTP POST implementation
        // Return raw JSON response string
        // NO custom JsonValue types, NO complex serialization
    }
    
    pub fn getTransactionByHash(self: *SimpleHttpProvider, tx_hash: []const u8) !Transaction.Transaction {
        const params = try std.fmt.allocPrint(self.allocator, "[\"{s}\"]", .{tx_hash});
        defer self.allocator.free(params);
        
        const response = try self.request("eth_getTransactionByHash", params);
        defer self.allocator.free(response);
        
        return try parseTransactionFromJson(self.allocator, response);
    }
    
    pub fn getTransactionReceipt(self: *SimpleHttpProvider, tx_hash: []const u8) !TransactionReceipt {
        const params = try std.fmt.allocPrint(self.allocator, "[\"{s}\"]", .{tx_hash});
        defer self.allocator.free(params);
        
        const response = try self.request("eth_getTransactionReceipt", params);
        defer self.allocator.free(response);
        
        return try parseReceiptFromJson(self.allocator, response);
    }
    
    pub fn getBlockByNumberWithTransactions(self: *SimpleHttpProvider, block_number: u64) !BlockWithTransactions {
        const params = try std.fmt.allocPrint(self.allocator, "[\"0x{x}\", true]", .{block_number});
        defer self.allocator.free(params);
        
        const response = try self.request("eth_getBlockByNumber", params);
        defer self.allocator.free(response);
        
        return try parseBlockFromJson(self.allocator, response);
    }
};
```
</details>

## Implementation Steps

### Step 1: Primitives Package Extensions
1. **Create `src/primitives/receipt.zig`** with `TransactionReceipt` struct
2. **Create `src/primitives/block.zig`** with `BlockWithTransactions` struct  
3. **Create `src/primitives/trace.zig`** with debug trace structures
4. **Update `src/primitives/root.zig`** to export new types
5. **Add comprehensive tests** for each new primitive type

### Step 2: Provider Package Complete Rewrite
1. **Create `src/provider/simple_http_provider.zig`** with minimal working implementation
2. **Create `src/provider/json_parsing.zig`** with parsing utilities
3. **Replace broken provider files** or mark them as deprecated
4. **Update `src/provider/root.zig`** to export new provider
5. **Add integration tests** with mock HTTP responses

### Step 3: JSON Parsing Utilities
1. **Implement hex parsing functions** (`parseHexU64`, `parseHexU256`, etc.)
2. **Create transaction parsing** for all transaction types
3. **Create receipt parsing** with proper error handling
4. **Create block parsing** with transaction array handling
5. **Add comprehensive parsing tests**

### Step 4: Error Handling and Memory Management
1. **Define clear error types** for each operation
2. **Implement proper `defer` patterns** for all allocations
3. **Add error handling tests** for network failures
4. **Verify no memory leaks** in all code paths

### Step 5: Integration and Testing
1. **Create integration tests** using real JSON-RPC responses
2. **Test against local test node** if available
3. **Verify compatibility** with existing hardfork test structure
4. **Add documentation** and usage examples

## Testing Strategy

### Unit Tests Required
```zig
test "getTransactionByHash parses legacy transaction correctly" {
    // Test with mock JSON response for legacy transaction
}

test "getTransactionReceipt handles null contract address" {
    // Test receipt parsing with null values
}

test "getBlockByNumberWithTransactions parses full block" {
    // Test block parsing with transaction array
}

test "provider handles transaction not found error" {
    // Test error handling for non-existent transactions
}
```

### Integration Points
- Ensure new methods work with existing `HttpTransport`
- Verify JSON-RPC error handling propagates correctly
- Test memory management with large blocks/transactions

## Success Criteria

### Primitives Package Requirements
- [ ] **TransactionReceipt** struct compiles and includes all required fields
- [ ] **BlockWithTransactions** struct handles all transaction types correctly
- [ ] **ExecutionTrace** structures support debug tracing data
- [ ] **All primitives** have proper `deinit()` methods for memory management
- [ ] **Comprehensive tests** for each primitive type with edge cases
- [ ] **Exports added** to `src/primitives/root.zig`

### Provider Package Requirements  
- [ ] **SimpleHttpProvider** compiles and makes HTTP requests successfully
- [ ] **JSON parsing** handles all transaction types (Legacy, EIP-1559, EIP-4844)
- [ ] **Error handling** covers network failures and malformed responses
- [ ] **Memory management** prevents leaks in all code paths
- [ ] **Integration tests** with mock JSON-RPC responses pass

### Code Quality Requirements
- [ ] **Follow CLAUDE.md standards**: camelCase naming, defer patterns, no abstractions in tests
- [ ] **Single responsibility**: Each function has one clear purpose
- [ ] **Memory consciousness**: All allocations have corresponding deallocations
- [ ] **Comprehensive documentation** with usage examples
- [ ] **Zero compilation errors** and all tests pass

### Architecture Requirements
- [ ] **Primitives separation**: Data structures are in primitives, not provider
- [ ] **Provider simplicity**: HTTP-only implementation without complex abstractions
- [ ] **Type safety**: Strong typing prevents common JSON parsing errors
- [ ] **Forward compatibility**: Extensible design for future transaction types

## Integration with Future Phases
This phase provides the foundation for:
- **Phase 2**: EVM tracing infrastructure will use `ExecutionTrace` from primitives
- **Phase 3**: State loading will use `TransactionReceipt` and `BlockWithTransactions`
- **Phase 4**: Main test will use `SimpleHttpProvider` for block verification
- **Phase 5**: Integration optimization will build on working provider infrastructure

## Critical Notes
- **Provider rewrite is mandatory** - the existing provider is completely broken
- **Primitives-first approach** - implement data structures before provider methods
- **Focus on working code** - simple, functional implementation over complex abstractions
- **Memory management is critical** - every allocation must have proper cleanup
- **Test thoroughly** - mainnet data can be complex and edge cases are common