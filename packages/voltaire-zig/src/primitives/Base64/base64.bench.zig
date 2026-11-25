const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const Base64 = primitives.Base64;

const data_64 = @as([64]u8, @splat(0xab));
const data_1k = @as([1024]u8, @splat(0xcd));
const b64_64 = "q6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urq6urqw==";

fn benchBase64Encode64B(allocator: std.mem.Allocator) void {
    const out = Base64.encode(allocator, &data_64) catch unreachable;
    defer allocator.free(out);
    std.mem.doNotOptimizeAway(out);
}

fn benchBase64Encode1KB(allocator: std.mem.Allocator) void {
    const out = Base64.encode(allocator, &data_1k) catch unreachable;
    defer allocator.free(out);
    std.mem.doNotOptimizeAway(out);
}

fn benchBase64Decode64B(allocator: std.mem.Allocator) void {
    const out = Base64.decode(allocator, b64_64) catch unreachable;
    defer allocator.free(out);
    std.mem.doNotOptimizeAway(out);
}

fn benchBase64IsValid(allocator: std.mem.Allocator) void {
    _ = allocator;
    const valid = Base64.isValid(b64_64);
    std.mem.doNotOptimizeAway(valid);
}

pub fn main(init: std.process.Init) !void {
    const stdout = std.Io.File.stdout();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("Base64.encode (64B)", benchBase64Encode64B, .{});
    try bench.add("Base64.encode (1KB)", benchBase64Encode1KB, .{});
    try bench.add("Base64.decode (64B)", benchBase64Decode64B, .{});
    try bench.add("Base64.isValid (64B)", benchBase64IsValid, .{});

    try stdout.writeStreamingAll(init.io, "\n");
    try bench.run(init.io, stdout);
}
