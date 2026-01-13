//! Blockchain module - Block storage and fork management
//!
//! Provides core blockchain functionality:
//! - BlockStore: Local storage with canonical chain tracking
//! - ForkBlockCache: Remote block fetching with caching
//! - Blockchain: Main orchestrator (local + remote)
//!
//! ## Usage
//! ```zig
//! const blockchain = @import("blockchain");
//!
//! // Create blockchain without fork
//! var chain = try blockchain.Blockchain.init(allocator, null);
//! defer chain.deinit();
//!
//! // Add blocks
//! try chain.putBlock(genesis);
//! try chain.setCanonicalHead(genesis.hash);
//!
//! // Read blocks
//! const block = chain.getBlockByNumber(0);
//! ```
//!
//! ## Fork Mode
//! ```zig
//! // Setup fork cache with RPC
//! const vtable = blockchain.ForkBlockCache.RpcVTable{
//!     .context = rpc_client,
//!     .fetch_block_by_number = fetchByNumber,
//!     .fetch_block_by_hash = fetchByHash,
//! };
//!
//! var fork_cache = try blockchain.ForkBlockCache.init(allocator, vtable, fork_block);
//! defer fork_cache.deinit();
//!
//! // Create blockchain with fork
//! var chain = try blockchain.Blockchain.init(allocator, &fork_cache);
//! defer chain.deinit();
//!
//! // Reads automatically fall through to fork cache
//! const block = chain.getBlockByNumber(12345);
//! ```

const ForkBlockCacheModule = @import("ForkBlockCache.zig");

pub const BlockStore = @import("BlockStore.zig").BlockStore;
pub const ForkBlockCache = ForkBlockCacheModule.ForkBlockCache;
pub const Blockchain = @import("Blockchain.zig").Blockchain;

// Re-export RpcVTable for convenience
pub const RpcVTable = ForkBlockCacheModule.RpcVTable;

test {
    @import("std").testing.refAllDecls(@This());
}
