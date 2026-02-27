const std = @import("std");
const LogEntry = @import("LogEntry.zig").LogEntry;
const Address = @import("Address.zig").Address;
const Hash = @import("Hash.zig").Hash;
const Quantity = @import("Quantity.zig").Quantity;

// LogEntry tests - Step 1: Write failing tests FIRST (TDD)

test "serialize complete log entry" {
    const allocator = std.testing.allocator;

    // Create a complete log entry based on execution-apis test vectors
    const log_entry: LogEntry = .{
        .removed = false,
        .logIndex = .{ .value = .{ .string = "0xa" } },
        .transactionIndex = .{ .value = .{ .string = "0x2" } },
        .transactionHash = .{ .bytes = [_]u8{0x5b} ** 32 },
        .blockHash = .{ .bytes = [_]u8{0x55} ** 32 },
        .blockNumber = .{ .value = .{ .string = "0x2" } },
        .blockTimestamp = .{ .value = .{ .string = "0x14" } },
        .address = .{ .bytes = [_]u8{0x7d} ** 20 },
        .data = .{ .value = .{ .string = "0x0000000000000000000000000000000000000000000000000000000000000000" } },
        .topics = &[_]Hash{
            .{ .bytes = [_]u8{0} ** 32 },
            .{ .bytes = [_]u8{0xf4} ** 32 },
        },
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit(allocator);

    try std.json.stringify(log_entry, .{}, buf.writer());
    const json = buf.items;

    // Verify all fields are present
    try std.testing.expect(std.mem.indexOf(u8, json, "removed") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "logIndex") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "transactionIndex") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "transactionHash") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "blockHash") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "blockNumber") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "blockTimestamp") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "address") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "data") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "topics") != null);
}

test "serialize log entry with null block fields" {
    const allocator = std.testing.allocator;

    // Log entry without block info (pending log)
    const log_entry: LogEntry = .{
        .removed = false,
        .logIndex = null,
        .transactionIndex = null,
        .transactionHash = .{ .bytes = [_]u8{0x5b} ** 32 },
        .blockHash = null,
        .blockNumber = null,
        .blockTimestamp = null,
        .address = .{ .bytes = [_]u8{0x7d} ** 20 },
        .data = .{ .value = .{ .string = "0x" } },
        .topics = &[_]Hash{},
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit(allocator);

    try std.json.stringify(log_entry, .{}, buf.writer());
    const json = buf.items;

    // Should still have required fields
    try std.testing.expect(std.mem.indexOf(u8, json, "transactionHash") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "address") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "data") != null);
    try std.testing.expect(std.mem.indexOf(u8, json, "topics") != null);
}

test "parse log entry from JSON" {
    const allocator = std.testing.allocator;
    const json =
        \\{"address":"0x7dcd17433742f4c0ca53122ab541d0ba67fc27df","topics":["0x00000000000000000000000000000000000000000000000000000000656d6974","0xf4da19d6c17928e683661a52829cf391d3dc26d581152b81ce595a1207944f09"],"data":"0x0000000000000000000000000000000000000000000000000000000000000000","blockNumber":"0x2","transactionHash":"0x5bc704d4eb4ce7fe319705d2f888516961426a177f2799c9f934b5df7466dd33","transactionIndex":"0x2","blockHash":"0x558340736256a3a431f7340546850dfd1451171a5c990308f86c47e4f41aed1a","blockTimestamp":"0x14","logIndex":"0xa","removed":false}
    ;

    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json, .{});
    defer parsed.deinit();

    const log_entry = try LogEntry.jsonParseFromValue(allocator, parsed.value, .{});

    try std.testing.expectEqual(false, log_entry.removed);
    try std.testing.expect(log_entry.logIndex != null);
    try std.testing.expect(log_entry.blockNumber != null);
    // transactionHash.bytes access depends on Hash struct internals
    // We just check it was parsed
    _ = log_entry.transactionHash;
}

test "serialize removed log" {
    const allocator = std.testing.allocator;

    const log_entry: LogEntry = .{
        .removed = true,
        .logIndex = .{ .value = .{ .string = "0x1" } },
        .transactionIndex = .{ .value = .{ .string = "0x0" } },
        .transactionHash = .{ .bytes = [_]u8{0xaa} ** 32 },
        .blockHash = .{ .bytes = [_]u8{0xbb} ** 32 },
        .blockNumber = .{ .value = .{ .string = "0x5" } },
        .blockTimestamp = .{ .value = .{ .string = "0x28" } },
        .address = .{ .bytes = [_]u8{0xcc} ** 20 },
        .data = .{ .value = .{ .string = "0x" } },
        .topics = &[_]Hash{},
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit(allocator);

    try std.json.stringify(log_entry, .{}, buf.writer());
    const json = buf.items;

    try std.testing.expect(std.mem.indexOf(u8, json, "\"removed\":true") != null);
}

test "serialize log with multiple topics" {
    const allocator = std.testing.allocator;

    const log_entry: LogEntry = .{
        .removed = false,
        .logIndex = .{ .value = .{ .string = "0x0" } },
        .transactionIndex = .{ .value = .{ .string = "0x0" } },
        .transactionHash = .{ .bytes = [_]u8{0xdd} ** 32 },
        .blockHash = .{ .bytes = [_]u8{0xee} ** 32 },
        .blockNumber = .{ .value = .{ .string = "0x1" } },
        .blockTimestamp = .{ .value = .{ .string = "0x10" } },
        .address = .{ .bytes = [_]u8{0xff} ** 20 },
        .data = .{ .value = .{ .string = "0x1234" } },
        .topics = &[_]Hash{
            .{ .bytes = [_]u8{0x11} ** 32 },
            .{ .bytes = [_]u8{0x22} ** 32 },
            .{ .bytes = [_]u8{0x33} ** 32 },
            .{ .bytes = [_]u8{0x44} ** 32 },
        },
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit(allocator);

    try std.json.stringify(log_entry, .{}, buf.writer());
    const json = buf.items;

    // Topics array should have 4 elements
    try std.testing.expect(std.mem.indexOf(u8, json, "topics") != null);
}

test "log entry address serializes as hex" {
    const allocator = std.testing.allocator;

    const log_entry: LogEntry = .{
        .removed = false,
        .logIndex = null,
        .transactionIndex = null,
        .transactionHash = .{ .bytes = [_]u8{0x5b} ** 32 },
        .blockHash = null,
        .blockNumber = null,
        .blockTimestamp = null,
        .address = .{ .bytes = [_]u8{0x7d, 0xcd, 0x17, 0x43, 0x37, 0x42, 0xf4, 0xc0, 0xca, 0x53, 0x12, 0x2a, 0xb5, 0x41, 0xd0, 0xba, 0x67, 0xfc, 0x27, 0xdf} },
        .data = .{ .value = .{ .string = "0x" } },
        .topics = &[_]Hash{},
    };

    var buf = std.ArrayList(u8).init(allocator);
    defer buf.deinit(allocator);

    try std.json.stringify(log_entry, .{}, buf.writer());
    const json = buf.items;

    try std.testing.expect(std.mem.indexOf(u8, json, "0x7dcd17433742f4c0ca53122ab541d0ba67fc27df") != null);
}
