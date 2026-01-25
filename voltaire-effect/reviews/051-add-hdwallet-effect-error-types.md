# Add HDWallet Effect Error Types

<issue>
<metadata>
priority: P2
severity: medium
category: type-safety
files: [
  voltaire-effect/src/crypto/HDWallet/errors.ts,
  voltaire-effect/src/crypto/HDWallet/HDWalletService.ts,
  voltaire-effect/src/crypto/HDWallet/HDWalletLive.ts,
  voltaire-effect/src/crypto/HDWallet/derive.ts,
  voltaire-effect/src/crypto/HDWallet/fromSeed.ts
]
reviews: [050-fix-bip39-hdwallet-return-type-inconsistency.md, 097-error-types-review.md]
</metadata>

<problem>
HDWallet operations return `Effect.Effect<T, never, HDWalletService>` but underlying operations can fail:
- Invalid derivation paths (e.g., `"m/44'/0"` missing index)
- Invalid seed length (must be 16-64 bytes per BIP-32)
- Hardened derivation from public key (impossible)
- Invalid child index (≥ 2^31 for non-hardened)

**Locations**:
- `voltaire-effect/src/crypto/HDWallet/HDWalletService.ts` - interface declares `never` error
- `voltaire-effect/src/crypto/HDWallet/derive.ts` - throws on invalid path
- `voltaire-effect/src/crypto/HDWallet/fromSeed.ts` - throws on invalid seed

**Impact**:
- The `never` error type is a lie - failures become untyped defects
- Callers cannot handle errors gracefully
- No meaningful user feedback on invalid input
- `Effect.catchTag` cannot be used for recovery
</problem>

<solution>
Create tagged error types using Effect's `Data.TaggedError` pattern.

**Error taxonomy**:
1. `InvalidPathError` - Malformed BIP-32/44 derivation path
2. `InvalidSeedError` - Seed bytes wrong length or invalid
3. `HardenedDerivationError` - Attempted hardened derivation from public key
4. `InvalidKeyError` - Child key derivation produced invalid key material

Each error has unique `_tag` for discriminated error handling.
</solution>

<implementation>
<steps>
1. Create error types file `voltaire-effect/src/crypto/HDWallet/errors.ts`
2. Update `HDWalletServiceShape` interface with error types
3. Update `HDWalletLive` to use `Effect.try` with proper error mapping
4. Update `derive.ts`, `fromSeed.ts`, `fromMnemonic.ts` with error types
5. Add error handling tests
6. Export error types from index
</steps>

<code_changes>
```typescript
// voltaire-effect/src/crypto/HDWallet/errors.ts
import * as Data from "effect/Data";

/**
 * Invalid BIP-32/44 derivation path format.
 * 
 * Valid paths:
 * - "m/44'/60'/0'/0/0" (Ethereum standard)
 * - "m/0'/1/2'/2/1000000000" (BIP-32 example)
 * 
 * Invalid paths:
 * - "m/44/60" (missing apostrophes for hardened)
 * - "/44'/60'" (missing 'm' prefix)
 * - "m/abc" (non-numeric index)
 */
export class InvalidPathError extends Data.TaggedError("InvalidPathError")<{
  readonly path: string;
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Seed bytes invalid for BIP-32 master key derivation.
 * Seed must be 16-64 bytes (128-512 bits) per BIP-32.
 */
export class InvalidSeedError extends Data.TaggedError("InvalidSeedError")<{
  readonly seedLength: number;
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Cannot perform hardened derivation from extended public key.
 * Hardened paths (with ') require private key.
 * 
 * Example:
 * - Public node + "m/0'" → HardenedDerivationError
 * - Public node + "m/0" → OK (non-hardened)
 */
export class HardenedDerivationError extends Data.TaggedError("HardenedDerivationError")<{
  readonly path: string;
  readonly index: number;
  readonly message: string;
}> {}

/**
 * Child key derivation produced invalid key material.
 * This is rare but possible per BIP-32 (< 1 in 2^127).
 */
export class InvalidKeyError extends Data.TaggedError("InvalidKeyError")<{
  readonly message: string;
  readonly cause?: unknown;
}> {}

/**
 * Union of all HDWallet error types.
 */
export type HDWalletError = 
  | InvalidPathError 
  | InvalidSeedError 
  | HardenedDerivationError 
  | InvalidKeyError;

/**
 * Maps unknown error to appropriate HDWallet error type.
 */
export const mapToHDWalletError = (e: unknown, context: {
  path?: string;
  seedLength?: number;
}): HDWalletError => {
  if (e instanceof InvalidPathError) return e;
  if (e instanceof InvalidSeedError) return e;
  if (e instanceof HardenedDerivationError) return e;
  if (e instanceof InvalidKeyError) return e;

  const message = e instanceof Error ? e.message : String(e);

  if (message.includes("path") || message.includes("derivation")) {
    return new InvalidPathError({
      path: context.path ?? "unknown",
      message: `Invalid derivation path: ${message}`,
      cause: e,
    });
  }

  if (message.includes("seed") || message.includes("length")) {
    return new InvalidSeedError({
      seedLength: context.seedLength ?? -1,
      message: `Invalid seed: ${message}`,
      cause: e,
    });
  }

  if (message.includes("hardened") || message.includes("public")) {
    return new HardenedDerivationError({
      path: context.path ?? "unknown",
      index: -1,
      message: `Cannot derive hardened path from public key: ${message}`,
    });
  }

  return new InvalidKeyError({
    message: `Key derivation failed: ${message}`,
    cause: e,
  });
};

// voltaire-effect/src/crypto/HDWallet/HDWalletService.ts
import type { 
  InvalidPathError, 
  InvalidSeedError, 
  HardenedDerivationError 
} from "./errors.js";
import type { MnemonicStrength } from "../Bip39/types.js";

export interface HDNode {
  readonly privateKey: Uint8Array | undefined;
  readonly publicKey: Uint8Array;
  readonly chainCode: Uint8Array;
  readonly depth: number;
  readonly index: number;
  readonly parentFingerprint: Uint8Array;
}

export interface HDWalletServiceShape {
  /**
   * Derives child HDNode from parent using BIP-32/44 path.
   * 
   * @param node - Parent HD node
   * @param path - Derivation path (e.g., "m/44'/60'/0'/0/0")
   * @returns Child HDNode
   * 
   * @throws InvalidPathError - Path format invalid
   * @throws HardenedDerivationError - Hardened derivation from public key
   */
  readonly derive: (
    node: HDNode, 
    path: string,
  ) => Effect.Effect<HDNode, InvalidPathError | HardenedDerivationError>;

  /**
   * Creates master HDNode from seed bytes.
   * 
   * @param seed - 16-64 bytes (128-512 bits)
   * @returns Master HDNode
   * 
   * @throws InvalidSeedError - Seed length invalid
   */
  readonly fromSeed: (
    seed: Uint8Array,
  ) => Effect.Effect<HDNode, InvalidSeedError>;

  /**
   * Creates master HDNode from BIP-39 mnemonic.
   * 
   * @param mnemonic - Space-separated mnemonic sentence
   * @param passphrase - Optional passphrase (default: "")
   * @returns Master HDNode
   * 
   * @throws InvalidSeedError - Derived seed invalid
   */
  readonly fromMnemonic: (
    mnemonic: string,
    passphrase?: string,
  ) => Effect.Effect<HDNode, InvalidSeedError>;

  /**
   * Generates a BIP-39 mnemonic sentence.
   * This operation cannot fail (uses CSPRNG).
   */
  readonly generateMnemonic: (
    strength?: MnemonicStrength,
  ) => Effect.Effect<string, never>;

  /**
   * Serializes HDNode to extended private key (xprv).
   */
  readonly toExtendedPrivateKey: (
    node: HDNode,
  ) => Effect.Effect<string, InvalidKeyError>;

  /**
   * Serializes HDNode to extended public key (xpub).
   */
  readonly toExtendedPublicKey: (
    node: HDNode,
  ) => Effect.Effect<string, never>;
}

// voltaire-effect/src/crypto/HDWallet/HDWalletLive.ts
import { 
  InvalidPathError, 
  InvalidSeedError, 
  HardenedDerivationError,
  InvalidKeyError,
  mapToHDWalletError,
} from "./errors.js";

// Path validation regex
const PATH_REGEX = /^m(\/\d+'?)*$/;
const HARDENED_OFFSET = 0x80000000;

const parsePathComponent = (component: string): { index: number; hardened: boolean } => {
  const hardened = component.endsWith("'");
  const indexStr = hardened ? component.slice(0, -1) : component;
  const index = parseInt(indexStr, 10);
  
  if (isNaN(index) || index < 0) {
    throw new Error(`Invalid path component: ${component}`);
  }
  
  return { index, hardened };
};

export const HDWalletLive = Layer.succeed(HDWalletService, {
  derive: (node, path) =>
    Effect.try({
      try: () => {
        // Validate path format
        if (!PATH_REGEX.test(path)) {
          throw new InvalidPathError({
            path,
            message: `Invalid path format. Expected "m/..." with numeric indices.`,
          });
        }

        const components = path.split("/").slice(1);  // Skip "m"
        let currentNode = node;

        for (const component of components) {
          const { index, hardened } = parsePathComponent(component);

          // Check for hardened derivation from public key
          if (hardened && !currentNode.privateKey) {
            throw new HardenedDerivationError({
              path,
              index,
              message: `Cannot derive hardened index ${index}' from public key`,
            });
          }

          currentNode = HDWallet.deriveChild(currentNode, index, hardened);
        }

        return currentNode;
      },
      catch: (e) => {
        if (e instanceof InvalidPathError) return e;
        if (e instanceof HardenedDerivationError) return e;
        return mapToHDWalletError(e, { path });
      },
    }),

  fromSeed: (seed) =>
    Effect.try({
      try: () => {
        // BIP-32: seed must be 16-64 bytes
        if (seed.length < 16 || seed.length > 64) {
          throw new InvalidSeedError({
            seedLength: seed.length,
            message: `Seed must be 16-64 bytes, got ${seed.length}`,
          });
        }

        return HDWallet.fromSeed(seed);
      },
      catch: (e) => {
        if (e instanceof InvalidSeedError) return e;
        return mapToHDWalletError(e, { seedLength: seed.length });
      },
    }),

  fromMnemonic: (mnemonic, passphrase = "") =>
    Effect.try({
      try: () => {
        const seed = Bip39.mnemonicToSeed(mnemonic, passphrase);
        return HDWallet.fromSeed(seed);
      },
      catch: (e) => mapToHDWalletError(e, {}),
    }),

  generateMnemonic: (strength = 128) =>
    Effect.sync(() => {
      const words = Bip39.generateMnemonic(strength);
      return words.join(" ");
    }),

  toExtendedPrivateKey: (node) =>
    Effect.try({
      try: () => {
        if (!node.privateKey) {
          throw new InvalidKeyError({ message: "Node has no private key" });
        }
        return HDWallet.toExtendedPrivateKey(node);
      },
      catch: (e) => {
        if (e instanceof InvalidKeyError) return e;
        return new InvalidKeyError({ message: String(e), cause: e });
      },
    }),

  toExtendedPublicKey: (node) =>
    Effect.sync(() => HDWallet.toExtendedPublicKey(node)),
});
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
import * as Option from "effect/Option";
import { HDWalletService, HDWalletLive } from "./index.js";
import { 
  InvalidPathError, 
  InvalidSeedError, 
  HardenedDerivationError,
  InvalidKeyError,
} from "./errors.js";

describe("HDWallet error types", () => {
  // Valid test seed (32 bytes)
  const validSeed = new Uint8Array(32).fill(0x42);

  describe("InvalidPathError", () => {
    it("has correct _tag", () => {
      const err = new InvalidPathError({ path: "bad", message: "Invalid" });
      expect(err._tag).toBe("InvalidPathError");
      expect(err.path).toBe("bad");
    });

    it("is catchable by tag", async () => {
      const result = await Effect.runPromise(
        Effect.fail(new InvalidPathError({ 
          path: "m/invalid", 
          message: "Missing index" 
        })).pipe(
          Effect.catchTag("InvalidPathError", (e) => 
            Effect.succeed(`caught: ${e.path}`)
          )
        )
      );
      expect(result).toBe("caught: m/invalid");
    });
  });

  describe("derive operation", () => {
    it("fails with InvalidPathError for malformed path", async () => {
      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          const master = yield* hd.fromSeed(validSeed);
          return yield* hd.derive(master, "invalid/path");
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Cause.failureOption(result.cause);
        expect(Option.isSome(error)).toBe(true);
        if (Option.isSome(error)) {
          expect(error.value._tag).toBe("InvalidPathError");
        }
      }
    });

    it("fails with InvalidPathError for missing 'm' prefix", async () => {
      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          const master = yield* hd.fromSeed(validSeed);
          return yield* hd.derive(master, "/44'/60'/0'");  // Missing 'm'
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });

    it("fails with HardenedDerivationError from public key", async () => {
      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          const master = yield* hd.fromSeed(validSeed);
          
          // Create public-only node
          const publicNode = {
            ...master,
            privateKey: undefined,
          };
          
          return yield* hd.derive(publicNode, "m/44'");  // Hardened!
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Cause.failureOption(result.cause);
        if (Option.isSome(error)) {
          expect(error.value._tag).toBe("HardenedDerivationError");
        }
      }
    });

    it("succeeds with non-hardened derivation from public key", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          const master = yield* hd.fromSeed(validSeed);
          
          // Create public-only node
          const publicNode = {
            ...master,
            privateKey: undefined,
          };
          
          return yield* hd.derive(publicNode, "m/0");  // Non-hardened OK
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(result.depth).toBe(1);
    });

    it("succeeds with valid Ethereum path", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          const master = yield* hd.fromSeed(validSeed);
          return yield* hd.derive(master, "m/44'/60'/0'/0/0");
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(result.depth).toBe(5);
    });
  });

  describe("fromSeed operation", () => {
    it("fails with InvalidSeedError for too short seed", async () => {
      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          return yield* hd.fromSeed(new Uint8Array(15));  // Too short
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(Exit.isFailure(result)).toBe(true);
      if (Exit.isFailure(result)) {
        const error = Cause.failureOption(result.cause);
        if (Option.isSome(error)) {
          expect(error.value._tag).toBe("InvalidSeedError");
          expect((error.value as InvalidSeedError).seedLength).toBe(15);
        }
      }
    });

    it("fails with InvalidSeedError for too long seed", async () => {
      const result = await Effect.runPromiseExit(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          return yield* hd.fromSeed(new Uint8Array(65));  // Too long
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(Exit.isFailure(result)).toBe(true);
    });

    it("accepts minimum valid seed (16 bytes)", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          return yield* hd.fromSeed(new Uint8Array(16).fill(0x42));
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(result.depth).toBe(0);
    });

    it("accepts maximum valid seed (64 bytes)", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          return yield* hd.fromSeed(new Uint8Array(64).fill(0x42));
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(result.depth).toBe(0);
    });
  });

  describe("error discrimination", () => {
    it("all error types have unique tags", () => {
      const tags = new Set([
        new InvalidPathError({ path: "", message: "" })._tag,
        new InvalidSeedError({ seedLength: 0, message: "" })._tag,
        new HardenedDerivationError({ path: "", index: 0, message: "" })._tag,
        new InvalidKeyError({ message: "" })._tag,
      ]);

      expect(tags.size).toBe(4);
    });

    it("Effect.catchTag discriminates correctly", async () => {
      const pathError = Effect.gen(function* () {
        const hd = yield* HDWalletService;
        const master = yield* hd.fromSeed(validSeed);
        return yield* hd.derive(master, "bad/path");
      }).pipe(
        Effect.provide(HDWalletLive),
        Effect.catchTag("InvalidPathError", () => Effect.succeed("path")),
        Effect.catchTag("HardenedDerivationError", () => Effect.succeed("hardened")),
      );

      const result = await Effect.runPromise(pathError);
      expect(result).toBe("path");
    });
  });
});
```
</test_cases>
</tests>

<docs>
```typescript
/**
 * Derives child HDNode from parent using BIP-32/44 path.
 * 
 * @param node - Parent HD node
 * @param path - Derivation path (e.g., "m/44'/60'/0'/0/0")
 * @returns Child HDNode
 * 
 * @throws InvalidPathError - Path format invalid
 * @throws HardenedDerivationError - Hardened derivation attempted from public key
 * 
 * @example
 * ```typescript
 * const child = yield* HDWalletService.pipe(
 *   Effect.flatMap(hd => hd.derive(master, "m/44'/60'/0'/0/0")),
 *   Effect.catchTag("InvalidPathError", (e) => 
 *     Console.error(`Invalid path ${e.path}: ${e.message}`)
 *   ),
 *   Effect.catchTag("HardenedDerivationError", (e) =>
 *     Console.error(`Cannot derive from public key at index ${e.index}`)
 *   )
 * );
 * ```
 */
readonly derive: (node: HDNode, path: string) => 
  Effect.Effect<HDNode, InvalidPathError | HardenedDerivationError>;
```
</docs>

<api>
<before>
```typescript
interface HDWalletServiceShape {
  readonly derive: (node: HDNode, path: string) => 
    Effect.Effect<HDNode, never, HDWalletService>;
  
  readonly fromSeed: (seed: Uint8Array) => 
    Effect.Effect<HDNode, never, HDWalletService>;
  
  readonly generateMnemonic: (strength?: number) => 
    Effect.Effect<string[], never>;
}
```
</before>

<after>
```typescript
interface HDWalletServiceShape {
  readonly derive: (node: HDNode, path: string) => 
    Effect.Effect<HDNode, InvalidPathError | HardenedDerivationError>;
  
  readonly fromSeed: (seed: Uint8Array) => 
    Effect.Effect<HDNode, InvalidSeedError>;
  
  readonly fromMnemonic: (mnemonic: string, passphrase?: string) => 
    Effect.Effect<HDNode, InvalidSeedError>;
  
  readonly generateMnemonic: (strength?: MnemonicStrength) => 
    Effect.Effect<string, never>;
}

// New exports
export { 
  InvalidPathError, 
  InvalidSeedError, 
  HardenedDerivationError, 
  InvalidKeyError, 
  type HDWalletError 
};
```
</after>

<breaking>
Error channel changes from `never` to specific error types.
- `derive` now has error type `InvalidPathError | HardenedDerivationError`
- `fromSeed` now has error type `InvalidSeedError`
- `generateMnemonic` return type changes from `string[]` to `string`

Existing code using `Effect.runSync` may now throw typed errors.
Use `Effect.catchTag` or `Effect.catchAll` to handle.
</breaking>
</api>

<references>
- [Effect Data.TaggedError](https://effect.website/docs/data-types/data#taggederror)
- [Effect Error Handling](https://effect.website/docs/error-management/creating-custom-errors)
- [BIP-32 Derivation](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)
- [BIP-44 Multi-Account](https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki)
- [Effect catchTag](https://effect.website/docs/error-management/matching)
- [Review 050: Bip39 HDWallet Return Type](./050-fix-bip39-hdwallet-return-type-inconsistency.md)
</references>
</issue>
