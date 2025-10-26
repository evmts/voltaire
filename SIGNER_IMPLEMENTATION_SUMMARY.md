# Signer Implementation Summary

## Overview

Implemented guil-native and guil-wasm comparison files for 6 signer functions in `/Users/williamcory/primitives/comparisons/signers/`. The comparison files now have proper implementations, though some underlying primitives are not yet exposed via NAPI/WASM and will throw helpful error messages.

## Files Created

### Native (TypeScript Source)

1. **`/Users/williamcory/primitives/src/typescript/native/crypto/signers/private-key-signer.ts`**
   - PrivateKeySigner implementation using native FFI
   - Derives public key and address from private key
   - Provides signMessage, signTransaction, signTypedData methods (with placeholder implementations)

2. **`/Users/williamcory/primitives/src/typescript/native/crypto/signers/utils.ts`**
   - getAddress() - extracts address from signer
   - recoverTransactionAddress() - placeholder for transaction address recovery

3. **`/Users/williamcory/primitives/src/typescript/native/primitives/transaction-types.ts`**
   - TypeScript type definitions for transactions (Eip1559Transaction, Transaction, etc.)

### WASM (Compiled JavaScript Output)

1. **`/Users/williamcory/primitives/wasm/crypto/signers/private-key-signer.js`**
   - WASM PrivateKeySigner implementation
   - JavaScript version of the native implementation

2. **`/Users/williamcory/primitives/wasm/crypto/signers/utils.js`**
   - JavaScript version of signer utilities

3. **`/Users/williamcory/primitives/wasm/primitives/transaction.js`**
   - Empty module for transaction exports

4. **`/Users/williamcory/primitives/wasm/primitives/transaction.d.ts`**
   - TypeScript type declarations for WASM transaction types

### WASM (TypeScript Source - for reference)

1. **`/Users/williamcory/primitives/src/typescript/wasm/crypto/signers/private-key-signer.ts`**
2. **`/Users/williamcory/primitives/src/typescript/wasm/crypto/signers/utils.ts`**

## Comparison Files Updated

All comparison files in `/Users/williamcory/primitives/comparisons/signers/` now have correct import paths:

### Native Files (updated imports to use src/typescript/native/*)
- `createPrivateKeySigner/guil-native.ts`
- `getAddress/guil-native.ts`
- `sign/guil-native.ts`
- `signMessage/guil-native.ts`
- `signTypedData/guil-native.ts`
- `recoverTransactionAddress/guil-native.ts`

### WASM Files (already had correct imports to wasm/*)
- `createPrivateKeySigner/guil-wasm.ts`
- `getAddress/guil-wasm.ts`
- `sign/guil-wasm.ts`
- `signMessage/guil-wasm.ts`
- `signTypedData/guil-wasm.ts`
- `recoverTransactionAddress/guil-wasm.ts`

## Implementation Status

### ✅ Fully Implemented

1. **createPrivateKeySigner** - Creates a signer from a private key
   - Derives public key using secp256k1PubkeyFromPrivate
   - Derives address using keccak256(pubkey)[12:]
   - Returns signer object with address, privateKey, publicKey

2. **getAddress** - Gets address from signer
   - Simply returns signer.address property

### ⚠️ Partially Implemented (Requires Additional NAPI/WASM Bindings)

3. **sign** (signTransaction)
   - Structure in place
   - Throws error: "signTransaction not yet implemented. Requires RLP serialization and signHash bindings"
   - **Required**: Expose transaction RLP serialization and crypto.unaudited_signHash

4. **signMessage**
   - Hashes message with EIP-191 prefix using eip191HashMessage
   - Throws error: "signHash not yet exposed via NAPI/WASM"
   - **Required**: Expose crypto.unaudited_signHash via NAPI/WASM

5. **signTypedData**
   - Structure in place
   - Throws error: "signTypedData not yet implemented"
   - **Required**: Expose crypto.eip712.unaudited_signTypedData via NAPI/WASM

6. **recoverTransactionAddress**
   - Structure in place
   - Throws error: "recoverTransactionAddress not yet implemented"
   - **Required**: RLP deserialization and signature recovery bindings

## Required Next Steps to Complete Implementation

### 1. Expose Signing Functions via NAPI (native/napi/src/lib.rs)

Add these external functions and Rust bindings:
```rust
// In extern block:
fn primitives_sign_hash(hash: *const [u8; 32], private_key: *const [u8; 32], out_sig: *mut [u8; 65]) -> i32;

// In Rust:
#[napi]
pub fn sign_hash(hash: Buffer, private_key: Buffer) -> Result<Buffer> {
    // Validate inputs (32 bytes each)
    // Call primitives_sign_hash
    // Return signature as Buffer
}
```

### 2. Expose Signing Functions via WASM (wasm build exports)

The Zig function `crypto.unaudited_signHash` needs to be exported in the WASM build configuration.

### 3. Add Transaction Serialization Support

Expose RLP transaction serialization functions to enable transaction signing:
- Serialize EIP-1559 transaction to RLP
- Serialize Legacy transaction to RLP
- Serialize EIP-2930 transaction to RLP

### 4. Add EIP-712 Typed Data Signing

Expose `crypto.eip712.unaudited_signTypedData` via both NAPI and WASM.

### 5. Add Transaction Address Recovery

Implement or expose functions to:
- Deserialize RLP transaction
- Extract signature components
- Recover address from hash + signature

## Testing

Once the required bindings are added, these comparison files can be tested against ethers.js and viem using the benchmark suite.

## Architecture Notes

- **Native**: TypeScript source files in `src/typescript/native/` are imported directly by comparison files
- **WASM**: Compiled JavaScript files in `wasm/` are imported by comparison files
- The WASM `.js` files are standalone and don't depend on TypeScript source
- Type definitions for WASM are provided via `.d.ts` files

## Error Messages

All unimplemented functions throw descriptive errors that explain:
1. What is missing
2. Which Zig function needs to be exposed
3. What additional functionality is required

This makes it clear what work remains and helps guide future implementation efforts.
