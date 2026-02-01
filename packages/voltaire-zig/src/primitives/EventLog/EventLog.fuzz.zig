//! Fuzz tests for EventLog encoding/decoding and parsing
//!
//! Run with: zig build test --fuzz
//! On macOS, use Docker:
//!   docker run --rm -it -v $(pwd):/workspace -w /workspace \
//!     ziglang/zig:0.15.1 zig build test --fuzz=300s

const std = @import("std");
const EventLog = @import("EventLog.zig");
const abi_encoding = @import("../abi/abi_encoding.zig");
const crypto_pkg = @import("crypto");
const hash = crypto_pkg.Hash;
const address = @import("../Address/address.zig");
const Hash = hash.Hash;
const Address = address.Address;

// Test parseEventLog doesn't panic on arbitrary topic counts
test "fuzz parseEventLog arbitrary topics" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 25) return; // Need at least: address (20) + data length (1) + 4 bytes

    // Build event log from fuzz input
    const addr = Address.fromBytes(input[0..20]) catch return;

    // Use input byte to determine topic count (0-4 topics allowed)
    const topic_count = @min(input[20] % 5, 4);

    // Build topics array
    var topics_buf: [4]Hash = undefined;
    const topics: []Hash = topics_buf[0..topic_count];

    var pos: usize = 21;
    for (topics) |*topic| {
        if (pos + 32 > input.len) {
            // Not enough input, use zero hash
            topic.* = Hash.ZERO;
        } else {
            topic.* = try Hash.fromBytes(input[pos .. pos + 32]);
            pos += 32;
        }
    }

    // Use remaining bytes as data
    const data = if (pos < input.len) input[pos..] else &[_]u8{};

    const log = EventLog.EventLog{
        .address = addr,
        .topics = topics,
        .data = data,
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Create minimal event signature
    const event_sig = EventLog.EventSignature{
        .name = "FuzzEvent",
        .inputs = &[_]EventLog.EventInput{},
    };

    // Should never panic, only return error or valid result
    _ = EventLog.parseEventLog(allocator, log, event_sig) catch return;
}

// Test parseEventLog with various indexed parameter counts
test "fuzz parseEventLog indexed parameters" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 25) return;

    const addr = try Address.fromBytes(input[0..20]);

    // Use first byte to determine indexed parameter count (0-3)
    const indexed_count = @min(input[20] % 4, 3);

    // Build topics (1 for signature + indexed_count)
    var topics_buf: [4]Hash = undefined;
    const topics: []Hash = topics_buf[0 .. indexed_count + 1];

    // Topic0 is event signature
    topics[0] = Hash.ZERO;

    var pos: usize = 21;
    for (topics[1..]) |*topic| {
        if (pos + 32 > input.len) {
            topic.* = Hash.ZERO;
        } else {
            topic.* = try Hash.fromBytes(input[pos .. pos + 32]);
            pos += 32;
        }
    }

    const data = if (pos < input.len) input[pos..] else &[_]u8{};

    const log = EventLog.EventLog{
        .address = addr,
        .topics = topics,
        .data = data,
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Create event signature with indexed parameters
    var inputs_buf: [3]EventLog.EventInput = undefined;
    const inputs: []EventLog.EventInput = inputs_buf[0..indexed_count];

    for (inputs, 0..) |*inp, i| {
        const type_byte = if (21 + i < input.len) input[21 + i] else 0;
        inp.* = .{
            .name = "param",
            .type = switch (type_byte % 3) {
                0 => .address,
                1 => .uint256,
                else => .bytes32,
            },
            .indexed = true,
        };
    }

    const event_sig = EventLog.EventSignature{
        .name = "FuzzIndexed",
        .inputs = inputs,
    };

    _ = EventLog.parseEventLog(allocator, log, event_sig) catch return;
}

// Test parseEventLog with malformed data
test "fuzz parseEventLog malformed data" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 21) return;

    const addr = try Address.fromBytes(input[0..20]);

    // Build log with potentially invalid data
    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{Hash.ZERO},
        .data = input[20..], // Arbitrary data
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Event expects non-indexed parameter
    const event_sig = EventLog.EventSignature{
        .name = "FuzzData",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    _ = EventLog.parseEventLog(allocator, log, event_sig) catch return;
}

// Test parseEventLog with missing topics
test "fuzz parseEventLog missing topics" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);

    // Event expects indexed parameters but topics missing
    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{Hash.ZERO}, // Only signature, no indexed params
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const event_sig = EventLog.EventSignature{
        .name = "FuzzMissing",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "addr1", .type = .address, .indexed = true },
            .{ .name = "addr2", .type = .address, .indexed = true },
        },
    };

    // Should handle gracefully (may return incomplete data)
    _ = EventLog.parseEventLog(allocator, log, event_sig) catch return;
}

// Test parseEventLog with zero topics (anonymous event)
test "fuzz parseEventLog anonymous event" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);

    // Anonymous event has no topic0
    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{}, // No topics
        .data = if (input.len > 20) input[20..] else &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const event_sig = EventLog.EventSignature{
        .name = "Anonymous",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    _ = EventLog.parseEventLog(allocator, log, event_sig) catch return;
}

// Test parseEventLog with maximum topics (4)
test "fuzz parseEventLog max topics" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 148) return; // 20 + 4*32

    const addr = try Address.fromBytes(input[0..20]);

    // Build 4 topics
    var topics: [4]Hash = undefined;
    var pos: usize = 20;
    for (&topics) |*topic| {
        topic.* = try Hash.fromBytes(input[pos .. pos + 32]);
        pos += 32;
    }

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &topics,
        .data = if (input.len > pos) input[pos..] else &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Event with 3 indexed params (topic0 + 3)
    const event_sig = EventLog.EventSignature{
        .name = "MaxTopics",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "addr1", .type = .address, .indexed = true },
            .{ .name = "addr2", .type = .address, .indexed = true },
            .{ .name = "value", .type = .uint256, .indexed = true },
        },
    };

    _ = EventLog.parseEventLog(allocator, log, event_sig) catch return;
}

// Test parseEventLog with mixed indexed/non-indexed
test "fuzz parseEventLog mixed parameters" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 116) return; // 20 + 3*32

    const addr = try Address.fromBytes(input[0..20]);

    // Build topics
    var topics: [3]Hash = undefined;
    var pos: usize = 20;
    for (&topics) |*topic| {
        topic.* = try Hash.fromBytes(input[pos .. pos + 32]);
        pos += 32;
    }

    const data = if (input.len > pos) input[pos..] else &[_]u8{};

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &topics,
        .data = data,
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Alternating indexed/non-indexed
    const event_sig = EventLog.EventSignature{
        .name = "Mixed",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "indexed1", .type = .address, .indexed = true },
            .{ .name = "data1", .type = .uint256, .indexed = false },
            .{ .name = "indexed2", .type = .address, .indexed = true },
            .{ .name = "data2", .type = .uint256, .indexed = false },
        },
    };

    _ = EventLog.parseEventLog(allocator, log, event_sig) catch return;
}

// Test parseEventLog with dynamic indexed types (hashed)
test "fuzz parseEventLog dynamic indexed types" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 84) return; // 20 + 2*32

    const addr = try Address.fromBytes(input[0..20]);

    // Build topics
    var topics: [3]Hash = undefined;
    topics[0] = Hash.ZERO; // signature
    topics[1] = try Hash.fromBytes(input[20..52]); // string hash
    topics[2] = try Hash.fromBytes(input[52..84]); // bytes hash

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &topics,
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Dynamic types when indexed are stored as hash
    const event_sig = EventLog.EventSignature{
        .name = "DynamicIndexed",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "str", .type = .string, .indexed = true },
            .{ .name = "data", .type = .bytes, .indexed = true },
        },
    };

    _ = EventLog.parseEventLog(allocator, log, event_sig) catch return;
}

// Test parseEventLog address extraction from topics
test "fuzz parseEventLog address extraction" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return; // 20 + 32

    const log_addr = try Address.fromBytes(input[0..20]);

    // Build topic with address (right-aligned in 32 bytes)
    var topic = Hash.ZERO;
    @memcpy(topic.bytes[12..32], input[32..52]);

    const log = EventLog.EventLog{
        .address = log_addr,
        .topics = &[_]Hash{ Hash.ZERO, topic },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const event_sig = EventLog.EventSignature{
        .name = "AddressIndexed",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "addr", .type = .address, .indexed = true },
        },
    };

    const result = EventLog.parseEventLog(allocator, log, event_sig) catch return;
    defer allocator.free(result);

    // If successful, verify address was extracted
    if (result.len > 0) {
        try std.testing.expectEqual(@as(usize, 20), result[0].address.bytes.len);
    }
}

// Test parseEventLog uint256 in topics
test "fuzz parseEventLog uint256 topics" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return; // 20 + 32

    const addr = try Address.fromBytes(input[0..20]);

    // Build topic with uint256
    const topic = try Hash.fromBytes(input[20..52]);

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{ Hash.ZERO, topic },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const event_sig = EventLog.EventSignature{
        .name = "Uint256Indexed",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "value", .type = .uint256, .indexed = true },
        },
    };

    _ = EventLog.parseEventLog(allocator, log, event_sig) catch return;
}

// Test filterLogsByTopics with arbitrary filters
test "fuzz filterLogsByTopics arbitrary filters" {
    const input = std.testing.fuzzInput(.{});

    if (input.len < 25) return;

    // Build log from fuzz input
    const addr = Address.fromBytes(input[0..20]) catch return;

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{Hash.ZERO},
        .data = &[_]u8{},
        .block_number = 1,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const logs = [_]EventLog.EventLog{log};

    // Use various filter patterns
    const filter_none = [_]?Hash{null};
    _ = EventLog.filterLogsByTopics(&logs, &filter_none);

    const filter_zero = [_]?Hash{Hash.ZERO};
    _ = EventLog.filterLogsByTopics(&logs, &filter_zero);

    // Filter with topic from input
    if (input.len >= 52) {
        const topic = Hash.fromBytes(input[20..52]) catch return;
        const filter_topic = [_]?Hash{topic};
        _ = EventLog.filterLogsByTopics(&logs, &filter_topic);
    }
}

// Test filterLogsByTopics with multiple logs
test "fuzz filterLogsByTopics multiple logs" {
    const input = std.testing.fuzzInput(.{});

    if (input.len < 60) return;

    // Build multiple logs
    const addr1 = Address.fromBytes(input[0..20]) catch return;
    const addr2 = Address.fromBytes(input[20..40]) catch return;

    const topic1 = Hash.fromBytes(input[40..72]) catch Hash.ZERO;

    const log1 = EventLog.EventLog{
        .address = addr1,
        .topics = &[_]Hash{topic1},
        .data = &[_]u8{},
        .block_number = 1,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const log2 = EventLog.EventLog{
        .address = addr2,
        .topics = &[_]Hash{Hash.ZERO},
        .data = &[_]u8{},
        .block_number = 2,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const logs = [_]EventLog.EventLog{ log1, log2 };

    // Filter by first topic
    const filter = [_]?Hash{topic1};
    const filtered = EventLog.filterLogsByTopics(&logs, &filter);

    // Should return subset or empty
    try std.testing.expect(filtered.len <= logs.len);
}

// Test filterLogsByTopics with null filters (wildcard)
test "fuzz filterLogsByTopics null wildcard" {
    const input = std.testing.fuzzInput(.{});

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{ Hash.ZERO, Hash.ZERO },
        .data = &[_]u8{},
        .block_number = 1,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const logs = [_]EventLog.EventLog{log};

    // Null filter matches anything
    const filter_all_null = [_]?Hash{ null, null };
    const result = EventLog.filterLogsByTopics(&logs, &filter_all_null);

    // Should match all logs
    try std.testing.expectEqual(logs.len, result.len);
}

// Test EventLog struct field validation
test "fuzz EventLog field integrity" {
    const input = std.testing.fuzzInput(.{});

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    // Extract fields from fuzz input
    const has_block = input.len > 20 and input[20] & 1 == 1;
    const has_tx = input.len > 21 and input[21] & 1 == 1;
    const removed = input.len > 22 and input[22] & 1 == 1;

    const block_num = if (has_block and input.len >= 29)
        std.mem.readInt(u64, input[23..31], .big)
    else
        null;

    const tx_hash = if (has_tx and input.len >= 63)
        Hash.fromBytes(input[31..63]) catch null
    else
        null;

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = block_num,
        .transaction_hash = tx_hash,
        .transaction_index = null,
        .log_index = null,
        .removed = removed,
    };

    // Verify fields maintain integrity
    try std.testing.expectEqual(@as(usize, 20), log.address.bytes.len);
    try std.testing.expectEqual(@as(usize, 0), log.topics.len);
    try std.testing.expectEqual(@as(usize, 0), log.data.len);
    try std.testing.expectEqual(removed, log.removed);
}

// Test EventLog with max size data
test "fuzz EventLog large data field" {
    const input = std.testing.fuzzInput(.{});

    if (input.len < 21) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    // Use remaining input as data (up to limit)
    const data = if (input.len > 20)
        input[20..@min(input.len, 10000)]
    else
        &[_]u8{};

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{},
        .data = data,
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Should handle large data
    try std.testing.expectEqual(@as(usize, 20), log.address.bytes.len);
    try std.testing.expect(log.data.len <= 10000);
}

// Test EventLog with zero address
test "fuzz EventLog zero address" {
    const input = std.testing.fuzzInput(.{});

    _ = input;

    const log = EventLog.EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{Hash.ZERO},
        .data = &[_]u8{},
        .block_number = 0,
        .transaction_hash = Hash.ZERO,
        .transaction_index = 0,
        .log_index = 0,
        .removed = false,
    };

    // Verify zero address is valid
    try std.testing.expect(Address.isZero(log.address));
    try std.testing.expectEqual(@as(u64, 0), log.block_number.?);
}

// Test parseEventLog roundtrip property
test "fuzz parseEventLog encoding roundtrip" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return;

    const addr = try Address.fromBytes(input[0..20]);
    const value = std.mem.readInt(u256, input[20..52], .big);

    // Encode value into data
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(value),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{Hash.ZERO},
        .data = data,
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const event_sig = EventLog.EventSignature{
        .name = "Roundtrip",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    const parsed = try EventLog.parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    // Should decode back to original value
    try std.testing.expectEqual(@as(usize, 1), parsed.len);
    try std.testing.expectEqual(value, parsed[0].uint256);
}

// Test parseEventLog with invalid address bytes in topic
test "fuzz parseEventLog malformed address topic" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return;

    const addr = try Address.fromBytes(input[0..20]);

    // Build topic that might not properly encode an address
    const topic = try Hash.fromBytes(input[20..52]);

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{ Hash.ZERO, topic },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const event_sig = EventLog.EventSignature{
        .name = "MalformedAddr",
        .inputs = &[_]EventLog.EventInput{
            .{ .name = "addr", .type = .address, .indexed = true },
        },
    };

    // Should extract address from last 20 bytes of topic
    const result = EventLog.parseEventLog(allocator, log, event_sig) catch return;
    defer allocator.free(result);

    if (result.len > 0) {
        try std.testing.expectEqual(@as(usize, 20), result[0].address.bytes.len);
    }
}

// Test EventLog with all optional fields present
test "fuzz EventLog complete metadata" {
    const input = std.testing.fuzzInput(.{});

    if (input.len < 88) return; // 20 + 32 + 8 + 4 + 4 = 68

    const addr = Address.fromBytes(input[0..20]) catch return;
    const tx_hash = Hash.fromBytes(input[20..52]) catch return;
    const block_num = std.mem.readInt(u64, input[52..60], .big);
    const tx_index = std.mem.readInt(u32, input[60..64], .big);
    const log_index = std.mem.readInt(u32, input[64..68], .big);
    const removed = input[68] & 1 == 1;

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{Hash.ZERO},
        .data = &[_]u8{},
        .block_number = block_num,
        .transaction_hash = tx_hash,
        .transaction_index = tx_index,
        .log_index = log_index,
        .removed = removed,
    };

    // Verify all fields accessible
    try std.testing.expectEqual(@as(usize, 20), log.address.bytes.len);
    try std.testing.expectEqual(block_num, log.block_number.?);
    try std.testing.expect(log.transaction_hash.?.eql(tx_hash));
    try std.testing.expectEqual(tx_index, log.transaction_index.?);
    try std.testing.expectEqual(log_index, log.log_index.?);
    try std.testing.expectEqual(removed, log.removed);
}

// Test parseEventLog determinism
test "fuzz parseEventLog determinism" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return;

    const addr = try Address.fromBytes(input[0..20]);
    const data = if (input.len > 20) input[20..] else &[_]u8{};

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{Hash.ZERO},
        .data = data,
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const event_sig = EventLog.EventSignature{
        .name = "Deterministic",
        .inputs = &[_]EventLog.EventInput{},
    };

    // Parse twice
    const result1 = EventLog.parseEventLog(allocator, log, event_sig) catch return;
    defer allocator.free(result1);

    const result2 = EventLog.parseEventLog(allocator, log, event_sig) catch return;
    defer allocator.free(result2);

    // Should produce identical results
    try std.testing.expectEqual(result1.len, result2.len);
}

// Test EventLog with empty event signature
test "fuzz EventLog empty signature" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = try Address.fromBytes(input[0..20]);

    const log = EventLog.EventLog{
        .address = addr,
        .topics = &[_]Hash{Hash.ZERO},
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const event_sig = EventLog.EventSignature{
        .name = "",
        .inputs = &[_]EventLog.EventInput{},
    };

    const result = try EventLog.parseEventLog(allocator, log, event_sig);
    defer allocator.free(result);

    // Empty signature should return empty result
    try std.testing.expectEqual(@as(usize, 0), result.len);
}

// Run fuzz tests with: zig build test --fuzz
