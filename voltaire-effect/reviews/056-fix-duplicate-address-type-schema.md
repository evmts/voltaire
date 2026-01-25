# Fix Duplicate AddressTypeSchema Declarations

<issue>
<metadata>
  <priority>P3</priority>
  <category>code-quality</category>
  <complexity>low</complexity>
  <estimated_effort>1 hour</estimated_effort>
  <files>
    - src/primitives/Address/Hex.ts
    - src/primitives/Address/Checksummed.ts
    - src/primitives/Address/Bytes.ts
    - src/primitives/Address/AddressSchema.ts (new)
  </files>
  <related_reviews>
    - 076-use-effect-schema-for-types.md
    - 095-api-consistency-review.md
  </related_reviews>
</metadata>

<context>
## Ethereum Address Background
Ethereum addresses are 20-byte identifiers derived from the last 20 bytes of the Keccak-256 hash of a public key (or contract creation data). The hex representation is 40 characters (plus "0x" prefix), commonly checksummed per EIP-55.

## Effect Schema Pattern
Effect Schema provides a declarative way to validate data structures. The `Schema.declare` function creates custom schemas for branded types, enabling type-safe validation without runtime type assertions.

## DRY Principle Violation
The current implementation duplicates the same `AddressTypeSchema` declaration across 3 files. This violates DRY (Don't Repeat Yourself) and risks schema divergence if validation logic changes in one file but not others.
</context>

<problem>
`AddressTypeSchema` is declared identically 3 times across Address module files, violating DRY and risking schema divergence.

```typescript
// src/primitives/Address/Hex.ts:19
const AddressTypeSchema = S.declare<AddressType>(
  (input): input is AddressType => /* validation logic */
);

// src/primitives/Address/Checksummed.ts:19
const AddressTypeSchema = S.declare<AddressType>(
  (input): input is AddressType => /* same validation logic */
);

// src/primitives/Address/Bytes.ts:19
const AddressTypeSchema = S.declare<AddressType>(
  (input): input is AddressType => /* same validation logic */
);
```

**Impact:**
- If validation logic changes, all 3 files must be updated
- Inconsistent validation if files diverge
- Bundle size increases with duplicate code
- Violates single source of truth principle
</problem>

<solution>
Create a single canonical `AddressSchema.ts` with one `AddressTypeSchema` definition. All other files import from this source.

```typescript
// src/primitives/Address/AddressSchema.ts
import * as Schema from "effect/Schema";
import type { AddressType } from "./AddressType.js";

/**
 * Effect Schema for validating Ethereum addresses.
 * An address is a branded 20-byte Uint8Array.
 */
export const AddressTypeSchema: Schema.Schema<AddressType> = Schema.declare(
  (input: unknown): input is AddressType => {
    if (!(input instanceof Uint8Array)) return false;
    return input.length === 20;
  },
  {
    identifier: "AddressType",
    description: "Ethereum address (20-byte Uint8Array)",
  }
);

/**
 * Transform schema from hex string to AddressType.
 * Validates hex format and converts to bytes.
 */
export const AddressFromHexSchema = Schema.transform(
  Schema.String.pipe(
    Schema.pattern(/^0x[0-9a-fA-F]{40}$/)
  ),
  AddressTypeSchema,
  {
    decode: (hex) => {
      const bytes = new Uint8Array(20);
      for (let i = 0; i < 20; i++) {
        bytes[i] = parseInt(hex.slice(2 + i * 2, 4 + i * 2), 16);
      }
      return bytes as AddressType;
    },
    encode: (addr) => {
      return "0x" + Array.from(addr, b => b.toString(16).padStart(2, "0")).join("");
    },
  }
);
```

Update consuming files:
```typescript
// src/primitives/Address/Hex.ts
import { AddressTypeSchema } from "./AddressSchema.js";

// src/primitives/Address/Checksummed.ts
import { AddressTypeSchema } from "./AddressSchema.js";

// src/primitives/Address/Bytes.ts
import { AddressTypeSchema } from "./AddressSchema.js";
```
</solution>

<implementation>
<steps>
1. Create `src/primitives/Address/AddressSchema.ts` with canonical schema definition
2. Remove `const AddressTypeSchema` declarations from Hex.ts, Checksummed.ts, Bytes.ts
3. Add `import { AddressTypeSchema } from "./AddressSchema.js"` to each file
4. Export from index.ts: `export { AddressTypeSchema, AddressFromHexSchema } from "./AddressSchema.js"`
5. Verify no import cycles with `pnpm build`
6. Run tests to ensure no regressions
</steps>

<patterns>
- **Effect Schema single source of truth**: One canonical schema definition per type
- **Schema composition via transforms**: Build complex schemas from simple ones
- **Branded type validation in Schema.declare**: Use type guards for branded types
- **Separate schema file pattern**: Keep schema definitions in dedicated files
</patterns>

<viem_reference>
Viem uses a similar pattern with shared validation utilities:
- [src/utils/address/isAddress.ts](https://github.com/wevm/viem/blob/main/src/utils/address/isAddress.ts) - Single address validation function
- The validation is used by all address-related functions rather than duplicated
</viem_reference>

<voltaire_reference>
- [src/primitives/Address/assertValid.js](file:///Users/williamcory/voltaire/src/primitives/Address/assertValid.js) - Core validation logic
- [voltaire-effect/src/primitives/Address/](file:///Users/williamcory/voltaire/voltaire-effect/src/primitives/Address/) - Effect wrappers
</voltaire_reference>
</implementation>

<tests>
```typescript
// src/primitives/Address/AddressSchema.test.ts
import { describe, it, expect } from "vitest";
import * as Schema from "effect/Schema";
import { AddressTypeSchema, AddressFromHexSchema } from "./AddressSchema.js";
import { Effect } from "effect";

describe("AddressTypeSchema", () => {
  describe("validation", () => {
    it("validates 20-byte Uint8Array", () => {
      const valid = new Uint8Array(20);
      expect(Schema.is(AddressTypeSchema)(valid)).toBe(true);
    });

    it("validates address with non-zero bytes", () => {
      const addr = new Uint8Array(20).fill(0xab);
      expect(Schema.is(AddressTypeSchema)(addr)).toBe(true);
    });

    it("rejects 19-byte array", () => {
      expect(Schema.is(AddressTypeSchema)(new Uint8Array(19))).toBe(false);
    });

    it("rejects 21-byte array", () => {
      expect(Schema.is(AddressTypeSchema)(new Uint8Array(21))).toBe(false);
    });

    it("rejects empty array", () => {
      expect(Schema.is(AddressTypeSchema)(new Uint8Array(0))).toBe(false);
    });

    it("rejects hex string", () => {
      expect(Schema.is(AddressTypeSchema)("0x" + "00".repeat(20))).toBe(false);
    });

    it("rejects null", () => {
      expect(Schema.is(AddressTypeSchema)(null)).toBe(false);
    });

    it("rejects undefined", () => {
      expect(Schema.is(AddressTypeSchema)(undefined)).toBe(false);
    });

    it("rejects regular Array", () => {
      expect(Schema.is(AddressTypeSchema)(Array(20).fill(0))).toBe(false);
    });
  });
});

describe("AddressFromHexSchema", () => {
  describe("decode", () => {
    it("decodes valid checksummed address", async () => {
      const hex = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"; // vitalik.eth
      const result = await Effect.runPromise(
        Schema.decodeUnknown(AddressFromHexSchema)(hex)
      );
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result.length).toBe(20);
    });

    it("decodes lowercase address", async () => {
      const hex = "0x" + "ab".repeat(20);
      const result = await Effect.runPromise(
        Schema.decodeUnknown(AddressFromHexSchema)(hex)
      );
      expect(result[0]).toBe(0xab);
    });

    it("decodes uppercase address", async () => {
      const hex = "0x" + "AB".repeat(20);
      const result = await Effect.runPromise(
        Schema.decodeUnknown(AddressFromHexSchema)(hex)
      );
      expect(result[0]).toBe(0xab);
    });

    it("rejects short hex", async () => {
      const hex = "0x" + "ab".repeat(19);
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(AddressFromHexSchema)(hex))
      );
      expect(result._tag).toBe("Left");
    });

    it("rejects long hex", async () => {
      const hex = "0x" + "ab".repeat(21);
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(AddressFromHexSchema)(hex))
      );
      expect(result._tag).toBe("Left");
    });

    it("rejects missing 0x prefix", async () => {
      const hex = "ab".repeat(20);
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(AddressFromHexSchema)(hex))
      );
      expect(result._tag).toBe("Left");
    });
  });

  describe("encode", () => {
    it("encodes to lowercase hex", async () => {
      const addr = new Uint8Array(20).fill(0xab);
      const result = await Effect.runPromise(
        Schema.encode(AddressFromHexSchema)(addr as any)
      );
      expect(result).toBe("0x" + "ab".repeat(20));
    });

    it("encodes zero address", async () => {
      const addr = new Uint8Array(20).fill(0);
      const result = await Effect.runPromise(
        Schema.encode(AddressFromHexSchema)(addr as any)
      );
      expect(result).toBe("0x" + "00".repeat(20));
    });
  });

  describe("roundtrip", () => {
    it("roundtrips vitalik.eth address", async () => {
      const original = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045";
      const decoded = await Effect.runPromise(
        Schema.decodeUnknown(AddressFromHexSchema)(original)
      );
      const encoded = await Effect.runPromise(
        Schema.encode(AddressFromHexSchema)(decoded)
      );
      expect(encoded.toLowerCase()).toBe(original.toLowerCase());
    });
  });
});
```
</tests>

<docs>
Update module documentation to reference single schema source:

```typescript
/**
 * @module AddressSchema
 * 
 * Provides Effect Schema definitions for Ethereum address validation.
 * This is the single source of truth for address schemas - all other
 * modules should import from here rather than defining their own.
 * 
 * ## Schemas
 * 
 * - `AddressTypeSchema` - Validates that a value is a 20-byte Uint8Array
 * - `AddressFromHexSchema` - Transforms hex strings to/from AddressType
 * 
 * ## Usage
 * 
 * ```typescript
 * import { AddressTypeSchema, AddressFromHexSchema } from './AddressSchema.js'
 * import * as Schema from 'effect/Schema'
 * import { Effect } from 'effect'
 * 
 * // Validate existing Uint8Array
 * const isValid = Schema.is(AddressTypeSchema)(data)
 * 
 * // Parse from hex string
 * const parsed = await Effect.runPromise(
 *   Schema.decodeUnknown(AddressFromHexSchema)("0x...")
 * )
 * ```
 * 
 * @see https://effect.website/docs/schema/introduction
 */
```
</docs>

<api>
<before>
```typescript
// Must import schema from specific files or re-declare
import { AddressTypeSchema } from "./Hex.js"; // or Bytes.js or Checksummed.js
// Risk: each file may have divergent validation logic
```
</before>

<after>
```typescript
// Single canonical export
import { AddressTypeSchema, AddressFromHexSchema } from "voltaire-effect/primitives/Address";
import * as Schema from "effect/Schema";

// Type validation
const isValid = Schema.is(AddressTypeSchema)(data);

// Parse from hex
const address = await Effect.runPromise(
  Schema.decodeUnknown(AddressFromHexSchema)("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
);
```
</after>
</api>

<acceptance_criteria>
- [ ] Create `AddressSchema.ts` with single `AddressTypeSchema` definition
- [ ] Create `AddressFromHexSchema` for hex string transformation
- [ ] Remove duplicate declarations from Hex.ts, Checksummed.ts, Bytes.ts
- [ ] Update imports in all consuming files
- [ ] Export both schemas from index.ts
- [ ] Verify no circular dependencies
- [ ] All existing tests pass
- [ ] Add new tests for both schemas
- [ ] `pnpm build` succeeds
- [ ] `pnpm test` passes
</acceptance_criteria>

<references>
- [Effect Schema documentation](https://effect.website/docs/schema/introduction)
- [EIP-55: Mixed-case checksum address encoding](https://eips.ethereum.org/EIPS/eip-55)
- [Review 076: Use Effect Schema for types](file:///Users/williamcory/voltaire/voltaire-effect/reviews/076-use-effect-schema-for-types.md)
- [Viem isAddress](https://github.com/wevm/viem/blob/main/src/utils/address/isAddress.ts)
</references>
</issue>
