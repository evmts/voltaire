# Provider

Ethereum blockchain connectivity and RPC client implementation for interacting with Ethereum nodes and external data sources.

## Overview

The provider module delivers a comprehensive Ethereum JSON-RPC client that enables Guillotine to connect with Ethereum nodes, query blockchain data, and submit transactions. It provides type-safe interfaces for all standard Ethereum RPC methods with robust error handling, retry logic, and performance optimizations for production use.

## Components and Architecture

### Core Components
- **`provider.zig`** - Main provider implementation with full JSON-RPC client
- **`simple_provider.zig`** - Lightweight provider for basic operations
- **`test_provider.zig`** - Mock provider for testing and development
- **`example_mainnet.zig`** - Example configurations for mainnet connectivity
- **`root.zig`** - Module exports and type definitions

### Transport Layer
- **`transport/http_simple.zig`** - HTTP/HTTPS transport implementation
- **`transport/json_rpc.zig`** - JSON-RPC 2.0 protocol handler

## Key Features

### Comprehensive RPC Support
- **Block Operations**: Get blocks by number/hash, transaction counts, and block ranges
- **Transaction Operations**: Submit transactions, get receipts, estimate gas consumption
- **Account Queries**: Balance, nonce, code, and storage slot access
- **Network Information**: Chain ID, gas prices, client version, and network status
- **Event Filtering**: Log filtering and subscription for contract events
- **Debug APIs**: Transaction tracing and internal operation inspection

### Transport Features
- **HTTP/HTTPS**: Secure connections with TLS support
- **Connection Pooling**: Efficient connection reuse and management
- **Request Batching**: Batch multiple RPC calls for improved performance
- **Automatic Retries**: Intelligent retry logic for transient failures
- **Rate Limiting**: Built-in rate limiting to respect provider limits
- **Timeout Management**: Configurable timeouts for different operation types

### Error Handling
- **Comprehensive Error Types**: Specific errors for different failure scenarios
- **Network Resilience**: Graceful handling of network interruptions
- **Provider Failover**: Support for multiple provider endpoints
- **Circuit Breaker**: Automatic fallback when providers become unreliable

## Integration Points

### EVM Core
- **State Queries**: Fetch account balances, nonces, and contract code
- **Block Context**: Retrieve block headers and transaction data for execution
- **Gas Estimation**: Accurate gas limit estimation for transaction execution
- **Chain Configuration**: Network-specific parameters and hardfork information

### Database Layer  
- **State Synchronization**: Efficient state tree synchronization from remote nodes
- **Historical Data**: Access to historical blockchain data and state
- **Transaction Pool**: Integration with mempool for pending transaction data
- **Event Indexing**: Real-time event data for contract interaction tracking

### Testing Framework
- **Mock Responses**: Configurable mock responses for unit testing
- **Test Scenarios**: Pre-configured test data for different network conditions
- **Integration Testing**: End-to-end testing with real network connections
- **Performance Testing**: Load testing and performance benchmarking tools

## Usage Examples

### Basic Provider Setup
```zig
const provider = @import("provider");
const std = @import("std");

// Create provider instance
var gpa = std.heap.GeneralPurposeAllocator(.{}){};
defer _ = gpa.deinit();
const allocator = gpa.allocator();

var p = try provider.Provider.init(
    allocator,
    "https://mainnet.infura.io/v3/YOUR_API_KEY"
);
defer p.deinit();

// Configure timeouts and retry behavior
p.set_timeout(30000); // 30 second timeout
p.set_max_retries(3);
```

### Block Operations
```zig
// Get latest block with full transaction details
const latest_block = try p.get_block_by_number("latest", true);
defer latest_block.deinit(allocator);

console.log("Latest block: {} with {} transactions", .{
    latest_block.number, latest_block.transactions.len
});

// Get specific block by hash
const block_hash = "0x1234567890abcdef...";
const block = try p.get_block_by_hash(block_hash, false);
defer block.deinit(allocator);

// Get block transaction count
const tx_count = try p.get_block_transaction_count("0x1000000");
```

### Account Operations
```zig
const address = "0x742d35Cc6641C91B6E4bb6ac7D2738C65bD0A99B";

// Get account balance
const balance = try p.get_balance(address, "latest");
console.log("Balance: {} wei", .{balance});

// Get transaction count (nonce)
const nonce = try p.get_transaction_count(address, "pending");
console.log("Next nonce: {}", .{nonce});

// Get contract code
const code = try p.get_code(address, "latest");
defer allocator.free(code);
if (code.len > 0) {
    console.log("Contract code length: {} bytes", .{code.len});
}

// Get storage value
const storage_key = "0x0000000000000000000000000000000000000000000000000000000000000000";
const storage_value = try p.get_storage_at(address, storage_key, "latest");
```

### Transaction Operations
```zig
// Send raw transaction
const signed_tx = "0xf86c808504a817c800825208942..."; // Signed transaction data
const tx_hash = try p.send_raw_transaction(signed_tx);
defer allocator.free(tx_hash);
console.log("Transaction sent: {s}", .{tx_hash});

// Get transaction details
const tx = try p.get_transaction_by_hash(tx_hash);
defer tx.deinit(allocator);

// Get transaction receipt
const receipt = try p.get_transaction_receipt(tx_hash);
defer receipt.deinit(allocator);
console.log("Gas used: {}", .{receipt.gas_used});

// Estimate gas for transaction
const gas_estimate = try p.estimate_gas(.{
    .from = "0x742d35Cc6641C91B6E4bb6ac...",
    .to = "0x1234567890123456789012345...",
    .value = "0xde0b6b3a7640000", // 1 ETH
    .data = "0x",
});
console.log("Estimated gas: {}", .{gas_estimate});
```

### Event Filtering and Logs
```zig
// Create log filter for contract events
const filter = provider.LogFilter{
    .from_block = "0x1000000",
    .to_block = "latest", 
    .address = &[_][]const u8{"0x1234567890123456789012345..."},
    .topics = &[_]?[]const u8{
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef", // Transfer event
        null, // Any from address
        null, // Any to address
    },
};

const logs = try p.get_logs(filter);
defer {
    for (logs) |log| log.deinit(allocator);
    allocator.free(logs);
}

for (logs) |log| {
    console.log("Event in block {}: {s}", .{ log.block_number, log.data });
}
```

### Batch Operations
```zig
// Batch multiple RPC calls for efficiency
const batch = try p.create_batch();
defer batch.deinit();

// Add multiple requests to batch
try batch.add_get_balance("0x742d35Cc6641C91B6E4bb6ac...", "latest");
try batch.add_get_transaction_count("0x742d35Cc6641C91B6E4bb6ac...", "latest");
try batch.add_get_block_by_number("latest", false);

// Execute batch
const results = try batch.execute();
defer results.deinit(allocator);

// Process results
const balance = results.get_balance(0);
const nonce = results.get_transaction_count(1);
const block = results.get_block(2);
```

### Network Information
```zig
// Get network information  
const chain_id = try p.get_chain_id();
const gas_price = try p.get_gas_price();
const client_version = try p.get_client_version();
defer allocator.free(client_version);

console.log("Connected to chain {} with gas price {} gwei", .{
    chain_id, gas_price / 1_000_000_000
});
console.log("Client: {s}", .{client_version});

// Get fee history for EIP-1559
const fee_history = try p.get_fee_history(10, "latest", &[_]f64{ 25.0, 50.0, 75.0 });
defer fee_history.deinit(allocator);
```

## Configuration Examples

### Production Configuration
```zig
// Mainnet with Infura
const mainnet_provider = try provider.Provider.init_with_config(
    allocator,
    "https://mainnet.infura.io/v3/YOUR_API_KEY",
    .{
        .timeout = 30_000,
        .max_retries = 5,
        .retry_delay = 1_000,
        .enable_batching = true,
        .max_batch_size = 10,
        .rate_limit_requests_per_second = 10,
    }
);

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