# Batched Provider Requirements

Requirements extracted from viem and ethers implementations.

## JSON-RPC Batch Format

```json
// Request (array of JSON-RPC requests)
[
  { "jsonrpc": "2.0", "id": 1, "method": "eth_blockNumber", "params": [] },
  { "jsonrpc": "2.0", "id": 2, "method": "eth_getBalance", "params": ["0x...", "latest"] },
  { "jsonrpc": "2.0", "id": 3, "method": "eth_call", "params": [{...}, "latest"] }
]

// Response (array of JSON-RPC responses, may be out of order)
[
  { "jsonrpc": "2.0", "id": 2, "result": "0x1234" },
  { "jsonrpc": "2.0", "id": 1, "result": "0xabc123" },
  { "jsonrpc": "2.0", "id": 3, "error": { "code": -32000, "message": "execution reverted" } }
]
```

## Core Requirements

### 1. Request Queue with Promise Tracking
- Each incoming request gets a unique ID
- Store `{ id, resolve, reject }` for each pending request
- Return Promise immediately to caller
- Route response back to correct Promise based on ID

### 2. Debounce/Scheduling (from viem)
- `wait` param: milliseconds to wait before sending batch (default: 0)
- Use `setTimeout` to schedule batch execution
- Only schedule if no pending timer exists
- Immediately schedule if `shouldSplitBatch` returns true

### 3. Max Batch Size (from viem/ethers)
- `batchSize` (viem): max requests per batch (default: 1000)
- `batchMaxCount` (ethers): max requests per batch (default: 100)
- `batchMaxSize` (ethers): max bytes per batch (default: 1MB)
- Split into multiple batches if limits exceeded

### 4. Response Routing
- Match responses by `id` field (not by array index - responses may be reordered)
- Resolve/reject each Promise individually
- Handle missing responses (reject with error)

### 5. Error Handling
- **Batch-level error**: Network failure, HTTP error - reject ALL pending requests
- **Per-request error**: `error` in response - reject only that request
- **Missing response**: Reject with "missing response" error
- **Partial success**: Some succeed, some fail - handle independently

### 6. Timeout Handling
- Per-batch timeout for HTTP request
- Reject all pending requests on timeout

## Configuration Options

| Option | viem | ethers | Description |
|--------|------|--------|-------------|
| wait | 0 | 10ms (`batchStallTime`) | Debounce window before sending |
| batchSize | 1000 | 100 (`batchMaxCount`) | Max requests per batch |
| - | - | 1MB (`batchMaxSize`) | Max bytes per batch |
| timeout | 10s | - | Request timeout |

## Implementation Notes

### viem Approach
- `createBatchScheduler`: Generic scheduler with `shouldSplitBatch` callback
- Scheduler stored in WeakMap by URL (same URL shares batches)
- Uses `withResolvers()` (Promise.withResolvers pattern)
- Sorts responses by ID before routing

### ethers Approach
- `#payloads` queue with `{ resolve, reject, payload }`
- `#drainTimer` for debounce
- Creates batch within size constraints
- Sends single request if `batchMaxCount === 1`

### Key Patterns

```javascript
// Promise tracking
const pending = new Map();
const id = nextId++;
const promise = new Promise((resolve, reject) => {
  pending.set(id, { resolve, reject });
});

// Debounce
if (!timer) {
  timer = setTimeout(flush, wait);
}

// Response routing
for (const response of responses) {
  const { resolve, reject } = pending.get(response.id);
  if (response.error) {
    reject(response.error);
  } else {
    resolve(response.result);
  }
  pending.delete(response.id);
}

// Batch-level error
for (const { reject } of pending.values()) {
  reject(error);
}
```

## Integration with Voltaire

### Provider Interface
Wrap any EIP-1193 provider that has a `request()` method:
```typescript
interface Provider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}
```

### Direct HTTP Batching
For HTTP providers, batch at the HTTP level (array of JSON-RPC in body).

### EIP-1193 Fallback
For non-HTTP providers (WebSocket, injected), batch by parallel `request()` calls.
