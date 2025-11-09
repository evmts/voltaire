const std = @import("std");
const precompiles = @import("precompiles");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== SHA256 Precompile Basic Usage ===\n\n", .{});

    // Example 1: Hash a simple message
    std.debug.print("=== Example 1: Simple Message ===\n", .{});
    const message = "Hello, Ethereum!";

    // Calculate gas: 60 + 12 * ceil(len/32)
    const words = (message.len + 31) / 32;
    const gas_needed: u64 = 60 + 12 * words;

    std.debug.print("Message: {s}\n", .{message});
    std.debug.print("Input length: {} bytes\n", .{message.len});
    std.debug.print("Words (32-byte): {}\n", .{words});
    std.debug.print("Gas needed: {}\n", .{gas_needed});

    const result = try precompiles.sha256.execute(allocator, message, gas_needed);
    defer result.deinit(allocator);

    std.debug.print("SHA-256 hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(result.output)});
    std.debug.print("Gas used: {}\n", .{result.gas_used});

    // Example 2: NIST test vectors
    std.debug.print("\n=== Example 2: NIST Test Vectors ===\n", .{});

    // Test vector 1: empty string
    const empty = "";
    const empty_gas: u64 = 60; // 0 bytes = 0 words
    const empty_result = try precompiles.sha256.execute(allocator, empty, empty_gas);
    defer empty_result.deinit(allocator);

    const expected_empty = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    std.debug.print("Empty string:\n", .{});
    std.debug.print("  Hash: {s}\n", .{std.fmt.fmtSliceHexLower(empty_result.output)});
    std.debug.print("  Expected: {s}\n", .{expected_empty});

    // Test vector 2: "abc"
    const abc = "abc";
    const abc_gas: u64 = 60 + 12; // 3 bytes = 1 word
    const abc_result = try precompiles.sha256.execute(allocator, abc, abc_gas);
    defer abc_result.deinit(allocator);

    const expected_abc = "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    std.debug.print("\n\"abc\":\n", .{});
    std.debug.print("  Hash: {s}\n", .{std.fmt.fmtSliceHexLower(abc_result.output)});
    std.debug.print("  Expected: {s}\n", .{expected_abc});

    // Example 3: Different input sizes and gas costs
    std.debug.print("\n=== Example 3: Gas Costs by Input Size ===\n", .{});
    const sizes = [_]usize{ 0, 1, 32, 33, 64, 100, 1000 };

    for (sizes) |size| {
        const w = (size + 31) / 32;
        const gas: u64 = 60 + 12 * w;
        const per_byte: f64 = if (size > 0) @as(f64, @floatFromInt(gas)) / @as(f64, @floatFromInt(size)) else 0.0;

        std.debug.print("{d:4} bytes: {d:4} gas ({} words, ~{d:.3} gas/byte)\n", .{ size, gas, w, per_byte });
    }

    // Example 4: Out of gas
    std.debug.print("\n=== Example 4: Out of Gas ===\n", .{});
    const test_data = [_]u8{0} ** 100;
    const insufficient_gas: u64 = 50; // Need 60 + 12*4 = 108

    const oog_result = precompiles.sha256.execute(allocator, &test_data, insufficient_gas);
    const is_oog = if (oog_result) |_| false else |err| err == error.OutOfGas;
    std.debug.print("Insufficient gas: {s}\n", .{if (is_oog) "✓ Fails as expected" else "✗ Unexpected success"});

    // Example 5: Large input
    std.debug.print("\n=== Example 5: Large Input ===\n", .{});
    var large_input: [10000]u8 = undefined;
    crypto.getRandomValues(&large_input);

    const large_words = (large_input.len + 31) / 32;
    const large_gas: u64 = 60 + 12 * large_words;

    std.debug.print("Large input size: {} bytes\n", .{large_input.len});
    std.debug.print("Gas needed: {}\n", .{large_gas});

    const large_result = try precompiles.sha256.execute(allocator, &large_input, large_gas);
    defer large_result.deinit(allocator);

    std.debug.print("Hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(large_result.output)});
    std.debug.print("Gas used: {}\n", .{large_result.gas_used});

    std.debug.print("\n=== Summary ===\n", .{});
    std.debug.print("Base cost: 60 gas\n", .{});
    std.debug.print("Per-word cost: 12 gas (32 bytes per word)\n", .{});
    std.debug.print("Per-byte cost: ~0.375 gas\n", .{});
    std.debug.print("Output size: Always 32 bytes\n", .{});
}
