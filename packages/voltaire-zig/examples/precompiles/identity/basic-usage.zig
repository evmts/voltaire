const std = @import("std");
const precompiles = @import("precompiles");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Identity Precompile Basic Usage ===\n\n", .{});

    // Example 1: Simple data copy
    std.debug.print("=== Example 1: Simple Data Copy ===\n", .{});
    const data = [_]u8{ 1, 2, 3, 4, 5, 6, 7, 8 };

    const words = (data.len + 31) / 32;
    const gas_needed: u64 = 15 + 3 * words;

    std.debug.print("Input: {any}\n", .{data});
    std.debug.print("Input length: {} bytes\n", .{data.len});
    std.debug.print("Gas needed: {}\n", .{gas_needed});

    const result = try precompiles.identity.execute(allocator, &data, gas_needed);
    defer result.deinit(allocator);

    std.debug.print("Output: {any}\n", .{result.output});
    std.debug.print("Gas used: {}\n", .{result.gas_used});

    // Verify output equals input
    const matches = std.mem.eql(u8, result.output, &data);
    std.debug.print("Output equals input: {s}\n", .{if (matches) "✓ Yes" else "✗ No"});

    // Example 2: Empty input
    std.debug.print("\n=== Example 2: Empty Input ===\n", .{});
    const empty = "";
    const empty_gas: u64 = 15; // Base cost only

    const empty_result = try precompiles.identity.execute(allocator, empty, empty_gas);
    defer empty_result.deinit(allocator);

    std.debug.print("Input length: 0\n", .{});
    std.debug.print("Gas used: {}\n", .{empty_result.gas_used});
    std.debug.print("Output length: {}\n", .{empty_result.output.len});

    // Example 3: Gas costs by input size
    std.debug.print("\n=== Example 3: Gas Costs by Input Size ===\n", .{});
    const sizes = [_]usize{ 0, 1, 32, 33, 64, 100, 1000, 10000 };

    for (sizes) |size| {
        const w = (size + 31) / 32;
        const gas: u64 = 15 + 3 * w;
        const per_byte: f64 = if (size > 0) @as(f64, @floatFromInt(gas)) / @as(f64, @floatFromInt(size)) else 0.0;

        std.debug.print("{d:5} bytes: {d:4} gas ({d:3} words, ~{d:.4} gas/byte)\n", .{ size, gas, w, per_byte });
    }

    // Example 4: Large data copy
    std.debug.print("\n=== Example 4: Large Data Copy ===\n", .{});
    var large_data: [1024]u8 = undefined;
    crypto.getRandomValues(&large_data);

    const large_words = (large_data.len + 31) / 32;
    const large_gas: u64 = 15 + 3 * large_words;

    std.debug.print("Input size: {} bytes\n", .{large_data.len});
    std.debug.print("Gas needed: {}\n", .{large_gas});

    const large_result = try precompiles.identity.execute(allocator, &large_data, large_gas);
    defer large_result.deinit(allocator);

    const large_matches = std.mem.eql(u8, large_result.output, &large_data);
    std.debug.print("Output matches input: {s}\n", .{if (large_matches) "✓ Yes" else "✗ No"});
    std.debug.print("Gas used: {}\n", .{large_result.gas_used});

    // Example 5: Comparison with other precompiles
    std.debug.print("\n=== Example 5: Gas Comparison (1000 bytes) ===\n", .{});
    const test_size: usize = 1000;
    const test_words = (test_size + 31) / 32;

    const identity_gas: u64 = 15 + 3 * test_words;
    const sha256_gas: u64 = 60 + 12 * test_words;
    const ripemd160_gas: u64 = 600 + 120 * test_words;

    std.debug.print("Identity: {} gas (cheapest)\n", .{identity_gas});
    std.debug.print("SHA-256: {} gas\n", .{sha256_gas});
    std.debug.print("RIPEMD-160: {} gas\n", .{ripemd160_gas});
    std.debug.print("\nIdentity is the cheapest data operation precompile\n", .{});

    // Example 6: Use case - data forwarding
    std.debug.print("\n=== Example 6: Data Forwarding Pattern ===\n", .{});
    const calldata = "transfer(address,uint256)";

    const forward_gas: u64 = 15 + 3 * ((calldata.len + 31) / 32);

    const forwarded = try precompiles.identity.execute(allocator, calldata, forward_gas);
    defer forwarded.deinit(allocator);

    std.debug.print("Original calldata: {s}\n", .{calldata});
    std.debug.print("Forwarded data: {s}\n", .{forwarded.output});
    std.debug.print("Gas cost for forwarding: {}\n", .{forwarded.gas_used});

    // Example 7: Out of gas
    std.debug.print("\n=== Example 7: Out of Gas ===\n", .{});
    const test_data = [_]u8{0} ** 100;
    const insufficient_gas: u64 = 10; // Need 15 + 3*4 = 27

    const oog_result = precompiles.identity.execute(allocator, &test_data, insufficient_gas);
    const is_oog = if (oog_result) |_| false else |err| err == error.OutOfGas;
    std.debug.print("Insufficient gas: {s}\n", .{if (is_oog) "✓ Fails as expected" else "✗ Unexpected success"});

    std.debug.print("\n=== Summary ===\n", .{});
    std.debug.print("Base cost: 15 gas (lowest among precompiles)\n", .{});
    std.debug.print("Per-word cost: 3 gas (32 bytes)\n", .{});
    std.debug.print("Per-byte cost: ~0.09375 gas (cheapest)\n", .{});
    std.debug.print("Output: Identical to input\n", .{});
    std.debug.print("Use cases:\n", .{});
    std.debug.print("  - Efficient data copying in EVM\n", .{});
    std.debug.print("  - Proxy contract data forwarding\n", .{});
    std.debug.print("  - Gas accounting for memory operations\n", .{});
    std.debug.print("  - Testing precompile execution mechanics\n", .{});
}
