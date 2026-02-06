//! Hex Manipulation Example
//!
//! Demonstrates:
//! - Concatenating hex strings
//! - Slicing hex data
//! - Padding (left and right)
//! - Trimming zeros
//!
//! Run with: zig build run-example -- primitives/hex/hex-manipulation.zig

const std = @import("std");
const primitives = @import("primitives");
const Hex = primitives.Hex;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Hex Manipulation ===\n\n", .{});

    try demonstrateConcatenation(allocator);
    try demonstrateSlicing();
    try demonstratePadding(allocator);
    try demonstrateTrimming();
    try buildTransferCalldata(allocator);

    std.debug.print("\n=== Example completed ===\n\n", .{});
}

fn demonstrateConcatenation(allocator: std.mem.Allocator) !void {
    std.debug.print("1. Concatenation:\n", .{});

    const part1 = [_]u8{0x12};
    const part2 = [_]u8{0x34};
    const part3 = [_]u8{0x56};

    const parts = [_][]const u8{ &part1, &part2, &part3 };
    const combined = try Hex.concat(allocator, &parts);
    defer allocator.free(combined);

    std.debug.print("  [0x12] + [0x34] + [0x56] = ", .{});
    for (combined, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("\n\n", .{});
}

fn demonstrateSlicing() !void {
    std.debug.print("2. Slicing:\n", .{});

    const data = [_]u8{ 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc };

    std.debug.print("  Original: [", .{});
    for (data, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});

    // Slice from index 1 to end
    const slice1 = Hex.slice(&data, 1, data.len);
    std.debug.print("  Slice(1, end): [", .{});
    for (slice1, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});

    // Slice bytes 1-3
    const slice2 = Hex.slice(&data, 1, 3);
    std.debug.print("  Slice(1, 3): [", .{});
    for (slice2, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});

    // First 4 bytes
    const slice3 = Hex.slice(&data, 0, 4);
    std.debug.print("  Slice(0, 4): [", .{});
    for (slice3, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n\n", .{});
}

fn demonstratePadding(allocator: std.mem.Allocator) !void {
    std.debug.print("3. Padding:\n", .{});

    const short = [_]u8{ 0x12, 0x34 };

    std.debug.print("  Original: [0x12, 0x34] ({} bytes)\n", .{short.len});

    // Pad left (prepend zeros)
    const padded_left = try Hex.padLeft(allocator, &short, 4);
    defer allocator.free(padded_left);

    std.debug.print("  Pad left to 4 bytes: [", .{});
    for (padded_left, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});

    // Pad left to 32 bytes
    const padded_32 = try Hex.padLeft(allocator, &short, 32);
    defer allocator.free(padded_32);

    std.debug.print("  Pad left to 32 bytes (first 4): [", .{});
    for (padded_32[0..4], 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("] ... [", .{});
    for (padded_32[28..32], 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("] (last 4)\n", .{});

    // Pad right (append zeros)
    const padded_right = try Hex.padRight(allocator, &short, 4);
    defer allocator.free(padded_right);

    std.debug.print("  Pad right to 4 bytes: [", .{});
    for (padded_right, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n\n", .{});
}

fn demonstrateTrimming() !void {
    std.debug.print("4. Trimming:\n", .{});

    const padded = [_]u8{ 0x00, 0x00, 0x12, 0x34 };

    std.debug.print("  Original: [0x00, 0x00, 0x12, 0x34]\n", .{});

    const trimmed = Hex.trimLeftZeros(&padded);
    std.debug.print("  Trimmed left: [", .{});
    for (trimmed, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});

    // All zeros case
    const all_zeros = [_]u8{ 0x00, 0x00, 0x00, 0x00 };
    const trimmed_zeros = Hex.trimLeftZeros(&all_zeros);
    std.debug.print("  All zeros trimmed: {} bytes\n", .{trimmed_zeros.len});

    // Trim right zeros
    const padded_right = [_]u8{ 0x12, 0x34, 0x00, 0x00 };
    const trimmed_right = Hex.trimRightZeros(&padded_right);
    std.debug.print("  Trimmed right [0x12, 0x34, 0x00, 0x00]: [", .{});
    for (trimmed_right, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n\n", .{});
}

fn buildTransferCalldata(allocator: std.mem.Allocator) !void {
    std.debug.print("5. Real-world: Build ERC20 transfer calldata:\n", .{});

    // Function selector for transfer(address,uint256)
    const selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };

    // Recipient address (20 bytes)
    const recipient_hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
    const recipient = try Hex.hexToBytes(allocator, recipient_hex);
    defer allocator.free(recipient);

    // Pad to 32 bytes
    const padded_recipient = try Hex.padLeft(allocator, recipient, 32);
    defer allocator.free(padded_recipient);

    // Amount: 1 token with 18 decimals
    const amount: u256 = 1_000_000_000_000_000_000;
    const amount_hex = try Hex.u256ToHex(allocator, amount);
    defer allocator.free(amount_hex);

    const amount_bytes = try Hex.hexToBytes(allocator, amount_hex);
    defer allocator.free(amount_bytes);

    const padded_amount = try Hex.padLeft(allocator, amount_bytes, 32);
    defer allocator.free(padded_amount);

    // Concatenate: selector + recipient + amount
    const parts = [_][]const u8{ &selector, padded_recipient, padded_amount };
    const calldata = try Hex.concat(allocator, &parts);
    defer allocator.free(calldata);

    std.debug.print("  Function: transfer(address,uint256)\n", .{});
    std.debug.print("  Recipient: {s}\n", .{recipient_hex});
    std.debug.print("  Amount: {}\n", .{amount});
    std.debug.print("  Calldata size: {} bytes\n", .{calldata.len});
    std.debug.print("  Calldata (first 20 bytes): ", .{});
    for (calldata[0..@min(20, calldata.len)], 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("...\n", .{});

    // Decode it back
    const decoded_selector = Hex.slice(calldata, 0, 4);
    std.debug.print("  Decoded selector: [", .{});
    for (decoded_selector, 0..) |byte, i| {
        if (i > 0) std.debug.print(", ", .{});
        std.debug.print("0x{x:0>2}", .{byte});
    }
    std.debug.print("]\n", .{});

    const decoded_recipient_slice = Hex.slice(calldata, 4, 36);
    const decoded_recipient = Hex.trimLeftZeros(decoded_recipient_slice);
    std.debug.print("  Decoded recipient ({} bytes)\n", .{decoded_recipient.len});

    std.debug.print("\n", .{});
}
