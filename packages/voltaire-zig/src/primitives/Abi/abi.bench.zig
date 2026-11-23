const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const AbiEncoding = primitives.AbiEncoding;
const Address = primitives.Address;

fn benchComputeSelector(allocator: std.mem.Allocator) void {
    _ = allocator;
    const sel = AbiEncoding.computeSelector("transfer(address,uint256)");
    std.mem.doNotOptimizeAway(sel);
}

fn benchEncodeErc20Transfer(allocator: std.mem.Allocator) void {
    const addr = Address{ .bytes = [_]u8{0x74} ** 20 };
    const values = [_]AbiEncoding.AbiValue{
        AbiEncoding.addressValue(addr),
        AbiEncoding.uint256_value(1_000_000_000_000_000_000),
    };
    const encoded = AbiEncoding.encodeAbiParameters(allocator, &values) catch unreachable;
    defer allocator.free(encoded);
    std.mem.doNotOptimizeAway(encoded);
}

fn benchDecodeErc20Transfer(allocator: std.mem.Allocator) void {
    var data = [_]u8{0} ** 64;
    @memset(data[12..32], 0x74);
    data[63] = 0x2a;
    const types = [_]AbiEncoding.AbiType{ .address, .uint256 };
    const decoded = AbiEncoding.decodeAbiParameters(allocator, &data, &types) catch unreachable;
    defer allocator.free(decoded);
    std.mem.doNotOptimizeAway(decoded);
}

fn benchEncodePacked(allocator: std.mem.Allocator) void {
    const addr = Address{ .bytes = [_]u8{0xab} ** 20 };
    const values = [_]AbiEncoding.AbiValue{
        AbiEncoding.addressValue(addr),
        AbiEncoding.uint256_value(42),
    };
    const packed_bytes = AbiEncoding.encodePacked(allocator, &values) catch unreachable;
    defer allocator.free(packed_bytes);
    std.mem.doNotOptimizeAway(packed_bytes);
}

fn benchEstimateGasForData(allocator: std.mem.Allocator) void {
    _ = allocator;
    const data = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb } ++ ([_]u8{0} ** 28) ++ ([_]u8{0x74} ** 20) ++ ([_]u8{0} ** 12);
    const gas = AbiEncoding.estimateGasForData(&data);
    std.mem.doNotOptimizeAway(gas);
}

pub fn main() !void {
    var buf: [8192]u8 = undefined;
    var stdout_file = std.fs.File.stdout();
    var writer_instance = stdout_file.writer(&buf);
    var writer = &writer_instance.interface;
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("Abi.computeSelector", benchComputeSelector, .{});
    try bench.add("Abi.encodeAbiParameters (transfer)", benchEncodeErc20Transfer, .{});
    try bench.add("Abi.decodeAbiParameters (transfer)", benchDecodeErc20Transfer, .{});
    try bench.add("Abi.encodePacked", benchEncodePacked, .{});
    try bench.add("Abi.estimateGasForData", benchEstimateGasForData, .{});

    try writer.writeAll("\n");
    try bench.run(writer);
    try writer.flush();
}
