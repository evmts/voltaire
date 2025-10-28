# Transaction Module

Complete Ethereum transaction handling with support for all transaction types: Legacy (Type 0), EIP-2930 (Type 1), EIP-1559 (Type 2), EIP-4844 (Type 3), and EIP-7702 (Type 4).

## Transaction Types

### Legacy (Type 0)
Original Ethereum transaction format with fixed gas price.

```typescript
const tx: Transaction.Legacy = {
  type: Transaction.Type.Legacy,
  nonce: 0n,
  gasPrice: 20000000000n,
  gasLimit: 21000n,
  to: recipientAddress,
  value: 1000000000000000000n, // 1 ETH
  data: new Uint8Array(),
  v: 27n,
  r: signatureR,
  s: signatureS,
};
```

### EIP-2930 (Type 1)
Access list transactions with explicit chain ID for replay protection.

```typescript
const tx: Transaction.EIP2930 = {
  type: Transaction.Type.EIP2930,
  chainId: 1n,
  nonce: 0n,
  gasPrice: 20000000000n,
  gasLimit: 21000n,
  to: recipientAddress,
  value: 1000000000000000000n,
  data: new Uint8Array(),
  accessList: [
    { address: contractAddress, storageKeys: [storageKey] }
  ],
  yParity: 0,
  r: signatureR,
  s: signatureS,
};
```

### EIP-1559 (Type 2)
Dynamic fee market transactions with priority fee and max fee per gas.

```typescript
const tx: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 2000000000n, // 2 gwei tip
  maxFeePerGas: 30000000000n,        // 30 gwei max
  gasLimit: 21000n,
  to: recipientAddress,
  value: 1000000000000000000n,
  data: new Uint8Array(),
  accessList: [],
  yParity: 0,
  r: signatureR,
  s: signatureS,
};
```

### EIP-4844 (Type 3)
Blob transactions for layer 2 scaling with separate blob gas market.

```typescript
const tx: Transaction.EIP4844 = {
  type: Transaction.Type.EIP4844,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1000000000n,
  maxFeePerGas: 20000000000n,
  gasLimit: 100000n,
  to: contractAddress, // Cannot be null for blob transactions
  value: 0n,
  data: new Uint8Array(),
  accessList: [],
  maxFeePerBlobGas: 2000000000n,
  blobVersionedHashes: [blobHash1, blobHash2],
  yParity: 0,
  r: signatureR,
  s: signatureS,
};
```

### EIP-7702 (Type 4)
EOA delegation to smart contracts with authorization list.

```typescript
const authorization: Transaction.Authorization = {
  chainId: 1n,
  address: delegateAddress,
  nonce: 0n,
  yParity: 0,
  r: authR,
  s: authS,
};

const tx: Transaction.EIP7702 = {
  type: Transaction.Type.EIP7702,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 1000000000n,
  maxFeePerGas: 20000000000n,
  gasLimit: 100000n,
  to: recipientAddress,
  value: 0n,
  data: new Uint8Array(),
  accessList: [],
  authorizationList: [authorization],
  yParity: 0,
  r: signatureR,
  s: signatureS,
};
```

## API Reference

### Type Guards

Check transaction type at runtime with type narrowing:

```typescript
// Type guards
Transaction.isLegacy(tx: Transaction.Any): tx is Transaction.Legacy
Transaction.isEIP2930(tx: Transaction.Any): tx is Transaction.EIP2930
Transaction.isEIP1559(tx: Transaction.Any): tx is Transaction.EIP1559
Transaction.isEIP4844(tx: Transaction.Any): tx is Transaction.EIP4844
Transaction.isEIP7702(tx: Transaction.Any): tx is Transaction.EIP7702

// Example
if (Transaction.isEIP1559(tx)) {
  console.log(tx.maxFeePerGas); // TypeScript knows this exists
}
```

### Type Detection

Detect transaction type from encoded data:

```typescript
Transaction.detectType(data: Uint8Array): Transaction.Type

// Example
const txData = new Uint8Array([0x02, /* ... */]);
const type = Transaction.detectType(txData);
if (type === Transaction.Type.EIP1559) {
  console.log("EIP-1559 transaction");
}
```

### Serialization (Not Implemented)

```typescript
// Standard form
Transaction.serialize(tx: Transaction.Any): Uint8Array
Transaction.deserialize(data: Uint8Array): Transaction.Any

// this: pattern (type-specific)
Transaction.Legacy.serialize.call(tx): Uint8Array
Transaction.EIP1559.serialize.call(tx): Uint8Array
```

### Hash Computation (Not Implemented)

```typescript
// Standard form
Transaction.hash(tx: Transaction.Any): Hash
Transaction.getSigningHash(tx: Transaction.Any): Hash

// this: pattern
Transaction.Legacy.hash.call(tx): Hash
Transaction.Legacy.getSigningHash.call(tx): Hash
```

### Signature Operations (Not Implemented)

```typescript
// Standard form
Transaction.getSender(tx: Transaction.Any): Address
Transaction.verifySignature(tx: Transaction.Any): boolean

// this: pattern
Transaction.Legacy.getSender.call(tx): Address
Transaction.Legacy.verifySignature.call(tx): boolean
```

### Gas Calculations

#### EIP-1559 Effective Gas Price

```typescript
// this: pattern
Transaction.EIP1559.getEffectiveGasPrice.call(tx, baseFee: bigint): bigint
Transaction.EIP4844.getEffectiveGasPrice.call(tx, baseFee: bigint): bigint
Transaction.EIP7702.getEffectiveGasPrice.call(tx, baseFee: bigint): bigint

// Example
const baseFee = 10000000000n; // 10 gwei
const effectivePrice = Transaction.EIP1559.getEffectiveGasPrice.call(tx, baseFee);
```

Formula: `baseFee + min(maxPriorityFeePerGas, maxFeePerGas - baseFee)`

#### EIP-4844 Blob Gas Cost

```typescript
// this: pattern
Transaction.EIP4844.getBlobGasCost.call(tx, blobBaseFee: bigint): bigint

// Example
const blobBaseFee = 1n;
const blobCost = Transaction.EIP4844.getBlobGasCost.call(tx, blobBaseFee);
```

Formula: `blobCount * 131072 * blobBaseFee` (each blob = 128 KB = 131072 bytes)

#### Universal Gas Price

```typescript
Transaction.getGasPrice(tx: Transaction.Any, baseFee?: bigint): bigint

// Example
const gasPrice = Transaction.getGasPrice(tx); // Legacy/EIP-2930
const gasPrice = Transaction.getGasPrice(tx, baseFee); // EIP-1559+
```

### Chain ID Operations

```typescript
// Standard form
Transaction.getChainId(tx: Transaction.Any): bigint | null

// Legacy-specific (this: pattern)
Transaction.Legacy.getChainId.call(tx): bigint | null

// Example
const chainId = Transaction.getChainId(tx);
if (chainId === 1n) {
  console.log("Ethereum mainnet");
}
```

Legacy transactions:
- EIP-155: `chainId = (v - 35) / 2` (when v >= 35)
- Pre-EIP-155: returns `null` (v = 27 or 28)

### Access List Operations

```typescript
Transaction.hasAccessList(tx: Transaction.Any): boolean
Transaction.getAccessList(tx: Transaction.Any): AccessList

// Example
if (Transaction.hasAccessList(tx)) {
  const accessList = Transaction.getAccessList(tx);
  console.log(`${accessList.length} items in access list`);
}
```

### Signature Validation

```typescript
Transaction.isSigned(tx: Transaction.Any): boolean
Transaction.assertSigned(tx: Transaction.Any): void

// Example
if (Transaction.isSigned(tx)) {
  console.log("Transaction is signed");
}

try {
  Transaction.assertSigned(tx);
  // Continue processing
} catch (error) {
  console.error("Transaction is not signed");
}
```

### Formatting

```typescript
Transaction.format(tx: Transaction.Any): string

// Example
const formatted = Transaction.format(tx);
// "EIP-1559 tx to 0x742d..., value: 1.5 ETH, nonce: 5"
```

## Common Patterns

### Creating Transactions

```typescript
// Simple ETH transfer (Legacy)
const transfer: Transaction.Legacy = {
  type: Transaction.Type.Legacy,
  nonce: 0n,
  gasPrice: 20000000000n,
  gasLimit: 21000n,
  to: recipientAddress,
  value: 1000000000000000000n,
  data: new Uint8Array(),
  v: 27n,
  r: new Uint8Array(32),
  s: new Uint8Array(32),
};

// Contract interaction (EIP-1559)
const contractCall: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 5n,
  maxPriorityFeePerGas: 2000000000n,
  maxFeePerGas: 30000000000n,
  gasLimit: 100000n,
  to: contractAddress,
  value: 0n,
  data: encodedFunctionCall,
  accessList: [],
  yParity: 0,
  r: new Uint8Array(32),
  s: new Uint8Array(32),
};

// Contract creation
const deploy: Transaction.EIP1559 = {
  type: Transaction.Type.EIP1559,
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 2000000000n,
  maxFeePerGas: 30000000000n,
  gasLimit: 1000000n,
  to: null, // null for contract creation
  value: 0n,
  data: contractBytecode,
  accessList: [],
  yParity: 0,
  r: new Uint8Array(32),
  s: new Uint8Array(32),
};
```

### Type-Safe Transaction Handling

```typescript
function processTransaction(tx: Transaction.Any) {
  // Type guard for safe access to type-specific fields
  if (Transaction.isEIP1559(tx)) {
    console.log(`Max fee: ${tx.maxFeePerGas}`);
    const baseFee = 10000000000n;
    const effectivePrice = Transaction.EIP1559.getEffectiveGasPrice.call(tx, baseFee);
    console.log(`Effective price: ${effectivePrice}`);
  } else if (Transaction.isLegacy(tx)) {
    console.log(`Gas price: ${tx.gasPrice}`);
    const chainId = Transaction.Legacy.getChainId.call(tx);
    if (chainId) {
      console.log(`Chain ID: ${chainId}`);
    }
  } else if (Transaction.isEIP4844(tx)) {
    console.log(`Blob count: ${tx.blobVersionedHashes.length}`);
    const blobCost = Transaction.EIP4844.getBlobGasCost.call(tx, 1n);
    console.log(`Blob gas cost: ${blobCost}`);
  }
}
```

### Gas Estimation

```typescript
function estimateTransactionCost(tx: Transaction.Any, baseFee: bigint): bigint {
  const gasPrice = Transaction.getGasPrice(tx, baseFee);
  const executionCost = gasPrice * tx.gasLimit;

  // Add blob cost for EIP-4844
  if (Transaction.isEIP4844(tx)) {
    const blobBaseFee = 1n;
    const blobCost = Transaction.EIP4844.getBlobGasCost.call(tx, blobBaseFee);
    return executionCost + blobCost;
  }

  return executionCost;
}
```

### Transaction Validation

```typescript
function validateTransaction(tx: Transaction.Any): void {
  // Check signature
  Transaction.assertSigned(tx);

  // Validate gas limits
  if (tx.gasLimit < 21000n) {
    throw new Error("Gas limit too low");
  }

  // Type-specific validation
  if (Transaction.isEIP1559(tx)) {
    if (tx.maxPriorityFeePerGas > tx.maxFeePerGas) {
      throw new Error("Priority fee exceeds max fee");
    }
  }

  if (Transaction.isEIP4844(tx)) {
    if (tx.blobVersionedHashes.length === 0) {
      throw new Error("Blob transaction must have at least one blob");
    }
    if (tx.to === null) {
      throw new Error("Blob transaction cannot be contract creation");
    }
  }
}
```

## Best Practices

1. **Use Type Guards**: Always use type guards when accessing type-specific fields
2. **Validate Signatures**: Check signatures before processing transactions
3. **Handle Chain IDs**: Extract and validate chain IDs for replay protection
4. **Gas Estimation**: Calculate total costs including blob gas for EIP-4844
5. **Access Lists**: Include access lists for contracts to reduce gas costs
6. **Contract Creation**: Set `to: null` for contract deployments
7. **EIP-1559 Fees**: Ensure `maxPriorityFeePerGas <= maxFeePerGas`
8. **Blob Transactions**: Verify blob count and destination (cannot be null)

## Transaction Types Summary

| Type | Name | Chain ID | Gas Price | Access List | Special Fields |
|------|------|----------|-----------|-------------|----------------|
| 0 | Legacy | Optional (v) | gasPrice | No | v, r, s |
| 1 | EIP-2930 | Required | gasPrice | Yes | yParity, r, s |
| 2 | EIP-1559 | Required | Dynamic | Yes | maxPriorityFeePerGas, maxFeePerGas |
| 3 | EIP-4844 | Required | Dynamic | Yes | maxFeePerBlobGas, blobVersionedHashes |
| 4 | EIP-7702 | Required | Dynamic | Yes | authorizationList |

## Constants

```typescript
Transaction.Type.Legacy = 0x00
Transaction.Type.EIP2930 = 0x01
Transaction.Type.EIP1559 = 0x02
Transaction.Type.EIP4844 = 0x03
Transaction.Type.EIP7702 = 0x04
```

## Notes

- Most serialization, hashing, and signature operations throw "Not implemented" errors
- Legacy transactions use `v, r, s` signature components
- EIP-2930+ transactions use `yParity, r, s` signature components
- EIP-4844 blob transactions require `to` address (cannot be null)
- Each blob is 128 KB (131072 bytes) for gas calculation
- EIP-155 provides replay protection via chain ID encoding in v value
