# Voltaire-Effect Idiomatic Effect Review

**Date**: January 2026  
**Reviewer**: Amp  
**Scope**: Full codebase review for idiomatic Effect patterns

## Executive Summary

The voltaire-effect library has a solid foundation but contains several anti-patterns that break Effect's semantics. The most critical issues involve:

1. **Effect.runSync/runPromise inside Effect code** - Breaks fiber semantics
2. **Mutable state outside Ref** - Race conditions
3. **setTimeout/setInterval** - Not Effect-controlled
4. **AsyncGenerator wrappers** - Loses Effect Stream benefits

## Critical Issues (P0)

| Review | Module | Issue |
|--------|--------|-------|
| [072](072-fix-batch-scheduler-non-effect.md) | BatchScheduler | Uses async/await with Effect.runPromise |
| [073](073-fix-websocket-effect-runsync-in-callbacks.md) | WebSocketTransport | Effect.runSync in WebSocket callbacks |
| [074](074-fix-nonce-manager-mutable-state.md) | DefaultNonceManager | Mutable Map causes race conditions |
| [075](075-fix-fallback-transport-mutable-instances.md) | FallbackTransport | Mutable array outside Effect |

## High Priority Issues (P1)

| Review | Module | Issue |
|--------|--------|-------|
| [076](076-use-effect-schema-for-types.md) | All types | Manual validation instead of Schema |
| [077](077-use-effect-request-for-provider.md) | Provider | No Request/Resolver for batching |
| [079](079-use-effect-stream-properly.md) | BlockStream | AsyncGenerator wrapper loses Stream benefits |
| [080](080-use-effect-error-patterns.md) | All errors | Class-based errors instead of Data.TaggedError |

## Medium Priority Issues (P2)

| Review | Module | Issue |
|--------|--------|-------|
| [078](078-use-effect-layer-patterns.md) | All layers | Inconsistent layer composition |
| [081](081-use-effect-config-patterns.md) | Config | Plain objects instead of Config |
| [082](082-use-effect-duration-consistently.md) | All | Raw milliseconds instead of Duration |
| [083](083-use-effect-tracing.md) | All | No tracing/observability |

## Anti-Pattern Summary

### 1. Effect.runSync/runPromise Inside Effects

**Where**: BatchScheduler, WebSocketTransport, BlockStream

```typescript
// ❌ Bad: Escapes Effect runtime
ws.onmessage = (event) => {
  Effect.runSync(handleMessage(event));
};

// ✅ Good: Use Runtime.runFork
const runtime = yield* Effect.runtime<never>();
const runFork = Runtime.runFork(runtime);
ws.onmessage = (event) => runFork(handleMessage(event));
```

### 2. Mutable State Outside Ref

**Where**: NonceManager, FallbackTransport, BatchScheduler

```typescript
// ❌ Bad: Mutable shared state
const deltaMap = new Map<string, number>();

// ✅ Good: Use Ref or SynchronizedRef
const deltaMapRef = yield* SynchronizedRef.make(HashMap.empty<string, number>());
```

### 3. setTimeout/setInterval

**Where**: WebSocketTransport, BatchScheduler

```typescript
// ❌ Bad: Not interruptible
setTimeout(() => reconnect(), delay);

// ✅ Good: Use Effect.schedule or Effect.sleep
yield* reconnect.pipe(
  Effect.delay(Duration.millis(delay)),
  Effect.fork,
);
```

### 4. AsyncGenerator Wrappers

**Where**: BlockStream, Provider.watchBlocks

```typescript
// ❌ Bad: Loses Effect Stream semantics
Stream.fromAsyncIterable(asyncGenerator);

// ✅ Good: Build native Effect Stream
Stream.repeatEffectChunk(pollBlock);
```

## Recommended Effect Libraries

1. **@effect/schema** - Type definitions with validation
2. **@effect/platform** - HTTP, WebSocket, File System
3. **@effect/opentelemetry** - Tracing/metrics export
4. **effect/Request** - Automatic batching and caching

## Migration Priority

### Phase 1: Fix Critical Bugs
1. BatchScheduler → Use Effect Queue + Fiber
2. WebSocketTransport → Use Runtime.runFork
3. NonceManager → Use SynchronizedRef
4. FallbackTransport → Use Ref

### Phase 2: Improve Ergonomics
1. Add Effect Schema for types
2. Add Request/Resolver for Provider
3. Add Layer presets
4. Standardize error patterns

### Phase 3: Add Observability
1. Add tracing spans
2. Add metrics
3. Add structured logging
4. Add Config support

## Good Patterns Found

The codebase does use several idiomatic patterns correctly:

- ✅ `Layer.effect` for service construction
- ✅ `Effect.gen` for sequencing
- ✅ `Effect.retry` with Schedule
- ✅ `Deferred` for async coordination
- ✅ `Effect.acquireRelease` for resource management
- ✅ Proper error mapping with `Effect.mapError`
- ✅ `Effect.addFinalizer` for cleanup

## Files Requiring Updates

Based on the grep for `Effect.runSync|Effect.runPromise` (excluding tests):

1. `services/Transport/BatchScheduler.ts` - Heavy use
2. `services/Transport/WebSocketTransport.ts` - In callbacks
3. `services/Provider/Provider.ts` - In watchBlocks
4. `services/BlockStream/BlockStream.ts` - In stream creation

## Conclusion

The library is functional but not fully leveraging Effect's capabilities. The critical issues around mutable state and Effect.run* usage can cause subtle bugs in concurrent scenarios. Addressing these will make the library more robust and more "Effect-like".
