# Provider Package - Status and Design Documentation

## Current Status: ⚠️ BROKEN - DO NOT USE IN PRODUCTION

The provider package is currently **non-functional** due to fundamental architecture and compatibility issues. The hardfork tests have been disabled in the build system to prevent compilation failures.

**DO NOT ATTEMPT TO USE THIS PROVIDER IMPLEMENTATION** - it will cause compilation errors and runtime failures.

## Original Intent

The provider package was designed to provide JSON-RPC client functionality for:
- Connecting to Ethereum nodes via HTTP/HTTPS and IPC
- Making JSON-RPC calls (eth_getBlockByNumber, eth_getTransactionReceipt, etc.)
- Supporting hardfork tests that fetch real blockchain data instead of static JSON files
- Replacing static JSON test data with live network requests

## Architecture Overview

### Current (Broken) Design

```
src/provider/
├── provider.zig          # Main Provider struct with ProviderConfig, ProviderError
├── root.zig             # Module exports (Provider, JsonRpc, Transport, etc.)
├── transport/           # Transport layer implementations
│   ├── errors.zig       # TransportError definitions
│   ├── http.zig        # HTTP transport (BROKEN)
│   ├── ipc.zig         # IPC transport (BROKEN)  
│   └── mod.zig         # Transport module exports
├── jsonrpc/            # JSON-RPC protocol handling
│   ├── methods.zig     # RPC method definitions (BROKEN)
│   └── types.zig       # JsonValue, JsonRpcRequest types
└── README.md           # This file
```

### Integration Points

- **Build System**: `build.zig` defines `provider_mod` module
- **Hardfork Tests**: `test/evm/hardfork_tests.zig` (DISABLED due to provider issues)
- **Module Exports**: Available as `@import("provider")` when working

## Critical Issues Preventing Production Use

### 1. JSON Serialization Architecture Failure

**Root Cause**: The provider attempts to serialize complex types containing function pointers and allocators, which is fundamentally incompatible with Zig's JSON serialization.

**Specific Errors**:
```
error: values of type 'fn (*anyopaque, usize, mem.Alignment, usize) ?[*]u8' must be comptime-known
error: unable to stringify type '[*]align(8) u8' without sentinel
```

**Why This Happens**: 
- Custom `JsonValue` union contains allocator-dependent types
- Attempting to serialize `std.mem.Allocator` and function pointers
- Mixing runtime and comptime type information incorrectly

### 2. Zig Standard Library API Incompatibility

**Root Cause**: The implementation was written for an older/different version of Zig's standard library.

**Specific Issues**:
- `http.Client.FetchOptions.url` field doesn't exist (should be `.location = .{ .url = ... }`)
- `JsonValue` union uses `.integer` field that doesn't exist (should be `.float` for numbers)
- Missing error types like `NameResolutionFailed`, `HttpError`, `ConnectionError`
- Incorrect integer/float casting functions (`@intCast` vs `@intFromFloat`)

### 3. Type System Confusion

**Root Cause**: Mixing custom types with standard library types incorrectly.

**Specific Issues**:
- Custom `JsonValue` vs `std.json.Value` type confusion
- Attempting to use custom enums with stdlib JSON functions
- Incorrect error union compositions
- Mismatched allocator ownership patterns

### 4. Transport Layer Design Flaws

**Root Cause**: Over-engineered abstraction that doesn't align with actual requirements.

**Issues**:
- Complex JSON value conversion layers that serve no purpose
- Unnecessary abstraction over HTTP client
- IPC transport implementation incomplete and untested
- Error handling doesn't match transport realities

## Files Requiring Complete Rewrite

### ❌ Completely Broken (Compilation Failures)
- `src/provider/transport/http.zig` - JSON serialization errors, API incompatibility
- `src/provider/transport/ipc.zig` - Type errors, missing implementations  
- `src/provider/jsonrpc/methods.zig` - JsonValue type errors
- `src/provider/provider.zig` - Depends on broken transport layer

### ⚠️ Partially Broken (Logic Issues)
- `src/provider/jsonrpc/types.zig` - JsonValue definition inconsistencies
- `src/provider/transport/errors.zig` - Missing error types, incorrect hierarchy

### ✅ Structure Only (No Implementation)
- `src/provider/transport/mod.zig` - Just exports, could be reused
- `src/provider/root.zig` - Module structure is reasonable

## Hardfork Test Integration Attempt

The hardfork tests were partially converted to use the provider:

### What Was Implemented
- `createTestProvider()` function to create HTTP RPC provider
- `fetchBlockData()` and `fetchTransactionReceipt()` functions
- Real blockchain data fetching instead of static JSON files
- Environment variable support for RPC URLs

### What's Broken
- **All of it** - the provider implementation doesn't compile
- Tests are disabled in `build.zig` (line 1021 commented out)
- Would require complete provider rewrite to function

### Test Strategy (When Fixed)
```zig
// Intended usage (currently broken):
var provider = createTestProvider(allocator);
const block = fetchBlockData(allocator, &provider, 22906813);
const receipt = fetchTransactionReceipt(allocator, &provider, tx.hash);
// Execute transaction with our EVM and compare results
```

## Immediate Actions Required

### For Developers
1. **DO NOT USE** this provider implementation
2. **DO NOT TRY TO FIX** piecemeal - requires complete rewrite
3. Use hardfork tests with `zig build test-hardfork` individually if needed (will fail)

### For Future Implementation
1. **Simple HTTP-only approach** - skip complex abstractions
2. **Direct std.http.Client usage** - no custom transport layer
3. **String-based JSON** - avoid complex JsonValue unions
4. **Minimal error handling** - basic HTTP errors only

## Recommended Rewrite Approach

### Phase 1: Minimal Working Implementation
```zig
// Simple, working approach:
const Provider = struct {
    allocator: Allocator,
    client: std.http.Client,
    url: []const u8,
    
    pub fn request(self: *Provider, method: []const u8, params: []const u8) ![]u8 {
        const json = try std.fmt.allocPrint(self.allocator, 
            \\{{"jsonrpc":"2.0","method":"{s}","params":{s},"id":1}}
        , .{ method, params });
        defer self.allocator.free(json);
        
        // Direct HTTP POST with std.http.Client
        // Parse response as string, return JSON string
        // NO custom JsonValue types, NO complex serialization
    }
};
```

### Phase 2: Convenience Methods
Only after Phase 1 works completely:
- `getBlockByNumber()`  
- `getTransactionReceipt()`
- `getChainId()`

### Phase 3: Error Handling
Only after Phase 2 is thoroughly tested:
- Network timeouts
- JSON parsing errors
- HTTP status codes

## Testing Strategy

### Unit Tests (Currently None)
- Test HTTP request formatting
- Test JSON response parsing  
- Test error conditions

### Integration Tests (Currently Disabled)
- Test against local test node
- Test against public RPC endpoints
- Hardfork test integration

## Performance Considerations

### Current Issues
- Memory leaks in JSON serialization
- Excessive allocations in transport layer
- Unnecessary JSON conversions

### Target Performance  
- Single allocation per request
- Direct JSON string manipulation
- Efficient HTTP connection reuse

---

## Summary

The provider package represents a **failed attempt** at implementing JSON-RPC client functionality. The architecture is fundamentally flawed and incompatible with Zig's type system and standard library.

**Recommendation**: Completely scrap the current implementation and start fresh with a minimal, working approach focused on the specific needs of the hardfork tests.

**Timeline**: Current implementation should be considered **permanent technical debt** until a complete rewrite is undertaken.

**Impact**: Hardfork tests cannot validate our EVM implementation against real blockchain data, limiting our ability to ensure correctness and compatibility.

---

*This documentation serves as a warning and guide for future developers. Do not attempt to fix this implementation - start fresh.*