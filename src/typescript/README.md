# @tevm/primitives TypeScript Wrapper

TypeScript wrapper for Ethereum primitives, providing comprehensive transaction support.

## Features

- Full TypeScript support with strict typing
- RLP encoding/decoding
- Keccak-256 hashing
- All Ethereum transaction types:
  - Legacy (Type 0)
  - EIP-1559 (Type 2)
  - EIP-7702 (Type 4)
- Transaction validation
- Transaction parsing and serialization
- Access list support
- Authorization list support (EIP-7702)

## Installation

```bash
bun install
```

## Usage

### Legacy Transaction

```typescript
import { type LegacyTransaction, encodeLegacyForSigning, serializeLegacy } from "./primitives/transaction";

const tx: LegacyTransaction = {
  nonce: 0n,
  gasPrice: 20000000000n, // 20 gwei
  gasLimit: 21000n,
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: 1000000000000000n, // 0.001 ETH
  data: "0x",
  v: 37n, // EIP-155 for mainnet
  r: "0x1234...",
  s: "0xfedc...",
};

// Encode for signing
const encoded = encodeLegacyForSigning(tx, 1n);

// Serialize
const serialized = serializeLegacy(tx);
```

### EIP-1559 Transaction

```typescript
import { type Eip1559Transaction, encodeEip1559ForSigning } from "./primitives/transaction";

const tx: Eip1559Transaction = {
  type: "eip1559",
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1000000000n, // 1 gwei
  maxFeePerGas: 20000000000n, // 20 gwei
  gasLimit: 21000n,
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: 1000000000000000n,
  data: "0x",
  accessList: [],
  v: 1n,
  r: "0x1234...",
  s: "0xfedc...",
};

const encoded = encodeEip1559ForSigning(tx);
```

### EIP-7702 Transaction

```typescript
import { type Eip7702Transaction, encodeEip7702ForSigning } from "./primitives/transaction";

const tx: Eip7702Transaction = {
  type: "eip7702",
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1000000000n,
  maxFeePerGas: 20000000000n,
  gasLimit: 50000n,
  to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  value: 0n,
  data: "0x",
  accessList: [],
  authorizationList: [{
    chainId: 1n,
    address: "0x1111...",
    nonce: 0n,
    v: 27n,
    r: "0x1234...",
    s: "0xfedc...",
  }],
  v: 1n,
  r: "0x1234...",
  s: "0xfedc...",
};

const encoded = encodeEip7702ForSigning(tx);
```

### Transaction Utilities

```typescript
import {
  parseTransaction,
  validateTransaction,
  hashTransaction,
  detectTransactionType,
} from "./primitives/transaction";

// Parse raw transaction data
const rawTx = "0x02f86d...";
const tx = parseTransaction(rawTx);

// Validate transaction
const isValid = validateTransaction(tx);

// Compute transaction hash
const hash = hashTransaction(tx);

// Detect transaction type
const type = detectTransactionType(rawTx); // "legacy" | "eip1559" | "eip7702"
```

## Testing

```bash
bun test
```

## Implementation Status

- [x] RLP encoding/decoding
- [x] Keccak-256 hashing
- [x] Legacy transactions (Type 0)
- [x] EIP-1559 transactions (Type 2)
- [x] EIP-7702 transactions (Type 4)
- [x] Access list support
- [x] Authorization list support
- [x] Transaction parsing
- [x] Transaction validation
- [x] Transaction hashing
- [x] Comprehensive test coverage (23 tests passing)

## Dependencies

- `@noble/hashes` - Cryptographic hashing (Keccak-256)
- `bun` - JavaScript runtime and test framework

## Architecture

The module follows strict TDD practices:

1. **transaction.ts** - Main transaction types and functions
2. **rlp.ts** - RLP encoding/decoding utilities
3. **keccak.ts** - Keccak-256 hashing utilities
4. **transaction.test.ts** - Comprehensive test suite with real Ethereum transactions

## Notes

- All transaction types are fully typed with TypeScript
- BigInt is used for numeric values to handle large Ethereum numbers
- Hex strings are prefixed with "0x"
- All tests use real Ethereum transaction patterns from mainnet
