# EIP-1193 Test Updates

## Summary

Updated provider and request builder tests for EIP-1193 compliance. Tests now verify the standard Ethereum Provider JavaScript API interface.

## Changes Made

### 1. Updated Rpc Request Builder Tests (`src/jsonrpc/Rpc.test.ts`)

**Changes:**
- ✅ Removed `id` field from expected request objects
- ✅ Removed `jsonrpc` field from expected request objects
- ✅ Removed `__brand` field from expected request objects
- ✅ Updated assertions to match RequestArguments interface: `{method, params?}`
- ✅ Fixed test for methods without params (BlockNumberRequest, ChainIdRequest)
- ✅ Added test verifying RequestArguments structure

**Result:** All 10 tests pass

**Example Change:**
```typescript
// Before (OLD - non-EIP-1193)
expect(request).toEqual({
  jsonrpc: "2.0",
  method: "eth_blockNumber",
  params: [],
  id: null,
  __brand: "JsonRpcRequest",
});

// After (NEW - EIP-1193 compliant)
expect(request).toEqual({
  method: "eth_blockNumber",
});
```

### 2. Created EIP-1193 Compliance Tests (`src/provider/EIP1193Provider.test.ts`)

**New comprehensive test suite covering:**

#### RequestArguments Interface (4 tests)
- Required `method` field
- Optional `params` field
- Params as array
- Params as object

#### request() Method Signature (3 tests)
- Accepts RequestArguments and returns Promise
- Throws on error (not return error object)
- Resolves with method-specific return type

#### EventEmitter Interface (4 tests)
- Has `on()` method
- Has `removeListener()` method
- `on()` returns provider for chaining
- `removeListener()` returns provider for chaining

#### Standard Events (9 tests)
- Supports all 5 standard EIP-1193 events:
  - `connect` (with chainId)
  - `disconnect` (with error)
  - `chainChanged` (with chainId string)
  - `accountsChanged` (with accounts array)
  - `message` (with message object)

#### Error Codes (6 tests)
- UserRejectedRequest (4001)
- Unauthorized (4100)
- UnsupportedMethod (4200)
- Disconnected (4900)
- ChainDisconnected (4901)
- Optional data field

#### Error Handling (3 tests)
- request() rejects with error (not returns error object)
- Error object has numeric code
- Error object has message string

#### Type Safety (3 tests)
- Method names are type-safe strings
- Params are type-safe arrays or objects
- Event names are type-safe strings

**Result:** All 32 tests pass

### 3. Created HttpProvider EIP-1193 Tests (`src/provider/HttpProvider.test.ts`)

**Status:** ⏸️ SKIPPED (pending implementation migration)

**Test suite covers (27 tests total):**
- request() method execution for various RPC methods
- Error handling (throws instead of Response<T> unions)
- EventEmitter interface
- Constructor options
- Batch requests
- Method coverage (eth, debug, engine namespaces)

**Note:** Current HttpProvider uses individual methods (eth_blockNumber, eth_getBalance, etc.) and returns Response<T> unions. These tests verify the future EIP-1193 interface where providers use a single request() method and throw errors.

### 4. Created WebSocketProvider EIP-1193 Tests (`src/provider/WebSocketProvider.test.ts`)

**Status:** ⏸️ SKIPPED (pending implementation migration)

**Test suite covers (33 tests total):**
- request() method execution
- Error handling (throws instead of Response<T> unions)
- EventEmitter interface with all 5 standard events
- WebSocket subscriptions (eth_subscribe/eth_unsubscribe)
- Connection management (connect, disconnect, reconnect)
- Constructor options
- Method coverage

**Note:** Current WebSocketProvider uses async generator events and individual methods. These tests verify the future EventEmitter-based interface.

## Test Execution

```bash
# Run all new/updated tests
bun run test:run src/jsonrpc/Rpc.test.ts src/provider/*.test.ts

# Results:
# ✓ src/jsonrpc/Rpc.test.ts (10 tests) - ALL PASS
# ✓ src/provider/EIP1193Provider.test.ts (32 tests) - ALL PASS
# ↓ src/provider/HttpProvider.test.ts (27 tests | 27 skipped)
# ↓ src/provider/WebSocketProvider.test.ts (33 tests | 33 skipped)
```

## EIP-1193 Compliance Checklist

### ✅ Completed

- [x] Request builder tests updated for RequestArguments format
- [x] Comprehensive EIP-1193 compliance test suite
- [x] Tests for request() method signature
- [x] Tests for EventEmitter methods (on, removeListener)
- [x] Tests for all 5 standard events
- [x] Tests for standard error codes (4001, 4100, 4200, 4900, 4901)
- [x] Tests verify errors are thrown (not returned)
- [x] Provider test suites created for future implementation

### ⏸️ Pending (Implementation)

- [ ] Migrate HttpProvider to use request() method
- [ ] Migrate HttpProvider to throw errors instead of Response<T>
- [ ] Migrate HttpProvider to EventEmitter pattern
- [ ] Migrate WebSocketProvider to use request() method
- [ ] Migrate WebSocketProvider to throw errors instead of Response<T>
- [ ] Migrate WebSocketProvider to EventEmitter pattern
- [ ] Enable HttpProvider.test.ts (remove .skip)
- [ ] Enable WebSocketProvider.test.ts (remove .skip)

## Key Differences: Old vs EIP-1193

### Request Format

**OLD (non-standard):**
```typescript
{
  jsonrpc: "2.0",
  method: "eth_blockNumber",
  params: [],
  id: null,
  __brand: "JsonRpcRequest"
}
```

**NEW (EIP-1193):**
```typescript
{
  method: "eth_blockNumber",
  params?: [] // optional
}
```

### Provider Interface

**OLD (individual methods):**
```typescript
const result = await provider.eth_blockNumber();
if (result.error) {
  console.error(result.error.message);
} else {
  console.log(result.result);
}
```

**NEW (EIP-1193 request method):**
```typescript
try {
  const result = await provider.request({
    method: "eth_blockNumber"
  });
  console.log(result); // Direct result value
} catch (error) {
  console.error(error.message); // Errors are thrown
}
```

### Event System

**OLD (async generators):**
```typescript
for await (const block of provider.events.newHeads()) {
  console.log(block);
}
```

**NEW (EIP-1193 EventEmitter):**
```typescript
provider.on("chainChanged", (chainId) => {
  console.log("Chain changed to:", chainId);
});

provider.removeListener("chainChanged", handler);
```

## Standard Error Codes

EIP-1193 defines these standard error codes:

| Code | Name | Meaning |
|------|------|---------|
| 4001 | User Rejected Request | User declined the operation |
| 4100 | Unauthorized | Method/account lacks user authorization |
| 4200 | Unsupported Method | Provider doesn't support the method |
| 4900 | Disconnected | Provider disconnected from all chains |
| 4901 | Chain Disconnected | Provider not connected to requested chain |

## References

- [EIP-1193: Ethereum Provider JavaScript API](https://eips.ethereum.org/EIPS/eip-1193)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)
- [Ethereum JSON-RPC API](https://ethereum.org/en/developers/docs/apis/json-rpc/)
