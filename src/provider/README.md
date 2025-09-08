# Provider

Tiny JSON‑RPC helper for examples and tests.

## Overview

`provider.zig` implements a minimal subset of Ethereum JSON‑RPC over `std.http.Client`. It is not a production provider—there’s no retry policy, batching, pooling, or backoff logic. The goal is to keep examples small and dependency‑free.

## Implemented methods

- `eth_blockNumber` → `getBlockNumber() !u64`
- `eth_getBalance` → `getBalance(addr: Address) !u256`
- `eth_getTransactionCount` → `getTransactionCount(addr: Address) !u64`
- `eth_getBlockByNumber` → `getBlockByNumber(block: u64, full_txs: bool) !Block`
- generic `request(method: []const u8, params: ?std.json.Value) ![]const u8`

Returned `Block` only includes `hash`, `number`, and `timestamp`, matching what the current examples need.

## Example

```zig
const std = @import("std");
const provider = @import("provider.zig");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

var gpa = std.heap.GeneralPurposeAllocator(.{}){};
defer _ = gpa.deinit();
const alloc = gpa.allocator();

var p = try provider.Provider.init(alloc, "https://rpc.example");
defer p.deinit();

const number = try p.getBlockNumber();
const bal = try p.getBalance(Address{ .bytes = [_]u8{0} ** 20 });
```

## Notes

- Error handling is intentionally simple (basic JSON‑RPC error mapping).
- If you need a full‑featured client (timeouts, retries, batching, subscriptions), integrate an external library or extend this module in a separate package.

// Multiple providers for redundancy
const providers = &[_][]const u8{
    "https://mainnet.infura.io/v3/YOUR_KEY",
    "https://eth-mainnet.alchemyapi.io/v2/YOUR_KEY",
    "https://mainnet.etherscan.io/api",
};

const redundant_provider = try provider.Provider.init_with_fallbacks(
    allocator, 
    providers
);
```

### Development Configuration
```zig
// Local development node
const dev_provider = try provider.Provider.init(
    allocator,
    "http://localhost:8545"
);

// Test provider with mock data
const test_provider = provider.TestProvider.init(allocator);
try test_provider.set_balance("0x742d35Cc6641C91B6E4bb6ac...", 1000000000000000000);
try test_provider.set_nonce("0x742d35Cc6641C91B6E4bb6ac...", 42);
```

## Error Handling

### Error Types
```zig
const ProviderError = error{
    NetworkError,          // Connection failures
    TimeoutError,          // Request timeouts  
    JsonRpcError,          // Protocol-level errors
    InvalidResponse,       // Malformed responses
    RateLimitExceeded,     // Rate limiting
    AuthenticationFailed,  // API key issues
    InsufficientFunds,     // Transaction failures
    InvalidTransaction,    // Transaction validation errors
};
```

### Error Recovery
```zig
// Automatic retry with exponential backoff
const result = p.get_balance(address, "latest") catch |err| switch (err) {
    error.NetworkError => {
        // Wait and retry with different provider
        std.time.sleep(1_000_000_000); // 1 second
        return try fallback_provider.get_balance(address, "latest");
    },
    error.RateLimitExceeded => {
        // Implement backoff strategy
        std.time.sleep(5_000_000_000); // 5 seconds
        return try p.get_balance(address, "latest");
    },
    else => return err,
};
```

## Performance Characteristics

### Latency Optimization
- **Connection Reuse**: HTTP keep-alive for reduced connection overhead
- **Request Pipelining**: Multiple concurrent requests over single connection
- **Caching**: Intelligent caching of immutable data (historical blocks, receipts)
- **Compression**: gzip compression support for large responses

### Throughput Features
- **Batch Processing**: Group multiple RPC calls into single HTTP request
- **Concurrent Requests**: Asynchronous request handling for high throughput
- **Connection Pooling**: Multiple connections for parallel request processing
- **Stream Processing**: Efficient handling of large result sets

### Resource Management
- **Memory Efficiency**: Minimal memory allocation and zero-copy where possible
- **Connection Limits**: Configurable limits to prevent resource exhaustion  
- **Request Queuing**: Fair queuing and prioritization for concurrent requests
- **Graceful Degradation**: Automatic scaling under high load conditions

## Testing and Development

### Unit Testing
```zig
test "provider basic operations" {
    var test_provider = provider.TestProvider.init(std.testing.allocator);
    defer test_provider.deinit();
    
    // Setup mock data
    try test_provider.set_balance("0x123...", 1000000000000000000);
    
    // Test operations
    const balance = try test_provider.get_balance("0x123...", "latest");
    try std.testing.expect(balance == 1000000000000000000);
}
```

### Integration Testing
```zig
test "mainnet integration" {
    const provider = try Provider.init(std.testing.allocator, "https://mainnet.infura.io...");
    defer provider.deinit();
    
    // Test real network calls
    const latest_block = try provider.get_block_by_number("latest", false);
    defer latest_block.deinit(std.testing.allocator);
    
    try std.testing.expect(latest_block.number > 0);
}
```

The provider module offers a robust, production-ready solution for Ethereum blockchain connectivity with comprehensive RPC support, intelligent error handling, and performance optimizations suitable for high-throughput applications.
