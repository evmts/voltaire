//! Example demonstrating the Rust-like API for Guillotine EVM
//!
//! This example shows how to use the Rust-inspired API patterns including:
//! - Builder pattern for EVM configuration
//! - Result types for error handling
//! - Transaction execution methods
//! - State inspection

const std = @import("std");
const rust_api = @import("../src/rust_api.zig");
const primitives = @import("primitives");
const Database = @import("../src/storage/database.zig").Database;
const Account = @import("../src/storage/database_interface_account.zig").Account;
const EvmConfig = @import("../src/evm_config.zig").EvmConfig;
const Hardfork = @import("../src/eips_and_hardforks/hardfork.zig").Hardfork;
const BlockInfo = @import("../src/block/block_info.zig").DefaultBlockInfo;
const TransactionContext = @import("../src/block/transaction_context.zig").TransactionContext;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Initialize database
    var db = Database.init(allocator);
    defer db.deinit();

    // Set up test accounts
    const alice = try primitives.Address.fromHex("0x1000000000000000000000000000000000000001");
    const bob = try primitives.Address.fromHex("0x2000000000000000000000000000000000000002");

    // Fund Alice's account
    try db.set_account(alice.bytes, Account{
        .balance = 10_000_000_000_000_000_000, // 10 ETH
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });

    // Create block info
    const block_info = BlockInfo{
        .number = 17_000_000,
        .timestamp = 1_700_000_000,
        .difficulty = 0,
        .gas_limit = 30_000_000,
        .coinbase = try primitives.Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
        .base_fee = 1_000_000_000, // 1 gwei
        .prev_randao = [_]u8{0x42} ** 32,
    };

    // Build EVM with Rust-like API
    const evm = try rust_api.EvmBuilder(EvmConfig{})
        .new(allocator, &db)
        .with_hardfork(Hardfork.CANCUN)
        .with_block(block_info)
        .with_gas_price(2_000_000_000) // 2 gwei
        .with_origin(alice)
        .build_mainnet();
    defer evm.deinit();

    std.debug.print("=== Rust-like API Example ===\n\n", .{});

    // Example 1: Simple value transfer
    {
        std.debug.print("1. Simple Value Transfer\n", .{});
        std.debug.print("   Alice balance before: {} wei\n", .{evm.get_account(alice).?.balance});
        std.debug.print("   Bob balance before: {} wei\n", .{evm.get_account(bob) orelse Account.zero()}.balance);

        const tx = rust_api.Transaction{
            .from = alice,
            .to = bob,
            .value = 1_000_000_000_000_000_000, // 1 ETH
            .data = &.{},
            .gas_limit = 21_000,
            .gas_price = 2_000_000_000,
            .nonce = 0,
        };

        const result = evm.transact(tx);
        if (result.is_ok()) {
            const exec = result.unwrap();
            std.debug.print("   Transaction successful!\n", .{});
            std.debug.print("   Gas used: {}\n", .{exec.gas_used});
            std.debug.print("   Status: {s}\n", .{@tagName(exec.status)});
        } else {
            std.debug.print("   Transaction failed: {}\n", .{result.unwrap_err()});
        }

        std.debug.print("   Alice balance after: {} wei\n", .{evm.get_account(alice).?.balance});
        std.debug.print("   Bob balance after: {} wei\n\n", .{evm.get_account(bob).?.balance});
    }

    // Example 2: Contract creation
    {
        std.debug.print("2. Contract Creation\n", .{});
        
        // Simple contract bytecode that stores 42 and returns it
        // PUSH1 0x2A (42) PUSH1 0x00 SSTORE (store 42 at slot 0)
        // PUSH1 0x2A PUSH1 0x00 RETURN (return 42)
        const init_code = [_]u8{
            0x60, 0x2A, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0x55,       // SSTORE
            0x60, 0x2A, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        };

        const create_tx = rust_api.Transaction{
            .from = alice,
            .to = null, // null for contract creation
            .value = 0,
            .data = &init_code,
            .gas_limit = 100_000,
            .gas_price = 2_000_000_000,
            .nonce = 1,
        };

        const result = evm.transact(create_tx);
        if (result.is_ok()) {
            const exec = result.unwrap();
            std.debug.print("   Contract creation successful!\n", .{});
            std.debug.print("   Gas used: {}\n", .{exec.gas_used});
            if (exec.created_address) |addr| {
                std.debug.print("   Created at: 0x{x}\n", .{addr.bytes});
            }
        } else {
            std.debug.print("   Contract creation failed\n", .{});
        }
        std.debug.print("\n", .{});
    }

    // Example 3: Simulation (doesn't commit state)
    {
        std.debug.print("3. Transaction Simulation\n", .{});
        
        const alice_balance_before = evm.get_account(alice).?.balance;
        std.debug.print("   Alice balance before simulation: {} wei\n", .{alice_balance_before});

        const sim_tx = rust_api.Transaction{
            .from = alice,
            .to = bob,
            .value = 5_000_000_000_000_000_000, // 5 ETH
            .data = &.{},
            .gas_limit = 21_000,
            .gas_price = 2_000_000_000,
            .nonce = 2,
        };

        const result = evm.simulate(sim_tx);
        if (result.is_ok()) {
            const exec = result.unwrap();
            std.debug.print("   Simulation successful!\n", .{});
            std.debug.print("   Would use {} gas\n", .{exec.gas_used});
            std.debug.print("   Status: {s}\n", .{@tagName(exec.status)});
        }

        const alice_balance_after = evm.get_account(alice).?.balance;
        std.debug.print("   Alice balance after simulation: {} wei\n", .{alice_balance_after});
        std.debug.print("   Balance unchanged: {}\n\n", .{alice_balance_before == alice_balance_after});
    }

    // Example 4: Using Result type's map function
    {
        std.debug.print("4. Result Type Operations\n", .{});
        
        const ok_result = rust_api.Result(i32, []const u8){ .ok = 42 };
        const doubled = ok_result.map(i32, struct {
            fn double(x: i32) i32 {
                return x * 2;
            }
        }.double);
        
        std.debug.print("   Original value: {}\n", .{ok_result.unwrap()});
        std.debug.print("   Mapped value: {}\n\n", .{doubled.unwrap()});
    }

    std.debug.print("=== Example Complete ===\n", .{});
}

// Test the example
test "rust api example compiles" {
    // This test ensures the example compiles correctly
    // It doesn't run main() to avoid side effects in tests
    _ = main;
    try std.testing.expect(true);
}