const std = @import("std");
const zbench = @import("zbench");
const crypto = @import("crypto");
const eip712 = crypto.Eip712;
const Crypto = crypto.Crypto;

// Build a simple TypedData with a Message type { name: string, age: uint256 }
fn buildSimpleTypedData(allocator: std.mem.Allocator) !eip712.TypedData {
    var typed = eip712.TypedData.init(allocator);

    // Domain
    typed.domain = try eip712.create_domain(allocator, "MyDApp", "1", 1, null);

    // Primary type
    typed.primary_type = try allocator.dupe(u8, "Message");

    // Define Message type
    const props = [_]eip712.TypeProperty{
        .{ .name = "name", .type = "string" },
        .{ .name = "age", .type = "uint256" },
    };
    try typed.types.put(allocator, "Message", &props);

    // Message values
    try typed.message.put(try allocator.dupe(u8, "name"), eip712.MessageValue{ .string = try allocator.dupe(u8, "Alice") });
    try typed.message.put(try allocator.dupe(u8, "age"), eip712.MessageValue{ .number = 30 });

    return typed;
}

// Benchmark: hash typed data (simple)
fn benchHashTypedData(allocator: std.mem.Allocator) void {
    var typed = buildSimpleTypedData(allocator) catch return;
    defer typed.deinit(allocator);
    const h = eip712.unaudited_hashTypedData(allocator, &typed) catch return;
    _ = h;
}

// Benchmark: sign typed data (simple)
fn benchSignTypedData(allocator: std.mem.Allocator) void {
    var typed = buildSimpleTypedData(allocator) catch return;
    defer typed.deinit(allocator);
    const pk = Crypto.unaudited_randomPrivateKey() catch return;
    const sig = eip712.unaudited_signTypedData(allocator, &typed, pk) catch return;
    _ = sig;
}

// Benchmark: verify typed data (simple)
fn benchVerifyTypedData(allocator: std.mem.Allocator) void {
    var typed = buildSimpleTypedData(allocator) catch return;
    defer typed.deinit(allocator);
    const pk = Crypto.unaudited_randomPrivateKey() catch return;
    const sig = eip712.unaudited_signTypedData(allocator, &typed, pk) catch return;
    const pub = Crypto.unaudited_getPublicKey(pk) catch return;
    const addr = pub.toAddress();
    const ok = eip712.unaudited_verifyTypedData(allocator, &typed, sig, addr) catch return;
    _ = ok;
}

pub fn main() !void {
    var buf: [8192]u8 = undefined;
    var stdout_file = std.fs.File.stdout();
    var writer_instance = stdout_file.writer(&buf);
    var writer = &writer_instance.interface;
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("EIP712 hashTypedData", benchHashTypedData, .{});
    try bench.add("EIP712 signTypedData", benchSignTypedData, .{});
    try bench.add("EIP712 verifyTypedData", benchVerifyTypedData, .{});

    try writer.writeAll("\n");
    try bench.run(writer);
}
