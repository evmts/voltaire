const std = @import("std");
const zbench = @import("zbench");
const crypto = @import("crypto");
const eip712 = crypto.eip712;

// Benchmark: hashDomain - simple domain
fn benchHashDomainSimple(allocator: std.mem.Allocator) void {
    const domain = eip712.Domain{
        .name = "MyDApp",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = null,
        .salt = null,
    };
    const hash = eip712.hashDomain(allocator, domain) catch unreachable;
    _ = hash;
}

// Benchmark: hashDomain - full domain with all fields
fn benchHashDomainFull(allocator: std.mem.Allocator) void {
    const contract_addr = [_]u8{0x12} ** 20;
    const salt = [_]u8{0xab} ** 32;
    const domain = eip712.Domain{
        .name = "MyDApp",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = &contract_addr,
        .salt = &salt,
    };
    const hash = eip712.hashDomain(allocator, domain) catch unreachable;
    _ = hash;
}

// Benchmark: hashStruct - simple struct
fn benchHashStructSimple(allocator: std.mem.Allocator) void {
    const type_hash = [_]u8{0xab} ** 32;
    const values = [_][]const u8{
        &[_]u8{ 0xde, 0xad, 0xbe, 0xef },
        &[_]u8{ 0xca, 0xfe, 0xba, 0xbe },
    };
    const hash = eip712.hashStruct(allocator, type_hash, &values) catch unreachable;
    _ = hash;
}

// Benchmark: encodeType - simple type
fn benchEncodeTypeSimple(allocator: std.mem.Allocator) void {
    const type_def = eip712.TypeDefinition{
        .name = "Person",
        .fields = &[_]eip712.Field{
            .{ .name = "name", .type_name = "string" },
            .{ .name = "age", .type_name = "uint256" },
        },
    };
    const encoded = eip712.encodeType(allocator, type_def) catch unreachable;
    defer allocator.free(encoded);
}

// Benchmark: encodeType - complex type with nested struct
fn benchEncodeTypeNested(allocator: std.mem.Allocator) void {
    const type_def = eip712.TypeDefinition{
        .name = "Mail",
        .fields = &[_]eip712.Field{
            .{ .name = "from", .type_name = "Person" },
            .{ .name = "to", .type_name = "Person" },
            .{ .name = "contents", .type_name = "string" },
        },
    };
    const encoded = eip712.encodeType(allocator, type_def) catch unreachable;
    defer allocator.free(encoded);
}

// Benchmark: hashType
fn benchHashType(allocator: std.mem.Allocator) void {
    const type_def = eip712.TypeDefinition{
        .name = "Person",
        .fields = &[_]eip712.Field{
            .{ .name = "name", .type_name = "string" },
            .{ .name = "age", .type_name = "uint256" },
        },
    };
    const hash = eip712.hashType(allocator, type_def) catch unreachable;
    _ = hash;
}

// Benchmark: getStructHash - complete workflow
fn benchGetStructHash(allocator: std.mem.Allocator) void {
    const type_def = eip712.TypeDefinition{
        .name = "Person",
        .fields = &[_]eip712.Field{
            .{ .name = "name", .type_name = "string" },
            .{ .name = "age", .type_name = "uint256" },
        },
    };
    const type_hash = eip712.hashType(allocator, type_def) catch unreachable;

    const name_hash = crypto.HashUtils.keccak256("Alice");
    const age = [_]u8{0x00} ** 31 ++ [_]u8{0x1e}; // 30

    const values = [_][]const u8{ &name_hash, &age };
    const struct_hash = eip712.hashStruct(allocator, type_hash, &values) catch unreachable;
    _ = struct_hash;
}

pub fn main() !void {
    var buf: [8192]u8 = undefined;
    var stdout_file = std.fs.File.stdout();
    var writer_instance = stdout_file.writer(&buf);
    var writer = &writer_instance.interface;
    var bench = zbench.Benchmark.init(std.heap.page_allocator, .{});
    defer bench.deinit();

    try bench.add("hashDomain (simple)", benchHashDomainSimple, .{});
    try bench.add("hashDomain (full)", benchHashDomainFull, .{});
    try bench.add("hashStruct (simple)", benchHashStructSimple, .{});
    try bench.add("encodeType (simple)", benchEncodeTypeSimple, .{});
    try bench.add("encodeType (nested)", benchEncodeTypeNested, .{});
    try bench.add("hashType", benchHashType, .{});
    try bench.add("getStructHash (complete)", benchGetStructHash, .{});

    try writer.writeAll("\n");
    try bench.run(writer);
}
