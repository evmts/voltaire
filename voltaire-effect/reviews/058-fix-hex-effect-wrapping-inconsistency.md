# Fix Hex/Address Effect Wrapping Inconsistency

<issue>
<metadata>
  <priority>P3</priority>
  <category>api-consistency</category>
  <complexity>medium</complexity>
  <estimated_effort>2 hours</estimated_effort>
  <files>
    - src/primitives/Hex/*.ts
    - src/primitives/Address/*.ts
    - src/primitives/Bytes/*.ts
    - src/primitives/Hash/*.ts
  </files>
  <related_reviews>
    - 095-api-consistency-review.md
    - 085-effect-patterns-improvements.md
    - 080-use-effect-error-patterns.md
  </related_reviews>
</metadata>

<context>
## Effect Philosophy
The Effect library provides a powerful abstraction for handling errors, async operations, and side effects. However, Effect should be used purposefully:

- **Effect for fallible operations**: Operations that can fail should return `Effect<A, E>` to track possible errors in the type system
- **Direct return for infallible operations**: Pure functions that cannot fail should return their value directly

Wrapping infallible operations in Effect adds:
- Unnecessary runtime overhead (Effect.succeed allocation)
- API friction (callers must unwrap with Effect.runSync)
- Confusion about whether the operation can actually fail

## Viem Pattern
Viem consistently returns values directly for operations that cannot fail:
```typescript
// Viem - direct returns for pure operations
const cloned = slice(bytes);     // Uint8Array, not Effect
const isEqual = isEqual(a, b);   // boolean, not Effect
const len = size(data);          // number, not Effect
```
</context>

<problem>
Inconsistent Effect wrapping across primitive modules. Hex wraps infallible operations in Effect, Address returns directly.

```typescript
// Hex - unnecessarily wraps infallible operation in Effect
export const clone = (hex: HexType): Effect.Effect<HexType> =>
  Effect.succeed(hex.slice() as HexType);

// Address - returns directly (correct for infallible)
export const clone = (address: AddressType): AddressType =>
  address.slice() as AddressType;

// Hex - wraps infallible size in Effect
export const size = (hex: HexType): Effect.Effect<number> =>
  Effect.succeed(hex.length);

// But other modules return directly:
export const size = (data: BytesType): number => data.length;
```

**Impact:**
- API confusion: callers don't know when Effect.runSync is needed
- Unnecessary overhead for pure operations
- Inconsistent patterns across similar modules
- Extra code at call sites for infallible operations
</problem>

<solution>
Establish clear convention: **Effect-wrap only fallible operations**.

### Direct Return (Infallible Operations)
Operations that cannot fail return their value directly:

```typescript
// Pure data copy - cannot fail
export const clone = (hex: HexType): HexType => 
  hex.slice() as HexType;

// Pure comparison - cannot fail
export const equals = (a: HexType, b: HexType): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

// Property access - cannot fail
export const size = (hex: HexType): number => 
  hex.length;

// Conversion of validated input - cannot fail
export const toBytes = (hex: HexType): Uint8Array =>
  Uint8Array.from(hex);

// Bounds-checked slice - cannot fail (clamps to bounds)
export const slice = (hex: HexType, start: number, end?: number): HexType =>
  hex.slice(start, end) as HexType;
```

### Effect Return (Fallible Operations)
Operations that can fail return Effect with typed error:

```typescript
// Parsing can fail - use Effect
export const fromString = (str: string): Effect.Effect<HexType, HexParseError> =>
  Effect.try({
    try: () => parseHex(str),
    catch: (e) => new HexParseError({ input: str, cause: e }),
  });

// Validation can fail - use Effect
export const fromHex = (hex: string): Effect.Effect<HexType, InvalidHexError> =>
  Effect.try({
    try: () => {
      if (!isValidHex(hex)) throw new Error("Invalid hex");
      return decodeHex(hex);
    },
    catch: (e) => new InvalidHexError({ hex, cause: e }),
  });

// Explicit validation - use Effect
export const validate = (input: unknown): Effect.Effect<HexType, ValidationError> =>
  Schema.decodeUnknown(HexTypeSchema)(input).pipe(
    Effect.mapError((e) => new ValidationError({ input, cause: e }))
  );
```

### Decision Matrix

| Operation Type | Example | Return Type | Rationale |
|---------------|---------|-------------|-----------|
| Pure copy | `clone(x)` | `X` | Cannot fail |
| Comparison | `equals(a, b)` | `boolean` | Cannot fail |
| Property access | `size(x)` | `number` | Cannot fail |
| Validated conversion | `toBytes(validated)` | `Uint8Array` | Input already valid |
| Bounds-checked | `slice(x, start, end)` | `X` | Clamps bounds, no error |
| Parsing | `fromString(s)` | `Effect<X, ParseError>` | Can fail |
| Validation | `fromHex(h)` | `Effect<X, InvalidError>` | Can fail |
| External I/O | `fetch(url)` | `Effect<X, NetworkError>` | Can fail |
</solution>

<implementation>
<steps>
1. Audit all primitive modules (Hex, Address, Bytes, Hash, Signature, etc.)
2. Create list of all Effect-wrapped functions
3. Classify each as fallible or infallible
4. For infallible operations:
   - Remove Effect wrapper
   - Update return type
   - Add `Sync` suffix to name if needed for backwards compatibility
5. Update callers that use `.pipe(Effect.map(...))` on now-direct returns
6. Document the pattern in module-level JSDoc
</steps>

<patterns>
- **Effect for error channel, not for "functional purity"**: Use Effect when you need the error type
- **Pure functions return directly**: No Effect overhead for deterministic operations
- **Fallible functions return Effect with typed error**: Leverage the type system
- **Use `Effect.sync` only for side-effectful but infallible operations**: e.g., reading a mutable reference
- **Sync suffix convention**: If both Effect and direct versions needed, use `clone` (direct) and `cloneEffect` (wrapped)
</patterns>

<viem_reference>
Viem consistently uses direct returns for infallible operations:
- [src/utils/data/slice.ts](https://github.com/wevm/viem/blob/main/src/utils/data/slice.ts) - Returns `Hex | ByteArray` directly
- [src/utils/data/size.ts](https://github.com/wevm/viem/blob/main/src/utils/data/size.ts) - Returns `number` directly
- [src/utils/data/concat.ts](https://github.com/wevm/viem/blob/main/src/utils/data/concat.ts) - Returns `Hex | ByteArray` directly
</viem_reference>

<voltaire_reference>
- [voltaire-effect/reviews/080-use-effect-error-patterns.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/080-use-effect-error-patterns.md) - Error pattern guidelines
- [voltaire-effect/reviews/085-effect-patterns-improvements.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/085-effect-patterns-improvements.md) - Effect best practices
</voltaire_reference>
</implementation>

<tests>
```typescript
// src/primitives/Hex/consistency.test.ts
import { describe, it, expect } from "vitest";
import * as Hex from "./index.js";
import * as Effect from "effect/Effect";

describe("Hex API consistency", () => {
  describe("infallible operations return directly", () => {
    it("clone returns HexType directly", () => {
      const hex = Hex.fromBytesSync(new Uint8Array([1, 2, 3]));
      const result = Hex.clone(hex);
      
      // Should be direct value, not Effect
      expect(result).toBeInstanceOf(Uint8Array);
      expect(Effect.isEffect(result)).toBe(false);
      
      // Should be a copy, not same reference
      expect(result).not.toBe(hex);
      expect(Hex.equals(result, hex)).toBe(true);
    });

    it("equals returns boolean directly", () => {
      const a = Hex.fromBytesSync(new Uint8Array([1, 2, 3]));
      const b = Hex.fromBytesSync(new Uint8Array([1, 2, 3]));
      const c = Hex.fromBytesSync(new Uint8Array([1, 2, 4]));
      
      expect(Hex.equals(a, b)).toBe(true);
      expect(Hex.equals(a, c)).toBe(false);
      expect(typeof Hex.equals(a, b)).toBe("boolean");
    });

    it("size returns number directly", () => {
      const hex = Hex.fromBytesSync(new Uint8Array(10));
      const result = Hex.size(hex);
      
      expect(result).toBe(10);
      expect(typeof result).toBe("number");
    });

    it("slice returns HexType directly", () => {
      const hex = Hex.fromBytesSync(new Uint8Array([1, 2, 3, 4, 5]));
      const result = Hex.slice(hex, 1, 4);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(3);
    });

    it("toBytes returns Uint8Array directly", () => {
      const hex = Hex.fromBytesSync(new Uint8Array([0xab, 0xcd]));
      const result = Hex.toBytes(hex);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toEqual(new Uint8Array([0xab, 0xcd]));
    });
  });

  describe("fallible operations return Effect", () => {
    it("fromString returns Effect", () => {
      const result = Hex.fromString("0x1234");
      expect(Effect.isEffect(result)).toBe(true);
    });

    it("fromString can fail with parse error", async () => {
      const result = await Effect.runPromise(
        Hex.fromString("not-hex").pipe(Effect.either)
      );
      expect(result._tag).toBe("Left");
    });

    it("fromString success returns parsed hex", async () => {
      const result = await Effect.runPromise(Hex.fromString("0xabcd"));
      expect(result).toBeInstanceOf(Uint8Array);
    });

    it("validate returns Effect", () => {
      const result = Hex.validate("0x1234");
      expect(Effect.isEffect(result)).toBe(true);
    });

    it("validate can fail with validation error", async () => {
      const result = await Effect.runPromise(
        Hex.validate({ not: "hex" }).pipe(Effect.either)
      );
      expect(result._tag).toBe("Left");
    });
  });
});

describe("Address API consistency", () => {
  describe("infallible operations return directly", () => {
    it("clone returns AddressType directly", () => {
      const addr = new Uint8Array(20).fill(0xab) as any;
      const result = Address.clone(addr);
      
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).not.toBe(addr);
    });

    it("equals returns boolean directly", () => {
      const a = new Uint8Array(20).fill(0xab) as any;
      const b = new Uint8Array(20).fill(0xab) as any;
      
      expect(typeof Address.equals(a, b)).toBe("boolean");
    });
  });
});

describe("Cross-module consistency", () => {
  it("all modules use same pattern for clone", () => {
    // All should return directly (not Effect)
    const hexResult = Hex.clone(someHex);
    const addrResult = Address.clone(someAddr);
    const bytesResult = Bytes.clone(someBytes);
    
    expect(Effect.isEffect(hexResult)).toBe(false);
    expect(Effect.isEffect(addrResult)).toBe(false);
    expect(Effect.isEffect(bytesResult)).toBe(false);
  });

  it("all modules use same pattern for equals", () => {
    expect(typeof Hex.equals(a, b)).toBe("boolean");
    expect(typeof Address.equals(c, d)).toBe("boolean");
    expect(typeof Bytes.equals(e, f)).toBe("boolean");
  });

  it("all modules use same pattern for size", () => {
    expect(typeof Hex.size(hex)).toBe("number");
    expect(typeof Bytes.size(bytes)).toBe("number");
  });
});
```
</tests>

<docs>
Add pattern documentation to each module:

```typescript
/**
 * @module Hex
 * 
 * ## API Design
 * 
 * This module follows Effect best practices for function signatures:
 * 
 * ### Direct Return (Infallible Operations)
 * Operations that cannot fail return their value directly:
 * - `clone(hex)` → `HexType`
 * - `equals(a, b)` → `boolean`
 * - `size(hex)` → `number`
 * - `toBytes(hex)` → `Uint8Array`
 * - `slice(hex, start, end)` → `HexType`
 * 
 * ### Effect Return (Fallible Operations)
 * Operations that can fail return Effect with typed error:
 * - `fromString(str)` → `Effect<HexType, HexParseError>`
 * - `fromHex(hex)` → `Effect<HexType, InvalidHexError>`
 * - `validate(input)` → `Effect<HexType, ValidationError>`
 * 
 * This follows Effect best practices: use Effect for error handling,
 * not for wrapping pure functions.
 * 
 * @example
 * ```typescript
 * // Infallible - use directly
 * const cloned = Hex.clone(hex);
 * const len = Hex.size(hex);
 * if (Hex.equals(a, b)) { ... }
 * 
 * // Fallible - use Effect
 * const parsed = await Effect.runPromise(Hex.fromString("0x..."));
 * ```
 */
```
</docs>

<api>
<before>
```typescript
// Inconsistent - must check each function's return type
const cloned = Effect.runSync(Hex.clone(hex));  // unnecessary Effect
const size = Effect.runSync(Hex.size(hex));     // unnecessary Effect
const parsed = Effect.runSync(Hex.fromString("0x...")); // correct usage

// Different patterns for same operation across modules
Hex.clone(x);     // Returns Effect<HexType>
Address.clone(y); // Returns AddressType directly
```
</before>

<after>
```typescript
// Predictable - Effect only for fallible operations
const cloned = Hex.clone(hex);     // Direct return
const size = Hex.size(hex);        // Direct return
const equal = Hex.equals(a, b);    // Direct return

// Fallible operations use Effect
const parsed = await Effect.runPromise(Hex.fromString("0x..."));

// Consistent patterns across all modules
Hex.clone(x);     // HexType
Address.clone(y); // AddressType
Bytes.clone(z);   // BytesType
```
</after>
</api>

<acceptance_criteria>
- [ ] Audit Hex module for unnecessarily Effect-wrapped operations
- [ ] Audit Address module for consistency
- [ ] Audit Bytes module for consistency
- [ ] Audit Hash module for consistency
- [ ] Unwrap infallible operations: clone, equals, size, slice, toBytes
- [ ] Keep Effect wrapping for: fromString, fromHex, validate, parse
- [ ] Update all callers of changed functions
- [ ] Document the pattern in module JSDoc
- [ ] Add consistency tests across modules
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
</acceptance_criteria>

<references>
- [Effect best practices](https://effect.website/docs/guides/essentials/effect-type)
- [Review 085: Effect patterns improvements](file:///Users/williamcory/voltaire/voltaire-effect/reviews/085-effect-patterns-improvements.md)
- [Review 095: API consistency review](file:///Users/williamcory/voltaire/voltaire-effect/reviews/095-api-consistency-review.md)
- [Viem direct return patterns](https://github.com/wevm/viem/blob/main/src/utils/data/)
</references>
</issue>
