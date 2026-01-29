# Voltaire Comprehensive Benchmark Command

## Overview

Benchmark EVERY API in Voltaire comparing 6 implementations:

1. **voltaire** - Default JS/TS (e.g., `@tevm/voltaire/Keccak256`)
2. **voltaire/wasm** - WASM build (e.g., `@tevm/voltaire/Keccak256/wasm`)
3. **voltaire/native** - Native FFI (e.g., `@tevm/voltaire/Keccak256/native`)
4. **voltaire-effect** - Effect wrapper (`voltaire-effect`)
5. **viem** - Competitor (`viem`)
6. **ethers** - Competitor (`ethers`)

## How to Run

Split work across 8 parallel agents. Each agent handles one slice:

```
/benchmark slice=1
/benchmark slice=2
...
/benchmark slice=8
```

## Benchmark File Pattern

Create/update `*.bench.ts` files using mitata:

```typescript
import { bench, run } from "mitata";
import { Effect } from "effect";

// 1. voltaire (default JS)
import { ModuleName } from "@tevm/voltaire/ModuleName";

// 2. voltaire/wasm
import { ModuleName as ModuleNameWasm } from "@tevm/voltaire/ModuleName/wasm";

// 3. voltaire/native (if available)
import * as ModuleNameNative from "@tevm/voltaire/ModuleName/native";

// 4. voltaire-effect
import { ModuleName as ModuleNameEffect } from "voltaire-effect/ModuleName";

// 5. viem (if equivalent exists)
import { equivalentFn } from "viem";

// 6. ethers (if equivalent exists)
import { equivalentFn } from "ethers";

// Initialize WASM before benchmarks
await ModuleNameWasm.init?.();

// Pre-warm native
try { await ModuleNameNative.someMethod?.(); } catch {}

// Test data
const testData = /* realistic test data */;

// Benchmark each method
bench("methodName - voltaire", () => ModuleName.methodName(testData));
bench("methodName - wasm", () => ModuleNameWasm.methodName(testData));
bench("methodName - native", async () => await ModuleNameNative.methodName(testData));
bench("methodName - effect", () => Effect.runSync(ModuleNameEffect.methodName(testData)));
bench("methodName - viem", () => viemEquivalent(testData));
bench("methodName - ethers", () => ethersEquivalent(testData));

await run();
```

## Output Format

After running, report results as:

| Module | Method | voltaire | wasm | native | effect | viem | ethers | Winner |
|--------|--------|----------|------|--------|--------|------|--------|--------|
| Keccak256 | hash(32B) | 3.2µs | 350ns | 280ns | 3.4µs | 3.8µs | 4.2µs | native |

## Notes

- Skip implementations that don't exist for a module (e.g., no native, no viem equivalent)
- Use realistic test data (real addresses, transactions, signatures)
- Test multiple input sizes where relevant (small, medium, large)
- Run with `bun run <file>.bench.ts`
- Focus on happy path benchmarks

---

# ALL MODULES TO BENCHMARK (177 total)

Split into 8 slices (~22 modules each):

---

## SLICE 1: Crypto + Core Primitives (22 modules)

**Crypto (16):**
- Keccak256
- SHA256
- Ripemd160
- Blake2
- HMAC
- ModExp
- AesGcm
- ChaCha20Poly1305
- Secp256k1
- bn254
- Bls12381
- X25519
- Ed25519
- P256
- HDWallet
- Keystore

**Core Primitives (6):**
- Address
- Hex
- Hash
- Bytes
- Bytes32
- Uint

---

## SLICE 2: Numeric Types + Signatures (22 modules)

- Uint8
- Uint16
- Uint32
- Uint64
- Uint128
- Uint256
- Int8
- Int16
- Int32
- Int64
- Int128
- Int256
- Signature
- PrivateKey
- PublicKey
- Selector
- Nonce
- Gas
- GasUsed
- GasEstimate
- GasRefund
- GasCosts

---

## SLICE 3: Encoding + ABI (22 modules)

- Rlp
- Abi
- Abi/function
- Abi/error
- Abi/constructor
- Abi/parameter
- Abi/Item
- Abi/interface
- Base64
- Ssz
- TypedData
- Domain
- DomainSeparator
- EncodedData
- DecodedData
- CallData
- ReturnData
- InitCode
- RuntimeCode
- Bytecode
- ContractCode
- SourceMap

---

## SLICE 4: Transaction + Block (22 modules)

- Transaction
- TransactionHash
- TransactionIndex
- TransactionStatus
- TransactionUrl
- Receipt
- AccessList
- Authorization
- Blob
- Block
- BlockBody
- BlockHeader
- BlockHash
- BlockNumber
- BlockFilter
- Uncle
- Withdrawal
- WithdrawalIndex
- StateRoot
- BeaconBlockRoot
- MerkleTree
- BinaryTree

---

## SLICE 5: Account + State (22 modules)

- AccountState
- State
- StateDiff
- StateProof
- Storage
- StorageDiff
- StorageProof
- StorageValue
- Slot
- Proof
- Balance (TokenBalance)
- TokenId
- MultiTokenId
- ContractResult
- ContractSignature
- Permit
- UserOperation
- PackedUserOperation
- Paymaster
- EntryPoint
- Bundler
- Bundle

---

## SLICE 6: Events + Logs + Filters (22 modules)

- EventLog
- EventSignature
- ErrorSignature
- FunctionSignature
- LogFilter
- LogIndex
- TopicFilter
- BloomFilter
- FilterId
- PendingTransactionFilter
- CallTrace
- StructLog
- OpStep
- TraceConfig
- TraceResult
- MemoryDump
- RevertReason
- Opcode
- GasConstants
- Hardfork
- ForkId
- ProtocolVersion

---

## SLICE 7: Network + Chain (22 modules)

- ChainId
- ChainHead
- NetworkId
- NodeInfo
- PeerId
- PeerInfo
- SyncStatus
- Epoch
- ValidatorIndex
- BuilderBid
- RelayData
- Ens
- StealthAddress
- Proxy
- License
- CompilerVersion
- Metadata
- Siwe
- SignedData
- FeeOracle
- BaseFeePerGas
- EffectiveGasPrice

---

## SLICE 8: Fee + Remaining (23 modules)

- MaxFeePerGas
- MaxPriorityFeePerGas
- FeeMarket (if exists)
- BundleHash
- Bytes1
- Bytes2
- Bytes3
- Bytes4
- Bytes5
- Bytes6
- Bytes7
- Bytes8
- Bytes16
- Bytes64
- validation
- errors
- signers
- Hex/extensions
- Bytes/extensions
- Base64/extensions
- BloomFilter/extensions
- Abi/wasm
- Abi/error/standards
- Abi/error/wrapped

---

# Execution Instructions

1. Agent reads this file
2. Agent identifies its slice (1-8)
3. For each module in slice:
   - Find or create `<module>.bench.ts`
   - Import all 6 implementations (skip unavailable)
   - Benchmark ALL exported methods
   - Run benchmark, collect results
4. Report summary table at end

## Finding Module Methods

```bash
# List exports for a module
grep -E "^export" src/primitives/Address/index.ts
grep -E "^export" src/crypto/Keccak256/index.ts
```

## Running Benchmarks

```bash
bun run src/crypto/keccak256.bench.ts
bun run src/primitives/Address/Address.bench.ts
```

## viem/ethers Equivalents

| Voltaire | viem | ethers |
|----------|------|--------|
| Keccak256.hash | keccak256 | keccak256 |
| Address.from | getAddress | getAddress |
| Address.isValid | isAddress | isAddress |
| Address.toChecksum | checksumAddress | getAddress |
| Hex.toBytes | hexToBytes | arrayify |
| Hex.fromBytes | bytesToHex | hexlify |
| Rlp.encode | toRlp | encodeRlp |
| Rlp.decode | fromRlp | decodeRlp |
| Transaction.parse | parseTransaction | Transaction.from |
| Transaction.serialize | serializeTransaction | serialize |
| Signature.from | parseSignature | Signature.from |
| Abi.encodeFunction | encodeFunctionData | Interface.encodeFunctionData |
| Abi.decodeFunction | decodeFunctionData | Interface.decodeFunctionData |
| EventLog.decode | decodeEventLog | Interface.parseLog |
| TypedData.hash | hashTypedData | TypedDataEncoder.hash |
