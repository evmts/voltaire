# Ethereum Client Architecture & API Specification

## Table of Contents
1. [Overview](#overview)
2. [Architecture Philosophy](#architecture-philosophy)
3. [Core Types](#core-types)
4. [Client API](#client-api)
5. [Transport Layer](#transport-layer)
6. [JSON-RPC Methods](#json-rpc-methods)
7. [Account System](#account-system)
8. [Error Handling](#error-handling)
9. [Implementation Phases](#implementation-phases)
10. [File Structure](#file-structure)
11. [Usage Examples](#usage-examples)

## Overview

This document specifies the complete architecture for an Ethereum client library in Zig that provides a modern, type-safe, and performance-focused interface for interacting with Ethereum networks.

**Key Design Decision**: Single `Client.request()` method (EIP-1193 style) enhanced with type-safe helper functions, providing both simplicity and developer experience.

## Architecture Philosophy

### Core Principles
1. **Single Responsibility**: One `Client.request()` method handles all RPC communication
2. **EIP-1193 Compatibility**: Direct compatibility with Ethereum provider standards
3. **Type Safety**: Compile-time guarantees through helper functions
4. **Transport Agnostic**: Pluggable transport layer (HTTP, IPC, future WebSocket)
5. **Composability**: Independent transport, account, and client layers
6. **Performance**: Minimal allocations, efficient serialization
7. **Testability**: Easy mocking and unit testing

### Benefits
- **Simplicity**: One method to maintain, test, and debug
- **Flexibility**: Easy to add new RPC methods without client changes
- **Standards Compliance**: Direct EIP-1193 compatibility
- **Developer Experience**: Helper functions provide convenience and type safety
- **Future-Proof**: Easy to extend with new features

## Core Types

### JSON-RPC Types

```zig
// JSON-RPC Request
pub const JsonRpcRequest = struct {
    jsonrpc: []const u8 = "2.0",
    method: []const u8,
    params: JsonValue,
    id: union(enum) {
        string: []const u8,
        number: u64,
        null: void,
    },
    
    pub fn init(method: []const u8, params: JsonValue) JsonRpcRequest;
    pub fn toJson(self: JsonRpcRequest, allocator: Allocator) ![]u8;
};

// JSON-RPC Response
pub const JsonRpcResponse = struct {
    jsonrpc: []const u8,
    result: ?JsonValue,
    error: ?JsonRpcError,
    id: union(enum) {
        string: []const u8,
        number: u64,
        null: void,
    },
    
    pub fn fromJson(json: []const u8, allocator: Allocator) !JsonRpcResponse;
    pub fn isError(self: JsonRpcResponse) bool;
    pub fn getResult(self: JsonRpcResponse, comptime T: type) !T;
};

// JSON-RPC Error
pub const JsonRpcError = struct {
    code: i32,
    message: []const u8,
    data: ?JsonValue,
    
    pub const PARSE_ERROR = -32700;
    pub const INVALID_REQUEST = -32600;
    pub const METHOD_NOT_FOUND = -32601;
    pub const INVALID_PARAMS = -32602;
    pub const INTERNAL_ERROR = -32603;
};

// Generic JSON value for params/results
pub const JsonValue = union(enum) {
    null: void,
    bool: bool,
    number: f64,
    string: []const u8,
    array: []JsonValue,
    object: std.StringHashMap(JsonValue),
    
    pub fn fromString(str: []const u8) JsonValue;
    pub fn fromHex(hex: []const u8) JsonValue;
    pub fn fromAddress(addr: Address) JsonValue;
    pub fn fromU256(value: u256) JsonValue;
    pub fn toString(self: JsonValue) ![]const u8;
    pub fn toHex(self: JsonValue) ![]const u8;
    pub fn toU256(self: JsonValue) !u256;
};
```

### Block Types

```zig
// Block identifier
pub const BlockId = union(enum) {
    number: u64,
    hash: Hash,
    tag: BlockTag,
    
    pub fn toString(self: BlockId) []const u8;
    pub fn toJson(self: BlockId) JsonValue;
};

// Block tags
pub const BlockTag = enum {
    latest,
    earliest,
    pending,
    safe,
    finalized,
    
    pub fn toString(self: BlockTag) []const u8;
};

// Transaction request for sending
pub const TransactionRequest = struct {
    from: ?Address = null,
    to: ?Address = null,
    gas: ?u64 = null,
    gas_price: ?u256 = null,
    max_fee_per_gas: ?u256 = null,
    max_priority_fee_per_gas: ?u256 = null,
    value: ?u256 = null,
    data: ?[]const u8 = null,
    nonce: ?u64 = null,
    chain_id: ?u64 = null,
    access_list: ?[]AccessListItem = null,
    
    pub fn toJson(self: TransactionRequest, allocator: Allocator) !JsonValue;
    pub fn validate(self: TransactionRequest) !void;
};

// Call request for eth_call
pub const CallRequest = struct {
    from: ?Address = null,
    to: ?Address = null,
    gas: ?u64 = null,
    gas_price: ?u256 = null,
    value: ?u256 = null,
    data: ?[]const u8 = null,
    
    pub fn toJson(self: CallRequest, allocator: Allocator) !JsonValue;
};
```

## Client API

### Main Client Interface

```zig
pub const Client = struct {
    allocator: Allocator,
    transport: Transport,
    account: ?Account,
    chain_id: ?u64,
    request_id: std.atomic.Value(u64),
    
    // === Core API ===
    
    /// Main RPC method - handles all Ethereum JSON-RPC calls
    pub fn request(self: *Client, req: JsonRpcRequest) ClientError!JsonRpcResponse;
    
    // === Configuration ===
    
    /// Initialize client with transport and configuration
    pub fn init(allocator: Allocator, config: ClientConfig) ClientError!Client;
    
    /// Clean up client resources
    pub fn deinit(self: *Client) void;
    
    /// Set account for transaction signing
    pub fn setAccount(self: *Client, account: Account) void;
    
    /// Get current account address
    pub fn getAccount(self: Client) ?Account;
    
    /// Set chain ID for transaction signing
    pub fn setChainId(self: *Client, chain_id: u64) void;
    
    /// Get current chain ID
    pub fn getChainId(self: Client) ?u64;
    
    // === Utilities ===
    
    /// Generate unique request ID
    fn generateRequestId(self: *Client) u64;
    
    /// Create JSON-RPC request with auto-generated ID
    pub fn createRequest(self: *Client, method: []const u8, params: JsonValue) JsonRpcRequest;
    
    /// Helper for direct method calls without helper functions
    pub fn call(self: *Client, method: []const u8, params: JsonValue) ClientError!JsonRpcResponse;
};

// Client configuration
pub const ClientConfig = struct {
    transport: Transport,
    account: ?Account = null,
    chain_id: ?u64 = null,
    request_timeout: u32 = 30000, // 30 seconds
    max_retries: u8 = 3,
};

// Client errors
pub const ClientError = error{
    TransportError,
    JsonRpcError,
    InvalidResponse,
    NetworkError,
    Timeout,
    InvalidRequest,
    AccountRequired,
    ChainIdRequired,
    OutOfMemory,
    InvalidJson,
} || Allocator.Error;
```

## Transport Layer

### Transport Interface

```zig
pub const Transport = union(enum) {
    http: HttpTransport,
    ipc: IpcTransport,
    
    /// Send JSON-RPC request and return response
    pub fn request(self: Transport, req: JsonRpcRequest) TransportError!JsonRpcResponse;
    
    /// Initialize transport from config
    pub fn init(allocator: Allocator, config: TransportConfig) TransportError!Transport;
    
    /// Clean up transport resources
    pub fn deinit(self: Transport) void;
    
    /// Get transport type string
    pub fn getType(self: Transport) []const u8;
    
    /// Check if transport is connected
    pub fn isConnected(self: Transport) bool;
};

pub const TransportConfig = union(enum) {
    http: HttpConfig,
    ipc: IpcConfig,
};

pub const TransportError = error{
    ConnectionFailed,
    NetworkError,
    Timeout,
    InvalidResponse,
    InvalidRequest,
    OutOfMemory,
    TlsError,
    AuthenticationFailed,
} || Allocator.Error;
```

### HTTP Transport

```zig
pub const HttpTransport = struct {
    allocator: Allocator,
    url: []const u8,
    headers: std.StringHashMap([]const u8),
    timeout: u32,
    retry_count: u8,
    retry_delay: u32,
    client: std.http.Client,
    
    /// Initialize HTTP transport
    pub fn init(allocator: Allocator, config: HttpConfig) TransportError!HttpTransport;
    
    /// Clean up HTTP transport
    pub fn deinit(self: *HttpTransport) void;
    
    /// Send HTTP request
    pub fn request(self: *HttpTransport, req: JsonRpcRequest) TransportError!JsonRpcResponse;
    
    /// Add custom header
    pub fn addHeader(self: *HttpTransport, key: []const u8, value: []const u8) TransportError!void;
    
    /// Remove header
    pub fn removeHeader(self: *HttpTransport, key: []const u8) void;
    
    /// Test connection
    pub fn testConnection(self: *HttpTransport) TransportError!void;
    
    // Private methods
    fn sendHttpRequest(self: *HttpTransport, body: []const u8) TransportError![]u8;
    fn parseHttpResponse(self: *HttpTransport, response: []const u8) TransportError!JsonRpcResponse;
    fn retryRequest(self: *HttpTransport, req: JsonRpcRequest, attempts: u8) TransportError!JsonRpcResponse;
};

pub const HttpConfig = struct {
    url: []const u8,
    headers: ?std.StringHashMap([]const u8) = null,
    timeout: u32 = 30000,
    retry_count: u8 = 3,
    retry_delay: u32 = 1000,
    user_agent: []const u8 = "Guillotine-Ethereum-Client/1.0",
};
```

### IPC Transport

```zig
pub const IpcTransport = struct {
    allocator: Allocator,
    path: []const u8,
    socket: ?std.net.Stream,
    timeout: u32,
    
    /// Initialize IPC transport
    pub fn init(allocator: Allocator, config: IpcConfig) TransportError!IpcTransport;
    
    /// Clean up IPC transport
    pub fn deinit(self: *IpcTransport) void;
    
    /// Send IPC request
    pub fn request(self: *IpcTransport, req: JsonRpcRequest) TransportError!JsonRpcResponse;
    
    /// Connect to IPC socket
    pub fn connect(self: *IpcTransport) TransportError!void;
    
    /// Disconnect from IPC socket
    pub fn disconnect(self: *IpcTransport) void;
    
    /// Check if connected
    pub fn isConnected(self: IpcTransport) bool;
    
    // Private methods
    fn sendIpcRequest(self: *IpcTransport, data: []const u8) TransportError![]u8;
    fn readIpcResponse(self: *IpcTransport) TransportError![]u8;
};

pub const IpcConfig = struct {
    path: []const u8,
    timeout: u32 = 30000,
};
```

## JSON-RPC Methods

### Method Helper Pattern

Each RPC method has a namespace with `request()` and `response()` functions:

```zig
pub const jsonrpc = struct {
    
    // === Essential Methods ===
    
    pub const chainId = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_chainId",
                .params = JsonValue{ .null = {} },
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !u64 {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return error.InvalidResponse;
            const hex_str = try result.toString();
            return try std.fmt.parseInt(u64, hex_str[2..], 16);
        }
    };
    
    pub const getBalance = struct {
        pub fn request(address: Address, block: BlockId) JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_getBalance",
                .params = JsonValue{ .array = &[_]JsonValue{
                    JsonValue.fromAddress(address),
                    block.toJson(),
                }},
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !u256 {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return error.InvalidResponse;
            const hex_str = try result.toString();
            return try std.fmt.parseInt(u256, hex_str[2..], 16);
        }
    };
    
    pub const getTransactionCount = struct {
        pub fn request(address: Address, block: BlockId) JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_getTransactionCount",
                .params = JsonValue{ .array = &[_]JsonValue{
                    JsonValue.fromAddress(address),
                    block.toJson(),
                }},
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !u64 {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return error.InvalidResponse;
            const hex_str = try result.toString();
            return try std.fmt.parseInt(u64, hex_str[2..], 16);
        }
    };
    
    pub const gasPrice = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_gasPrice",
                .params = JsonValue{ .null = {} },
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !u256 {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return error.InvalidResponse;
            const hex_str = try result.toString();
            return try std.fmt.parseInt(u256, hex_str[2..], 16);
        }
    };
    
    pub const estimateGas = struct {
        pub fn request(call: CallRequest, block: ?BlockId) JsonRpcRequest {
            var params = std.ArrayList(JsonValue).init(std.heap.page_allocator);
            defer params.deinit();
            
            params.append(call.toJson()) catch unreachable;
            if (block) |b| params.append(b.toJson()) catch unreachable;
            
            return JsonRpcRequest{
                .method = "eth_estimateGas",
                .params = JsonValue{ .array = params.items },
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !u64 {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return error.InvalidResponse;
            const hex_str = try result.toString();
            return try std.fmt.parseInt(u64, hex_str[2..], 16);
        }
    };
    
    pub const call = struct {
        pub fn request(call: CallRequest, block: BlockId) JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_call",
                .params = JsonValue{ .array = &[_]JsonValue{
                    call.toJson(),
                    block.toJson(),
                }},
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) ![]const u8 {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return error.InvalidResponse;
            return try result.toString();
        }
    };
    
    pub const sendTransaction = struct {
        pub fn request(tx: TransactionRequest) JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_sendTransaction",
                .params = JsonValue{ .array = &[_]JsonValue{
                    tx.toJson(),
                }},
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !Hash {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return error.InvalidResponse;
            const hex_str = try result.toString();
            return Hash.fromHex(hex_str);
        }
    };
    
    pub const sendRawTransaction = struct {
        pub fn request(signed_tx: []const u8) JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_sendRawTransaction",
                .params = JsonValue{ .array = &[_]JsonValue{
                    JsonValue.fromString(signed_tx),
                }},
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !Hash {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return error.InvalidResponse;
            const hex_str = try result.toString();
            return Hash.fromHex(hex_str);
        }
    };
    
    pub const getTransactionByHash = struct {
        pub fn request(hash: Hash) JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_getTransactionByHash",
                .params = JsonValue{ .array = &[_]JsonValue{
                    JsonValue.fromString(hash.toHex()),
                }},
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !?Transaction {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return null;
            if (result == .null) return null;
            return Transaction.fromJson(result);
        }
    };
    
    pub const getTransactionReceipt = struct {
        pub fn request(hash: Hash) JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_getTransactionReceipt",
                .params = JsonValue{ .array = &[_]JsonValue{
                    JsonValue.fromString(hash.toHex()),
                }},
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !?TransactionReceipt {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return null;
            if (result == .null) return null;
            return TransactionReceipt.fromJson(result);
        }
    };
    
    // === Block Methods ===
    
    pub const blockNumber = struct {
        pub fn request() JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_blockNumber",
                .params = JsonValue{ .null = {} },
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !u64 {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return error.InvalidResponse;
            const hex_str = try result.toString();
            return try std.fmt.parseInt(u64, hex_str[2..], 16);
        }
    };
    
    pub const getBlockByNumber = struct {
        pub fn request(block: BlockId, full_transactions: bool) JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_getBlockByNumber",
                .params = JsonValue{ .array = &[_]JsonValue{
                    block.toJson(),
                    JsonValue{ .bool = full_transactions },
                }},
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !?Block {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return null;
            if (result == .null) return null;
            return Block.fromJson(result);
        }
    };
    
    pub const getBlockByHash = struct {
        pub fn request(hash: Hash, full_transactions: bool) JsonRpcRequest {
            return JsonRpcRequest{
                .method = "eth_getBlockByHash",
                .params = JsonValue{ .array = &[_]JsonValue{
                    JsonValue.fromString(hash.toHex()),
                    JsonValue{ .bool = full_transactions },
                }},
                .id = .{ .number = generateId() },
            };
        }
        
        pub fn response(res: JsonRpcResponse) !?Block {
            if (res.error) |err| return JsonRpcError.fromResponse(err);
            const result = res.result orelse return null;
            if (result == .null) return null;
            return Block.fromJson(result);
        }
    };
    
    // === Utility Functions ===
    
    var request_counter: std.atomic.Value(u64) = std.atomic.Value(u64).init(1);
    
    fn generateId() u64 {
        return request_counter.fetchAdd(1, .monotonic);
    }
};
```

## Account System

### Account Interface

```zig
pub const Account = union(enum) {
    local: LocalAccount,
    // Future: hardware, smart_contract, etc.
    
    /// Sign a transaction
    pub fn signTransaction(self: Account, tx: Transaction) AccountError!Signature;
    
    /// Sign a message (EIP-191)
    pub fn signMessage(self: Account, message: []const u8) AccountError!Signature;
    
    /// Sign typed data (EIP-712)
    pub fn signTypedData(self: Account, typed_data: TypedData) AccountError!Signature;
    
    /// Get account address
    pub fn getAddress(self: Account) Address;
    
    /// Get account type
    pub fn getType(self: Account) AccountType;
    
    /// Check if account can sign
    pub fn canSign(self: Account) bool;
};

pub const AccountType = enum {
    local,
    hardware,
    smart_contract,
    readonly,
};

pub const AccountError = error{
    SigningFailed,
    InvalidTransaction,
    InvalidMessage,
    InvalidTypedData,
    AccountLocked,
    UnsupportedOperation,
    OutOfMemory,
} || Allocator.Error;
```

### Local Account

```zig
pub const LocalAccount = struct {
    private_key: PrivateKey,
    address: Address,
    
    /// Create account from private key
    pub fn fromPrivateKey(private_key: PrivateKey) LocalAccount {
        const public_key = crypto.getPublicKey(private_key) catch unreachable;
        const address = public_key.toAddress();
        return LocalAccount{
            .private_key = private_key,
            .address = address,
        };
    }
    
    /// Create account from mnemonic
    pub fn fromMnemonic(allocator: Allocator, mnemonic: []const u8, path: []const u8) AccountError!LocalAccount {
        const private_key = try deriveMnemonicKey(allocator, mnemonic, path);
        return fromPrivateKey(private_key);
    }
    
    /// Generate random account
    pub fn random(allocator: Allocator) AccountError!LocalAccount {
        const private_key = try crypto.randomPrivateKey();
        return fromPrivateKey(private_key);
    }
    
    /// Sign transaction
    pub fn signTransaction(self: LocalAccount, tx: Transaction) AccountError!Signature {
        const tx_hash = try tx.hash();
        return try crypto.signHash(tx_hash, self.private_key);
    }
    
    /// Sign message (EIP-191)
    pub fn signMessage(self: LocalAccount, message: []const u8) AccountError!Signature {
        return try crypto.signMessage(message, self.private_key);
    }
    
    /// Sign typed data (EIP-712)
    pub fn signTypedData(self: LocalAccount, typed_data: TypedData) AccountError!Signature {
        return try crypto.signTypedData(typed_data, self.private_key);
    }
    
    /// Get address
    pub fn getAddress(self: LocalAccount) Address {
        return self.address;
    }
    
    // Private methods
    fn deriveMnemonicKey(allocator: Allocator, mnemonic: []const u8, path: []const u8) AccountError!PrivateKey {
        // BIP39/BIP44 implementation
        // TODO: Implement mnemonic derivation
        return error.UnsupportedOperation;
    }
};
```

## Error Handling

### Error Types

```zig
pub const EthereumError = error{
    // Client errors
    TransportError,
    JsonRpcError,
    InvalidResponse,
    NetworkError,
    Timeout,
    InvalidRequest,
    AccountRequired,
    ChainIdRequired,
    
    // Transport errors
    ConnectionFailed,
    TlsError,
    AuthenticationFailed,
    
    // Account errors
    SigningFailed,
    InvalidTransaction,
    InvalidMessage,
    AccountLocked,
    UnsupportedOperation,
    
    // JSON-RPC errors
    ParseError,
    InvalidRequestError,
    MethodNotFound,
    InvalidParams,
    InternalError,
    
    // Application errors
    InsufficientFunds,
    GasEstimationFailed,
    TransactionFailed,
    ContractReverted,
    
    // General errors
    OutOfMemory,
    InvalidJson,
    InvalidHex,
    InvalidAddress,
    InvalidHash,
} || Allocator.Error;

/// Convert JSON-RPC error to Zig error
pub fn jsonRpcErrorToZig(code: i32) EthereumError {
    return switch (code) {
        -32700 => EthereumError.ParseError,
        -32600 => EthereumError.InvalidRequestError,
        -32601 => EthereumError.MethodNotFound,
        -32602 => EthereumError.InvalidParams,
        -32603 => EthereumError.InternalError,
        else => EthereumError.JsonRpcError,
    };
}
```

### Error Context

```zig
pub const ErrorContext = struct {
    error_type: EthereumError,
    message: []const u8,
    code: ?i32 = null,
    data: ?JsonValue = null,
    method: ?[]const u8 = null,
    request_id: ?u64 = null,
    
    pub fn init(error_type: EthereumError, message: []const u8) ErrorContext {
        return ErrorContext{
            .error_type = error_type,
            .message = message,
        };
    }
    
    pub fn fromJsonRpcError(error: JsonRpcError) ErrorContext {
        return ErrorContext{
            .error_type = jsonRpcErrorToZig(error.code),
            .message = error.message,
            .code = error.code,
            .data = error.data,
        };
    }
    
    pub fn toString(self: ErrorContext, allocator: Allocator) ![]u8 {
        if (self.code) |code| {
            return try std.fmt.allocPrint(allocator, "Error {d}: {s}", .{ code, self.message });
        }
        return try std.fmt.allocPrint(allocator, "Error: {s}", .{self.message});
    }
};
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)

```zig
// Priority 1: JSON-RPC Infrastructure
- JsonRpcRequest/JsonRpcResponse types
- JsonValue implementation
- Error handling system
- Request ID generation

// Priority 2: HTTP Transport
- Basic HTTP client
- Request/response handling
- Connection management
- Retry logic

// Priority 3: Basic Client
- Client.request() method
- Client initialization
- Configuration system
- Basic error handling

// Priority 4: Essential RPC Methods
- eth_chainId
- eth_getBalance
- eth_getTransactionCount
- eth_gasPrice
- eth_estimateGas
- eth_call
```

### Phase 2: Account & Signing (Week 3-4)

```zig
// Priority 1: Account System
- Account interface
- LocalAccount implementation
- Address derivation
- Account management

// Priority 2: Transaction Signing
- Transaction signing
- Message signing (EIP-191)
- Typed data signing (EIP-712)
- Signature verification

// Priority 3: Transaction Sending
- eth_sendTransaction
- eth_sendRawTransaction
- eth_getTransactionByHash
- eth_getTransactionReceipt

// Priority 4: Contract Interaction
- Contract calls
- Contract deployments
- ABI integration
- Result parsing
```

### Phase 3: Advanced Features (Week 5-6)

```zig
// Priority 1: Block Operations
- eth_blockNumber
- eth_getBlockByNumber
- eth_getBlockByHash
- Block monitoring

// Priority 2: IPC Transport
- IPC client implementation
- Socket management
- Connection handling
- Protocol implementation

// Priority 3: Advanced RPC Methods
- eth_getLogs
- eth_getCode
- eth_getStorageAt
- eth_getProof
- eth_feeHistory
```

### Phase 4: Optimization & Polish (Week 7-8)

```zig
// Priority 1: Performance
- Request batching
- Response caching
- Connection pooling
- Memory optimization

// Priority 2: Enhanced Error Handling
- Detailed error types
- Error recovery
- Fallback strategies
- Logging integration

// Priority 3: Advanced Accounts
- Mnemonic support
- Hardware wallet interface
- Multi-signature support
- Account encryption
```

## File Structure

```
src/
├── client/
│   ├── mod.zig                  # Main client exports
│   ├── client.zig               # Client implementation
│   ├── config.zig               # Configuration types
│   ├── errors.zig               # Error handling
│   │
│   ├── transport/
│   │   ├── mod.zig              # Transport interface
│   │   ├── http.zig             # HTTP transport
│   │   ├── ipc.zig              # IPC transport
│   │   └── errors.zig           # Transport errors
│   │
│   ├── account/
│   │   ├── mod.zig              # Account interface
│   │   ├── local.zig            # Local account
│   │   ├── mnemonic.zig         # Mnemonic support
│   │   └── errors.zig           # Account errors
│   │
│   ├── jsonrpc/
│   │   ├── mod.zig              # JSON-RPC exports
│   │   ├── types.zig            # Request/response types
│   │   ├── methods.zig          # RPC method helpers
│   │   ├── errors.zig           # JSON-RPC errors
│   │   └── utils.zig            # Utility functions
│   │
│   └── types/
│       ├── mod.zig              # Type exports
│       ├── block.zig            # Block types
│       ├── transaction.zig      # Transaction types
│       ├── receipt.zig          # Receipt types
│       └── log.zig              # Log types
│
├── primitives/                  # Already implemented
│   ├── address.zig
│   ├── hash.zig
│   ├── crypto.zig
│   ├── abi/
│   └── ...
│
└── examples/
    ├── basic_usage.zig
    ├── contract_interaction.zig
    ├── transaction_signing.zig
    └── error_handling.zig
```

## Usage Examples

### Basic Client Usage

```zig
const std = @import("std");
const client = @import("client");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Initialize client
    var eth_client = try client.Client.init(allocator, .{
        .transport = .{ .http = try client.HttpTransport.init(allocator, .{
            .url = "https://mainnet.infura.io/v3/YOUR-API-KEY",
        })},
        .chain_id = 1,
    });
    defer eth_client.deinit();
    
    // Get chain ID
    const chain_req = client.jsonrpc.chainId.request();
    const chain_res = try eth_client.request(chain_req);
    const chain_id = try client.jsonrpc.chainId.response(chain_res);
    std.debug.print("Chain ID: {d}\n", .{chain_id});
    
    // Get balance
    const address = try Address.fromString("0x742d35Cc6634C0532925a3b844Bc9e7595f8fA82");
    const balance_req = client.jsonrpc.getBalance.request(address, .{ .tag = .latest });
    const balance_res = try eth_client.request(balance_req);
    const balance = try client.jsonrpc.getBalance.response(balance_res);
    std.debug.print("Balance: {d} wei\n", .{balance});
}
```

### Account & Transaction Signing

```zig
const std = @import("std");
const client = @import("client");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Create account
    const private_key = try primitives.crypto.randomPrivateKey();
    const account = client.LocalAccount.fromPrivateKey(private_key);
    
    // Initialize client with account
    var eth_client = try client.Client.init(allocator, .{
        .transport = .{ .http = try client.HttpTransport.init(allocator, .{
            .url = "https://mainnet.infura.io/v3/YOUR-API-KEY",
        })},
        .account = .{ .local = account },
        .chain_id = 1,
    });
    defer eth_client.deinit();
    
    // Send transaction
    const tx_req = client.jsonrpc.sendTransaction.request(.{
        .to = try Address.fromString("0x742d35Cc6634C0532925a3b844Bc9e7595f8fA82"),
        .value = try primitives.parseEther("0.1"),
        .gas = 21000,
    });
    const tx_res = try eth_client.request(tx_req);
    const tx_hash = try client.jsonrpc.sendTransaction.response(tx_res);
    std.debug.print("Transaction hash: {s}\n", .{tx_hash.toHex()});
}
```

### Contract Interaction

```zig
const std = @import("std");
const client = @import("client");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Initialize client
    var eth_client = try client.Client.init(allocator, .{
        .transport = .{ .http = try client.HttpTransport.init(allocator, .{
            .url = "https://mainnet.infura.io/v3/YOUR-API-KEY",
        })},
        .chain_id = 1,
    });
    defer eth_client.deinit();
    
    // Contract address (USDC)
    const contract_address = try Address.fromString("0xa0b86a33e6c3de40c5b5a91d2ae29b3b7c7d2ed1");
    const owner_address = try Address.fromString("0x742d35Cc6634C0532925a3b844Bc9e7595f8fA82");
    
    // Encode function call
    const call_data = try primitives.abi.encodeFunctionData("balanceOf", .{owner_address});
    
    // Call contract
    const call_req = client.jsonrpc.call.request(.{
        .to = contract_address,
        .data = call_data,
    }, .{ .tag = .latest });
    const call_res = try eth_client.request(call_req);
    const result = try client.jsonrpc.call.response(call_res);
    
    // Decode result
    const balance = try primitives.abi.decodeFunctionResult(result, u256);
    std.debug.print("Token balance: {d}\n", .{balance});
}
```

### Error Handling

```zig
const std = @import("std");
const client = @import("client");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Initialize client
    var eth_client = try client.Client.init(allocator, .{
        .transport = .{ .http = try client.HttpTransport.init(allocator, .{
            .url = "https://mainnet.infura.io/v3/YOUR-API-KEY",
        })},
        .chain_id = 1,
    });
    defer eth_client.deinit();
    
    // Handle errors gracefully
    const req = client.jsonrpc.getBalance.request(
        try Address.fromString("0x742d35Cc6634C0532925a3b844Bc9e7595f8fA82"),
        .{ .tag = .latest }
    );
    
    const res = eth_client.request(req) catch |err| switch (err) {
        error.NetworkError => {
            std.debug.print("Network error: Check your connection\n", .{});
            return;
        },
        error.Timeout => {
            std.debug.print("Request timed out: Try again later\n", .{});
            return;
        },
        error.JsonRpcError => {
            std.debug.print("RPC error: Check your API key\n", .{});
            return;
        },
        else => {
            std.debug.print("Unexpected error: {}\n", .{err});
            return;
        },
    };
    
    const balance = try client.jsonrpc.getBalance.response(res);
    std.debug.print("Balance: {d} wei\n", .{balance});
}
```

### Direct EIP-1193 Style

```zig
const std = @import("std");
const client = @import("client");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Initialize client
    var eth_client = try client.Client.init(allocator, .{
        .transport = .{ .http = try client.HttpTransport.init(allocator, .{
            .url = "https://mainnet.infura.io/v3/YOUR-API-KEY",
        })},
        .chain_id = 1,
    });
    defer eth_client.deinit();
    
    // Direct EIP-1193 style request
    const req = client.JsonRpcRequest{
        .method = "eth_getBalance",
        .params = client.JsonValue{ .array = &[_]client.JsonValue{
            client.JsonValue.fromString("0x742d35Cc6634C0532925a3b844Bc9e7595f8fA82"),
            client.JsonValue.fromString("latest"),
        }},
        .id = .{ .number = 1 },
    };
    
    const res = try eth_client.request(req);
    const balance_hex = try res.result.?.toString();
    const balance = try std.fmt.parseInt(u256, balance_hex[2..], 16);
    std.debug.print("Balance: {d} wei\n", .{balance});
}
```

## Testing Strategy

### Unit Tests

```zig
// test_client.zig
const std = @import("std");
const testing = std.testing;
const client = @import("client");

test "Client initialization" {
    const allocator = testing.allocator;
    
    var eth_client = try client.Client.init(allocator, .{
        .transport = .{ .http = try client.HttpTransport.init(allocator, .{
            .url = "https://mainnet.infura.io/v3/test",
        })},
        .chain_id = 1,
    });
    defer eth_client.deinit();
    
    try testing.expect(eth_client.chain_id == 1);
}

test "JSON-RPC request generation" {
    const req = client.jsonrpc.chainId.request();
    try testing.expectEqualStrings(req.method, "eth_chainId");
}

test "JSON-RPC response parsing" {
    const res = client.JsonRpcResponse{
        .jsonrpc = "2.0",
        .result = client.JsonValue.fromString("0x1"),
        .error = null,
        .id = .{ .number = 1 },
    };
    
    const chain_id = try client.jsonrpc.chainId.response(res);
    try testing.expect(chain_id == 1);
}
```

### Integration Tests

```zig
// test_integration.zig
const std = @import("std");
const testing = std.testing;
const client = @import("client");

test "Real network request" {
    const allocator = testing.allocator;
    
    var eth_client = try client.Client.init(allocator, .{
        .transport = .{ .http = try client.HttpTransport.init(allocator, .{
            .url = "https://mainnet.infura.io/v3/YOUR-API-KEY",
        })},
        .chain_id = 1,
    });
    defer eth_client.deinit();
    
    const req = client.jsonrpc.chainId.request();
    const res = try eth_client.request(req);
    const chain_id = try client.jsonrpc.chainId.response(res);
    
    try testing.expect(chain_id == 1);
}
```

This comprehensive design document provides a complete specification for implementing a modern, type-safe, and performant Ethereum client in Zig. The single `Client.request()` method approach with helper functions provides both simplicity and developer experience while maintaining full EIP-1193 compatibility.
