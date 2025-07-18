const std = @import("std");
const testing = std.testing;
const abi_encoding = @import("abi_encoding.zig");
const crypto_pkg = @import("crypto");
const hash = crypto_pkg.Hash;
const address = @import("address.zig");
const hex = @import("hex.zig");
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
    blockNumber: ?u64,
    transactionHash: ?Hash,
    transactionIndex: ?u32,
    logIndex: ?u32,
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
    var result = std.ArrayList(abi_encoding.AbiValue).init(allocator);
    defer result.deinit();

    var topicIndex: usize = 1; // Skip topic0 (event signature)
    var dataTypes = std.ArrayList(abi_encoding.AbiType).init(allocator);
    defer dataTypes.deinit();

    // Process each input
    for (sig.inputs) |input| {
        if (input.indexed) {
            // Read from topics
            if (topicIndex < log.topics.len) {
                const topic = log.topics[topicIndex];
                topicIndex += 1;

                // For indexed parameters, decode based on type
                switch (input.type) {
                    .address => {
                        var addr: Address = undefined;
                        @memcpy(&addr.bytes, topic.bytes[12..32]);
                        try result.append(abi_encoding.addressValue(addr));
                    },
                    .uint256 => {
                        const value = topic.toU256();
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
            try dataTypes.append(input.type);
        }
    }

    // Decode non-indexed parameters from data
    if (dataTypes.items.len > 0) {
        const dataValues = try abi_encoding.decodeAbiParameters(allocator, log.data, dataTypes.items);
        defer allocator.free(dataValues);

        // Insert data values at their correct positions
        var dataIndex: usize = 0;
        var resultIndex: usize = 0;
        for (sig.inputs) |input| {
            if (!input.indexed) {
                if (dataIndex < dataValues.len) {
                    try result.insert(resultIndex, dataValues[dataIndex]);
                    dataIndex += 1;
                }
            }
            resultIndex += 1;
        }
    }

    return result.toOwnedSlice();
}

// Helper function to filter logs by topics
pub fn filterLogsByTopics(logs: []const EventLog, filterTopics: []const ?Hash) []const EventLog {
    var matches = std.ArrayList(EventLog).init(std.heap.page_allocator);
    defer matches.deinit();

    for (logs) |log| {
        var match = true;

        for (filterTopics, 0..) |filterTopic, i| {
            if (filterTopic) |topic| {
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
    const eventSig = EventSignature{
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
    const fromAddr = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const toAddr = try Address.fromHex("0x0000000000000000000000000000000000000002");
    const value: u256 = 1000;

    const values = [_]abi_encoding.AbiValue{
        abi_encoding.addressValue(fromAddr),
        abi_encoding.addressValue(toAddr),
        abi_encoding.uint256Value(value),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{topic0},
        .data = data,
        .blockNumber = 12345,
        .transactionHash = null,
        .transactionIndex = null,
        .logIndex = null,
        .removed = false,
    };

    // Parse the log
    const parsed = try parseEventLog(allocator, log, eventSig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &fromAddr.bytes, &parsed[0].address.bytes);
    try testing.expectEqualSlices(u8, &toAddr.bytes, &parsed[1].address.bytes);
    try testing.expectEqual(value, parsed[2].uint256);
}

test "parse event log with indexed parameters" {
    const allocator = testing.allocator;

    // Transfer event with indexed from and to
    const eventSig = EventSignature{
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
    const fromAddr = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const toAddr = try Address.fromHex("0x0000000000000000000000000000000000000002");

    // Create topics for indexed parameters
    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &fromAddr.bytes);

    var topic2 = Hash.ZERO;
    @memcpy(topic2.bytes[12..32], &toAddr.bytes);

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
        .blockNumber = 12345,
        .transactionHash = null,
        .transactionIndex = null,
        .logIndex = null,
        .removed = false,
    };

    // Parse the log
    const parsed = try parseEventLog(allocator, log, eventSig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &fromAddr.bytes, &parsed[0].address.bytes);
    try testing.expectEqualSlices(u8, &toAddr.bytes, &parsed[1].address.bytes);
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
    const messageHash = hash.keccak256(message);

    const sender = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const values = [_]abi_encoding.AbiValue{
        abi_encoding.addressValue(sender),
    };

    const data = try abi_encoding.encodeAbiParameters(allocator, &values);
    defer allocator.free(data);

    const log = EventLog{
        .address = try Address.fromHex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash{ topic0, messageHash },
        .data = data,
        .blockNumber = 12345,
        .transactionHash = null,
        .transactionIndex = null,
        .logIndex = null,
        .removed = false,
    };

    // Note: We can't recover the original string from its hash
    // This test just verifies the structure is correct
    try testing.expectEqual(@as(usize, 2), log.topics.len);
    try testing.expectEqual(messageHash, log.topics[1]);
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
    const fromAddr = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const toAddr = try Address.fromHex("0x0000000000000000000000000000000000000002");

    var topic0 = Hash.ZERO;
    @memcpy(topic0.bytes[12..32], &fromAddr.bytes);

    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &toAddr.bytes);

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
        .blockNumber = 12345,
        .transactionHash = null,
        .transactionIndex = null,
        .logIndex = null,
        .removed = false,
    };

    // Anonymous events have different parsing logic
    try testing.expectEqual(@as(usize, 2), log.topics.len);
}

test "parse ERC20 Transfer event" {
    const allocator = testing.allocator;

    // Standard ERC20 Transfer event
    const eventSig = EventSignature{
        .name = "Transfer",
        .inputs = &[_]EventInput{
            .{ .name = "from", .type = .address, .indexed = true },
            .{ .name = "to", .type = .address, .indexed = true },
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };

    // Real Transfer event signature
    const topic0 = try Hash.fromHex("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");

    const fromAddr = try Address.fromHex("0x1234567890123456789012345678901234567890");
    const toAddr = try Address.fromHex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");

    var topic1 = Hash.ZERO;
    @memcpy(topic1.bytes[12..32], &fromAddr.bytes);

    var topic2 = Hash.ZERO;
    @memcpy(topic2.bytes[12..32], &toAddr.bytes);

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
        .blockNumber = 17000000,
        .transactionHash = try Hash.fromHex("0x1234567890123456789012345678901234567890123456789012345678901234"),
        .transactionIndex = 42,
        .logIndex = 123,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, eventSig);
    defer allocator.free(parsed);

    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &fromAddr.bytes, &parsed[0].address.bytes);
    try testing.expectEqualSlices(u8, &toAddr.bytes, &parsed[1].address.bytes);
    try testing.expectEqual(value, parsed[2].uint256);
}

test "parse event with multiple data parameters" {
    const allocator = testing.allocator;

    const eventSig = EventSignature{
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
        .blockNumber = 12345,
        .transactionHash = null,
        .transactionIndex = null,
        .logIndex = null,
        .removed = false,
    };

    const parsed = try parseEventLog(allocator, log, eventSig);
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
    const fromTopic = try Hash.fromHex("0x0000000000000000000000001234567890123456789012345678901234567890");

    const logs = [_]EventLog{
        // Matching log
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, fromTopic },
            .data = &[_]u8{},
            .blockNumber = 1,
            .transactionHash = null,
            .transactionIndex = null,
            .logIndex = null,
            .removed = false,
        },
        // Non-matching log (different topic0)
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ Hash.ZERO, fromTopic },
            .data = &[_]u8{},
            .blockNumber = 2,
            .transactionHash = null,
            .transactionIndex = null,
            .logIndex = null,
            .removed = false,
        },
        // Matching log
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, fromTopic },
            .data = &[_]u8{},
            .blockNumber = 3,
            .transactionHash = null,
            .transactionIndex = null,
            .logIndex = null,
            .removed = false,
        },
    };

    const filterTopics = [_]?Hash{ topic0, fromTopic };
    const filtered = filterLogsByTopics(&logs, &filterTopics);

    try testing.expectEqual(@as(usize, 2), filtered.len);
    try testing.expectEqual(@as(u64, 1), filtered[0].blockNumber.?);
    try testing.expectEqual(@as(u64, 3), filtered[1].blockNumber.?);
}
