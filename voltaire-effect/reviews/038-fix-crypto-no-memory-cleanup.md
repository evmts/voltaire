# Fix Crypto No Memory Cleanup for Sensitive Keys

## Problem

Private keys, seeds, and mnemonics are not zeroed after use. While JavaScript doesn't guarantee memory clearing, best practice is to attempt cleanup as defense in depth.

**Locations**:
- `src/crypto/HDWallet/generateMnemonic.js` - entropy not cleared
- `src/crypto/Keystore/decrypt.js` - derivedKey, encryptionKey, macKey not cleared
- `voltaire-effect/src/services/Account/LocalAccount.ts` - privateKeyBytes persists
- `voltaire-effect/src/services/Account/fromMnemonic.ts` - seed not cleared

## Why This Matters

- Sensitive data remains in memory longer than necessary
- Memory dumps, core dumps could expose keys
- Not compliant with security best practices
- Zig implementation already does this correctly (`@memset(&key, 0)`)

## Solution

### For generateMnemonic.js:

```javascript
const entropy = new Uint8Array(entropyLen);
crypto.getRandomValues(entropy);
try {
  const mnemonic = entropyToMnemonic(entropy, wordlist);
  return mnemonic;
} finally {
  entropy.fill(0);  // Best-effort cleanup
}
```

### For decrypt.js:

```javascript
const derivedKey = deriveScrypt(password, salt, n, r, p, dklen);
const encryptionKey = derivedKey.slice(0, 16);
const macKey = derivedKey.slice(16, 32);
try {
  // ... decryption logic
  return privateKey;
} finally {
  derivedKey.fill(0);
  encryptionKey.fill(0);
  macKey.fill(0);
}
```

### For Effect services (LocalAccount.ts):

```typescript
export const LocalAccount = (privateKeyHex: Hex): Layer.Layer<AccountService> =>
  Layer.scoped(
    AccountService,
    Effect.acquireRelease(
      Effect.sync(() => Hex.toBytes(privateKeyHex) as PrivateKeyType),
      (key) => Effect.sync(() => key.fill(0))
    ).pipe(
      Effect.map((privateKeyBytes) => ({
        address: /* ... */,
        signMessage: /* ... */,
        // ...
      }))
    )
  );
```

## Acceptance Criteria

- [ ] Add cleanup in generateMnemonic.js for entropy
- [ ] Add cleanup in decrypt.js for derived keys
- [ ] Use Effect's `acquireRelease` for scoped key cleanup
- [ ] Add cleanup for seed in fromMnemonic.ts
- [ ] All existing tests pass

## Priority

**High** - Security best practice (defense in depth)
