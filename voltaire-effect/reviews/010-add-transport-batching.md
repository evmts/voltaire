# Review: Add Transport Request Batching

## Priority: 🔴 CRITICAL

**Updated**: 2026-01-26  
**Status**: ✅ Implemented in `HttpTransport` with `BatchScheduler`; end-to-end HTTP batching tests are still skipped.

## Summary

Implement JSON-RPC batch requests to combine multiple requests into a single HTTP call.

## Current State

Batching is implemented and wired into `HttpTransport` via the `batch` option, using `createBatchScheduler` to queue and flush JSON-RPC batches.

**Evidence (current code)**:
- `voltaire-effect/src/services/Transport/BatchScheduler.ts` - scheduler implementation
- `voltaire-effect/src/services/Transport/HttpTransport.ts` - `batch?: BatchOptions` support + `createBatchScheduler`
- `voltaire-effect/src/services/Transport/BatchScheduler.test.ts` - unit tests
- `voltaire-effect/src/services/Transport/Transport.test.ts` - batching integration tests are present but `describe.skip(...)`

**Remaining gaps**:
1. Unskip the HTTP batching integration tests in `voltaire-effect/src/services/Transport/Transport.test.ts` and stabilize timers (likely via TestClock or deterministic scheduling).
2. Add a regression test for partial/missing batch responses (ensuring deferreds fail with a useful error).

## Implementation

### 1. Add BatchScheduler

```typescript
// src/services/Transport/BatchScheduler.ts
export interface BatchSchedulerOptions {
  batchSize?: number;      // Max requests per batch (default: 100)
  wait?: number;           // Wait time in ms (default: 0 - immediate)
  shouldSplitBatch?: (batch: Request[]) => boolean;
}

interface PendingRequest {
  request: JsonRpcRequest;
  resolve: (result: unknown) => void;
  reject: (error: Error) => void;
}

export const createBatchScheduler = (
  send: (batch: JsonRpcRequest[]) => Effect.Effect<JsonRpcResponse[], TransportError>,
  options: BatchSchedulerOptions = {}
) => {
  const batchSize = options.batchSize ?? 100;
  const wait = options.wait ?? 0;
  
  let pending: PendingRequest[] = [];
  let scheduledFlush: ReturnType<typeof setTimeout> | null = null;
  
  const flush = () => Effect.gen(function* () {
    const batch = pending.splice(0, batchSize);
    if (batch.length === 0) return;
    
    const requests = batch.map(p => p.request);
    const responses = yield* send(requests);
    
    // Match responses to requests by id
    for (const response of responses) {
      const req = batch.find(p => p.request.id === response.id);
      if (!req) continue;
      
      if ('error' in response) {
        req.reject(new Error(response.error.message));
      } else {
        req.resolve(response.result);
      }
    }
  });
  
  return {
    schedule: (request: JsonRpcRequest) =>
      Effect.async<unknown, TransportError>((resume) => {
        pending.push({
          request,
          resolve: (result) => resume(Effect.succeed(result)),
          reject: (error) => resume(Effect.fail(new TransportError(error)))
        });
        
        if (pending.length >= batchSize) {
          Effect.runPromise(flush());
        } else if (!scheduledFlush && wait > 0) {
          scheduledFlush = setTimeout(() => {
            scheduledFlush = null;
            Effect.runPromise(flush());
          }, wait);
        } else if (wait === 0) {
          queueMicrotask(() => Effect.runPromise(flush()));
        }
      })
  };
};
```

### 2. Update HttpTransport

```typescript
// In HttpTransport factory
export const HttpTransport = (
  url: string,
  options?: HttpTransportOptions
) => {
  const batch = options?.batch;
  
  if (batch) {
    const scheduler = createBatchScheduler(
      (requests) => sendBatch(url, requests),
      batch
    );
    
    return Layer.succeed(TransportService, {
      request: (method, params) => scheduler.schedule({
        jsonrpc: '2.0',
        id: nextId++,
        method,
        params
      })
    });
  }
  
  // ... existing non-batched implementation
};
```

### 3. Add HTTP batch send

```typescript
const sendBatch = (
  url: string,
  requests: JsonRpcRequest[]
): Effect.Effect<JsonRpcResponse[], TransportError> =>
  Effect.tryPromise({
    try: async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requests)
      });
      return response.json();
    },
    catch: (e) => new TransportError(e, 'Batch request failed')
  });
```

## Usage

```typescript
const transport = HttpTransport('https://eth.llamarpc.com', {
  batch: {
    batchSize: 50,
    wait: 10 // ms
  }
});
```

## Testing

- Test batch accumulation
- Test flush on size limit
- Test flush on wait timeout
- Test error handling per-request
- Test concurrent batch scheduling
