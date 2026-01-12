# TEVM Parity Implementation Plan for Voltaire

**Goal**: Replace TEVM with Voltaire + Guillotine Mini as a feature-complete, fork-capable Ethereum dev node

**Status**: Research complete, architecture defined, ready for phased implementation

---

## Executive Summary

Voltaire has **excellent primitives** (Transaction, Block, Receipt, RLP, Crypto all production-ready). Guillotine Mini has a **clean EVM core with host interface**. Missing: the **orchestration layer** around the EVM - state management, txpool, blockchain, mining, and JSON-RPC.

TEVM's architecture is **blocking async** (no yield/resume complexity). Fork state uses **lazy-load + dual-cache**. Mining uses **VM deep copy + checkpoint/commit**. This is **highly replicable** in Voltaire.

**Critical Decision**: Implement **blocking async host interface first** (simpler, matches TEVM), defer yield/resume optimization to post-parity.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│ @voltaire/memory-client (TS)                                │
│  - createMemoryClient() factory                             │
│  - viem-compatible client surface                           │
│  - Auto-mining coordination                                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ @voltaire/jsonrpc (TS)                                      │
│  - EIP-1193 request({method, params})                       │
│  - JSON-RPC handler dispatch (50+ methods)                  │
│  - Error mapping (RPC error codes)                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│ @voltaire/node (TS + Zig)                                   │
│  - Node lifecycle (IDLE → STARTING → READY → MINING)       │
│  - Component orchestration                                  │
│  - Extension/plugin system                                  │
└───┬───────────┬───────────┬───────────┬────────────────────┘
    │           │           │           │
    │ ┌─────────▼──┐ ┌──────▼─────┐ ┌──▼────────┐ ┌─────────▼────┐
    │ │ StateManager│ │ TxPool     │ │ Blockchain│ │ ReceiptsManager│
    │ │ (Fork-aware)│ │ (Pending)  │ │ (Chain)   │ │ (Logs/Receipts)│
    │ └─────────┬──┘ └──────┬─────┘ └──┬────────┘ └─────────┬────┘
    │           │           │           │                    │
┌───▼───────────▼───────────▼───────────▼────────────────────▼────┐
│ Guillotine Mini EVM (Zig)                                       │
│  - Executes opcodes via Host interface                          │
│  - Precompile dispatch                                          │
│  - Call/Create handling                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Package Roadmap

### Package A: `@voltaire/state-manager` (Zig + TS)
**Purpose**: Fork-capable state with overlay journaling

**Core Components**:
1. `StateCache` (per-type caching):
   - `AccountCache`: nonce/balance/codeHash/storageRoot
   - `StorageCache`: per-address slot maps
   - `ContractCache`: bytecode (uses storage cache internally)
2. `ForkBackend`:
   - RPC client vtable for remote fetches
   - Block tag pinning
   - LRU cache for fetched state
3. `JournaledState`:
   - Checkpoint/revert stack per cache
   - Commit finalizes changes, pops stack
4. Operations:
   - `getAccount`, `putAccount`, `modifyAccount`
   - `getStorage`, `putStorage`
   - `getCode`, `putCode`
   - `setBalance`, `setNonce` (direct mutations)
   - `checkpoint`, `revert`, `commit`
   - `clearCaches`, `clearForkCache`

**Critical Files**:
- `src/state-manager/StateCache.zig` - Cache data structures
- `src/state-manager/ForkBackend.zig` - Remote state fetcher
- `src/state-manager/JournaledState.zig` - Checkpoint logic
- `src/state-manager/StateManager.zig` - Main orchestrator
- `src/state-manager/StateManager/index.ts` - TS wrapper

**Implementation Notes**:
- **Dual-cache strategy**: Fork cache stores fetched state, normal cache is source of truth after modification
- **Blocking async**: State reads use `async/await`, EVM execution waits for fetched data
- **Snapshot = checkpoint**: `tevm_snapshot` returns checkpoint ID (u64 counter)
- **Validation**: Account trie validation optional (pragmatic mode: skip MPT, trust fork)

**Dependencies**:
- Voltaire primitives: `Address`, `Hash`, `AccountState`, `Uint256`
- Crypto: `Keccak256` (for code hash validation)
- RLP: Encode/decode account state (already exists in Zig)

**Testing Strategy**:
- Unit tests: cache operations, checkpoint/revert cycles
- Fork tests: fetch account from real Mainnet/Optimism via Alchemy
- Benchmark: cache hit rate, fork fetch latency

---

### Package B: `@voltaire/txpool` (Zig + TS)
**Purpose**: Transaction validation, ordering, replacement

**Core Components**:
1. `TxPoolObject`:
   - Transaction + metadata (received time, from address)
2. Four indexes (matches TEVM):
   - `pool`: Map<Address, TxPoolObject[]> (main storage)
   - `txsByHash`: Map<Hash, Transaction> (lookup by hash)
   - `txsByNonce`: Map<Address, Map<nonce, Transaction>> (nonce conflicts)
   - `handled`: Map<Hash, HandledObject> (historical tracking)
3. Operations:
   - `add`: Validate, check replacement, insert
   - `remove`, `removeTx`, `removeNewBlockTxs`
   - `txsByPriceAndNonce`: Heap-based merge sort for mining
   - `clear`, `getPoolSize`

**Validation Rules**:
- Signature validation (unless impersonated)
- Nonce ≥ account nonce
- Balance ≥ gas cost + value
- Gas limit ≤ block gas limit
- Fee bump for replacement (10% minimum)

**Replacement Logic**:
- Same nonce, higher gas price → replace
- EIP-1559: compare `maxFeePerGas` and `maxPriorityFeePerGas`
- EIP-4844: compare `maxFeePerBlobGas`

**Impersonation Support**:
- `impersonatedAccounts`: Set<Address>
- Skip signature validation for impersonated accounts
- Used in fork mode for arbitrary sender transactions

**Critical Files**:
- `src/txpool/TxPool.zig` - Main pool logic
- `src/txpool/TxPoolObject.zig` - Pool entry type
- `src/txpool/txsByPriceAndNonce.zig` - Heap-based tx sorter
- `src/txpool/validation.zig` - Validation rules
- `src/txpool/TxPool/index.ts` - TS wrapper

**Dependencies**:
- Voltaire primitives: `Transaction`, `Address`, `Hash`, `Signature`
- Crypto: `Secp256k1` (signature recovery)
- State manager: account nonce/balance queries

**Testing Strategy**:
- Unit tests: add/remove, replacement, nonce gaps
- Integration: impersonation, mining order, fee bumps
- Stress test: 10k tx pool, price/nonce sorting performance

---

### Package C: `@voltaire/blockchain` (Zig + TS)
**Purpose**: Canonical chain store + forked history

**Core Components**:
1. `BlockStore`:
   - `blocksByHash`: Map<Hash, Block>
   - `blocksByNumber`: Map<number, Hash>
   - `canonicalHead`: Current head block
2. Fork integration:
   - Blocks ≤ forkBlock: fetch from remote on-demand, cache
   - Blocks > forkBlock: locally built
3. Operations:
   - `getBlock`, `putBlock`
   - `getCanonicalHeadBlock`, `setCanonicalHead`
   - `getBlockByNumber`, `getBlockByHash`
   - `getTotalDifficulty` (pre-merge only)
   - `iterator` (optional: block range iteration)

**Block Validation**:
- Parent hash linkage
- Block number sequence
- Timestamp ≥ parent timestamp
- Gas limit within bounds (EIP-1559: ±1/1024 parent)
- Base fee calculation (EIP-1559)

**Fork Behavior**:
- Remote blocks cached in `forkBlockCache`
- Local blocks stored in normal store
- `getBlockByNumber`: check local first, fallback to fork

**Critical Files**:
- `src/blockchain/BlockStore.zig` - Block storage
- `src/blockchain/ForkBlockCache.zig` - Remote block cache
- `src/blockchain/validation.zig` - Block validation
- `src/blockchain/Blockchain.zig` - Main orchestrator
- `src/blockchain/Blockchain/index.ts` - TS wrapper

**Missing Primitives (Quick Fixes)**:
- `BlockHeader.hash()`: `Keccak256(RLP.encode(header))`
- `BlockHeader.rlpEncode()`: Use existing RLP encoder
- `Block.rlpEncode()`: Encode header + body

**Dependencies**:
- Voltaire primitives: `Block`, `BlockHeader`, `Hash`, `Uint256`
- RLP: Encode block header
- Crypto: `Keccak256`

**Testing Strategy**:
- Unit tests: put/get, head tracking, fork cache
- Fork tests: fetch historical blocks from Mainnet
- Validation: block linkage, gas limit bounds

---

### Package D: `@voltaire/receipts-manager` (Zig + TS)
**Purpose**: Receipt/log storage + bloom filter generation

**Core Components**:
1. `ReceiptStore`:
   - `receiptsByBlockHash`: Map<Hash, Receipt[]>
   - `receiptsByTxHash`: Map<Hash, Receipt>
   - `logsByBlockNumber`: Map<number, EventLog[]>
2. Bloom filter generation:
   - `generateLogsBloom(logs[])` → 256-byte bloom
   - Keccak256-based filter: hash(address), hash(topic0), hash(topic1), ...
3. Operations:
   - `saveReceipts(block, receipts[])`
   - `getReceipt(txHash)`
   - `getReceiptsByBlockHash(blockHash)`
   - `getLogs(filter)` (address, topics, blockRange)

**Bloom Filter Algorithm** (EIP-234):
```
bloom = [0; 256]
for each log:
  bloom |= keccak256(log.address)[0:3] mod 2048 set bits
  for each topic:
    bloom |= keccak256(topic)[0:3] mod 2048 set bits
```

**Critical Files**:
- `src/receipts-manager/ReceiptStore.zig` - Storage
- `src/receipts-manager/bloomFilter.zig` - Bloom generation (NEW)
- `src/receipts-manager/ReceiptsManager.zig` - Main orchestrator
- `src/receipts-manager/ReceiptsManager/index.ts` - TS wrapper

**Missing Primitives (Quick Fixes)**:
- `Receipt.toRlp()`: Use RLP.encodeObject (TS side)
- `Bloom.compute(logs[])`: Implement bloom algorithm (Zig)

**Dependencies**:
- Voltaire primitives: `Receipt`, `EventLog`, `Block`, `Hash`
- Crypto: `Keccak256`
- RLP: Encode receipts

**Testing Strategy**:
- Unit tests: save/get receipts, bloom filter generation
- Fork tests: compare bloom with Mainnet receipts
- Log filtering: topic/address queries

---

### Package E: `@voltaire/node` (TS + Zig)
**Purpose**: Orchestrate components, expose control plane

**Core Components**:
1. `NodeConfig`:
   - Chain config (chainId, hardfork)
   - Fork config (url, blockTag)
   - Mining config (auto-mine, blockTime)
   - Precompile overrides
   - Logger config
2. `Node` class:
   - State machine: `IDLE → STARTING → READY → MINING → STOPPED`
   - Component initialization: VM, StateManager, TxPool, Blockchain, ReceiptsManager
   - Mining coordination
3. Operations:
   - `start()`, `stop()`
   - `mine(blockCount, options)`
   - `snapshot()`, `revert(snapshotId)`
   - `setBalance(address, balance)`
   - `setAccount(address, account)`
   - `impersonateAccount(address)`, `stopImpersonatingAccount(address)`
   - `getVm()`, `getStateManager()`, `getTxPool()`, `getBlockchain()`
   - `deepCopy()` (clone entire node state)

**Mining Pipeline** (matches TEVM):
```javascript
async mine(blockCount = 1, options?) {
  // 1. Validate state (READY → MINING)
  this.setState(MINING)

  // 2. Deep copy VM to avoid state root corruption
  const vm = await this.vm.deepCopy()

  // 3. For each block:
  for (let i = 0; i < blockCount; i++) {
    const parent = await vm.blockchain.getCanonicalHeadBlock()

    // 4. Prepare header with overrides
    const timestamp = options?.timestamp ?? Math.max(Date.now()/1000, parent.timestamp)
    const baseFee = options?.baseFeePerGas ?? parent.calcNextBaseFee()

    // 5. Build block
    const builder = await vm.buildBlock({
      parentBlock: parent,
      headerData: { timestamp, number: parent.number + 1, baseFee, ... }
    })

    // 6. Add transactions from pool (price/nonce ordered)
    const orderedTx = await this.txpool.txsByPriceAndNonce({ baseFee })
    for (const tx of orderedTx) {
      const result = await builder.addTransaction(tx, {
        skipBalance: true,  // Already validated in pool
        skipNonce: true
      })
      receipts.push(result.receipt)
    }

    // 7. Commit state and finalize block
    await vm.stateManager.checkpoint()
    await vm.stateManager.commit()
    const block = await builder.build()

    // 8. Save receipts and block
    await this.receiptsManager.saveReceipts(block, receipts)
    await vm.blockchain.putBlock(block)
    this.txpool.removeNewBlockTxs([block])
  }

  // 9. Sync original VM with new state
  this.vm.blockchain = vm.blockchain
  await this.vm.stateManager.setStateRoot(vm.stateManager.getCurrentStateRoot())

  // 10. Return to READY
  this.setState(READY)
  return { blockHashes: blocks.map(b => b.hash) }
}
```

**Extension System**:
- Plugins can hook into lifecycle events
- Custom precompiles registered at init
- RPC method extensions

**Critical Files**:
- `src/node/Node.zig` - Core node logic (Zig)
- `src/node/NodeConfig.zig` - Configuration
- `src/node/mining.zig` - Mining pipeline
- `src/node/Node/index.ts` - TS wrapper + orchestration

**Dependencies**:
- All packages A-D
- Guillotine Mini EVM
- Voltaire primitives: all transaction/block types

**Testing Strategy**:
- Integration tests: full flow (fork → read → tx → mine → receipt)
- Snapshot/revert: complex state changes
- Deep copy: concurrent execution correctness

---

### Package F: `@voltaire/jsonrpc` (TS)
**Purpose**: EIP-1193 provider + JSON-RPC handler dispatch

**Core Components**:
1. `EIP1193Provider`:
   - `request({ method, params })` → Promise<result>
   - Error mapping to ProviderRpcError
2. `JsonRpcServer`:
   - Single + batch request handling
   - Method dispatch table (50+ methods)
   - Fork transport abstraction
3. Handler dispatch pattern:
```typescript
const handlers = {
  // Eth namespace (state access)
  eth_getBalance: getBalanceHandler(node),
  eth_getCode: getCodeHandler(node),
  eth_getStorageAt: getStorageAtHandler(node),
  eth_getTransactionCount: getTransactionCountHandler(node),

  // Eth namespace (blocks)
  eth_blockNumber: blockNumberHandler(node),
  eth_getBlockByHash: getBlockByHashHandler(node),
  eth_getBlockByNumber: getBlockByNumberHandler(node),

  // Eth namespace (transactions)
  eth_call: callHandler(node),
  eth_estimateGas: estimateGasHandler(node),
  eth_sendTransaction: sendTransactionHandler(node),
  eth_sendRawTransaction: sendRawTransactionHandler(node),
  eth_getTransactionByHash: getTransactionByHashHandler(node),
  eth_getTransactionReceipt: getTransactionReceiptHandler(node),

  // Anvil namespace
  anvil_impersonateAccount: impersonateAccountHandler(node),
  anvil_stopImpersonatingAccount: stopImpersonatingAccountHandler(node),
  anvil_mine: anvilMineHandler(node),
  anvil_setBalance: setBalanceHandler(node),
  anvil_setCode: setCodeHandler(node),
  anvil_setNonce: setNonceHandler(node),

  // TEVM namespace
  tevm_snapshot: snapshotHandler(node),
  tevm_revert: revertHandler(node),
  tevm_mine: tevmMineHandler(node),  // Alias to node.mine
  tevm_setAccount: setAccountHandler(node),
  tevm_getAccount: getAccountHandler(node),
  tevm_call: tevmCallHandler(node),
  tevm_contract: tevmContractHandler(node),
}

async function request({ method, params }) {
  if (!(method in handlers)) {
    throw MethodNotFoundError(method)
  }
  try {
    return await handlers[method](params)
  } catch (error) {
    throw mapErrorToRpcError(error)
  }
}
```

**Fork Transport**:
- Accept any EIP-1193 provider for fork backend
- Retry logic with exponential backoff
- Batch request optimization

**Critical Files**:
- `src/jsonrpc/EIP1193Provider.ts` - Provider interface
- `src/jsonrpc/JsonRpcServer.ts` - Dispatch logic
- `src/jsonrpc/handlers/` - 50+ handler files
- `src/jsonrpc/errors.ts` - RPC error mapping

**Method Priority (Implement First)**:
1. **Milestone 1**: State reads (getBalance, getCode, getStorageAt, getTransactionCount, blockNumber, getBlockByNumber)
2. **Milestone 2**: Transactions (sendRawTransaction, getTransactionByHash, getTransactionReceipt, call, estimateGas)
3. **Milestone 3**: Dev controls (mine, setBalance, impersonateAccount, snapshot, revert)
4. **Milestone 4**: Logs/filters (getLogs, newFilter, getFilterChanges)

**Dependencies**:
- Node package (all operations delegate to node)
- Voltaire primitives: all types for serialization

**Testing Strategy**:
- Conformance tests: compare TEVM vs Voltaire responses
- Method matrix: all documented methods vs actual TEVM behavior
- Error handling: invalid params, missing data

---

### Package G: `@voltaire/memory-client` (TS)
**Purpose**: Batteries-included client factory

**Core API**:
```typescript
createMemoryClient({
  fork?: {
    transport: EIP1193Provider | HttpTransport,
    blockTag?: BlockTag,
  },
  chain?: Chain,
  hardfork?: Hardfork,
  mining?: {
    auto?: boolean,
    blockTime?: number,
  },
  accounts?: Account[],
  precompiles?: PrecompileOverride[],
  logger?: { level: 'trace' | 'debug' | 'info' | 'warn' | 'error' },
}) → MemoryClient
```

**MemoryClient extends viem Client**:
- All viem public actions (getBalance, getBlock, etc.)
- Custom actions:
  - `mine(blockCount?, options?)`
  - `setBalance(address, balance)`
  - `setAccount(address, account)`
  - `impersonateAccount(address)`
  - `snapshot()`
  - `revert(snapshotId)`
  - `ready()` - Warm fork caches

**Auto-mining coordination**:
- If `mining.auto = true`, mine after every tx
- If `mining.blockTime` set, mine on interval

**Critical Files**:
- `src/memory-client/createMemoryClient.ts` - Main factory
- `src/memory-client/actions/` - Custom actions
- `src/memory-client/decorators/` - viem integration

**Dependencies**:
- Node + JSON-RPC packages
- viem (for client extension)

**Testing Strategy**:
- Example flows: all TEVM quickstart examples
- viem compatibility: existing viem tests pass
- Fork warmup: ready() call performance

---

### Package H: Guillotine Mini EVM Upgrades (Zig + WASM)
**Purpose**: Async host interface + call/create support

**Blocking Async Host** (Phase 1 - Simple):
Keep synchronous Zig interface, wrap with async in TS:

```typescript
// TS Host Adapter (blocks on async)
class AsyncHostAdapter implements HostInterface {
  constructor(private stateManager: StateManager) {}

  // Synchronous from Zig's perspective, but internally awaits
  getBalance(address: Address): Wei {
    return await this.stateManager.getAccount(address).balance
  }

  getStorage(address: Address, slot: Uint256): Uint256 {
    return await this.stateManager.getStorage(address, slot)
  }
}
```

**Call/Create Support** (Phase 1 - Required):
Implement nested execution:
- `host.call(to, data, gas, value)` → CallResult
- `host.create(value, initcode, gas)` → CreateResult
- Recursion depth limit (1024)
- Gas forwarding rules (EIP-150: 63/64 rule)

**Trace Hooks** (Phase 2 - Optional):
```zig
pub const TraceHooks = struct {
  onStep: ?*const fn(pc: u64, opcode: u8, gas: u64) void,
  onBeforeMessage: ?*const fn(depth: u32, to: Address, data: []const u8) void,
  onAfterMessage: ?*const fn(depth: u32, gasUsed: u64, output: []const u8) void,
};
```

**Yield/Resume** (Phase 3 - Future Optimization):
Only implement if blocking async becomes performance bottleneck:
- Define `DataRequest` enum (GetAccount, GetStorage, GetCode)
- Frame serialization for checkpoints
- JS-side resume handler

**Critical Files**:
- `src/evm/host.zig` - Extend host interface (call/create)
- `src/evm/evm.zig` - Add trace hooks (optional)
- `src/evm/Host/AsyncAdapter.ts` - TS async wrapper (NEW)

**Dependencies**:
- State manager (for async state reads)

**Testing Strategy**:
- Nested calls: CALL → CALL → CALL (depth limit)
- CREATE: contract deployment
- Gas accounting: verify 63/64 forwarding

---

## Implementation Milestones

### Milestone 1: "Forked Read Node" (2-3 weeks)
**Goal**: Read-only fork works (fast, reliable)

**Deliverables**:
1. State manager with fork backend + cache
2. Blockchain with fork block fetching
3. JSON-RPC: state reads + block queries
4. Integration test: fork Mainnet → read balance/code → verify correctness

**Acceptance Criteria**:
- ✅ `eth_getBalance` works in fork mode
- ✅ `eth_getCode` works in fork mode
- ✅ `eth_getStorageAt` works in fork mode
- ✅ `eth_blockNumber` returns fork head
- ✅ `eth_getBlockByNumber` fetches remote blocks

**Package Order**:
1. State manager (A) - 1 week
2. Blockchain (C) - 3 days
3. JSON-RPC handlers (F - subset) - 3 days
4. Integration tests - 1 day

---

### Milestone 2: "Write + Mine" (2-3 weeks)
**Goal**: Send tx → mine → receipt works

**Deliverables**:
1. TxPool with validation + replacement
2. Receipts manager with bloom filters
3. Node mining pipeline
4. JSON-RPC: tx submission + mining
5. Integration test: fork → send tx → mine → read receipt

**Acceptance Criteria**:
- ✅ `eth_sendRawTransaction` adds to pool
- ✅ `node.mine()` builds block with tx
- ✅ `eth_getTransactionReceipt` returns correct receipt
- ✅ Logs/bloom filters generated correctly
- ✅ Pool removes mined transactions

**Package Order**:
1. TxPool (B) - 1 week
2. Receipts manager (D) - 3 days
3. Node + mining (E) - 1 week
4. JSON-RPC handlers (F - tx subset) - 2 days
5. Integration tests - 1 day

---

### Milestone 3: "Devnode Controls" (1 week)
**Goal**: Match TEVM control plane

**Deliverables**:
1. Snapshot/revert in state manager
2. Direct mutations (setBalance, setAccount)
3. Impersonation in txpool
4. JSON-RPC: anvil + tevm methods
5. Integration test: snapshot → modify → revert → verify state restored

**Acceptance Criteria**:
- ✅ `tevm_snapshot` / `tevm_revert` works
- ✅ `anvil_setBalance` mutates state
- ✅ `tevm_setAccount` mutates account
- ✅ `anvil_impersonateAccount` bypasses sig validation
- ✅ State changes persist across snapshots

**Package Order**:
1. State manager snapshot/revert - 2 days
2. TxPool impersonation - 1 day
3. JSON-RPC handlers (F - control subset) - 2 days
4. Integration tests - 1 day

---

### Milestone 4: "Memory Client" (3 days)
**Goal**: Batteries-included factory + viem compat

**Deliverables**:
1. `createMemoryClient()` factory
2. viem client extension
3. Auto-mining coordination
4. Custom actions (mine, setBalance, etc.)

**Acceptance Criteria**:
- ✅ All TEVM quickstart examples work with Voltaire client
- ✅ viem public actions work
- ✅ Auto-mining triggers after tx

**Package Order**:
1. Memory client (G) - 2 days
2. viem integration - 1 day

---

### Milestone 5: "TEVM Conformance" (1 week)
**Goal**: Pass TEVM parity test suite

**Deliverables**:
1. Conformance harness (run same operations on TEVM + Voltaire)
2. Method matrix (all documented methods)
3. Bug fixes for divergences
4. Performance benchmarks

**Acceptance Criteria**:
- ✅ All documented RPC methods return same responses
- ✅ All TEVM examples pass with Voltaire
- ✅ Fork mode deterministic (same inputs → same outputs)

**Approach**:
1. Build harness: `runBoth(method, params) → { tevm, voltaire, diff }`
2. Generate matrix of all methods
3. Fix divergences iteratively
4. Document intentional differences

---

## Technical Decisions & Rationale

### Decision 1: Blocking Async vs Yield/Resume
**Choice**: Start with blocking async (Phase 1)

**Rationale**:
- TEVM uses blocking async throughout - proven to work
- Simpler implementation (no checkpoint/resume complexity)
- Performance sufficient for local dev (not production)
- Can optimize to yield/resume later if needed
- Async host wrapper keeps Zig side synchronous

**Trade-off**: WASM execution blocks on fork fetch, but latency is acceptable for dev use

---

### Decision 2: VM Deep Copy vs Shared State
**Choice**: Deep copy VM on mine (matches TEVM)

**Rationale**:
- Prevents state root corruption during concurrent operations
- Simple isolation boundary
- Enables snapshot/revert at node level
- Performance cost acceptable (mining not hot path)

**Trade-off**: Memory overhead of copied state, but mining frequency is low

---

### Decision 3: Dual Cache vs Single Cache
**Choice**: Dual cache (normal + fork)

**Rationale**:
- Normal cache = source of truth after any modification
- Fork cache = passive storage of fetched state
- Enables "clear fork cache" without losing local changes
- Matches TEVM's proven architecture

**Alternative rejected**: Single cache with "dirty" flags (more complex invalidation logic)

---

### Decision 4: Zig Core vs TS Core
**Choice**: Zig for performance-critical paths (state manager, txpool, blockchain)

**Rationale**:
- State caching benefits from native data structures
- TxPool sorting (heap) is hot path
- Blockchain validation (RLP decode, hash) CPU-bound
- Can reuse existing Voltaire Zig primitives
- TS wrappers provide idiomatic API

**Trade-off**: More FFI boundaries, but perf gains justify it

---

### Decision 5: No State Trie (Pragmatic Mode)
**Choice**: Skip Merkle Patricia Trie, use hash maps

**Rationale**:
- MPT only needed for state root proofs
- Dev node doesn't need cryptographic state commitments
- Faster reads/writes
- Can add MPT support later if needed

**Trade-off**: Can't generate state proofs, but dev tooling doesn't need them

---

## Risk Mitigation

### Risk 1: EVM Call/Create Complexity
**Mitigation**:
- Start with simple test cases (single-level calls)
- Reference ethereumjs-evm implementation
- Comprehensive gas accounting tests
- Fuzz testing for edge cases

### Risk 2: Fork State Cache Invalidation
**Mitigation**:
- Clear separation: fork cache never modified
- Normal cache always checked first
- Explicit "clear fork cache" operation
- Tests for cache consistency

### Risk 3: Mining State Root Corruption
**Mitigation**:
- Deep copy VM before mining
- Checkpoint/commit cycle per block
- Validation: state root matches expected
- Tests for concurrent operations

### Risk 4: JSON-RPC Method Explosion
**Mitigation**:
- Prioritize minimal parity set first
- Use conformance harness to track coverage
- Implement "not implemented" stubs early
- Document intentional omissions

### Risk 5: Performance Regression vs TEVM
**Mitigation**:
- Benchmark: fork cache hit rate, mining time, tx throughput
- Profile: identify hot paths
- Optimize iteratively based on data
- Accept 2x slower if correctness verified (can optimize post-parity)

---

## Testing Strategy

### Unit Tests (Per Package)
- State manager: cache ops, checkpoint/revert, fork fetch
- TxPool: add/remove, replacement, sorting
- Blockchain: put/get, head tracking
- Receipts: save/get, bloom generation
- Node: mining pipeline, snapshot/revert
- JSON-RPC: handler dispatch, error mapping

### Integration Tests (Cross-Package)
- Fork read: Mainnet → balance/code/storage
- Fork write: Mainnet → tx → mine → receipt
- Snapshot/revert: complex state changes
- Impersonation: unsigned tx mining
- Auto-mining: tx triggers mine

### Conformance Tests (TEVM Parity)
- Method matrix: all RPC methods
- Response comparison: TEVM vs Voltaire
- Example flows: all TEVM quickstart examples
- Fork determinism: same inputs → same outputs

### Performance Tests
- Fork cache: hit rate, fetch latency
- Mining: 100 tx block time
- TxPool: 10k tx sorting time
- State queries: cold vs warm

---

## Definition of Done (TEVM Sunset Criteria)

✅ **Functional Parity**:
- All documented RPC methods work
- Fork mode stable (Mainnet, Optimism tested)
- Mining produces valid blocks + receipts
- Snapshot/revert correct

✅ **Conformance**:
- TEVM parity harness: 100% pass rate
- All TEVM examples work unchanged

✅ **Performance**:
- Fork read: <100ms (cache hit <1ms)
- Mining: <500ms for 100 tx block
- Memory: <500MB for 10k tx pool

✅ **Documentation**:
- Migration guide: TEVM → Voltaire
- API docs: all public methods
- Examples: fork, mine, snapshot

✅ **Stability**:
- No crashes in 1000-operation stress test
- Memory leaks: none detected
- Fork fetch retries: exponential backoff works

---

## Critical File Paths

### New Packages (To Create)
```
src/state-manager/
  StateCache.zig
  ForkBackend.zig
  JournaledState.zig
  StateManager.zig
  StateManager/index.ts

src/txpool/
  TxPool.zig
  TxPoolObject.zig
  txsByPriceAndNonce.zig
  validation.zig
  TxPool/index.ts

src/blockchain/
  BlockStore.zig
  ForkBlockCache.zig
  validation.zig
  Blockchain.zig
  Blockchain/index.ts

src/receipts-manager/
  ReceiptStore.zig
  bloomFilter.zig
  ReceiptsManager.zig
  ReceiptsManager/index.ts

src/node/
  Node.zig
  NodeConfig.zig
  mining.zig
  Node/index.ts

src/jsonrpc/
  EIP1193Provider.ts
  JsonRpcServer.ts
  handlers/
    eth/
    anvil/
    tevm/
  errors.ts

src/memory-client/
  createMemoryClient.ts
  actions/
  decorators/
```

### Existing Files (To Extend)
```
src/evm/host.zig                 # Add call/create to vtable
src/evm/evm.zig                  # Integrate trace hooks
src/evm/Host/AsyncAdapter.ts     # NEW: TS async wrapper
src/primitives/BlockHeader/      # Add hash() + rlpEncode()
src/primitives/Receipt/          # Add toRlp() (TS)
src/receipts-manager/bloomFilter.zig  # NEW: Bloom algorithm
```

---

## Next Steps (Immediate Actions)

1. **Validate plan with user** - Get approval before implementation
2. **Create package stubs** - Empty Zig modules + TS wrappers
3. **Implement Milestone 1** - Fork read node (state manager + blockchain + minimal RPC)
4. **Build conformance harness** - TEVM parity test framework
5. **Iterate on feedback** - Adjust architecture based on real-world testing

---

## Open Questions for User

1. **Performance target**: Should we match TEVM speed, or is 2x slower acceptable initially?
2. **Method priority**: Are there specific RPC methods beyond the minimal set that are critical?
3. **Fork endpoints**: Should we support multiple fork transports (HTTP, WS, IPC) or HTTP-only initially?
4. **Logging**: Use existing logger or integrate specific logging library?
5. **Plugin system**: How extensible should the node be for custom precompiles/hooks?

---

**End of Plan**
