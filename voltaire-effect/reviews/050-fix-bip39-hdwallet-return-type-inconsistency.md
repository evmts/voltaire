# Fix Bip39/HDWallet Return Type Inconsistency

## Problem

Bip39Service and HDWalletService have inconsistent return types for `generateMnemonic` - one returns `string`, the other returns `string[]`.

**Locations**:
- `src/crypto/Bip39/Bip39Service.ts`: `generateMnemonic: () => Effect.Effect<string>`
- `src/crypto/HDWallet/HDWalletService.ts`: `generateMnemonic: () => Effect.Effect<string[]>`

## Why This Matters

- Confusing API
- Users must remember which service returns which format
- Conversion required when switching between services
- Inconsistent with other libraries (BIP-39 standard uses space-separated string)

## Solution

Standardize on BIP-39 convention (space-separated string):

```typescript
// Bip39Service.ts (already correct)
readonly generateMnemonic: (strength?: MnemonicStrength) => Effect.Effect<string>;

// HDWalletService.ts (change to match)
readonly generateMnemonic: (strength?: MnemonicStrength) => Effect.Effect<string>;

// If array is needed, add separate method:
readonly generateMnemonicWords: (strength?: MnemonicStrength) => Effect.Effect<string[]>;
```

Or provide both with clear naming:

```typescript
interface Bip39ServiceShape {
  readonly generateMnemonic: (strength?: MnemonicStrength) => Effect.Effect<string>;
  readonly generateMnemonicWords: (strength?: MnemonicStrength) => Effect.Effect<string[]>;
}
```

Helper for conversion:
```typescript
// In operations.ts
export const mnemonicToWords = (mnemonic: string): string[] => mnemonic.split(" ");
export const wordsToMnemonic = (words: string[]): string => words.join(" ");
```

## Acceptance Criteria

- [ ] Standardize on `string` return type (BIP-39 convention)
- [ ] Update HDWallet to return `string` instead of `string[]`
- [ ] Add `mnemonicToWords` helper if array form needed
- [ ] Update all callers
- [ ] All existing tests pass

## Priority

**Medium** - API consistency
