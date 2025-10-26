---
title: Getting Started
description: Install and use @tevm/primitives in your TypeScript/JavaScript project
---

## Installation

Install via npm or your preferred package manager:

```bash
# Using npm
npm install @tevm/primitives

# Using bun
bun add @tevm/primitives

# Using pnpm
pnpm add @tevm/primitives

# Using yarn
yarn add @tevm/primitives
```

**No native dependencies required** - TypeScript implementations work out of the box.

## Basic Usage

### Hex Utilities

Convert between hex strings and bytes:

```typescript
import { hexToBytes, bytesToHex } from '@tevm/primitives';

// Convert hex to bytes
const bytes = hexToBytes('0xabcd1234');
// Uint8Array([171, 205, 18, 52])

// Convert bytes to hex
const hex = bytesToHex(bytes);
// "0xabcd1234"

// 0x prefix is optional
const bytes2 = hexToBytes('abcd');
```

### Keccak-256 Hashing

Compute Keccak-256 hashes (via @noble/hashes):

```typescript
import { keccak256, hexToBytes, bytesToHex } from '@tevm/primitives';

// Hash bytes
const data = new TextEncoder().encode('hello world');
const hash = keccak256(data);
console.log('Hash:', bytesToHex(hash));

// Hash hex string (convert first)
const hexData = '0x1234';
const hash2 = keccak256(hexToBytes(hexData));
```

### EIP-191 Personal Message Hashing

Sign-In with Ethereum personal message hashing:

```typescript
import { hashMessage, bytesToHex } from '@tevm/primitives';

const message = 'Sign this message';
const hash = hashMessage(message);
console.log('Message hash:', bytesToHex(hash));
// Prefixes with "\x19Ethereum Signed Message:\n" + length
```

### Working with Transactions

Validate and hash transactions:

```typescript
import {
  type Transaction,
  validateTransaction,
  hashTransaction,
} from '@tevm/primitives';

const tx: Transaction = {
  type: "eip1559",
  chainId: 1n,
  nonce: 42n,
  maxPriorityFeePerGas: 2000000000n,
  maxFeePerGas: 100000000000n,
  gasLimit: 21000n,
  to: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  value: 1000000000000000000n,
  data: '0x',
  accessList: [],
};

// Validate structure
if (validateTransaction(tx)) {
  // Compute hash
  const hash = hashTransaction(tx);
  console.log('Transaction hash:', hash);
}
```

### Bytecode Analysis

Analyze and validate EVM bytecode:

```typescript
import {
  analyzeJumpDestinations,
  validateBytecode,
  isValidJumpDest,
  hexToBytes,
} from '@tevm/primitives';

const bytecode = '0x608060405234801561001057600080fd5b50...';

// Validate bytecode structure
if (validateBytecode(bytecode)) {
  // Find all JUMPDEST positions
  const jumps = analyzeJumpDestinations(bytecode);
  console.log('Valid jump destinations:', jumps);

  // Check if specific position is valid JUMPDEST
  const isValid = isValidJumpDest(hexToBytes(bytecode), 100);
  console.log('Position 100 is valid JUMPDEST:', isValid);
}
```

### Gas Calculations

EIP-1559 fee market and gas calculations:

```typescript
import {
  calculateNextBaseFee,
  calculateEffectiveGasPrice,
  calculateIntrinsicGas,
  hexToBytes,
} from '@tevm/primitives';

// Calculate next block's base fee (EIP-1559)
const nextBaseFee = calculateNextBaseFee(
  1000000000n,  // parent base fee (1 gwei)
  15000000n,    // parent gas used
  30000000n     // parent gas limit
);

// Calculate effective gas price
const effectiveGasPrice = calculateEffectiveGasPrice(
  1000000000n,   // base fee
  2000000000n,   // max fee per gas
  1000000000n    // max priority fee per gas
);

// Calculate intrinsic gas for transaction data
const data = hexToBytes('0x1234');
const gasCost = calculateIntrinsicGas(data);
```

### Hardforks

Version comparisons and chronological ordering:

```typescript
import {
  Hardfork,
  isAtLeast,
  isBefore,
  fromString,
  getAllHardforks,
} from '@tevm/primitives';

// Check if hardfork is at or after a version
if (isAtLeast(Hardfork.CANCUN, Hardfork.LONDON)) {
  console.log('Cancun includes London features');
}

// Check if before a version
if (isBefore(Hardfork.BERLIN, Hardfork.LONDON)) {
  console.log('Berlin is before London');
}

// Parse from string (case-insensitive)
const hardfork = fromString('london');
// Hardfork.LONDON

// Get all hardforks in chronological order
const all = getAllHardforks();
```

### Event Log Parsing

Parse and filter Ethereum event logs:

```typescript
import {
  parseEventLog,
  filterLogsByTopics,
  createEventSignatureHash,
  type EventLog,
  type EventSignature,
} from '@tevm/primitives';

// Define event signature
const transferSignature: EventSignature = {
  name: 'Transfer',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ],
};

// Parse log
const log: EventLog = {
  address: '0x...',
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x000000000000000000000000...',
    '0x000000000000000000000000...',
  ],
  data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000',
};

const decoded = parseEventLog(log, transferSignature);
console.log('From:', decoded.args.from);
console.log('To:', decoded.args.to);
console.log('Value:', decoded.args.value);

// Filter logs by topics
const filtered = filterLogsByTopics(logs, [
  '0xddf252ad...', // Transfer event signature
  null,            // any from address
  '0x...',         // specific to address
]);

// Create event signature hash (topic0)
const hash = createEventSignatureHash('Transfer(address,address,uint256)');
```

### Sign-In with Ethereum (SIWE)

Parse and validate SIWE messages (EIP-4361):

```typescript
import {
  parseMessage,
  formatMessage,
  validateMessage,
  isExpired,
  isNotYetValid,
  type SiweMessage,
} from '@tevm/primitives';

const message = `example.com wants you to sign in with your Ethereum account:
0x1234567890123456789012345678901234567890

I accept the Terms of Service

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: abcd1234
Issued At: 2024-01-01T00:00:00.000Z`;

// Parse message
const parsed = parseMessage(message);

// Validate structure
if (validateMessage(parsed)) {
  // Check expiration
  if (!isExpired(parsed)) {
    // Check if not yet valid
    if (!isNotYetValid(parsed)) {
      // Re-format for signing
      const formatted = formatMessage(parsed);
      console.log('Valid SIWE message:', formatted);
    }
  }
}
```

### Opcodes

Work with EVM opcodes:

```typescript
import { Opcode } from '@tevm/primitives';

// Get opcodes
const add = Opcode.ADD;         // 0x01
const mul = Opcode.MUL;         // 0x02
const push1 = Opcode.PUSH1;     // 0x60
const jumpdest = Opcode.JUMPDEST; // 0x5b

// Check opcode types
console.log('PUSH1 is push:', Opcode.PUSH1 >= 0x60 && Opcode.PUSH1 <= 0x7f);
console.log('DUP1 is dup:', Opcode.DUP1 >= 0x80 && Opcode.DUP1 <= 0x8f);
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  Transaction,
  LegacyTransaction,
  Eip1559Transaction,
  Eip7702Transaction,
  Block,
  Receipt,
  EventLog,
  SiweMessage,
  Opcode,
  Hardfork,
} from '@tevm/primitives';
```

## Package Exports

```json
{
  "exports": {
    ".": {
      "types": "./types/index.d.ts",
      "import": "./dist/index.js"
    }
  }
}
```

## Next Steps

- [Crypto API](/typescript/crypto/) - Detailed cryptographic operations
- [Primitives API](/typescript/primitives/) - Core Ethereum primitives
- [Ethereum Types](/typescript/ethereum-types/) - Transaction, block, and receipt types
