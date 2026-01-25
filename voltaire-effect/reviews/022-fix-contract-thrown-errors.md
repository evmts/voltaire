# Fix Contract.ts Thrown Errors Becoming Defects

<issue>
<metadata>
priority: P0
status: COMPLETED
files: [src/services/Contract/Contract.ts]
reviews: [022]
</metadata>

<problem>
Helper functions in Contract.ts originally used `throw new Error(...)` which bypassed the typed error channel and surfaced as defects:

```typescript
// Anti-pattern: throws become untyped defects
function decodeResult(abi: readonly AbiItem[], functionName: string, data: HexType): unknown {
  const fn = abi.find(...);
  if (!fn) throw new Error(`Function ${functionName} not found`);  // DEFECT!
  // ...
}

function getEventTopic(abi: readonly AbiItem[], eventName: string): string {
  const event = abi.find(...);
  if (!event) throw new Error(`Event ${eventName} not found`);  // DEFECT!
  // ...
}
```

Issues:
- Errors bypass typed error channel (`ContractCallError`, `ContractEventError`)
- Users can't catch with `Effect.catchTag("ContractCallError", ...)`
- Defects should be reserved for truly unexpected conditions (bugs)
- Breaks Effect's "errors are values" principle
</problem>

<solution>
Convert helpers to return `Effect<A, E>` with domain errors using `Effect.try`:

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
      return Hash.toHex(BrandedAbi.Event.getSelector(event));
    },
    catch: (e) => new ContractEventError(
      { address, event: eventName },
      e instanceof Error ? e.message : "Event lookup error",
      { cause: e instanceof Error ? e : undefined }
    )
  });
```
</solution>

<implementation>
<steps>
1. [DONE] src/services/Contract/Contract.ts:89-116 - Created `decodeResultE` returning `Effect<unknown, ContractCallError>`
2. [DONE] src/services/Contract/Contract.ts:125-145 - Created `getEventTopicE` returning `Effect<string, ContractEventError>`
3. [DONE] src/services/Contract/Contract.ts:155-175 - Created `decodeEventLogE` returning `Effect<DecodedEvent, ContractEventError>`
4. [DONE] Updated all call sites to use Effect versions with `yield*`
</steps>

<patterns>
- `Effect.try({ try, catch })` - Wrap throwing code with typed error conversion
- `Effect.flatMap` - Chain Effect operations
- Domain-specific error types with context for debugging
</patterns>
</implementation>

<tests>
```typescript
// Test error is catchable with Effect.catchTag
it("should produce catchable ContractCallError for missing function", async () => {
  const program = Effect.gen(function* () {
    const contract = yield* ContractService;
    return yield* contract.call({
      address: "0x...",
      functionName: "nonExistentFunction",
      args: []
    });
  }).pipe(
    Effect.catchTag("ContractCallError", (e) => 
      Effect.succeed({ caught: true, message: e.message })
    ),
    Effect.provide(/* layers */)
  );
  
  const result = await Effect.runPromise(program);
  expect(result.caught).toBe(true);
});

// Test event lookup error is typed
it("should produce catchable ContractEventError for missing event", async () => {
  const program = Effect.gen(function* () {
    const contract = yield* ContractService;
    return yield* contract.getEventTopic("NonExistentEvent");
  }).pipe(
    Effect.catchTag("ContractEventError", (e) =>
      Effect.succeed({ caught: true, event: e.context.event })
    ),
    Effect.provide(/* layers */)
  );
  
  const result = await Effect.runPromise(program);
  expect(result.caught).toBe(true);
  expect(result.event).toBe("NonExistentEvent");
});
```
</tests>

<docs>
```typescript
/**
 * Decodes the result of a contract call.
 * @param abi - The contract ABI
 * @param functionName - The function that was called
 * @param data - The raw return data
 * @param context - Context for error reporting
 * @returns Effect that resolves to decoded result (single value or tuple)
 * @throws ContractCallError - If function not found or decode fails
 */
```
</docs>

<api>
<before>
```typescript
// Throws untyped errors (defects)
function decodeResult(abi, functionName, data): unknown
function getEventTopic(abi, eventName): string
function decodeEventLog(abi, eventName, log): DecodedEvent
```
</before>
<after>
```typescript
// Returns typed Effect errors
const decodeResultE: (abi, functionName, data, context) => Effect<unknown, ContractCallError>
const getEventTopicE: (abi, eventName, address) => Effect<string, ContractEventError>
const decodeEventLogE: (abi, eventName, log, address) => Effect<DecodedEvent, ContractEventError>
```
</after>
</api>

<references>
- [Effect.try documentation](https://effect.website/docs/guides/error-management/expected-errors#effecttry)
- [Effect error handling best practices](https://effect.website/docs/guides/error-management/)
- [src/services/Contract/Contract.ts#L89-L175](file:///Users/williamcory/voltaire/voltaire-effect/src/services/Contract/Contract.ts#L89-L175)
</references>
</issue>
