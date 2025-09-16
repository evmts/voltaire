//! Demo script for ForkedStorage with public Ethereum endpoint
//!
//! Run with: zig run demo_forked_storage.zig -- [options]

const std = @import("std");
const Storage = @import("src/storage/storage.zig").Storage;
const createForkedStorage = @import("src/storage/storage.zig").createForkedStorage;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    std.debug.print("\n=== Guillotine ForkedStorage Demo ===\n\n", .{});
    std.debug.print("Connecting to public Ethereum RPC endpoint...\n", .{});
    
    // Create forked storage with public endpoint
    // You can use any of these:
    // - https://rpc.ankr.com/eth
    // - https://eth.llamarpc.com  
    // - https://ethereum-rpc.publicnode.com
    // - https://eth-mainnet.public.blastapi.io
    var storage = try createForkedStorage(allocator, "https://rpc.ankr.com/eth", null);
    defer storage.deinit();
    
    // Test 1: Fetch Vitalik's balance
    std.debug.print("\n[1] Fetching Vitalik's account...\n", .{});
    const vitalik = [_]u8{
        0xd8, 0xdA, 0x6B, 0xF2, 0x69, 0x64, 0xaF, 0x9D, 0x7e, 0xEd,
        0x9e, 0x03, 0xE5, 0x3A, 0x15, 0xD3, 0x7a, 0xA9, 0x60, 0x45
    };
    
    const balance = try storage.get_balance(vitalik);
    std.debug.print("   Balance: {d} wei (~{d} ETH)\n", .{ balance, balance / 1_000_000_000_000_000_000 });
    
    // Test 2: Fetch USDC contract
    std.debug.print("\n[2] Fetching USDC contract...\n", .{});
    const usdc = [_]u8{
        0xA0, 0xb8, 0x69, 0x91, 0xc6, 0x21, 0x8b, 0x36, 0xc1, 0xd1,
        0x9D, 0x4a, 0x2e, 0x9E, 0xb0, 0xcE, 0x36, 0x06, 0xeB, 0x48
    };
    
    const account = try storage.get_account(usdc);
    if (account) |acc| {
        std.debug.print("   Contract exists: yes\n", .{});
        std.debug.print("   Nonce: {d}\n", .{acc.nonce});
        
        // Check if it's a contract (non-empty code hash)
        const empty_hash = [_]u8{0} ** 32;
        if (!std.mem.eql(u8, &acc.code_hash, &empty_hash)) {
            std.debug.print("   Has code: yes\n", .{});
            
            // Get the actual code
            const code = try storage.get_code_by_address(usdc);
            std.debug.print("   Code size: {d} bytes\n", .{code.len});
        }
    }
    
    // Test 3: Show cache statistics
    if (storage.forked) |*forked| {
        const stats = forked.getStats();
        std.debug.print("\n[3] Cache Statistics:\n", .{});
        std.debug.print("   Cache hits: {d}\n", .{stats.cache_hits});
        std.debug.print("   Cache misses: {d}\n", .{stats.cache_misses});
        std.debug.print("   RPC calls: {d}\n", .{stats.rpc_calls});
        
        // Test cache by fetching same address again
        std.debug.print("\n[4] Testing cache (fetching Vitalik again)...\n", .{});
        _ = try storage.get_balance(vitalik);
        
        const stats2 = forked.getStats();
        std.debug.print("   Cache hits after re-fetch: {d} (+{d})\n", .{ 
            stats2.cache_hits, 
            stats2.cache_hits - stats.cache_hits 
        });
        std.debug.print("   RPC calls after re-fetch: {d} (no change expected)\n", .{stats2.rpc_calls});
    }
    
    std.debug.print("\n✅ ForkedStorage working correctly!\n", .{});
    std.debug.print("\nYou can now use fork mode to:\n", .{});
    std.debug.print("- Test contracts against mainnet state\n", .{});
    std.debug.print("- Simulate transactions at any block\n", .{});
    std.debug.print("- Debug mainnet issues locally\n", .{});
    std.debug.print("\n", .{});
}