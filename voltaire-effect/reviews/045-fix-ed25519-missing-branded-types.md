# Fix Ed25519 Service Missing Branded Types

<issue>
<metadata>
priority: P2
files: [voltaire-effect/src/crypto/Ed25519/Ed25519Service.ts, src/crypto/Ed25519/PublicKey.ts, src/crypto/Ed25519/SecretKey.ts, src/crypto/Ed25519/Signature.ts]
reviews: [098-x25519-p256-review.md, 076-use-effect-schema-for-types.md]
</metadata>

<problem>
Ed25519Service returns raw `Uint8Array` types instead of branded types, losing compile-time type safety.

**Location**: `voltaire-effect/src/crypto/Ed25519/Ed25519Service.ts`

```typescript
// Current (WRONG):
export interface Ed25519ServiceShape {
  readonly sign: (
    message: Uint8Array,
    secretKey: Uint8Array,        // ❌ Should be Ed25519SecretKey
  ) => Effect.Effect<Uint8Array, ...>;  // ❌ Should return Ed25519Signature

  readonly getPublicKey: (
    secretKey: Uint8Array,        // ❌ Should be Ed25519SecretKey
  ) => Effect.Effect<Uint8Array, ...>;  // ❌ Should return Ed25519PublicKey
  
  readonly verify: (
    signature: Uint8Array,        // ❌ Should be Ed25519Signature
    message: Uint8Array,
    publicKey: Uint8Array,        // ❌ Should be Ed25519PublicKey
  ) => Effect.Effect<boolean, ...>;
}
```

**Base library types (unbranded)**:
```typescript
// src/crypto/Ed25519/PublicKey.ts
export type PublicKey = Uint8Array;  // No brand!

// src/crypto/Ed25519/SecretKey.ts
export type SecretKey = Uint8Array;  // No brand!

// src/crypto/Ed25519/Signature.ts
export type Signature = Uint8Array;  // No brand!
```

**Impact**:
- Can accidentally pass a public key where a secret key is expected
- Can pass an ECDSA signature where an Ed25519 signature is expected
- Type system provides false sense of security
- Runtime errors instead of compile-time errors
- Inconsistent with primitives like Address which use branded types
</problem>

<solution>
Create branded types using Effect's Brand module, following the pattern from `src/primitives/Signature/effect.ts`.

**Step 1: Define branded types in base crypto module**:
```typescript
// src/crypto/Ed25519/Ed25519Types.ts
import * as Brand from "effect/Brand";

/**
 * Ed25519 public key (32 bytes, branded)
 */
export type Ed25519PublicKey = Uint8Array & Brand.Brand<"Ed25519PublicKey">;

export const Ed25519PublicKey = Brand.refined<Ed25519PublicKey>(
  (bytes): bytes is Uint8Array & Brand.Brand<"Ed25519PublicKey"> =>
    bytes instanceof Uint8Array && bytes.length === 32,
  (bytes) => Brand.error(`Expected 32-byte Ed25519 public key, got ${bytes.length} bytes`)
);

/**
 * Ed25519 secret key (32 bytes seed, branded)
 */
export type Ed25519SecretKey = Uint8Array & Brand.Brand<"Ed25519SecretKey">;

export const Ed25519SecretKey = Brand.refined<Ed25519SecretKey>(
  (bytes): bytes is Uint8Array & Brand.Brand<"Ed25519SecretKey"> =>
    bytes instanceof Uint8Array && bytes.length === 32,
  (bytes) => Brand.error(`Expected 32-byte Ed25519 secret key, got ${bytes.length} bytes`)
);

/**
 * Ed25519 signature (64 bytes, branded)
 */
export type Ed25519Signature = Uint8Array & Brand.Brand<"Ed25519Signature">;

export const Ed25519Signature = Brand.refined<Ed25519Signature>(
  (bytes): bytes is Uint8Array & Brand.Brand<"Ed25519Signature"> =>
    bytes instanceof Uint8Array && bytes.length === 64,
  (bytes) => Brand.error(`Expected 64-byte Ed25519 signature, got ${bytes.length} bytes`)
);
```

**Step 2: Add Schema classes for validation**:
```typescript
// src/crypto/Ed25519/Ed25519Schema.ts
import * as Schema from "effect/Schema";
import { Ed25519PublicKey, Ed25519SecretKey, Ed25519Signature } from "./Ed25519Types.js";

export class Ed25519PublicKeySchema extends Schema.Class<Ed25519PublicKeySchema>("Ed25519PublicKey")({
  value: Schema.Uint8ArrayFromSelf.pipe(
    Schema.filter((bytes): bytes is Uint8Array => 
      bytes instanceof Uint8Array && bytes.length === 32,
      { message: () => "Expected 32-byte Ed25519 public key" }
    ),
  ),
}) {
  get branded(): Ed25519PublicKey {
    return this.value as Ed25519PublicKey;
  }
  
  static from(bytes: Uint8Array): Ed25519PublicKeySchema {
    return new Ed25519PublicKeySchema({ value: bytes });
  }
}

export class Ed25519SecretKeySchema extends Schema.Class<Ed25519SecretKeySchema>("Ed25519SecretKey")({
  value: Schema.Uint8ArrayFromSelf.pipe(
    Schema.filter((bytes): bytes is Uint8Array => 
      bytes instanceof Uint8Array && bytes.length === 32,
      { message: () => "Expected 32-byte Ed25519 secret key" }
    ),
  ),
}) {
  get branded(): Ed25519SecretKey {
    return this.value as Ed25519SecretKey;
  }
}

export class Ed25519SignatureSchema extends Schema.Class<Ed25519SignatureSchema>("Ed25519Signature")({
  value: Schema.Uint8ArrayFromSelf.pipe(
    Schema.filter((bytes): bytes is Uint8Array => 
      bytes instanceof Uint8Array && bytes.length === 64,
      { message: () => "Expected 64-byte Ed25519 signature" }
    ),
  ),
}) {
  get branded(): Ed25519Signature {
    return this.value as Ed25519Signature;
  }
}
```

**Step 3: Update Ed25519ServiceShape**:
```typescript
// voltaire-effect/src/crypto/Ed25519/Ed25519Service.ts
import type { Ed25519PublicKey, Ed25519SecretKey, Ed25519Signature } from "@tevm/voltaire/Ed25519";
import type { InvalidSecretKeyError, InvalidSignatureError, InvalidPublicKeyError, Ed25519Error } from "./errors.js";

export interface Ed25519ServiceShape {
  readonly sign: (
    message: Uint8Array,
    secretKey: Ed25519SecretKey,
  ) => Effect.Effect<Ed25519Signature, InvalidSecretKeyError | Ed25519Error>;

  readonly verify: (
    signature: Ed25519Signature,
    message: Uint8Array,
    publicKey: Ed25519PublicKey,
  ) => Effect.Effect<boolean, InvalidSignatureError | InvalidPublicKeyError | Ed25519Error>;

  readonly getPublicKey: (
    secretKey: Ed25519SecretKey,
  ) => Effect.Effect<Ed25519PublicKey, InvalidSecretKeyError | Ed25519Error>;
  
  readonly generateKeyPair: () => Effect.Effect<
    { publicKey: Ed25519PublicKey; secretKey: Ed25519SecretKey },
    Ed25519Error
  >;
}
```

**Step 4: Update implementation to return branded types**:
```typescript
// In Ed25519Live layer
sign: (message, secretKey) =>
  Effect.try({
    try: () => {
      const sig = Ed25519.sign(message, secretKey);
      return Ed25519Signature(sig);  // Apply brand
    },
    catch: (e) => mapToEd25519Error(e),
  }),

getPublicKey: (secretKey) =>
  Effect.try({
    try: () => {
      const pk = Ed25519.getPublicKey(secretKey);
      return Ed25519PublicKey(pk);  // Apply brand
    },
    catch: (e) => mapToEd25519Error(e),
  }),
```
</solution>

<implementation>
<steps>
1. Create `src/crypto/Ed25519/Ed25519Types.ts` with Brand definitions
2. Create `src/crypto/Ed25519/Ed25519Schema.ts` with Schema classes
3. Export branded types from `src/crypto/Ed25519/index.ts`
4. Update `voltaire-effect/src/crypto/Ed25519/Ed25519Service.ts` interface
5. Update `Ed25519Live` layer to apply brands to return values
6. Update `Ed25519Test` layer to return properly branded mocks
7. Update all call sites in tests (may need explicit casts for test data)
8. Add type tests to verify branded types prevent misuse
</steps>

<patterns>
**Effect Brand pattern** (from `src/primitives/Address/effect.ts`):
```typescript
import * as Brand from "effect/Brand";

export type AddressBrand = Uint8Array & Brand.Brand<"Address">;

export const AddressBrand = Brand.refined<AddressBrand>(
  (bytes): bytes is Uint8Array & Brand.Brand<"Address"> =>
    bytes instanceof Uint8Array && bytes.length === 20,
  (bytes) => Brand.error(`Expected 20-byte Uint8Array, got ${bytes?.length ?? 'undefined'}`)
);
```

**Schema integration pattern** (from `src/primitives/Signature/effect.ts`):
```typescript
export class SignatureSchema extends Schema.Class<SignatureSchema>("Signature")({
  value: Schema.Uint8ArrayFromSelf.pipe(
    Schema.filter((bytes): bytes is Uint8Array => _is(bytes), {
      message: () => "Invalid signature",
    }),
  ),
}) {
  get branded(): SignatureBrand {
    return this.value as SignatureBrand;
  }
}
```

**Type branding with zero runtime cost**:
```typescript
// The brand is purely a type-level construct
// These two are identical at runtime:
const unbranded: Uint8Array = new Uint8Array(32);
const branded: Ed25519PublicKey = Ed25519PublicKey(unbranded);

// But the type system distinguishes them:
declare function signWithEd25519(key: Ed25519SecretKey): void;
signWithEd25519(unbranded);  // ❌ Type error!
signWithEd25519(branded);    // ✅ Works (if branded as SecretKey)
```
</patterns>
</implementation>

<tests>
<test_cases>
```typescript
import { describe, it, expect, expectTypeOf } from "vitest";
import * as Effect from "effect/Effect";
import { Ed25519Service, Ed25519Live } from "./Ed25519Service";
import type { Ed25519PublicKey, Ed25519SecretKey, Ed25519Signature } from "./Ed25519Types";

describe("Ed25519 branded types", () => {
  describe("type safety", () => {
    it("sign returns Ed25519Signature branded type", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const ed = yield* Ed25519Service;
          const { secretKey } = yield* ed.generateKeyPair();
          const message = new Uint8Array([1, 2, 3]);
          return yield* ed.sign(message, secretKey);
        }).pipe(Effect.provide(Ed25519Live))
      );
      
      // Runtime check
      expect(result.length).toBe(64);
      expect(result).toBeInstanceOf(Uint8Array);
      
      // Type assertion (compile-time)
      expectTypeOf(result).toMatchTypeOf<Ed25519Signature>();
    });

    it("getPublicKey returns Ed25519PublicKey branded type", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const ed = yield* Ed25519Service;
          const { secretKey } = yield* ed.generateKeyPair();
          return yield* ed.getPublicKey(secretKey);
        }).pipe(Effect.provide(Ed25519Live))
      );
      
      expect(result.length).toBe(32);
      expectTypeOf(result).toMatchTypeOf<Ed25519PublicKey>();
    });

    it("generateKeyPair returns branded types", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const ed = yield* Ed25519Service;
          return yield* ed.generateKeyPair();
        }).pipe(Effect.provide(Ed25519Live))
      );
      
      expect(result.publicKey.length).toBe(32);
      expect(result.secretKey.length).toBe(32);
      expectTypeOf(result.publicKey).toMatchTypeOf<Ed25519PublicKey>();
      expectTypeOf(result.secretKey).toMatchTypeOf<Ed25519SecretKey>();
    });
  });

  describe("brand validation", () => {
    it("Ed25519PublicKey rejects wrong length", () => {
      const wrongLength = new Uint8Array(31);
      expect(() => Ed25519PublicKey(wrongLength)).toThrow(/32-byte/);
    });

    it("Ed25519SecretKey rejects wrong length", () => {
      const wrongLength = new Uint8Array(33);
      expect(() => Ed25519SecretKey(wrongLength)).toThrow(/32-byte/);
    });

    it("Ed25519Signature rejects wrong length", () => {
      const wrongLength = new Uint8Array(65);
      expect(() => Ed25519Signature(wrongLength)).toThrow(/64-byte/);
    });
  });

  describe("type discrimination", () => {
    it("prevents passing public key as secret key", () => {
      // This test verifies the type system at compile time
      // The following would be a type error:
      // 
      // const publicKey: Ed25519PublicKey = ...;
      // ed.sign(message, publicKey);  // ❌ Type error!
      //
      // We verify this by checking the branded type structures differ
      type PK = Ed25519PublicKey extends Ed25519SecretKey ? true : false;
      type SK = Ed25519SecretKey extends Ed25519PublicKey ? true : false;
      
      // Brands should NOT be assignable to each other
      const pkNotSk: PK = false as const;
      const skNotPk: SK = false as const;
      expect(pkNotSk).toBe(false);
      expect(skNotPk).toBe(false);
    });
  });

  describe("schema validation", () => {
    it("Ed25519PublicKeySchema validates and brands", () => {
      const bytes = new Uint8Array(32).fill(0x42);
      const schema = Ed25519PublicKeySchema.from(bytes);
      
      expect(schema.value).toBe(bytes);
      expectTypeOf(schema.branded).toMatchTypeOf<Ed25519PublicKey>();
    });

    it("Ed25519SignatureSchema validates length", () => {
      const validSig = new Uint8Array(64).fill(0xaa);
      const schema = Ed25519SignatureSchema.from(validSig);
      expect(schema.branded.length).toBe(64);
    });
  });

  describe("round-trip signing", () => {
    it("signs and verifies with branded types", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const ed = yield* Ed25519Service;
          
          // Generate branded key pair
          const { publicKey, secretKey } = yield* ed.generateKeyPair();
          
          // Sign with branded secret key
          const message = new Uint8Array([0xde, 0xad, 0xbe, 0xef]);
          const signature = yield* ed.sign(message, secretKey);
          
          // Verify with branded public key and signature
          const valid = yield* ed.verify(signature, message, publicKey);
          return valid;
        }).pipe(Effect.provide(Ed25519Live))
      );
      
      expect(result).toBe(true);
    });
  });
});
```
</test_cases>
</tests>

<docs>
**JSDoc for branded types**:
```typescript
/**
 * Ed25519 public key (32 bytes).
 * 
 * Branded type that prevents accidental misuse with other Uint8Array types.
 * Use `Ed25519PublicKey(bytes)` to create from raw bytes after validation.
 * 
 * @example
 * ```typescript
 * const publicKey = Ed25519PublicKey(rawBytes);
 * const isValid = await Effect.runPromise(
 *   ed25519.verify(signature, message, publicKey)
 * );
 * ```
 * 
 * @see {@link Ed25519SecretKey} - Corresponding secret key type
 * @see {@link Ed25519Signature} - Signature produced by signing
 */
export type Ed25519PublicKey = Uint8Array & Brand.Brand<"Ed25519PublicKey">;
```

**README section**:
```markdown
## Branded Crypto Types

Ed25519 uses branded types to prevent key/signature confusion at compile time:

- `Ed25519PublicKey` - 32-byte public key
- `Ed25519SecretKey` - 32-byte secret key (seed)
- `Ed25519Signature` - 64-byte signature

```typescript
import { Ed25519Service, Ed25519Live } from "voltaire-effect/crypto";
import type { Ed25519SecretKey } from "@tevm/voltaire/Ed25519";

// Type-safe key handling
const program = Effect.gen(function* () {
  const ed = yield* Ed25519Service;
  const { publicKey, secretKey } = yield* ed.generateKeyPair();
  
  // publicKey and secretKey are distinct types
  // You cannot accidentally swap them
  const sig = yield* ed.sign(message, secretKey);  // ✅
  // ed.sign(message, publicKey);  // ❌ Type error!
});
```
```
</docs>

<api>
<before>
```typescript
interface Ed25519ServiceShape {
  readonly sign: (
    message: Uint8Array,
    secretKey: Uint8Array,
  ) => Effect.Effect<Uint8Array, ...>;
  
  readonly getPublicKey: (
    secretKey: Uint8Array,
  ) => Effect.Effect<Uint8Array, ...>;
}
```
</before>
<after>
```typescript
interface Ed25519ServiceShape {
  readonly sign: (
    message: Uint8Array,
    secretKey: Ed25519SecretKey,
  ) => Effect.Effect<Ed25519Signature, InvalidSecretKeyError | Ed25519Error>;
  
  readonly getPublicKey: (
    secretKey: Ed25519SecretKey,
  ) => Effect.Effect<Ed25519PublicKey, InvalidSecretKeyError | Ed25519Error>;
}
```
</after>
</api>

<references>
- [Effect Brand documentation](https://effect.website/docs/data-types/brand)
- [Effect Schema documentation](https://effect.website/docs/schema/introduction)
- [src/primitives/Signature/effect.ts](file:///Users/williamcory/voltaire/src/primitives/Signature/effect.ts) - Existing branded type pattern
- [src/primitives/Address/effect.ts](file:///Users/williamcory/voltaire/src/primitives/Address/effect.ts) - AddressBrand example
- [Review 098: X25519/P256](./098-x25519-p256-review.md) - Related type safety issues
- [Review 076: Use Effect Schema](./076-use-effect-schema-for-types.md) - Schema pattern guidance
</references>
</issue>
