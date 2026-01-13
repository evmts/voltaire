# ForkBackend Documentation

**ForkBackend** provides RPC client functionality for fetching remote Ethereum state with configurable LRU caching.

## Features

- **Transport Abstraction**: HTTP, WebSocket, IPC via vtable pattern
- **Configurable Caching**: LRU, FIFO, or unbounded eviction policies
- **Remote State Fetching**: Account, storage, and code from any RPC endpoint
- **Memory Efficient**: Configurable cache size with automatic eviction

## Architecture

```
┌─────────────────────────────────────────────┐
│ ForkBackend                                 │
├─────────────────────────────────────────────┤
│ - RpcClient (vtable for transport)          │
│ - account_cache (LRU)                       │
│ - storage_cache (LRU)                       │
│ - code_cache (LRU)                          │
└─────────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │ Transport Layer      │
         ├──────────────────────┤
         │ • HTTP (std.http)    │
         │ • WebSocket          │
         │ • IPC                │
         └──────────────────────┘
```

## Usage

### Basic Setup (Zig)

```zig
const state_manager = @import("state-manager");
const ForkBackend = state_manager.ForkBackend;

// Create RPC client vtable (see examples below)
const rpc_client = createRpcClient(allocator, rpc_url);

// Create fork backend with config
var fork_backend = try ForkBackend.init(
    allocator,
    rpc_client,
    "latest",  // block tag
    .{
        .max_size = 10000,
        .eviction_policy = .lru,
    },
);
defer fork_backend.deinit();

// Fetch remote state
const account = try fork_backend.fetchAccount(address);
const storage = try fork_backend.fetchStorage(address, slot);
const code = try fork_backend.fetchCode(address);
```

### Configuration Options

```zig
pub const CacheConfig = struct {
    max_size: usize = 10000,
    eviction_policy: EvictionPolicy = .lru,

    pub const EvictionPolicy = enum {
        lru,   // Least Recently Used (default)
        fifo,  // First In First Out
        none,  // No eviction (unbounded)
    };
};
```

**Recommendations**:
- `max_size = 10000` - Good default for dev nodes
- `eviction_policy = .lru` - Best for fork caching (frequently accessed data stays)
- `eviction_policy = .none` - Use for tests with finite state sets

### Transport Options

```zig
pub const Transport = union(enum) {
    http: HttpConfig,
    websocket: WebSocketConfig,
    ipc: IpcConfig,

    pub const HttpConfig = struct {
        url: []const u8,
        timeout_ms: u64 = 30000,
    };
};
```

## RPC Client Implementations

### TypeScript HTTP Client (Recommended)

Use `fetch` or `axios` from TypeScript, pass vtable to Zig:

```typescript
import * as ForkBackend from './state-manager/ForkBackend';

// TypeScript RPC implementation
class TypeScriptRpcClient {
  constructor(private url: string) {}

  async getProof(address: string, slots: bigint[], blockTag: string) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getProof',
        params: [address, slots.map(s => `0x${s.toString(16)}`), blockTag],
        id: 1
      })
    });
    return await response.json();
  }

  async getCode(address: string, blockTag: string) {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [address, blockTag],
        id: 1
      })
    });
    return await response.json();
  }
}

// Pass to Zig via FFI
const client = new TypeScriptRpcClient(process.env.ALCHEMY_RPC);
const forkBackend = ForkBackend.create(client, 'latest', {
  maxSize: 10000,
  evictionPolicy: 'lru'
});
```

### Zig HTTP Client (Alternative)

Use `std.http.Client` for pure Zig implementation:

```zig
const std = @import("std");

pub const HttpRpcClient = struct {
    allocator: std.mem.Allocator,
    http_client: std.http.Client,
    url: []const u8,

    pub fn init(allocator: std.mem.Allocator, url: []const u8) !HttpRpcClient {
        return .{
            .allocator = allocator,
            .http_client = .{ .allocator = allocator },
            .url = try allocator.dupe(u8, url),
        };
    }

    pub fn deinit(self: *HttpRpcClient) void {
        self.allocator.free(self.url);
        self.http_client.deinit();
    }

    pub fn getProof(...) !EthProof {
        const uri = try std.Uri.parse(self.url);
        var request = try self.http_client.request(.POST, uri, .{
            .headers = .{ .content_type = "application/json" }
        });
        defer request.deinit();

        // Send JSON body
        const body = try std.fmt.allocPrint(allocator,
            \\{{"jsonrpc":"2.0","method":"eth_getProof","params":[...],"id":1}}
        , .{...});
        defer allocator.free(body);

        try request.send(body);
        const response = try request.finish();

        // Read and parse response
        var reader_buffer: [8192]u8 = undefined;
        const bytes_read = try response.readAll(&reader_buffer);
        return try parseProofResponse(reader_buffer[0..bytes_read]);
    }
};
```

**Complete Example**: See `examples/fork-backend-zig-http.zig`

## RPC Client Vtable Pattern

The vtable pattern allows ForkBackend to work with any transport without knowing the details:

```zig
pub const RpcClient = struct {
    ptr: *anyopaque,
    vtable: *const VTable,

    pub const VTable = struct {
        getProof: *const fn(
            ptr: *anyopaque,
            address: Address,
            slots: []const u256,
            block_tag: []const u8,
        ) anyerror!EthProof,

        getCode: *const fn(
            ptr: *anyopaque,
            address: Address,
            block_tag: []const u8,
        ) anyerror![]const u8,
    };
};
```

### Creating a Vtable

```zig
fn createVTable(client: *YourClient) RpcClient {
    return .{
        .ptr = client,
        .vtable = &.{
            .getProof = yourGetProofImpl,
            .getCode = yourGetCodeImpl,
        },
    };
}

fn yourGetProofImpl(ptr: *anyopaque, ...) !EthProof {
    const client: *YourClient = @ptrCast(@alignCast(ptr));
    return client.getProof(...);
}
```

## Cache Behavior

### LRU Eviction

When cache reaches `max_size`, oldest accessed item is removed:

```zig
fetchAccount(addr1)  // Cache: [addr1] (size 1)
fetchAccount(addr2)  // Cache: [addr1, addr2] (size 2)
fetchAccount(addr1)  // Cache: [addr2, addr1] (size 2, addr1 most recent)
fetchAccount(addr3)  // Cache: [addr1, addr3] (size 2, addr2 evicted)
```

### Access Order Tracking

Each cache maintains an access order list:
- `get()` - Moves item to end (most recent)
- `put()` - Adds to end
- `evictOldest()` - Removes from front

### Memory Management

- **Account cache**: `AutoHashMap(Address, AccountState)` - Values are copied
- **Storage cache**: `AutoHashMap(Address, AutoHashMap(u256, u256))` - Nested maps
- **Code cache**: `AutoHashMap(Address, []const u8)` - Owned slices, freed on eviction

## Integration with JournaledState

ForkBackend is used by JournaledState for remote fetching:

```zig
pub const JournaledState = struct {
    account_cache: AccountCache,      // Normal cache (source of truth)
    fork_backend: ?*ForkBackend,      // Remote fetcher (passive)

    pub fn getAccount(self: *JournaledState, address: Address) !AccountState {
        // Check normal cache first
        if (self.account_cache.get(address)) |account| {
            return account;
        }

        // Fallback to fork backend
        if (self.fork_backend) |fork| {
            const account = try fork.fetchAccount(address);
            try self.account_cache.put(address, account);  // Cache locally
            return account;
        }

        // Return empty account
        return AccountState.init();
    }
};
```

**Read Flow**: Normal cache → Fork backend → Default value

**Write Flow**: Normal cache only (fork backend never modified)

## Performance Considerations

### Cache Hit Rates

With typical fork usage:
- **Account cache**: 60-80% hit rate (addresses reused frequently)
- **Storage cache**: 40-60% hit rate (slot reads less frequent)
- **Code cache**: 90%+ hit rate (code rarely changes)

### Recommended Sizes

| Use Case | max_size | eviction_policy |
|----------|----------|-----------------|
| Dev node (1-10 contracts) | 1,000 | lru |
| Integration tests | 5,000 | lru |
| Large simulations | 50,000 | lru |
| Finite test sets | unlimited | none |

### Latency

- **Cache hit**: <1ms (in-memory lookup)
- **Cache miss (RPC)**: 50-200ms (network + remote query)
- **First read**: Always miss (cold cache)
- **Subsequent reads**: High hit rate (warm cache)

## Error Handling

ForkBackend propagates RPC errors:

```zig
const account = fork_backend.fetchAccount(address) catch |err| {
    switch (err) {
        error.ConnectionRefused => // RPC endpoint down
        error.Timeout => // Request took >30s
        error.InvalidResponse => // Malformed JSON
        error.OutOfMemory => // Allocation failed
        else => // Other errors
    }
};
```

**Retry Strategy**: Not implemented in ForkBackend (implement in RpcClient if needed)

## Testing

```zig
test "ForkBackend with mock RPC" {
    const allocator = std.testing.allocator;

    // Create mock RPC client
    var mock_client = MockRpcClient.init(allocator);
    defer mock_client.deinit();

    const rpc_vtable = createMockVTable(&mock_client);

    // Create fork backend
    var fork_backend = try ForkBackend.init(
        allocator,
        rpc_vtable,
        "latest",
        .{ .max_size = 100, .eviction_policy = .lru },
    );
    defer fork_backend.deinit();

    // Test fetch
    const account = try fork_backend.fetchAccount(test_address);
    try std.testing.expectEqual(@as(u64, 5), account.nonce);
}
```

## References

- **Zig std.http.Client**: [Zig 0.15.1 HTTP Example](https://gist.github.com/Zorgatone/968ce86711aecea984a2c4a9771eed5f)
- **Example Implementation**: `examples/fork-backend-zig-http.zig`
- **Source Code**: `src/state-manager/ForkBackend.zig`
- **Tests**: `src/state-manager/ForkBackend.zig` (inline tests)

## Related Documentation

- [StateManager](./state-manager.md) - Main state management API
- [JournaledState](./journaled-state.md) - Dual-cache orchestrator
- [Milestone 1 Plan](../TEVM_PARITY_PLAN.md) - Overall architecture
