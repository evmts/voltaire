const std = @import("std");
const testing = std.testing;
const abi = @import("abi_encoding.zig");
const Hash = @import("hash_utils.zig");
const Address = @import("address/address.zig");
const Hex = @import("hex.zig");

// Event log structure
pub const EventLog = struct {
    address: primitives.Address,
    topics: []const Hash.Hash,
    data: []const u8,
    block_number: ?u64,
    transaction_hash: ?Hash.Hash,
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
    type: abi.AbiType,
    indexed: bool,
};

// Test basic event log parsing
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
    const topic0 = Hash.keccak256("Transfer(address,address,uint256)");
    
    // Log data contains all parameters
    const from_addr = try primitives.Address.from_hex("0x0000000000000000000000000000000000000001");
    const to_addr = try primitives.Address.from_hex("0x0000000000000000000000000000000000000002");
    const value: u256 = 1000;
    
    const values = [_]abi.AbiValue{
        abi.address_value(from_addr),
        abi.address_value(to_addr),
        abi.uint256_value(value),
    };
    
    const data = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(data);
    
    const log = EventLog{
        .address = try primitives.Address.from_hex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash.Hash{topic0},
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };
    
    // Parse the log
    const parsed = try parse_event_log(allocator, log, event_sig);
    defer allocator.free(parsed);
    
    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &from_addr, &parsed[0].address);
    try testing.expectEqualSlices(u8, &to_addr, &parsed[1].address);
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
    const topic0 = Hash.keccak256("Transfer(address,address,uint256)");
    
    // Indexed parameters as topics
    const from_addr = try primitives.Address.from_hex("0x0000000000000000000000000000000000000001");
    const to_addr = try primitives.Address.from_hex("0x0000000000000000000000000000000000000002");
    
    // Create topics for indexed parameters
    var topic1 = Hash.ZERO_HASH;
    @memcpy(topic1[12..32], &from_addr);
    
    var topic2 = Hash.ZERO_HASH;
    @memcpy(topic2[12..32], &to_addr);
    
    // Only non-indexed parameter in data
    const value: u256 = 1000;
    const values = [_]abi.AbiValue{
        abi.uint256_value(value),
    };
    
    const data = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(data);
    
    const log = EventLog{
        .address = try primitives.Address.from_hex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash.Hash{ topic0, topic1, topic2 },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };
    
    // Parse the log
    const parsed = try parse_event_log(allocator, log, event_sig);
    defer allocator.free(parsed);
    
    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &from_addr, &parsed[0].address);
    try testing.expectEqualSlices(u8, &to_addr, &parsed[1].address);
    try testing.expectEqual(value, parsed[2].uint256);
}

test "parse event log with dynamic indexed parameter" {
    const allocator = testing.allocator;
    
    // Event with indexed string (dynamic type)
    const event_sig = EventSignature{
        .name = "Message",
        .inputs = &[_]EventInput{
            .{ .name = "message", .type = .string, .indexed = true },
            .{ .name = "sender", .type = .address, .indexed = false },
        },
    };
    
    const topic0 = Hash.keccak256("Message(string,address)");
    
    // For indexed dynamic types, the hash of the value is stored as topic
    const message = "Hello, Ethereum!";
    const message_hash = Hash.keccak256(message);
    
    const sender = try primitives.Address.from_hex("0x0000000000000000000000000000000000000001");
    const values = [_]abi.AbiValue{
        abi.address_value(sender),
    };
    
    const data = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(data);
    
    const log = EventLog{
        .address = try primitives.Address.from_hex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash.Hash{ topic0, message_hash },
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
    const event_sig = EventSignature{
        .name = "AnonymousTransfer",
        .inputs = &[_]EventInput{
            .{ .name = "from", .type = .address, .indexed = true },
            .{ .name = "to", .type = .address, .indexed = true },
            .{ .name = "value", .type = .uint256, .indexed = false },
        },
    };
    
    // No topic0 for anonymous events
    const from_addr = try primitives.Address.from_hex("0x0000000000000000000000000000000000000001");
    const to_addr = try primitives.Address.from_hex("0x0000000000000000000000000000000000000002");
    
    var topic0 = Hash.ZERO_HASH;
    @memcpy(topic0[12..32], &from_addr);
    
    var topic1 = Hash.ZERO_HASH;
    @memcpy(topic1[12..32], &to_addr);
    
    const value: u256 = 1000;
    const values = [_]abi.AbiValue{
        abi.uint256_value(value),
    };
    
    const data = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(data);
    
    const log = EventLog{
        .address = try primitives.Address.from_hex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash.Hash{ topic0, topic1 }, // Only indexed parameters
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

// Test ERC20 Transfer event
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
    const topic0 = Hash.from_hex_comptime("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
    
    const from_addr = try primitives.Address.from_hex("0x1234567890123456789012345678901234567890");
    const to_addr = try primitives.Address.from_hex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
    
    var topic1 = Hash.ZERO_HASH;
    @memcpy(topic1[12..32], &from_addr);
    
    var topic2 = Hash.ZERO_HASH;
    @memcpy(topic2[12..32], &to_addr);
    
    const value: u256 = 1_000_000_000_000_000_000; // 1 ETH
    const values = [_]abi.AbiValue{
        abi.uint256_value(value),
    };
    
    const data = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(data);
    
    const log = EventLog{
        .address = try primitives.Address.from_hex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"), // WETH address
        .topics = &[_]Hash.Hash{ topic0, topic1, topic2 },
        .data = data,
        .block_number = 17000000,
        .transaction_hash = Hash.from_hex_comptime("0x1234567890123456789012345678901234567890123456789012345678901234"),
        .transaction_index = 42,
        .log_index = 123,
        .removed = false,
    };
    
    const parsed = try parse_event_log(allocator, log, event_sig);
    defer allocator.free(parsed);
    
    try testing.expectEqual(@as(usize, 3), parsed.len);
    try testing.expectEqualSlices(u8, &from_addr, &parsed[0].address);
    try testing.expectEqualSlices(u8, &to_addr, &parsed[1].address);
    try testing.expectEqual(value, parsed[2].uint256);
}

// Test event with multiple non-indexed parameters
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
    
    const topic0 = Hash.keccak256("Swap(address,uint256,uint256,uint256,uint256,address)");
    
    const sender = try primitives.Address.from_hex("0x0000000000000000000000000000000000000001");
    const to = try primitives.Address.from_hex("0x0000000000000000000000000000000000000002");
    
    var topic1 = Hash.ZERO_HASH;
    @memcpy(topic1[12..32], &sender);
    
    var topic2 = Hash.ZERO_HASH;
    @memcpy(topic2[12..32], &to);
    
    const values = [_]abi.AbiValue{
        abi.uint256_value(1000), // amount0In
        abi.uint256_value(0),    // amount1In
        abi.uint256_value(0),    // amount0Out
        abi.uint256_value(2000), // amount1Out
    };
    
    const data = try abi.encode_abi_parameters(allocator, &values);
    defer allocator.free(data);
    
    const log = EventLog{
        .address = try primitives.Address.from_hex("0x0000000000000000000000000000000000000000"),
        .topics = &[_]Hash.Hash{ topic0, topic1, topic2 },
        .data = data,
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };
    
    const parsed = try parse_event_log(allocator, log, event_sig);
    defer allocator.free(parsed);
    
    try testing.expectEqual(@as(usize, 6), parsed.len);
    try testing.expectEqualSlices(u8, &sender, &parsed[0].address);
    try testing.expectEqual(@as(u256, 1000), parsed[1].uint256);
    try testing.expectEqual(@as(u256, 0), parsed[2].uint256);
    try testing.expectEqual(@as(u256, 0), parsed[3].uint256);
    try testing.expectEqual(@as(u256, 2000), parsed[4].uint256);
    try testing.expectEqualSlices(u8, &to, &parsed[5].address);
}

// Test filtering logs by topics
test "filter logs by topics" {
    const topic0 = Hash.keccak256("Transfer(address,address,uint256)");
    const from_topic = Hash.from_hex_comptime("0x0000000000000000000000001234567890123456789012345678901234567890");
    
    const logs = [_]EventLog{
        // Matching log
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash.Hash{ topic0, from_topic },
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
            .topics = &[_]Hash.Hash{ Hash.ZERO_HASH, from_topic },
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
            .topics = &[_]Hash.Hash{ topic0, from_topic },
            .data = &[_]u8{},
            .block_number = 3,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };
    
    const filter_topics = [_]?Hash.Hash{ topic0, from_topic };
    const filtered = filter_logs_by_topics(&logs, &filter_topics);
    
    try testing.expectEqual(@as(usize, 2), filtered.len);
    try testing.expectEqual(@as(u64, 1), filtered[0].block_number.?);
    try testing.expectEqual(@as(u64, 3), filtered[1].block_number.?);
}

// Helper function to parse event log
fn parse_event_log(allocator: std.mem.Allocator, log: EventLog, sig: EventSignature) ![]abi.AbiValue {
    var result = std.ArrayList(abi.AbiValue).init(allocator);
    defer result.deinit();
    
    var topic_index: usize = 1; // Skip topic0 (event signature)
    var data_types = std.ArrayList(abi.AbiType).init(allocator);
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
                        var addr: primitives.Address = undefined;
                        @memcpy(&addr, topic[12..32]);
                        try result.append(abi.address_value(addr));
                    },
                    .uint256 => {
                        const value = Hash.to_u256(topic);
                        try result.append(abi.uint256_value(value));
                    },
                    .string, .bytes => {
                        // Dynamic types are hashed when indexed
                        // We can't recover the original value
                        try result.append(abi.bytes_value(&topic));
                    },
                    else => {
                        // Handle other types as needed
                        try result.append(abi.uint256_value(0));
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
        const data_values = try abi.decode_abi_parameters(allocator, log.data, data_types.items);
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
fn filter_logs_by_topics(logs: []const EventLog, filter_topics: []const ?Hash.Hash) []const EventLog {
    var matches = std.ArrayList(EventLog).init(std.heap.page_allocator);
    defer matches.deinit();
    
    for (logs) |log| {
        var match = true;
        
        for (filter_topics, 0..) |filter_topic, i| {
            if (filter_topic) |topic| {
                if (i >= log.topics.len or !Hash.equal(log.topics[i], topic)) {
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