# Fix Signer.ts String Message Based Retry

<issue>
<metadata>
priority: P2
status: COMPLETED
files: [src/services/Signer/Signer.ts]
reviews: [026]
</metadata>

<problem>
`waitForCallsStatus` originally retried based on matching error message string instead of using error codes or tagged errors:

```typescript
// Anti-pattern: string-based error matching
return getStatus.pipe(
  Effect.flatMap((status) =>
    status.status === "PENDING"
      ? Effect.fail(new SignerError({ bundleId }, "Bundle still pending"))  // String!
      : Effect.succeed(status),
  ),
  // ...
  Effect.catchAll((e) => {
    if (e instanceof SignerError && e.message === "Bundle still pending") {  // String match!
      return Effect.fail(new SignerError(...));
    }
    return Effect.fail(e);
  }),
);
```

Issues:
- String matching is fragile (typos, message refactoring breaks logic)
- Not using Effect's error code/tag pattern
- Harder to refactor error messages
- Inconsistent with Provider.ts which uses `INTERNAL_CODE_PENDING`
</problem>

<solution>
Use error code for internal retry logic (consistent with Provider pattern):

```typescript
// Internal error code for bundle pending state
const INTERNAL_CODE_BUNDLE_PENDING = -40003;

waitForCallsStatus: (bundleId, options) => {
  const timeout = options?.timeout ?? 60000;
  const interval = options?.pollingInterval ?? 1000;

  const getStatus = transport
    .request<CallsStatus>("wallet_getCallsStatus", [bundleId])
    .pipe(
      Effect.mapError(
        (e) =>
          new SignerError(
            { action: "getCallsStatus", bundleId },
            `Failed to get calls status: ${e.message}`,
            { cause: e, code: e.code },
          ),
      ),
    );

  return getStatus.pipe(
    Effect.flatMap((status) =>
      status.status === "PENDING"
        ? Effect.fail(
            new SignerError({ bundleId }, "Bundle still pending", {
              code: INTERNAL_CODE_BUNDLE_PENDING,  // Use code!
            })
          )
        : Effect.succeed(status),
    ),
    Effect.retry(
      Schedule.spaced(Duration.millis(interval)).pipe(
        Schedule.intersect(Schedule.recurUpTo(Duration.millis(timeout))),
        Schedule.whileInput(
          (e: SignerError) => e.code === INTERNAL_CODE_BUNDLE_PENDING  // Match code!
        )
      )
    ),
    Effect.timeoutFail({
      duration: Duration.millis(timeout),
      onTimeout: () => new SignerError(
        { action: "waitForCallsStatus", bundleId },
        `Timeout waiting for bundle ${bundleId}`,
      ),
    })
  );
},
```
</solution>

<implementation>
<steps>
1. [DONE] Define `INTERNAL_CODE_BUNDLE_PENDING = -40003` constant
2. [DONE] src/services/Signer/Signer.ts:554 - Use code in error: `{ code: INTERNAL_CODE_BUNDLE_PENDING }`
3. [DONE] src/services/Signer/Signer.ts:565-567 - Use `Schedule.whileInput` matching code
4. [DONE] Remove string-based `Effect.catchAll` matching
5. [DONE] Add `Effect.timeoutFail` for clean timeout handling
</steps>

<patterns>
- **Error codes for internal state machine** - Use numeric codes for retry logic
- **Tagged errors for public API** - Use `Data.TaggedError` for user-catchable errors
- `Schedule.whileInput(predicate)` - Conditionally retry based on error properties
- Consistent with `INTERNAL_CODE_PENDING` in Provider.ts
</patterns>

<alternative-tagged-error>
Alternative using Effect's tagged error pattern:

```typescript
import { Data } from "effect";

// Internal tagged error (not exposed in public API)
class BundlePendingError extends Data.TaggedError("BundlePendingError")<{
  readonly bundleId: string;
}> {}

return getStatus.pipe(
  Effect.flatMap((status) =>
    status.status === "PENDING"
      ? Effect.fail(new BundlePendingError({ bundleId }))
      : Effect.succeed(status),
  ),
  Effect.retry({
    schedule: Schedule.spaced(Duration.millis(interval)),
    while: (e) => e._tag === "BundlePendingError",
    times: Math.ceil(timeout / interval),
  }),
  Effect.catchTag("BundlePendingError", () =>
    Effect.fail(new SignerError(
      { action: "waitForCallsStatus", bundleId },
      `Timeout waiting for bundle ${bundleId}`,
    ))
  ),
);
```

This approach is more type-safe but requires defining an additional error class.
</alternative-tagged-error>
</implementation>

<tests>
```typescript
describe("waitForCallsStatus retry logic", () => {
  it("should retry while bundle is pending", async () => {
    let callCount = 0;
    const mockTransport = {
      request: (method: string) => {
        if (method === "wallet_getCallsStatus") {
          callCount++;
          if (callCount < 3) {
            return Effect.succeed({ status: "PENDING" });
          }
          return Effect.succeed({ 
            status: "CONFIRMED",
            receipts: [{ transactionHash: "0x123" }]
          });
        }
        return Effect.succeed({});
      },
    };
    
    const program = Effect.gen(function* () {
      const signer = yield* SignerService;
      return yield* signer.waitForCallsStatus("0xbundle123", {
        pollingInterval: 10,
        timeout: 5000,
      });
    }).pipe(Effect.provide(mockTransport));
    
    const result = await Effect.runPromise(program);
    expect(callCount).toBe(3);
    expect(result.status).toBe("CONFIRMED");
  });

  it("should timeout if bundle never confirms", async () => {
    const mockTransport = {
      request: () => Effect.succeed({ status: "PENDING" }),
    };
    
    const program = Effect.gen(function* () {
      const signer = yield* SignerService;
      return yield* signer.waitForCallsStatus("0xbundle123", {
        pollingInterval: 100,
        timeout: 500,
      });
    }).pipe(Effect.provide(mockTransport));
    
    const exit = await Effect.runPromiseExit(program);
    expect(Exit.isFailure(exit)).toBe(true);
    // Error message contains "Timeout"
  });

  it("should immediately fail on non-pending errors", async () => {
    const mockTransport = {
      request: () => Effect.fail(new Error("RPC error")),
    };
    
    const program = Effect.gen(function* () {
      const signer = yield* SignerService;
      return yield* signer.waitForCallsStatus("0xbundle123");
    }).pipe(Effect.provide(mockTransport));
    
    const exit = await Effect.runPromiseExit(program);
    expect(Exit.isFailure(exit)).toBe(true);
    // Should fail immediately, not retry
  });
});
```
</tests>

<docs>
```typescript
/**
 * Wait for EIP-5792 bundle calls to reach final status.
 * 
 * @description
 * Polls `wallet_getCallsStatus` until bundle is no longer pending.
 * Uses error code matching for retry logic (not string matching).
 * 
 * @param bundleId - The bundle ID returned from sendCalls
 * @param options.timeout - Maximum wait time in ms (default: 60000)
 * @param options.pollingInterval - Time between polls in ms (default: 1000)
 * 
 * @returns Effect resolving to final CallsStatus
 * @throws SignerError on timeout or RPC failure
 */
```
</docs>

<api>
<before>
```typescript
// Fragile string matching
if (e.message === "Bundle still pending") { /* retry */ }
```
</before>
<after>
```typescript
// Robust code matching
Schedule.whileInput((e: SignerError) => e.code === INTERNAL_CODE_BUNDLE_PENDING)
```
</after>
</api>

<references>
- [Effect Schedule whileInput](https://effect.website/docs/guides/scheduling#conditional-scheduling)
- [Effect retry documentation](https://effect.website/docs/guides/error-management/retrying)
- [src/services/Signer/Signer.ts#L533-L579](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Signer/Signer.ts#L533-L579)
</references>
</issue>
