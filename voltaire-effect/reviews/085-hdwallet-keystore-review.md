# HDWallet, Keystore, and Bip39 Implementation Review

## Summary

Comprehensive review of Effect-TS wrappers for HD wallet derivation (BIP-32/39/44) and keystore encryption. Overall architecture is solid with proper service abstraction, but several security and type-safety issues need attention.

**Files Reviewed**:
- `src/crypto/HDWallet/` (5 files)
- `src/crypto/Keystore/` (7 files)
- `src/crypto/Bip39/` (4 files)

---

## 1. Security Issues

### 1.1 CRITICAL: No Memory Cleanup for Key Material

**Locations**:
- [HDWalletLive.ts:48-51](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/HDWallet/HDWalletLive.ts#L48-L51)
- [decrypt.ts:41-47](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/Keystore/decrypt.ts#L41-L47)

Private keys are returned as `Uint8Array` but never zeroed after use:

```typescript
// HDWalletLive.ts
getPrivateKey: (node) =>
  Effect.sync(() =>
    HDWallet.getPrivateKey(node as ReturnType<typeof HDWallet.fromSeed>),
  ), // Key returned, never cleaned up

// decrypt.ts  
export const decrypt = (...): Effect.Effect<PrivateKeyType, DecryptError> =>
  Effect.try({
    try: () => Keystore.decrypt(keystore, password), // Returns key, no cleanup
  });
```

**Risk**: Key material persists in memory, vulnerable to memory dumps.

**Fix**: Add `Effect.acquireRelease` pattern or document consumer cleanup responsibility:

```typescript
export const withPrivateKey = <R, E, A>(
  node: HDNode,
  use: (key: Uint8Array) => Effect.Effect<A, E, R>
): Effect.Effect<A, E, R | HDWalletService> =>
  Effect.acquireUseRelease(
    getPrivateKey(node),
    (key) => (key ? use(key) : Effect.die("No private key")),
    (key) => Effect.sync(() => key?.fill(0))
  );
```

### 1.2 HIGH: Password Not Cleared After Keystore Operations

**Locations**:
- [encrypt.ts:43-51](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/Keystore/encrypt.ts#L43-L51)
- [decrypt.ts:41-47](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/Keystore/decrypt.ts#L41-L47)

Password strings passed to encrypt/decrypt persist in memory. JavaScript strings are immutable so can't be zeroed.

**Fix**: Accept `Uint8Array` for password OR document security implications:

```typescript
// Better API (breaking change)
readonly encrypt: (
  privateKey: PrivateKeyType,
  password: Uint8Array, // Can be zeroed
  options?: EncryptOptions,
) => Effect.Effect<KeystoreV3, EncryptionError>;
```

### 1.3 MEDIUM: Seed Material Not Zeroed

**Locations**:
- [HDWalletLive.ts:46-47](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/HDWallet/HDWalletLive.ts#L46-L47)

```typescript
mnemonicToSeed: (mnemonic) =>
  Effect.promise(() => HDWallet.mnemonicToSeed(mnemonic)),
// 64-byte seed returned, not cleaned up
```

---

## 2. Type Safety Issues (Prior Reviews Confirmed)

### 2.1 Return Type Inconsistency (Review 050)

**Confirmed**: Still present.

- `Bip39Service.generateMnemonic()` → `Effect.Effect<string>` (space-separated)
- `HDWalletService.generateMnemonic()` → `Effect.Effect<string[]>` (array)

**Also affects**:
- `mnemonicToSeed` signatures differ (string vs string[])

### 2.2 Missing Error Types (Review 051)

**Confirmed**: All HDWallet operations incorrectly typed as `never` for error:

```typescript
// derive.ts - ALL return never for E
export const derive = (...): Effect.Effect<HDNode, never, HDWalletService>
export const generateMnemonic = (...): Effect.Effect<string[], never, HDWalletService>
export const fromSeed = (...): Effect.Effect<HDNode, never, HDWalletService>
export const mnemonicToSeed = (...): Effect.Effect<Uint8Array, never, HDWalletService>
```

Underlying operations can throw:
- `InvalidPathError` (malformed derivation path)
- `InvalidSeedError` (wrong seed length)
- `InvalidMnemonicError` (checksum failure)

---

## 3. BIP Standards Compliance

### 3.1 BIP-32: HD Wallets ✓

**Correct**:
- Path parsing supports hardened derivation (`m/44'/60'/0'`)
- Chain code properly maintained per spec
- Public/private key extraction works

**Issue**: [HDWalletService.ts:20](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/HDWallet/HDWalletService.ts#L20)

```typescript
export type HDNode = object; // Too loose!
```

Should be branded or structurally typed:

```typescript
export interface HDNode {
  readonly __brand: "HDNode";
  readonly depth: number;
  readonly index: number;
  readonly chainCode: Uint8Array;
  // privateKey/publicKey accessed via methods
}
```

### 3.2 BIP-39: Mnemonics ✓

**Correct**:
- 128/160/192/224/256 entropy supported
- PBKDF2-SHA512 with 2048 iterations
- Passphrase support

**Missing**:
- Mnemonic validation errors not typed
- No wordlist selection (English only - fine for now)

### 3.3 BIP-44: Multi-Account ✓

**Correct**:
- Standard Ethereum path documented (`m/44'/60'/0'/0/0`)
- Purpose (44'), coin type (60' for ETH), account, change, address index

---

## 4. Effect Pattern Issues

### 4.1 Inconsistent Effect Wrapping

**Locations**:
- [HDWalletLive.ts:35-47](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/HDWallet/HDWalletLive.ts#L35-L47)

Mixed `Effect.sync` and `Effect.promise`:

```typescript
derive: (node, path) => Effect.sync(() => ...), // sync
generateMnemonic: (strength = 128) => Effect.promise(() => ...), // async
fromSeed: (seed) => Effect.sync(() => ...), // sync
mnemonicToSeed: (mnemonic) => Effect.promise(() => ...), // async
```

The underlying `@tevm/voltaire/HDWallet` determines which is needed, but:
- `generateMnemonic` uses crypto random - could be sync
- `mnemonicToSeed` uses PBKDF2 - async is appropriate

### 4.2 Missing Effect.try for Throwing Operations

**Location**: [HDWalletLive.ts:35-42](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/HDWallet/HDWalletLive.ts#L35-L42)

```typescript
derive: (node, path) =>
  Effect.sync(() =>  // ❌ Should be Effect.try!
    HDWallet.derivePath(node, path)
  ),
```

If `derivePath` throws (invalid path), it becomes a defect, not a typed error.

**Fix**:
```typescript
derive: (node, path) =>
  Effect.try({
    try: () => HDWallet.derivePath(node, path),
    catch: (e) => new InvalidPathError({ path: path as string, message: String(e) })
  }),
```

### 4.3 Service Layer vs Direct Functions

Both patterns exist, which is correct:

```typescript
// Direct function (convenience)
export const derive = (node, path) => Effect.gen(function* () {
  const hdwallet = yield* HDWalletService;
  return yield* hdwallet.derive(node, path);
});

// Service injection
const program = Effect.gen(function* () {
  const hd = yield* HDWalletService;
  return yield* hd.derive(node, path);
});
```

Good pattern for testability.

---

## 5. Keystore Implementation

### 5.1 Correct: Error Types

**Location**: [KeystoreService.ts:32-36](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/Keystore/KeystoreService.ts#L32-L36)

```typescript
export type DecryptError =
  | DecryptionError
  | InvalidMacError
  | UnsupportedVersionError
  | UnsupportedKdfError;
```

Proper union of specific errors.

### 5.2 Issue: Error Casting

**Locations**:
- [encrypt.ts:50](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/Keystore/encrypt.ts#L50)
- [decrypt.ts:47](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/Keystore/decrypt.ts#L47)

```typescript
catch: (e) => e as EncryptionError, // Unsafe assertion
catch: (e) => e as DecryptError,     // Unsafe assertion
```

Unknown errors become mistyped.

**Fix**:
```typescript
catch: (e) => {
  if (e instanceof EncryptionError) return e;
  return new EncryptionError({ message: String(e) });
}
```

### 5.3 Good: KDF Options

Supports both scrypt and pbkdf2 with configurable parameters:
- `scryptN`, `scryptR`, `scryptP`
- `pbkdf2C` (iterations)

---

## 6. Test Coverage Analysis

### 6.1 HDWallet Tests ✓

**Coverage**: Adequate for mock layer

| Test | Status |
|------|--------|
| generateMnemonic 12 words | ✓ |
| fromSeed returns HDNode | ✓ |
| derive with BIP-44 path | ✓ |
| mnemonicToSeed 64 bytes | ✓ |
| getPrivateKey 32 bytes | ✓ |
| getPublicKey 33 bytes | ✓ |

**Missing**:
- [ ] Invalid path handling
- [ ] Invalid seed length
- [ ] Hardened vs non-hardened derivation
- [ ] HDWalletLive integration tests
- [ ] Edge case: neutered nodes (public-only)

### 6.2 Keystore Tests ✓

**Coverage**: Good

| Test | Status |
|------|--------|
| encrypt to v3 format | ✓ |
| pbkdf2 KDF support | ✓ |
| decrypt roundtrip | ✓ |
| wrong password fails | ✓ |
| unsupported version fails | ✓ |
| service layer encrypt | ✓ |
| service layer decrypt | ✓ |
| test layer mock data | ✓ |

**Missing**:
- [ ] Unsupported KDF error
- [ ] Invalid MAC detection specifics
- [ ] Empty password handling

### 6.3 Bip39 Tests ✓

**Coverage**: Adequate

| Test | Status |
|------|--------|
| 12-word generation | ✓ |
| 24-word generation | ✓ |
| validate known mnemonic | ✓ |
| reject invalid mnemonic | ✓ |
| mnemonicToSeed 64 bytes | ✓ |
| passphrase changes seed | ✓ |
| word count from entropy | ✓ |

**Missing**:
- [ ] All entropy levels (160, 192, 224)
- [ ] mnemonicToSeedSync tests
- [ ] Empty passphrase vs undefined
- [ ] Non-English wordlist rejection

---

## 7. Documentation Quality

### 7.1 JSDoc ✓

Excellent documentation with:
- `@description` blocks
- `@example` code
- `@throws` annotations (though incorrect for never types)
- `@see` references to BIP specs

### 7.2 Issue: Incorrect @throws

**Location**: [derive.ts:36-37](file:///Users/williamcory/voltaire/voltaire-effect/src/crypto/HDWallet/derive.ts#L36-L37)

```typescript
* @throws Never fails if inputs are valid
```

Misleading - invalid inputs DO fail but as defects. Once error types are added, update docs.

---

## 8. Recommendations

### Immediate (Security)

1. **Add key cleanup utilities** or document consumer responsibility
2. **Use Effect.try** for all throwing operations
3. **Consider Uint8Array passwords** for keystore (breaking change)

### Short-term (Type Safety)

4. **Implement review 050**: Standardize mnemonic return types
5. **Implement review 051**: Add proper error types
6. **Fix unsafe error casting** in Keystore

### Medium-term (Architecture)

7. **Add branded HDNode type** for compile-time safety
8. **Add integration tests** with HDWalletLive
9. **Complete missing test cases** per coverage gaps above

---

## 9. Action Items

| Priority | Issue | Location | Review |
|----------|-------|----------|--------|
| P0 | No memory cleanup for keys | HDWalletLive, decrypt | New |
| P1 | Effect.sync for throwing ops | HDWalletLive | New |
| P1 | Error type `never` incorrect | derive.ts | #051 |
| P2 | Return type inconsistency | Bip39/HDWallet | #050 |
| P2 | Unsafe error casting | Keystore | New |
| P3 | HDNode type too loose | HDWalletService | New |
| P3 | Missing test coverage | All modules | New |

---

## 10. Related Reviews

- [050-fix-bip39-hdwallet-return-type-inconsistency.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/050-fix-bip39-hdwallet-return-type-inconsistency.md)
- [051-add-hdwallet-effect-error-types.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/051-add-hdwallet-effect-error-types.md)
- [038-fix-crypto-no-memory-cleanup.md](file:///Users/williamcory/voltaire/voltaire-effect/reviews/038-fix-crypto-no-memory-cleanup.md) (related pattern)
