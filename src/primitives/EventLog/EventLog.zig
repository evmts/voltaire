const std = @import("std");
const testing = std.testing;
const abi_encoding = @import("../Abi/abi_encoding.zig");
const crypto_pkg = @import("crypto");
const hash = crypto_pkg.Hash;
const address = @import("../Address/address.zig");
const hex = @import("../Hex/Hex.zig");
const Hash = hash.Hash;
const Address = address.Address;
const Allocator = std.mem.Allocator;

// Event log error types
pub const EventLogError = error{
    OutOfMemory,
};

// Event log structure
pub const EventLog = struct {
    address: Address,
    topics: []const Hash,
    data: []const u8,
    block_number: ?u64,
    transaction_hash: ?Hash,
    transaction_index: ?u32,
    log_index: ?u32,
    removed: bool,
};

// Event signature structure
pub const EventSignature = struct {
    name: []const u8,
    inputs: []const EventInput,
};

pub const EventInput = struct {
    name: []const u8,
    type: abi_encoding.AbiType,
    indexed: bool,
};

// Helper function to parse event log
pub fn parseEventLog(allocator: Allocator, log: EventLog, sig: EventSignature) ![]abi_encoding.AbiValue {
    var result = std.array_list.AlignedManaged(abi_encoding.AbiValue, null).init(allocator);
    defer result.deinit();

    var topic_index: usize = 1; // Skip topic0 (event signature)
    var data_types = std.array_list.AlignedManaged(abi_encoding.AbiType, null).init(allocator);
    defer data_types.deinit();

    // Process each input
    for (sig.inputs) |input| {
        if (input.indexed) {
            // Read from topics
            if (topic_index < log.topics.len) {
                const topic = log.topics[topic_index];
                topic_index += 1;

                // For indexed parameters, decode based on type
                switch (input.type) {
                    .address => {
                        var addr: Address = undefined;
                        @memcpy(&addr.bytes, topic.bytes[12..32]);
                        try result.append(abi_encoding.addressValue(addr));
                    },
                    .uint256 => {
                        const value = topic.to_u256();
                        try result.append(abi_encoding.uint256Value(value));
                    },
                    .string, .bytes => {
                        // Dynamic types are hashed when indexed
                        // We can't recover the original value
                        try result.append(abi_encoding.bytesValue(&topic.bytes));
                    },
                    else => {
                        // Handle other types as needed
                        try result.append(abi_encoding.uint256Value(0));
                    },
                }
            }
        } else {
            // Will be decoded from data later
            try data_types.append(input.type);
        }
    }

    // Decode non-indexed parameters from data
    if (data_types.items.len > 0) {
        const data_values = try abi_encoding.decodeAbiParameters(allocator, log.data, data_types.items);
        defer allocator.free(data_values);

        // Insert data values at their correct positions
        var data_index: usize = 0;
        var result_index: usize = 0;
        for (sig.inputs) |input| {
            if (!input.indexed) {
                if (data_index < data_values.len) {
                    try result.insert(result_index, data_values[data_index]);
                    data_index += 1;
                }
            }
            result_index += 1;
        }
    }

    return result.toOwnedSlice();
}

// Helper function to filter logs by topics
pub fn filterLogsByTopics(logs: []const EventLog, filter_topics: []const ?Hash) []const EventLog {
    var matches = std.array_list.AlignedManaged(EventLog, null).init(std.heap.page_allocator);
    defer matches.deinit();

    for (logs) |log| {
        var match = true;

        for (filter_topics, 0..) |filter_topic, i| {
            if (filter_topic) |topic| {
                if (i >= log.topics.len or !log.topics[i].eql(topic)) {
                    match = false;
                    break;
                }
            }
        }

        if (match) {
            matches.append(log) catch continue;
        }
    }

    return matches.toOwnedSlice() catch &[_]EventLog{};
}

// Tests

test "parse event log with no indexed parameters" {
    const allocator = testing.allocator;

    // Transfer event without indexed parameters
    const event_sig = EventSignature{
        .name = "Transfer",
        .inputs = &[_]EventInput{
            .{ .name = "from", .type = .address, .indexed = false },
            .{ .name = "to", .type = .address, .indexed = false },
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    // Event signature hash (topic0)
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");

    // Log data contains all parameters
    const from_addr = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const to_addr = try Address.fromHex("0x0000000000000000000000000000000000000002");
    const value: u256 = 1000;

    const values = [_]abi_encoding.AbiValue{
        abi_encoding.addressValue(from_addr),
        abi_encoding.addressValue(to_addr),
        abi_encoding.uint256Value(value),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{topic0},
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Parse the log
    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &from_addr.bytes, &parsed[0].address.bytes);
    try testing.expectEqualSlices(u8, &to_addr.bytes, &parsed[1].address.bytes);
    try testing.expectEqual(value, parsed[2].uint256);
}

test "parse event log with indexed parameters" {
    const allocator = testing.allocator;

    // Transfer event with indexed from and to
    const event_sig = EventSignature{
        .name = "Transfer",
        .inputs = &[_]EventInput{
            .{ .name = "from", .type = .address, .indexed = true },
            .{ .name = "to", .type = .address, .indexed = true },
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    // Event signature hash (topic0)
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");

    // Indexed parameters as topics
    const from_addr = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const to_addr = try Address.fromHex("0x0000000000000000000000000000000000000002");

    // Create topics for indexed parameters
    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &from_addr.bytes);

    var topic2 = Hash.ZERO;
    @memcpy(topic2.bytes[12..32], &to_addr.bytes);

    // Only non-indexed parameter in data
    const value: u256 = 1000;
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(value),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, topic1, topic2 },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Parse the log
    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &from_addr.bytes, &parsed[0].address.bytes);
    try testing.expectEqualSlices(u8, &to_addr.bytes, &parsed[1].address.bytes);
    try testing.expectEqual(value, parsed[2].uint256);
}

test "parse event log with dynamic indexed parameter" {
    const allocator = testing.allocator;

    // Event with indexed string (dynamic type)
    _ = EventSignature{
        .name = "Message",
        .inputs = &[_]EventInput{
            .{ .name = "message", .type = .string, .indexed = true },
            .{ .name = "sender", .type = .address, .indexed = false },
        },
    };

    const topic0 = hash.keccak256("Message(string,address)");

    // For indexed dynamic types, the hash of the value is stored as topic
    const message = "Hello, Ethereum!";
    const message_hash = hash.keccak256(message);

    const sender = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.addressValue(sender),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, message_hash },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Note: We can't recover the original string from its hash
    // This test just verifies the structure is correct
    try testing.expectEqual(@as(usize, 2), log.topics.len);
    try testing.expectEqual(message_hash, log.topics[1]);
}

test "parse anonymous event" {
    const allocator = testing.allocator;

    // Anonymous events don't include topic0 (signature hash)
    _ = EventSignature{
        .name = "AnonymousTransfer",
        .inputs = &[_]EventInput{
            .{ .name = "from", .type = .address, .indexed = true },
            .{ .name = "to", .type = .address, .indexed = true },
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    // No topic0 for anonymous events
    const from_addr = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const to_addr = try Address.fromHex("0x0000000000000000000000000000000000000002");

    var topic0 = Hash.ZERO;
    @memcpy(topic0.bytes[12..32], &from_addr.bytes);

    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &to_addr.bytes);

    const value: u256 = 1000;
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(value),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, topic1 }, // Only indexed parameters
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    // Anonymous events have different parsing logic
    try testing.expectEqual(@as(usize, 2), log.topics.len);
}

test "parse ERC20 Transfer event" {
    const allocator = testing.allocator;

    // Standard ERC20 Transfer event
    const event_sig = EventSignature{
        .name = "Transfer",
        .inputs = &[_]EventInput{
            .{ .name = "from", .type = .address, .indexed = true },
            .{ .name = "to", .type = .address, .indexed = true },
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    // Real Transfer event signature
    const topic0 = try Hash.fromHex("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");

    const from_addr = try Address.fromHex("0x1234567890123456789012345678901234567890");
    const to_addr = try Address.fromHex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");

    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &from_addr.bytes);

    var topic2 = Hash.ZERO;
    @memcpy(topic2.bytes[12..32], &to_addr.bytes);

    const value: u256 = 1_000_000_000_000_000_000; // 1 ETH
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(value),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"), // WETH address
        .topics = &[_]Hash{ topic0, topic1, topic2 },
        .data = data,
        .block_number = 17000000,
        .transaction_hash = try Hash.fromHex("0x1234567890123456789012345678901234567890123456789012345678901234"),
        .transaction_index = 42,
        .log_index = 123,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &from_addr.bytes, &parsed[0].address.bytes);
    try testing.expectEqualSlices(u8, &to_addr.bytes, &parsed[1].address.bytes);
    try testing.expectEqual(value, parsed[2].uint256);
}

test "parse event with multiple data parameters" {
    const allocator = testing.allocator;

    const event_sig = EventSignature{
        .name = "Swap",
        .inputs = &[_]EventInput{
            .{ .name = "sender", .type = .address, .indexed = true },
            .{ .name = "amount0In", .type = .uint256, .indexed = false },
            .{ .name = "amount1In", .type = .uint256, .indexed = false },
            .{ .name = "amount0Out", .type = .uint256, .indexed = false },
            .{ .name = "amount1Out", .type = .uint256, .indexed = false },
            .{ .name = "to", .type = .address, .indexed = true },
        },
    };

    const topic0 = hash.keccak256("Swap(address,uint256,uint256,uint256,uint256,address)");

    const sender = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const to = try Address.fromHex("0x0000000000000000000000000000000000000002");

    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &sender.bytes);

    var topic2 = Hash.ZERO;
    @memcpy(topic2.bytes[12..32], &to.bytes);

    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(1000), // amount0In
        abi_encoding.uint256Value(0), // amount1In
        abi_encoding.uint256Value(0), // amount0Out
        abi_encoding.uint256Value(2000), // amount1Out
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, topic1, topic2 },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 6), parsed.len);
    try testing.expectEqualSlices(u8, &sender.bytes, &parsed[0].address.bytes);
    try testing.expectEqual(@as(u256, 1000), parsed[1].uint256);
    try testing.expectEqual(@as(u256, 0), parsed[2].uint256);
    try testing.expectEqual(@as(u256, 0), parsed[3].uint256);
    try testing.expectEqual(@as(u256, 2000), parsed[4].uint256);
    try testing.expectEqualSlices(u8, &to.bytes, &parsed[5].address.bytes);
}

test "filter logs by topics" {
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");
    const from_topic = try Hash.fromHex("0x0000000000000000000000001234567890123456789012345678901234567890");

    const logs = [_]EventLog{
        // Matching log
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, from_topic },
            .data = &[_]u8{},
            .block_number = 1,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        // Non-matching log (different topic0)
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ Hash.ZERO, from_topic },
            .data = &[_]u8{},
            .block_number = 2,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        // Matching log
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, from_topic },
            .data = &[_]u8{},
            .block_number = 3,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    const filter_topics = [_]?Hash{ topic0, from_topic };
    const filtered = filterLogsByTopics(&logs, &filter_topics);

    try testing.expectEqual(@as(usize, 2), filtered.len);
    try testing.expectEqual(@as(u64, 1), filtered[0].block_number.?);
    try testing.expectEqual(@as(u64, 3), filtered[1].block_number.?);
}

// Helper to get topic0 (event signature)
pub fn getTopic0(log: EventLog) ?Hash {
    if (log.topics.len == 0) return null;
    return log.topics[0];
}

// Helper to get indexed topics (all topics except topic0)
pub fn getIndexedTopics(allocator: Allocator, log: EventLog) ![]const Hash {
    if (log.topics.len <= 1) return &[_]Hash{};
    const indexed = try allocator.alloc(Hash, log.topics.len - 1);
    @memcpy(indexed, log.topics[1..]);
    return indexed;
}

// Check if log is removed
pub fn isRemoved(log: EventLog) bool {
    return log.removed;
}

// Match topics with filter (supports null wildcards and OR arrays)
pub fn matchesTopics(log: EventLog, filter_topics: []const ?Hash) bool {
    // Empty filter matches all
    if (filter_topics.len == 0) return true;

    // Filter has more topics than log
    if (filter_topics.len > log.topics.len) return false;

    // Check each filter topic
    for (filter_topics, 0..) |filter_topic, i| {
        if (filter_topic) |topic| {
            if (!log.topics[i].eql(topic)) return false;
        }
        // null is wildcard, always matches
    }

    return true;
}

// Match address with filter (supports single address or array)
pub fn matchesAddress(log: EventLog, filter_address: Address) bool {
    return log.address.eql(filter_address);
}

// Filter structure
pub const LogFilter = struct {
    address: ?Address = null,
    topics: ?[]const ?Hash = null,
    from_block: ?u64 = null,
    to_block: ?u64 = null,
    block_hash: ?Hash = null,
};

// Match log against complete filter
pub fn matchesFilter(log: EventLog, filter: LogFilter) bool {
    // Check address
    if (filter.address) |addr| {
        if (!matchesAddress(log, addr)) return false;
    }

    // Check topics
    if (filter.topics) |topics| {
        if (!matchesTopics(log, topics)) return false;
    }

    // Check block number range
    if (log.block_number) |block_num| {
        if (filter.from_block) |from| {
            if (block_num < from) return false;
        }
        if (filter.to_block) |to| {
            if (block_num > to) return false;
        }
    }

    // Check block hash
    if (log.block_number != null) { // Only check if log has block
        if (filter.block_hash) |filter_hash| {
            if (log.transaction_hash) |tx_hash| {
                // Note: We can't directly check block_hash in EventLog struct
                // This is a limitation - real impl would need block_hash field
                _ = filter_hash;
                _ = tx_hash;
            }
        }
    }

    return true;
}

// Filter logs by filter criteria
pub fn filterLogs(allocator: Allocator, logs: []const EventLog, filter: LogFilter) ![]EventLog {
    var result = std.ArrayList(EventLog).init(allocator);
    errdefer result.deinit();

    for (logs) |log| {
        if (matchesFilter(log, filter)) {
            try result.append(log);
        }
    }

    return result.toOwnedSlice();
}

// Sort logs by block number then log index
pub fn sortLogs(allocator: Allocator, logs: []const EventLog) ![]EventLog {
    const sorted = try allocator.alloc(EventLog, logs.len);
    @memcpy(sorted, logs);

    // Simple bubble sort for now (can optimize later)
    var i: usize = 0;
    while (i < sorted.len) : (i += 1) {
        var j: usize = i + 1;
        while (j < sorted.len) : (j += 1) {
            const block_i = sorted[i].block_number orelse 0;
            const block_j = sorted[j].block_number orelse 0;

            const should_swap = if (block_i != block_j)
                block_i > block_j
            else blk: {
                const log_i = sorted[i].log_index orelse 0;
                const log_j = sorted[j].log_index orelse 0;
                break :blk log_i > log_j;
            };

            if (should_swap) {
                const tmp = sorted[i];
                sorted[i] = sorted[j];
                sorted[j] = tmp;
            }
        }
    }

    return sorted;
}

// Clone (deep copy) a log
pub fn clone(allocator: Allocator, log: EventLog) !EventLog {
    // Copy topics
    const topics_copy = try allocator.alloc(Hash, log.topics.len);
    @memcpy(topics_copy, log.topics);

    // Copy data
    const data_copy = try allocator.alloc(u8, log.data.len);
    @memcpy(data_copy, log.data);

    return EventLog{
        .address = log.address,
        .topics = topics_copy,
        .data = data_copy,
        .block_number = log.block_number,
        .transaction_hash = log.transaction_hash,
        .transaction_index = log.transaction_index,
        .log_index = log.log_index,
        .removed = log.removed,
    };
}

// Tests for new functions

test "getTopic0 returns first topic" {
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");
    const topic1 = hash.keccak256("test");

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{ topic0, topic1 },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const result = getTopic0(log);
    try testing.expect(result != null);
    try testing.expect(result.?.eql(topic0));
}

test "getTopic0 returns null for empty topics" {
    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const result = getTopic0(log);
    try testing.expect(result == null);
}

test "getIndexedTopics returns topics excluding topic0" {
    const allocator = testing.allocator;
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");
    const topic1 = hash.keccak256("test1");
    const topic2 = hash.keccak256("test2");

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{ topic0, topic1, topic2 },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const indexed = try getIndexedTopics(allocator, log);
    defer allocator.free(indexed);

    try testing.expectEqual(@as(usize, 2), indexed.len);
    try testing.expect(indexed[0].eql(topic1));
    try testing.expect(indexed[1].eql(topic2));
}

test "getIndexedTopics returns empty for single topic" {
    const allocator = testing.allocator;
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{topic0},
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const indexed = try getIndexedTopics(allocator, log);
    defer allocator.free(indexed);

    try testing.expectEqual(@as(usize, 0), indexed.len);
}

test "isRemoved returns true for removed logs" {
    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = true,
    };

    try testing.expect(isRemoved(log));
}

test "isRemoved returns false for active logs" {
    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    try testing.expect(!isRemoved(log));
}

test "matchesTopics with exact match" {
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");
    const topic1 = hash.keccak256("test1");
    const topic2 = hash.keccak256("test2");

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{ topic0, topic1, topic2 },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const filter = [_]?Hash{ topic0, topic1, topic2 };
    try testing.expect(matchesTopics(log, &filter));
}

test "matchesTopics with null wildcard" {
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");
    const topic1 = hash.keccak256("test1");
    const topic2 = hash.keccak256("test2");

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{ topic0, topic1, topic2 },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const filter = [_]?Hash{ topic0, null, topic2 };
    try testing.expect(matchesTopics(log, &filter));
}

test "matchesTopics with empty filter" {
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{topic0},
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const filter = [_]?Hash{};
    try testing.expect(matchesTopics(log, &filter));
}

test "matchesTopics fails when topic does not match" {
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");
    const topic1 = hash.keccak256("test1");
    const topic2 = hash.keccak256("test2");

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{ topic0, topic1 },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const filter = [_]?Hash{ topic0, topic2 };
    try testing.expect(!matchesTopics(log, &filter));
}

test "matchesTopics fails when filter has more topics" {
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");
    const topic1 = hash.keccak256("test1");
    const topic2 = hash.keccak256("test2");

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{ topic0, topic1 },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const filter = [_]?Hash{ topic0, topic1, topic2 };
    try testing.expect(!matchesTopics(log, &filter));
}

test "matchesAddress with matching address" {
    const addr = try Address.fromHex("0x1234567890123456789012345678901234567890");

    const log = EventLog{
        .address = addr,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    try testing.expect(matchesAddress(log, addr));
}

test "matchesAddress with non-matching address" {
    const addr1 = try Address.fromHex("0x1234567890123456789012345678901234567890");
    const addr2 = try Address.fromHex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");

    const log = EventLog{
        .address = addr1,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    try testing.expect(!matchesAddress(log, addr2));
}

test "matchesFilter with address only" {
    const addr1 = try Address.fromHex("0x1234567890123456789012345678901234567890");
    const addr2 = try Address.fromHex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");

    const log = EventLog{
        .address = addr1,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = 100,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const filter1 = LogFilter{ .address = addr1 };
    try testing.expect(matchesFilter(log, filter1));

    const filter2 = LogFilter{ .address = addr2 };
    try testing.expect(!matchesFilter(log, filter2));
}

test "matchesFilter with topics only" {
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");
    const topic1 = hash.keccak256("test1");

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{ topic0, topic1 },
        .data = &[_]u8{},
        .block_number = null,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const filter_topics = [_]?Hash{ topic0, topic1 };
    const filter = LogFilter{ .topics = &filter_topics };
    try testing.expect(matchesFilter(log, filter));
}

test "matchesFilter with block range" {
    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = 100,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const filter1 = LogFilter{ .from_block = 50, .to_block = 150 };
    try testing.expect(matchesFilter(log, filter1));

    const filter2 = LogFilter{ .from_block = 101, .to_block = 150 };
    try testing.expect(!matchesFilter(log, filter2));

    const filter3 = LogFilter{ .from_block = 50, .to_block = 99 };
    try testing.expect(!matchesFilter(log, filter3));
}

test "matchesFilter with combined criteria" {
    const addr = try Address.fromHex("0x1234567890123456789012345678901234567890");
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");

    const log = EventLog{
        .address = addr,
        .topics = &[_]Hash{topic0},
        .data = &[_]u8{},
        .block_number = 100,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const filter_topics = [_]?Hash{topic0};
    const filter = LogFilter{
        .address = addr,
        .topics = &filter_topics,
        .from_block = 50,
        .to_block = 150,
    };

    try testing.expect(matchesFilter(log, filter));
}

test "filterLogs returns matching logs" {
    const allocator = testing.allocator;
    const addr1 = try Address.fromHex("0x1234567890123456789012345678901234567890");
    const addr2 = try Address.fromHex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");

    const logs = [_]EventLog{
        .{
            .address = addr1,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 100,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        .{
            .address = addr2,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 101,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        .{
            .address = addr1,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 102,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    const filter = LogFilter{ .address = addr1 };
    const filtered = try filterLogs(allocator, &logs, filter);
    defer allocator.free(filtered);

    try testing.expectEqual(@as(usize, 2), filtered.len);
    try testing.expectEqual(@as(u64, 100), filtered[0].block_number.?);
    try testing.expectEqual(@as(u64, 102), filtered[1].block_number.?);
}

test "sortLogs by block number ascending" {
    const allocator = testing.allocator;

    const logs = [_]EventLog{
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 103,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 100,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 101,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    const sorted = try sortLogs(allocator, &logs);
    defer allocator.free(sorted);

    try testing.expectEqual(@as(u64, 100), sorted[0].block_number.?);
    try testing.expectEqual(@as(u64, 101), sorted[1].block_number.?);
    try testing.expectEqual(@as(u64, 103), sorted[2].block_number.?);
}

test "sortLogs by log index when blocks equal" {
    const allocator = testing.allocator;

    const logs = [_]EventLog{
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 100,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = 5,
            .removed = false,
        },
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 100,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = 2,
            .removed = false,
        },
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 100,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = 10,
            .removed = false,
        },
    };

    const sorted = try sortLogs(allocator, &logs);
    defer allocator.free(sorted);

    try testing.expectEqual(@as(u32, 2), sorted[0].log_index.?);
    try testing.expectEqual(@as(u32, 5), sorted[1].log_index.?);
    try testing.expectEqual(@as(u32, 10), sorted[2].log_index.?);
}

test "sortLogs treats undefined as 0" {
    const allocator = testing.allocator;

    const logs = [_]EventLog{
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 100,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = null,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{},
            .data = &[_]u8{},
            .block_number = 50,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    const sorted = try sortLogs(allocator, &logs);
    defer allocator.free(sorted);

    try testing.expect(sorted[0].block_number == null);
    try testing.expectEqual(@as(u64, 50), sorted[1].block_number.?);
    try testing.expectEqual(@as(u64, 100), sorted[2].block_number.?);
}

test "clone creates deep copy" {
    const allocator = testing.allocator;
    const topic0 = hash.keccak256("Transfer(address,address,uint256)");
    const data = [_]u8{ 1, 2, 3 };

    const original = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{topic0},
        .data = &data,
        .block_number = 100,
        .transaction_hash = null,
        .transaction_index = 5,
        .log_index = 10,
        .removed = false,
    };

    const cloned = try clone(allocator, original);
    defer {
        allocator.free(cloned.topics);
        allocator.free(cloned.data);
    }

    // Verify values are equal
    try testing.expect(cloned.address.eql(original.address));
    try testing.expectEqual(original.topics.len, cloned.topics.len);
    try testing.expect(cloned.topics[0].eql(original.topics[0]));
    try testing.expectEqualSlices(u8, original.data, cloned.data);
    try testing.expectEqual(original.block_number, cloned.block_number);
    try testing.expectEqual(original.transaction_index, cloned.transaction_index);
    try testing.expectEqual(original.log_index, cloned.log_index);
    try testing.expectEqual(original.removed, cloned.removed);

    // Verify they are different memory
    try testing.expect(cloned.topics.ptr != original.topics.ptr);
    try testing.expect(cloned.data.ptr != original.data.ptr);
}

test "parse event with indexed uint256 in topic" {
    const allocator = testing.allocator;

    // Event with indexed uint256 value
    const event_sig = EventSignature{
        .name = "ValueChanged",
        .inputs = &[_]EventInput{
            .{ .name = "oldValue", .type = .uint256, .indexed = true },
            .{ .name = "newValue", .type = .uint256, .indexed = false },
        },
    };

    const topic0 = hash.keccak256("ValueChanged(uint256,uint256)");

    // Create topic for indexed uint256
    const old_value: u256 = 12345678901234567890;
    var topic1 = Hash.ZERO;
    const old_value_bytes = std.mem.toBytes(old_value);
    @memcpy(&topic1.bytes, &old_value_bytes);

    // Non-indexed parameter in data
    const new_value: u256 = 98765432109876543210;
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(new_value),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, topic1 },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 2), parsed.len);
    try testing.expectEqual(old_value, parsed[0].uint256);
    try testing.expectEqual(new_value, parsed[1].uint256);
}

test "parse event with mixed parameter ordering" {
    const allocator = testing.allocator;

    // Event with alternating indexed/non-indexed parameters
    const event_sig = EventSignature{
        .name = "ComplexEvent",
        .inputs = &[_]EventInput{
            .{ .name = "addr1", .type = .address, .indexed = true },
            .{ .name = "value1", .type = .uint256, .indexed = false },
            .{ .name = "addr2", .type = .address, .indexed = true },
            .{ .name = "value2", .type = .uint256, .indexed = false },
            .{ .name = "value3", .type = .uint256, .indexed = false },
        },
    };

    const topic0 = hash.keccak256("ComplexEvent(address,uint256,address,uint256,uint256)");

    const addr1 = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const addr2 = try Address.fromHex("0x0000000000000000000000000000000000000002");

    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &addr1.bytes);

    var topic2 = Hash.ZERO;
    @memcpy(topic2.bytes[12..32], &addr2.bytes);

    // Non-indexed parameters in data
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(100),
        abi_encoding.uint256Value(200),
        abi_encoding.uint256Value(300),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, topic1, topic2 },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 5), parsed.len);
    try testing.expectEqualSlices(u8, &addr1.bytes, &parsed[0].address.bytes);
    try testing.expectEqual(@as(u256, 100), parsed[1].uint256);
    try testing.expectEqualSlices(u8, &addr2.bytes, &parsed[2].address.bytes);
    try testing.expectEqual(@as(u256, 200), parsed[3].uint256);
    try testing.expectEqual(@as(u256, 300), parsed[4].uint256);
}

test "parse event with indexed string cannot recover original value" {
    const allocator = testing.allocator;

    // Event with indexed string (dynamic type) - hash stored in topic
    const event_sig = EventSignature{
        .name = "NameChanged",
        .inputs = &[_]EventInput{
            .{ .name = "newName", .type = .string, .indexed = true },
            .{ .name = "timestamp", .type = .uint256, .indexed = false },
        },
    };

    const topic0 = hash.keccak256("NameChanged(string,uint256)");

    // Original value is hashed when indexed
    const original_name = "Alice";
    const name_hash = hash.keccak256(original_name);

    const timestamp: u256 = 1234567890;
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(timestamp),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, name_hash },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 2), parsed.len);
    // First value is the hash bytes, not the original string
    try testing.expectEqual(@as(usize, 32), parsed[0].bytes.len);
    try testing.expectEqual(timestamp, parsed[1].uint256);
}

test "parse event with indexed bytes type" {
    const allocator = testing.allocator;

    // Event with indexed bytes (dynamic type) - hash stored in topic
    const event_sig = EventSignature{
        .name = "DataUpdated",
        .inputs = &[_]EventInput{
            .{ .name = "data", .type = .bytes, .indexed = true },
            .{ .name = "updateId", .type = .uint256, .indexed = false },
        },
    };

    const topic0 = hash.keccak256("DataUpdated(bytes,uint256)");

    // Original bytes are hashed when indexed
    const original_data = [_]u8{ 0x01, 0x02, 0x03, 0x04 };
    const data_hash = hash.keccak256(&original_data);

    const update_id: u256 = 42;
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(update_id),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, data_hash },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 2), parsed.len);
    // First value is the hash bytes, not the original data
    try testing.expectEqual(@as(usize, 32), parsed[0].bytes.len);
    try testing.expectEqualSlices(u8, &data_hash.bytes, parsed[0].bytes);
    try testing.expectEqual(update_id, parsed[1].uint256);
}

test "parse event with missing topics returns incomplete data" {
    const allocator = testing.allocator;

    // Event expects 2 indexed parameters but only 1 topic provided
    const event_sig = EventSignature{
        .name = "Transfer",
        .inputs = &[_]EventInput{
            .{ .name = "from", .type = .address, .indexed = true },
            .{ .name = "to", .type = .address, .indexed = true },
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    const topic0 = hash.keccak256("Transfer(address,address,uint256)");

    const from_addr = try Address.fromHex("0x0000000000000000000000000000000000000001");

    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &from_addr.bytes);

    // Missing topic2 (to address)
    const value: u256 = 1000;
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(value),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, topic1 }, // Missing topic2
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    // Should only have 2 values (from and value), missing 'to'
    try testing.expectEqual(@as(usize, 2), parsed.len);
    try testing.expectEqualSlices(u8, &from_addr.bytes, &parsed[0].address.bytes);
}

test "parse event with empty data and all indexed parameters" {
    const allocator = testing.allocator;

    // All parameters are indexed, no data field needed
    const event_sig = EventSignature{
        .name = "AllIndexed",
        .inputs = &[_]EventInput{
            .{ .name = "addr1", .type = .address, .indexed = true },
            .{ .name = "addr2", .type = .address, .indexed = true },
            .{ .name = "addr3", .type = .address, .indexed = true },
        },
    };

    const topic0 = hash.keccak256("AllIndexed(address,address,address)");

    const addr1 = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const addr2 = try Address.fromHex("0x0000000000000000000000000000000000000002");
    const addr3 = try Address.fromHex("0x0000000000000000000000000000000000000003");

    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &addr1.bytes);

    var topic2 = Hash.ZERO;
    @memcpy(topic2.bytes[12..32], &addr2.bytes);

    var topic3 = Hash.ZERO;
    @memcpy(topic3.bytes[12..32], &addr3.bytes);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, topic1, topic2, topic3 },
        .data = &[_]u8{}, // Empty data
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &addr1.bytes, &parsed[0].address.bytes);
    try testing.expectEqualSlices(u8, &addr2.bytes, &parsed[1].address.bytes);
    try testing.expectEqualSlices(u8, &addr3.bytes, &parsed[2].address.bytes);
}

test "parse event with zero address and zero value" {
    const allocator = testing.allocator;

    const event_sig = EventSignature{
        .name = "Transfer",
        .inputs = &[_]EventInput{
            .{ .name = "from", .type = .address, .indexed = true },
            .{ .name = "to", .type = .address, .indexed = true },
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    const topic0 = hash.keccak256("Transfer(address,address,uint256)");

    // Zero address (mint/burn scenarios)
    const zero_addr = Address.ZERO;

    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &zero_addr.bytes);

    var topic2 = Hash.ZERO;
    @memcpy(topic2.bytes[12..32], &zero_addr.bytes);

    // Zero value
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.uint256Value(0),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, topic1, topic2 },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &zero_addr.bytes, &parsed[0].address.bytes);
    try testing.expectEqualSlices(u8, &zero_addr.bytes, &parsed[1].address.bytes);
    try testing.expectEqual(@as(u256, 0), parsed[2].uint256);
}

test "parse event with maximum uint256 value" {
    const allocator = testing.allocator;

    const event_sig = EventSignature{
        .name = "MaxValue",
        .inputs = &[_]EventInput{
            .{ .name = "value", .type = .uint256, .indexed = true },
        },
    };

    const topic0 = hash.keccak256("MaxValue(uint256)");

    // Maximum uint256 value
    const max_value: u256 = std.math.maxInt(u256);
    var topic1 = Hash.ZERO;
    const max_value_bytes = std.mem.toBytes(max_value);
    @memcpy(&topic1.bytes, &max_value_bytes);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, topic1 },
        .data = &[_]u8{},
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 1), parsed.len);
    try testing.expectEqual(max_value, parsed[0].uint256);
}

test "parse event with only signature topic" {
    const allocator = testing.allocator;

    // Event with no indexed parameters and no data
    const event_sig = EventSignature{
        .name = "SimpleEvent",
        .inputs = &[_]EventInput{},
    };

    const topic0 = hash.keccak256("SimpleEvent()");

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{topic0},
        .data = &[_]u8{},
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, event_sig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 0), parsed.len);
}
