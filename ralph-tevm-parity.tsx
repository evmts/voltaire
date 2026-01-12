import { Claude } from '@evmts/smithers'

export default (
  <Claude>
You are implementing Milestone 1 of the TEVM Parity Plan for Voltaire.

**CRITICAL**: First read these two files completely:
1. /Users/williamcory/voltaire/TEVM_PARITY_PLAN.md - Overall architecture and plan
2. /Users/williamcory/voltaire/MILESTONE-1-IMPLEMENTATION-GUIDE.md - Implementation templates and progress

**Goal**: Implement read-only fork functionality (state reads + block queries)

## Phase 1: Read and Understand

Read TEVM_PARITY_PLAN.md completely. Focus on:
- Architecture overview
- Package A (state-manager) requirements
- Package C (blockchain) requirements
- Package F (jsonrpc) minimal handlers
- Milestone 1 acceptance criteria

Create detailed todo list with all implementation tasks.

## Phase 2: Complete Missing Primitives

**Block Primitives**:
1. Implement BlockHeader.hash() - Keccak256(RLP.encode(header))
2. Implement BlockHeader.rlpEncode() using existing RLP encoder
3. Implement Block.rlpEncode() for header + body

**Bloom Filter**:
1. Create src/primitives/Bloom/compute.zig with EIP-234 algorithm
2. Test against known Mainnet receipts

Use Voltaire patterns: Zig implementation + TS wrapper, colocated files, data-first branded types.

## Phase 3: Implement State Manager (Package A)

Create src/state-manager/ package:

**StateCache.zig**: Per-type caching with checkpoint/revert
- AccountCache, StorageCache, ContractCache
- Operations: get, put, has, delete, clear
- Journaling: checkpoint() pushes state, revert() pops and discards, commit() pops and keeps

**ForkBackend.zig**: Remote state fetcher
- RpcClient vtable for transport abstraction
- LRU cache for fetched accounts/storage/code
- Methods: fetchAccount, fetchStorage, fetchCode

**JournaledState.zig**: Dual-cache orchestrator
- Normal cache (source of truth after modifications)
- Fork cache (passive storage of fetched state)
- Read flow: normal cache → fork cache → remote fetch → cache both
- Write flow: normal cache only

**StateManager.zig**: Main API
- Operations: getBalance, getNonce, getCode, getStorage
- Mutations: setBalance, setNonce, setCode, setStorage
- Checkpointing: checkpoint, revert, commit
- Snapshots: snapshot() returns ID, revertToSnapshot(id)
- Cache management: clearCaches, clearForkCache

**StateManager/index.ts**: TypeScript wrapper
- Async interface wrapping synchronous Zig calls
- Branded Voltaire types at boundaries
- Build target in build.zig for native module

Write comprehensive tests: unit (cache ops, checkpoint cycles) + integration (fork fetch with mock RPC).

## Phase 4: Implement Blockchain (Package C)

Create src/blockchain/ package:

**BlockStore.zig**: Local block storage
- Maps: blocksByHash, blocksByNumber
- canonicalHead tracking
- Operations: putBlock, getBlock, getBlockByNumber, getCanonicalHead, setCanonicalHead

**ForkBlockCache.zig**: Remote block cache
- RpcClient vtable for getBlockByNumber/Hash
- LRU cache for fetched blocks
- forkBlockNumber threshold

**Blockchain.zig**: Main orchestrator
- Read logic: number > forkBlock → local store, else → fork cache (fetch on miss)
- Operations: putBlock, getBlockByHash, getBlockByNumber, getCanonicalHeadBlock, getCurrentBlockNumber

**Blockchain/index.ts**: TypeScript wrapper
- Async interface
- Branded types

Write tests: unit (store ops) + integration (fork + local blocks).

## Phase 5: Implement JSON-RPC Handlers (Package F - Minimal)

Create src/jsonrpc/ package:

**Infrastructure**:
- types.ts: JsonRpcRequest, JsonRpcResponse, JsonRpcError
- errors.ts: Standard error codes (PARSE_ERROR, METHOD_NOT_FOUND, etc.)
- EIP1193Provider.ts: Provider interface with request method, params
- JsonRpcServer.ts: Dispatcher with handler map

**Handlers** in handlers/eth/:
1. blockNumber.ts: Returns current block number as hex
2. getBalance.ts: Returns account balance as hex
3. getCode.ts: Returns contract bytecode as hex
4. getStorageAt.ts: Returns storage slot value as hex (padded 64 chars)
5. getTransactionCount.ts: Returns nonce as hex
6. getBlockByNumber.ts: Returns block object (handle latest, earliest, hex number)
7. getBlockByHash.ts: Returns block object

Each handler:
- Validates params
- Calls StateManager/Blockchain
- Formats response per JSON-RPC spec
- Returns hex strings with 0x prefix

Write tests: handler unit tests + integration tests.

## Phase 6: Integration Testing

Create tests/integration/fork-read.test.ts:

Test against real Mainnet fork (Alchemy RPC):
- Read Vitalik's balance (0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045)
- Read USDC contract code (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
- Read USDC storage (slot 1 = total supply)
- Read blocks (latest + historical like 18000000)
- JSON-RPC queries (eth_blockNumber, eth_getBalance, eth_getCode)

Setup:
- .env with ALCHEMY_MAINNET_RPC
- .env.example template
- Update .gitignore

Create scripts/verify-milestone-1.ts:
- Run all 5 acceptance criteria tests
- Print pass/fail for each
- Exit with status code

## Phase 7: Documentation

Create docs/milestones/milestone-1-report.md:
- Deliverables checklist
- Files created
- Tests written
- Acceptance criteria status
- Performance metrics
- Issues encountered
- Next steps

Create examples/fork-read-node.ts:
- Working example forking Mainnet
- Read balance, code, storage, blocks
- Add script to package.json

## Phase 8: Validation and Commit

Run validation:
1. zig build test - Zig tests pass
2. pnpm test:run - TS tests pass
3. zig build check - Format, lint, typecheck pass
4. pnpm tsx scripts/verify-milestone-1.ts - All acceptance criteria pass
5. pnpm example:fork - Example runs successfully

Create commit with message describing Milestone 1 completion, listing all files created, acceptance criteria met.

## Phase 9: Summary

Print completion summary:
- Milestone 1 deliverables complete
- Files created, LOC, test coverage
- All acceptance criteria met
- Ready for Milestone 2 (Write + Mine)

---

**Guidelines**:
- Follow Voltaire patterns: Zig core + TS wrapper, colocated files, branded types
- Use existing primitives (RLP, Keccak, Address, Block, etc.)
- Write comprehensive tests (unit + integration)
- No console.log in library code (throw errors instead)
- Brief, direct communication
- Run zig build and zig build test frequently (TDD)
  </Claude>
)
