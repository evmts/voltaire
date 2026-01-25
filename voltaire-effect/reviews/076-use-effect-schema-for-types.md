# Use Effect Schema for Type Definitions

**Priority**: Medium  
**Module**: All primitives and types  
**Category**: Effect Idiomatic

## Problem

The codebase defines branded types and validation manually instead of using Effect Schema:

```typescript
// Current approach - scattered type definitions
interface HttpTransportConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  batch?: BatchOptions;
}

// Manual validation
const config =
  typeof options === "string"
    ? { url: options, timeout: 30000, retries: 3, retryDelay: 1000 }
    : { ... };
```

## Issues

1. **Manual validation** - Repeated null checks, type assertions
2. **No schema** - Can't generate validators, serializers, or docs
3. **Runtime/compile mismatch** - Types don't guarantee runtime safety
4. **Duplicate work** - Same structure defined in types and validation

## Solution

Use `@effect/schema` for declarative type definitions:

```typescript
import * as Schema from "@effect/schema/Schema";
import * as Brand from "effect/Brand";

// Define config schema
const BatchOptionsSchema = Schema.Struct({
  batchSize: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
  wait: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
});

const HttpTransportConfigSchema = Schema.Struct({
  url: Schema.String.pipe(Schema.pattern(/^https?:\/\//)),
  headers: Schema.optional(Schema.Record(Schema.String, Schema.String)),
  timeout: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.positive())
  ).pipe(Schema.withDefault(() => 30000)),
  retries: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.nonNegative())
  ).pipe(Schema.withDefault(() => 3)),
  retryDelay: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.positive())
  ).pipe(Schema.withDefault(() => 1000)),
  batch: Schema.optional(BatchOptionsSchema),
});

type HttpTransportConfig = Schema.Schema.Type<typeof HttpTransportConfigSchema>;

// URL shorthand support
const HttpTransportOptionsSchema = Schema.Union(
  Schema.String.pipe(Schema.pattern(/^https?:\/\//)),
  HttpTransportConfigSchema,
);

// Use in transport
export const HttpTransport = (
  options: Schema.Schema.Type<typeof HttpTransportOptionsSchema>,
): Layer.Layer<TransportService> =>
  Layer.effect(
    TransportService,
    Effect.gen(function* () {
      const config = yield* Schema.decodeUnknown(HttpTransportOptionsSchema)(options).pipe(
        Effect.map((o) =>
          typeof o === "string"
            ? { url: o, timeout: 30000, retries: 3, retryDelay: 1000 }
            : o,
        ),
        Effect.mapError((e) => new TransportError({
          code: -32603,
          message: `Invalid config: ${e.message}`,
        })),
      );
      // ...
    }),
  );
```

## Branded Types with Schema

Replace manual branding with Schema-based brands:

```typescript
// Current
type AddressType = Uint8Array & { readonly __tag: "Address" };

// With Effect Schema
const AddressSchema = Schema.Uint8ArrayFromSelf.pipe(
  Schema.filter((bytes) => bytes.length === 20, {
    message: () => "Address must be 20 bytes",
  }),
  Schema.brand("Address"),
);

type AddressType = Schema.Schema.Type<typeof AddressSchema>;

// Validation is automatic
const parseAddress = Schema.decodeUnknown(AddressSchema);
// Effect.Effect<AddressType, ParseError>
```

## JSON-RPC Types with Schema

```typescript
const JsonRpcResponseSchema = <T>(resultSchema: Schema.Schema<T>) =>
  Schema.Struct({
    jsonrpc: Schema.Literal("2.0"),
    id: Schema.Union(Schema.Number, Schema.String),
    result: Schema.optional(resultSchema),
    error: Schema.optional(
      Schema.Struct({
        code: Schema.Number,
        message: Schema.String,
        data: Schema.optional(Schema.Unknown),
      }),
    ),
  });

// Parse response
const parseBlockNumber = Schema.decodeUnknown(
  JsonRpcResponseSchema(Schema.String.pipe(Schema.pattern(/^0x[0-9a-fA-F]+$/)))
);
```

## Benefits

1. **Single source of truth** - Types and validation unified
2. **Effect integration** - Schema.decode returns Effect
3. **Automatic serialization** - Schema.encode for JSON-RPC
4. **Documentation** - Schema generates OpenAPI-compatible docs
5. **Composable** - Schemas compose with pipe/extend
6. **Error messages** - Structured parse errors

## Migration Path

1. Create schemas in `primitives/*/schema.ts`
2. Derive types from schemas: `type T = Schema.Schema.Type<typeof TSchema>`
3. Replace manual validation with `Schema.decodeUnknown`
4. Use `Schema.encode` for serialization

## Example: Full Primitive Module

```typescript
// primitives/Address/AddressSchema.ts
import * as Schema from "@effect/schema/Schema";

export const AddressBytesSchema = Schema.Uint8ArrayFromSelf.pipe(
  Schema.filter((bytes) => bytes.length === 20, {
    message: () => "Address must be 20 bytes",
  }),
  Schema.brand("Address"),
);

export const AddressHexSchema = Schema.String.pipe(
  Schema.pattern(/^0x[0-9a-fA-F]{40}$/),
  Schema.brand("AddressHex"),
);

export const AddressInputSchema = Schema.Union(
  AddressBytesSchema,
  AddressHexSchema,
);

// primitives/Address/from.ts
import * as Schema from "@effect/schema/Schema";
import { AddressBytesSchema, AddressInputSchema } from "./AddressSchema.js";

export const from = (input: Schema.Schema.Type<typeof AddressInputSchema>) =>
  Schema.decodeUnknown(AddressBytesSchema)(
    typeof input === "string" ? hexToBytes(input) : input,
  );
```

## References

- [Effect Schema Docs](https://effect.website/docs/schema/introduction)
- [Schema Brands](https://effect.website/docs/schema/branded-types)
- [Schema to/from JSON](https://effect.website/docs/schema/encoding)
