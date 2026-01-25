# Fix Crypto No Memory Cleanup for Sensitive Keys

<issue>
<metadata>priority: P1 (security), files: [src/crypto/HDWallet/generateMnemonic.js, src/crypto/Keystore/decrypt.js, voltaire-effect/src/services/Account/LocalAccount.ts, voltaire-effect/src/services/Account/fromMnemonic.ts], reviews: [074-crypto-signatures-review.md, 079-contract-account-review.md, 085-hdwallet-keystore-review.md]</metadata>

<problem>
Private keys, seeds, and mnemonics are not zeroed after use. While JavaScript's garbage collector doesn't guarantee memory clearing, best practice is to attempt cleanup as defense-in-depth.

**Vulnerability**: Sensitive data exposure (CWE-316: Cleartext Storage of Sensitive Information in Memory)

**Affected locations**:
- `src/crypto/HDWallet/generateMnemonic.js` - entropy buffer not cleared
- `src/crypto/Keystore/decrypt.js` - derivedKey, encryptionKey, macKey not cleared
- `voltaire-effect/src/services/Account/LocalAccount.ts` - privateKeyBytes persists in closure
- `voltaire-effect/src/services/Account/fromMnemonic.ts` - seed not cleared after derivation

**Attack scenarios**:
1. **Memory dump**: Attacker gains access to process memory (core dump, heap dump, memory forensics)
2. **Heap spray**: Freed but not zeroed memory reused by attacker-controlled allocation
3. **Cold boot attack**: Physical access to RAM after system shutdown
4. **Process crash**: Core dumps include sensitive data in cleartext

**Security rationale**: The Zig implementation correctly zeroes sensitive memory (`@memset(&key, 0)`). JavaScript code should follow the same pattern for defense-in-depth.

> "Cryptographic secrets should have the minimum possible lifetime in memory." - OWASP
</problem>

<solution>
1. **Pure JS functions**: Use `try/finally` to zero buffers after use
2. **Effect services**: Use `Effect.acquireRelease` for scoped key cleanup
3. **Layer-based services**: Use `Layer.scoped` with finalization

**Why `acquireRelease`**: Effect's resource management pattern guarantees cleanup runs even on errors, interruption, or early termination. This is safer than manual `try/finally`.
</solution>

<implementation>
<steps>
1. Add `try/finally` cleanup in generateMnemonic.js
2. Add `try/finally` cleanup in decrypt.js
3. Refactor LocalAccount.ts to use `Effect.acquireRelease`
4. Refactor fromMnemonic.ts to use scoped cleanup
5. Add documentation about memory cleanup guarantees
</steps>

<security_patterns>
```javascript
// Pattern 1: Pure JS with try/finally
// src/crypto/HDWallet/generateMnemonic.js

export function generateMnemonic(strength = 128, wordlist = english) {
  const entropyLen = strength / 8;
  const entropy = new Uint8Array(entropyLen);
  crypto.getRandomValues(entropy);

  try {
    const mnemonic = entropyToMnemonic(entropy, wordlist);
    return mnemonic;
  } finally {
    // Best-effort cleanup - not guaranteed by JS but reduces exposure window
    entropy.fill(0);
  }
}

// src/crypto/Keystore/decrypt.js
export function decrypt(keystore, password) {
  const derivedKey = deriveScrypt(password, salt, n, r, p, dklen);
  const encryptionKey = derivedKey.slice(0, 16);
  const macKey = derivedKey.slice(16, 32);

  try {
    // ... decryption logic
    return privateKey;
  } finally {
    // Zero all derived key material
    derivedKey.fill(0);
    encryptionKey.fill(0);
    macKey.fill(0);
  }
}
```

```typescript
// Pattern 2: Effect.acquireRelease for scoped cleanup
// voltaire-effect/src/services/Account/LocalAccount.ts

import { Effect, Layer, Scope } from "effect";

export const LocalAccount = (privateKeyHex: Hex): Layer.Layer<AccountService> =>
  Layer.scoped(
    AccountService,
    Effect.acquireRelease(
      // Acquire: parse the private key
      Effect.sync(() => {
        const bytes = Hex.toBytes(privateKeyHex);
        return bytes as PrivateKeyType;
      }),
      // Release: zero the key bytes
      (privateKeyBytes) =>
        Effect.sync(() => {
          privateKeyBytes.fill(0);
        })
    ).pipe(
      Effect.map((privateKeyBytes) => ({
        address: Effect.sync(() => Secp256k1.publicKeyToAddress(
          Secp256k1.getPublicKey(privateKeyBytes)
        )),
        signMessage: (message: Uint8Array) =>
          Effect.sync(() => Secp256k1.sign(message, privateKeyBytes)),
        signTransaction: (tx: Transaction) =>
          Effect.sync(() => Transaction.sign(tx, privateKeyBytes)),
        // ... other methods
      }))
    )
  );

// Usage requires Effect.scoped:
const program = Effect.scoped(
  Effect.gen(function* () {
    const account = yield* AccountService;
    const sig = yield* account.signMessage(message);
    return sig;
  })
).pipe(
  Effect.provide(LocalAccount("0x..."))
);
// privateKeyBytes automatically zeroed when scope closes
```

```typescript
// Pattern 3: fromMnemonic with seed cleanup
// voltaire-effect/src/services/Account/fromMnemonic.ts

export const fromMnemonic = (
  mnemonic: string,
  path: string = "m/44'/60'/0'/0/0"
): Layer.Layer<AccountService> =>
  Layer.scoped(
    AccountService,
    Effect.acquireRelease(
      Effect.sync(() => {
        const seed = mnemonicToSeed(mnemonic);
        const privateKey = derivePrivateKey(seed, path);
        // Zero seed immediately after derivation
        seed.fill(0);
        return privateKey;
      }),
      (privateKey) => Effect.sync(() => privateKey.fill(0))
    ).pipe(
      Effect.map((privateKeyBytes) => createAccountService(privateKeyBytes))
    )
  );
```
</security_patterns>
</implementation>

<tests>
```typescript
describe("crypto memory cleanup", () => {
  describe("generateMnemonic", () => {
    it("zeros entropy after generating mnemonic", () => {
      // This is tricky to test directly, but we can verify the pattern works
      let capturedEntropy: Uint8Array | null = null;

      // Mock crypto.getRandomValues to capture entropy
      const original = crypto.getRandomValues;
      crypto.getRandomValues = (array: Uint8Array) => {
        capturedEntropy = array;
        original.call(crypto, array);
        return array;
      };

      try {
        generateMnemonic(128);
        // After function returns, entropy should be zeroed
        expect(capturedEntropy).not.toBeNull();
        expect(capturedEntropy!.every((b) => b === 0)).toBe(true);
      } finally {
        crypto.getRandomValues = original;
      }
    });
  });

  describe("LocalAccount acquireRelease", () => {
    it("zeros private key when scope closes", async () => {
      let capturedKey: Uint8Array | null = null;

      const program = Effect.scoped(
        Effect.gen(function* () {
          const account = yield* AccountService;
          // Capture reference to internal key (test only!)
          capturedKey = (account as any)._privateKey;
          return yield* account.address;
        })
      ).pipe(
        Effect.provide(LocalAccount("0x0123456789abcdef..."))
      );

      await Effect.runPromise(program);

      // After scope closes, key should be zeroed
      expect(capturedKey).not.toBeNull();
      expect(capturedKey!.every((b) => b === 0)).toBe(true);
    });

    it("zeros private key even on error", async () => {
      let capturedKey: Uint8Array | null = null;

      const program = Effect.scoped(
        Effect.gen(function* () {
          const account = yield* AccountService;
          capturedKey = (account as any)._privateKey;
          return yield* Effect.fail(new Error("test error"));
        })
      ).pipe(
        Effect.provide(LocalAccount("0x0123456789abcdef..."))
      );

      await Effect.runPromise(program).catch(() => {});

      // Key should still be zeroed despite error
      expect(capturedKey!.every((b) => b === 0)).toBe(true);
    });
  });
});
```
</tests>

<docs>
```typescript
/**
 * Creates a local account service from a private key.
 *
 * @security The private key bytes are automatically zeroed when the
 * Effect scope closes. Use with `Effect.scoped` to ensure cleanup:
 *
 * ```ts
 * const program = Effect.scoped(
 *   Effect.gen(function* () {
 *     const account = yield* AccountService;
 *     return yield* account.signMessage(msg);
 *   })
 * ).pipe(Effect.provide(LocalAccount(privateKeyHex)));
 * ```
 *
 * The key is zeroed even if the effect fails or is interrupted.
 * This reduces the window of exposure but does not guarantee
 * memory clearing due to JavaScript GC limitations.
 *
 * @param privateKeyHex - Private key as hex string
 * @returns Scoped Layer providing AccountService
 */
```
</docs>

<api>
<before>
```typescript
// LocalAccount.ts - key persists until GC
export const LocalAccount = (privateKeyHex: Hex): Layer.Layer<AccountService> =>
  Layer.succeed(
    AccountService,
    {
      address: Effect.sync(() => ...),
      signMessage: (message) => Effect.sync(() => Secp256k1.sign(message, privateKeyBytes)),
    }
  );
```
</before>
<after>
```typescript
// LocalAccount.ts - key zeroed when scope closes
export const LocalAccount = (privateKeyHex: Hex): Layer.Layer<AccountService> =>
  Layer.scoped(
    AccountService,
    Effect.acquireRelease(
      Effect.sync(() => Hex.toBytes(privateKeyHex) as PrivateKeyType),
      (key) => Effect.sync(() => key.fill(0))
    ).pipe(Effect.map((key) => createAccountService(key)))
  );
```
</after>
</api>

<references>
- OWASP Cryptographic Storage: https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
- CWE-316: Cleartext Storage in Memory: https://cwe.mitre.org/data/definitions/316.html
- Effect acquireRelease: https://effect.website/docs/resource-management/scope
- Zig implementation reference: `src/crypto/keystore.zig` uses `@memset(&key, 0)`
- Related: 079-contract-account-review.md, 085-hdwallet-keystore-review.md
</references>
</issue>
