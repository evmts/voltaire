# Signer Benchmarks

Comprehensive benchmarks comparing signer operations across guil (@tevm/primitives), ethers, and viem.

## Benchmark Categories

### 1. createPrivateKeySigner
Creates a signer instance from a private key.

**Files:**
- `/Users/williamcory/primitives/comparisons/signers/createPrivateKeySigner/`
- `guil.ts` - Uses `PrivateKeySignerImpl.fromPrivateKey()`
- `ethers.ts` - Uses `new Wallet(privateKey)`
- `viem.ts` - Uses `privateKeyToAccount(privateKey)`

### 2. sign (Transaction Signing)
Signs an EIP-1559 transaction.

**Files:**
- `/Users/williamcory/primitives/comparisons/signers/sign/`
- Tests cryptographic signing performance for transactions
- Uses a standard EIP-1559 transaction with 1 ETH transfer

### 3. signMessage (EIP-191)
Signs a message using EIP-191 personal message format.

**Files:**
- `/Users/williamcory/primitives/comparisons/signers/signMessage/`
- Test message: "Hello, Ethereum!"
- Measures EIP-191 prefix handling and signing

### 4. signTypedData (EIP-712)
Signs structured typed data using EIP-712.

**Files:**
- `/Users/williamcory/primitives/comparisons/signers/signTypedData/`
- Uses complex nested types (Person, Mail)
- Tests domain separator calculation and type hashing

### 5. getAddress
Retrieves the Ethereum address from a signer.

**Files:**
- `/Users/williamcory/primitives/comparisons/signers/getAddress/`
- Tests address derivation and caching performance

### 6. recoverTransactionAddress
Recovers the signer address from a signed transaction.

**Files:**
- `/Users/williamcory/primitives/comparisons/signers/recoverTransactionAddress/`
- Tests signature recovery and address derivation
- Pre-signs transaction to focus on recovery performance

## Running Benchmarks

Currently, these benchmarks have module resolution issues when run with vitest due to the way the src/ modules use Bun FFI. The benchmarks are structured correctly and follow the same pattern as other comparison benchmarks in this repository.

### Known Issues

The guil implementations import from `src/crypto/signers/` which depend on `src/primitives/address.ts`. This file attempts to load native libraries via Bun FFI, which doesn't work in the vitest/Node.js environment.

### Potential Solutions

1. **Isolate FFI**: Modify the primitives to conditionally load FFI only when available
2. **Standalone Implementations**: Reimplement signer logic using only @noble libraries (similar to `comparisons/keccak256/guil.ts`)
3. **Bun Test Runner**: Use Bun's test runner instead of vitest for these benchmarks

## Test Data

All benchmarks use the same test private key for consistency:
```
0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

This ensures comparable results across implementations.

## Documentation

Each benchmark category includes a `docs.ts` file that can generate markdown documentation with code examples and performance comparisons:

```bash
bun run comparisons/signers/createPrivateKeySigner/docs.ts
bun run comparisons/signers/sign/docs.ts
bun run comparisons/signers/signMessage/docs.ts
bun run comparisons/signers/signTypedData/docs.ts
bun run comparisons/signers/getAddress/docs.ts
bun run comparisons/signers/recoverTransactionAddress/docs.ts
```

## Architecture

Each benchmark follows this structure:
```
category/
├── guil.ts                 # @tevm/primitives implementation
├── ethers.ts               # ethers.js implementation
├── viem.ts                 # viem implementation
├── category.bench.ts       # Vitest benchmark runner
└── docs.ts                 # Documentation generator
```

All implementations export a `main()` function that performs the operation being benchmarked.
