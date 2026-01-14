//! State Manager - Fork-capable state with overlay journaling
//!
//! This module provides state management for the Ethereum dev node with:
//! - Fork-capable state fetching from remote chains
//! - Dual-cache strategy (normal + fork)
//! - Checkpoint/revert/commit journaling
//! - Snapshot support for testing
//!
//! ## Components
//! - StateCache: Per-type caching (accounts, storage, contracts) with journaling
//! - ForkBackend: Remote state fetcher with async request/continue bridge
//! - JournaledState: Dual-cache orchestrator
//! - StateManager: Main public API
//!
//! ## Usage
//! ```zig
//! const state_manager = @import("state-manager");
//!
//! var manager = try state_manager.StateManager.init(allocator, null);
//! defer manager.deinit();
//!
//! const balance = try manager.getBalance(address);
//! try manager.setBalance(address, new_balance);
//!
//! // Checkpoint/revert
//! try manager.checkpoint();
//! try manager.setBalance(address, balance + 1000);
//! manager.revert(); // Rolls back to checkpoint
//! ```

const StateCache = @import("StateCache.zig");
const ForkBackendMod = @import("ForkBackend.zig");
const JournaledStateMod = @import("JournaledState.zig");
const StateManagerMod = @import("StateManager.zig");

// Re-export StateCache types
pub const AccountCache = StateCache.AccountCache;
pub const StorageCache = StateCache.StorageCache;
pub const ContractCache = StateCache.ContractCache;
pub const AccountState = StateCache.AccountState;
pub const StorageKey = StateCache.StorageKey;

// Re-export ForkBackend
pub const ForkBackend = ForkBackendMod.ForkBackend;
pub const CacheConfig = ForkBackendMod.CacheConfig;
pub const Transport = ForkBackendMod.Transport;
pub const RpcClient = ForkBackendMod.RpcClient;

// Re-export JournaledState
pub const JournaledState = JournaledStateMod.JournaledState;

// Re-export StateManager
pub const StateManager = StateManagerMod.StateManager;

test {
    // Run all tests in submodules
    _ = StateCache;
    _ = ForkBackendMod;
    _ = JournaledStateMod;
    _ = StateManagerMod;
}
