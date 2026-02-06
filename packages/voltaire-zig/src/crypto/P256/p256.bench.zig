const std = @import("std");
const zbench = @import("zbench");
const crypto = @import("crypto");
const p256 = crypto.p256;

// Test private key (32 bytes)
const test_private_key = [_]u8{
    0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d,
    0x8d, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d,
    0xac, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d,
    0x8d, 0x0c, 0x3e, 0x9c, 0xd8, 0x4b, 0x8d, 0x8d,
};

// Test message hash (32 bytes)
const test_hash = [_]u8{
    0x8c, 0x1c, 0x93, 0x8d, 0x4e, 0x03, 0x65, 0x7a,
    0xea, 0x45, 0xa9, 0x4f, 0xc7, 0xd4, 0x7b, 0xa8,
    0x26, 0xc8, 0xd6, 0x67, 0xc0, 0xd1, 0xe6, 0xe3,
    0x3a, 0x64, 0xa0, 0x36, 0xec, 0x44, 0xf5, 0x8f,
};

// Pre-generated test data
var test_signature: [64]u8 = undefined;
var test_public_key: [64]u8 = undefined;

fn setup(allocator: std.mem.Allocator) !void {
    const sig = try p256.sign(allocator, &test_hash, &test_private_key);
    defer allocator.free(sig);
    @memcpy(&test_signature, sig);

    const pub_key = try p256.publicKeyFromPrivate(allocator, &test_private_key);
    defer allocator.free(pub_key);
    @memcpy(&test_public_key, pub_key);
}

// Benchmark: sign
fn benchSign(allocator: std.mem.Allocator) void {
    const sig = p256.sign(allocator, &test_hash, &test_private_key) catch return;
    defer allocator.free(sig);
}

// Benchmark: verify (valid signature)
fn benchVerifyValid(allocator: std.mem.Allocator) void {
    const valid = p256.verify(&test_hash, test_signature[0..32], test_signature[32..64], &test_public_key) catch return;
    _ = valid;
    _ = allocator;
}

// Benchmark: verify (invalid signature)
fn benchVerifyInvalid(allocator: std.mem.Allocator) void {
    var wrong_hash = test_hash;
    wrong_hash[0] ^= 0xFF;
    const valid = p256.verify(&wrong_hash, test_signature[0..32], test_signature[32..64], &test_public_key) catch return;
    _ = valid;
    _ = allocator;
}

// Benchmark: derivePublicKey
fn benchDerivePublicKey(allocator: std.mem.Allocator) void {
    const pub_key = p256.publicKeyFromPrivate(allocator, &test_private_key) catch return;
    defer allocator.free(pub_key);
}

// Benchmark: ecdh
fn benchEcdh(allocator: std.mem.Allocator) void {
    const shared = p256.ecdh(allocator, &test_private_key, &test_public_key) catch return;
    defer allocator.free(shared);
}

pub fn main() !void {
    var buf: [8192]u8 = undefined;
    var stdout_file = std.fs.File.stdout();
    var writer_instance = stdout_file.writer(&buf);
    var writer = &writer_instance.interface;

    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{
        .time_budget_ns = 10_000_000_000, // 10 seconds for crypto operations
    });
    defer bench.deinit();

    // Setup test data
    try setup(std.heap.page_allocator);

    try bench.add("sign", benchSign, .{});
    try bench.add("verify (valid)", benchVerifyValid, .{});
    try bench.add("verify (invalid)", benchVerifyInvalid, .{});
    try bench.add("derivePublicKey", benchDerivePublicKey, .{});
    try bench.add("ecdh", benchEcdh, .{});

    try writer.writeAll("\n");
    try bench.run(writer);
}
