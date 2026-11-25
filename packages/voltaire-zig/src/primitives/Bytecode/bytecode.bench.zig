const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const Bytecode = primitives.Bytecode;

const sample_code = [_]u8{
    0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15,
    0x61, 0x00, 0x10, 0x57, 0x60, 0x00, 0x80, 0xfd,
    0x5b, 0x50, 0x60, 0x04, 0x36, 0x10, 0x61, 0x00,
    0x36, 0x57, 0x60, 0x00, 0x35, 0x60, 0xe0, 0x1c,
    0x80, 0x63, 0xa9, 0x05, 0x9c, 0xbb, 0x14, 0x61,
    0x00, 0x3b, 0x57, 0x5b, 0x00,
};

fn benchBytecodeInit(allocator: std.mem.Allocator) void {
    var bc = Bytecode.init(allocator, &sample_code) catch unreachable;
    defer bc.deinit();
    std.mem.doNotOptimizeAway(bc.len());
}

fn benchBytecodeIsValidJumpDest(allocator: std.mem.Allocator) void {
    var bc = Bytecode.init(allocator, &sample_code) catch unreachable;
    defer bc.deinit();
    const ok1 = bc.isValidJumpDest(16);
    const ok2 = bc.isValidJumpDest(43);
    const bad = bc.isValidJumpDest(10);
    std.mem.doNotOptimizeAway(ok1 and ok2 and !bad);
}

pub fn main(init: std.process.Init) !void {
    const stdout = std.Io.File.stdout();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("Bytecode.init (45B)", benchBytecodeInit, .{});
    try bench.add("Bytecode.isValidJumpDest", benchBytecodeIsValidJumpDest, .{});

    try stdout.writeStreamingAll(init.io, "\n");
    try bench.run(init.io, stdout);
}
