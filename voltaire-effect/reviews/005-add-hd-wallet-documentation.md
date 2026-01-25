# Review: Add HD Wallet Documentation

## Priority: 🟡 DOCUMENTATION

## Summary

Document how to use voltaire core's HDWallet module with voltaire-effect's AccountService by creating wrapper utilities.

## Context

Voltaire core already has full HD wallet support in `@tevm/voltaire/native`:
- `HDWallet.fromSeed(seed)`
- `HDWallet.derivePath(root, path)`
- `HDWallet.deriveEthereum(root, account, index)`
- `HDWallet.getPrivateKey(account)`
- `Bip39.generateMnemonic(bits)`
- `Bip39.mnemonicToSeed(mnemonic, passphrase?)`
- `Bip39.validateMnemonic(mnemonic)`

## Documentation Needed

### 1. Add usage guide to docs

Create `docs/guides/hd-wallet.mdx`:

```typescript
import { Effect, Layer } from 'effect';
import * as Bip39 from '@tevm/voltaire/Bip39';
import * as HDWallet from '@tevm/voltaire/native/HDWallet';
import { LocalAccount, AccountService } from 'voltaire-effect/services';
import { Hex } from '@tevm/voltaire';

// Create account from mnemonic
const mnemonicToAccount = (
  mnemonic: string,
  accountIndex = 0,
  addressIndex = 0
): Effect.Effect<Layer.Layer<AccountService>, Error> =>
  Effect.gen(function* () {
    // Validate mnemonic
    if (!Bip39.validateMnemonic(mnemonic)) {
      return yield* Effect.fail(new Error('Invalid mnemonic'));
    }
    
    // Derive seed and key
    const seed = yield* Effect.promise(() => Bip39.mnemonicToSeed(mnemonic));
    const root = HDWallet.fromSeed(seed);
    const account = HDWallet.deriveEthereum(root, accountIndex, addressIndex);
    const privateKey = HDWallet.getPrivateKey(account);
    
    if (!privateKey) {
      return yield* Effect.fail(new Error('Failed to derive private key'));
    }
    
    // Create LocalAccount layer
    return LocalAccount(Hex.fromBytes(privateKey));
  });

// Usage
const program = Effect.gen(function* () {
  const mnemonic = "test test test test test test test test test test test junk";
  const accountLayer = yield* mnemonicToAccount(mnemonic, 0, 0);
  
  // Use with SignerService...
});
```

### 2. Add helper function to services

Create `src/services/Account/fromMnemonic.ts`:

```typescript
export const MnemonicAccount = (
  mnemonic: string,
  options?: { account?: number; index?: number }
) => Layer.effect(
  AccountService,
  Effect.gen(function* () {
    // Implementation using voltaire core
  })
);
```

### 3. Update README

Add section on HD wallet usage showing the integration pattern.

## Note

The HDWallet module requires native FFI and is only available from `@tevm/voltaire/native`, not the WASM bundle. Documentation should clearly state this requirement.
