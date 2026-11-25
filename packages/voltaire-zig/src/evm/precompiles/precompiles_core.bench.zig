const std = @import("std");
const zbench = @import("zbench");
const precompiles = @import("precompiles");

const data_64 = @as([64]u8, @splat(0x42));
const data_1k = @as([1024]u8, @splat(0x55));

// Minimal valid MODEXP input: baseLen=32, expLen=32, modLen=32
const modexp_input = blk: {
    var buf = @as([96 + 96]u8, @splat(0));
    buf[31] = 32; // base len
    buf[63] = 32; // exp len
    buf[95] = 32; // mod len
    buf[127] = 3; // base = 3
    buf[159] = 17; // exp = 17
    buf[191] = 97; // mod = 97
    break :blk buf;
};

fn benchIdentity64B(allocator: std.mem.Allocator) void {
    const res = precompiles.identity.execute(allocator, &data_64, 1_000_000) catch unreachable;
    defer res.deinit(allocator);
    std.mem.doNotOptimizeAway(res.gas_used);
}

fn benchIdentity1KB(allocator: std.mem.Allocator) void {
    const res = precompiles.identity.execute(allocator, &data_1k, 1_000_000) catch unreachable;
    defer res.deinit(allocator);
    std.mem.doNotOptimizeAway(res.gas_used);
}

fn benchRipemd160_64B(allocator: std.mem.Allocator) void {
    const res = precompiles.ripemd160.execute(allocator, &data_64, 1_000_000) catch unreachable;
    defer res.deinit(allocator);
    std.mem.doNotOptimizeAway(res.gas_used);
}

fn benchModexp32B(allocator: std.mem.Allocator) void {
    const res = precompiles.modexp.execute(allocator, &modexp_input, 1_000_000, .CANCUN) catch unreachable;
    defer res.deinit(allocator);
    std.mem.doNotOptimizeAway(res.gas_used);
}

pub fn main(init: std.process.Init) !void {
    const stdout = std.Io.File.stdout();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("Precompile.identity (64B)", benchIdentity64B, .{});
    try bench.add("Precompile.identity (1KB)", benchIdentity1KB, .{});
    try bench.add("Precompile.ripemd160 (64B)", benchRipemd160_64B, .{});
    try bench.add("Precompile.modexp (32B)", benchModexp32B, .{});

    try stdout.writeStreamingAll(init.io, "\n");
    try bench.run(init.io, stdout);
}
