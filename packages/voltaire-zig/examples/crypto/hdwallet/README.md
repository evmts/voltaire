# HD Wallet Examples

Demonstrates BIP-32/BIP-39/BIP-44 HD wallet derivation functionality.

## Usage

```typescript
import * as HDWallet from '@tevm/voltaire/crypto/HDWallet';
import * as Bip39 from '@tevm/voltaire/crypto/Bip39';

// Generate mnemonic
const mnemonic = HDWallet.generateMnemonic(256); // or 128 for 12 words

// Create root key from mnemonic
const seed = await HDWallet.mnemonicToSeed(mnemonic, 'optional-password');
const root = HDWallet.fromSeed(seed);

// Derive Ethereum address (BIP-44)
const ethAccount = HDWallet.derivePath(root, "m/44'/60'/0'/0/0");
const privateKey = HDWallet.getPrivateKey(ethAccount);
const publicKey = HDWallet.getPublicKey(ethAccount);

// Or use convenience function
const ethAccount2 = HDWallet.deriveEthereum(root, 0, 1); // account 0, address 1
```

## Functions

### BIP-39 (Mnemonic)
- `generateMnemonic(strength?: 128 | 256)` - Generate 12 or 24 word mnemonic
- `mnemonicToSeed(mnemonic, password?)` - Convert to 64-byte seed
- `validateMnemonic(mnemonic)` - Validate checksum

### BIP-32 (HD Derivation)
- `fromSeed(seed)` - Create root key from seed
- `derivePath(node, path)` - Derive using BIP-32 path string
- `deriveChild(node, index)` - Derive single child by index
- `deriveEthereum(root, account?, index?)` - Ethereum BIP-44 helper
- `deriveBitcoin(root, account?, index?)` - Bitcoin BIP-44 helper

### Key Access
- `getPrivateKey(node)` - Extract 32-byte private key
- `getPublicKey(node)` - Extract 33-byte compressed public key
- `getChainCode(node)` - Get 32-byte chain code

### Extended Keys
- `toExtendedPrivateKey(node)` - Serialize to xprv format
- `toExtendedPublicKey(node)` - Serialize to xpub format
- `fromExtendedKey(xprv)` - Parse extended private key
- `fromPublicExtendedKey(xpub)` - Parse extended public key

### Utilities
- `toPublic(node)` - Convert to watch-only public key
- `canDeriveHardened(node)` - Check if has private key
- `isValidPath(path)` - Validate path format
- `isHardenedPath(path)` - Check for hardened indices
- `parseIndex(str)` - Parse path index string

## Path Format

BIP-32 paths use `/` separated indices:
- `m` - Master key prefix (required)
- `44'` - Hardened index (requires private key)
- `60` - Normal index (works with public key)

Standard Ethereum path: `m/44'/60'/0'/0/0`
- `44'` - BIP-44 purpose
- `60'` - Ethereum coin type
- `0'` - Account index (hardened)
- `0` - Change (0=external, 1=internal)
- `0` - Address index

## Examples

See `basic-derivation.ts` for complete examples.
