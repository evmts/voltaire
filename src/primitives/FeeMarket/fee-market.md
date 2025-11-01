# Fee Market (EIP-1559 & EIP-4844)

Type-safe Ethereum fee market calculations for EIP-1559 base fees and EIP-4844 blob fees.

## Overview

### EIP-1559 (Base Fee)
Dynamic base fee mechanism that adjusts based on block utilization:
- Target: 50% full blocks (gasLimit / 2)
- Increase: Up to 12.5% per block when above target
- Decrease: Up to 12.5% per block when below target
- Minimum: 7 wei

### EIP-4844 (Blob Fees)
Separate fee market for blob transactions:
- Target: 3 blobs per block (393,216 gas)
- Maximum: 6 blobs per block (786,432 gas)
- Pricing: Exponential based on excess blob gas
- Minimum: 1 wei per blob gas

## API Reference

### Constants

#### EIP-1559
```typescript
FeeMarket.Eip1559.MIN_BASE_FEE                  // 7n wei
FeeMarket.Eip1559.BASE_FEE_CHANGE_DENOMINATOR   // 8n (12.5% = 1/8)
FeeMarket.Eip1559.ELASTICITY_MULTIPLIER         // 2n (target = limit/2)
```

#### EIP-4844
```typescript
FeeMarket.Eip4844.MIN_BLOB_BASE_FEE              // 1n wei
FeeMarket.Eip4844.BLOB_BASE_FEE_UPDATE_FRACTION  // 3338477n
FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK      // 393216n (3 blobs)
FeeMarket.Eip4844.BLOB_GAS_PER_BLOB              // 131072n (128 KiB)
FeeMarket.Eip4844.MAX_BLOBS_PER_BLOCK            // 6n
FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK         // 786432n (6 blobs)
```

### Base Fee Calculations (EIP-1559)

#### calculateBaseFee
```typescript
FeeMarket.calculateBaseFee(
  parentGasUsed: bigint,
  parentGasLimit: bigint,
  parentBaseFee: bigint
): bigint
```

Calculate next block's base fee.

**Formula:**
- gasTarget = gasLimit / 2
- If gasUsed > gasTarget: increase up to 12.5%
- If gasUsed < gasTarget: decrease up to 12.5%
- If gasUsed == gasTarget: unchanged
- Minimum: 7 wei

**Example:**
```typescript
// Full block: base fee increases
const nextFee = FeeMarket.calculateBaseFee(
  30_000_000n,   // 100% full
  30_000_000n,
  1_000_000_000n // 1 gwei
);
// nextFee === 1_125_000_000n (12.5% increase)

// At target: unchanged
const sameFee = FeeMarket.calculateBaseFee(
  15_000_000n,   // 50% full (at target)
  30_000_000n,
  1_000_000_000n
);
// sameFee === 1_000_000_000n
```

### Blob Fee Calculations (EIP-4844)

#### calculateBlobBaseFee
```typescript
FeeMarket.calculateBlobBaseFee(excessBlobGas: bigint): bigint
```

Calculate blob base fee using exponential formula.

**Example:**
```typescript
// No excess: minimum fee
const minFee = FeeMarket.calculateBlobBaseFee(0n);
// minFee === 1n

// With excess: exponentially higher
const highFee = FeeMarket.calculateBlobBaseFee(393216n);
// highFee > 1n
```

#### calculateExcessBlobGas
```typescript
FeeMarket.calculateExcessBlobGas(
  parentExcessBlobGas: bigint,
  parentBlobGasUsed: bigint
): bigint
```

Calculate excess blob gas for next block.

**Formula:** max(0, parentExcess + parentUsed - TARGET)

**Example:**
```typescript
// Below target: no excess
const noExcess = FeeMarket.calculateExcessBlobGas(0n, 131072n); // 1 blob
// noExcess === 0n

// Above target: accumulate excess
const excess = FeeMarket.calculateExcessBlobGas(0n, 786432n); // 6 blobs
// excess === 393216n (3 blobs worth)
```

### Transaction Fees

#### calculateTxFee
```typescript
FeeMarket.calculateTxFee(params: {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  baseFee: bigint;
}): {
  effectiveGasPrice: bigint;
  priorityFee: bigint;
  baseFee: bigint;
}
```

Calculate EIP-1559 transaction fee.

**Formula:**
- effectiveGasPrice = min(maxFeePerGas, baseFee + maxPriorityFeePerGas)
- priorityFee = effectiveGasPrice - baseFee

**Example:**
```typescript
const fee = FeeMarket.calculateTxFee({
  maxFeePerGas: 2_000_000_000n,        // 2 gwei max
  maxPriorityFeePerGas: 1_000_000_000n, // 1 gwei tip
  baseFee: 800_000_000n                 // 0.8 gwei base
});
// fee.effectiveGasPrice === 1_800_000_000n (base + tip)
// fee.priorityFee === 1_000_000_000n (full tip paid)
```

#### calculateBlobTxFee
```typescript
FeeMarket.calculateBlobTxFee(params: {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  baseFee: bigint;
  maxFeePerBlobGas: bigint;
  blobBaseFee: bigint;
  blobCount: bigint;
}): {
  effectiveGasPrice: bigint;
  priorityFee: bigint;
  baseFee: bigint;
  blobGasPrice: bigint;
  totalBlobFee: bigint;
}
```

Calculate blob transaction fee (EIP-4844).

**Example:**
```typescript
const fee = FeeMarket.calculateBlobTxFee({
  maxFeePerGas: 2_000_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  baseFee: 800_000_000n,
  maxFeePerBlobGas: 10_000_000n,  // 10 wei/gas
  blobBaseFee: 5_000_000n,         // 5 wei/gas
  blobCount: 3n
});
// fee.blobGasPrice === 5_000_000n
// fee.totalBlobFee === 1_966_080_000_000n (3 * 131072 * 5_000_000)
```

#### canIncludeTx
```typescript
FeeMarket.canIncludeTx(
  params: TxFeeParams | BlobTxFeeParams
): boolean
```

Check if transaction meets minimum fee requirements.

**Example:**
```typescript
const canInclude = FeeMarket.canIncludeTx({
  maxFeePerGas: 1_000_000_000n,
  maxPriorityFeePerGas: 100_000_000n,
  baseFee: 900_000_000n
});
// canInclude === true (maxFee >= baseFee)
```

### State Operations

#### State Type
```typescript
type State = {
  gasUsed: bigint;
  gasLimit: bigint;
  baseFee: bigint;
  excessBlobGas: bigint;
  blobGasUsed: bigint;
}
```

#### nextState
```typescript
FeeMarket.nextState(state: State): State
```

Calculate next block's complete state.

**Example:**
```typescript
const currentState: FeeMarket.State = {
  gasUsed: 20_000_000n,
  gasLimit: 30_000_000n,
  baseFee: 1_000_000_000n,
  excessBlobGas: 0n,
  blobGasUsed: 262144n
};

const nextState = FeeMarket.nextState(currentState);
// nextState.baseFee adjusted based on usage
// nextState.gasUsed === 0n (reset)
// nextState.blobGasUsed === 0n (reset)
```

#### State Convenience Methods

Use `this:` pattern for convenience:

```typescript
const state: FeeMarket.State = { /* ... */ };

// Get next state
const next = FeeMarket.State.next.call(state);

// Query current blob base fee
const blobFee = FeeMarket.State.getBlobBaseFee.call(state);

// Get gas target
const target = FeeMarket.State.getGasTarget.call(state);

// Check if above targets
const aboveGas = FeeMarket.State.isAboveGasTarget.call(state);
const aboveBlob = FeeMarket.State.isAboveBlobGasTarget.call(state);
```

#### projectBaseFees
```typescript
FeeMarket.projectBaseFees(
  initialState: State,
  blocks: number,
  avgGasUsed: bigint,
  avgBlobGasUsed?: bigint
): bigint[]
```

Project future base fees over multiple blocks.

**Example:**
```typescript
const state: FeeMarket.State = {
  gasUsed: 15_000_000n,
  gasLimit: 30_000_000n,
  baseFee: 1_000_000_000n,
  excessBlobGas: 0n,
  blobGasUsed: 0n
};

// Project next 10 blocks with 83% utilization
const fees = FeeMarket.projectBaseFees(
  state,
  10,                // blocks
  25_000_000n,      // avg gas (83% full)
  262144n           // avg 2 blobs
);
// fees.length === 10
// fees[0] > state.baseFee (increasing trend)
```

### Validation

#### validateTxFeeParams
```typescript
FeeMarket.validateTxFeeParams(
  params: TxFeeParams | BlobTxFeeParams
): string[]
```

Validate transaction fee parameters. Returns array of error messages (empty if valid).

**Example:**
```typescript
const errors = FeeMarket.validateTxFeeParams({
  maxFeePerGas: 1_000_000_000n,
  maxPriorityFeePerGas: 2_000_000_000n, // Invalid: exceeds maxFee
  baseFee: 900_000_000n
});
// errors === ["maxPriorityFeePerGas cannot exceed maxFeePerGas"]
```

#### validateState
```typescript
FeeMarket.validateState(state: State): string[]
```

Validate block state. Returns array of error messages (empty if valid).

**Example:**
```typescript
const errors = FeeMarket.validateState({
  gasUsed: 40_000_000n,  // Invalid: exceeds limit
  gasLimit: 30_000_000n,
  baseFee: 1_000_000_000n,
  excessBlobGas: 0n,
  blobGasUsed: 0n
});
// errors === ["gasUsed cannot exceed gasLimit"]
```

### Utilities

#### weiToGwei / gweiToWei
```typescript
FeeMarket.weiToGwei(wei: bigint): string
FeeMarket.gweiToWei(gwei: number): bigint
```

Convert between wei and gwei for display.

**Example:**
```typescript
const gwei = FeeMarket.weiToGwei(1_234_567_890n);
// gwei === "1.234567890"

const wei = FeeMarket.gweiToWei(1.5);
// wei === 1_500_000_000n
```

## Common Patterns

### Estimating Next Base Fee
```typescript
// Get current block state
const currentState: FeeMarket.State = {
  gasUsed: 20_000_000n,
  gasLimit: 30_000_000n,
  baseFee: 1_000_000_000n,
  excessBlobGas: 0n,
  blobGasUsed: 0n
};

// Calculate next block's base fee
const nextState = FeeMarket.State.next.call(currentState);
console.log(`Next base fee: ${FeeMarket.weiToGwei(nextState.baseFee)} gwei`);
```

### Checking Transaction Inclusion
```typescript
// Can my transaction be included?
const canInclude = FeeMarket.canIncludeTx({
  maxFeePerGas: 2_000_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  baseFee: currentState.baseFee
});

if (!canInclude) {
  console.log("Insufficient fee - increase maxFeePerGas");
}
```

### Calculating Transaction Cost
```typescript
const fee = FeeMarket.calculateTxFee({
  maxFeePerGas: 2_000_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  baseFee: currentState.baseFee
});

const gasUsed = 21_000n; // Standard transfer
const totalCost = fee.effectiveGasPrice * gasUsed;

console.log(`Total cost: ${FeeMarket.weiToGwei(totalCost)} gwei`);
console.log(`  Base fee: ${FeeMarket.weiToGwei(fee.baseFee * gasUsed)} gwei`);
console.log(`  Priority: ${FeeMarket.weiToGwei(fee.priorityFee * gasUsed)} gwei`);
```

### Blob Transaction Fees
```typescript
// Calculate blob transaction cost
const blobFee = FeeMarket.calculateBlobTxFee({
  maxFeePerGas: 2_000_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  baseFee: currentState.baseFee,
  maxFeePerBlobGas: 10_000_000n,
  blobBaseFee: FeeMarket.State.getBlobBaseFee.call(currentState),
  blobCount: 3n
});

const gasUsed = 100_000n;
const executionCost = blobFee.effectiveGasPrice * gasUsed;
const blobCost = blobFee.totalBlobFee;
const totalCost = executionCost + blobCost;

console.log(`Execution: ${FeeMarket.weiToGwei(executionCost)} gwei`);
console.log(`Blobs: ${FeeMarket.weiToGwei(blobCost)} gwei`);
console.log(`Total: ${FeeMarket.weiToGwei(totalCost)} gwei`);
```

### Projecting Fee Trends
```typescript
// Project fees for next 10 blocks assuming high usage
const projectedFees = FeeMarket.projectBaseFees(
  currentState,
  10,            // blocks
  25_000_000n,  // 83% full (above target)
  524288n       // 4 blobs per block (above target)
);

console.log("Projected base fees:");
projectedFees.forEach((fee, i) => {
  console.log(`  Block +${i + 1}: ${FeeMarket.weiToGwei(fee)} gwei`);
});
```

### Monitoring Block Utilization
```typescript
const state: FeeMarket.State = { /* current block */ };

// Check gas utilization
const gasTarget = FeeMarket.State.getGasTarget.call(state);
const gasUtilization = Number(state.gasUsed * 100n / state.gasLimit);
console.log(`Gas: ${gasUtilization.toFixed(1)}% (target: 50%)`);

if (FeeMarket.State.isAboveGasTarget.call(state)) {
  console.log("  ↑ Base fee will increase");
}

// Check blob utilization
const blobUtilization = Number(
  state.blobGasUsed * 100n / FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK
);
console.log(`Blobs: ${blobUtilization.toFixed(1)}% (target: 3 blobs)`);

if (FeeMarket.State.isAboveBlobGasTarget.call(state)) {
  console.log("  ↑ Blob base fee will increase");
}
```

## Best Practices

### Setting Transaction Fees

1. **maxFeePerGas**: Set based on worst-case projection
   ```typescript
   const currentBase = state.baseFee;
   const maxExpected = currentBase * 2n; // Allow 2x increase
   const maxFee = maxExpected + 1_000_000_000n; // + 1 gwei tip buffer
   ```

2. **maxPriorityFeePerGas**: Set based on urgency
   ```typescript
   const tips = {
     slow: 100_000_000n,     // 0.1 gwei
     standard: 1_000_000_000n, // 1 gwei
     fast: 2_000_000_000n     // 2 gwei
   };
   ```

3. **maxFeePerBlobGas**: Set based on blob fee projection
   ```typescript
   const currentBlobFee = FeeMarket.State.getBlobBaseFee.call(state);
   const maxBlobFee = currentBlobFee * 3n; // Allow 3x increase
   ```

### Validating Before Submission

Always validate parameters before submitting:
```typescript
const params = {
  maxFeePerGas: 2_000_000_000n,
  maxPriorityFeePerGas: 1_000_000_000n,
  baseFee: state.baseFee
};

const errors = FeeMarket.validateTxFeeParams(params);
if (errors.length > 0) {
  throw new Error(`Invalid params: ${errors.join(", ")}`);
}

if (!FeeMarket.canIncludeTx(params)) {
  throw new Error("Transaction cannot be included with current fees");
}
```

### Monitoring Network Conditions

Track fee trends over time:
```typescript
// Sample current state
const state = getCurrentBlockState();

// Project next 5 blocks with current trend
const avgGasUsed = getAverageGasUsed(10); // Last 10 blocks
const avgBlobGasUsed = getAverageBlobGasUsed(10);

const projection = FeeMarket.projectBaseFees(
  state,
  5,
  avgGasUsed,
  avgBlobGasUsed
);

// Adjust transaction timing based on projection
const isIncreasing = projection[4] > state.baseFee;
if (isIncreasing) {
  console.log("Fees trending up - submit soon");
} else {
  console.log("Fees trending down - wait for better rate");
}
```

## Type Safety

All operations are type-safe with TypeScript:

```typescript
// Types are inferred correctly
const state: FeeMarket.State = { /* ... */ };
const nextState = FeeMarket.nextState(state);
// nextState is typed as FeeMarket.State

// Parameters are validated at compile time
const fee = FeeMarket.calculateTxFee({
  maxFeePerGas: 1_000_000_000n,
  maxPriorityFeePerGas: 100_000_000n,
  baseFee: 900_000_000n
});
// fee is typed as FeeMarket.TxFee

// Blob parameters extend base parameters
const blobFee = FeeMarket.calculateBlobTxFee({
  ...fee,  // Base params
  maxFeePerBlobGas: 10_000_000n,
  blobBaseFee: 5_000_000n,
  blobCount: 3n
});
// blobFee is typed as FeeMarket.BlobTxFee
```

## Performance

All calculations are optimized for high-throughput:
- Base fee calculation: ~4M ops/sec
- Blob fee calculation: ~100K ops/sec (exponential approximation)
- State transitions: ~2M ops/sec
- Validation: ~20M ops/sec

Run benchmarks: `bun run src/primitives/fee-market.bench.ts`
