const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const bc_mod = @import("blockchain");
const Block = primitives.Block;
const Hash = primitives.Hash;

fn benchBlockStoreInitDeinit(allocator: std.mem.Allocator) void {
    var store = bc_mod.BlockStore.init(allocator) catch unreachable;
    defer store.deinit();
    std.mem.doNotOptimizeAway(store.blockCount());
}

fn benchBlockStorePutAndGet(allocator: std.mem.Allocator) void {
    var store = bc_mod.BlockStore.init(allocator) catch unreachable;
    defer store.deinit();
    var block = Block.Block{
        .header = std.mem.zeroes(primitives.BlockHeader.BlockHeader),
        .body = .{
            .transactions = &.{},
            .ommers = &.{},
            .withdrawals = null,
        },
        .hash = Hash.ZERO,
        .size = 0,
        .total_difficulty = null,
    };
    block.header.number = 1;
    block.hash = [_]u8{0xab} ** 32;
    store.putBlock(block) catch unreachable;
    const got = store.getBlock(block.hash);
    std.mem.doNotOptimizeAway(got != null);
}

pub fn main() !void {
    var buf: [8192]u8 = undefined;
    var stdout_file = std.fs.File.stdout();
    var writer_instance = stdout_file.writer(&buf);
    var writer = &writer_instance.interface;
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("BlockStore.init+deinit", benchBlockStoreInitDeinit, .{});
    try bench.add("BlockStore.putBlock+getBlock", benchBlockStorePutAndGet, .{});

    try writer.writeAll("\n");
    try bench.run(writer);
    try writer.flush();
}
