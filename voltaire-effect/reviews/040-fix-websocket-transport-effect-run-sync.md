# Fix WebSocketTransport Effect.runSync in Callbacks

## Problem

WebSocketTransport uses `Effect.runSync` inside WebSocket event callbacks, which escapes the Effect runtime and can cause issues.

**Location**: `src/services/Transport/WebSocketTransport.ts#L353, L378`

```typescript
ws.onmessage = (event) => {
  Effect.runSync(handleMessage(event.data));  // ❌ Escapes runtime
};

ws.onerror = (event) => {
  Effect.runSync(handleError(event));  // ❌ Escapes runtime
};
```

## Why This Matters

- Loses fiber context and tracing
- Cannot use async effects in handlers
- Interruption signals don't propagate
- Error handling becomes synchronous-only

## Solution

Use a queue-based approach with proper Effect bridging:

```typescript
import * as Queue from "effect/Queue";
import * as Runtime from "effect/Runtime";

const makeWebSocketTransport = (url: string) =>
  Effect.gen(function* () {
    const runtime = yield* Effect.runtime<never>();
    const messageQueue = yield* Queue.unbounded<MessageEvent>();
    const errorQueue = yield* Queue.unbounded<Event>();

    const ws = new WebSocket(url);
    
    ws.onmessage = (event) => {
      Runtime.runSync(runtime)(Queue.offer(messageQueue, event));
    };
    
    ws.onerror = (event) => {
      Runtime.runSync(runtime)(Queue.offer(errorQueue, event));
    };

    // Process messages in Effect context
    const processMessages = Queue.take(messageQueue).pipe(
      Effect.flatMap(handleMessage),
      Effect.forever
    );

    yield* Effect.forkScoped(processMessages);
    
    // ...
  });
```

Or simpler - capture runtime at layer creation:

```typescript
const WebSocketTransport = (url: string): Layer.Layer<TransportService> =>
  Layer.scoped(
    TransportService,
    Effect.gen(function* () {
      const runtime = yield* Effect.runtime<never>();
      const ws = yield* Effect.acquireRelease(
        Effect.sync(() => new WebSocket(url)),
        (ws) => Effect.sync(() => ws.close())
      );

      ws.onmessage = (event) => {
        Runtime.runPromise(runtime)(handleMessage(event.data));
      };
      // ...
    })
  );
```

## Acceptance Criteria

- [ ] Replace `Effect.runSync` with `Runtime.runSync(runtime)` or queue-based approach
- [ ] Capture runtime via `Effect.runtime<never>()`
- [ ] Ensure cleanup on scope close
- [ ] All existing tests pass

## Priority

**High** - Effect runtime escape
