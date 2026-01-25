# Use Effect Schema for Type Definitions

<issue>
<metadata>
<id>076</id>
<priority>P2</priority>
<category>Effect Idiomatic</category>
<module>All primitives and types</module>
<files>
  - primitives/**/types.ts
  - services/**/types.ts
</files>
</metadata>

<problem>
The codebase defines branded types and validation manually instead of using Effect Schema:

```typescript
// ❌ Current approach - scattered type definitions
interface HttpTransportConfig {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  batch?: BatchOptions;
}

// ❌ Manual validation
const config =
  typeof options === "string"
    ? { url: options, timeout: 30000, retries: 3, retryDelay: 1000 }
    : { ... };

// ❌ Manual branded type
type AddressType = Uint8Array & { readonly __tag: "Address" };
```

**Issues:**
1. **Manual validation** - Repeated null checks, type assertions
2. **No schema** - Can't generate validators, serializers, or docs
3. **Runtime/compile mismatch** - Types don't guarantee runtime safety
4. **Duplicate work** - Same structure defined in types and validation
</problem>

<effect_pattern>
<name>@effect/schema for Declarative Types</name>
<rationale>
Effect Schema provides:
- Single source of truth for types and validation
- Compile-time types derived from schema
- Runtime validation with structured errors
- Encoding/decoding for serialization
- Composable schema transformations
</rationale>
<before>
```typescript
// ❌ Manual types + validation
interface Config {
  url: string;
  timeout?: number;
}

function validate(input: unknown): Config {
  if (typeof input !== "object" || input === null) throw new Error("Invalid");
  if (typeof (input as any).url !== "string") throw new Error("Invalid url");
  return input as Config;
}
```
</before>
<after>
```typescript
// ✅ Schema-first approach
import * as Schema from "@effect/schema/Schema";

const ConfigSchema = Schema.Struct({
  url: Schema.String.pipe(Schema.pattern(/^https?:\/\//)),
  timeout: Schema.optional(Schema.Number).pipe(
    Schema.withDefault(() => 30000)
  ),
});

type Config = Schema.Schema.Type<typeof ConfigSchema>;

// Validation returns Effect
const validate = Schema.decodeUnknown(ConfigSchema);
// Effect.Effect<Config, ParseError>
```
</after>
<effect_docs>https://effect.website/docs/schema/introduction</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Schema Brands for Nominal Types</name>
<rationale>
Use `Schema.brand` for branded/nominal types:
- Runtime validation ensures invariants
- Compile-time brand prevents mixing types
- Works with existing Effect patterns
</rationale>
<before>
```typescript
// ❌ Manual branding
type Address = Uint8Array & { readonly __tag: "Address" };

function from(bytes: Uint8Array): Address {
  if (bytes.length !== 20) throw new Error("Invalid");
  return bytes as Address;
}
```
</before>
<after>
```typescript
// ✅ Schema with brand
const AddressSchema = Schema.Uint8ArrayFromSelf.pipe(
  Schema.filter((bytes) => bytes.length === 20, {
    message: () => "Address must be 20 bytes",
  }),
  Schema.brand("Address"),
);

type Address = Schema.Schema.Type<typeof AddressSchema>;

// Validation returns Effect with proper error
const from = Schema.decodeUnknown(AddressSchema);
```
</after>
<effect_docs>https://effect.website/docs/schema/branded-types</effect_docs>
</effect_pattern>

<effect_pattern>
<name>Schema.optional with Defaults</name>
<rationale>
Use `Schema.optional` with `Schema.withDefault` for optional fields with defaults:
- Defaults applied during decoding
- Type reflects presence of default
- No manual `?? defaultValue` needed
</rationale>
<before>
```typescript
// ❌ Manual defaults
interface Config {
  timeout?: number;
}
const timeout = config.timeout ?? 30000;
```
</before>
<after>
```typescript
// ✅ Schema with default
const ConfigSchema = Schema.Struct({
  timeout: Schema.optional(Schema.Number).pipe(
    Schema.withDefault(() => 30000)
  ),
});

// Type is { timeout: number } (not optional!)
type Config = Schema.Schema.Type<typeof ConfigSchema>;
```
</after>
<effect_docs>https://effect.website/docs/schema/optional</effect_docs>
</effect_pattern>

<solution>
Use `@effect/schema` for declarative type definitions:

```typescript
import * as Schema from "@effect/schema/Schema";
import * as Effect from "effect/Effect";

// ============================================
// Config Schemas
// ============================================

const BatchOptionsSchema = Schema.Struct({
  batchSize: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.positive())
  ),
  wait: Schema.optional(
    Schema.Number.pipe(Schema.int(), Schema.nonNegative())
  ),
});

const HttpTransportConfigSchema = Schema.Struct({
  url: Schema.String.pipe(
    Schema.pattern(/^https?:\/\//, {
      message: () => "URL must start with http:// or https://",
    })
  ),
  headers: Schema.optional(
    Schema.Record({ key: Schema.String, value: Schema.String })
  ),
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

// URL shorthand support via union
const HttpTransportOptionsSchema = Schema.Union(
  Schema.String.pipe(Schema.pattern(/^https?:\/\//)),
  HttpTransportConfigSchema,
);

// Use in transport
export const HttpTransport = (
  options: Schema.Schema.Type<typeof HttpTransportOptionsSchema>,
): Layer.Layer<TransportService, TransportError> =>
  Layer.effect(
    TransportService,
    Effect.gen(function* () {
      const rawConfig = yield* Schema.decodeUnknown(HttpTransportOptionsSchema)(options).pipe(
        Effect.mapError((e) => new TransportError({
          code: -32603,
          message: `Invalid config: ${e.message}`,
        })),
      );
      
      const config = typeof rawConfig === "string"
        ? { url: rawConfig, timeout: 30000, retries: 3, retryDelay: 1000 }
        : rawConfig;

      // ... rest of implementation
    }),
  );

// ============================================
// Primitive Schemas (Address, Hex, etc.)
// ============================================

// primitives/Address/AddressSchema.ts
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

export type AddressType = Schema.Schema.Type<typeof AddressBytesSchema>;
export type AddressHex = Schema.Schema.Type<typeof AddressHexSchema>;
export type AddressInput = Schema.Schema.Type<typeof AddressInputSchema>;

// primitives/Address/from.ts
export const from = (input: AddressInput) =>
  Schema.decodeUnknown(AddressBytesSchema)(
    typeof input === "string" ? hexToBytes(input) : input,
  );

// ============================================
// JSON-RPC Schemas
// ============================================

const JsonRpcErrorSchema = Schema.Struct({
  code: Schema.Number,
  message: Schema.String,
  data: Schema.optional(Schema.Unknown),
});

const JsonRpcResponseSchema = <T>(resultSchema: Schema.Schema<T>) =>
  Schema.Struct({
    jsonrpc: Schema.Literal("2.0"),
    id: Schema.Union(Schema.Number, Schema.String),
    result: Schema.optional(resultSchema),
    error: Schema.optional(JsonRpcErrorSchema),
  });

// Parse response with typed result
const parseBlockNumberResponse = Schema.decodeUnknown(
  JsonRpcResponseSchema(
    Schema.String.pipe(Schema.pattern(/^0x[0-9a-fA-F]+$/))
  )
);

// ============================================
// Transaction Schemas
// ============================================

const TransactionRequestSchema = Schema.Struct({
  from: Schema.optional(AddressHexSchema),
  to: Schema.optional(AddressHexSchema),
  value: Schema.optional(Schema.BigIntFromSelf),
  data: Schema.optional(Schema.String.pipe(Schema.pattern(/^0x/))),
  nonce: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.nonNegative())),
  gas: Schema.optional(Schema.BigIntFromSelf),
  gasPrice: Schema.optional(Schema.BigIntFromSelf),
  maxFeePerGas: Schema.optional(Schema.BigIntFromSelf),
  maxPriorityFeePerGas: Schema.optional(Schema.BigIntFromSelf),
  chainId: Schema.optional(Schema.Number.pipe(Schema.int(), Schema.positive())),
});

export type TransactionRequest = Schema.Schema.Type<typeof TransactionRequestSchema>;
```
</solution>

<implementation>
<steps>
1. Create schemas in `primitives/*/Schema.ts` files
2. Derive types from schemas: `type T = Schema.Schema.Type<typeof TSchema>`
3. Replace manual validation with `Schema.decodeUnknown`
4. Use `Schema.encode` for serialization
5. Add `Schema.brand` for nominal types
6. Use `Schema.optional` with `Schema.withDefault` for defaults
</steps>
<imports>
```typescript
import * as Schema from "@effect/schema/Schema";
import * as Effect from "effect/Effect";
```
</imports>
</implementation>

<tests>
```typescript
import { Effect, Exit } from "effect";
import * as Schema from "@effect/schema/Schema";
import { describe, it, expect } from "vitest";

describe("HttpTransportConfigSchema", () => {
  it("decodes valid config", async () => {
    const result = await Effect.runPromise(
      Schema.decodeUnknown(HttpTransportConfigSchema)({
        url: "https://eth.llamarpc.com",
        timeout: 5000,
      })
    );

    expect(result.url).toBe("https://eth.llamarpc.com");
    expect(result.timeout).toBe(5000);
    expect(result.retries).toBe(3); // Default applied
  });

  it("applies defaults", async () => {
    const result = await Effect.runPromise(
      Schema.decodeUnknown(HttpTransportConfigSchema)({
        url: "https://example.com",
      })
    );

    expect(result.timeout).toBe(30000);
    expect(result.retries).toBe(3);
    expect(result.retryDelay).toBe(1000);
  });

  it("rejects invalid URL", async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(HttpTransportConfigSchema)({
        url: "not-a-url",
      })
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });

  it("rejects negative timeout", async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(HttpTransportConfigSchema)({
        url: "https://example.com",
        timeout: -1,
      })
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe("AddressBytesSchema", () => {
  it("accepts valid 20-byte address", async () => {
    const bytes = new Uint8Array(20).fill(0x12);
    const result = await Effect.runPromise(
      Schema.decodeUnknown(AddressBytesSchema)(bytes)
    );

    expect(result).toEqual(bytes);
  });

  it("rejects wrong length", async () => {
    const bytes = new Uint8Array(19).fill(0x12);
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(AddressBytesSchema)(bytes)
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });
});

describe("AddressHexSchema", () => {
  it("accepts valid checksummed address", async () => {
    const result = await Effect.runPromise(
      Schema.decodeUnknown(AddressHexSchema)(
        "0x1234567890123456789012345678901234567890"
      )
    );

    expect(result).toBe("0x1234567890123456789012345678901234567890");
  });

  it("rejects invalid hex", async () => {
    const exit = await Effect.runPromiseExit(
      Schema.decodeUnknown(AddressHexSchema)("0x123") // Too short
    );

    expect(Exit.isFailure(exit)).toBe(true);
  });
});
```
</tests>

<api>
<before>
```typescript
// ❌ Manual types and validation
interface Config { url: string; timeout?: number; }
const timeout = config.timeout ?? 30000;
if (!url.startsWith("http")) throw new Error("Invalid");
```
</before>
<after>
```typescript
// ✅ Schema-first with Effect
const ConfigSchema = Schema.Struct({
  url: Schema.String.pipe(Schema.pattern(/^https?:\/\//)),
  timeout: Schema.optional(Schema.Number).pipe(
    Schema.withDefault(() => 30000)
  ),
});

type Config = Schema.Schema.Type<typeof ConfigSchema>;
const decode = Schema.decodeUnknown(ConfigSchema);
// decode(input) returns Effect<Config, ParseError>
```
</after>
</api>

<acceptance_criteria>
- [ ] Create Schema files for Address, Hex, Bytes32, etc.
- [ ] Create Schema for transport configs
- [ ] Create Schema for JSON-RPC types
- [ ] Derive types from schemas
- [ ] Replace manual validation with Schema.decodeUnknown
- [ ] Add brands for nominal types
- [ ] Use Schema.optional with defaults
- [ ] All tests pass
</acceptance_criteria>

<references>
- [Effect Schema Introduction](https://effect.website/docs/schema/introduction)
- [Schema Branded Types](https://effect.website/docs/schema/branded-types)
- [Schema Optional Fields](https://effect.website/docs/schema/optional)
- [Schema to/from JSON](https://effect.website/docs/schema/encoding)
- [Schema API Reference](https://effect-ts.github.io/effect/schema/Schema.ts.html)
</references>
</issue>
