# Effect.ts Wrapper Implementation Guide

<mission>
Implement comprehensive Effect.ts wrappers for all Voltaire primitives following the established Address pattern. This is a long-running task that may take many hours. Work systematically through each primitive, creating type-safe Effect wrappers with proper error handling, services, and layers.
</mission>

<critical_constraints>
- NEVER skip primitives - complete ALL primitives listed
- NEVER break existing functionality - only ADD Effect wrappers
- ALWAYS follow the Address pattern exactly
- ALWAYS run tests after each primitive: `bun test:run -- src/primitives/{Primitive}/effect.test.ts`
- ALWAYS commit after completing each primitive with passing tests
- If tests fail, FIX before moving on - never leave broken code
</critical_constraints>

## Reference Implementation: Address

Study these files as the canonical pattern:

### 1. effect-errors.ts Pattern
```typescript
// src/primitives/Address/effect-errors.ts
import * as Data from "effect/Data";

// Base error class for the primitive
export class AddressError extends Data.TaggedError("AddressError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

// Specific error types with TaggedError
export class InvalidHexFormatError extends Data.TaggedError("InvalidHexFormat")<{
  readonly value: unknown;
  readonly expected?: string;
}> {}

export class InvalidLengthError extends Data.TaggedError("InvalidLength")<{
  readonly value: unknown;
  readonly actualLength: number;
  readonly expectedLength: number;
}> {}

export class InvalidValueError extends Data.TaggedError("InvalidValue")<{
  readonly value: unknown;
  readonly expected: string;
  readonly context?: Record<string, unknown>;
}> {}

export class CryptoOperationError extends Data.TaggedError("CryptoOperationError")<{
  readonly operation: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

// Union types for method-specific errors
export type FromErrors = InvalidValueError | InvalidHexFormatError | InvalidLengthError;
export type FromHexErrors = InvalidHexFormatError | InvalidLengthError;
export type FromBytesErrors = InvalidLengthError;
```

### 2. effect-services.ts Pattern
```typescript
// src/primitives/Address/effect-services.ts
import * as Context from "effect/Context";
import type * as Effect from "effect/Effect";
import type { CryptoOperationError } from "./effect-errors.js";

// Service interface for crypto operations
export interface Keccak256Service {
  readonly hash: (data: Uint8Array) => Effect.Effect<Uint8Array, CryptoOperationError>;
}

// Context tag for dependency injection
export const Keccak256Service = Context.GenericTag<Keccak256Service>(
  "@voltaire/Address/Keccak256"
);
```

### 3. effect-layers.ts Pattern
```typescript
// src/primitives/Address/effect-layers.ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { hash as keccak256Native } from "../../crypto/Keccak256/hash.js";
import { CryptoOperationError } from "./effect-errors.js";
import { Keccak256Service } from "./effect-services.js";

// Live implementation wrapping native code
export const Keccak256ServiceLive = Layer.succeed(
  Keccak256Service,
  Keccak256Service.of({
    hash: (data) =>
      Effect.try({
        try: () => keccak256Native(data),
        catch: (error) =>
          new CryptoOperationError({
            operation: "keccak256",
            message: error instanceof Error ? error.message : String(error),
            cause: error,
          }),
      }),
  })
);

// Test implementation with predictable values
export const Keccak256ServiceTest = Layer.succeed(
  Keccak256Service,
  Keccak256Service.of({
    hash: (data) => Effect.succeed(new Uint8Array(32).fill(0xaa)),
  })
);

// Combined layers
export const ServicesLive = Layer.mergeAll(Keccak256ServiceLive);
export const ServicesTest = Layer.mergeAll(Keccak256ServiceTest);
```

### 4. effect.ts Pattern (Main Schema)
```typescript
// src/primitives/Address/effect.ts
import * as Brand from "effect/Brand";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import type { AddressType as BrandedAddress } from "./AddressType.js";
import * as BrandedImpl from "./internal-index.js";
import { InvalidHexFormatError, InvalidLengthError, type FromErrors } from "./effect-errors.js";
import { Keccak256Service } from "./effect-services.js";

// Effect Brand for type safety
export type AddressBrand = Uint8Array & Brand.Brand<"Address">;

export const AddressBrand = Brand.refined<AddressBrand>(
  (bytes): bytes is Uint8Array & Brand.Brand<"Address"> =>
    bytes instanceof Uint8Array && bytes.length === 20,
  (bytes) => Brand.error(`Expected 20-byte Uint8Array, got ${typeof bytes}`)
);

// Schema.Class with validation
export class AddressSchema extends Schema.Class<AddressSchema>("Address")({
  value: Schema.Uint8ArrayFromSelf.pipe(
    Schema.filter((bytes): bytes is Uint8Array => bytes.length === 20, {
      message: () => "Invalid address: must be 20 bytes",
    })
  ),
}) {
  // Get underlying branded type
  get address(): BrandedAddress {
    return this.value as BrandedAddress;
  }

  get branded(): AddressBrand {
    return this.value as AddressBrand;
  }

  // Zero-cost creation from brand
  static fromBranded(brand: AddressBrand): AddressSchema {
    return new AddressSchema({ value: brand });
  }

  // Constructor returning Effect with typed errors
  static from(value: number | bigint | string | Uint8Array): Effect.Effect<AddressSchema, FromErrors> {
    return Effect.try({
      try: () => {
        const addr = BrandedImpl.from(value);
        return new AddressSchema({ value: addr });
      },
      catch: (error) => {
        if (error instanceof Error) {
          const msg = error.message;
          if (msg.includes("hex")) {
            return new InvalidHexFormatError({ value, expected: "0x-prefixed hex" });
          }
          if (msg.includes("length")) {
            return new InvalidLengthError({
              value,
              actualLength: value instanceof Uint8Array ? value.length : 0,
              expectedLength: 20,
            });
          }
        }
        return new InvalidValueError({ value, expected: "valid input" });
      },
    });
  }

  // Pure method - direct return (no Effect needed)
  toHex(): string {
    return BrandedImpl.toHex(this.address);
  }

  // Method requiring crypto service
  toChecksummed(): Effect.Effect<string, CryptoOperationError, Keccak256Service> {
    const self = this;
    return Effect.gen(function* () {
      const keccak = yield* Keccak256Service;
      const hex = self.toHex().slice(2);
      const hashBytes = yield* keccak.hash(new TextEncoder().encode(hex));
      // ... checksum logic
      return result;
    });
  }
}
```

### 5. effect.test.ts Pattern
```typescript
// src/primitives/Address/effect.test.ts
import * as Effect from "effect/Effect";
import * as Either from "effect/Either";
import { describe, expect, it } from "vitest";
import { InvalidHexFormatError, InvalidLengthError } from "./effect-errors.js";
import { ServicesLive, ServicesTest } from "./effect-layers.js";
import { AddressBrand, AddressSchema } from "./effect.js";

describe("AddressSchema Effect Schema", () => {
  describe("AddressSchema class", () => {
    it("creates from hex string", async () => {
      const effect = AddressSchema.fromHex("0x742d35cc6634c0532925a3b844bc9e7595f251e3");
      const addr = await Effect.runPromise(effect);
      expect(addr.toHex()).toMatch(/^0x[a-f0-9]{40}$/);
    });

    it("rejects invalid hex format", async () => {
      const effect = AddressSchema.fromHex("invalid");
      const result = await Effect.runPromise(Effect.either(effect));
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(InvalidHexFormatError);
      }
    });

    it("works with crypto services", async () => {
      const effect = Effect.gen(function* () {
        const addr = yield* AddressSchema.fromHex("0x...");
        return yield* addr.toChecksummed();
      }).pipe(Effect.provide(ServicesLive));

      const result = await Effect.runPromise(effect);
      expect(result).toContain("0x");
    });

    it("works with test services", async () => {
      const effect = AddressSchema.fromPrivateKey(new Uint8Array(32))
        .pipe(Effect.provide(ServicesTest));
      const addr = await Effect.runPromise(effect);
      expect(addr).toBeDefined();
    });
  });

  describe("Effect Branded Types", () => {
    it("creates brand with validation", () => {
      const bytes = new Uint8Array(20);
      const brand = AddressBrand(bytes);
      expect(brand).toBe(bytes);
    });

    it("rejects invalid brand", () => {
      expect(() => AddressBrand(new Uint8Array(19))).toThrow();
    });
  });
});
```

---

## Implementation Checklist

### Priority 1: Core Primitives (Do These First)

1. **Hex** - Foundation type used everywhere
   - Files: `effect.ts`, `effect-errors.ts`, `effect.test.ts`
   - Methods: `from`, `fromBytes`, `fromNumber`, `toBytes`, `toNumber`
   - No services needed (pure functions)

2. **Bytes** - Raw byte handling
   - Files: `effect.ts`, `effect-errors.ts`, `effect.test.ts`
   - Methods: `from`, `slice`, `concat`, `equals`
   - No services needed

3. **Hash** (Keccak256 result type)
   - Files: `effect.ts`, `effect-errors.ts`, `effect-services.ts`, `effect-layers.ts`, `effect.test.ts`
   - Methods: `from`, `fromHex`, `hash` (requires Keccak256Service)
   - Services: Keccak256Service

4. **Uint8/Uint16/Uint32/Uint64/Uint256**
   - Files for each: `effect.ts`, `effect-errors.ts`, `effect.test.ts`
   - Methods: `from`, `fromBytes`, `fromHex`, `toBytes`, `toHex`, arithmetic
   - Errors: overflow, underflow, invalid size

5. **Signature**
   - Files: `effect.ts`, `effect-errors.ts`, `effect-services.ts`, `effect-layers.ts`, `effect.test.ts`
   - Methods: `from`, `fromRsv`, `recover`, `verify`
   - Services: Secp256k1Service

6. **PrivateKey**
   - Files: `effect.ts`, `effect-errors.ts`, `effect-services.ts`, `effect-layers.ts`, `effect.test.ts`
   - Methods: `from`, `generate`, `toAddress`, `toPublicKey`
   - Services: Secp256k1Service, Keccak256Service

7. **PublicKey**
   - Files: `effect.ts`, `effect-errors.ts`, `effect-services.ts`, `effect-layers.ts`, `effect.test.ts`
   - Methods: `from`, `fromPrivateKey`, `toAddress`, `compress`, `decompress`
   - Services: Secp256k1Service, Keccak256Service

### Priority 2: Transaction Types

8. **Transaction** (all types: Legacy, EIP2930, EIP1559, EIP4844, EIP7702)
   - Files: `effect.ts`, `effect-errors.ts`, `effect-services.ts`, `effect-layers.ts`, `effect.test.ts`
   - Methods: `from`, `serialize`, `deserialize`, `hash`, `sign`, `getSender`
   - Services: Keccak256Service, Secp256k1Service, RlpEncoderService

9. **Authorization** (EIP-7702)
   - Files: Same pattern
   - Methods: `from`, `sign`, `verify`, `getAuthority`

10. **AccessList**
    - Files: Same pattern
    - Methods: `from`, `add`, `contains`

### Priority 3: Block Types

11. **Block**
12. **BlockHeader**
13. **BlockNumber**
14. **BlockHash**

### Priority 4: Receipt/Log Types

15. **Receipt**
16. **EventLog**
17. **BloomFilter**

### Priority 5: Encoding Types

18. **Rlp**
    - Services: RlpEncoderService, RlpDecoderService
19. **Abi** (encoding/decoding)
20. **Base64**

### Priority 6: Domain Types

21. **ChainId**
22. **Denomination** (Wei, Gwei, Ether)
23. **FeeMarket** (EIP-1559 fees)

### Priority 7: Blob Types (EIP-4844)

24. **Blob**
    - Services: KzgService
25. **BlobVersionedHash**
26. **Commitment**
27. **Proof**

### Remaining Primitives
Continue through ALL remaining primitives in `src/primitives/`:
- AccessList, AccountState, Base64, BinaryTree, Bytecode, CallData, CallTrace
- Chain, ChainHead, CompilerVersion, ContractCode, ContractResult
- Domain, DomainSeparator, Ens, Epoch, ErrorSignature, EventSignature
- FeeMarket, FilterId, ForkId, ForwardRequest, FunctionSignature
- GasConstants, Hardfork, etc.

---

## Per-Primitive Implementation Steps

For EACH primitive, follow this exact workflow:

### Step 1: Read Existing Implementation
```bash
# Understand the primitive's structure
cat src/primitives/{Primitive}/index.ts
cat src/primitives/{Primitive}/{Primitive}Type.ts
cat src/primitives/{Primitive}/*.js
```

### Step 2: Create effect-errors.ts
Create typed errors for all failure modes:
```typescript
// src/primitives/{Primitive}/effect-errors.ts
import * as Data from "effect/Data";

export class Invalid{Primitive}Error extends Data.TaggedError("Invalid{Primitive}")<{
  readonly value: unknown;
  readonly message: string;
}> {}

// Add error types for each method that can fail
export type FromErrors = Invalid{Primitive}Error | InvalidHexFormatError;
// etc.
```

### Step 3: Create effect-services.ts (if needed)
Only if the primitive requires crypto or external operations:
```typescript
// src/primitives/{Primitive}/effect-services.ts
import * as Context from "effect/Context";
// Define service interfaces
```

### Step 4: Create effect-layers.ts (if services exist)
```typescript
// src/primitives/{Primitive}/effect-layers.ts
import * as Layer from "effect/Layer";
// Implement Live and Test layers
```

### Step 5: Create effect.ts (Main Schema)
```typescript
// src/primitives/{Primitive}/effect.ts
import * as Brand from "effect/Brand";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
// Implement Schema.Class with all methods
```

### Step 6: Create effect.test.ts
```typescript
// src/primitives/{Primitive}/effect.test.ts
import { describe, expect, it } from "vitest";
import * as Effect from "effect/Effect";
// Comprehensive tests for all methods and error cases
```

### Step 7: Run Tests
```bash
bun test:run -- src/primitives/{Primitive}/effect.test.ts
```

### Step 8: Commit
```bash
git add src/primitives/{Primitive}/effect*.ts
git commit -m "feat({primitive}): Add Effect.ts wrapper

- Add Effect Schema class with typed errors
- Add service interfaces (if needed)
- Add Live and Test layers (if needed)
- Add comprehensive tests

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Common Patterns

### Pure Functions (No Services)
```typescript
static from(value: string): Effect.Effect<{Primitive}Schema, FromErrors> {
  return Effect.try({
    try: () => new {Primitive}Schema({ value: BrandedImpl.from(value) }),
    catch: (error) => mapError(error),
  });
}

// Direct return for pure methods
toHex(): string {
  return BrandedImpl.toHex(this.value);
}
```

### Methods Requiring Services
```typescript
hash(): Effect.Effect<HashType, CryptoOperationError, Keccak256Service> {
  const self = this;
  return Effect.gen(function* () {
    const keccak = yield* Keccak256Service;
    return yield* keccak.hash(self.value);
  });
}
```

### Composing Multiple Services
```typescript
sign(privateKey: PrivateKeySchema): Effect.Effect<
  SignatureSchema,
  SigningError,
  Secp256k1Service | Keccak256Service
> {
  const self = this;
  return Effect.gen(function* () {
    const secp = yield* Secp256k1Service;
    const keccak = yield* Keccak256Service;

    const hash = yield* keccak.hash(self.serialize());
    const sig = yield* secp.sign(hash, privateKey.value);
    return SignatureSchema.fromBranded(sig);
  });
}
```

### Error Mapping
```typescript
catch: (error) => {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes("overflow")) return new OverflowError({ value });
    if (msg.includes("underflow")) return new UnderflowError({ value });
    if (msg.includes("hex")) return new InvalidHexFormatError({ value });
    if (msg.includes("length")) return new InvalidLengthError({ value, actual, expected });
  }
  return new InvalidValueError({ value, expected: "valid input" });
}
```

---

## Progress Tracking

Use TodoWrite to track progress:
```
[ ] Hex - effect wrappers
[ ] Bytes - effect wrappers
[ ] Hash - effect wrappers
[ ] Uint8 - effect wrappers
[ ] Uint16 - effect wrappers
[ ] Uint32 - effect wrappers
[ ] Uint64 - effect wrappers
[ ] Uint256 - effect wrappers
[ ] Signature - effect wrappers
[ ] PrivateKey - effect wrappers
[ ] PublicKey - effect wrappers
[ ] Transaction - effect wrappers
[ ] Authorization - effect wrappers
... (continue for all primitives)
```

---

## Quality Checks

Before marking a primitive complete:

1. **All tests pass**: `bun test:run -- src/primitives/{Primitive}/effect.test.ts`
2. **TypeScript compiles**: `bun run build:dist` (no type errors)
3. **Error types are exhaustive**: Every failure mode has a typed error
4. **Services are documented**: JSDoc on all service interfaces
5. **Tests cover**:
   - Happy path for all constructors
   - Error cases for all failure modes
   - Service integration with Live layers
   - Service mocking with Test layers
   - Brand validation

---

## Notes

- This is a LONG task - expect 20-40+ primitives
- Commit frequently - after each primitive
- If stuck on one primitive, move to the next and return later
- Reuse error types across primitives where they share patterns
- Share services where appropriate (e.g., Keccak256Service used by many)
- The goal is COMPLETE coverage - every primitive gets Effect wrappers
