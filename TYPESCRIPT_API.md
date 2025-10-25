# TypeScript/JavaScript API Documentation

## Overview

The `@tevm/primitives` package provides TypeScript/JavaScript implementations of Ethereum primitives and utilities. All implementations are pure TypeScript with no native dependencies, making them work in any JavaScript environment (Node.js, Bun, Deno, browsers).

## Installation

```bash
npm install @tevm/primitives
# or
bun add @tevm/primitives
```

## Modules

### Hex Utilities

Convert between hex strings and byte arrays.

#### `hexToBytes(hex: string): Uint8Array`

Converts a hex string to a Uint8Array.

```typescript
import { hexToBytes } from '@tevm/primitives';

const bytes = hexToBytes('0x1234');
// Uint8Array([0x12, 0x34])

const bytes2 = hexToBytes('abcd');  // 0x prefix optional
// Uint8Array([0xab, 0xcd])
```

#### `bytesToHex(bytes: Uint8Array): string`

Converts a Uint8Array to a 0x-prefixed hex string.

```typescript
import { bytesToHex } from '@tevm/primitives';

const hex = bytesToHex(new Uint8Array([0x12, 0x34]));
// "0x1234"
```

### Keccak-256 Hashing

Cryptographic hashing using Keccak-256, the core hash function in Ethereum.

#### `keccak256(data: Uint8Array): Uint8Array`

Computes the Keccak-256 hash of input data.

```typescript
import { keccak256 } from '@tevm/primitives';

const data = new TextEncoder().encode('hello');
const hash = keccak256(data);
// Uint8Array(32) [...]
```

#### `keccak256Hex(hex: string): string`

Computes the Keccak-256 hash of a hex string and returns the result as hex.

```typescript
import { keccak256Hex } from '@tevm/primitives';

const hash = keccak256Hex('0x1234');
// "0x..."
```

### RLP Encoding

Recursive Length Prefix encoding, the serialization method used throughout Ethereum.

#### `encodeRlp(input: RlpInput): Uint8Array`

Encodes a value to RLP format. Accepts strings, numbers, bigints, Uint8Arrays, and nested arrays.

```typescript
import { encodeRlp } from '@tevm/primitives';

// Encode a number
const encoded1 = encodeRlp(42n);

// Encode a string
const encoded2 = encodeRlp('0x1234');

// Encode a list
const encoded3 = encodeRlp([1n, '0xabcd', new Uint8Array([1, 2])]);
```

#### `decodeRlp(data: Uint8Array): RlpDecoded`

Decodes RLP-encoded data.

```typescript
import { decodeRlp, encodeRlp } from '@tevm/primitives';

const encoded = encodeRlp([1n, 2n, 3n]);
const decoded = decodeRlp(encoded);
// [Uint8Array([1]), Uint8Array([2]), Uint8Array([3])]
```

#### Helper Functions

- `toHex(bytes: Uint8Array): string` - Convert bytes to hex
- `fromHex(hex: string): Uint8Array` - Convert hex to bytes

### Transactions

Support for all Ethereum transaction types with encoding and validation.

#### Transaction Types

```typescript
// Legacy Transaction (Type 0)
interface LegacyTransaction {
  type?: "legacy";
  nonce: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  to?: string;
  value: bigint;
  data: string;
  v: bigint;
  r: string;
  s: string;
}

// EIP-1559 Transaction (Type 2)
interface Eip1559Transaction {
  type: "eip1559";
  chainId: bigint;
  nonce: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  to?: string;
  value: bigint;
  data: string;
  accessList: AccessList;
  v: bigint;
  r: string;
  s: string;
}

// EIP-7702 Transaction (Type 4)
interface Eip7702Transaction {
  type: "eip7702";
  chainId: bigint;
  nonce: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  to?: string;
  value: bigint;
  data: string;
  accessList: AccessList;
  authorizationList: Authorization[];
  v: bigint;
  r: string;
  s: string;
}
```

#### `encodeLegacyForSigning(tx: LegacyTransaction, chainId: bigint): string`

Encodes a legacy transaction for signing using EIP-155.

```typescript
import { encodeLegacyForSigning } from '@tevm/primitives';

const tx: LegacyTransaction = {
  nonce: 0n,
  gasPrice: 20000000000n,
  gasLimit: 21000n,
  to: '0x...',
  value: 1000000000000000n,
  data: '0x',
  v: 37n,
  r: '0x...',
  s: '0x...',
};

const encoded = encodeLegacyForSigning(tx, 1n);
```

#### `encodeEip1559ForSigning(tx: Eip1559Transaction): string`

Encodes an EIP-1559 transaction for signing.

```typescript
import { encodeEip1559ForSigning } from '@tevm/primitives';

const tx: Eip1559Transaction = {
  type: "eip1559",
  chainId: 1n,
  nonce: 0n,
  maxPriorityFeePerGas: 2000000000n,
  maxFeePerGas: 100000000000n,
  gasLimit: 21000n,
  to: '0x...',
  value: 1000000000000000000n,
  data: '0x',
  accessList: [],
  v: 1n,
  r: '0x...',
  s: '0x...',
};

const encoded = encodeEip1559ForSigning(tx);
```

#### `encodeEip7702ForSigning(tx: Eip7702Transaction): string`

Encodes an EIP-7702 transaction with authorization list for signing.

#### `hashTransaction(tx: Transaction): string`

Computes the Keccak-256 hash of a transaction.

```typescript
import { hashTransaction } from '@tevm/primitives';

const hash = hashTransaction(tx);
// "0x..."
```

#### `validateTransaction(tx: Transaction): boolean`

Validates a transaction's structure.

```typescript
import { validateTransaction } from '@tevm/primitives';

if (validateTransaction(tx)) {
  console.log('Transaction is valid');
}
```

#### `detectTransactionType(data: string): TransactionType`

Detects the transaction type from RLP-encoded data.

```typescript
import { detectTransactionType } from '@tevm/primitives';

const type = detectTransactionType('0x...');
// "legacy" | "eip1559" | "eip7702"
```

#### `parseTransaction(data: string): Transaction`

Parses RLP-encoded transaction data into a transaction object.

```typescript
import { parseTransaction } from '@tevm/primitives';

const tx = parseTransaction('0x...');
```

### Bytecode Analysis

Analyze and validate EVM bytecode with jump destination tracking.

#### `analyzeJumpDestinations(bytecode: Uint8Array | string): JumpDestination[]`

Analyzes bytecode to find all valid JUMPDEST positions.

```typescript
import { analyzeJumpDestinations } from '@tevm/primitives';

const bytecode = '0x60806040...';
const jumps = analyzeJumpDestinations(bytecode);
// [{ position: 100, valid: true }, ...]
```

#### `validateBytecode(bytecode: Uint8Array | string): boolean`

Validates bytecode structure, ensuring PUSH instructions have complete data.

```typescript
import { validateBytecode } from '@tevm/primitives';

if (validateBytecode(bytecode)) {
  console.log('Bytecode is valid');
}
```

#### `isValidJumpDest(bytecode: Uint8Array, position: number): boolean`

Checks if a specific position is a valid JUMPDEST.

```typescript
import { isValidJumpDest } from '@tevm/primitives';

const isValid = isValidJumpDest(bytecode, 100);
```

#### `isBytecodeBoundary(bytecode: Uint8Array, position: number): boolean`

Checks if a position is at an opcode boundary (not in PUSH data).

### Opcodes

EVM opcode enumeration and utilities.

#### `enum Opcode`

Complete enumeration of all EVM opcodes.

```typescript
import { Opcode } from '@tevm/primitives';

const add = Opcode.ADD;      // 0x01
const mul = Opcode.MUL;      // 0x02
const push1 = Opcode.PUSH1;  // 0x60
const jumpdest = Opcode.JUMPDEST;  // 0x5b
```

### Gas Calculations

EIP-1559 fee market and gas cost utilities.

#### Gas Constants

```typescript
export const TX_BASE_COST = 21000;
export const TX_DATA_ZERO_COST = 4;
export const TX_DATA_NONZERO_COST = 16;
export const TX_CREATE_COST = 32000;
export const BASE_FEE_MAX_CHANGE_DENOMINATOR = 8;
export const ELASTICITY_MULTIPLIER = 2;
```

#### `calculateNextBaseFee(parentBaseFee: bigint, parentGasUsed: bigint, parentGasLimit: bigint): bigint`

Calculates the next block's base fee according to EIP-1559.

```typescript
import { calculateNextBaseFee } from '@tevm/primitives';

const nextBaseFee = calculateNextBaseFee(
  1000000000n,  // 1 gwei parent base fee
  15000000n,    // parent gas used
  30000000n     // parent gas limit
);
```

#### `calculateEffectiveGasPrice(baseFee: bigint, maxFeePerGas: bigint, maxPriorityFeePerGas: bigint): bigint`

Calculates the effective gas price for a transaction.

```typescript
import { calculateEffectiveGasPrice } from '@tevm/primitives';

const effectiveGasPrice = calculateEffectiveGasPrice(
  1000000000n,   // base fee
  2000000000n,   // max fee per gas
  1000000000n    // max priority fee per gas
);
```

#### `calculateIntrinsicGas(data: Uint8Array): bigint`

Calculates the intrinsic gas cost for transaction data.

```typescript
import { calculateIntrinsicGas, hexToBytes } from '@tevm/primitives';

const data = hexToBytes('0x1234');
const gasCost = calculateIntrinsicGas(data);
// 21000n + (cost for each byte)
```

#### `calculateMemoryGasCost(newSize: bigint, currentSize: bigint): bigint`

Calculates the gas cost for memory expansion.

### Hardforks

Ethereum hardfork enumeration and version comparison.

#### `enum Hardfork`

```typescript
import { Hardfork } from '@tevm/primitives';

const berlin = Hardfork.BERLIN;
const london = Hardfork.LONDON;
const cancun = Hardfork.CANCUN;
```

#### `isAtLeast(current: Hardfork, target: Hardfork): boolean`

Checks if a hardfork is at or after a target version.

```typescript
import { Hardfork, isAtLeast } from '@tevm/primitives';

if (isAtLeast(Hardfork.CANCUN, Hardfork.LONDON)) {
  console.log('Cancun includes London features');
}
```

#### `isBefore(current: Hardfork, target: Hardfork): boolean`

Checks if a hardfork is before a target version.

#### `fromString(name: string): Hardfork`

Parses a hardfork from a string (case-insensitive).

```typescript
import { fromString } from '@tevm/primitives';

const hardfork = fromString('london');
// Hardfork.LONDON
```

#### `getAllHardforks(): Hardfork[]`

Returns all hardforks in chronological order.

### Event Logs

Event log parsing and filtering utilities.

#### Types

```typescript
interface EventLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber?: bigint;
  transactionHash?: string;
  transactionIndex?: number;
  blockHash?: string;
  logIndex?: number;
  removed?: boolean;
}

interface EventSignature {
  name: string;
  inputs: EventInput[];
}

interface EventInput {
  name: string;
  type: string;
  indexed: boolean;
}
```

#### `parseEventLog(log: EventLog, signature: EventSignature): DecodedLog`

Parses an event log using a signature.

```typescript
import { parseEventLog } from '@tevm/primitives';

const log: EventLog = {
  address: '0x...',
  topics: ['0x...', '0x...'],
  data: '0x...',
};

const signature: EventSignature = {
  name: 'Transfer',
  inputs: [
    { name: 'from', type: 'address', indexed: true },
    { name: 'to', type: 'address', indexed: true },
    { name: 'value', type: 'uint256', indexed: false },
  ],
};

const decoded = parseEventLog(log, signature);
```

#### `filterLogsByTopics(logs: EventLog[], topics: (string | null)[]): EventLog[]`

Filters logs by topics (null matches any).

```typescript
import { filterLogsByTopics } from '@tevm/primitives';

const filtered = filterLogsByTopics(logs, [
  '0x...', // topic0 must match
  null,    // topic1 can be anything
  '0x...', // topic2 must match
]);
```

#### `createEventSignatureHash(signature: string): string`

Creates an event signature hash (topic0).

```typescript
import { createEventSignatureHash } from '@tevm/primitives';

const hash = createEventSignatureHash('Transfer(address,address,uint256)');
// "0x..."
```

### SIWE (Sign-In with Ethereum)

EIP-4361 SIWE message handling.

#### Type

```typescript
interface SiweMessage {
  domain: string;
  address: string;
  statement?: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime?: string;
  notBefore?: string;
  requestId?: string;
  resources?: string[];
}
```

#### `parseMessage(message: string): SiweMessage`

Parses a SIWE message from a string.

```typescript
import { parseMessage } from '@tevm/primitives';

const message = `example.com wants you to sign in with your Ethereum account:
0x1234567890123456789012345678901234567890

I accept the Terms of Service

URI: https://example.com/login
Version: 1
Chain ID: 1
Nonce: abcd1234
Issued At: 2024-01-01T00:00:00.000Z`;

const parsed = parseMessage(message);
```

#### `formatMessage(message: SiweMessage): string`

Formats a SIWE message for signing.

```typescript
import { formatMessage } from '@tevm/primitives';

const formatted = formatMessage(parsed);
```

#### `validateMessage(message: SiweMessage): boolean`

Validates a SIWE message structure.

#### `isExpired(message: SiweMessage, now?: number): boolean`

Checks if a message is expired.

#### `isNotYetValid(message: SiweMessage, now?: number): boolean`

Checks if a message is not yet valid.

### Precompiles

EVM precompile addresses and utilities (execution stubs only).

#### `enum PrecompileAddress`

```typescript
import { PrecompileAddress } from '@tevm/primitives';

const ecrecover = PrecompileAddress.ECRECOVER;  // "0x01"
const sha256 = PrecompileAddress.SHA256;        // "0x02"
const bn254Add = PrecompileAddress.BN254_ADD;   // "0x06"
```

#### `isPrecompile(address: string, hardfork: Hardfork): boolean`

Checks if an address is a precompile for a given hardfork.

```typescript
import { isPrecompile, PrecompileAddress, Hardfork } from '@tevm/primitives';

const isPre = isPrecompile(PrecompileAddress.BN254_ADD, Hardfork.BYZANTIUM);
// true (BN254 precompiles added in Byzantium)
```

## Examples

See the [examples directory](./examples/) for complete working examples:

- Transaction encoding and signing
- Bytecode analysis
- Event log parsing
- Gas calculations
- SIWE message handling

## Type Definitions

All types are fully typed with TypeScript. Import types using:

```typescript
import type {
  Transaction,
  LegacyTransaction,
  Eip1559Transaction,
  EventLog,
  SiweMessage,
  // etc.
} from '@tevm/primitives';
```

## Platform Compatibility

All TypeScript implementations are pure JavaScript and work in:
- Node.js (v18+)
- Bun
- Deno
- Browsers (modern)

No native dependencies or FFI required for TypeScript implementations.

## Performance Notes

TypeScript implementations prioritize correctness and compatibility over performance. For performance-critical applications, consider using:
- Native Zig implementations (when available)
- Native bindings via Bun FFI
- Alternative high-performance libraries for specific operations

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on adding new features or improving existing implementations.
