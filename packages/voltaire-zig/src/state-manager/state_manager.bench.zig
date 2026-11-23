const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const sm_mod = @import("state-manager");
const Address = primitives.Address;
const StateManager = sm_mod.StateManager;

fn benchSetAndGetBalance(allocator: std.mem.Allocator) void {
    var sm = StateManager.init(allocator, null) catch unreachable;
    defer sm.deinit();
    const addr = Address{ .bytes = [_]u8{0x11} ** 20 };
    sm.setBalance(addr, 1_000_000_000_000_000_000) catch unreachable;
    const bal = sm.getBalance(addr) catch unreachable;
    std.mem.doNotOptimizeAway(bal);
}

fn benchSetAndGetStorage(allocator: std.mem.Allocator) void {
    var sm = StateManager.init(allocator, null) catch unreachable;
    defer sm.deinit();
    const addr = Address{ .bytes = [_]u8{0x22} ** 20 };
    sm.setStorage(addr, 1, 0xdeadbeef) catch unreachable;
    const val = sm.getStorage(addr, 1) catch unreachable;
    std.mem.doNotOptimizeAway(val);
}

fn benchCheckpointAndRevert(allocator: std.mem.Allocator) void {
    var sm = StateManager.init(allocator, null) catch unreachable;
    defer sm.deinit();
    const addr = Address{ .bytes = [_]u8{0x33} ** 20 };
    sm.setBalance(addr, 100) catch unreachable;
    sm.checkpoint() catch unreachable;
    sm.setBalance(addr, 200) catch unreachable;
    sm.revert();
    const bal = sm.getBalance(addr) catch unreachable;
    std.mem.doNotOptimizeAway(bal);
}

pub fn main() !void {
    var buf: [8192]u8 = undefined;
    var stdout_file = std.fs.File.stdout();
    var writer_instance = stdout_file.writer(&buf);
    var writer = &writer_instance.interface;
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("StateManager.setBalance+getBalance", benchSetAndGetBalance, .{});
    try bench.add("StateManager.setStorage+getStorage", benchSetAndGetStorage, .{});
    try bench.add("StateManager.checkpoint+revert", benchCheckpointAndRevert, .{});

    try writer.writeAll("\n");
    try bench.run(writer);
    try writer.flush();
}
