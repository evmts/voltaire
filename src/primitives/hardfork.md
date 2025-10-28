# Hardfork

Ethereum protocol upgrade identification and comparison utilities.

## Overview

Ethereum hardforks are protocol upgrades that change EVM behavior, gas costs, or add features. Each hardfork builds upon previous ones, maintaining backward compatibility while adding improvements. This module provides type-safe hardfork identification, version comparison, and feature detection.

## Ethereum Hardfork Timeline

| Hardfork | Date | Key Features |
|----------|------|-------------|
| **Frontier** | Jul 2015 | Initial Ethereum launch, base EVM opcodes |
| **Homestead** | Mar 2016 | Added DELEGATECALL, stability improvements |
| **DAO** | Jul 2016 | Emergency fork for DAO hack (no EVM changes) |
| **Tangerine Whistle** | Oct 2016 | EIP-150: Gas cost increases for IO operations |
| **Spurious Dragon** | Nov 2016 | EIP-161: State cleaning, empty account removal |
| **Byzantium** | Oct 2017 | REVERT, RETURNDATASIZE, STATICCALL opcodes |
| **Constantinople** | Feb 2019 | CREATE2, shift opcodes, EXTCODEHASH |
| **Petersburg** | Feb 2019 | Removed EIP-1283 (reentrancy fix) |
| **Istanbul** | Dec 2019 | EIP-2200: SSTORE gas, CHAINID, SELFBALANCE |
| **Muir Glacier** | Jan 2020 | Difficulty bomb delay (no EVM changes) |
| **Berlin** | Apr 2021 | EIP-2929: Gas cost for cold/warm access |
| **London** | Aug 2021 | **EIP-1559**: Base fee mechanism, BASEFEE opcode |
| **Arrow Glacier** | Dec 2021 | Difficulty bomb delay (no EVM changes) |
| **Gray Glacier** | Jun 2022 | Difficulty bomb delay (no EVM changes) |
| **Merge** | Sep 2022 | **Proof of Stake**: PREVRANDAO replaces DIFFICULTY |
| **Shanghai** | Apr 2023 | **EIP-3855**: PUSH0 opcode, withdrawals enabled |
| **Cancun** | Mar 2024 | **EIP-4844**: Blob transactions, **EIP-1153**: TLOAD/TSTORE, MCOPY |
| **Prague** | May 2025 | EIP-2537: BLS12-381 precompiles, EIP-7702: EOA code |
| **Osaka** | TBD | EIP-7883: ModExp gas increase |

## API Reference

### Core Types

```typescript
enum Hardfork.Id {
  FRONTIER = 0,
  HOMESTEAD = 1,
  // ... (see timeline above)
  OSAKA = 18
}

const Hardfork.DEFAULT: Hardfork.Id; // Currently PRAGUE
```

### Comparison Operations

**Standard Form:**

```typescript
// Check if current >= target
Hardfork.isAtLeast(current: Id, target: Id): boolean

// Check if current < target
Hardfork.isBefore(current: Id, target: Id): boolean

// Check if current > target
Hardfork.isAfter(current: Id, target: Id): boolean

// Check equality
Hardfork.isEqual(a: Id, b: Id): boolean

// Three-way comparison (-1, 0, 1)
Hardfork.compare(a: Id, b: Id): number

// Get minimum/maximum from array
Hardfork.min(forks: Id[]): Id
Hardfork.max(forks: Id[]): Id
```

**Convenience Form:**

```typescript
Hardfork.gte.call(this: Id, target: Id): boolean  // >=
Hardfork.lte.call(this: Id, target: Id): boolean  // <=
Hardfork.lt.call(this: Id, target: Id): boolean   // <
Hardfork.gt.call(this: Id, target: Id): boolean   // >
Hardfork.eq.call(this: Id, other: Id): boolean    // ==
```

### String Conversion

```typescript
// Parse hardfork name (case-insensitive, handles aliases)
Hardfork.fromString(name: string): Id | undefined

// Convert ID to name
Hardfork.toString(fork: Id): string

// Validate hardfork name
Hardfork.isValidName(name: string): boolean
```

**Supported Aliases:**
- `"paris"` → `MERGE`
- `"constantinoplefix"` → `PETERSBURG`

**Operator Support:**
```typescript
Hardfork.fromString(">=Cancun")  // Strips operators, returns CANCUN
Hardfork.fromString(">Shanghai") // Returns SHANGHAI
```

### Feature Detection

**Standard Form:**

```typescript
// EIP-1559: Base fee mechanism (London+)
Hardfork.hasEIP1559(fork: Id): boolean

// EIP-3855: PUSH0 opcode (Shanghai+)
Hardfork.hasEIP3855(fork: Id): boolean

// EIP-4844: Blob transactions (Cancun+)
Hardfork.hasEIP4844(fork: Id): boolean

// EIP-1153: Transient storage TLOAD/TSTORE (Cancun+)
Hardfork.hasEIP1153(fork: Id): boolean

// Check if post-Merge (Proof of Stake)
Hardfork.isPostMerge(fork: Id): boolean
```

**Convenience Form:**

```typescript
Hardfork.supportsEIP1559.call(this: Id): boolean
Hardfork.supportsPUSH0.call(this: Id): boolean
Hardfork.supportsBlobs.call(this: Id): boolean
Hardfork.supportsTransientStorage.call(this: Id): boolean
Hardfork.isPoS.call(this: Id): boolean
```

### Utilities

```typescript
// Get all hardfork names
Hardfork.allNames(): string[]

// Get all hardfork IDs
Hardfork.allIds(): Id[]

// Generate range between two hardforks (inclusive)
Hardfork.range(start: Id, end: Id): Id[]
```

## Usage Examples

### Version Compatibility Checks

```typescript
import { Hardfork } from './hardfork.js';

// Check if network supports EIP-1559
const currentFork = Hardfork.Id.CANCUN;
if (Hardfork.hasEIP1559(currentFork)) {
  // Use EIP-1559 transaction format
  console.log("EIP-1559 base fee mechanism available");
}

// Require minimum version
const minVersion = Hardfork.Id.LONDON;
if (Hardfork.isAtLeast(currentFork, minVersion)) {
  // Safe to use London+ features
}
```

### Feature Detection

```typescript
// Check multiple features
const fork = Hardfork.Id.CANCUN;

const features = {
  eip1559: Hardfork.hasEIP1559(fork),      // true (London+)
  push0: Hardfork.hasEIP3855(fork),         // true (Shanghai+)
  blobs: Hardfork.hasEIP4844(fork),         // true (Cancun+)
  transientStorage: Hardfork.hasEIP1153(fork), // true (Cancun+)
  proofOfStake: Hardfork.isPostMerge(fork)  // true (Merge+)
};

// Convenience form
if (Hardfork.supportsBlobs.call(fork)) {
  console.log("Blob transactions available");
}
```

### String Parsing

```typescript
// Parse network configuration
const config = { hardfork: "Cancun" };
const fork = Hardfork.fromString(config.hardfork);

if (fork !== undefined) {
  console.log(`Hardfork ID: ${fork}`);
  console.log(`Standard name: ${Hardfork.toString(fork)}`);
}

// Handle aliases
const merge1 = Hardfork.fromString("merge");  // MERGE
const merge2 = Hardfork.fromString("paris");  // MERGE (alias)
console.log(Hardfork.isEqual(merge1, merge2)); // true

// Validate input
if (!Hardfork.isValidName(userInput)) {
  throw new Error(`Invalid hardfork: ${userInput}`);
}
```

### Range Operations

```typescript
// Get all hardforks between two versions
const forks = Hardfork.range(
  Hardfork.Id.BERLIN,
  Hardfork.Id.SHANGHAI
);
// [BERLIN, LONDON, ARROW_GLACIER, GRAY_GLACIER, MERGE, SHANGHAI]

// Find oldest supported version
const supported = [
  Hardfork.Id.CANCUN,
  Hardfork.Id.SHANGHAI,
  Hardfork.Id.BERLIN
];
const oldest = Hardfork.min(supported); // BERLIN
const newest = Hardfork.max(supported); // CANCUN
```

### Comparison Patterns

```typescript
// Standard form
const current = Hardfork.Id.CANCUN;
if (Hardfork.isAtLeast(current, Hardfork.Id.LONDON)) {
  // EIP-1559 available
}

// Convenience form
if (Hardfork.gte.call(current, Hardfork.Id.LONDON)) {
  // Same check, method call style
}

// Sorting hardforks
const forks = [Hardfork.Id.CANCUN, Hardfork.Id.BERLIN, Hardfork.Id.SHANGHAI];
forks.sort(Hardfork.compare);
// [BERLIN, SHANGHAI, CANCUN]
```

### Network Configuration

```typescript
// Determine network capabilities from hardfork
function getNetworkCapabilities(fork: Hardfork.Id) {
  return {
    consensus: Hardfork.isPostMerge(fork) ? "PoS" : "PoW",
    eip1559: Hardfork.hasEIP1559(fork),
    push0: Hardfork.hasEIP3855(fork),
    blobs: Hardfork.hasEIP4844(fork),
    transientStorage: Hardfork.hasEIP1153(fork),
  };
}

const caps = getNetworkCapabilities(Hardfork.Id.CANCUN);
// { consensus: "PoS", eip1559: true, push0: true, blobs: true, transientStorage: true }
```

## Common Patterns

### Version Gating

```typescript
// Gate features by hardfork version
function selectTransactionType(fork: Hardfork.Id) {
  if (Hardfork.hasEIP4844(fork)) {
    return "blob"; // Type 3
  } else if (Hardfork.hasEIP1559(fork)) {
    return "eip1559"; // Type 2
  } else {
    return "legacy"; // Type 0
  }
}
```

### Migration Helpers

```typescript
// Check if migration is needed
function needsUpgrade(current: Hardfork.Id, target: Hardfork.Id): boolean {
  return Hardfork.isBefore(current, target);
}

// Get upgrade path
function getUpgradePath(from: Hardfork.Id, to: Hardfork.Id): Hardfork.Id[] {
  return Hardfork.range(from, to).slice(1); // Exclude current
}

const upgrades = getUpgradePath(Hardfork.Id.BERLIN, Hardfork.Id.CANCUN);
// [LONDON, ARROW_GLACIER, GRAY_GLACIER, MERGE, SHANGHAI, CANCUN]
```

### Configuration Validation

```typescript
// Validate and normalize config
function parseNetworkConfig(config: { hardfork?: string }) {
  const hardforkStr = config.hardfork ?? "prague";

  if (!Hardfork.isValidName(hardforkStr)) {
    throw new Error(`Unknown hardfork: ${hardforkStr}`);
  }

  const fork = Hardfork.fromString(hardforkStr)!;
  return {
    hardfork: fork,
    hardforkName: Hardfork.toString(fork), // Normalized name
  };
}
```

## Best Practices

1. **Use Feature Detection Over Version Checks**
   ```typescript
   // Good: Explicit about what you need
   if (Hardfork.hasEIP4844(fork)) {
     // Use blob transactions
   }

   // Less clear: Couples code to specific version
   if (fork >= Hardfork.Id.CANCUN) {
     // What feature do we actually need?
   }
   ```

2. **Validate User Input**
   ```typescript
   // Always validate strings from external sources
   const fork = Hardfork.fromString(userInput);
   if (fork === undefined) {
     throw new Error("Invalid hardfork");
   }
   ```

3. **Use Convenience Forms for Readability**
   ```typescript
   // More readable with method call syntax
   if (Hardfork.supportsEIP1559.call(fork)) {
     // ...
   }
   ```

4. **Handle Aliases Consistently**
   ```typescript
   // Always normalize to standard names for storage
   const normalized = Hardfork.toString(
     Hardfork.fromString(userInput) ?? Hardfork.DEFAULT
   );
   ```

## Performance

All comparison operations are simple integer comparisons (O(1)). String parsing has minor overhead from case normalization but is still very fast (~100k-1M ops/sec). Feature detection is as fast as basic comparisons.

Benchmark with `bun run src/primitives/hardfork.bench.ts`.

## Related

- **Network**: Chain ID and network configuration
- **Transaction**: Transaction type selection based on hardfork
- **Block**: Block structure changes per hardfork
