const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const Hex = primitives.Hex;

// Benchmark: Hex.toBytes
fn benchToBytes(allocator: std.mem.Allocator) void {
    const hex_str = "0xdeadbeef";
    const bytes = Hex.toBytes(allocator, hex_str) catch unreachable;
    defer allocator.free(bytes);
}

// Benchmark: Hex.bytesToHex
fn benchBytesToHex(allocator: std.mem.Allocator) void {
    const bytes = [_]u8{ 0xde, 0xad, 0xbe, 0xef };
    const hex_str = Hex.bytesToHex(allocator, &bytes) catch unreachable;
    defer allocator.free(hex_str);
}

// Benchmark: Hex.toBytesFixed (20 bytes - address size)
fn benchToBytesFixed20(allocator: std.mem.Allocator) void {
    const hex_str = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    var buffer: [20]u8 = undefined;
    Hex.toBytesFixed(&buffer, hex_str) catch unreachable;
    _ = allocator;
}

// Benchmark: Hex.bytesToHexFixed (32 bytes - hash size)
fn benchBytesToHexFixed32(allocator: std.mem.Allocator) void {
    const bytes = [_]u8{0xab} ** 32;
    const hex_str = Hex.bytesToHexFixed(&bytes);
    _ = hex_str;
    _ = allocator;
}

// Benchmark: Hex.toU256
fn benchToU256(allocator: std.mem.Allocator) void {
    const hex_str = "0x1234567890abcdef";
    const value = Hex.toU256(hex_str) catch unreachable;
    _ = value;
    _ = allocator;
}

// Benchmark: Hex.u256ToHex
fn benchU256ToHex(allocator: std.mem.Allocator) void {
    const value: u256 = 0x1234567890abcdef;
    const hex_str = Hex.u256ToHex(allocator, value) catch unreachable;
    defer allocator.free(hex_str);
}

// Benchmark: Hex.toU64
fn benchToU64(allocator: std.mem.Allocator) void {
    const hex_str = "0x1234567890abcdef";
    const value = Hex.toU64(hex_str) catch unreachable;
    _ = value;
    _ = allocator;
}

// Benchmark: Hex.u64ToHex
fn benchU64ToHex(allocator: std.mem.Allocator) void {
    const value: u64 = 0x1234567890abcdef;
    const hex_str = Hex.u64ToHex(allocator, value) catch unreachable;
    defer allocator.free(hex_str);
}

// Benchmark: Hex.isHex
fn benchIsHex(allocator: std.mem.Allocator) void {
    const hex_str = "0xdeadbeef";
    const result = Hex.isHex(hex_str);
    _ = result;
    _ = allocator;
}

// Benchmark: Hex.padLeft (pad to 32 bytes)
fn benchPadLeft(allocator: std.mem.Allocator) void {
    const bytes = [_]u8{ 0xde, 0xad, 0xbe, 0xef };
    const padded = Hex.padLeft(allocator, &bytes, 32) catch unreachable;
    defer allocator.free(padded);
}

// Benchmark: Hex.trimLeftZeros
fn benchTrimLeftZeros(allocator: std.mem.Allocator) void {
    const bytes = [_]u8{ 0x00, 0x00, 0xde, 0xad, 0xbe, 0xef };
    const trimmed = Hex.trimLeftZeros(allocator, &bytes) catch unreachable;
    defer allocator.free(trimmed);
}

// Benchmark: Hex.concat (two byte arrays)
fn benchConcat(allocator: std.mem.Allocator) void {
    const bytes1 = [_]u8{ 0xde, 0xad };
    const bytes2 = [_]u8{ 0xbe, 0xef };
    const arrays = [_][]const u8{ &bytes1, &bytes2 };
    const result = Hex.concat(allocator, &arrays) catch unreachable;
    defer allocator.free(result);
}

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("Hex.toBytes", benchToBytes, .{});
    try bench.add("Hex.bytesToHex", benchBytesToHex, .{});
    try bench.add("Hex.toBytesFixed (20 bytes)", benchToBytesFixed20, .{});
    try bench.add("Hex.bytesToHexFixed (32 bytes)", benchBytesToHexFixed32, .{});
    try bench.add("Hex.toU256", benchToU256, .{});
    try bench.add("Hex.u256ToHex", benchU256ToHex, .{});
    try bench.add("Hex.toU64", benchToU64, .{});
    try bench.add("Hex.u64ToHex", benchU64ToHex, .{});
    try bench.add("Hex.isHex", benchIsHex, .{});
    try bench.add("Hex.padLeft (to 32 bytes)", benchPadLeft, .{});
    try bench.add("Hex.trimLeftZeros", benchTrimLeftZeros, .{});
    try bench.add("Hex.concat (2 arrays)", benchConcat, .{});

    try stdout.writeAll("\n");
    try bench.run(stdout);
}
