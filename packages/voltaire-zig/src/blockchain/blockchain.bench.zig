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
    block.hash = @as([32]u8, @splat(0xab));
    store.putBlock(block) catch unreachable;
    const got = store.getBlock(block.hash);
    std.mem.doNotOptimizeAway(got != null);
}

pub fn main(init: std.process.Init) !void {
    const stdout = std.Io.File.stdout();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("BlockStore.init+deinit", benchBlockStoreInitDeinit, .{});
    try bench.add("BlockStore.putBlock+getBlock", benchBlockStorePutAndGet, .{});

    try stdout.writeStreamingAll(init.io, "\n");
    try bench.run(init.io, stdout);
}
