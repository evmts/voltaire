# Fix Bip39/HDWallet Return Type Inconsistency

<issue>
<metadata>
priority: P2
severity: medium
category: api-consistency
files: [
  voltaire-effect/src/crypto/Bip39/Bip39Service.ts,
  voltaire-effect/src/crypto/HDWallet/HDWalletService.ts,
  voltaire-effect/src/crypto/Bip39/utils.ts
]
reviews: [051-add-hdwallet-effect-error-types.md, 085-hdwallet-keystore-review.md]
</metadata>

<problem>
Bip39Service and HDWalletService have inconsistent return types for `generateMnemonic`:
- `Bip39Service.generateMnemonic()` returns `Effect.Effect<string>` (space-separated)
- `HDWalletService.generateMnemonic()` returns `Effect.Effect<string[]>` (word array)

**Location**: 
- `voltaire-effect/src/crypto/Bip39/Bip39Service.ts`
- `voltaire-effect/src/crypto/HDWallet/HDWalletService.ts`

**BIP-39 Specification**:
The mnemonic is defined as a "sentence" - space-separated words that are used directly as input to PBKDF2 for seed derivation.

**Impact**:
- Users must remember which service returns which format
- Conversion between formats is error-prone (whitespace handling)
- PBKDF2 expects string, not array - extra conversion needed
- Inconsistent API creates confusion
</problem>

<solution>
Standardize on BIP-39 convention: space-separated string as the canonical format.

**Design decisions**:
1. Both services return `string` for mnemonic
2. Add pure utility functions for conversion: `mnemonicToWords`, `wordsToMnemonic`
3. Add `MnemonicStrength` type for validated entropy sizes
4. HDWallet change is breaking - provide migration path

```typescript
// Canonical: space-separated string
type Mnemonic = string;

// Utilities for when array is needed
export const mnemonicToWords = (mnemonic: string): string[] => 
  mnemonic.normalize("NFKD").split(" ").filter(w => w.length > 0);

export const wordsToMnemonic = (words: readonly string[]): string => 
  words.join(" ");
```
</solution>

<implementation>
<steps>
1. Create `MnemonicStrength` type with valid entropy values (128, 160, 192, 224, 256)
2. Add utility functions to `voltaire-effect/src/crypto/Bip39/utils.ts`
3. Update `HDWalletServiceShape.generateMnemonic` return type to `string`
4. Update `HDWalletLive` implementation to join words
5. Update all call sites in tests and examples
6. Add JSDoc explaining BIP-39 compliance
</steps>

<code_changes>
```typescript
// voltaire-effect/src/crypto/Bip39/types.ts
/**
 * Valid entropy strengths for BIP-39 mnemonic generation.
 * Maps to word counts: 128→12, 160→15, 192→18, 224→21, 256→24
 */
export type MnemonicStrength = 128 | 160 | 192 | 224 | 256;

/**
 * Word count for each entropy strength.
 */
export const WORD_COUNTS: Record<MnemonicStrength, number> = {
  128: 12,
  160: 15,
  192: 18,
  224: 21,
  256: 24,
} as const;

// voltaire-effect/src/crypto/Bip39/utils.ts
/**
 * Splits a BIP-39 mnemonic sentence into words.
 * 
 * @param mnemonic - Space-separated mnemonic sentence
 * @returns Array of mnemonic words
 * 
 * @example
 * const words = mnemonicToWords("abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about");
 * // ["abandon", "abandon", "abandon", ...]
 */
export const mnemonicToWords = (mnemonic: string): string[] => {
  // NFKD normalization per BIP-39
  return mnemonic
    .normalize("NFKD")
    .split(" ")
    .filter((w) => w.length > 0);
};

/**
 * Joins mnemonic words into a space-separated sentence.
 * 
 * @param words - Array of mnemonic words
 * @returns Space-separated mnemonic sentence
 */
export const wordsToMnemonic = (words: readonly string[]): string => {
  return words.join(" ");
};

/**
 * Validates mnemonic word count per BIP-39.
 * 
 * @param mnemonic - Space-separated mnemonic sentence
 * @returns True if word count is valid (12, 15, 18, 21, or 24)
 */
export const validateWordCount = (mnemonic: string): boolean => {
  const count = mnemonicToWords(mnemonic).length;
  return [12, 15, 18, 21, 24].includes(count);
};

/**
 * Gets the expected word count for an entropy strength.
 */
export const getWordCount = (strength: MnemonicStrength): number => {
  return WORD_COUNTS[strength];
};

// voltaire-effect/src/crypto/Bip39/Bip39Service.ts
import type { MnemonicStrength } from "./types.js";

export interface Bip39ServiceShape {
  /**
   * Generates a BIP-39 mnemonic sentence.
   * 
   * @param strength - Entropy bits (128, 160, 192, 224, or 256)
   * @returns Space-separated mnemonic sentence
   * 
   * @example
   * const mnemonic = yield* bip39.generateMnemonic(128);
   * // "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
   */
  readonly generateMnemonic: (
    strength?: MnemonicStrength,
  ) => Effect.Effect<string>;

  /**
   * Validates a mnemonic sentence.
   * Checks word count and checksum per BIP-39.
   */
  readonly validateMnemonic: (
    mnemonic: string,
  ) => Effect.Effect<boolean>;

  /**
   * Derives seed from mnemonic using PBKDF2.
   * 
   * @param mnemonic - Space-separated mnemonic sentence
   * @param passphrase - Optional passphrase (default: "")
   * @returns 64-byte seed
   */
  readonly mnemonicToSeed: (
    mnemonic: string,
    passphrase?: string,
  ) => Effect.Effect<Uint8Array>;
}

// voltaire-effect/src/crypto/HDWallet/HDWalletService.ts
import type { MnemonicStrength } from "../Bip39/types.js";

export interface HDWalletServiceShape {
  /**
   * Generates a BIP-39 mnemonic sentence.
   * Returns space-separated string per BIP-39 specification.
   * 
   * @param strength - Entropy bits (default: 128 = 12 words)
   * @returns Space-separated mnemonic sentence
   * 
   * @see Use `mnemonicToWords()` if you need an array
   */
  readonly generateMnemonic: (
    strength?: MnemonicStrength,
  ) => Effect.Effect<string>;  // ← Changed from string[]

  readonly fromMnemonic: (
    mnemonic: string,
    passphrase?: string,
  ) => Effect.Effect<HDNode, InvalidSeedError>;

  readonly fromSeed: (
    seed: Uint8Array,
  ) => Effect.Effect<HDNode, InvalidSeedError>;

  readonly derive: (
    node: HDNode,
    path: string,
  ) => Effect.Effect<HDNode, InvalidPathError | HardenedDerivationError>;
}

// voltaire-effect/src/crypto/HDWallet/HDWalletLive.ts
export const HDWalletLive = Layer.succeed(HDWalletService, {
  generateMnemonic: (strength = 128) =>
    Effect.try({
      try: () => {
        const words = HDWallet.generateMnemonic(strength);
        return words.join(" ");  // ← Convert to string
      },
      catch: (e) => new Bip39Error({ message: String(e), cause: e }),
    }),

  // ... rest unchanged
});

// voltaire-effect/src/crypto/Bip39/index.ts - exports
export { mnemonicToWords, wordsToMnemonic, validateWordCount } from "./utils.js";
export type { MnemonicStrength } from "./types.js";
export { WORD_COUNTS } from "./types.js";
```
</code_changes>
</implementation>

<tests>
<test_cases>
```typescript
import { describe, it, expect } from "vitest";
import * as Effect from "effect/Effect";
import { 
  Bip39Service, 
  Bip39Live,
  HDWalletService,
  HDWalletLive,
  mnemonicToWords,
  wordsToMnemonic,
  validateWordCount,
} from "./index.js";

describe("Bip39/HDWallet return type consistency", () => {
  describe("Bip39Service.generateMnemonic", () => {
    it("returns space-separated string", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const bip39 = yield* Bip39Service;
          return yield* bip39.generateMnemonic(128);
        }).pipe(Effect.provide(Bip39Live))
      );

      expect(typeof result).toBe("string");
      expect(result.split(" ").length).toBe(12);
      expect(result).not.toContain(",");  // Not JSON array
    });

    it("generates correct word count for each strength", async () => {
      const strengths = [128, 160, 192, 224, 256] as const;
      const expectedCounts = [12, 15, 18, 21, 24];

      for (let i = 0; i < strengths.length; i++) {
        const result = await Effect.runPromise(
          Effect.gen(function* () {
            const bip39 = yield* Bip39Service;
            return yield* bip39.generateMnemonic(strengths[i]);
          }).pipe(Effect.provide(Bip39Live))
        );

        expect(result.split(" ").length).toBe(expectedCounts[i]);
      }
    });
  });

  describe("HDWalletService.generateMnemonic", () => {
    it("returns space-separated string (same as Bip39Service)", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          return yield* hd.generateMnemonic(128);
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(typeof result).toBe("string");
      expect(result.split(" ").length).toBe(12);
    });

    it("default strength is 128 bits (12 words)", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          return yield* hd.generateMnemonic();
        }).pipe(Effect.provide(HDWalletLive))
      );

      expect(result.split(" ").length).toBe(12);
    });
  });

  describe("both services produce compatible output", () => {
    it("HDWallet mnemonic can be used with Bip39 seed derivation", async () => {
      const result = await Effect.runPromise(
        Effect.gen(function* () {
          const hd = yield* HDWalletService;
          const bip39 = yield* Bip39Service;

          // Generate with HDWallet
          const mnemonic = yield* hd.generateMnemonic(128);

          // Use with Bip39 for seed
          const seed = yield* bip39.mnemonicToSeed(mnemonic);

          return { mnemonic, seed };
        }).pipe(
          Effect.provide(HDWalletLive),
          Effect.provide(Bip39Live)
        )
      );

      expect(typeof result.mnemonic).toBe("string");
      expect(result.seed.length).toBe(64);
    });
  });
});

describe("mnemonic utility functions", () => {
  describe("mnemonicToWords", () => {
    it("splits mnemonic into word array", () => {
      const mnemonic = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const words = mnemonicToWords(mnemonic);

      expect(words.length).toBe(12);
      expect(words[0]).toBe("abandon");
      expect(words[11]).toBe("about");
    });

    it("handles extra whitespace", () => {
      const mnemonic = "  abandon   abandon  about  ";
      const words = mnemonicToWords(mnemonic);

      expect(words.length).toBe(3);
      expect(words[0]).toBe("abandon");
    });

    it("normalizes unicode (NFKD)", () => {
      // Composed vs decomposed forms
      const composed = "café";  // é as single codepoint
      const result = mnemonicToWords(composed);
      expect(result[0]).toBe("café".normalize("NFKD"));
    });
  });

  describe("wordsToMnemonic", () => {
    it("joins words with single spaces", () => {
      const words = ["abandon", "abandon", "about"];
      const result = wordsToMnemonic(words);

      expect(result).toBe("abandon abandon about");
    });

    it("handles empty array", () => {
      expect(wordsToMnemonic([])).toBe("");
    });

    it("handles single word", () => {
      expect(wordsToMnemonic(["abandon"])).toBe("abandon");
    });
  });

  describe("validateWordCount", () => {
    it("accepts valid word counts", () => {
      expect(validateWordCount("a ".repeat(12).trim())).toBe(true);
      expect(validateWordCount("a ".repeat(15).trim())).toBe(true);
      expect(validateWordCount("a ".repeat(18).trim())).toBe(true);
      expect(validateWordCount("a ".repeat(21).trim())).toBe(true);
      expect(validateWordCount("a ".repeat(24).trim())).toBe(true);
    });

    it("rejects invalid word counts", () => {
      expect(validateWordCount("a ".repeat(11).trim())).toBe(false);
      expect(validateWordCount("a ".repeat(13).trim())).toBe(false);
      expect(validateWordCount("a ".repeat(25).trim())).toBe(false);
      expect(validateWordCount("")).toBe(false);
    });
  });

  describe("roundtrip", () => {
    it("mnemonicToWords -> wordsToMnemonic preserves content", () => {
      const original = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const words = mnemonicToWords(original);
      const restored = wordsToMnemonic(words);

      expect(restored).toBe(original);
    });
  });
});
```
</test_cases>
</tests>

<docs>
```typescript
/**
 * Generates a BIP-39 mnemonic sentence.
 * 
 * @param strength - Entropy bits: 128 (12 words), 160 (15), 192 (18), 224 (21), 256 (24)
 * @returns Space-separated mnemonic sentence per BIP-39 specification
 * @see https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
 * 
 * @example
 * const mnemonic = yield* Bip39Service.generateMnemonic(128);
 * // "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"
 * 
 * const words = mnemonicToWords(mnemonic);
 * // ["abandon", "abandon", ...]
 */
readonly generateMnemonic: (strength?: MnemonicStrength) => Effect.Effect<string>;
```

**Migration guide for HDWallet users**:
```typescript
// Before (string[]):
const words = yield* hd.generateMnemonic(128);
const firstWord = words[0];

// After (string):
const mnemonic = yield* hd.generateMnemonic(128);
const words = mnemonicToWords(mnemonic);
const firstWord = words[0];

// Or directly:
const firstWord = mnemonic.split(" ")[0];
```
</docs>

<api>
<before>
```typescript
// Bip39Service
readonly generateMnemonic: (strength?: number) => Effect.Effect<string>;

// HDWalletService  
readonly generateMnemonic: (strength?: number) => Effect.Effect<string[]>;
```
</before>

<after>
```typescript
// Both services - consistent
readonly generateMnemonic: (strength?: MnemonicStrength) => Effect.Effect<string>;

// New utilities
export const mnemonicToWords: (mnemonic: string) => string[];
export const wordsToMnemonic: (words: readonly string[]) => string;
export const validateWordCount: (mnemonic: string) => boolean;
export type MnemonicStrength = 128 | 160 | 192 | 224 | 256;
```
</after>

<breaking>
**HDWalletService.generateMnemonic return type changes from `string[]` to `string`.**

Migration:
```typescript
// Before
const words: string[] = yield* hd.generateMnemonic();
const first = words[0];

// After
const mnemonic: string = yield* hd.generateMnemonic();
const words = mnemonicToWords(mnemonic);
const first = words[0];
```
</breaking>
</api>

<references>
- [BIP-39 Specification](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki)
- [BIP-39 Test Vectors](https://github.com/trezor/python-mnemonic/blob/master/vectors.json)
- [NFKD Normalization](https://unicode.org/reports/tr15/)
- [Review 051: HDWallet Effect Error Types](./051-add-hdwallet-effect-error-types.md)
- [Review 085: HDWallet Keystore](./085-hdwallet-keystore-review.md)
</references>
</issue>
