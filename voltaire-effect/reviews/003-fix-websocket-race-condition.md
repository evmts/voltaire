# Review: Fix WebSocket Transport Race Condition

## Priority: 🟠 IMPORTANT

## Summary

The WebSocket transport has a race condition in the pending request map management due to non-atomic `Ref.get` + `Ref.set` operations.

## Problem

**File**: [WebSocketTransport.ts#L283-L288](../src/services/Transport/WebSocketTransport.ts#L283-L288)

```typescript
const pending = yield* Ref.get(pendingRef);
pending.set(id, deferred);
yield* Ref.set(pendingRef, pending);
```

### Issue:

Between `Ref.get` and `Ref.set`, another fiber could:
1. Get the same map
2. Add its own pending request
3. Set the map back

When the first fiber then sets its map, it overwrites the second fiber's entry.

## Impact

- **Lost requests** under concurrent load
- **Hung promises** waiting for responses that were overwritten
- **Difficult to debug** - only manifests under high concurrency

## Fix Required

Use atomic `Ref.update`:

```typescript
yield* Ref.update(pendingRef, (pending) => {
  const newPending = new Map(pending);
  newPending.set(id, deferred);
  return newPending;
});
```

Or use `Ref.modify` if you need the old value.

## Testing

Add concurrent request test:
```typescript
it("handles concurrent requests correctly", async () => {
  const transport = WebSocketTransport("ws://...");
  const requests = Array.from({ length: 100 }, (_, i) =>
    transport.request("eth_blockNumber", [])
  );
  const results = await Promise.all(requests);
  expect(results).toHaveLength(100);
});
```
