# Primitives V2 API

**Data-first branded types for Ethereum primitives with optimal tree-shaking**

The V2 API is a complete redesign focused on data-first patterns, branded types, and maximal tree-shaking. All types are namespaced to avoid global pollution while maintaining clean ergonomics.

## Key Differences from V1

### Data-First Architecture
V2 uses **branded primitive types** (Uint8Array, bigint, string) with methods namespaced on the type itself:

```typescript
// V1 - Class instances
const address = new Address('0x...');
address.toChecksumHex();

// V2 - Branded primitives with namespaced methods
const address = Address.fromHex('0x...');
Address.toChecksumHex(address);
```

### Benefits

- **Tree-shaking**: Only import methods you use
- **Zero overhead**: No class instances, just primitives with type safety
- **Interop**: Easy to serialize, works seamlessly with other libraries
- **Performance**: No prototype chain lookup, direct function calls
- **Bundle size**: Significantly smaller due to tree-shaking

### Type Safety

Branded types prevent mixing incompatible values:

```typescript
const addr: Address = addressBytes;  // Type error!
const addr = Address.fromBytes(addressBytes); // ✓ Correct
```

## Installation

```bash
npm install @tevm/primitives
```

```typescript
import { Address, Hash, U256 } from '@tevm/primitives/v2';
```

## Core Concepts

### Branded Types

All V2 types are branded primitives:

```typescript
type Address = Uint8Array & { readonly __brand: symbol };
type Hash = Uint8Array & { readonly __brand: symbol };
type U256 = bigint & { readonly __brand: symbol };
type Hex = string & { readonly __brand: symbol };
```

### Namespaced Methods

Methods are organized as static functions on the type:

```typescript
// Constructors/factories
const addr = Address.fromHex('0x...');

// Transformations
const hex = Address.toHex(addr);
const checksum = Address.toChecksumHex(addr);

// Checks
const isZero = Address.isZero(addr);
const equals = Address.equals(addr1, addr2);
```

### Tree-Shaking

Only import what you use:

```typescript
// Only includes fromHex and toChecksumHex in bundle
import { Address } from '@tevm/primitives/v2';
const addr = Address.fromHex('0x...');
const checksum = Address.toChecksumHex(addr);
```

## API Reference

### Address

Ethereum address (20 bytes) with EIP-55 checksumming support.

**Type Definition**

```typescript
type Address = Uint8Array & { readonly __brand: symbol };
const ADDRESS_SIZE = 20;
```

**Factory Methods**

```typescript
// From hex string (with or without 0x prefix)
Address.fromHex(hex: string): Address

// From bytes (copies)
Address.fromBytes(bytes: Uint8Array): Address

// From U256 (takes lower 160 bits)
Address.fromU256(value: bigint): Address

// Zero address (0x0000...0000)
Address.zero(): Address
```

**Conversions**

```typescript
// To lowercase hex string
Address.toHex(addr: Address): string

// To EIP-55 checksummed hex
Address.toChecksumHex(addr: Address): string

// To U256 (not implemented)
Address.toU256(addr: Address): bigint
```

**Checks**

```typescript
// Check if zero address
Address.isZero(addr: Address): boolean

// Compare equality
Address.equals(a: Address, b: Address): boolean

// Validate hex format
Address.isValid(str: string): boolean

// Validate EIP-55 checksum
Address.isValidChecksum(str: string): boolean

// Type guard
isAddress(value: unknown): value is Address
```

**Stubs (Not Implemented)**

```typescript
// Derive address from public key
Address.fromPublicKey(x: bigint, y: bigint): Address

// Calculate CREATE address
Address.calculateCreateAddress(creator: Address, nonce: bigint): Address

// Calculate CREATE2 address
Address.calculateCreate2Address(
  creator: Address,
  salt: bigint,
  initCode: Uint8Array
): Address
```

**Example**

```typescript
import { Address } from '@tevm/primitives/v2';

// Create from hex
const addr = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');

// Convert to checksum
const checksum = Address.toChecksumHex(addr);
// '0xa0Cf798816D4b9b9866b5330EEa46a18382f251e'

// Check if zero
if (!Address.isZero(addr)) {
  console.log('Non-zero address');
}

// Compare addresses
const addr2 = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');
Address.equals(addr, addr2); // true
```

---

### Hash

32-byte hash with constant-time comparison.

**Type Definition**

```typescript
type Hash = Uint8Array & { readonly __brand: symbol };
const HASH_SIZE = 32;
```

**Factory Methods**

```typescript
// From hex string (with or without 0x prefix)
Hash.fromHex(hex: string): Hash

// From bytes (copies)
Hash.fromBytes(bytes: Uint8Array): Hash
```

**Conversions**

```typescript
// To hex string
Hash.toHex(hash: Hash): string
```

**Operations**

```typescript
// Constant-time equality check
Hash.equals(a: Hash, b: Hash): boolean

// Type guard
isHash(value: unknown): value is Hash
```

**Stubs (Not Implemented)**

```typescript
// Compute Keccak-256 hash
Hash.keccak256(data: Uint8Array): Hash
```

**Constants**

```typescript
const ZERO_HASH: Hash; // All zeros
```

**Example**

```typescript
import { Hash } from '@tevm/primitives/v2';

// Create from hex
const hash = Hash.fromHex(
  '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
);

// Convert to hex
const hex = Hash.toHex(hash);

// Constant-time comparison
const hash2 = Hash.fromHex('0x...');
if (Hash.equals(hash, hash2)) {
  console.log('Hashes match');
}
```

---

### Hex

Hex string with strict validation and utility methods.

**Type Definition**

```typescript
type Hex = string & { readonly __brand: symbol };
```

**Factory Methods**

```typescript
// From string (validates format)
Hex(value: string): Hex

// Check if valid hex string
Hex.isHex(value: string): boolean

// From bytes
Hex.fromBytes(bytes: Uint8Array): Hex
```

**Conversions**

```typescript
// To bytes
Hex.toBytes(hex: Hex): Uint8Array
```

**Operations**

```typescript
// Concatenate hex strings
Hex.concat(...hexes: Hex[]): Hex

// Slice by byte positions
Hex.slice(hex: Hex, start: number, end?: number): Hex

// Get size in bytes
Hex.size(hex: Hex): number

// Pad to target size
Hex.pad(hex: Hex, targetSize: number): Hex

// Remove leading zeros
Hex.trim(hex: Hex): Hex
```

**Errors**

```typescript
class InvalidHexFormatError extends Error // Missing 0x prefix
class InvalidHexLengthError extends Error // Wrong length
class InvalidHexCharacterError extends Error // Invalid character
class OddLengthHexError extends Error // Odd number of digits
```

**Example**

```typescript
import { Hex } from '@tevm/primitives/v2';

// Create and validate
const hex = Hex('0x1234');

// Convert to bytes
const bytes = Hex.toBytes(hex);

// Concatenate
const hex2 = Hex('0x5678');
const combined = Hex.concat(hex, hex2); // 0x12345678

// Pad to 32 bytes
const padded = Hex.pad(hex, 32); // 0x0000...001234

// Trim leading zeros
const trimmed = Hex.trim(padded); // 0x1234
```

---

### U256

256-bit unsigned integer with wrapping arithmetic.

**Type Definition**

```typescript
type U256 = bigint & { readonly __brand: symbol };
```

**Factory Methods**

```typescript
// From bigint or string
U256(value: bigint | string): U256

// From hex string
U256.fromHex(hex: string): U256

// From bigint
U256.fromBigInt(value: bigint): U256

// From bytes (big-endian)
U256.fromBytes(bytes: Uint8Array): U256
```

**Conversions**

```typescript
// To hex string (64 chars, zero-padded)
U256.toHex(value: U256): string

// To bigint
U256.toBigInt(value: U256): bigint

// To bytes (32 bytes, big-endian)
U256.toBytes(value: U256): Uint8Array
```

**Arithmetic (Wrapping)**

```typescript
// Addition (wraps at 2^256)
U256.add(a: U256, b: U256): U256

// Subtraction (wraps below 0)
U256.sub(a: U256, b: U256): U256

// Multiplication (wraps at 2^256)
U256.mul(a: U256, b: U256): U256

// Division (floor)
U256.div(a: U256, b: U256): U256

// Modulo
U256.mod(a: U256, b: U256): U256
```

**Constants**

```typescript
const MAX_U256: U256; // 2^256 - 1
const ZERO: U256;     // 0
const ONE: U256;      // 1
```

**Example**

```typescript
import { U256 } from '@tevm/primitives/v2';

// Create from hex
const a = U256.fromHex('0x1234567890abcdef');

// Arithmetic
const b = U256.fromBigInt(100n);
const sum = U256.add(a, b);
const product = U256.mul(a, b);

// Convert to hex
const hex = U256.toHex(sum);
// '0x0000000000000000000000000000000000000000000000001234567890abcdef'

// Overflow wraps
const max = MAX_U256;
const overflowed = U256.add(max, ONE); // Wraps to ZERO
```

---

### RLP (Recursive Length Prefix)

Ethereum's serialization format.

**Type Definitions**

```typescript
type RlpData =
  | { type: 'bytes'; value: Uint8Array }
  | { type: 'list'; value: RlpData[] };

interface RlpDecoded {
  data: RlpData;
  remainder: Uint8Array;
}

type RlpEncodable = Uint8Array | RlpData | RlpEncodable[];
```

**Encoding**

```typescript
// Encode to RLP
Rlp.encode(data: RlpEncodable): Uint8Array

// Encode byte array
Rlp.encodeBytes(bytes: Uint8Array): Uint8Array

// Encode list
Rlp.encodeList(items: RlpEncodable[]): Uint8Array
```

**Decoding**

```typescript
// Decode RLP
Rlp.decode(bytes: Uint8Array, stream?: boolean): RlpDecoded
```

**Errors**

```typescript
type RlpErrorType =
  | 'InputTooShort'
  | 'InputTooLong'
  | 'LeadingZeros'
  | 'NonCanonicalSize'
  | 'InvalidLength'
  | 'UnexpectedInput'
  | 'InvalidRemainder'
  | 'ExtraZeros'
  | 'RecursionDepthExceeded';

class RlpError extends Error {
  type: RlpErrorType;
}
```

**Constants**

```typescript
const MAX_RLP_DEPTH = 32; // Maximum nesting depth
```

**Status**: Stub implementation, full encoding/decoding not yet implemented.

---

### Transactions

All 5 Ethereum transaction types (Legacy, EIP-2930, EIP-1559, EIP-4844, EIP-7702).

**Transaction Type Enum**

```typescript
enum TransactionType {
  Legacy = 0x00,
  EIP2930 = 0x01,
  EIP1559 = 0x02,
  EIP4844 = 0x03,
  EIP7702 = 0x04,
}
```

**Type Definitions**

```typescript
// Legacy (Type 0) - Original format with gasPrice
interface LegacyTransaction {
  type: TransactionType.Legacy;
  nonce: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  to: Address | null;
  value: bigint;
  data: Uint8Array;
  v: bigint;
  r: Uint8Array;
  s: Uint8Array;
}

// EIP-2930 (Type 1) - Access list
interface Eip2930Transaction {
  type: TransactionType.EIP2930;
  chainId: bigint;
  nonce: bigint;
  gasPrice: bigint;
  gasLimit: bigint;
  to: Address | null;
  value: bigint;
  data: Uint8Array;
  accessList: AccessListItem[];
  yParity: number;
  r: Uint8Array;
  s: Uint8Array;
}

// EIP-1559 (Type 2) - Dynamic fees
interface Eip1559Transaction {
  type: TransactionType.EIP1559;
  chainId: bigint;
  nonce: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  to: Address | null;
  value: bigint;
  data: Uint8Array;
  accessList: AccessListItem[];
  yParity: number;
  r: Uint8Array;
  s: Uint8Array;
}

// EIP-4844 (Type 3) - Blob transactions
interface Eip4844Transaction {
  type: TransactionType.EIP4844;
  chainId: bigint;
  nonce: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  to: Address;  // Cannot be null
  value: bigint;
  data: Uint8Array;
  accessList: AccessListItem[];
  maxFeePerBlobGas: bigint;
  blobVersionedHashes: VersionedHash[];
  yParity: number;
  r: Uint8Array;
  s: Uint8Array;
}

// EIP-7702 (Type 4) - EOA delegation
interface Eip7702Transaction {
  type: TransactionType.EIP7702;
  chainId: bigint;
  nonce: bigint;
  maxPriorityFeePerGas: bigint;
  maxFeePerGas: bigint;
  gasLimit: bigint;
  to: Address | null;
  value: bigint;
  data: Uint8Array;
  accessList: AccessListItem[];
  authorizationList: Authorization[];
  yParity: number;
  r: Uint8Array;
  s: Uint8Array;
}

type Transaction =
  | LegacyTransaction
  | Eip2930Transaction
  | Eip1559Transaction
  | Eip4844Transaction
  | Eip7702Transaction;
```

**Operations (Stubs)**

```typescript
// Detect type from encoded data
function detectType(data: Uint8Array): TransactionType

// Serialize to RLP
function serialize(tx: Transaction): Uint8Array

// Compute transaction hash
function hash(tx: Transaction): Hash
```

**Type Guards**

```typescript
function isLegacyTransaction(tx: Transaction): tx is LegacyTransaction
function isEip2930Transaction(tx: Transaction): tx is Eip2930Transaction
function isEip1559Transaction(tx: Transaction): tx is Eip1559Transaction
function isEip4844Transaction(tx: Transaction): tx is Eip4844Transaction
function isEip7702Transaction(tx: Transaction): tx is Eip7702Transaction
```

**Example**

```typescript
import { TransactionType, Eip1559Transaction } from '@tevm/primitives/v2';

const tx: Eip1559Transaction = {
  type: TransactionType.EIP1559,
  chainId: 1n,
  nonce: 5n,
  maxPriorityFeePerGas: 2_000_000_000n,
  maxFeePerGas: 20_000_000_000n,
  gasLimit: 21000n,
  to: recipientAddress,
  value: 1000000000000000000n,
  data: new Uint8Array(0),
  accessList: [],
  yParity: 0,
  r: new Uint8Array(32),
  s: new Uint8Array(32),
};

// Type guard
if (isEip1559Transaction(tx)) {
  console.log(`Max fee: ${tx.maxFeePerGas}`);
}
```

---

### Access List (EIP-2930)

Pre-declare accessed addresses and storage keys for gas optimization.

**Type Definitions**

```typescript
interface AccessListItem {
  address: Address;
  storageKeys: Hash[];
}

type AccessList = AccessListItem[];
```

**Type Guards**

```typescript
function isAccessListItem(value: unknown): value is AccessListItem
function isAccessList(value: unknown): value is AccessList
```

**Gas Calculations**

```typescript
// Calculate total gas cost
function calculateGasCost(accessList: AccessList): bigint

// Calculate gas savings
function calculateGasSavings(accessList: AccessList): bigint
```

**Queries**

```typescript
// Check if address in list
function isAddressInAccessList(
  accessList: AccessList,
  address: Address
): boolean

// Check if storage key in list
function isStorageKeyInAccessList(
  accessList: AccessList,
  address: Address,
  storageKey: Hash
): boolean
```

**Utilities**

```typescript
// Remove duplicates
function deduplicate(accessList: AccessList): AccessList

// Validate structure
function validate(accessList: AccessList): void
```

**Stubs (Not Implemented)**

```typescript
// Encode to RLP
function encode(accessList: AccessList): Uint8Array

// Decode from RLP
function decode(bytes: Uint8Array): AccessList
```

**Gas Constants**

```typescript
const ACCESS_LIST_ADDRESS_COST = 2400n;
const ACCESS_LIST_STORAGE_KEY_COST = 1900n;
const COLD_ACCOUNT_ACCESS_COST = 2600n;
const COLD_STORAGE_ACCESS_COST = 2100n;
const WARM_STORAGE_ACCESS_COST = 100n;
```

---

### Authorization (EIP-7702)

EOA delegation to smart contracts.

**Type Definition**

```typescript
interface Authorization {
  chainId: bigint;
  address: Address;
  nonce: bigint;
  yParity: number;
  r: bigint;
  s: bigint;
}
```

**Type Guards**

```typescript
function isAuthorization(value: unknown): value is Authorization
```

**Operations (Stubs)**

```typescript
// Create signed authorization
function create(
  chainId: bigint,
  address: Address,
  nonce: bigint,
  privateKey: Uint8Array
): Authorization

// Hash authorization for signing
function hash(auth: {
  chainId: bigint;
  address: Address;
  nonce: bigint;
}): Hash

// Verify and recover authority
function verify(auth: Authorization): Address
```

**Validation**

```typescript
// Validate authorization structure
function validate(auth: Authorization): void

class AuthorizationError extends Error
```

**Gas Calculations**

```typescript
// Calculate gas cost for authorization list
function calculateGasCost(
  authList: Authorization[],
  emptyAccounts: number
): bigint

// Process authorizations
function processAuthorizations(
  authList: Authorization[]
): DelegationDesignation[]

interface DelegationDesignation {
  authority: Address;
  delegatedAddress: Address;
}
```

**Constants**

```typescript
const MAGIC_BYTE = 0x05;
const PER_EMPTY_ACCOUNT_COST = 25000n;
const PER_AUTH_BASE_COST = 12500n;
```

---

### Bytecode

EVM bytecode analysis and validation.

**Type Definition**

```typescript
type Bytecode = Uint8Array & { readonly __brand: symbol };
```

**Analysis**

```typescript
// Find all valid JUMPDEST locations
Bytecode.analyzeJumpDestinations(code: Bytecode): Set<number>

// Check if position is valid JUMPDEST
Bytecode.isValidJumpDest(code: Bytecode, pos: number): boolean

// Validate bytecode structure
Bytecode.validate(code: Bytecode): boolean
```

**Example**

```typescript
import { Bytecode } from '@tevm/primitives/v2';

const code = new Uint8Array([0x60, 0x01, 0x5b, 0x00]) as Bytecode;

// Analyze jump destinations
const jumpdests = Bytecode.analyzeJumpDestinations(code);
// Set { 2 } - position 2 is a JUMPDEST

// Check validity
if (Bytecode.isValidJumpDest(code, 2)) {
  console.log('Valid jump destination');
}

// Validate bytecode
if (!Bytecode.validate(code)) {
  console.error('Invalid bytecode');
}
```

---

### Opcode

EVM opcode enumeration and metadata.

**Opcode Enum**

```typescript
enum Opcode {
  // 0x00s: Stop and Arithmetic
  STOP = 0x00,
  ADD = 0x01,
  MUL = 0x02,
  // ... (all opcodes)

  // 0x50s: Flow control
  JUMP = 0x56,
  JUMPI = 0x57,
  JUMPDEST = 0x5b,

  // 0x60-0x7f: PUSH1-PUSH32
  PUSH1 = 0x60,
  PUSH32 = 0x7f,

  // 0xf0s: System operations
  CREATE = 0xf0,
  CALL = 0xf1,
  RETURN = 0xf3,
  DELEGATECALL = 0xf4,
  CREATE2 = 0xf5,
  STATICCALL = 0xfa,
  REVERT = 0xfd,
  SELFDESTRUCT = 0xff,
}
```

**Metadata**

```typescript
interface OpcodeInfo {
  gasCost: number;
  stackInputs: number;
  stackOutputs: number;
  name: string;
}

// Get opcode metadata
OpcodeHelper.info(op: Opcode): OpcodeInfo | undefined
```

**Example**

```typescript
import { Opcode, OpcodeHelper } from '@tevm/primitives/v2';

const info = OpcodeHelper.info(Opcode.ADD);
// { gasCost: 3, stackInputs: 2, stackOutputs: 1, name: 'ADD' }
```

---

### Gas Constants

Complete gas cost constants for EVM operations.

**Basic Opcode Costs**

```typescript
const GasQuickStep = 2;      // Very cheap ops
const GasFastestStep = 3;    // Arithmetic/logic
const GasFastStep = 5;       // Mul/div
const GasMidStep = 8;        // Advanced arithmetic
const GasSlowStep = 10;      // JUMPI
const GasExtStep = 20;       // External account access
```

**Storage Costs (EIP-2929 & EIP-2200)**

```typescript
const SloadGas = 100;              // Warm SLOAD
const ColdSloadCost = 2100;        // Cold SLOAD
const ColdAccountAccessCost = 2600; // Cold account access
const SstoreSetGas = 20000;        // Zero to non-zero
const SstoreResetGas = 5000;       // Non-zero to non-zero
const SstoreRefundGas = 4800;      // Clear storage refund
```

**Transaction Costs**

```typescript
const TxGas = 21000;              // Base transaction
const TxGasContractCreation = 53000; // Contract creation
const TxDataZeroGas = 4;          // Zero byte in calldata
const TxDataNonZeroGas = 16;      // Non-zero byte
```

**Call Costs (EIP-150 & EIP-2929)**

```typescript
const CallGas = 40;
const CallValueTransferGas = 9000;
const CallNewAccountGas = 25000;
const CallStipend = 2300;
const CALL_GAS_RETENTION_DIVISOR = 64; // 63/64 rule
```

**Memory Expansion**

```typescript
const MemoryGas = 3;       // Linear coefficient
const QuadCoeffDiv = 512;  // Quadratic divisor
```

**Logging**

```typescript
const LogGas = 375;
const LogDataGas = 8;
const LogTopicGas = 375;
```

**Contract Creation**

```typescript
const CreateGas = 32000;
const CreateDataGas = 200;
const InitcodeWordGas = 2;
const MaxInitcodeSize = 49152;
```

**Precompile Costs**

```typescript
const ECRECOVER_COST = 3000;
const SHA256_BASE_COST = 60;
const SHA256_WORD_COST = 12;
const RIPEMD160_BASE_COST = 600;
const IDENTITY_BASE_COST = 15;
const MODEXP_MIN_GAS = 200;

// BN254 (EIP-1108)
const ECADD_GAS_COST = 150;
const ECMUL_GAS_COST = 6000;
const ECPAIRING_BASE_GAS_COST = 45000;
const ECPAIRING_PER_PAIR_GAS_COST = 34000;
```

**EIP-1153: Transient Storage**

```typescript
const TLoadGas = 100;
const TStoreGas = 100;
```

**EIP-4844: Blob Transactions**

```typescript
const BlobHashGas = 3;
const BlobBaseFeeGas = 2;
```

---

### Blob (EIP-4844)

Blob transaction support for layer 2 scaling.

**Type Definitions**

```typescript
type Blob = Uint8Array & { readonly __brand: symbol };
type BlobCommitment = Uint8Array & { readonly __brand: symbol };
type BlobProof = Uint8Array & { readonly __brand: symbol };
type VersionedHash = Uint8Array & { readonly __brand: symbol };
```

**Constants**

```typescript
const BLOB_SIZE = 131072; // 128 KB
const FIELD_ELEMENTS_PER_BLOB = 4096;
const BYTES_PER_FIELD_ELEMENT = 32;
const MAX_BLOBS_PER_TRANSACTION = 6;
const BLOB_COMMITMENT_VERSION_KZG = 0x01;
const BLOB_GAS_PER_BLOB = 131072;
const TARGET_BLOB_GAS_PER_BLOCK = 393216;
```

**Data Encoding**

```typescript
// Encode data into blob
Blob.fromData(data: Uint8Array): Blob

// Extract data from blob
Blob.toData(blob: Blob): Uint8Array
```

**Stubs (Not Implemented)**

```typescript
// Compute KZG commitment
Blob.commitment(blob: Blob): BlobCommitment

// Generate KZG proof
Blob.proof(blob: Blob): BlobProof

// Create versioned hash
Blob.commitmentToVersionedHash(
  commitment: BlobCommitment
): Promise<VersionedHash>
```

**Validation**

```typescript
// Validate versioned hash
Blob.isValidVersionedHash(hash: VersionedHash): boolean
```

**Example**

```typescript
import { Blob } from '@tevm/primitives/v2';

// Encode data
const data = new TextEncoder().encode('Hello, blobs!');
const blob = Blob.fromData(data);

// Decode
const decoded = Blob.toData(blob);
```

---

### Fee Market (EIP-1559 & EIP-4844)

Fee calculation for dynamic fee market and blob gas.

**EIP-1559 Constants**

```typescript
const MIN_BASE_FEE = 7n;
const BASE_FEE_CHANGE_DENOMINATOR = 8n;
```

**EIP-4844 Constants**

```typescript
const MIN_BLOB_BASE_FEE = 1n;
const BLOB_BASE_FEE_UPDATE_FRACTION = 3338477n;
const TARGET_BLOB_GAS_PER_BLOCK = 393216n;
const BLOB_GAS_PER_BLOB = 131072n;
```

**Base Fee Calculation (EIP-1559)**

```typescript
// Calculate next block's base fee
FeeMarket.calculateBaseFee(
  parentGasUsed: bigint,
  parentGasLimit: bigint,
  parentBaseFee: bigint
): bigint
```

**Blob Fee Calculation (EIP-4844)**

```typescript
// Calculate blob base fee
FeeMarket.calculateBlobBaseFee(excessBlobGas: bigint): bigint

// Calculate excess blob gas for next block
FeeMarket.calculateExcessBlobGas(
  parentExcessBlobGas: bigint,
  parentBlobGasUsed: bigint
): bigint
```

**Example**

```typescript
import { FeeMarket } from '@tevm/primitives/v2';

// Calculate next block's base fee
const nextBaseFee = FeeMarket.calculateBaseFee(
  15_000_000n, // Parent gas used
  30_000_000n, // Parent gas limit
  10_000_000_000n // Parent base fee (10 gwei)
);

// Calculate blob base fee
const excessBlobGas = 262144n; // 2 blobs worth
const blobBaseFee = FeeMarket.calculateBlobBaseFee(excessBlobGas);
```

---

### Event Log

Ethereum event log structure.

**Type Definition**

```typescript
interface EventLog {
  address: Address;
  topics: Hash[];
  data: Uint8Array;
  blockNumber?: bigint;
  transactionHash?: Hash;
  transactionIndex?: number;
  blockHash?: Hash;
  logIndex?: number;
  removed?: boolean;
}
```

**Operations**

```typescript
// Create event log
function create(params: {
  address: Address;
  topics: Hash[];
  data: Uint8Array;
  blockNumber?: bigint;
  // ... optional fields
}): EventLog

// Check if log matches topic filter
function matches(
  log: EventLog,
  filterTopics: (Hash | null)[]
): boolean
```

**Example**

```typescript
import { create, matches } from '@tevm/primitives/v2';

const log = create({
  address: contractAddress,
  topics: [eventTopic0, indexedParam1],
  data: eventData,
  blockNumber: 12345n,
});

// Filter by topics (null matches any)
const filter = [eventTopic0, null]; // Match any indexed param
if (matches(log, filter)) {
  console.log('Log matches filter');
}
```

---

### ABI (Application Binary Interface)

Type definitions and encoding/decoding functions (stubs).

**Type Definitions**

```typescript
type AbiType =
  | "uint8" | "uint256" | "address" | "bool"
  | "bytes" | "string" | "uint256[]" | ...;

type StateMutability = "pure" | "view" | "nonpayable" | "payable";

interface AbiParameter {
  name: string;
  type: string;
  indexed?: boolean;
  components?: AbiParameter[];
}

interface AbiFunction {
  type: "function";
  name: string;
  inputs: AbiParameter[];
  outputs: AbiParameter[];
  stateMutability: StateMutability;
}

interface AbiEvent {
  type: "event";
  name: string;
  inputs: AbiParameter[];
  anonymous?: boolean;
}

interface AbiError {
  type: "error";
  name: string;
  inputs: AbiParameter[];
}

type Abi = AbiItem[];
```

**Operations (Stubs)**

```typescript
// Encode function call
function encodeFunctionData(signature: string, args: unknown[]): Uint8Array

// Decode function return
function decodeFunctionResult(signature: string, data: Uint8Array): unknown[]

// Encode event topics
function encodeEventTopics(signature: string, args: unknown[]): Hash[]

// Decode event log
function decodeEventLog(
  signature: string,
  data: Uint8Array,
  topics: Hash[]
): Record<string, unknown>

// Get selectors
function getFunctionSelector(signature: string): Uint8Array
function getEventSelector(signature: string): Hash

// Encode/decode parameters
function encodeParameters(types: string[], values: unknown[]): Uint8Array
function decodeParameters(types: string[], data: Uint8Array): unknown[]
```

---

### Hardfork

Ethereum hardfork management and version comparison.

**Hardfork Enum**

```typescript
enum Hardfork {
  FRONTIER = 0,           // July 2015
  HOMESTEAD = 1,          // March 2016
  DAO = 2,                // July 2016
  TANGERINE_WHISTLE = 3,  // October 2016
  SPURIOUS_DRAGON = 4,    // November 2016
  BYZANTIUM = 5,          // October 2017
  CONSTANTINOPLE = 6,     // February 2019
  PETERSBURG = 7,         // February 2019
  ISTANBUL = 8,           // December 2019
  MUIR_GLACIER = 9,       // January 2020
  BERLIN = 10,            // April 2021
  LONDON = 11,            // August 2021
  ARROW_GLACIER = 12,     // December 2021
  GRAY_GLACIER = 13,      // June 2022
  MERGE = 14,             // September 2022
  SHANGHAI = 15,          // April 2023
  CANCUN = 16,            // March 2024
  PRAGUE = 17,            // May 2025
  OSAKA = 18,             // TBD
}
```

**Comparison**

```typescript
// Check if at least version
function isAtLeast(current: Hardfork, target: Hardfork): boolean

// Check if before version
function isBefore(current: Hardfork, target: Hardfork): boolean

// Compare two hardforks
function compare(a: Hardfork, b: Hardfork): number
```

**Parsing**

```typescript
// Parse from string (case-insensitive)
function fromString(name: string): Hardfork | undefined
```

**Constants**

```typescript
const DEFAULT_HARDFORK = Hardfork.PRAGUE;
```

**Example**

```typescript
import { Hardfork, isAtLeast } from '@tevm/primitives/v2';

const current = Hardfork.CANCUN;

if (isAtLeast(current, Hardfork.SHANGHAI)) {
  // PUSH0 opcode is available
}

if (isAtLeast(current, Hardfork.CANCUN)) {
  // Blob transactions are supported
  // TLOAD/TSTORE opcodes available
}

// Parse from string
const fork = fromString('berlin'); // Hardfork.BERLIN
```

---

### SIWE (Sign-In with Ethereum - EIP-4361)

Structured message format for Ethereum authentication.

**Type Definition**

```typescript
interface SiweMessage {
  domain: string;
  address: Address;
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

**Operations (Stubs)**

```typescript
// Parse SIWE message from string
function parse(text: string): SiweMessage

// Format SIWE message to string
function format(message: SiweMessage): string

// Verify signature
function verify(message: SiweMessage, signature: Uint8Array): boolean

// Generate secure nonce
function generateNonce(length?: number): string
```

**Example**

```typescript
import { SiweMessage, format } from '@tevm/primitives/v2';

const message: SiweMessage = {
  domain: 'example.com',
  address: myAddress,
  uri: 'https://example.com',
  version: '1',
  chainId: 1,
  nonce: '32891756',
  issuedAt: '2021-09-30T16:25:24Z',
};

const formatted = format(message);
// example.com wants you to sign in with your Ethereum account:
// 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
//
// URI: https://example.com
// Version: 1
// Chain ID: 1
// Nonce: 32891756
// Issued At: 2021-09-30T16:25:24Z
```

## Implementation Status

### Fully Implemented
- ✅ Address (except CREATE/CREATE2 address calculation)
- ✅ Hash (except keccak256)
- ✅ Hex
- ✅ U256
- ✅ Bytecode analysis
- ✅ Opcode metadata
- ✅ Gas constants
- ✅ Fee market calculations
- ✅ Access list utilities
- ✅ Event log
- ✅ Hardfork management

### Partial Implementation (Stubs)
- 🚧 RLP (type definitions only, encoding/decoding not implemented)
- 🚧 Transaction (type definitions only, serialize/hash not implemented)
- 🚧 Authorization (validation only, signing/verification not implemented)
- 🚧 Blob (data encoding only, KZG operations not implemented)
- 🚧 ABI (type definitions only, encoding/decoding not implemented)
- 🚧 SIWE (type definitions only, parsing/verification not implemented)

## Migration from V1

### Pattern Changes

```typescript
// V1 - Class instances
import { Address } from '@tevm/primitives';
const addr = new Address('0x...');
const hex = addr.toHex();

// V2 - Branded types with namespaces
import { Address } from '@tevm/primitives/v2';
const addr = Address.fromHex('0x...');
const hex = Address.toHex(addr);
```

### Type Changes

```typescript
// V1 - Classes
class Address { ... }

// V2 - Branded primitives
type Address = Uint8Array & { readonly __brand: symbol };
```

### Method Organization

```typescript
// V1 - Instance methods
address.toChecksumHex()
address.equals(other)

// V2 - Static namespaced methods
Address.toChecksumHex(address)
Address.equals(address, other)
```

## License

MIT License - see [LICENSE](./LICENSE) for details
