# Expose HD Wallet Derivation

**Priority: MEDIUM**

libwally-core exists but BIP-32/39 not exposed to TypeScript.

## Task
Create TypeScript bindings for HD wallet functionality from libwally.

## Features Needed

### BIP-39 (Mnemonic)
```typescript
generateMnemonic(strength?: 128 | 256): string[]
  // Generate mnemonic words

mnemonicToSeed(mnemonic, password?): Uint8Array
  // Convert mnemonic to seed

validateMnemonic(mnemonic): boolean
  // Validate mnemonic checksum
```

### BIP-32 (HD Derivation)
```typescript
fromSeed(seed): HDNode
  // Create root node from seed

derive(node, path): HDNode
  // Derive child key from path (m/44'/60'/0'/0/0)

deriveHardened(node, index): HDNode
  // Derive hardened child

getPrivateKey(node): Uint8Array
  // Get private key from node

getPublicKey(node): Uint8Array
  // Get public key from node

getAddress(node): Address
  // Get Ethereum address from node
```

## Files
Create `src/crypto/hdwallet/` or `src/primitives/HDWallet/`

## C Bindings
May need to add C API wrappers in `src/c_api.zig` for libwally functions.

## Verification
```bash
bun run test -- HDWallet
# Test derivation path: m/44'/60'/0'/0/0 (Ethereum standard)
```
