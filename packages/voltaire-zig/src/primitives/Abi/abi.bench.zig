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
    const addr = Address{ .bytes = @as([20]u8, @splat(0x74)) };
    const values = [_]AbiEncoding.AbiValue{
        AbiEncoding.addressValue(addr),
        AbiEncoding.uint256_value(1_000_000_000_000_000_000),
    };
    const encoded = AbiEncoding.encodeAbiParameters(allocator, &values) catch unreachable;
    defer allocator.free(encoded);
    std.mem.doNotOptimizeAway(encoded);
}

fn benchDecodeErc20Transfer(allocator: std.mem.Allocator) void {
    var data = @as([64]u8, @splat(0));
    @memset(data[12..32], 0x74);
    data[63] = 0x2a;
    const types = [_]AbiEncoding.AbiType{ .address, .uint256 };
    const decoded = AbiEncoding.decodeAbiParameters(allocator, &data, &types) catch unreachable;
    defer allocator.free(decoded);
    std.mem.doNotOptimizeAway(decoded);
}

fn benchEncodePacked(allocator: std.mem.Allocator) void {
    const addr = Address{ .bytes = @as([20]u8, @splat(0xab)) };
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
    const data = [_]u8{ 0xa9, 0x05, 0x9c, 0xbb } ++ (@as([28]u8, @splat(0))) ++ (@as([20]u8, @splat(0x74))) ++ (@as([12]u8, @splat(0)));
    const gas = AbiEncoding.estimateGasForData(&data);
    std.mem.doNotOptimizeAway(gas);
}

pub fn main(init: std.process.Init) !void {
    const stdout = std.Io.File.stdout();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("Abi.computeSelector", benchComputeSelector, .{});
    try bench.add("Abi.encodeAbiParameters (transfer)", benchEncodeErc20Transfer, .{});
    try bench.add("Abi.decodeAbiParameters (transfer)", benchDecodeErc20Transfer, .{});
    try bench.add("Abi.encodePacked", benchEncodePacked, .{});
    try bench.add("Abi.estimateGasForData", benchEstimateGasForData, .{});

    try stdout.writeStreamingAll(init.io, "\n");
    try bench.run(init.io, stdout);
}
