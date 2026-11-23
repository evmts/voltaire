const std = @import("std");
const zbench = @import("zbench");
const precompiles = @import("precompiles");

const data_64 = [_]u8{0x42} ** 64;
const data_1k = [_]u8{0x55} ** 1024;

// Minimal valid MODEXP input: baseLen=32, expLen=32, modLen=32
const modexp_input = blk: {
    var buf = [_]u8{0} ** (96 + 96);
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

pub fn main() !void {
    var buf: [8192]u8 = undefined;
    var stdout_file = std.fs.File.stdout();
    var writer_instance = stdout_file.writer(&buf);
    var writer = &writer_instance.interface;
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("Precompile.identity (64B)", benchIdentity64B, .{});
    try bench.add("Precompile.identity (1KB)", benchIdentity1KB, .{});
    try bench.add("Precompile.ripemd160 (64B)", benchRipemd160_64B, .{});
    try bench.add("Precompile.modexp (32B)", benchModexp32B, .{});

    try writer.writeAll("\n");
    try bench.run(writer);
    try writer.flush();
}
