# Fix Signer.ts String Message Based Retry

## Problem

`waitForCallsStatus` retries based on matching error message string instead of using tagged errors properly.

**Location**: `src/services/Signer/Signer.ts#L433-L461`

```typescript
// Current: string-based error matching
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

## Why This Matters

- String matching is fragile (typos, message changes)
- Not using Effect's tagged error pattern
- Harder to refactor error messages

## Solution

Use error code or a discriminated union:

```typescript
// Option 1: Use error code (consistent with Provider)
const INTERNAL_CODE_BUNDLE_PENDING = -40003;

return getStatus.pipe(
  Effect.flatMap((status) =>
    status.status === "PENDING"
      ? Effect.fail(new SignerError(
          { bundleId },
          "Bundle still pending",
          { code: INTERNAL_CODE_BUNDLE_PENDING }
        ))
      : Effect.succeed(status),
  ),
  Effect.retry(
    Schedule.spaced(Duration.millis(interval)).pipe(
      Schedule.intersect(Schedule.recurUpTo(Duration.millis(timeout))),
      Schedule.whileInput((e: SignerError) => e.code === INTERNAL_CODE_BUNDLE_PENDING)
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
```

Or:

```typescript
// Option 2: Tagged error class
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

## Acceptance Criteria

- [ ] Remove string-based error matching
- [ ] Use error code or tagged error class
- [ ] Update retry logic to use code/tag matching
- [ ] All existing tests pass

## Priority

**Minor** - Code quality improvement
