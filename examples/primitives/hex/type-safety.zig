//! Type Safety Example
//!
//! Demonstrates:
//! - Compile-time size validation through types
//! - Generic functions with size parameters
//! - Common Ethereum type patterns
//!
//! Run with: zig build run-example -- primitives/hex/type-safety.zig

const std = @import("std");
const primitives = @import("primitives");
const Hex = primitives.Hex;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Type Safety ===\n\n", .{});

    try sizeConstants();
    try typedFunctions(allocator);
    try sizeValidation(allocator);
    try ethereumTypes(allocator);

    std.debug.print("\n=== Example completed ===\n\n", .{});
}

fn sizeConstants() !void {
    std.debug.print("1. Size constants:\n", .{});

    // Common Ethereum sizes
    const HASH_SIZE: usize = 32;
    const ADDRESS_SIZE: usize = 20;
    const SELECTOR_SIZE: usize = 4;
    const U256_SIZE: usize = 32;
    const SIGNATURE_SIZE: usize = 65;

    std.debug.print("  HASH_SIZE: {} bytes\n", .{HASH_SIZE});
    std.debug.print("  ADDRESS_SIZE: {} bytes\n", .{ADDRESS_SIZE});
    std.debug.print("  SELECTOR_SIZE: {} bytes\n", .{SELECTOR_SIZE});
    std.debug.print("  U256_SIZE: {} bytes\n", .{U256_SIZE});
    std.debug.print("  SIGNATURE_SIZE: {} bytes\n", .{SIGNATURE_SIZE});

    std.debug.print("\n", .{});
}

fn typedFunctions(allocator: std.mem.Allocator) !void {
    std.debug.print("2. Type-safe functions:\n", .{});

    // Functions that validate size
    const hash = try createHash(allocator);
    defer allocator.free(hash);

    const address = try createAddress(allocator);
    defer allocator.free(address);

    std.debug.print("  Created hash: {} bytes\n", .{hash.len});
    std.debug.print("  Created address: {} bytes\n", .{address.len});

    // Process with typed functions
    processHash(hash);
    processAddress(address);

    std.debug.print("\n", .{});
}

fn createHash(allocator: std.mem.Allocator) ![]u8 {
    // Create a 32-byte array
    var hash = try allocator.alloc(u8, 32);
    @memset(hash, 0xff);
    return hash;
}

fn createAddress(allocator: std.mem.Allocator) ![]u8 {
    // Create a 20-byte array
    var address = try allocator.alloc(u8, 20);
    @memset(address, 0xaa);
    return address;
}

fn processHash(hash: []const u8) void {
    std.debug.print("  Processing hash ({} bytes)\n", .{hash.len});
    if (hash.len == 32) {
        std.debug.print("    ✓ Valid hash size\n", .{});
    }
}

fn processAddress(address: []const u8) void {
    std.debug.print("  Processing address ({} bytes)\n", .{address.len});
    if (address.len == 20) {
        std.debug.print("    ✓ Valid address size\n", .{});
    }
}

fn sizeValidation(allocator: std.mem.Allocator) !void {
    std.debug.print("3. Size validation:\n", .{});

    // Create values of different sizes
    const data_32 = try allocator.alloc(u8, 32);
    defer allocator.free(data_32);
    @memset(data_32, 0);

    const data_20 = try allocator.alloc(u8, 20);
    defer allocator.free(data_20);
    @memset(data_20, 0);

    const data_8 = try allocator.alloc(u8, 8);
    defer allocator.free(data_8);
    @memset(data_8, 0);

    // Classify by size
    std.debug.print("  32 bytes: {s}\n", .{classifyBySize(data_32)});
    std.debug.print("  20 bytes: {s}\n", .{classifyBySize(data_20)});
    std.debug.print("  8 bytes: {s}\n", .{classifyBySize(data_8)});

    std.debug.print("\n", .{});
}

fn classifyBySize(data: []const u8) []const u8 {
    return switch (data.len) {
        32 => "Hash or U256",
        20 => "Address",
        4 => "Selector",
        else => "Other",
    };
}

fn ethereumTypes(allocator: std.mem.Allocator) !void {
    std.debug.print("4. Ethereum type patterns:\n", .{});

    // Hash (32 bytes)
    const hash = [_]u8{0xff} ** 32;
    std.debug.print("  Hash size: {} bytes\n", .{hash.len});

    // Address (20 bytes)
    const address_bytes = "0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
    const address = try Hex.hexToBytes(allocator, address_bytes);
    defer allocator.free(address);
    std.debug.print("  Address size: {} bytes\n", .{address.len});

    // Selector (4 bytes)
    const selector = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb };
    std.debug.print("  Selector size: {} bytes\n", .{selector.len});

    // Signature (65 bytes)
    const r = [_]u8{0} ** 32;
    const s = [_]u8{0} ** 32;
    const v = [_]u8{27};

    const sig_parts = [_][]const u8{ &r, &s, &v };
    const signature = try Hex.concat(allocator, &sig_parts);
    defer allocator.free(signature);
    std.debug.print("  Signature size: {} bytes\n", .{signature.len});

    // Validate all sizes
    const all_valid = hash.len == 32 and
        address.len == 20 and
        selector.len == 4 and
        signature.len == 65;

    std.debug.print("  All sizes valid: {}\n", .{all_valid});

    std.debug.print("\n", .{});
}
