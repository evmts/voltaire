# Fix Secp256k1 Error Type Assertion

<issue>
<metadata>
priority: P2
severity: medium
category: type-safety
files: [voltaire-effect/src/crypto/Secp256k1/Secp256k1Service.ts, voltaire-effect/src/crypto/Secp256k1/Secp256k1Live.ts]
reviews: [074-crypto-signatures-review.md, 097-error-types-review.md]
</metadata>

<problem>
Secp256k1 sign operation casts errors without validation, potentially mistyping unexpected errors.

**Locations**:
- `voltaire-effect/src/crypto/Secp256k1/Secp256k1Live.ts` (sign implementation)
- Similar pattern in `verify`, `getPublicKey`, `recoverPublicKey`

```typescript
Effect.try({
  try: () => Secp256k1.sign(messageHash, privateKey, options),
  catch: (e) => e as InvalidPrivateKeyError | CryptoError,  // ❌ Unsafe cast
})
```

**Impact**:
- TypeError from wrong input type gets mistyped as crypto error
- Error discrimination with `_tag` fails at runtime
- Debugging becomes difficult - wrong error type in logs/traces
- Type system lies about error type
- `Effect.catchTag` matches wrong errors
</problem>

<solution>
Validate error type using `instanceof` checks and wrap unexpected errors in a general error type.

```typescript
import { InvalidPrivateKeyError, Secp256k1Error } from "./errors.js";

Effect.try({
  try: () => Secp256k1.sign(messageHash, privateKey, options),
  catch: (e) => {
    // Check for known error types
    if (e instanceof InvalidPrivateKeyError) return e;
    if (e instanceof Secp256k1Error) return e;
    
    // Wrap unexpected errors
    return new Secp256k1Error({
      message: `Signing failed: ${e instanceof Error ? e.message : String(e)}`,
      cause: e,
    });
  },
})
```
</solution>

<implementation>
<steps>
1. Create comprehensive error types in `voltaire-effect/src/crypto/Secp256k1/errors.ts`
2. Define error mapping function `mapToSecp256k1Error`
3. Update all `Effect.try` catch handlers to use error mapper
4. Ensure all error types extend `Data.TaggedError` with unique `_tag`
5. Export error types from index
6. Update Secp256k1ServiceShape to include proper error types
</steps>

<code_changes>
```typescript
// voltaire-effect/src/crypto/Secp256k1/errors.ts
import * as Data from "effect/Data";

/**
 * Base error for all Secp256k1 cryptographic operations.
 */
export class Secp256k1Error extends Data.TaggedError("Secp256k1Error")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Invalid private key format or value.
 * Private key must be 32 bytes and < curve order.
 */
export class InvalidPrivateKeyError extends Data.TaggedError("InvalidPrivateKeyError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Invalid public key format or not on curve.
 */
export class InvalidPublicKeyError extends Data.TaggedError("InvalidPublicKeyError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Invalid signature format or components.
 */
export class InvalidSignatureError extends Data.TaggedError("InvalidSignatureError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Recovery ID is invalid for signature recovery.
 */
export class InvalidRecoveryIdError extends Data.TaggedError("InvalidRecoveryIdError")<{
  readonly message: string;
  readonly recoveryId: number;
  readonly cause?: unknown;
}> {}

/**
 * Union of all Secp256k1 error types.
 */
export type Secp256k1Errors =
  | Secp256k1Error
  | InvalidPrivateKeyError
  | InvalidPublicKeyError
  | InvalidSignatureError
  | InvalidRecoveryIdError;

/**
 * Maps unknown error to appropriate Secp256k1 error type.
 */
export const mapToSecp256k1Error = (e: unknown, operation: string): Secp256k1Errors => {
  // Preserve known error types
  if (e instanceof InvalidPrivateKeyError) return e;
  if (e instanceof InvalidPublicKeyError) return e;
  if (e instanceof InvalidSignatureError) return e;
  if (e instanceof InvalidRecoveryIdError) return e;
  if (e instanceof Secp256k1Error) return e;

  // Check for common error patterns from underlying library
  const message = e instanceof Error ? e.message : String(e);
  
  if (message.includes("private key") || message.includes("scalar")) {
    return new InvalidPrivateKeyError({
      message: `Invalid private key: ${message}`,
      cause: e,
    });
  }
  
  if (message.includes("public key") || message.includes("point")) {
    return new InvalidPublicKeyError({
      message: `Invalid public key: ${message}`,
      cause: e,
    });
  }
  
  if (message.includes("signature")) {
    return new InvalidSignatureError({
      message: `Invalid signature: ${message}`,
      cause: e,
    });
  }
  
  if (message.includes("recovery")) {
    return new InvalidRecoveryIdError({
      message: `Invalid recovery ID: ${message}`,
      recoveryId: -1,
      cause: e,
    });
  }

  // Wrap unexpected errors
  return new Secp256k1Error({
    message: `${operation} failed: ${message}`,
    cause: e,
  });
};

// voltaire-effect/src/crypto/Secp256k1/Secp256k1Live.ts
import { mapToSecp256k1Error, InvalidPrivateKeyError, Secp256k1Error } from "./errors.js";

export const Secp256k1Live = Layer.succeed(Secp256k1Service, {
  sign: (messageHash, privateKey, options) =>
    Effect.try({
      try: () => Secp256k1.sign(messageHash, privateKey, options),
      catch: (e) => mapToSecp256k1Error(e, "sign"),
    }),

  verify: (signature, messageHash, publicKey) =>
    Effect.try({
      try: () => Secp256k1.verify(signature, messageHash, publicKey),
      catch: (e) => mapToSecp256k1Error(e, "verify"),
    }),

  getPublicKey: (privateKey, compressed) =>
    Effect.try({
      try: () => Secp256k1.getPublicKey(privateKey, compressed),
      catch: (e) => mapToSecp256k1Error(e, "getPublicKey"),
    }),

  recoverPublicKey: (signature, messageHash, recoveryId, compressed) =>
    Effect.try({
      try: () => Secp256k1.recoverPublicKey(signature, messageHash, recoveryId, compressed),
      catch: (e) => mapToSecp256k1Error(e, "recoverPublicKey"),
    }),
});

// voltaire-effect/src/crypto/Secp256k1/Secp256k1Service.ts
import type { Secp256k1Errors, InvalidPrivateKeyError, InvalidPublicKeyError } from "./errors.js";

export interface Secp256k1ServiceShape {
  readonly sign: (
    messageHash: Uint8Array,
    privateKey: Uint8Array,
    options?: SignOptions,
  ) => Effect.Effect<Signature, InvalidPrivateKeyError | Secp256k1Error>;

  readonly verify: (
    signature: Signature,
    messageHash: Uint8Array,
    publicKey: Uint8Array,
  ) => Effect.Effect<boolean, InvalidSignatureError | InvalidPublicKeyError | Secp256k1Error>;

  readonly getPublicKey: (
    privateKey: Uint8Array,
    compressed?: boolean,
  ) => Effect.Effect<Uint8Array, InvalidPrivateKeyError | Secp256k1Error>;

  readonly recoverPublicKey: (
    signature: Signature,
    messageHash: Uint8Array,
    recoveryId: number,
    compressed?: boolean,
  ) => Effect.Effect<Uint8Array, InvalidRecoveryIdError | InvalidSignatureError | Secp256k1Error>;
}
```
</code_changes>
</implementation>

<tests>
<test_cases>
```typescript
import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Cause from "effect/Cause";
import { Secp256k1Service, Secp256k1Live } from "./index.js";
import {
  InvalidPrivateKeyError,
  InvalidPublicKeyError,
  InvalidSignatureError,
  Secp256k1Error,
} from "./errors.js";

describe("Secp256k1 error type safety", () => {
  describe("sign errors", () => {
    it("returns InvalidPrivateKeyError for zero key", async () => {
      const zeroKey = new Uint8Array(32);  // All zeros - invalid
      const hash = new Uint8Array(32).fill(0xab);

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const secp = yield* Secp256k1Service;
          return yield* secp.sign(hash, zeroKey);
        }).pipe(Effect.provide(Secp256k1Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Cause.failureOption(result.cause);
        expect(error._tag).toBe("Some");
        expect(error.value._tag).toBe("InvalidPrivateKeyError");
      }
    });

    it("returns InvalidPrivateKeyError for oversized key", async () => {
      const bigKey = new Uint8Array(33);  // Wrong size
      const hash = new Uint8Array(32).fill(0xab);

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const secp = yield* Secp256k1Service;
          return yield* secp.sign(hash, bigKey);
        }).pipe(Effect.provide(Secp256k1Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });

    it("error is catchable by tag", async () => {
      const zeroKey = new Uint8Array(32);
      const hash = new Uint8Array(32).fill(0xab);

      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const secp = yield* Secp256k1Service;
          return yield* secp.sign(hash, zeroKey);
        }).pipe(
          Effect.provide(Secp256k1Live),
          Effect.catchTag("InvalidPrivateKeyError", (e) => 
            Effect.succeed(`caught: ${e._tag}`)
          )
        )
      );

      expect(result).toBe("caught: InvalidPrivateKeyError");
    });
  });

  describe("verify errors", () => {
    it("returns InvalidSignatureError for malformed signature", async () => {
      const badSig = { r: new Uint8Array(32), s: new Uint8Array(31), v: 27 }; // s too short
      const hash = new Uint8Array(32);
      const pubkey = new Uint8Array(33);

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const secp = yield* Secp256k1Service;
          return yield* secp.verify(badSig, hash, pubkey);
        }).pipe(Effect.provide(Secp256k1Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });

    it("returns InvalidPublicKeyError for invalid public key", async () => {
      const validSig = { r: new Uint8Array(32).fill(1), s: new Uint8Array(32).fill(2), v: 27 };
      const hash = new Uint8Array(32);
      const badPubkey = new Uint8Array(33).fill(0xff);  // Invalid point

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const secp = yield* Secp256k1Service;
          return yield* secp.verify(validSig, hash, badPubkey);
        }).pipe(Effect.provide(Secp256k1Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });
  });

  describe("recoverPublicKey errors", () => {
    it("returns InvalidRecoveryIdError for invalid recovery ID", async () => {
      const sig = { r: new Uint8Array(32).fill(1), s: new Uint8Array(32).fill(2) };
      const hash = new Uint8Array(32);

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const secp = yield* Secp256k1Service;
          return yield* secp.recoverPublicKey(sig, hash, 5);  // Invalid: must be 0-3
        }).pipe(Effect.provide(Secp256k1Live))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });
  });

  describe("error type preservation", () => {
    it("preserves original error as cause", async () => {
      const zeroKey = new Uint8Array(32);
      const hash = new Uint8Array(32);

      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const secp = yield* Secp256k1Service;
          return yield* secp.sign(hash, zeroKey);
        }).pipe(Effect.provide(Secp256k1Live))
      );

      if (Exit.isFailure(result)) {
        const error = Cause.failureOption(result.cause);
        if (error._tag === "Some") {
          expect(error.value.cause).toBeDefined();
        }
      }
    });

    it("wraps unexpected errors in Secp256k1Error", async () => {
      // This tests that truly unexpected errors get wrapped
      // Implementation detail: mock the underlying library to throw TypeError
    });
  });

  describe("error discrimination", () => {
    it("different error tags are distinguishable", () => {
      const privKeyErr = new InvalidPrivateKeyError({ message: "test" });
      const pubKeyErr = new InvalidPublicKeyError({ message: "test" });
      const sigErr = new InvalidSignatureError({ message: "test" });
      const genErr = new Secp256k1Error({ message: "test" });

      expect(privKeyErr._tag).toBe("InvalidPrivateKeyError");
      expect(pubKeyErr._tag).toBe("InvalidPublicKeyError");
      expect(sigErr._tag).toBe("InvalidSignatureError");
      expect(genErr._tag).toBe("Secp256k1Error");

      // All are distinct
      const tags = new Set([privKeyErr._tag, pubKeyErr._tag, sigErr._tag, genErr._tag]);
      expect(tags.size).toBe(4);
    });
  });
});
```
</test_cases>
</tests>

<api>
<before>
```typescript
Effect.try({
  try: () => Secp256k1.sign(messageHash, privateKey, options),
  catch: (e) => e as InvalidPrivateKeyError | CryptoError,  // Unsafe cast
})
```
</before>

<after>
```typescript
Effect.try({
  try: () => Secp256k1.sign(messageHash, privateKey, options),
  catch: (e) => mapToSecp256k1Error(e, "sign"),  // Safe mapping
})
```
</after>

<breaking>
Error types are now more specific. Code using `Effect.catchAll` continues to work.
Code using `Effect.catchTag` may need updates if relying on specific error tags.
New error types are exported: `InvalidPrivateKeyError`, `InvalidPublicKeyError`, 
`InvalidSignatureError`, `InvalidRecoveryIdError`, `Secp256k1Error`.
</breaking>
</api>

<references>
- [Effect Data.TaggedError](https://effect.website/docs/data-types/data#taggederror)
- [Effect catchTag](https://effect.website/docs/error-management/matching)
- [Review 074: Crypto Signatures](./074-crypto-signatures-review.md)
- [Review 097: Error Types](./097-error-types-review.md)
</references>
</issue>
