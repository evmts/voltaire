const std = @import("std");
const zbench = @import("zbench");
const crypto = @import("crypto");
const ed25519 = crypto.ed25519;

// Test seed (32 bytes)
const test_seed = [_]u8{1} ** ed25519.SEED_SIZE;

// Test message
const test_message = "Hello, Ethereum!";

// Pre-generated test data
var test_keypair: ed25519.Ed25519.KeyPair = undefined;
var test_signature: [64]u8 = undefined;

fn setup(allocator: std.mem.Allocator) !void {
    test_keypair = try ed25519.keypairFromSeed(&test_seed);

    const sig = try ed25519.sign(allocator, test_message, &test_keypair.secret_key.toBytes());
    defer allocator.free(sig);
    @memcpy(&test_signature, sig);
}

// Benchmark: sign
fn benchSign(allocator: std.mem.Allocator) void {
    const sig = ed25519.sign(allocator, test_message, &test_keypair.secret_key.toBytes()) catch return;
    defer allocator.free(sig);
}

// Benchmark: verify (valid signature)
fn benchVerifyValid(allocator: std.mem.Allocator) void {
    const valid = ed25519.verify(&test_signature, test_message, &test_keypair.public_key.toBytes()) catch return;
    _ = valid;
    _ = allocator;
}

// Benchmark: verify (invalid signature)
fn benchVerifyInvalid(allocator: std.mem.Allocator) void {
    const wrong_message = "Wrong message";
    const valid = ed25519.verify(&test_signature, wrong_message, &test_keypair.public_key.toBytes()) catch return;
    _ = valid;
    _ = allocator;
}

// Benchmark: derivePublicKey
fn benchDerivePublicKey(allocator: std.mem.Allocator) void {
    const pub_key = ed25519.publicKeyFromSecret(allocator, &test_keypair.secret_key.toBytes()) catch return;
    defer allocator.free(pub_key);
}

// Benchmark: keypairFromSeed
fn benchKeypairFromSeed(allocator: std.mem.Allocator) void {
    const keypair = ed25519.keypairFromSeed(&test_seed) catch return;
    _ = keypair;
    _ = allocator;
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
    try bench.add("keypairFromSeed", benchKeypairFromSeed, .{});

    try writer.writeAll("\n");
    try bench.run(writer);
}
