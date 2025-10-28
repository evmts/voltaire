# Gas Constants

EVM gas cost constants and calculation utilities following the Ethereum Yellow Paper and various EIPs.

## Overview

The `Gas` namespace provides comprehensive gas cost definitions for EVM operations, organized into:

- **Basic opcodes** - Arithmetic, logic, stack operations
- **Hashing** - KECCAK256 costs
- **Storage** - SLOAD/SSTORE with EIP-2929 cold/warm access
- **Logging** - LOG0-LOG4 operations
- **Calls** - CALL, DELEGATECALL, STATICCALL with gas forwarding
- **Memory** - Expansion cost calculation
- **Contract creation** - CREATE/CREATE2 with EIP-3860 limits
- **Transactions** - Intrinsic gas and calldata costs
- **Precompiles** - ECRECOVER, SHA256, BN254, MODEXP, etc.
- **Hardfork utilities** - EIP detection and fork-specific costs

## Quick Reference

### Basic Operations

```typescript
import { Gas } from './gas-constants.js';

// Opcode costs
Gas.QuickStep      // 2 gas  - ADDRESS, CALLER, etc.
Gas.FastestStep    // 3 gas  - ADD, SUB, MLOAD, MSTORE
Gas.FastStep       // 5 gas  - MUL, DIV
Gas.MidStep        // 8 gas  - ADDMOD, MULMOD
Gas.SlowStep       // 10 gas - JUMPI
Gas.ExtStep        // 20 gas - BALANCE, EXTCODESIZE
```

### Hashing

```typescript
// KECCAK256
const cost = Gas.calculateKeccak256Cost(64n); // 42 gas (30 + 2*6)

// Convenience form
const cost2 = Gas.keccak256Cost.call(64n);
```

### Storage

```typescript
// SSTORE with cold/warm access
const { cost, refund } = Gas.calculateSstoreCost(
  false,  // cold access
  0n,     // current value
  100n    // new value
); // { cost: 22100n, refund: 0n }

// Convenience form
const result = Gas.sstoreCost.call({
  isWarm: true,
  currentValue: 100n,
  newValue: 200n
});
```

### Logging

```typescript
// LOG2 with 64 bytes of data
const cost = Gas.calculateLogCost(2n, 64n); // 1637 gas

// Convenience form
const cost2 = Gas.logCost.call({ topicCount: 2n, dataSize: 64n });
```

### Calls

```typescript
// CALL operation
const result = Gas.calculateCallCost(
  true,     // warm account
  true,     // transfers value
  false,    // existing account
  100000n   // available gas
);
// { base: 100n, dynamic: 9000n, stipend: 2300n, forwarded: 89481n, total: 9100n }

// Convenience form
const result2 = Gas.callCost.call({
  isWarm: true,
  hasValue: true,
  isNewAccount: false,
  availableGas: 100000n
});
```

### Memory Expansion

```typescript
// Expand from 64 to 128 bytes
const expansion = Gas.calculateMemoryExpansionCost(64n, 128n);
// { oldCost: 6n, newCost: 12n, expansionCost: 6n, words: 4n }

// Convenience form
const expansion2 = Gas.memoryExpansionCost.call({ oldSize: 64n, newSize: 128n });
```

### Contract Creation

```typescript
// CREATE with initcode and deployed code
const result = Gas.calculateCreateCost(5000n, 2000n);
// { base: 32000n, dynamic: 400064n, total: 432064n }

// Checks EIP-3860 limit
try {
  Gas.calculateCreateCost(50000n, 0n); // Throws if > 49152 bytes
} catch (e) {
  console.error('Initcode too large');
}

// Convenience form
const result2 = Gas.createCost.call({ initcodeSize: 5000n, deployedSize: 2000n });
```

### Transactions

```typescript
// Intrinsic gas with calldata
const data = new Uint8Array([0, 1, 2, 0, 0]);
const cost = Gas.calculateTxIntrinsicGas(data, false);
// 21044 gas (21000 + 3*4 + 2*16)

// Contract creation
const createCost = Gas.calculateTxIntrinsicGas(data, true);
// 53044 gas (53000 + calldata)

// Convenience form
const cost2 = Gas.txIntrinsicGas.call({ data, isCreate: false });
```

### Copy Operations

```typescript
// CALLDATACOPY, CODECOPY, etc.
const cost = Gas.calculateCopyCost(64n); // 6 gas (2 words * 3)

// Convenience form
const cost2 = Gas.copyCost.call(64n);
```

### Refunds

```typescript
// Maximum refund (EIP-3529: 1/5 of gas used)
const maxRefund = Gas.calculateMaxRefund(100000n); // 20000n

// Convenience form
const maxRefund2 = Gas.maxRefund.call(100000n);
```

## Precompiles

### Hash Precompiles

```typescript
// SHA256 (0x02)
const sha256Cost = Gas.Precompile.calculateSha256Cost(64n); // 84 gas

// RIPEMD160 (0x03)
const ripemd160Cost = Gas.Precompile.calculateRipemd160Cost(64n); // 840 gas

// IDENTITY (0x04)
const identityCost = Gas.Precompile.calculateIdentityCost(64n); // 21 gas
```

### ECRECOVER (0x01)

```typescript
const cost = Gas.Precompile.EcRecover; // 3000 gas (fixed)
```

### MODEXP (0x05)

```typescript
// RSA-2048 example
const cost = Gas.Precompile.calculateModExpCost(
  256n,    // base length
  256n,    // exponent length
  256n,    // modulus length
  65537n   // exponent head
);
// Minimum 200 gas, varies by complexity
```

### BN254 Curve Operations

```typescript
// ECADD (0x06) - hardfork-dependent
const ecAddCost = Gas.Precompile.getEcAddCost('istanbul'); // 150 gas
const ecAddOld = Gas.Precompile.getEcAddCost('byzantium'); // 500 gas

// ECMUL (0x07) - hardfork-dependent
const ecMulCost = Gas.Precompile.getEcMulCost('istanbul'); // 6000 gas
const ecMulOld = Gas.Precompile.getEcMulCost('byzantium'); // 40000 gas

// ECPAIRING (0x08) - hardfork-dependent
const pairingCost = Gas.Precompile.calculateEcPairingCost(2n, 'istanbul');
// 113000 gas (45000 + 2*34000)

// Convenience form
const pairingCost2 = Gas.Precompile.ecPairingCost.call({
  pairCount: 2n,
  hardfork: 'istanbul'
});
```

## Hardfork Utilities

### EIP Detection

```typescript
// EIP-2929: Cold/warm access costs (Berlin+)
Gas.hasEIP2929('berlin');   // true
Gas.hasEIP2929('istanbul'); // false

// EIP-3529: Reduced refunds (London+)
Gas.hasEIP3529('london');   // true
Gas.hasEIP3529('berlin');   // false

// EIP-3860: Initcode size limit (Shanghai+)
Gas.hasEIP3860('shanghai'); // true
Gas.hasEIP3860('london');   // false

// EIP-1153: Transient storage (Cancun+)
Gas.hasEIP1153('cancun');   // true
Gas.hasEIP1153('shanghai'); // false

// EIP-4844: Blob transactions (Cancun+)
Gas.hasEIP4844('cancun');   // true
```

### Fork-Specific Costs

```typescript
// Cold SLOAD cost
Gas.getColdSloadCost('istanbul'); // 100n (pre-EIP-2929)
Gas.getColdSloadCost('berlin');   // 2100n (post-EIP-2929)

// Cold account access cost
Gas.getColdAccountAccessCost('istanbul'); // 20n
Gas.getColdAccountAccessCost('berlin');   // 2600n

// SSTORE refund
Gas.getSstoreRefund('berlin'); // 15000n (pre-EIP-3529)
Gas.getSstoreRefund('london'); // 4800n (post-EIP-3529)

// SELFDESTRUCT refund
Gas.getSelfdestructRefund('berlin'); // 24000n
Gas.getSelfdestructRefund('london'); // 0n (removed)
```

## Common Patterns

### Estimating Transaction Cost

```typescript
function estimateTxCost(
  calldata: Uint8Array,
  isContractCreation: boolean,
  hardfork: Gas.Hardfork
): bigint {
  // Intrinsic gas
  const intrinsic = Gas.calculateTxIntrinsicGas(calldata, isContractCreation);

  // Storage operations (example: one cold write)
  const sstore = Gas.calculateSstoreCost(false, 0n, 100n);

  // Logging (example: Transfer event)
  const log = Gas.calculateLogCost(2n, 64n);

  // Total
  return intrinsic + sstore.cost + log;
}

const cost = estimateTxCost(
  new Uint8Array([1, 2, 3]),
  false,
  'london'
);
```

### Estimating Contract Deployment

```typescript
function estimateDeploymentCost(
  initcode: Uint8Array,
  deployedBytecode: Uint8Array
): bigint {
  // CREATE operation
  const create = Gas.calculateCreateCost(
    BigInt(initcode.length),
    BigInt(deployedBytecode.length)
  );

  // Memory expansion for initcode
  const memory = Gas.calculateMemoryExpansionCost(
    0n,
    BigInt(initcode.length)
  );

  // Intrinsic transaction gas
  const intrinsic = Gas.calculateTxIntrinsicGas(initcode, true);

  return intrinsic + create.total + memory.expansionCost;
}
```

### Memory Management

```typescript
function calculateMemoryCost(operations: Array<{ offset: bigint, size: bigint }>): bigint {
  let currentSize = 0n;
  let totalCost = 0n;

  for (const op of operations) {
    const newSize = op.offset + op.size;
    if (newSize > currentSize) {
      const expansion = Gas.calculateMemoryExpansionCost(currentSize, newSize);
      totalCost += expansion.expansionCost;
      currentSize = newSize;
    }
  }

  return totalCost;
}

const cost = calculateMemoryCost([
  { offset: 0n, size: 32n },
  { offset: 64n, size: 32n },
  { offset: 128n, size: 64n }
]);
```

### Gas Refund Calculation

```typescript
function calculateNetGas(
  gasUsed: bigint,
  storageRefunds: bigint,
  hardfork: Gas.Hardfork
): bigint {
  const maxRefund = Gas.calculateMaxRefund(gasUsed);
  const actualRefund = storageRefunds > maxRefund ? maxRefund : storageRefunds;
  return gasUsed - actualRefund;
}

// Example: clearing storage slots
const gasUsed = 100000n;
const storageRefunds = Gas.getSstoreRefund('london') * 3n; // 3 cleared slots
const netGas = calculateNetGas(gasUsed, storageRefunds, 'london');
```

## Constants by Category

### Storage (EIP-2929, EIP-2200, EIP-3529)

```typescript
Gas.Sload              // 100n   - Warm SLOAD
Gas.ColdSload          // 2100n  - Cold SLOAD
Gas.ColdAccountAccess  // 2600n  - Cold account access
Gas.WarmStorageRead    // 100n   - Warm storage read
Gas.SstoreSentry       // 2300n  - Minimum for SSTORE
Gas.SstoreSet          // 20000n - Zero to non-zero
Gas.SstoreReset        // 5000n  - Modify non-zero
Gas.SstoreClear        // 5000n  - Non-zero to zero
Gas.SstoreRefund       // 4800n  - Clear refund (EIP-3529)
```

### Calls

```typescript
Gas.Call               // 40n    - Base CALL cost
Gas.CallStipend        // 2300n  - Stipend for value transfer
Gas.CallValueTransfer  // 9000n  - Additional for value transfer
Gas.CallNewAccount     // 25000n - Additional for new account
Gas.CallCode           // 700n   - CALLCODE cost
Gas.DelegateCall       // 700n   - DELEGATECALL cost
Gas.StaticCall         // 700n   - STATICCALL cost
Gas.Selfdestruct       // 5000n  - SELFDESTRUCT cost
Gas.SelfdestructRefund // 24000n - Refund (removed in EIP-3529)
```

### Transaction

```typescript
Gas.Tx                 // 21000n - Base transaction
Gas.TxContractCreation // 53000n - Contract creation base
Gas.TxDataZero         // 4n     - Per zero byte
Gas.TxDataNonZero      // 16n    - Per non-zero byte
Gas.MaxRefundQuotient  // 5n     - Max refund = gasUsed/5
```

### Contract Creation (EIP-3860)

```typescript
Gas.Create            // 32000n - Base CREATE cost
Gas.CreateData        // 200n   - Per byte of deployed code
Gas.InitcodeWord      // 2n     - Per word of initcode
Gas.MaxInitcodeSize   // 49152n - Maximum initcode size
```

### Memory

```typescript
Gas.Memory           // 3n   - Linear coefficient
Gas.QuadCoeffDiv     // 512n - Quadratic divisor
// Cost = 3*words + words²/512
```

### Logging

```typescript
Gas.LogBase  // 375n - Base LOG cost
Gas.LogData  // 8n   - Per byte of data
Gas.LogTopic // 375n - Per topic
```

### Hashing

```typescript
Gas.Keccak256Base // 30n - Base KECCAK256 cost
Gas.Keccak256Word // 6n  - Per word (32 bytes)
```

### Transient Storage (EIP-1153, Cancun+)

```typescript
Gas.TLoad  // 100n - TLOAD cost
Gas.TStore // 100n - TSTORE cost
```

### Blob Transactions (EIP-4844, Cancun+)

```typescript
Gas.BlobHash    // 3n - BLOBHASH opcode
Gas.BlobBaseFee // 2n - BLOBBASEFEE opcode
```

## Best Practices

### 1. Always Check Hardfork

```typescript
// Bad: assuming cold access costs
const cost = Gas.ColdSload;

// Good: check hardfork
const cost = Gas.getColdSloadCost(hardfork);
```

### 2. Handle Maximum Limits

```typescript
// Bad: might throw
const cost = Gas.calculateCreateCost(initcodeSize, deployedSize);

// Good: check limit
if (initcodeSize > Gas.MaxInitcodeSize) {
  throw new Error('Initcode too large');
}
const cost = Gas.calculateCreateCost(initcodeSize, deployedSize);
```

### 3. Account for Warm/Cold Access

```typescript
// Track accessed slots
const accessedSlots = new Set<bigint>();

function sloadCost(slot: bigint): bigint {
  const isWarm = accessedSlots.has(slot);
  accessedSlots.add(slot);
  return isWarm ? Gas.Sload : Gas.ColdSload;
}
```

### 4. Calculate Refunds Correctly

```typescript
// Bad: unbounded refund
const netGas = gasUsed - totalRefunds;

// Good: apply EIP-3529 limit
const maxRefund = Gas.calculateMaxRefund(gasUsed);
const actualRefund = totalRefunds > maxRefund ? maxRefund : totalRefunds;
const netGas = gasUsed - actualRefund;
```

### 5. Use Convenience Forms

```typescript
// Verbose
const cost1 = Gas.calculateKeccak256Cost(dataSize);
const cost2 = Gas.calculateLogCost(topicCount, dataSize);

// Concise with this: pattern
const cost1 = Gas.keccak256Cost.call(dataSize);
const cost2 = Gas.logCost.call({ topicCount, dataSize });
```

## Type Definitions

```typescript
type Hardfork =
  | 'homestead'
  | 'byzantium'
  | 'constantinople'
  | 'istanbul'
  | 'berlin'
  | 'london'
  | 'paris'
  | 'shanghai'
  | 'cancun';

type Config = {
  hardfork: Hardfork;
};

type CostResult = {
  base: bigint;
  dynamic: bigint;
  total: bigint;
};

type MemoryExpansion = {
  oldCost: bigint;
  newCost: bigint;
  expansionCost: bigint;
  words: bigint;
};
```

## References

- [Ethereum Yellow Paper](https://ethereum.github.io/yellowpaper/paper.pdf)
- [EIP-2929: Gas cost increases for state access opcodes](https://eips.ethereum.org/EIPS/eip-2929)
- [EIP-3529: Reduction in refunds](https://eips.ethereum.org/EIPS/eip-3529)
- [EIP-3860: Limit and meter initcode](https://eips.ethereum.org/EIPS/eip-3860)
- [EIP-1153: Transient storage opcodes](https://eips.ethereum.org/EIPS/eip-1153)
- [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)
- [EIP-2565: ModExp Gas Cost](https://eips.ethereum.org/EIPS/eip-2565)
- [EIP-1108: Reduce alt_bn128 precompile gas costs](https://eips.ethereum.org/EIPS/eip-1108)
