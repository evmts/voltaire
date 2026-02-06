const std = @import("std");
const precompiles = @import("precompiles");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== RIPEMD160 Precompile Basic Usage ===\n\n", .{});

    // Example 1: Basic hashing
    std.debug.print("=== Example 1: Basic Hashing ===\n", .{});
    const message = "Hello, RIPEMD160!";

    // Calculate gas: 600 + 120 * ceil(len/32)
    const words = (message.len + 31) / 32;
    const gas_needed: u64 = 600 + 120 * words;

    std.debug.print("Message: {s}\n", .{message});
    std.debug.print("Input length: {} bytes\n", .{message.len});
    std.debug.print("Words (32-byte): {}\n", .{words});
    std.debug.print("Gas needed: {}\n", .{gas_needed});

    const result = try precompiles.ripemd160.execute(allocator, message, gas_needed);
    defer result.deinit(allocator);

    // Extract 20-byte hash from right side (12 bytes padding)
    const hash = result.output[12..32];
    std.debug.print("RIPEMD-160 hash (20 bytes): 0x{s}\n", .{std.fmt.fmtSliceHexLower(hash)});
    std.debug.print("Full output (32 bytes): 0x{s}\n", .{std.fmt.fmtSliceHexLower(result.output)});
    std.debug.print("Gas used: {}\n", .{result.gas_used});

    // Verify padding
    const padding = result.output[0..12];
    const is_zero_padded = blk: {
        for (padding) |byte| {
            if (byte != 0) break :blk false;
        }
        break :blk true;
    };
    std.debug.print("Correct zero padding: {s}\n", .{if (is_zero_padded) "✓ Yes" else "✗ No"});

    // Example 2: Empty input
    std.debug.print("\n=== Example 2: Empty Input ===\n", .{});
    const empty = "";
    const empty_gas: u64 = 600; // 0 bytes = 0 words

    const empty_result = try precompiles.ripemd160.execute(allocator, empty, empty_gas);
    defer empty_result.deinit(allocator);

    const empty_hash = empty_result.output[12..32];
    std.debug.print("Empty string hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(empty_hash)});
    std.debug.print("Gas used: {}\n", .{empty_result.gas_used});

    // Example 3: Gas costs by input size
    std.debug.print("\n=== Example 3: Gas Costs by Input Size ===\n", .{});
    const sizes = [_]usize{ 0, 1, 32, 33, 64, 100, 1000 };

    for (sizes) |size| {
        const w = (size + 31) / 32;
        const gas: u64 = 600 + 120 * w;
        const per_byte: f64 = if (size > 0) @as(f64, @floatFromInt(gas)) / @as(f64, @floatFromInt(size)) else 0.0;

        std.debug.print("{d:4} bytes: {d:5} gas ({} words, ~{d:.2} gas/byte)\n", .{ size, gas, w, per_byte });
    }

    // Example 4: Comparison with SHA-256
    std.debug.print("\n=== Example 4: SHA-256 vs RIPEMD-160 Gas Comparison ===\n", .{});
    const test_size: usize = 100;
    const test_words = (test_size + 31) / 32;

    const ripemd160_gas: u64 = 600 + 120 * test_words;
    const sha256_gas: u64 = 60 + 12 * test_words;
    const ratio: f64 = @as(f64, @floatFromInt(ripemd160_gas)) / @as(f64, @floatFromInt(sha256_gas));

    std.debug.print("Hashing {} bytes:\n", .{test_size});
    std.debug.print("  RIPEMD-160: {} gas\n", .{ripemd160_gas});
    std.debug.print("  SHA-256: {} gas\n", .{sha256_gas});
    std.debug.print("  Ratio: {d:.1}x more expensive\n", .{ratio});

    // Example 5: Multiple hashes (batch processing)
    std.debug.print("\n=== Example 5: Batch Processing ===\n", .{});
    const inputs = [_][]const u8{
        "Input 1",
        "Input 2",
        "Input 3",
    };

    var total_gas: u64 = 0;

    for (inputs, 0..) |input, i| {
        const w = (input.len + 31) / 32;
        const gas: u64 = 600 + 120 * w;

        const res = try precompiles.ripemd160.execute(allocator, input, gas);
        defer res.deinit(allocator);

        const h = res.output[12..32];
        total_gas += res.gas_used;
        std.debug.print("Hash {}: 0x{s}\n", .{ i + 1, std.fmt.fmtSliceHexLower(h) });
    }

    std.debug.print("Processed {} inputs\n", .{inputs.len});
    std.debug.print("Total gas: {}\n", .{total_gas});
    std.debug.print("Average gas: {}\n", .{total_gas / inputs.len});

    // Example 6: Out of gas
    std.debug.print("\n=== Example 6: Out of Gas ===\n", .{});
    const test_data = [_]u8{0} ** 100;
    const insufficient_gas: u64 = 500; // Need 600 + 120*4 = 1080

    const oog_result = precompiles.ripemd160.execute(allocator, &test_data, insufficient_gas);
    const is_oog = if (oog_result) |_| false else |err| err == error.OutOfGas;
    std.debug.print("Insufficient gas: {s}\n", .{if (is_oog) "✓ Fails as expected" else "✗ Unexpected success"});

    std.debug.print("\n=== Summary ===\n", .{});
    std.debug.print("Base cost: 600 gas (10x SHA-256)\n", .{});
    std.debug.print("Per-word cost: 120 gas (10x SHA-256)\n", .{});
    std.debug.print("Per-byte cost: ~3.75 gas\n", .{});
    std.debug.print("Output: 20-byte hash, left-padded to 32 bytes\n", .{});
    std.debug.print("Use case: Bitcoin address generation, legacy systems\n", .{});
}
