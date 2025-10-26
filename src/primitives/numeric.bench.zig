const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const Numeric = primitives.Numeric;

// Benchmark: parseEther
fn benchParseEther(allocator: std.mem.Allocator) void {
    const ether_str = "1.5";
    const value = Numeric.parseEther(ether_str) catch unreachable;
    _ = value;
    _ = allocator;
}

// Benchmark: parseGwei
fn benchParseGwei(allocator: std.mem.Allocator) void {
    const gwei_str = "50";
    const value = Numeric.parseGwei(gwei_str) catch unreachable;
    _ = value;
    _ = allocator;
}

// Benchmark: formatEther
fn benchFormatEther(allocator: std.mem.Allocator) void {
    const value: u256 = 1_500_000_000_000_000_000; // 1.5 ether
    const formatted = Numeric.formatEther(allocator, value) catch unreachable;
    defer allocator.free(formatted);
}

// Benchmark: formatGwei
fn benchFormatGwei(allocator: std.mem.Allocator) void {
    const value: u256 = 50_000_000_000; // 50 gwei
    const formatted = Numeric.formatGwei(allocator, value) catch unreachable;
    defer allocator.free(formatted);
}

// Benchmark: weiToGwei
fn benchWeiToGwei(allocator: std.mem.Allocator) void {
    const wei: u256 = 50_000_000_000;
    const gwei = Numeric.weiToGwei(wei);
    _ = gwei;
    _ = allocator;
}

// Benchmark: gweiToWei
fn benchGweiToWei(allocator: std.mem.Allocator) void {
    const gwei: u256 = 50;
    const wei = Numeric.gweiToWei(gwei);
    _ = wei;
    _ = allocator;
}

// Benchmark: etherToWei
fn benchEtherToWei(allocator: std.mem.Allocator) void {
    const ether: u256 = 1;
    const wei = Numeric.etherToWei(ether);
    _ = wei;
    _ = allocator;
}

// Benchmark: weiToEther
fn benchWeiToEther(allocator: std.mem.Allocator) void {
    const wei: u256 = 1_000_000_000_000_000_000;
    const ether = Numeric.weiToEther(wei);
    _ = ether;
    _ = allocator;
}

// Benchmark: safeAdd
fn benchSafeAdd(allocator: std.mem.Allocator) void {
    const a: u256 = 1000;
    const b: u256 = 2000;
    const result = Numeric.safeAdd(a, b) catch unreachable;
    _ = result;
    _ = allocator;
}

// Benchmark: safeSub
fn benchSafeSub(allocator: std.mem.Allocator) void {
    const a: u256 = 2000;
    const b: u256 = 1000;
    const result = Numeric.safeSub(a, b) catch unreachable;
    _ = result;
    _ = allocator;
}

// Benchmark: safeMul
fn benchSafeMul(allocator: std.mem.Allocator) void {
    const a: u256 = 1000;
    const b: u256 = 2000;
    const result = Numeric.safeMul(a, b) catch unreachable;
    _ = result;
    _ = allocator;
}

// Benchmark: safeDiv
fn benchSafeDiv(allocator: std.mem.Allocator) void {
    const a: u256 = 2000;
    const b: u256 = 10;
    const result = Numeric.safeDiv(a, b) catch unreachable;
    _ = result;
    _ = allocator;
}

// Benchmark: calculateGasCost
fn benchCalculateGasCost(allocator: std.mem.Allocator) void {
    const gas_used: u64 = 21000;
    const gas_price: u256 = 50_000_000_000; // 50 gwei
    const cost = Numeric.calculateGasCost(gas_used, gas_price);
    _ = cost;
    _ = allocator;
}

// Benchmark: calculatePercentageOf
fn benchCalculatePercentageOf(allocator: std.mem.Allocator) void {
    const percentage: u256 = 15; // 15%
    const whole: u256 = 1000;
    const result = Numeric.calculatePercentageOf(percentage, whole) catch unreachable;
    _ = result;
    _ = allocator;
}

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("Numeric.parseEther", benchParseEther, .{});
    try bench.add("Numeric.parseGwei", benchParseGwei, .{});
    try bench.add("Numeric.formatEther", benchFormatEther, .{});
    try bench.add("Numeric.formatGwei", benchFormatGwei, .{});
    try bench.add("Numeric.weiToGwei", benchWeiToGwei, .{});
    try bench.add("Numeric.gweiToWei", benchGweiToWei, .{});
    try bench.add("Numeric.etherToWei", benchEtherToWei, .{});
    try bench.add("Numeric.weiToEther", benchWeiToEther, .{});
    try bench.add("Numeric.safeAdd", benchSafeAdd, .{});
    try bench.add("Numeric.safeSub", benchSafeSub, .{});
    try bench.add("Numeric.safeMul", benchSafeMul, .{});
    try bench.add("Numeric.safeDiv", benchSafeDiv, .{});
    try bench.add("Numeric.calculateGasCost", benchCalculateGasCost, .{});
    try bench.add("Numeric.calculatePercentageOf", benchCalculatePercentageOf, .{});

    try stdout.writeAll("\n");
    try bench.run(stdout);
}
