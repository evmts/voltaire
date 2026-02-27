const std = @import("std");
const Filter = @import("Filter.zig").Filter;
const Address = @import("Address.zig").Address;
const Hash = @import("Hash.zig").Hash;
const Quantity = @import("Quantity.zig").Quantity;

// Filter tests - Step 1: Write failing tests FIRST (TDD)

test "parse block range filter" {
    const allocator = std.testing.allocator;
    const json =
        \\{"fromBlock":"0x1","toBlock":"0x4","address":"0x7dcd17433742f4c0ca53122ab541d0ba67fc27df"}
    ;
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const filter = try Filter.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(filter.fromBlock != null);
    try std.testing.expect(filter.toBlock != null);
    try std.testing.expect(filter.blockHash == null);
}

test "parse block hash filter" {
    const allocator = std.testing.allocator;
    const json =
        \\{"blockHash":"0x558340736256a3a431f7340546850dfd1451171a5c990308f86c47e4f41aed1a","address":"0x7dcd17433742f4c0ca53122ab541d0ba67fc27df"}
    ;
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const filter = try Filter.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(filter.fromBlock == null);
    try std.testing.expect(filter.toBlock == null);
    try std.testing.expect(filter.blockHash != null);
}

test "parse filter with single address" {
    const allocator = std.testing.allocator;
    const json =
        \\{"fromBlock":"0x1","toBlock":"0x4","address":"0x7dcd17433742f4c0ca53122ab541d0ba67fc27df"}
    ;
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const filter = try Filter.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(filter.address != null);
    // Address should be parsed as single variant
}

test "parse filter with address array" {
    const allocator = std.testing.allocator;
    const json =
        \\{"fromBlock":"0x1","toBlock":"0x4","address":["0x7dcd17433742f4c0ca53122ab541d0ba67fc27df","0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]}
    ;
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const filter = try Filter.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(filter.address != null);
    // Address should be parsed as array variant
}

test "parse filter with topics - exact match" {
    const allocator = std.testing.allocator;
    const json =
        \\{"fromBlock":"0x1","toBlock":"0x4","topics":["0x00000000000000000000000000000000000000000000000000000000656d6974","0xf4da19d6c17928e683661a52829cf391d3dc26d581152b81ce595a1207944f09"]}
    ;
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const filter = try Filter.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(filter.topics != null);
}

test "parse filter with topics - wildcard match" {
    const allocator = std.testing.allocator;
    const json =
        \\{"fromBlock":"0x3","toBlock":"0x6","topics":[[],["0x4238ace0bf7e66fd40fea01bdf43f4f30423f48432efd0da3af5fcb17a977fd4"]]}
    ;
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const filter = try Filter.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(filter.topics != null);
    // First topic should be null (wildcard), second should be an array
}

test "parse filter with null address and topics" {
    const allocator = std.testing.allocator;
    const json =
        \\{"fromBlock":"0x1","toBlock":"0x4","address":null,"topics":null}
    ;
    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const filter = try Filter.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expect(filter.address == null);
    try std.testing.expect(filter.topics == null);
}

test "serialize block range filter" {
    const allocator = std.testing.allocator;
    // Create a filter with fromBlock/toBlock
    const filter: Filter = .{
        .fromBlock = .{ .value = .{ .string = "0x1" } },
        .toBlock = .{ .value = .{ .string = "0x4" } },
        .blockHash = null,
        .address = null,
        .topics = null,
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit(allocator);

    try std.json.stringify(filter, .{}, buf.writer());
    const json = buf.items;

    try std.testing.expect(std.mem.indexOf(u8, json, "fromBlock") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "toBlock") != null);
}

test "serialize block hash filter" {
    const allocator = std.testing.allocator;
    // Create a filter with blockHash
    const filter: Filter = .{
        .fromBlock = null,
        .toBlock = null,
        .blockHash = .{ .bytes = [_]u8{0x55} ** 32 },
        .address = null,
        .topics = null,
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit(allocator);

    try std.json.stringify(filter, .{}, buf.writer());
    const json = buf.items;

    try std.testing.expect(std.mem.indexOf(u8, json, "blockHash") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "fromBlock") == null);
}

test "serialize filter with null fields omits them" {
    const allocator = std.testing.allocator;
    const filter: Filter = .{
        .fromBlock = null,
        .toBlock = null,
        .blockHash = null,
        .address = null,
        .topics = null,
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit(allocator);

    try std.json.stringify(filter, .{}, buf.writer());
    const json = buf.items;

    // Should serialize as empty object or minimal representation
    try std.testing.expect(std.mem.indexOf(u8, json, "fromBlock") == null);
    try std.testing.expect(std.mem.indexOf(u8, json, "toBlock") == null);
}
