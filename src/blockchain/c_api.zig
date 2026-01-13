//! Blockchain C API - STUB VERSION
//!
//! NOTE: This is a stub implementation. Full FFI requires major redesign:
//! - RpcVTable expects internal Zig types, not extern-compatible types
//! - Block operations need all fields as extern-compatible types
//! - Current implementation has architectural issues preventing compilation
//!
//! To implement properly:
//! 1. Define extern-compatible wrapper types (all arrays/pointers, no structs)
//! 2. Create adapter layer between internal types and FFI boundary
//! 3. Handle calling convention mismatches (internal uses auto, FFI needs .c)

const std = @import("std");
const primitives = @import("primitives");
const blockchain_mod = @import("blockchain");

const Blockchain = blockchain_mod.Blockchain;

// ============================================================================
// Error Codes
// ============================================================================

pub const BLOCKCHAIN_SUCCESS: c_int = 0;
pub const BLOCKCHAIN_ERROR_NOT_IMPLEMENTED: c_int = -999;

// ============================================================================
// Opaque Handle Types
// ============================================================================

pub const BlockchainHandle = *anyopaque;

// ============================================================================
// Global Allocator
// ============================================================================

var gpa_instance: std.heap.GeneralPurposeAllocator(.{}) = undefined;
var gpa_initialized = false;

fn getAllocator() std.mem.Allocator {
    if (!gpa_initialized) {
        gpa_instance = std.heap.GeneralPurposeAllocator(.{}){};
        gpa_initialized = true;
    }
    return gpa_instance.allocator();
}

// ============================================================================
// Blockchain Lifecycle (Minimal Stubs)
// ============================================================================

/// Create Blockchain without fork cache
export fn blockchain_create() callconv(.c) ?BlockchainHandle {
    const allocator = getAllocator();
    const chain = allocator.create(Blockchain) catch return null;
    chain.* = Blockchain.init(allocator, null) catch {
        allocator.destroy(chain);
        return null;
    };
    return @ptrCast(chain);
}

/// Destroy Blockchain
export fn blockchain_destroy(handle: BlockchainHandle) callconv(.c) void {
    const allocator = getAllocator();
    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    chain.deinit();
    allocator.destroy(chain);
}

/// Get local block count
export fn blockchain_local_block_count(handle: BlockchainHandle) callconv(.c) usize {
    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    return chain.localBlockCount();
}

/// Get canonical chain length
export fn blockchain_canonical_chain_length(handle: BlockchainHandle) callconv(.c) usize {
    const chain: *Blockchain = @ptrCast(@alignCast(handle));
    return chain.canonicalChainLength();
}
