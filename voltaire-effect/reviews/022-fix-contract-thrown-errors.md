# Fix Contract.ts Thrown Errors Becoming Defects

## Problem

Helper functions in Contract.ts use `throw new Error(...)` which bypass the typed error channel and surface as defects.

**Locations**: `src/services/Contract/Contract.ts`
- `decodeResult` (line 97): `throw new Error(\`Function ${functionName} not found\`)`
- `getEventTopic` (line 117): `throw new Error(\`Event ${eventName} not found\`)`
- `decodeEventLog` (line 137): `throw new Error(\`Event ${eventName} not found\`)`

```typescript
// Current: throws become defects
function decodeResult(abi: readonly AbiItem[], functionName: string, data: HexType): unknown {
  const fn = abi.find(...);
  if (!fn) throw new Error(`Function ${functionName} not found`);  // DEFECT!
  // ...
}
```

## Why This Matters

- Errors bypass typed error channel
- Users can't catch these with `Effect.catchTag`
- Defects should be reserved for truly unexpected conditions
- Breaks Effect's "errors are values" principle

## Solution

Convert helpers to return `Effect` with domain errors:

```typescript
const decodeResultE = (
  abi: readonly AbiItem[],
  functionName: string,
  data: HexType,
  context: { address: string; args?: unknown[] }
): Effect.Effect<unknown, ContractCallError> =>
  Effect.try({
    try: () => {
      const fn = abi.find(
        (item): item is BrandedAbi.Function.FunctionType =>
          item.type === "function" && (item as any).name === functionName,
      );
      if (!fn) throw new Error(`Function ${functionName} not found in ABI`);
      
      const bytes = Hex.toBytes(data);
      const decoded = BrandedAbi.Function.decodeResult(fn, bytes);
      return fn.outputs.length === 1 ? decoded[0] : decoded;
    },
    catch: (e) => new ContractCallError(
      { address: context.address, method: functionName, args: context.args },
      e instanceof Error ? e.message : "Decode error",
      { cause: e instanceof Error ? e : undefined }
    )
  });

const getEventTopicE = (
  abi: readonly AbiItem[],
  eventName: string,
  address: string
): Effect.Effect<string, ContractEventError> =>
  Effect.try({
    try: () => {
      const event = abi.find(
        (item) => item.type === "event" && item.name === eventName,
      ) as BrandedAbi.Event.EventType | undefined;
      if (!event) throw new Error(`Event ${eventName} not found in ABI`);
      const selector = BrandedAbi.Event.getSelector(event);
      return Hash.toHex(selector);
    },
    catch: (e) => new ContractEventError(
      { address, event: eventName },
      e instanceof Error ? e.message : "Event lookup error",
      { cause: e instanceof Error ? e : undefined }
    )
  });

const decodeEventLogE = (
  abi: readonly AbiItem[],
  eventName: string,
  log: LogType,
  address: string
): Effect.Effect<DecodedEvent, ContractEventError> =>
  Effect.try({
    try: () => decodeEventLog(abi, eventName, log),
    catch: (e) => new ContractEventError(
      { address, event: eventName },
      e instanceof Error ? e.message : "Event decode error",
      { cause: e instanceof Error ? e : undefined }
    )
  });
```

Then update callers:

```typescript
// Before
return decodeResult(abiItems, fn.name, result as HexType);

// After
return yield* decodeResultE(abiItems, fn.name, result as HexType, { address: addressHex, args });
```

## Acceptance Criteria

- [ ] Convert `decodeResult` to `decodeResultE` returning Effect
- [ ] Convert `getEventTopic` to `getEventTopicE` returning Effect
- [ ] Convert `decodeEventLog` to `decodeEventLogE` returning Effect
- [ ] Update all call sites to use Effect versions
- [ ] All errors are now typed and catchable
- [ ] All existing tests pass
- [ ] Add test verifying error is catchable with `Effect.catchTag`

## Priority

**Critical** - Errors bypassing typed channel is a correctness issue
