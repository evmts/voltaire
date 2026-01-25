# Fix Abi parseItem No Schema Validation

<issue>
<metadata>
  <priority>P2</priority>
  <category>input-validation</category>
  <complexity>medium</complexity>
  <estimated_effort>1 hour</estimated_effort>
  <files>
    - src/primitives/Abi/parseItem.ts
    - src/primitives/Abi/schemas.ts
    - src/primitives/Abi/AbiItemSchema.ts (new)
  </files>
  <related_reviews>
    - 082-abi-primitives-review.md
    - 076-use-effect-schema-for-types.md
  </related_reviews>
</metadata>

<context>
## ABI Item Structure

Ethereum ABI items follow a specific JSON structure defined by the Solidity compiler. Each item represents a function, event, error, or constructor:

```typescript
// Function ABI item
{
  type: "function",
  name: "transfer",
  inputs: [
    { name: "to", type: "address" },
    { name: "amount", type: "uint256" }
  ],
  outputs: [{ type: "bool" }],
  stateMutability: "nonpayable"
}

// Event ABI item
{
  type: "event",
  name: "Transfer",
  inputs: [
    { name: "from", type: "address", indexed: true },
    { name: "to", type: "address", indexed: true },
    { name: "value", type: "uint256", indexed: false }
  ]
}
```

## Effect Schema for Validation

Effect Schema provides compile-time AND runtime validation:
- Parses unknown data into typed structures
- Provides clear error messages on validation failure
- Enables schema composition and transformation
</context>

<problem>
`parseItem` uses `JSON.parse` without validating that the result matches the expected ABI item structure.

```typescript
// src/primitives/Abi/parseItem.ts#L57
Effect.try({
  try: () => JSON.parse(jsonString) as Item.ItemType,  // ❌ No validation!
  catch: (e) => new AbiItemParseError({ ... }),
})
```

**Impact:**
- Invalid JSON structure typed as valid ABI item
- Runtime errors when using malformed item later
- Type assertion `as Item.ItemType` bypasses safety
- Could accept arbitrary JSON like `{"foo": "bar"}` as valid ABI item
- No validation of required fields (type, name, inputs)
- No validation of field types (inputs must be array, type must be string)
</problem>

<solution>
Add Effect Schema validation after JSON.parse to ensure the parsed object matches the expected ABI item structure.

### Create ABI Item Schema

```typescript
// src/primitives/Abi/AbiItemSchema.ts
import * as Schema from "effect/Schema";

// Parameter schema (for inputs/outputs)
const AbiParameterSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  type: Schema.String,
  internalType: Schema.optional(Schema.String),
  indexed: Schema.optional(Schema.Boolean),
  components: Schema.optional(Schema.Array(Schema.suspend(() => AbiParameterSchema))),
});

// Base fields shared by all ABI items
const AbiItemBase = {
  name: Schema.optional(Schema.String),
  inputs: Schema.optional(Schema.Array(AbiParameterSchema)),
};

// Function ABI item
const AbiFunctionSchema = Schema.Struct({
  ...AbiItemBase,
  type: Schema.Literal("function"),
  outputs: Schema.optional(Schema.Array(AbiParameterSchema)),
  stateMutability: Schema.optional(
    Schema.Literal("pure", "view", "nonpayable", "payable")
  ),
  constant: Schema.optional(Schema.Boolean), // Legacy
  payable: Schema.optional(Schema.Boolean),   // Legacy
});

// Event ABI item
const AbiEventSchema = Schema.Struct({
  ...AbiItemBase,
  type: Schema.Literal("event"),
  anonymous: Schema.optional(Schema.Boolean),
});

// Error ABI item
const AbiErrorSchema = Schema.Struct({
  ...AbiItemBase,
  type: Schema.Literal("error"),
});

// Constructor ABI item
const AbiConstructorSchema = Schema.Struct({
  type: Schema.Literal("constructor"),
  inputs: Schema.optional(Schema.Array(AbiParameterSchema)),
  stateMutability: Schema.optional(Schema.Literal("nonpayable", "payable")),
  payable: Schema.optional(Schema.Boolean),
});

// Fallback/Receive ABI items
const AbiFallbackSchema = Schema.Struct({
  type: Schema.Literal("fallback"),
  stateMutability: Schema.optional(Schema.Literal("nonpayable", "payable")),
});

const AbiReceiveSchema = Schema.Struct({
  type: Schema.Literal("receive"),
  stateMutability: Schema.Literal("payable"),
});

// Union of all ABI item types
export const AbiItemSchema = Schema.Union(
  AbiFunctionSchema,
  AbiEventSchema,
  AbiErrorSchema,
  AbiConstructorSchema,
  AbiFallbackSchema,
  AbiReceiveSchema,
);

export type AbiItem = Schema.Schema.Type<typeof AbiItemSchema>;
```

### Update parseItem with Schema Validation

```typescript
// src/primitives/Abi/parseItem.ts
import { Effect } from "effect";
import * as Schema from "effect/Schema";
import { AbiItemSchema } from "./AbiItemSchema.js";
import { AbiItemParseError } from "./Errors.js";
import type { ItemType } from "./Item.js";

/**
 * Parses a JSON string into a validated ABI item.
 * 
 * Unlike plain JSON.parse, this function validates that the parsed
 * object conforms to the ABI item structure (function, event, error,
 * constructor, fallback, or receive).
 * 
 * @param jsonString - JSON string representing an ABI item
 * @returns Effect with parsed and validated ABI item
 * @throws AbiItemParseError if JSON is invalid or structure is wrong
 */
export const parseItem = (
  jsonString: string,
): Effect.Effect<ItemType, AbiItemParseError> =>
  Effect.gen(function* () {
    // Step 1: Parse JSON
    const parsed = yield* Effect.try({
      try: () => JSON.parse(jsonString),
      catch: (e) => new AbiItemParseError({
        input: jsonString,
        message: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      }),
    });
    
    // Step 2: Validate structure using Effect Schema
    const validated = yield* Schema.decodeUnknown(AbiItemSchema)(parsed).pipe(
      Effect.mapError((schemaError) => new AbiItemParseError({
        input: jsonString,
        message: `Invalid ABI item structure: ${formatSchemaError(schemaError)}`,
        cause: schemaError,
      }))
    );
    
    return validated as ItemType;
  });

/**
 * Helper to format schema errors into readable messages.
 */
const formatSchemaError = (error: Schema.ParseError): string => {
  // Extract first error message
  const issues = error.errors;
  if (issues.length === 0) return "Unknown validation error";
  
  const firstIssue = issues[0];
  if ("message" in firstIssue) return firstIssue.message;
  
  return `Validation failed at: ${JSON.stringify(firstIssue)}`;
};
```

### Alternative: Use Existing Validation

If a validation function already exists:

```typescript
import { validateAbiItem } from "./validate.js";

export const parseItem = (jsonString: string) =>
  Effect.try({
    try: () => {
      const parsed = JSON.parse(jsonString);
      validateAbiItem(parsed); // Throws if invalid
      return parsed as ItemType;
    },
    catch: (e) => new AbiItemParseError({ 
      input: jsonString, 
      message: String(e instanceof Error ? e.message : e) 
    }),
  });
```
</solution>

<implementation>
<steps>
1. Create `src/primitives/Abi/AbiItemSchema.ts` with Effect Schema definitions
2. Define schemas for all ABI item types (function, event, error, constructor, fallback, receive)
3. Define schema for ABI parameters (inputs/outputs)
4. Handle recursive tuple components
5. Update `parseItem.ts` to use schema validation
6. Update error messages to be helpful and specific
7. Export schema from index for external use
8. Add comprehensive tests for validation
</steps>

<patterns>
- **Schema.Union for discriminated unions**: Use `type` field to discriminate
- **Schema.suspend for recursive types**: Handle nested tuple components
- **Effect.gen for sequencing**: Parse then validate
- **Schema.decodeUnknown**: Validate unknown input
- **Clear error messages**: Include what was expected vs received
</patterns>

<viem_reference>
Viem has type guards for ABI items:
- [src/types/abitype.ts](https://github.com/wevm/viem/blob/main/src/types/abitype.ts) - Type definitions
- Uses abitype library for ABI type validation
</viem_reference>

<voltaire_reference>
- [src/primitives/Abi/](file:///Users/williamcory/voltaire/src/primitives/Abi/) - ABI module
- [voltaire-effect/src/primitives/Abi/](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Abi/) - Effect wrappers
</voltaire_reference>
</implementation>

<tests>
```typescript
// src/primitives/Abi/parseItem.test.ts
import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { parseItem } from "./parseItem.js";
import { AbiItemParseError } from "./Errors.js";

describe("parseItem", () => {
  describe("valid ABI items", () => {
    it("parses function ABI item", async () => {
      const json = JSON.stringify({
        type: "function",
        name: "transfer",
        inputs: [
          { name: "to", type: "address" },
          { name: "amount", type: "uint256" },
        ],
        outputs: [{ type: "bool" }],
        stateMutability: "nonpayable",
      });
      
      const result = await Effect.runPromise(parseItem(json));
      expect(result.type).toBe("function");
      expect(result.name).toBe("transfer");
      expect(result.inputs).toHaveLength(2);
    });

    it("parses event ABI item", async () => {
      const json = JSON.stringify({
        type: "event",
        name: "Transfer",
        inputs: [
          { name: "from", type: "address", indexed: true },
          { name: "to", type: "address", indexed: true },
          { name: "value", type: "uint256", indexed: false },
        ],
      });
      
      const result = await Effect.runPromise(parseItem(json));
      expect(result.type).toBe("event");
      expect(result.inputs?.[0].indexed).toBe(true);
    });

    it("parses error ABI item", async () => {
      const json = JSON.stringify({
        type: "error",
        name: "InsufficientBalance",
        inputs: [
          { name: "available", type: "uint256" },
          { name: "required", type: "uint256" },
        ],
      });
      
      const result = await Effect.runPromise(parseItem(json));
      expect(result.type).toBe("error");
    });

    it("parses constructor ABI item", async () => {
      const json = JSON.stringify({
        type: "constructor",
        inputs: [{ name: "initialSupply", type: "uint256" }],
        stateMutability: "nonpayable",
      });
      
      const result = await Effect.runPromise(parseItem(json));
      expect(result.type).toBe("constructor");
    });

    it("parses fallback ABI item", async () => {
      const json = JSON.stringify({
        type: "fallback",
        stateMutability: "payable",
      });
      
      const result = await Effect.runPromise(parseItem(json));
      expect(result.type).toBe("fallback");
    });

    it("parses receive ABI item", async () => {
      const json = JSON.stringify({
        type: "receive",
        stateMutability: "payable",
      });
      
      const result = await Effect.runPromise(parseItem(json));
      expect(result.type).toBe("receive");
    });

    it("handles tuple types with components", async () => {
      const json = JSON.stringify({
        type: "function",
        name: "getPosition",
        inputs: [],
        outputs: [
          {
            name: "position",
            type: "tuple",
            components: [
              { name: "x", type: "int256" },
              { name: "y", type: "int256" },
            ],
          },
        ],
      });
      
      const result = await Effect.runPromise(parseItem(json));
      expect(result.outputs?.[0].type).toBe("tuple");
      expect(result.outputs?.[0].components).toHaveLength(2);
    });

    it("handles legacy constant/payable fields", async () => {
      const json = JSON.stringify({
        type: "function",
        name: "balanceOf",
        inputs: [{ type: "address" }],
        outputs: [{ type: "uint256" }],
        constant: true, // Legacy field
      });
      
      const result = await Effect.runPromise(parseItem(json));
      expect(result.constant).toBe(true);
    });
  });

  describe("invalid JSON", () => {
    it("rejects malformed JSON", async () => {
      const result = await Effect.runPromise(
        parseItem("not valid json").pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AbiItemParseError);
        expect(result.left.message).toContain("Invalid JSON");
      }
    });

    it("rejects truncated JSON", async () => {
      const result = await Effect.runPromise(
        parseItem('{"type": "function"').pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
    });
  });

  describe("invalid structure", () => {
    it("rejects object without type field", async () => {
      const json = JSON.stringify({
        name: "transfer",
        inputs: [],
      });
      
      const result = await Effect.runPromise(
        parseItem(json).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left.message).toContain("Invalid ABI item structure");
      }
    });

    it("rejects unknown type value", async () => {
      const json = JSON.stringify({
        type: "unknown_type",
        name: "foo",
      });
      
      const result = await Effect.runPromise(
        parseItem(json).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
    });

    it("rejects inputs as non-array", async () => {
      const json = JSON.stringify({
        type: "function",
        name: "foo",
        inputs: "not an array",
      });
      
      const result = await Effect.runPromise(
        parseItem(json).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
    });

    it("rejects input parameter without type", async () => {
      const json = JSON.stringify({
        type: "function",
        name: "foo",
        inputs: [{ name: "bar" }], // Missing type
      });
      
      const result = await Effect.runPromise(
        parseItem(json).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
    });

    it("rejects invalid stateMutability", async () => {
      const json = JSON.stringify({
        type: "function",
        name: "foo",
        stateMutability: "invalid",
      });
      
      const result = await Effect.runPromise(
        parseItem(json).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
    });

    it("rejects arbitrary objects", async () => {
      const json = JSON.stringify({ foo: "bar", baz: 123 });
      
      const result = await Effect.runPromise(
        parseItem(json).pipe(Effect.either)
      );
      
      expect(result._tag).toBe("Left");
    });
  });

  describe("error messages", () => {
    it("includes input in error", async () => {
      const json = "invalid";
      const result = await Effect.runPromise(
        parseItem(json).pipe(Effect.either)
      );
      
      if (result._tag === "Left") {
        expect(result.left.input).toBe(json);
      }
    });

    it("provides helpful structure error message", async () => {
      const json = JSON.stringify({ type: "function" }); // Missing name
      const result = await Effect.runPromise(
        parseItem(json).pipe(Effect.either)
      );
      
      if (result._tag === "Left") {
        expect(result.left.message).toContain("Invalid ABI item");
      }
    });
  });
});
```
</tests>

<docs>
```typescript
/**
 * Parses a JSON string into a validated ABI item.
 * 
 * Unlike plain `JSON.parse`, this function validates that the parsed
 * object conforms to the ABI item structure defined by the Solidity
 * compiler (function, event, error, constructor, fallback, or receive).
 * 
 * ## Supported Item Types
 * 
 * - `function` - Contract function with inputs/outputs
 * - `event` - Event with indexed/non-indexed parameters
 * - `error` - Custom error with parameters
 * - `constructor` - Contract constructor
 * - `fallback` - Fallback function
 * - `receive` - Receive ether function
 * 
 * ## Validation
 * 
 * The function validates:
 * - Required `type` field with valid value
 * - `inputs` and `outputs` are arrays of valid parameters
 * - `stateMutability` has valid value (pure/view/nonpayable/payable)
 * - Tuple types have valid `components`
 * 
 * ## Example
 * 
 * ```typescript
 * import { parseItem } from 'voltaire-effect/primitives/Abi'
 * import { Effect } from 'effect'
 * 
 * const json = `{
 *   "type": "function",
 *   "name": "transfer",
 *   "inputs": [
 *     { "name": "to", "type": "address" },
 *     { "name": "amount", "type": "uint256" }
 *   ],
 *   "outputs": [{ "type": "bool" }]
 * }`
 * 
 * const item = await Effect.runPromise(parseItem(json))
 * console.log(item.name) // 'transfer'
 * ```
 * 
 * @param jsonString - JSON string representing an ABI item
 * @returns Effect with parsed and validated ABI item
 */
```
</docs>

<api>
<before>
```typescript
// No validation - accepts any valid JSON
parseItem('{"foo": "bar"}')  // ✅ Returns { foo: "bar" } typed as ItemType!

// Type lies about the shape
const item = await Effect.runPromise(parseItem(untrusted))
item.inputs  // Runtime error: inputs is undefined
item.name    // Runtime error: name is undefined
```
</before>

<after>
```typescript
// Validates structure
parseItem('{"foo": "bar"}')  // ❌ Error: Invalid ABI item structure

// Type is accurate
const item = await Effect.runPromise(parseItem(valid))
item.type    // ✅ "function" | "event" | "error" | ...
item.inputs  // ✅ Array or undefined, never wrong type

// Helpful error messages
parseItem('{"type": "function"}').pipe(
  Effect.catchTag("AbiItemParseError", (e) => {
    console.log(e.message)  // "Invalid ABI item structure: missing required field 'name'"
  })
)
```
</after>
</api>

<acceptance_criteria>
- [ ] Create AbiItemSchema.ts with Effect Schema definitions
- [ ] Define schemas for all ABI item types (function, event, error, constructor, fallback, receive)
- [ ] Define AbiParameterSchema for inputs/outputs
- [ ] Handle recursive tuple components with Schema.suspend
- [ ] Update parseItem.ts to validate with schema
- [ ] Provide helpful error messages on validation failure
- [ ] Export AbiItemSchema from index
- [ ] Reject objects without valid `type` field
- [ ] Reject non-array inputs/outputs
- [ ] Reject parameters without `type` field
- [ ] All existing tests pass
- [ ] Add tests for valid item types
- [ ] Add tests for invalid structures
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
</acceptance_criteria>

<references>
- [Effect Schema documentation](https://effect.website/docs/schema/introduction)
- [Solidity ABI specification](https://docs.soliditylang.org/en/latest/abi-spec.html)
- [Viem abitype](https://abitype.dev/)
- [Review 076: Use Effect Schema for types](file:///Users/williamcory/voltaire/voltaire-effect/reviews/076-use-effect-schema-for-types.md)
</references>
</issue>
