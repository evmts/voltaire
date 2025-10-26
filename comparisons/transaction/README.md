# Transaction Serialization Benchmarks

Comprehensive benchmarks comparing transaction serialization functions across guil (@tevm/primitives), ethers, and viem.

## Structure

Each benchmark function is organized in its own directory with the following files:

- `guil.ts` - Implementation using @tevm/primitives
- `ethers.ts` - Implementation using ethers.js
- `viem.ts` - Implementation using viem
- `*.bench.ts` - Vitest benchmark configuration
- `docs.ts` - Documentation generator

## Benchmarked Functions

### 1. serializeLegacy
**Directory:** `serializeLegacy/`

Serializes legacy transactions (Type 0) to RLP-encoded hex strings. Legacy transactions use EIP-155 signature format where `v = chainId * 2 + 35 + {0,1}`.

**Test Transaction:**
- Nonce: 42
- Gas Price: 20 gwei
- Gas Limit: 21000
- To: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
- Value: 1 ETH
- Data: 0x (empty)
- Signed with EIP-155 (chainId = 1)

### 2. serializeEip1559
**Directory:** `serializeEip1559/`

Serializes EIP-1559 transactions (Type 2) to RLP-encoded hex strings. EIP-1559 introduced:
- `maxPriorityFeePerGas` - tip to miner
- `maxFeePerGas` - maximum total fee
- `accessList` - optional list of addresses and storage keys

**Test Transaction:**
- Chain ID: 1
- Nonce: 42
- Max Priority Fee: 2 gwei
- Max Fee: 50 gwei
- Gas Limit: 21000
- To: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
- Value: 1 ETH
- Access List: Empty

### 3. serializeEip7702
**Directory:** `serializeEip7702/`

Serializes EIP-7702 transactions (Type 4) to RLP-encoded hex strings. EIP-7702 introduces authorization lists for account abstraction, allowing EOAs to temporarily act as smart contracts.

**Test Transaction:**
- Chain ID: 1
- Nonce: 42
- Max Priority Fee: 2 gwei
- Max Fee: 50 gwei
- Gas Limit: 100000
- Authorization List: Single authorization

**Note:** Ethers v6 does not support EIP-7702 yet, so benchmarks only compare guil and viem.

### 4. parseTransaction
**Directory:** `parseTransaction/`

Parses serialized transaction hex strings back into transaction objects. Tests parsing of all three transaction types:
- Legacy (Type 0)
- EIP-1559 (Type 2)
- EIP-7702 (Type 4)

**Note:** Ethers does not support parsing EIP-7702 transactions yet.

### 5. hashTransaction
**Directory:** `hashTransaction/`

Computes the Keccak256 hash of serialized transactions. The hash is used as the transaction ID and for signature verification. Tests hashing all transaction types.

### 6. detectTransactionType
**Directory:** `detectTransactionType/`

Detects the transaction type from serialized hex data without full parsing. Checks the first byte to determine:
- `0x00-0x7f`: Typed transaction (byte value = type)
- `0x80+`: Legacy transaction (RLP list)

## Test Data

Shared test data is defined in `test-data.ts` and includes:

- **legacyTransaction**: Signed legacy transaction
- **eip1559Transaction**: Signed EIP-1559 transaction with empty access list
- **eip1559TransactionWithAccessList**: EIP-1559 with populated access list
- **eip7702Transaction**: Signed EIP-7702 transaction with authorization list
- **serializedLegacyTx**: Pre-serialized legacy transaction
- **serializedEip1559Tx**: Pre-serialized EIP-1559 transaction
- **serializedEip7702Tx**: Pre-serialized EIP-7702 transaction

All test transactions use realistic values and valid signatures.

## Running Benchmarks

Run all transaction benchmarks:
```bash
vitest bench comparisons/transaction
```

Run a specific benchmark:
```bash
vitest bench comparisons/transaction/serializeLegacy
```

Generate documentation:
```bash
bun run comparisons/transaction/serializeLegacy/docs.ts
```

## Implementation Notes

### Guil (@tevm/primitives)
- Uses custom RLP encoder
- Direct TypeScript implementation
- Supports all transaction types including EIP-7702

### Ethers
- Uses `Transaction.from()` for parsing
- Uses `tx.serialized` property for serialization
- Does not support EIP-7702 (as of v6.13.4)

### Viem
- Uses `serializeTransaction()` for serialization
- Uses `parseTransaction()` for parsing
- Full support for EIP-7702

## Transaction Type Coverage

| Function | Legacy | EIP-1559 | EIP-7702 |
|----------|--------|----------|----------|
| serializeLegacy | ✓ | - | - |
| serializeEip1559 | - | ✓ | - |
| serializeEip7702 | - | - | ✓ |
| parseTransaction | ✓ | ✓ | ✓ (not ethers) |
| hashTransaction | ✓ | ✓ | ✓ (not ethers) |
| detectTransactionType | ✓ | ✓ | ✓ (not ethers) |

## Key Differences

### Transaction Object Formats

**Guil:**
```typescript
{
  type: 'eip1559',
  chainId: 1n,
  nonce: 42n,
  maxPriorityFeePerGas: 2000000000n,
  // ... other fields as bigint
}
```

**Ethers:**
```typescript
Transaction.from({
  type: 2,
  chainId: 1,
  nonce: 42,
  maxPriorityFeePerGas: 2000000000n,
  // ... mixed number/bigint
})
```

**Viem:**
```typescript
{
  type: 'eip1559' as const,
  chainId: 1,
  nonce: 42,
  maxPriorityFeePerGas: 2000000000n,
  gas: 21000n, // Note: 'gas' not 'gasLimit'
  // ...
}
```

### Field Name Differences

- **Gas Limit**: guil/ethers use `gasLimit`, viem uses `gas`
- **Type**: guil/viem use string literals ('eip1559'), ethers uses numbers (2)
- **Signature**: ethers uses nested `signature` object, others use flat fields (v, r, s)

## Performance Considerations

Transaction serialization and parsing are critical performance paths because:
1. Every transaction sent to the network must be serialized
2. Every transaction received must be parsed
3. Transaction hashes are computed frequently for validation
4. Type detection is the first step in transaction processing

Optimizations to consider:
- Pre-allocate buffers for serialization
- Cache transaction hashes
- Use streaming parsers for large batches
- Optimize RLP encoding/decoding
