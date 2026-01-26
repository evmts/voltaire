# Use Idiomatic Effect Error Patterns

**Priority**: Medium  
**Module**: All error definitions  
**Category**: Effect Idiomatic
**Updated**: 2026-01-26  
**Status**: Mixed adoption (many services migrated; core service errors still extend AbstractError)

## Current State (2026-01-26)

**Already using `Data.TaggedError`**:
- `NonceError` (`services/NonceManager`)
- `SerializeError` / `DeserializeError` (`services/TransactionSerializer`)
- `StandardsError` (`standards/errors`)
- `KzgError`, `Bn254Error`, `Secp256k1Error` (crypto/services)
- `FormatError`, `FeeEstimationError`, `RateLimitError`, `AbiEncodeError`, `AbiDecodeError`
- HDWallet typed errors (`crypto/HDWallet/errors.ts`)

**Still extending `AbstractError` (or `Error`)**:
- `TransportError`, `ProviderError`, `SignerError`, `AccountError`
- `BlockError`, `BlockStreamError`, `EventStreamError`, `TransactionStreamError`
- ABI parse errors (`AbiParseError`, `AbiItemParseError`)
- JSON-RPC parse/response errors (`jsonrpc/errors.ts`)

**Implication**: error modeling is inconsistent across modules, so downstream consumers can't rely on consistent `Match.tag` semantics or structural equality across the library.

## Problem

Errors are defined as classes extending Error instead of using Effect's `Data.TaggedError`:

```typescript
// Current: Traditional class-based errors
export class TransportError extends Error {
  readonly _tag = "TransportError";
  readonly code: number;
  readonly data?: unknown;

  constructor(
    options: { code: number; message: string; data?: unknown },
    cause?: string,
  ) {
    super(cause ?? options.message);
    this.name = "TransportError";
    this.code = options.code;
    this.data = options.data;
  }
}
```

## Issues

1. **No equality** - Can't compare errors by value
2. **No pattern matching** - Must use instanceof or _tag checks
3. **Manual construction** - Boilerplate in constructor
4. **Not serializable** - Can't encode/decode for logging
5. **Mutable** - Properties can be modified

## Solution

Use `Data.TaggedError` for idiomatic Effect errors:

```typescript
import * as Data from "effect/Data";
import * as Match from "effect/Match";

// Define error with Data.TaggedError
export class TransportError extends Data.TaggedError("TransportError")<{
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}> {}

// Automatically gets:
// - readonly _tag: "TransportError"
// - Structural equality
// - Proper instanceof
// - Immutability
```

## Pattern Matching with Match

```typescript
import * as Match from "effect/Match";

const handleError = Match.type<TransportError | ProviderError | SignerError>().pipe(
  Match.tag("TransportError", (e) => 
    Effect.log(`Transport failed: ${e.message} (code: ${e.code})`),
  ),
  Match.tag("ProviderError", (e) =>
    Effect.log(`Provider failed: ${e.message}`),
  ),
  Match.tag("SignerError", (e) =>
    Effect.log(`Signer failed: ${e.message}`),
  ),
  Match.exhaustive,
);

// Usage
program.pipe(
  Effect.catchAll((error) => handleError(error)),
);
```

## Error Hierarchies

Create error hierarchies with union types:

```typescript
// Base errors
export class NetworkError extends Data.TaggedError("NetworkError")<{
  readonly url: string;
  readonly statusCode?: number;
}> {}

export class TimeoutError extends Data.TaggedError("TimeoutError")<{
  readonly durationMs: number;
}> {}

export class JsonRpcError extends Data.TaggedError("JsonRpcError")<{
  readonly code: number;
  readonly message: string;
  readonly data?: unknown;
}> {}

// Union type
export type TransportError = NetworkError | TimeoutError | JsonRpcError;

// Discriminated union works with Match
const handleTransportError = Match.type<TransportError>().pipe(
  Match.tag("NetworkError", (e) => `Network error to ${e.url}`),
  Match.tag("TimeoutError", (e) => `Timeout after ${e.durationMs}ms`),
  Match.tag("JsonRpcError", (e) => `RPC error ${e.code}: ${e.message}`),
  Match.exhaustive,
);
```

## Error Context with Cause

```typescript
import * as Cause from "effect/Cause";

export class ProviderError extends Data.TaggedError("ProviderError")<{
  readonly method: string;
  readonly params?: unknown[];
  readonly message: string;
}> {}

// Preserve cause chain
const wrapError = <A, E, R>(
  effect: Effect.Effect<A, E, R>,
  method: string,
  params?: unknown[],
) =>
  effect.pipe(
    Effect.mapError((e) =>
      new ProviderError({
        method,
        params,
        message: e instanceof Error ? e.message : String(e),
      }),
    ),
    Effect.withSpan(`provider.${method}`),
  );
```

## Defects vs Errors

Use Effect's distinction between expected errors and defects:

```typescript
// Expected errors - part of the type signature
const getBalance = (address: string): Effect.Effect<bigint, ProviderError> =>
  // ...

// Defects - unexpected failures (bugs)
const parseHex = (hex: string): bigint => {
  // If this throws, it's a defect (Effect.die)
  if (!hex.startsWith("0x")) {
    throw new Error("Invalid hex"); // Becomes Cause.Die
  }
  return BigInt(hex);
};

// Catch defects explicitly when needed
program.pipe(
  Effect.catchAllDefect((defect) =>
    Effect.logError("Unexpected error", defect).pipe(
      Effect.zipRight(Effect.fail(new UnexpectedError({ defect }))),
    ),
  ),
);
```

## Schema-Based Errors

Combine with Schema for serializable errors:

```typescript
import * as Schema from "@effect/schema/Schema";

const TransportErrorSchema = Schema.Struct({
  _tag: Schema.Literal("TransportError"),
  code: Schema.Number,
  message: Schema.String,
  data: Schema.optional(Schema.Unknown),
});

// Encode for logging/telemetry
const encodeError = Schema.encodeSync(TransportErrorSchema);

// Log structured error
Effect.catchTag("TransportError", (e) =>
  Effect.logError("Transport error", encodeError(e)),
);
```

## Benefits

1. **Structural equality** - Compare errors by value
2. **Pattern matching** - Exhaustive Match.type
3. **Immutable** - No accidental mutation
4. **Serializable** - Easy to log and transmit
5. **Type-safe** - Discriminated unions
6. **Less boilerplate** - No manual constructor

## Migration Path

1. Replace `class X extends Error` with `class X extends Data.TaggedError("X")`
2. Move constructor args to type parameter
3. Update error creation: `new Error("msg")` → `new Error({ message: "msg" })`
4. Replace `instanceof` checks with `Match.tag`

## References

- [Effect Data.TaggedError](https://effect.website/docs/guides/error-management/expected-errors#taggederror)
- [Effect Match](https://effect.website/docs/guides/pattern-matching)
- [Effect Cause](https://effect.website/docs/guides/error-management/error-channel)
