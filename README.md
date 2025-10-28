<div align="center">
  <h1>
    Ethereum primitives and cryptography
    <br/>
    <br/>
    <img width="512" height="512" alt="voltaire-logo" src="https://github.com/user-attachments/assets/409b49cb-113b-4b76-989d-762f6294e26a" />
  </h1>
  <sup>
    <a href="https://www.npmjs.com/package/@tevm/voltaire">
       <img src="https://img.shields.io/npm/v/@tevm/voltaire.svg" alt="npm version" />
    </a>
    <a href="https://github.com/evmts/voltaire">
       <img src="https://img.shields.io/badge/zig-0.15.1+-orange.svg" alt="zig version" />
    </a>
    <a href="https://github.com/evmts/voltaire/actions/workflows/ci.yml">
      <img src="https://github.com/evmts/voltaire/actions/workflows/ci.yml/badge.svg" alt="CI status" />
    </a>
    <a href="https://github.com/evmts/voltaire/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
    </a>
  </sup>
</div>

## Features

- **Simple apis** - The minimal apis needed for Ethereum development
- **Data-first architecture** - Branded primitive types with namespaced methods for optimal tree-shaking
- **All platforms** - Works in any JavaScript environment (Node.js, Bun, Deno, browsers)
- **High-performance** - High-performance Zig and rust implementations available to TypeScript projects
- **Type-safe** - Full TypeScript support with comprehensive type definitions
- **Zig support** - All primitives offered both in TypeScript and [Zig](./ZIG_API.md)

## Installation

```bash
npm install @tevm/voltaire
```

```bash
bun add @tevm/voltaire
```

```bash
pnpm install @tevm/voltaire
```

Or use the [zig api](./ZIG_API.md)

```bash
# Install specific version (recommended)
zig fetch --save https://github.com/evmts/voltaire/archive/refs/tags/v0.1.0.tar.gz

# Install latest from main branch
zig fetch --save git+https://github.com/evmts/voltaire
```

## Quick Start

This library uses a **data-first architecture** with branded primitive types and namespaced methods:

```typescript
import { Address, Hash, Uint, Keccak256 } from '@tevm/voltaire';

// Address operations
const addr = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');
const checksum = Address.toChecksumHex.call(addr);
const isZero = Address.isZero.call(addr);

// Hash operations
const data = new Uint8Array([1, 2, 3]);
const hash = Keccak256.hash(data);
const hashHex = Hash.toHex.call(hash);

// Uint arithmetic
const a = Uint.from(0x100);
const b = Uint.from(0x200);
const sum = Uint.plus.call(a, b);
```

### Benefits

- **Tree-shaking**: Only methods you use are included in your bundle
- **Zero overhead**: No class instances, just primitives with type safety
- **Interop**: Easy to serialize, works seamlessly with other libraries
- **Performance**: Direct function calls, no prototype chain lookup

## Complete API Reference

### Core Primitives

#### Address — 20-byte Ethereum address with EIP-55 checksumming

**Type:** `Address` (branded `Uint8Array` with 20 bytes)

**Constants:**
- `Address.SIZE` — Address size (20 bytes)
- `Address.HEX_SIZE` — Hex string size (42 chars: "0x" + 40 hex)

**Creation:**
- `Address.from(value)` — Universal constructor (hex/bytes/number/bigint)
- `Address.fromHex(hex)` — From hex string (with or without 0x)
- `Address.fromBytes(bytes)` — From 20-byte Uint8Array
- `Address.fromNumber(n)` — From number (left-padded to 20 bytes)
- `Address.fromPublicKey(x, y)` — From 64-byte secp256k1 public key (Keccak-256 last 20 bytes)
- `Address.zero()` — Zero address (0x0000...0000)

**Conversion:**
- `Address.toHex.call(address)` — To lowercase hex string
- `Address.toChecksumHex.call(address)` — To EIP-55 checksummed hex
- `Address.toU256.call(address)` — To 256-bit unsigned integer (bigint)

**Validation:**
- `Address.isValid(value)` — Check if valid address format
- `Address.isValidChecksum(address)` — Validate EIP-55 checksum
- `Address.isZero.call(address)` — Check if zero address
- `Address.is(value)` — Type guard for Address type

**Comparison:**
- `Address.equals.call(a, b)` — Compare two addresses
- `Address.compare.call(a, b)` — Compare for sorting (-1, 0, 1)
- `Address.lessThan.call(a, b)` — Check if a < b
- `Address.greaterThan.call(a, b)` — Check if a > b

**Contract Addresses:**
- `Address.calculateCreateAddress.call(from, nonce)` — Predict CREATE address
- `Address.calculateCreate2Address.call(from, salt, initCodeHash)` — Predict CREATE2 address

**Formatting:**
- `Address.toShortHex.call(address, prefix?, suffix?)` — Short format (0x1234...5678)
- `Address.format.call(address)` — EIP-55 checksummed (alias for toChecksumHex)

**Examples:**
```typescript
import { Address } from '@tevm/voltaire';

const addr = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');
const checksum = Address.toChecksumHex.call(addr);
const isValid = Address.isValid(checksum); // true
const create2 = Address.calculateCreate2Address.call(deployer, salt, initCodeHash);
```

---

#### Hash — 32-byte Keccak-256 hash type

**Type:** `Hash` (branded `Uint8Array` with 32 bytes)

**Constants:**
- `Hash.SIZE` — Hash size (32 bytes)
- `Hash.ZERO` — Zero hash constant

**Creation:**
- `Hash.from(value)` — From hex string (alias for fromHex)
- `Hash.fromHex(hex)` — From hex string (with or without 0x)
- `Hash.fromBytes(bytes)` — From 32-byte Uint8Array

**Conversion:**
- `Hash.toHex.call(hash)` — To hex string with 0x prefix
- `Hash.toBytes.call(hash)` — To Uint8Array copy
- `Hash.toString.call(hash)` — To string (alias for toHex)

**Hashing:**
- `Hash.keccak256(data)` — Hash bytes with Keccak-256
- `Hash.keccak256String(str)` — Hash UTF-8 string
- `Hash.keccak256Hex(hex)` — Hash hex string

**Comparison:**
- `Hash.equals.call(hash1, hash2)` — Constant-time equality check
- `Hash.isZero.call(hash)` — Check if zero hash

**Validation:**
- `Hash.isHash(value)` — Type guard for Hash
- `Hash.isValidHex(hex)` — Validate hex string format
- `Hash.assert(value, msg?)` — Assert value is Hash, throws if not

**Utilities:**
- `Hash.random()` — Generate random 32-byte hash
- `Hash.clone.call(hash)` — Create copy of hash
- `Hash.slice.call(hash, start?, end?)` — Get slice of hash bytes
- `Hash.format.call(hash, prefix?, suffix?)` — Truncated display (0x1234...5678 by default)

**Examples:**
```typescript
import { Hash, Keccak256 } from '@tevm/voltaire';

const hash = Keccak256.hash(new Uint8Array([1, 2, 3]));
const hex = Hash.toHex.call(hash);
const isZero = Hash.isZero.call(hash); // false
const formatted = Hash.format.call(hash); // "0x1234...5678"
```

---

#### Hex — Hexadecimal encoding/decoding

**Type:** `Hex` (branded string `0x${string}`)

**Types:**
- `Hex.Unsized` — Hex string with 0x prefix (variable length)
- `Hex.Sized<N>` — Hex string of exactly N bytes
- `Hex.Bytes<N>` — Alias for Sized<N>

**Validation:**
- `Hex.isHex(value)` — Check if valid hex format
- `Hex.isSized.call(hex, size)` — Check if hex has specific byte size
- `Hex.validate.call(str)` — Validate hex string, throws if invalid
- `Hex.assertSize.call(hex, size)` — Assert hex has size, returns sized type

**Conversion:**
- `Hex.fromBytes(bytes)` — Convert bytes to hex
- `Hex.toBytes.call(hex)` — Convert hex to bytes
- `Hex.fromNumber(n, size?)` — Convert number to hex (with optional padding)
- `Hex.toNumber.call(hex)` — Convert hex to number
- `Hex.fromBigInt(bigint, size?)` — Convert bigint to hex
- `Hex.toBigInt.call(hex)` — Convert hex to bigint
- `Hex.fromString(str)` — Encode string to hex
- `Hex.toString.call(hex)` — Decode hex to string
- `Hex.fromBoolean(bool)` — Boolean to hex (0x01 or 0x00)
- `Hex.toBoolean.call(hex)` — Hex to boolean

**Size:**
- `Hex.size.call(hex)` — Get byte size of hex

**Manipulation:**
- `Hex.concat(...hexes)` — Concatenate multiple hex strings
- `Hex.slice.call(hex, start, end?)` — Slice hex string
- `Hex.pad.call(hex, targetSize)` — Left-pad with zeros
- `Hex.padRight.call(hex, targetSize)` — Right-pad with zeros
- `Hex.trim.call(hex)` — Trim leading zeros

**Comparison:**
- `Hex.equals.call(hex1, hex2)` — Check equality (case-insensitive)

**Bitwise:**
- `Hex.xor.call(hex1, hex2)` — XOR two hex strings of same length

**Utilities:**
- `Hex.random(size)` — Generate random hex of size bytes
- `Hex.zero(size)` — Create zero-filled hex of size bytes

**Examples:**
```typescript
import { Hex } from '@tevm/voltaire';

const hex = Hex.fromBytes(new Uint8Array([0x12, 0x34])); // '0x1234'
const bytes = Hex.toBytes.call(hex);
const padded = Hex.pad.call(hex, 4); // '0x00001234'
const trimmed = Hex.trim.call('0x00001234'); // '0x1234'
```

---

#### Uint — 256-bit unsigned integer

**Type:** `Uint` (branded `bigint`)

**Constants:**
- `Uint.MAX` — Maximum value (2^256 - 1)
- `Uint.MIN` — Minimum value (0)
- `Uint.ZERO` — Zero value
- `Uint.ONE` — One value

**Creation:**
- `Uint.from(value)` — From bigint, number, or string (decimal/hex)
- `Uint.fromHex.call(hex)` — From hex string
- `Uint.fromBigInt.call(bigint)` — From bigint
- `Uint.fromNumber.call(num)` — From number
- `Uint.fromBytes.call(bytes)` — From bytes (big-endian, max 32 bytes)
- `Uint.tryFrom(value)` — Try to create, returns undefined if invalid

**Conversion:**
- `Uint.toHex.call(uint, padded?)` — To hex string (padded to 64 chars by default)
- `Uint.toBigInt.call(uint)` — To bigint
- `Uint.toNumber.call(uint)` — To number (throws if > MAX_SAFE_INTEGER)
- `Uint.toBytes.call(uint)` — To 32-byte Uint8Array (big-endian)
- `Uint.toString.call(uint, radix?)` — To string (default radix 10)

**Arithmetic:**
- `Uint.plus.call(a, b)` — Add with wrapping
- `Uint.minus.call(a, b)` — Subtract with wrapping
- `Uint.times.call(a, b)` — Multiply with wrapping
- `Uint.dividedBy.call(a, b)` — Divide (throws on division by zero)
- `Uint.modulo.call(a, b)` — Modulo (throws on modulo by zero)
- `Uint.toPower.call(base, exponent)` — Exponentiation with wrapping

**Bitwise:**
- `Uint.bitwiseAnd.call(a, b)` — Bitwise AND
- `Uint.bitwiseOr.call(a, b)` — Bitwise OR
- `Uint.bitwiseXor.call(a, b)` — Bitwise XOR
- `Uint.bitwiseNot.call(a)` — Bitwise NOT
- `Uint.shiftLeft.call(a, bits)` — Left shift with wrapping
- `Uint.shiftRight.call(a, bits)` — Right shift

**Comparison:**
- `Uint.equals.call(a, b)` — Check equality
- `Uint.notEquals.call(a, b)` — Check inequality
- `Uint.lessThan.call(a, b)` — Check less than
- `Uint.lessThanOrEqual.call(a, b)` — Check less than or equal
- `Uint.greaterThan.call(a, b)` — Check greater than
- `Uint.greaterThanOrEqual.call(a, b)` — Check greater than or equal
- `Uint.isZero.call(a)` — Check if zero
- `Uint.minimum.call(a, b)` — Get minimum of two values
- `Uint.maximum.call(a, b)` — Get maximum of two values

**Utilities:**
- `Uint.isValid(value)` — Check if value is valid Uint256 (0 ≤ value < 2^256)
- `Uint.tryFrom(value)` — Try to create Uint, returns undefined if invalid
- `Uint.bitLength.call(uint)` — Get number of bits required (0-256)
- `Uint.leadingZeros.call(uint)` — Count leading zero bits
- `Uint.popCount.call(uint)` — Count number of 1 bits (population count)

**Examples:**
```typescript
import { Uint } from '@tevm/voltaire';

const a = Uint.from(100n);
const b = Uint.from('0xff');
const sum = Uint.plus.call(a, b); // 355n
const hex = Uint.toHex.call(sum); // "0x0000...0163"
```

---

#### RLP — Recursive Length Prefix encoding

**Constants:**
- `Rlp.MAX_DEPTH` — Maximum recursion depth (32)

**Types:**
- `Rlp.Data` — Discriminated union: `{ type: "bytes", value: Uint8Array }` or `{ type: "list", value: Data[] }`
- `Rlp.Decoded` — `{ data: Data, remainder: Uint8Array }`
- `Rlp.Encodable` — `Uint8Array | Data | Encodable[]`

**Type Guards:**
- `Rlp.isData(value)` — Check if value is RLP Data
- `Rlp.isBytesData(value)` — Check if bytes Data
- `Rlp.isListData(value)` — Check if list Data

**Encoding:**
- `Rlp.encode.call(data)` — Encode data to RLP bytes

**Decoding:**
- `Rlp.decode.call(bytes)` — Decode RLP bytes to Data
- `Rlp.decodeStream.call(bytes)` — Decode with remainder for stream processing

**Examples:**
```typescript
import { Rlp } from '@tevm/voltaire';

// Encode list
const list = [new Uint8Array([1, 2, 3])];
const encoded = Rlp.encode.call(list);

// Decode
const decoded = Rlp.decode.call(encoded);
```

---

#### Transaction — All Ethereum transaction types

**Transaction Types:**
- `Transaction.Legacy` — Type 0: Original format with fixed gas price
- `Transaction.EIP2930` — Type 1: Access lists with explicit chain ID
- `Transaction.EIP1559` — Type 2: Dynamic fee market
- `Transaction.EIP4844` — Type 3: Blob transactions for L2 scaling
- `Transaction.EIP7702` — Type 4: EOA delegation to smart contracts
- `Transaction.Any` — Union of all types

**Universal Operations:**
- `Transaction.serialize(tx)` — Serialize any transaction type to bytes
- `Transaction.deserialize(bytes)` — Deserialize bytes to transaction
- `Transaction.hash(tx)` — Compute transaction hash
- `Transaction.from(tx)` — Extract sender address from signed transaction

**Type-Specific Operations:**

Each transaction type has its own namespace with:
- `.serialize.call(tx)` — Serialize to bytes
- `.deserialize.call(bytes)` — Deserialize from bytes
- `.hash.call(tx)` — Compute hash
- `.from.call(tx)` — Extract sender
- `.signatureHash.call(tx)` — Get hash to sign

**Examples:**
```typescript
import { Transaction } from '@tevm/voltaire';

// EIP-1559 transaction
const tx: Transaction.EIP1559 = {
  type: 2,
  chainId: 1n,
  nonce: 0n,
  maxFeePerGas: 30000000000n,
  maxPriorityFeePerGas: 1000000000n,
  gasLimit: 21000n,
  to: recipientAddress,
  value: 1000000000000000000n,
  data: new Uint8Array(),
  accessList: [],
  r: signature.r,
  s: signature.s,
  v: signature.v,
};

const serialized = Transaction.serialize(tx);
const hash = Transaction.hash(tx);
const sender = Transaction.from(tx);
```

---

#### ABI — Application Binary Interface encoding/decoding

**Types:**
- `Abi.Parameter` — ABI parameter type
- `Abi.Function` — Function descriptor
- `Abi.Event` — Event descriptor
- `Abi.Error` — Error descriptor
- `Abi.Constructor` — Constructor descriptor

**Function Operations:**
- `Abi.Function.encode(func, args)` — Encode function call data
- `Abi.Function.decode(func, data)` — Decode function return data
- `Abi.Function.selector(func)` — Get 4-byte function selector

**Event Operations:**
- `Abi.Event.topic(event)` — Get event topic (32-byte hash)
- `Abi.Event.decode(event, log)` — Decode event log

**Error Operations:**
- `Abi.Error.selector(error)` — Get 4-byte error selector
- `Abi.Error.decode(error, data)` — Decode error data

Full abitype integration for type inference.

---

#### Additional Primitives

**AccessList** — EIP-2930 access lists
- Access list encoding/decoding
- Gas cost calculations

**Authorization** — EIP-7702 set code authorization
- Authorization list encoding/decoding
- Signature verification

**Blob** — EIP-4844 blob transaction utilities
- Blob gas calculations
- Commitment handling

**Bytecode** — EVM bytecode analysis
- JUMPDEST detection
- Opcode parsing

**EventLog** — Event log parsing and filtering

**Type:** `EventLog.Data` — `{ address, topics, data, blockNumber?, transactionHash?, transactionIndex?, blockHash?, logIndex?, removed? }`

**Creation:**
- `EventLog.create(params)` — Create event log

**Query:**
- `EventLog.getTopic0.call(log)` — Get event signature topic
- `EventLog.getIndexedTopics.call(log)` — Get indexed topics (excluding topic0)
- `EventLog.matchesTopics.call(log, topics)` — Check if log matches topic filter
- `EventLog.matchesAddress.call(log, address)` — Check if log matches address
- `EventLog.matchesFilter.call(log, filter)` — Check if log matches complete filter

**Filtering & Sorting:**
- `EventLog.filterLogs(logs, filter)` — Filter array of logs
- `EventLog.sortLogs(logs)` — Sort by block/tx/log index

**Utilities:**
- `EventLog.isRemoved.call(log)` — Check if log was removed (reorg)
- `EventLog.clone.call(log)` — Clone log object

**FeeMarket** — Fee calculations (EIP-1559 & EIP-4844)

**Constants:**
- `FeeMarket.Eip1559.MIN_BASE_FEE` — 7 wei
- `FeeMarket.Eip1559.BASE_FEE_CHANGE_DENOMINATOR` — 8
- `FeeMarket.Eip1559.ELASTICITY_MULTIPLIER` — 2
- `FeeMarket.Eip4844.MIN_BLOB_BASE_FEE` — 1 wei
- `FeeMarket.Eip4844.BLOB_BASE_FEE_UPDATE_FRACTION` — 3338477
- `FeeMarket.Eip4844.TARGET_BLOB_GAS_PER_BLOCK` — 393216
- `FeeMarket.Eip4844.BLOB_GAS_PER_BLOB` — 131072
- `FeeMarket.Eip4844.MAX_BLOBS_PER_BLOCK` — 6
- `FeeMarket.Eip4844.MAX_BLOB_GAS_PER_BLOCK` — 786432

**Types:**
- `FeeMarket.State` — Combined EIP-1559 and EIP-4844 state
- `FeeMarket.Eip1559State` — `{ baseFee, gasUsed, gasTarget }`
- `FeeMarket.Eip4844State` — `{ excessBlobGas, blobGasUsed }`
- `FeeMarket.TxFeeParams` — Transaction fee parameters
- `FeeMarket.BlobTxFeeParams` — Blob transaction fee parameters

**Fee Calculations:**
- `FeeMarket.calculateBaseFee(parentState)` — Compute next block base fee
- `FeeMarket.calculateBlobBaseFee(excessBlobGas)` — Compute blob base fee
- `FeeMarket.calculateExcessBlobGas(parentExcess, parentBlobGasUsed)` — Compute excess blob gas
- `FeeMarket.calculateTxFee(tx, baseFee)` — Compute transaction fee
- `FeeMarket.calculateBlobTxFee(blobTx, baseFee, blobBaseFee)` — Compute blob tx fee
- `FeeMarket.projectBaseFees(currentState, numBlocks)` — Project future base fees

**State Management:**
- `FeeMarket.nextState(currentState, gasUsed, blobGasUsed)` — Compute next block state
- `FeeMarket.State.next.call(state, gasUsed, blobGasUsed)` — Convenience method
- `FeeMarket.State.getBlobBaseFee.call(state)` — Get current blob base fee
- `FeeMarket.State.getGasTarget.call(state)` — Get gas target
- `FeeMarket.State.isAboveGasTarget.call(state, gasUsed)` — Check if above target
- `FeeMarket.State.isAboveBlobGasTarget.call(state, blobGasUsed)` — Check if above blob target

**Validation:**
- `FeeMarket.canIncludeTx(tx, state)` — Check if tx fees sufficient
- `FeeMarket.validateTxFeeParams(params)` — Validate fee parameters
- `FeeMarket.validateState(state)` — Validate state

**Utilities:**
- `FeeMarket.weiToGwei(wei)` — Convert wei to gwei
- `FeeMarket.gweiToWei(gwei)` — Convert gwei to wei

**GasConstants** — EVM gas cost constants

**Execution Costs:**
- `Gas.QuickStep` — 2 (PUSH, DUP, SWAP, etc.)
- `Gas.FastestStep` — 3 (ADD, SUB, LT, GT, EQ, etc.)
- `Gas.FastStep` — 5 (MUL, DIV, MOD, etc.)
- `Gas.MidStep` — 8 (ADDMOD, MULMOD)
- `Gas.SlowStep` — 10 (SIGNEXTEND, etc.)
- `Gas.ExtStep` — 20 (SHA3 base)
- `Gas.Jumpdest` — 1

**Memory & Copy:**
- `Gas.Memory` — 3 per word
- `Gas.Copy` — 3 per word (CALLDATACOPY, CODECOPY, etc.)
- `Gas.QuadCoeffDiv` — 512 (quadratic memory expansion)

**Keccak-256:**
- `Gas.Keccak256Base` — 30
- `Gas.Keccak256Word` — 6 per word

**Storage (EIP-2929):**
- `Gas.Sload` — 100 (warm)
- `Gas.ColdSload` — 2100 (cold)
- `Gas.SstoreSentry` — 2300 (minimum to call with value)
- `Gas.SstoreSet` — 20000 (zero → non-zero)
- `Gas.SstoreReset` — 5000 (non-zero → non-zero)
- `Gas.SstoreClear` — 5000 (non-zero → zero)
- `Gas.SstoreRefund` — 4800 (refund for clearing)
- `Gas.ColdAccountAccess` — 2600
- `Gas.WarmStorageRead` — 100

**Transient Storage (EIP-1153):**
- `Gas.TLoad` — 100
- `Gas.TStore` — 100

**Logs:**
- `Gas.LogBase` — 375
- `Gas.LogData` — 8 per byte
- `Gas.LogTopic` — 375 per topic

**Calls:**
- `Gas.Call` — 40 (warm)
- `Gas.CallValue` — 9000 (non-zero value transfer)
- `Gas.CallStipend` — 2300 (stipend for callee)
- `Gas.CallNewAccount` — 25000 (create new account)
- `Gas.CallCode` — 700
- `Gas.DelegateCall` — 700
- `Gas.StaticCall` — 700
- `Gas.CallGasRetentionDivisor` — 64 (EIP-150: 63/64ths rule)

**Contract Creation:**
- `Gas.Create` — 32000
- `Gas.CreateData` — 200 per byte (initcode execution)
- `Gas.InitcodeWord` — 2 per word (EIP-3860)
- `Gas.MaxInitcodeSize` — 49152 bytes (EIP-3860)

**Selfdestruct:**
- `Gas.Selfdestruct` — 5000
- `Gas.SelfdestructRefund` — 24000 (removed in EIP-3529)

**Transactions:**
- `Gas.Tx` — 21000 (base transaction cost)
- `Gas.TxContractCreation` — 53000 (create contract)
- `Gas.TxDataZero` — 4 per zero byte
- `Gas.TxDataNonZero` — 16 per non-zero byte (68 pre-Istanbul)

**EIP-4844 Blob:**
- `Gas.BlobHash` — 3 (BLOBHASH opcode)
- `Gas.BlobBaseFee` — 2 (BLOBBASEFEE opcode)

**Refunds:**
- `Gas.MaxRefundQuotient` — 5 (max refund = gasUsed / 5, EIP-3529)

**Precompile Costs:**
- `Gas.Precompile.EcRecover` — 3000
- `Gas.Precompile.Sha256Base` — 60, `Sha256Word` — 12
- `Gas.Precompile.Ripemd160Base` — 600, `Ripemd160Word` — 120
- `Gas.Precompile.IdentityBase` — 15, `IdentityWord` — 3
- `Gas.Precompile.ModExpMin` — 200
- `Gas.Precompile.Bn254Add` — 150
- `Gas.Precompile.Bn254Mul` — 6000
- `Gas.Precompile.Bn254PairingBase` — 45000, `Bn254PairingPerPair` — 34000
- `Gas.Precompile.Blake2fRound` — 1

**Calculation Methods:**
- `Gas.calculateKeccak256Cost(dataSize)` — Keccak-256 operation cost
- `Gas.calculateSstoreCost(current, new, original, isWarm)` — SSTORE cost
- `Gas.calculateLogCost(dataSize, topicCount)` — LOG operation cost
- `Gas.calculateCallCost(details, hardfork)` — CALL/STATICCALL/etc. cost
- `Gas.calculateMemoryExpansionCost(oldSize, newSize)` — Memory expansion cost
- `Gas.calculateCreateCost(initcodeSize, hardfork)` — CREATE/CREATE2 cost
- `Gas.calculateTxIntrinsicGas(tx, hardfork)` — Transaction intrinsic gas
- `Gas.calculateCopyCost(size)` — Copy operation cost
- `Gas.calculateMaxRefund(gasUsed, hardfork)` — Maximum gas refund

**Feature Detection:**
- `Gas.hasEIP2929(hardfork)` — Access list support
- `Gas.hasEIP3529(hardfork)` — Reduced refunds
- `Gas.hasEIP3860(hardfork)` — Initcode size limit
- `Gas.hasEIP1153(hardfork)` — Transient storage
- `Gas.hasEIP4844(hardfork)` — Blob transactions

**Hardfork** — Network upgrade tracking
- Hardfork ordering
- Feature detection

**Opcode** — EVM opcode definitions and bytecode analysis

**Types:**
- `Opcode.Code` — Enum of all EVM opcodes (0x00-0xFF)
- `Opcode.Info` — Opcode metadata `{ name, gasCost, stackIn, stackOut, terminating }`
- `Opcode.Instruction` — Parsed instruction `{ opcode, offset, pushData? }`

**Opcode Queries:**
- `Opcode.getInfo(opcode)` — Get opcode metadata
- `Opcode.getName(opcode)` — Get opcode mnemonic (e.g., "ADD", "PUSH1")
- `Opcode.isValid(byte)` — Check if byte is valid opcode
- `Opcode.isPush.call(opcode)` — Check if PUSH1-PUSH32
- `Opcode.isDup.call(opcode)` — Check if DUP1-DUP16
- `Opcode.isSwap.call(opcode)` — Check if SWAP1-SWAP16
- `Opcode.isLog.call(opcode)` — Check if LOG0-LOG4
- `Opcode.isTerminating.call(opcode)` — Check if STOP/RETURN/REVERT/INVALID/SELFDESTRUCT
- `Opcode.isJump.call(opcode)` — Check if JUMP/JUMPI

**PUSH Operations:**
- `Opcode.getPushBytes(opcode)` — Get number of bytes for PUSH (1-32)
- `Opcode.getPushOpcode(numBytes)` — Get PUSH opcode for byte count (1-32)

**DUP/SWAP Operations:**
- `Opcode.getDupPosition(opcode)` — Get DUP stack position (1-16)
- `Opcode.getSwapPosition(opcode)` — Get SWAP stack position (1-16)

**LOG Operations:**
- `Opcode.getLogTopics(opcode)` — Get number of topics (0-4)

**Bytecode Analysis:**
- `Opcode.parseBytecode(bytecode)` — Parse bytecode into instructions
- `Opcode.disassemble(bytecode)` — Disassemble to human-readable format
- `Opcode.findJumpDests(bytecode)` — Find all valid JUMPDEST locations
- `Opcode.isValidJumpDest(bytecode, offset)` — Check if offset is valid JUMPDEST
- `Opcode.formatInstruction(instruction)` — Format instruction for display

**Examples:**
```typescript
import { Opcode } from '@tevm/voltaire';

const info = Opcode.getInfo(0x01); // { name: "ADD", gasCost: 3, ... }
const isPush = Opcode.isPush.call(0x60); // true (PUSH1)
const jumpDests = Opcode.findJumpDests(bytecode);
const instructions = Opcode.parseBytecode(bytecode);
```

**SIWE** — EIP-4361 Sign-In with Ethereum
- Message parsing
- Signature verification

**State** — State constants
- `EMPTY_CODE_HASH` — Keccak-256 of empty bytes
- `EMPTY_TRIE_ROOT` — Empty trie root hash
- Storage key utilities

---

### Cryptography

All crypto implementations use audited libraries (@noble/curves, c-kzg-4844) for production safety.

#### Keccak256 — Primary Ethereum hash function

**Constants:**
- `Keccak256.DIGEST_SIZE` — 32 bytes
- `Keccak256.RATE` — 136 bytes
- `Keccak256.STATE_SIZE` — 25 words

**Hashing:**
- `Keccak256.hash(data)` — Hash bytes to 32-byte hash
- `Keccak256.hashString(str)` — Hash UTF-8 string
- `Keccak256.hashHex(hex)` — Hash hex string
- `Keccak256.hashMultiple(chunks)` — Hash multiple chunks in sequence

**Utilities:**
- `Keccak256.selector(signature)` — Compute 4-byte function selector
- `Keccak256.topic(signature)` — Compute 32-byte event topic
- `Keccak256.contractAddress(sender, nonce)` — Compute CREATE address
- `Keccak256.create2Address(sender, salt, initCodeHash)` — Compute CREATE2 address

**Examples:**
```typescript
import { Keccak256, Hash } from '@tevm/voltaire';

const hash = Keccak256.hash(new Uint8Array([1, 2, 3]));
const hex = Hash.toHex.call(hash);
const selector = Keccak256.selector('transfer(address,uint256)');
```

---

#### Secp256k1 — ECDSA signatures

**Constants:**
- `Secp256k1.CURVE_ORDER` — Curve order
- `Secp256k1.PRIVATE_KEY_SIZE` — 32 bytes
- `Secp256k1.PUBLIC_KEY_SIZE` — 64 bytes (uncompressed)
- `Secp256k1.SIGNATURE_COMPONENT_SIZE` — 32 bytes (r and s)

**Types:**
- `Secp256k1.Signature` — `{ r: Uint8Array, s: Uint8Array, v: number }`
- `Secp256k1.PublicKey` — 64-byte uncompressed public key
- `Secp256k1.PrivateKey` — 32-byte private key

**Signing:**
- `Secp256k1.sign(messageHash, privateKey)` — Sign hash, returns signature with v=27/28
- `Secp256k1.signRecoverable(messageHash, privateKey)` — Sign with explicit recovery ID

**Verification:**
- `Secp256k1.verify(signature, messageHash, publicKey)` — Verify signature
- `Secp256k1.recoverPublicKey(signature, messageHash)` — Recover public key from signature

**Key Operations:**
- `Secp256k1.derivePublicKey(privateKey)` — Derive uncompressed public key
- `Secp256k1.generatePrivateKey()` — Generate random private key

**Validation:**
- `Secp256k1.isValidPrivateKey(key)` — Check if valid private key
- `Secp256k1.isValidPublicKey(key)` — Check if valid public key
- `Secp256k1.normalizeSignature(sig)` — Normalize s value to lower range

**Examples:**
```typescript
import { Secp256k1, Hash, Keccak256 } from '@tevm/voltaire';

const messageHash = Keccak256.hashString('Hello, Ethereum!');
const privateKey = Secp256k1.generatePrivateKey();
const signature = Secp256k1.sign(messageHash, privateKey);

const publicKey = Secp256k1.derivePublicKey(privateKey);
const valid = Secp256k1.verify(signature, messageHash, publicKey); // true

const recovered = Secp256k1.recoverPublicKey(signature, messageHash);
```

---

#### EIP-712 — Typed structured data signing

**Types:**
- `Eip712.Domain` — `{ name?, version?, chainId?, verifyingContract?, salt? }`
- `Eip712.TypeProperty` — `{ name, type }`
- `Eip712.TypeDefinitions` — `{ [typeName: string]: readonly TypeProperty[] }`
- `Eip712.Message` — `{ [key: string]: MessageValue }`
- `Eip712.MessageValue` — string | bigint | number | boolean | Address | Uint8Array | MessageValue[] | object
- `Eip712.TypedData` — `{ domain, types, primaryType, message }`
- `Eip712.Signature` — `{ r, s, v }`

**Domain Operations:**
- `Eip712.Domain.hash(domain)` — Hash EIP-712 domain separator

**Type Encoding:**
- `Eip712.encodeType(primaryType, types)` — Encode type string (e.g., "Person(string name,address wallet)")
- `Eip712.hashType(primaryType, types)` — Hash type string with Keccak-256
- `Eip712.encodeValue(type, value, types)` — Encode single value to bytes
- `Eip712.encodeData(primaryType, data, types)` — Encode structured data to bytes
- `Eip712.hashStruct(primaryType, data, types)` — Hash structured data

**High-Level Operations:**
- `Eip712.hashTypedData(typedData)` — Compute EIP-712 hash for signing
- `Eip712.signTypedData(typedData, privateKey)` — Sign typed data
- `Eip712.verifyTypedData(signature, typedData, address)` — Verify signature
- `Eip712.recoverAddress(signature, typedData)` — Recover signer address

**Utilities:**
- `Eip712.format(typedData)` — Format typed data for display
- `Eip712.validate(typedData)` — Validate typed data structure

**Examples:**
```typescript
import { Eip712, Address } from '@tevm/voltaire';

const typedData: Eip712.TypedData = {
  domain: {
    name: 'MyApp',
    version: '1',
    chainId: 1,
    verifyingContract: Address.fromHex('0x...'),
  },
  types: {
    Person: [
      { name: 'name', type: 'string' },
      { name: 'wallet', type: 'address' },
    ],
  },
  primaryType: 'Person',
  message: { name: 'Alice', wallet: aliceAddress },
};

const hash = Eip712.hashTypedData(typedData);
const signature = Eip712.signTypedData(typedData, privateKey);
const valid = Eip712.verifyTypedData(signature, typedData, aliceAddress);
```

---

#### SHA256 — SHA-256 hash function

**Operations:**
- `SHA256.hash(data)` — Hash bytes to 32-byte hash
- `SHA256.hashString(str)` — Hash UTF-8 string
- `SHA256.hashHex(hex)` — Hash hex string
- `SHA256.create()` — Create incremental hasher (`.update()`, `.digest()`)

**Examples:**
```typescript
import { SHA256 } from '@tevm/voltaire';

const hash = SHA256.hash(data);
const hashHex = SHA256.hashHex('0x1234...');

// Incremental hashing
const hasher = SHA256.create();
hasher.update(chunk1);
hasher.update(chunk2);
const digest = hasher.digest();
```

---

#### RIPEMD160 — RIPEMD-160 hash function

**Operations:**
- `RIPEMD160.hash(data)` — Hash bytes to 20-byte hash
- `RIPEMD160.hashString(str)` — Hash UTF-8 string
- `RIPEMD160.hashHex(hex)` — Hash hex string
- `RIPEMD160.create()` — Create incremental hasher

**Examples:**
```typescript
import { RIPEMD160 } from '@tevm/voltaire';

const hash = RIPEMD160.hash(data); // 20 bytes
```

---

#### Blake2 — BLAKE2b hash function

**Operations:**
- `Blake2.hash(data, size?)` — Hash bytes (default 32 bytes, customizable 1-64)
- `Blake2.hashString(str, size?)` — Hash UTF-8 string
- `Blake2.hashHex(hex, size?)` — Hash hex string
- `Blake2.create(size?)` — Create incremental hasher

**Examples:**
```typescript
import { Blake2 } from '@tevm/voltaire';

const hash32 = Blake2.hash(data); // 32 bytes
const hash64 = Blake2.hash(data, 64); // 64 bytes
```

---

#### BN254 — BN254/alt_bn128 elliptic curve

**Operations:**
- `BN254.g1Add(p1, p2)` — G1 point addition
- `BN254.g1Mul(p, scalar)` — G1 scalar multiplication
- `BN254.g2Add(p1, p2)` — G2 point addition
- `BN254.g2Mul(p, scalar)` — G2 scalar multiplication
- `BN254.pairing(pairs)` — Pairing check

Used for zkSNARK verification (EIP-196, EIP-197).

---

#### KZG — KZG commitments for EIP-4844

**Operations:**
- `KZG.blobToKzgCommitment(blob)` — Compute KZG commitment
- `KZG.computeBlobKzgProof(blob, commitment)` — Compute proof
- `KZG.verifyBlobKzgProof(blob, commitment, proof)` — Verify proof
- `KZG.verifyBlobKzgProofBatch(blobs, commitments, proofs)` — Batch verification

Uses c-kzg-4844 library.

**Examples:**
```typescript
import { KZG } from '@tevm/voltaire';

const commitment = KZG.blobToKzgCommitment(blobData);
const proof = KZG.computeBlobKzgProof(blobData, commitment);
const valid = KZG.verifyBlobKzgProof(blobData, commitment, proof);
```

---

## Precompiles

All 19 EVM precompiled contracts with gas cost calculations:

- `isPrecompile(address, hardfork)` — Check if address is precompile
- `execute(address, input, gasLimit, hardfork)` — Execute precompile

Individual precompiles (0x01-0x13):
- `ecrecover` — Recover signer from ECDSA signature
- `sha256` — SHA-256 hash
- `ripemd160` — RIPEMD-160 hash
- `identity` — Identity/copy
- `modexp` — Modular exponentiation
- `bn254Add` — BN254 addition
- `bn254Mul` — BN254 multiplication
- `bn254Pairing` — BN254 pairing
- `blake2f` — Blake2b compression
- `pointEvaluation` — KZG point evaluation (EIP-4844)
- BLS12-381 precompiles (EIP-2537, Prague+):
  - `bls12G1Add`, `bls12G1Mul`, `bls12G1Msm`
  - `bls12G2Add`, `bls12G2Mul`, `bls12G2Msm`
  - `bls12Pairing`
  - `bls12MapFpToG1`, `bls12MapFp2ToG2`

---

## Quick Reference Tables

### Primitive Types

| Type | Size | Description | Key Methods |
|------|------|-------------|-------------|
| Address | 20 bytes | Ethereum address | fromHex, toChecksumHex, calculateCreate2Address |
| Hash | 32 bytes | Keccak-256 hash | keccak256, toHex, equals |
| Hex | Variable | Hex encoding | fromBytes, toBytes, concat, slice |
| Uint | 32 bytes | 256-bit unsigned int | from, plus, minus, times, dividedBy |
| RLP | Variable | RLP encoding | encode, decode |
| Transaction | Variable | Ethereum transactions | serialize, deserialize, hash, from |
| ABI | Variable | ABI encoding | Function.encode, Event.decode |

### Crypto Functions

| Function | Input | Output | Use Case |
|----------|-------|--------|----------|
| Keccak256.hash | Uint8Array | 32-byte Hash | General hashing, contract addresses |
| Secp256k1.sign | Hash, PrivateKey | Signature | Sign transactions/messages |
| Secp256k1.recover | Signature, Hash | PublicKey | Recover signer address |
| EIP712.hash | Domain, Types, Message | Hash | Typed data signing |
| SHA256.hash | Uint8Array | 32-byte hash | Bitcoin compatibility |
| RIPEMD160.hash | Uint8Array | 20-byte hash | Bitcoin addresses |
| Blake2.hash | Uint8Array, size? | 1-64 byte hash | Zcash compatibility |
| BN254.pairing | Point pairs | boolean | zkSNARK verification |
| KZG.verify | Blob, Commitment, Proof | boolean | EIP-4844 blob verification |

---

## Architecture

### Data-First Pattern

All primitives follow a consistent data-first pattern:

```typescript
// Data types are branded primitives (Uint8Array, bigint, string)
type Address = Uint8Array & { __tag: "Address" };
type Hash = Uint8Array & { __brand: symbol };
type Uint = bigint & { __brand: symbol };
type Hex = `0x${string}`;

// Methods are namespaced and use .call() for instance methods
const addr = Address.fromHex('0x...');
const hex = Address.toHex.call(addr);
const checksum = Address.toChecksumHex.call(addr);

// No classes, no instances, just branded primitives
// Perfect for tree-shaking and serialization
```

### Benefits

1. **Tree-shaking**: Only methods you use are bundled
2. **Zero overhead**: No class instances, just primitives
3. **Serialization**: Primitives serialize naturally to JSON
4. **Interop**: Works seamlessly with other libraries
5. **Type safety**: TypeScript brands ensure type correctness
6. **Performance**: Direct function calls, no prototype chain

---

## Performance

All implementations optimized for production use:

- **Native/WASM**: Optional native bindings via Zig for 2-10x speedup
- **Audited crypto**: @noble/curves, c-kzg-4844 for security
- **Zero dependencies**: Core TypeScript has zero runtime deps
- **Minimal bundle**: Tree-shakeable, only pay for what you use

Benchmark results available in each primitive's bench.ts file.

---

## Testing

Comprehensive test coverage:
- 300+ tests for Address
- Cross-validation against viem, ethers.js
- EIP compliance test vectors
- Fuzzing for edge cases

Run tests:
```bash
bun test                    # All tests
bun test address            # Specific primitive
zig build test             # Zig implementation
```

---

## License

MIT License - see [LICENSE](./LICENSE) for details

---

## Links

- [GitHub Issues](https://github.com/evmts/voltaire/issues)
- [Telegram](https://t.me/+ANThR9bHDLAwMjUx)
- [Twitter](https://twitter.com/tevmtools)
- [Complete Zig API](./ZIG_API.md)

---

## Alternatives

- [Viem](https://viem.sh) - Popular TypeScript Ethereum library
- [Ethers.js](https://docs.ethers.org/) - Comprehensive Ethereum library
- [web3.js](https://web3js.org/) - Original Ethereum JavaScript library
