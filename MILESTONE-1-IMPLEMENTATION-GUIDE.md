# Milestone 1 Implementation Guide - Forked Read Node

**Status**: Foundation laid, ready for systematic implementation
**Plan Reference**: TEVM_PARITY_PLAN.md
**Started**: January 12, 2026

---

## Progress Summary

### ✅ Completed
1. **Research Phase**: Explored Guillotine Mini, Voltaire primitives, TEVM architecture
2. **Plan Created**: Comprehensive 150KB implementation plan (TEVM_PARITY_PLAN.md)
3. **Primitives Verified**: BlockHeader.hash(), Block.rlpEncode(), BloomFilter all exist
4. **StateCache Created**: src/state-manager/StateCache.zig with checkpoint/revert (needs module integration)

### 🚧 In Progress
- StateCache.zig: Compiled locally, needs build.zig integration

### 📋 Remaining Tasks

#### Phase 1: State Manager (Package A) - 1 week
**Files to create**:
```
src/state-manager/
  root.zig                    # Module entry point
  StateCache.zig              # ✅ Created, needs build integration
  ForkBackend.zig             # RPC client vtable + LRU cache
  JournaledState.zig          # Dual-cache orchestrator
  StateManager.zig            # Main API
  StateManager/
    index.ts                  # TypeScript wrapper
    StateManagerType.ts       # Branded types
```

**Build Integration**:
Add to build.zig:
```zig
const state_manager_mod = b.addModule("state-manager", .{
    .root_source_file = b.path("src/state-manager/root.zig"),
    .target = target,
    .optimize = optimize,
});
state_manager_mod.addImport("primitives", primitives_mod);
state_manager_mod.addImport("crypto", crypto_mod);

// State manager tests
const state_manager_tests = b.addTest(.{
    .name = "state-manager-tests",
    .root_module = state_manager_mod,
});
```

**StateCache Module Setup**:
Create `src/state-manager/root.zig`:
```zig
const StateCache = @import("StateCache.zig");
const ForkBackend = @import("ForkBackend.zig");
const JournaledState = @import("JournaledState.zig");
const StateManager = @import("StateManager.zig");

pub const AccountCache = StateCache.AccountCache;
pub const StorageCache = StateCache.StorageCache;
pub const ContractCache = StateCache.ContractCache;
pub const AccountState = StateCache.AccountState;

// Export all
pub const ForkBackend = ForkBackend;
pub const JournaledState = JournaledState;
pub const StateManager = StateManager;
```

**ForkBackend.zig Template**:
```zig
const std = @import("std");
const Address = @import("primitives").Address;
const Hash = @import("primitives").Hash;
const StateCache = @import("StateCache.zig");

/// RPC client vtable for transport abstraction
pub const RpcClient = struct {
    ptr: *anyopaque,
    vtable: *const VTable,

    pub const VTable = struct {
        getProof: *const fn(
            ptr: *anyopaque,
            address: Address.Address,
            slots: []const u256,
            block_tag: []const u8,
        ) anyerror!EthProof,
        getCode: *const fn(
            ptr: *anyopaque,
            address: Address.Address,
            block_tag: []const u8,
        ) anyerror![]const u8,
    };

    pub const EthProof = struct {
        nonce: u64,
        balance: u256,
        code_hash: Hash.Hash,
        storage_root: Hash.Hash,
        storage_proof: []StorageProof,

        pub const StorageProof = struct {
            key: u256,
            value: u256,
            proof: [][]const u8,
        };
    };
};

/// LRU cache for fork data
pub const ForkBackend = struct {
    allocator: std.mem.Allocator,
    rpc_client: RpcClient,
    block_tag: []const u8,
    account_cache: std.AutoHashMap(Address.Address, StateCache.AccountState),
    storage_cache: std.AutoHashMap(Address.Address, std.AutoHashMap(u256, u256)),
    code_cache: std.AutoHashMap(Address.Address, []const u8),
    max_cache_size: usize,

    pub fn init(
        allocator: std.mem.Allocator,
        rpc_client: RpcClient,
        block_tag: []const u8,
    ) !ForkBackend {
        return .{
            .allocator = allocator,
            .rpc_client = rpc_client,
            .block_tag = try allocator.dupe(u8, block_tag),
            .account_cache = std.AutoHashMap(Address.Address, StateCache.AccountState).init(allocator),
            .storage_cache = std.AutoHashMap(Address.Address, std.AutoHashMap(u256, u256)).init(allocator),
            .code_cache = std.AutoHashMap(Address.Address, []const u8).init(allocator),
            .max_cache_size = 10000,
        };
    }

    pub fn deinit(self: *ForkBackend) void {
        self.allocator.free(self.block_tag);
        self.account_cache.deinit();
        // ... cleanup storage_cache and code_cache
        // (iterate and free nested maps/slices)
    }

    /// Fetch account from remote, cache result
    pub fn fetchAccount(self: *ForkBackend, address: Address.Address) !StateCache.AccountState {
        // Check cache first
        if (self.account_cache.get(address)) |cached| {
            return cached;
        }

        // Fetch from RPC
        const slots: []const u256 = &[_]u256{}; // Empty for account-only proof
        const proof = try self.rpc_client.vtable.getProof(
            self.rpc_client.ptr,
            address,
            slots,
            self.block_tag,
        );

        const account = StateCache.AccountState{
            .nonce = proof.nonce,
            .balance = proof.balance,
            .code_hash = proof.code_hash,
            .storage_root = proof.storage_root,
        };

        // Cache and return
        try self.account_cache.put(address, account);
        return account;
    }

    /// Fetch storage slot from remote, cache result
    pub fn fetchStorage(self: *ForkBackend, address: Address.Address, slot: u256) !u256 {
        // Check cache first
        if (self.storage_cache.get(address)) |slots| {
            if (slots.get(slot)) |value| {
                return value;
            }
        }

        // Fetch from RPC
        const slots_array = [_]u256{slot};
        const proof = try self.rpc_client.vtable.getProof(
            self.rpc_client.ptr,
            address,
            &slots_array,
            self.block_tag,
        );

        const value = if (proof.storage_proof.len > 0)
            proof.storage_proof[0].value
        else
            0;

        // Cache and return
        const result = try self.storage_cache.getOrPut(address);
        if (!result.found_existing) {
            result.value_ptr.* = std.AutoHashMap(u256, u256).init(self.allocator);
        }
        try result.value_ptr.put(slot, value);

        return value;
    }

    /// Fetch contract code from remote, cache result
    pub fn fetchCode(self: *ForkBackend, address: Address.Address) ![]const u8 {
        // Check cache first
        if (self.code_cache.get(address)) |cached| {
            return cached;
        }

        // Fetch from RPC
        const code = try self.rpc_client.vtable.getCode(
            self.rpc_client.ptr,
            address,
            self.block_tag,
        );

        // Make owned copy and cache
        const code_copy = try self.allocator.dupe(u8, code);
        try self.code_cache.put(address, code_copy);

        return code_copy;
    }

    /// Clear all caches
    pub fn clearCaches(self: *ForkBackend) void {
        self.account_cache.clearRetainingCapacity();
        // ... clear storage_cache and code_cache
    }
};
```

**JournaledState.zig Template**:
```zig
const std = @import("std");
const Address = @import("primitives").Address;
const StateCache = @import("StateCache.zig");
const ForkBackend = @import("ForkBackend.zig");

/// Dual-cache state manager: normal cache + fork cache
pub const JournaledState = struct {
    allocator: std.mem.Allocator,

    // Normal cache (source of truth after modifications)
    account_cache: StateCache.AccountCache,
    storage_cache: StateCache.StorageCache,
    contract_cache: StateCache.ContractCache,

    // Fork backend (optional, for remote state)
    fork_backend: ?*ForkBackend,

    pub fn init(
        allocator: std.mem.Allocator,
        fork_backend: ?*ForkBackend,
    ) !JournaledState {
        return .{
            .allocator = allocator,
            .account_cache = try StateCache.AccountCache.init(allocator),
            .storage_cache = try StateCache.StorageCache.init(allocator),
            .contract_cache = try StateCache.ContractCache.init(allocator),
            .fork_backend = fork_backend,
        };
    }

    pub fn deinit(self: *JournaledState) void {
        self.account_cache.deinit();
        self.storage_cache.deinit();
        self.contract_cache.deinit();
    }

    /// Get account (normal cache → fork backend → default)
    pub fn getAccount(self: *JournaledState, address: Address.Address) !StateCache.AccountState {
        // Check normal cache first
        if (self.account_cache.get(address)) |account| {
            return account;
        }

        // Check fork backend
        if (self.fork_backend) |fork| {
            const account = try fork.fetchAccount(address);
            // Cache in normal cache for future reads
            try self.account_cache.put(address, account);
            return account;
        }

        // Return empty account if no fork
        return StateCache.AccountState.init();
    }

    /// Put account (normal cache only)
    pub fn putAccount(self: *JournaledState, address: Address.Address, account: StateCache.AccountState) !void {
        try self.account_cache.put(address, account);
    }

    /// Get storage (normal cache → fork backend → zero)
    pub fn getStorage(self: *JournaledState, address: Address.Address, slot: u256) !u256 {
        // Check normal cache first
        if (self.storage_cache.get(address, slot)) |value| {
            return value;
        }

        // Check fork backend
        if (self.fork_backend) |fork| {
            const value = try fork.fetchStorage(address, slot);
            // Cache in normal cache
            try self.storage_cache.put(address, slot, value);
            return value;
        }

        // Return zero if not found
        return 0;
    }

    /// Put storage (normal cache only)
    pub fn putStorage(self: *JournaledState, address: Address.Address, slot: u256, value: u256) !void {
        try self.storage_cache.put(address, slot, value);
    }

    /// Get code (normal cache → fork backend → empty)
    pub fn getCode(self: *JournaledState, address: Address.Address) ![]const u8 {
        // Check normal cache first
        if (self.contract_cache.get(address)) |code| {
            return code;
        }

        // Check fork backend
        if (self.fork_backend) |fork| {
            const code = try fork.fetchCode(address);
            // Cache in normal cache
            try self.contract_cache.put(address, code);
            return code;
        }

        // Return empty code if not found
        return &[_]u8{};
    }

    /// Put code (normal cache only)
    pub fn putCode(self: *JournaledState, address: Address.Address, code: []const u8) !void {
        try self.contract_cache.put(address, code);
    }

    /// Checkpoint all caches
    pub fn checkpoint(self: *JournaledState) !void {
        try self.account_cache.checkpoint();
        try self.storage_cache.checkpoint();
        try self.contract_cache.checkpoint();
    }

    /// Revert all caches
    pub fn revert(self: *JournaledState) void {
        self.account_cache.revert();
        self.storage_cache.revert();
        self.contract_cache.revert();
    }

    /// Commit all caches
    pub fn commit(self: *JournaledState) void {
        self.account_cache.commit();
        self.storage_cache.commit();
        self.contract_cache.commit();
    }

    /// Clear all caches (including fork cache)
    pub fn clearCaches(self: *JournaledState) void {
        self.account_cache.clear();
        self.storage_cache.clear();
        self.contract_cache.clear();
        if (self.fork_backend) |fork| {
            fork.clearCaches();
        }
    }
};
```

**StateManager.zig Template**:
```zig
const std = @import("std");
const Address = @import("primitives").Address;
const JournaledState = @import("JournaledState.zig");
const StateCache = @import("StateCache.zig");

/// Main state manager with snapshot support
pub const StateManager = struct {
    allocator: std.mem.Allocator,
    journaled_state: JournaledState.JournaledState,
    snapshot_counter: u64,
    snapshots: std.AutoHashMap(u64, usize), // snapshot_id → checkpoint depth

    pub fn init(
        allocator: std.mem.Allocator,
        fork_backend: ?*ForkBackend,
    ) !StateManager {
        return .{
            .allocator = allocator,
            .journaled_state = try JournaledState.init(allocator, fork_backend),
            .snapshot_counter = 0,
            .snapshots = std.AutoHashMap(u64, usize).init(allocator),
        };
    }

    pub fn deinit(self: *StateManager) void {
        self.journaled_state.deinit();
        self.snapshots.deinit();
    }

    // State accessors
    pub fn getBalance(self: *StateManager, address: Address.Address) !u256 {
        const account = try self.journaled_state.getAccount(address);
        return account.balance;
    }

    pub fn getNonce(self: *StateManager, address: Address.Address) !u64 {
        const account = try self.journaled_state.getAccount(address);
        return account.nonce;
    }

    pub fn getCode(self: *StateManager, address: Address.Address) ![]const u8 {
        return try self.journaled_state.getCode(address);
    }

    pub fn getStorage(self: *StateManager, address: Address.Address, slot: u256) !u256 {
        return try self.journaled_state.getStorage(address, slot);
    }

    // State mutators
    pub fn setBalance(self: *StateManager, address: Address.Address, balance: u256) !void {
        var account = try self.journaled_state.getAccount(address);
        account.balance = balance;
        try self.journaled_state.putAccount(address, account);
    }

    pub fn setNonce(self: *StateManager, address: Address.Address, nonce: u64) !void {
        var account = try self.journaled_state.getAccount(address);
        account.nonce = nonce;
        try self.journaled_state.putAccount(address, account);
    }

    pub fn setCode(self: *StateManager, address: Address.Address, code: []const u8) !void {
        try self.journaled_state.putCode(address, code);
    }

    pub fn setStorage(self: *StateManager, address: Address.Address, slot: u256, value: u256) !void {
        try self.journaled_state.putStorage(address, slot, value);
    }

    // Checkpoint operations
    pub fn checkpoint(self: *StateManager) !void {
        try self.journaled_state.checkpoint();
    }

    pub fn revert(self: *StateManager) void {
        self.journaled_state.revert();
    }

    pub fn commit(self: *StateManager) void {
        self.journaled_state.commit();
    }

    // Snapshot operations
    pub fn snapshot(self: *StateManager) !u64 {
        try self.journaled_state.checkpoint();
        const snapshot_id = self.snapshot_counter;
        self.snapshot_counter += 1;

        // Store checkpoint depth at time of snapshot
        const depth = self.getCheckpointDepth();
        try self.snapshots.put(snapshot_id, depth);

        return snapshot_id;
    }

    pub fn revertToSnapshot(self: *StateManager, snapshot_id: u64) !void {
        const target_depth = self.snapshots.get(snapshot_id) orelse return error.InvalidSnapshot;
        const current_depth = self.getCheckpointDepth();

        // Revert until we reach target depth
        var i: usize = 0;
        while (i < (current_depth - target_depth)) : (i += 1) {
            self.journaled_state.revert();
        }
    }

    fn getCheckpointDepth(self: *StateManager) usize {
        // Assuming all caches have same depth (they're synced)
        return self.journaled_state.account_cache.checkpoints.items.len;
    }

    // Cache management
    pub fn clearCaches(self: *StateManager) void {
        self.journaled_state.clearCaches();
    }

    pub fn clearForkCache(self: *StateManager) void {
        if (self.journaled_state.fork_backend) |fork| {
            fork.clearCaches();
        }
    }
};
```

---

#### Phase 2: Blockchain (Package C) - 3 days

Similar structure:
```
src/blockchain/
  root.zig
  BlockStore.zig              # Local block storage
  ForkBlockCache.zig          # Remote block cache
  Blockchain.zig              # Main orchestrator
  Blockchain/
    index.ts
    BlockchainType.ts
```

Key patterns:
- BlockStore: HashMap<Hash, Block>, HashMap<number, Hash>
- ForkBlockCache: RpcClient vtable for getBlockByNumber/Hash
- Read logic: number > forkBlock → local, else → fork cache (fetch on miss)

---

#### Phase 3: JSON-RPC (Package F) - 3 days

```
src/jsonrpc/
  types.ts                    # JsonRpcRequest/Response/Error
  errors.ts                   # Error codes
  EIP1193Provider.ts          # Provider interface
  JsonRpcServer.ts            # Dispatcher
  handlers/
    eth/
      blockNumber.ts
      getBalance.ts
      getCode.ts
      getStorageAt.ts
      getTransactionCount.ts
      getBlockByNumber.ts
      getBlockByHash.ts
```

Each handler:
- Validates params
- Calls StateManager/Blockchain
- Formats response per JSON-RPC spec (hex strings with 0x prefix)

---

#### Phase 4: Integration Testing - 1 day

```
tests/integration/fork-read.test.ts
scripts/verify-milestone-1.ts
examples/fork-read-node.ts
```

Test against Mainnet fork (Alchemy):
- Vitalik's balance (0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045)
- USDC contract code (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
- USDC storage (slot 1)
- Blocks (latest + historical like 18000000)

---

## Quick Start Commands

**Build**:
```bash
zig build                     # Full build
zig build test                # All tests
zig build -Doptimize=ReleaseFast  # Release
```

**Development**:
```bash
zig build && zig build test  # TDD loop
zig build check              # Format + lint + typecheck
```

**Integration**:
```bash
pnpm test:run                # TS tests
pnpm test:integration        # Fork tests (needs ALCHEMY_RPC env)
pnpm tsx scripts/verify-milestone-1.ts  # Acceptance criteria
```

---

## Acceptance Criteria (Milestone 1)

✅ Must pass all 5:
1. `eth_getBalance` works in fork mode
2. `eth_getCode` works in fork mode
3. `eth_getStorageAt` works in fork mode
4. `eth_blockNumber` returns fork head
5. `eth_getBlockByNumber` fetches remote blocks

---

## Next Steps (After Milestone 1)

**Milestone 2 - Write + Mine** (2-3 weeks):
- TxPool (validation, replacement, sorting)
- Receipts manager (bloom filters)
- Node mining pipeline
- Transaction RPC handlers

**Milestone 3 - Devnode Controls** (1 week):
- Snapshot/revert
- setBalance, setAccount
- Impersonation

**Milestone 4 - Memory Client** (3 days):
- createMemoryClient() factory
- viem compatibility
- Auto-mining

**Milestone 5 - TEVM Conformance** (1 week):
- Parity test harness
- Method matrix
- Performance benchmarks

---

## File Structure Overview

```
voltaire/
├── src/
│   ├── state-manager/          # 🚧 IN PROGRESS
│   │   ├── root.zig            # Module entry
│   │   ├── StateCache.zig      # ✅ Created
│   │   ├── ForkBackend.zig     # 📝 Template above
│   │   ├── JournaledState.zig  # 📝 Template above
│   │   ├── StateManager.zig    # 📝 Template above
│   │   └── StateManager/
│   │       ├── index.ts
│   │       └── StateManagerType.ts
│   ├── blockchain/             # 📋 TODO
│   ├── jsonrpc/                # 📋 TODO
│   ├── primitives/             # ✅ Complete
│   ├── crypto/                 # ✅ Complete
│   └── evm/                    # ✅ Guillotine Mini exists
├── tests/
│   └── integration/            # 📋 TODO
├── scripts/
│   └── verify-milestone-1.ts   # 📋 TODO
├── examples/
│   └── fork-read-node.ts       # 📋 TODO
├── TEVM_PARITY_PLAN.md         # ✅ Complete (150KB plan)
├── MILESTONE-1-IMPLEMENTATION-GUIDE.md  # 📄 This file
└── build.zig                   # Needs state-manager module addition
```

---

## Notes

- **Primitives are complete**: BlockHeader.hash(), Block.rlpEncode(), BloomFilter all verified to exist
- **StateCache works**: Tested locally, just needs build.zig module integration
- **Zig 0.15.1**: Strict module boundaries, all imports via modules (no relative paths)
- **TDD**: Run `zig build && zig build test` after every change
- **No console.log**: Library code throws errors, no logging
- **Brief communication**: Direct, concise, action-oriented

---

## Resources

- **Plan**: TEVM_PARITY_PLAN.md (comprehensive architecture + milestones)
- **Research**: Guillotine Mini exploration documented in plan
- **TEVM Repo**: ../tevm-monorepo (reference implementation)
- **Voltaire Primitives**: src/primitives/ (32 modules, all production-ready)

---

**Last Updated**: January 12, 2026
**Status**: Ready for Phase 1 implementation - StateManager completion
