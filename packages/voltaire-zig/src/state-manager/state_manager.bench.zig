const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const sm_mod = @import("state-manager");
const Address = primitives.Address;
const StateManager = sm_mod.StateManager;

fn benchSetAndGetBalance(allocator: std.mem.Allocator) void {
    var sm = StateManager.init(allocator, null) catch unreachable;
    defer sm.deinit();
    const addr = Address{ .bytes = @as([20]u8, @splat(0x11)) };
    sm.setBalance(addr, 1_000_000_000_000_000_000) catch unreachable;
    const bal = sm.getBalance(addr) catch unreachable;
    std.mem.doNotOptimizeAway(bal);
}

fn benchSetAndGetStorage(allocator: std.mem.Allocator) void {
    var sm = StateManager.init(allocator, null) catch unreachable;
    defer sm.deinit();
    const addr = Address{ .bytes = @as([20]u8, @splat(0x22)) };
    sm.setStorage(addr, 1, 0xdeadbeef) catch unreachable;
    const val = sm.getStorage(addr, 1) catch unreachable;
    std.mem.doNotOptimizeAway(val);
}

fn benchCheckpointAndRevert(allocator: std.mem.Allocator) void {
    var sm = StateManager.init(allocator, null) catch unreachable;
    defer sm.deinit();
    const addr = Address{ .bytes = @as([20]u8, @splat(0x33)) };
    sm.setBalance(addr, 100) catch unreachable;
    sm.checkpoint() catch unreachable;
    sm.setBalance(addr, 200) catch unreachable;
    sm.revert();
    const bal = sm.getBalance(addr) catch unreachable;
    std.mem.doNotOptimizeAway(bal);
}

pub fn main(init: std.process.Init) !void {
    const stdout = std.Io.File.stdout();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("StateManager.setBalance+getBalance", benchSetAndGetBalance, .{});
    try bench.add("StateManager.setStorage+getStorage", benchSetAndGetStorage, .{});
    try bench.add("StateManager.checkpoint+revert", benchCheckpointAndRevert, .{});

    try stdout.writeStreamingAll(init.io, "\n");
    try bench.run(init.io, stdout);
}
