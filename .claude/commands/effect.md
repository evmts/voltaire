---
description: Guide for implementing Effect.ts Schema APIs across Voltaire primitives using TDD and DDD
---

# Effect.ts API Implementation Guide

Implement Effect Schema-based APIs for Voltaire primitives following documentation-driven and test-driven development.

## Architecture Overview

**Pattern**: Wrap existing branded types with Effect Schema classes
**Philosophy**: Reuse validation logic, add composable error handling and schema validation
**Location**: Each primitive gets `effect.ts` + `effect.test.ts` in its directory

### Why Effect.ts?

Effect provides:
- Schema validation with automatic error handling
- Composable operations via Effect.gen
- Type-safe transformations
- Integration with Effect ecosystem (Schema, Data, Match, etc.)

### Integration Strategy

**DO NOT replace existing APIs**. Effect wraps them:

```typescript
// Existing (unchanged)
type BrandedAddress = Uint8Array & { readonly __tag: "Address" }
function from(value: string | number | Uint8Array): BrandedAddress

// Effect wrapper (new)
class AddressSchema extends Schema.Class<AddressSchema>("Address") {
  value: Schema.Uint8ArrayFromSelf // wraps BrandedAddress
  static from(value: string | number | Uint8Array): AddressSchema {
    return new AddressSchema({ value: BrandedAddressImpl.from(value) })
  }
}

// Effect brands (new)
type AddressBrand = Uint8Array & Brand.Brand<"Address">
const AddressBrand = Brand.refined<AddressBrand>(
  (bytes) => bytes.length === 20,
  (bytes) => Brand.error(`Expected 20-byte Uint8Array, got ${bytes.length}`)
)
```

**Key principles**:
1. Effect's `value` property holds the existing branded type. All methods delegate to existing implementations.
2. Provide Effect brands using `Brand.refined()` (with validation) or `Brand.nominal()` (no validation)
3. Expose `.branded` getter and `.fromBranded()` for zero-cost interop with Effect brands

## File Structure

For each primitive `{Name}`:

```
src/primitives/{Name}/
├── Branded{Name}/
│   ├── Branded{Name}.ts        # Existing branded type
│   ├── from.js                  # Existing validation
│   └── *.js                     # Existing methods
├── effect.ts                    # NEW: Effect Schema classes
├── effect.test.ts               # NEW: Effect Schema tests
├── index.ts                     # Existing exports
└── *.mdx                        # Update docs
```

**Naming conventions**:
- Effect file: `effect.ts` (lowercase)
- Test file: `effect.test.ts`
- Export classes: PascalCase (`Address`, `ChecksumAddress`)
- Schema transforms: `{Type}From{Source}` (`AddressFromHex`)

## Implementation Workflow

Follow strict TDD + DDD:

### 1. Documentation First (DDD)

**Before writing ANY code**, update docs:

```bash
# 1. Update main overview (index.mdx)
# Add Effect Schema tab to Quick Start

# 2. Update relevant sub-pages
# Add Effect Schema tabs where appropriate (constructors, conversions, validation)

# 3. Verify docs build
bun run docs:build
```

**Doc patterns** (see Address as reference):
- Add Effect tab AFTER Namespace, BEFORE Zig
- Import Tabs: `import { Tabs, TabItem } from '@astrojs/starlight/components'`
- Show Effect-specific features (Schema validation, Effect.gen, composability)
- Keep Effect examples concise but complete
- Link between related Effect schemas

### 2. Tests First (TDD)

Write comprehensive tests in `effect.test.ts` BEFORE implementation:

```typescript
import { describe, it, expect } from "vitest";
import * as Schema from "effect/Schema";
import * as Effect from "effect/Effect";
import { ThingSchema, ThingBrand, ThingVariant } from "./effect.js";
import * as BrandedThing from "./BrandedThing/index.js";

describe("Thing Effect Schema", () => {
  describe("ThingSchema class", () => {
    it("creates ThingSchema from input", () => {
      const thing = ThingSchema.from("input");
      expect(thing.value).toBeInstanceOf(Uint8Array); // or appropriate type
    });

    it("validates ThingSchema schema", () => {
      const validData = BrandedThing.from("input");
      const thing = new ThingSchema({ value: validData });
      expect(thing.thing).toBe(validData);
    });

    it("rejects invalid input", () => {
      expect(() => new ThingSchema({ value: "invalid" })).toThrow();
    });

    // Test all conversions
    it("converts to other formats", () => {
      const thing = ThingSchema.from("input");
      expect(thing.toHex()).toBe("expected");
      expect(thing.toVariant()).toBeDefined();
    });
  });

  describe("Effect Branded Types", () => {
    it("creates ThingBrand with validation", () => {
      const validData = new Uint8Array(20);
      const brand = ThingBrand(validData);
      expect(brand).toBe(validData);
    });

    it("rejects invalid ThingBrand", () => {
      const invalidData = new Uint8Array(19);
      expect(() => ThingBrand(invalidData)).toThrow();
    });

    it("creates ThingSchema from ThingBrand", () => {
      const data = new Uint8Array(20);
      const brand = ThingBrand(data);
      const schema = ThingSchema.fromBranded(brand);
      expect(schema.branded).toBe(brand);
    });

    it("exposes branded getter", () => {
      const thing = ThingSchema.from("input");
      const brand = thing.branded;
      expect(brand).toBeInstanceOf(Uint8Array);
    });
  });

  describe("Schema transforms", () => {
    it("decodes from unknown", () => {
      const decode = Schema.decodeUnknownSync(ThingFromUnknown);
      const thing = decode("input");
      expect(thing).toBeInstanceOf(ThingSchema);
    });

    it("encodes to output", () => {
      const encode = Schema.encodeSync(ThingFromUnknown);
      const thing = ThingSchema.from("input");
      const output = encode(thing);
      expect(output).toBeDefined();
    });
  });

  describe("Effect integration", () => {
    it("works with Effect.gen", async () => {
      const program = Effect.gen(function* () {
        const thing = yield* Effect.sync(() => ThingSchema.from("input"));
        return thing.toHex();
      });
      const result = await Effect.runPromise(program);
      expect(result).toBe("expected");
    });

    it("handles validation errors", async () => {
      const program = Effect.try({
        try: () => new ThingSchema({ value: "invalid" }),
        catch: (error) => new Error(`Failed: ${error}`),
      });
      const result = await Effect.runPromise(Effect.either(program));
      expect(result._tag).toBe("Left");
    });
  });
});
```

**Test coverage requirements**:
- [ ] All constructors (from, fromHex, fromBytes, etc.)
- [ ] All conversions (toHex, toChecksummed, etc.)
- [ ] Effect brands (construction, validation, rejection)
- [ ] Brand interop (`.branded` getter, `.fromBranded()` method)
- [ ] Schema validation (valid + invalid inputs)
- [ ] Schema transforms (decode + encode)
- [ ] Effect.gen integration
- [ ] Error handling with Effect.try/catch
- [ ] Type variants (if applicable)
- [ ] Edge cases (zero values, max values, empty, etc.)

**Run tests BEFORE implementing**:
```bash
bun test:run src/primitives/{Name}/effect.test.ts
# Should fail - that's correct! Now implement to make them pass.
```

**Reference**: See `src/primitives/Address/effect.test.ts` for comprehensive test examples including branded types.

### 3. Implementation

Create `effect.ts` following this template:

```typescript
import * as Schema from "effect/Schema";
import * as Brand from "effect/Brand";
import type { Branded{Name} } from "./Branded{Name}/Branded{Name}.js";
import * as Branded{Name}Impl from "./Branded{Name}/index.js";

/**
 * Effect Brand for {Name} - refined brand with validation
 * Use Brand.refined() for types that need runtime validation
 * Use Brand.nominal() for types that don't need validation
 */
export type {Name}Brand = {UnderlyingType} & Brand.Brand<"{Name}">;

/**
 * Effect Brand constructor with validation
 */
export const {Name}Brand = Brand.refined<{Name}Brand>(
  (data): data is {UnderlyingType} & Brand.Brand<"{Name}"> =>
    Branded{Name}Impl.is(data), // Reuse existing validation
  (data) =>
    Brand.error(
      `Expected valid {name}, got ${/* describe data */}`
    ),
);

/**
 * Schema for {Name} from various input types
 * Uses Effect Brand validation for type safety
 */
export class {Name}Schema extends Schema.Class<{Name}Schema>("{Name}")({
  value: Schema.{UnderlyingType}.pipe(
    Schema.filter((data): data is {UnderlyingType} => {
      return Branded{Name}Impl.is(data); // Use existing validation
    }, {
      message: () => "Invalid {name}: description of validation",
    }),
  ),
}) {
  /**
   * Get the underlying Branded{Name} (internal Voltaire type)
   */
  get {lowerName}(): Branded{Name} {
    return this.value as Branded{Name};
  }

  /**
   * Get as Effect branded {Name}Brand
   */
  get branded(): {Name}Brand {
    return this.value as {Name}Brand;
  }

  /**
   * Create from Effect branded {Name}Brand (zero-cost, no validation)
   */
  static fromBranded(brand: {Name}Brand): {Name}Schema {
    return new {Name}Schema({ value: brand });
  }

  /**
   * Create from universal input
   */
  static from(value: InputTypes): {Name}Schema {
    const data = Branded{Name}Impl.from(value); // Reuse existing
    return new {Name}Schema({ value: data });
  }

  /**
   * Create from specific format
   */
  static fromHex(hex: string): {Name}Schema {
    const data = Branded{Name}Impl.fromHex(hex);
    return new {Name}Schema({ value: data });
  }

  // ... other constructors (fromBytes, fromNumber, etc.)

  /**
   * Convert to hex
   */
  toHex(): string {
    return Branded{Name}Impl.toHex(this.{lowerName});
  }

  // ... other conversions (delegate to existing implementations)

  /**
   * Instance methods
   */
  equals(other: {Name}Schema | Branded{Name}): boolean {
    const otherData = other instanceof {Name}Schema ? other.{lowerName} : other;
    return Branded{Name}Impl.equals(this.{lowerName}, otherData);
  }

  // ... other instance methods
}

/**
 * Schema for type variants (if applicable)
 */
export class {Name}Variant extends Schema.Class<{Name}Variant>("{Name}Variant")({
  value: Schema.String.pipe(
    Schema.filter((str): str is string => {
      return {Name}VariantImpl.isValid(str);
    }, {
      message: () => "Invalid {name} variant: description",
    }),
  ),
}) {
  get variant(): VariantType {
    return this.value as VariantType;
  }

  static from(value: InputType): {Name}Variant {
    const variant = {Name}VariantImpl.from(value);
    return new {Name}Variant({ value: variant });
  }

  // Conversion between schemas
  to{Name}(): {Name} {
    const data = Branded{Name}Impl.fromVariant(this.value);
    return new {Name}({ value: data });
  }
}

/**
 * Schema transforms for automatic conversion
 */
export const {Name}FromHex = Schema.transform(
  Schema.String,
  Schema.instanceOf({Name}Schema),
  {
    decode: (hex) => {Name}Schema.fromHex(hex),
    encode: (thing) => thing.toHex(),
  },
);

export const {Name}FromUnknown = Schema.transform(
  Schema.Union(
    Schema.Number,
    Schema.BigIntFromSelf,
    Schema.String,
    Schema.{UnderlyingType},
  ),
  Schema.instanceOf({Name}Schema),
  {
    decode: (value) => {Name}Schema.from(value),
    encode: (thing) => thing.{lowerName},
  },
);
```

**Implementation checklist**:
- [ ] Create Effect brands with `Brand.refined()` or `Brand.nominal()`
- [ ] Reuse existing validation in brand predicates
- [ ] Create Schema.Class named `{Name}Schema` (not just `{Name}`)
- [ ] Add `.branded` getter returning Effect brand
- [ ] Add `.fromBranded()` static method for zero-cost construction
- [ ] Delegate ALL operations to existing `Branded{Name}Impl`
- [ ] Add JSDoc comments (copy from existing implementations)
- [ ] Create Schema.Class for variants (if applicable)
- [ ] Create Schema transforms for common conversions
- [ ] Expose underlying branded type via getter (`{lowerName}`)
- [ ] Support both Effect instances and branded types in methods

### 4. Verify Tests Pass

```bash
bun test:run src/primitives/{Name}/effect.test.ts
```

All tests MUST pass. Fix implementation until green.

### 5. Type Check

```bash
bun typecheck
```

Fix any type errors. Common issues:
- Missing imports
- Incorrect Schema types
- Type guards not properly narrowing

### 6. Verify Docs Build

```bash
bun run docs:build
```

Ensure no MDX syntax errors or broken links.

## Common Patterns

### Pattern 1: Uint8Array-based primitives (Address, Hash, Signature)

```typescript
// Effect Brand with validation
export type AddressBrand = Uint8Array & Brand.Brand<"Address">;

export const AddressBrand = Brand.refined<AddressBrand>(
  (bytes): bytes is Uint8Array & Brand.Brand<"Address"> =>
    bytes instanceof Uint8Array && bytes.length === 20,
  (bytes) =>
    Brand.error(
      `Expected 20-byte Uint8Array, got ${bytes instanceof Uint8Array ? `${bytes.length} bytes` : typeof bytes}`
    ),
);

// Schema Class
export class AddressSchema extends Schema.Class<AddressSchema>("Address")({
  value: Schema.Uint8ArrayFromSelf.pipe(
    Schema.filter((bytes): bytes is Uint8Array => {
      return bytes.length === 20;
    }, {
      message: () => "Invalid address: must be 20 bytes",
    }),
  ),
}) {
  get address(): BrandedAddress {
    return this.value as BrandedAddress;
  }

  get branded(): AddressBrand {
    return this.value as AddressBrand;
  }

  static fromBranded(brand: AddressBrand): AddressSchema {
    return new AddressSchema({ value: brand });
  }
}
```

**Use when**: Primitive is fixed-length Uint8Array

### Pattern 2: String-based branded types (Hex variants, ENS)

```typescript
// Nominal brand - validation happens elsewhere (via keccak)
export type ChecksumAddressBrand = string & Brand.Brand<"ChecksumAddress">;

export const ChecksumAddressBrand = Brand.nominal<ChecksumAddressBrand>();

// Schema Class
export class ChecksumAddress extends Schema.Class<ChecksumAddress>("ChecksumAddress")({
  value: Schema.String.pipe(
    Schema.filter((str): str is string => {
      return ChecksumAddressImpl.isValid(str); // EIP-55 validation
    }, {
      message: () => "Invalid checksum address: EIP-55 validation failed",
    }),
  ),
}) {
  get checksummed(): Checksummed {
    return this.value as Checksummed;
  }

  get branded(): ChecksumAddressBrand {
    return ChecksumAddressBrand(this.value);
  }

  static fromBranded(brand: ChecksumAddressBrand): ChecksumAddress {
    return new ChecksumAddress({ value: brand });
  }
}
```

**Use when**: Primitive is validated string with specific format

### Pattern 3: Numeric types (Uint variants)

```typescript
export class Uint256 extends Schema.Class<Uint256>("Uint256")({
  value: Schema.BigIntFromSelf.pipe(
    Schema.filter((n): n is bigint => {
      return n >= 0n && n < (1n << 256n); // Range validation
    }, {
      message: () => "Invalid uint256: must be 0 <= n < 2^256",
    }),
  ),
}) {
  get uint256(): BrandedUint256 {
    return this.value as BrandedUint256;
  }
}
```

**Use when**: Primitive is numeric with range constraints

### Pattern 4: Complex structures (ABI, Transaction, Log)

```typescript
export class EventLog extends Schema.Class<EventLog>("EventLog")({
  address: Schema.instanceOf(Address),
  topics: Schema.Array(Schema.instanceOf(Hash)),
  data: Schema.Uint8ArrayFromSelf,
  blockNumber: Schema.BigIntFromSelf,
  // ... other fields
}) {
  static from(log: RawLog): EventLog {
    return new EventLog({
      address: Address.from(log.address),
      topics: log.topics.map(Hash.from),
      data: log.data,
      blockNumber: BigInt(log.blockNumber),
    });
  }
}
```

**Use when**: Primitive is composite structure with multiple fields

### Pattern 5: Schema Transforms

Always provide transforms for common conversions:

```typescript
// String → Schema
export const ThingFromHex = Schema.transform(
  Schema.String,
  Schema.instanceOf(Thing),
  {
    decode: (hex) => Thing.fromHex(hex),
    encode: (thing) => thing.toHex(),
  },
);

// Unknown → Schema (accepts multiple input types)
export const ThingFromUnknown = Schema.transform(
  Schema.Union(Schema.String, Schema.Number, Schema.Uint8ArrayFromSelf),
  Schema.instanceOf(Thing),
  {
    decode: (value) => Thing.from(value),
    encode: (thing) => thing.value, // Return branded type
  },
);
```

## Documentation Updates

### Main Overview (index.mdx)

Add Effect tab to Quick Start section:

```mdx
<Tabs>
<TabItem label="Class API">
```typescript
// Existing examples
```
</TabItem>
<TabItem label="Namespace API">
```typescript
// Existing examples
```
</TabItem>
<TabItem label="Effect Schema">
```typescript
import { Thing } from '@tevm/voltaire/{Thing}/effect'
import * as Effect from 'effect/Effect'

// Schema-validated construction
const thing = Thing.from("input")

// Effect composition
const program = Effect.gen(function* () {
  const t = yield* Effect.sync(() => Thing.from("input"))
  const hex = yield* Effect.sync(() => t.toHex())
  return hex
})

await Effect.runPromise(program)
```
</TabItem>
</Tabs>
```

### Sub-pages (constructors.mdx, conversions.mdx, etc.)

Add Effect tabs to relevant method examples:

```mdx
<Tabs>
<TabItem label="Class/Namespace">
```typescript
const thing = Thing.fromHex("0x...")
```
</TabItem>
<TabItem label="Effect Schema">
```typescript
import { Thing } from '@tevm/voltaire/{Thing}/effect'

const thing = Thing.fromHex("0x...")
// Automatic schema validation on construction
```
</TabItem>
</Tabs>
```

### Placement Rules

1. **Always import Tabs**: `import { Tabs, TabItem } from '@astrojs/starlight/components'`
2. **Tab order**: Class → Namespace → **Effect** → Zig
3. **Effect visibility**: Present but not prominent (same level as other APIs)
4. **Show Effect-specific features**: Schema validation, Effect.gen, error handling
5. **Keep examples concise**: 3-10 lines per tab

### When to Add Effect Examples

Add Effect tab when:
- ✅ Constructor methods (from, fromHex, fromBytes, etc.)
- ✅ Conversions with validation (toChecksummed, etc.)
- ✅ Type variants (ChecksumAddress, etc.)
- ✅ Complex operations (calculateCreateAddress, etc.)
- ✅ Validation examples (isValid, etc.)

Skip Effect tab when:
- ❌ Simple getters (no added value over namespace)
- ❌ Inherited Uint8Array methods (not Effect-specific)
- ❌ Constants and types (not runtime code)

## Testing Checklist

For each primitive, ensure tests cover:

**Construction**:
- [ ] `Thing.from()` with all valid input types
- [ ] `Thing.fromHex()`, `Thing.fromBytes()`, etc.
- [ ] Invalid inputs throw/reject appropriately
- [ ] Schema validation catches malformed data

**Conversions**:
- [ ] `thing.toHex()`, `thing.toBytes()`, etc.
- [ ] Variant conversions (e.g., `toChecksummed()`)
- [ ] Round-trip conversions preserve data

**Validation**:
- [ ] Valid data passes schema
- [ ] Invalid data rejected with clear errors
- [ ] Type guards work correctly

**Effect Integration**:
- [ ] `Effect.gen` composition works
- [ ] `Effect.try` error handling works
- [ ] `Schema.decode/encode` transforms work
- [ ] Async operations with `Effect.runPromise`

**Type Variants**:
- [ ] Variant schemas validate correctly
- [ ] Conversions between variants work
- [ ] Type narrowing preserves safety

**Edge Cases**:
- [ ] Zero/empty values
- [ ] Maximum values
- [ ] Boundary conditions
- [ ] Null/undefined handling

## Common Issues

### Issue: "Cannot read property of undefined"

**Cause**: Trying to access method on existing implementation that doesn't exist

**Fix**: Check existing implementation exports. Ensure method exists before calling.

```typescript
// Bad
const result = BrandedThingImpl.methodThatDoesntExist(data);

// Good - check exports first
import * as BrandedThingImpl from "./BrandedThing/index.js";
// Only call methods that are actually exported
```

### Issue: Schema validation always fails

**Cause**: Filter predicate too strict or incorrect type guard

**Fix**: Use existing `is()` or `isValid()` functions from branded type:

```typescript
// Bad - reimplementing validation
Schema.filter((data) => {
  return data.length === 20; // Might miss other validation
})

// Good - reuse existing validation
Schema.filter((data): data is Uint8Array => {
  return BrandedThingImpl.is(data); // Reuses all validation logic
})
```

### Issue: Type errors with branded types

**Cause**: TypeScript not narrowing to branded type

**Fix**: Use type assertion ONLY after validation:

```typescript
get thing(): BrandedThing {
  // value is already validated by schema, safe to assert
  return this.value as BrandedThing;
}
```

### Issue: Circular dependencies

**Cause**: Importing from index.ts which also imports effect.ts

**Fix**: Import from specific files, not index:

```typescript
// Bad
import * as Address from "./index.js"; // Circular!

// Good
import * as BrandedAddressImpl from "./BrandedAddress/index.js";
```

## Primitive Priority List

Implement Effect APIs in this order:

**Tier 1** (foundational, simple):
1. ✅ Address - DONE (reference implementation with Effect brands)
2. Hash
3. Hex
4. Uint

**Tier 2** (builds on Tier 1):
5. Signature
6. Bytecode
7. Base64
8. ENS

**Tier 3** (complex structures):
9. Transaction
10. EventLog
11. AccessList
12. Authorization

**Tier 4** (advanced):
13. Abi
14. Rlp
15. State
16. Blob

**Tier 5** (crypto - optional):
17. Keccak256
18. Secp256k1
19. BLS12-381
20. KZG

## Workflow Summary

For each primitive:

```bash
# 1. Documentation First
# Edit index.mdx and sub-pages, add Effect tabs
bun run docs:build  # Verify docs build

# 2. Tests First
# Write comprehensive effect.test.ts
bun test:run src/primitives/{Name}/effect.test.ts  # Should fail

# 3. Implementation
# Create effect.ts following patterns
bun test:run src/primitives/{Name}/effect.test.ts  # Should pass

# 4. Type Check
bun typecheck  # Fix any type errors

# 5. Final Verification
bun run docs:build  # Docs still build
bun test:run  # All tests pass
```

## Reference Implementation

See `src/primitives/Address/effect.ts` and `src/primitives/Address/effect.test.ts` for complete reference implementation with Effect branded types.

Key files to study:
- `effect.ts` - Schema classes, Effect brands, service integration, delegation to existing code
- `effect.test.ts` - Comprehensive test coverage including branded type tests
- `effect-services.ts` - Service definitions (Keccak256, Secp256k1, RlpEncoder)
- `effect-layers.ts` - Layer implementations for services
- `effect-errors.ts` - Tagged error types for all failure modes
- `index.mdx` - Quick Start with Effect tab
- `conversions.mdx` - Effect examples for conversions
- `variants.mdx` - ChecksumAddress Effect schema

Key patterns demonstrated:
- **Refined brands** - `AddressBrand` with `Brand.refined()` and validation
- **Nominal brands** - `ChecksumAddressBrand` with `Brand.nominal()` (no validation)
- **Brand interop** - `.branded` getter and `.fromBranded()` static method
- **Schema classes** - `AddressSchema`, `ChecksumAddress` extending `Schema.Class`
- **Service injection** - Crypto operations via Effect context
- **Typed errors** - All failure modes explicit in signatures

## Questions?

When implementing Effect API, ask:

1. **Does existing validation exist?** → Reuse it, don't reimplement
2. **What's the underlying type?** → Uint8Array, String, BigInt, or complex?
3. **Should brands validate?** → Use `Brand.refined()` if yes, `Brand.nominal()` if no
4. **Are there variants?** → Create separate Schema.Class and Brand for each
5. **What conversions exist?** → Delegate all to existing implementations
6. **Does it compose with other primitives?** → Use Schema.instanceOf for nested schemas
7. **How to expose brands?** → `.branded` getter and `.fromBranded()` static method

**Remember**: Effect.ts wraps, never replaces. Zero changes to existing code.
