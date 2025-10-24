const std = @import("std");
const Allocator = std.mem.Allocator;
const address_mod = @import("address.zig");
const crypto_pkg = @import("crypto");
const hash = crypto_pkg.Hash;
const Address = address_mod.Address;
const Hash = hash.Hash;

/// Represents an Ethereum event log emitted by a smart contract
///
/// Event logs are the primary mechanism for smart contracts to communicate
/// state changes to off-chain systems. They consist of:
/// - An address (the contract that emitted the log)
/// - Topics (indexed parameters, up to 4, where topic0 is typically the event signature)
/// - Data (non-indexed parameters, ABI-encoded)
/// - Block/transaction metadata for provenance
///
/// This type provides:
/// - Event signature extraction (topic0)
/// - Log filtering with wildcard support
/// - Reorg detection via the `removed` flag
/// - Full block and transaction context tracking
///
/// Example:
/// ```zig
/// const log = EventLog{
///     .address = contract_addr,
///     .topics = &[_]Hash{ event_signature, indexed_param1, indexed_param2 },
///     .data = abi_encoded_data,
///     .block_number = 12345,
///     .transaction_hash = tx_hash,
///     .transaction_index = 0,
///     .log_index = 0,
///     .removed = false,
/// };
///
/// // Get event signature
/// const sig = log.eventSignature();
///
/// // Filter logs by topics (null = wildcard)
/// const filtered = try filterLogs(allocator, logs, &[_]?Hash{ topic0, null, null });
/// ```
pub const EventLog = @This();

// =============================================================================
// Fields
// =============================================================================

/// Contract address that emitted this log
address: Address,

/// Topics array (indexed event parameters)
/// - topic[0] is typically the event signature hash (keccak256 of event signature)
/// - topic[1..3] are indexed parameters (max 3 indexed params per Solidity spec)
/// - Can have 0-4 topics total
topics: []const Hash,

/// Non-indexed event data (ABI-encoded)
/// Contains all non-indexed parameters in order they appear in event signature
data: []const u8,

/// Block number where this log was emitted (null if pending)
block_number: ?u64,

/// Transaction hash that produced this log (null if pending)
transaction_hash: ?Hash,

/// Index of transaction in block (null if pending)
transaction_index: ?u32,

/// Index of this log entry within the transaction (null if pending)
log_index: ?u32,

/// True if this log was removed due to a chain reorganization
/// When a block is uncled/reorged, its logs are marked as removed
removed: bool,

// =============================================================================
// Event Signature Methods
// =============================================================================

/// Get event signature (topic0) if present
///
/// For non-anonymous events, topic[0] contains the keccak256 hash of the
/// event signature. For anonymous events, there is no topic[0].
///
/// Returns:
/// - `?Hash` - The event signature hash if topics.len > 0, otherwise null
///
/// Example:
/// ```zig
/// // Transfer(address,address,uint256) signature
/// const topic0 = Hash.keccak256("Transfer(address,address,uint256)");
/// const log = EventLog{
///     .address = contract,
///     .topics = &[_]Hash{ topic0, from_topic, to_topic },
///     .data = value_data,
///     // ... other fields
/// };
///
/// const sig = log.eventSignature();
/// if (sig) |s| {
///     // s equals topic0
/// }
/// ```
pub fn eventSignature(self: EventLog) ?Hash {
    if (self.topics.len > 0) {
        return self.topics[0];
    }
    return null;
}

// =============================================================================
// Log Filtering
// =============================================================================

/// Filter logs by topic patterns with wildcard support
///
/// Filters an array of logs to only those matching the specified topic pattern.
/// Each position in the filter can be:
/// - A specific Hash value to match exactly
/// - null to match any value (wildcard)
///
/// Topics are matched positionally:
/// - filter_topics[0] matches log.topics[0] (event signature)
/// - filter_topics[1] matches log.topics[1] (first indexed param)
/// - etc.
///
/// A log matches if:
/// - For each position in filter_topics:
///   - If filter value is null, any log value matches (wildcard)
///   - If filter value is a Hash, log must have that exact Hash at that position
/// - Log must have at least as many topics as filter_topics
///
/// Arguments:
/// - `allocator` - Used to allocate the result array
/// - `logs` - Array of logs to filter
/// - `filter_topics` - Topic pattern to match (null entries are wildcards)
///
/// Returns:
/// - `![]EventLog` - New array containing only matching logs (caller must free)
///
/// Example:
/// ```zig
/// // Filter for Transfer events from a specific address
/// const transfer_sig = Hash.keccak256("Transfer(address,address,uint256)");
/// const from_addr_hash = ...; // address encoded as Hash
///
/// // Match: Transfer signature, specific from address, any to address
/// const filtered = try filterLogs(
///     allocator,
///     all_logs,
///     &[_]?Hash{ transfer_sig, from_addr_hash, null }
/// );
/// defer allocator.free(filtered);
///
/// // Match: Any event signature, specific address in topic[1]
/// const filtered2 = try filterLogs(
///     allocator,
///     all_logs,
///     &[_]?Hash{ null, specific_topic1, null }
/// );
/// defer allocator.free(filtered2);
/// ```
pub fn filterLogs(
    allocator: Allocator,
    logs: []const EventLog,
    filter_topics: []const ?Hash,
) ![]EventLog {
    var matches = std.ArrayList(EventLog){};
    errdefer matches.deinit(allocator);

    for (logs) |log| {
        var is_match = true;

        // Check each filter topic position
        for (filter_topics, 0..) |maybe_filter_topic, i| {
            if (maybe_filter_topic) |filter_topic| {
                // Non-null filter: must match exactly
                if (i >= log.topics.len or !log.topics[i].eql(filter_topic)) {
                    is_match = false;
                    break;
                }
            }
            // Null filter: wildcard, matches anything
        }

        if (is_match) {
            try matches.append(allocator, log);
        }
    }

    return try matches.toOwnedSlice(allocator);
}

// =============================================================================
// Tests
// =============================================================================

test "EventLog: eventSignature - returns topic0 for non-anonymous events" {
    const topic0 = try Hash.fromHex("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
    const topic1 = Hash.ZERO;

    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{ topic0, topic1 },
        .data = &[_]u8{},
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const sig = log.eventSignature();
    try std.testing.expect(sig != null);
    try std.testing.expect(sig.?.eql(topic0));
}

test "EventLog: eventSignature - returns null for logs with no topics" {
    const log = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    const sig = log.eventSignature();
    try std.testing.expect(sig == null);
}

test "EventLog: filterLogs - exact topic match" {
    const allocator = std.testing.allocator;

    const topic0 = Hash.keccak256("Transfer(address,address,uint256)");
    const topic1 = try Hash.fromHex("0x0000000000000000000000001234567890123456789012345678901234567890");
    const topic2 = try Hash.fromHex("0x000000000000000000000000abcdefabcdefabcdefabcdefabcdefabcdefabcd");

    const logs = [_]EventLog{
        // Matching log
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, topic1, topic2 },
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
            .topics = &[_]Hash{ Hash.ZERO, topic1, topic2 },
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
            .topics = &[_]Hash{ topic0, topic1, topic2 },
            .data = &[_]u8{},
            .block_number = 3,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    const filter_topics = [_]?Hash{topic0};
    const filtered = try filterLogs(allocator, &logs, &filter_topics);
    defer allocator.free(filtered);

    try std.testing.expectEqual(@as(usize, 2), filtered.len);
    try std.testing.expectEqual(@as(u64, 1), filtered[0].block_number.?);
    try std.testing.expectEqual(@as(u64, 3), filtered[1].block_number.?);
}

test "EventLog: filterLogs - wildcard topics" {
    const allocator = std.testing.allocator;

    const topic0 = Hash.keccak256("Transfer(address,address,uint256)");
    const topic1_a = try Hash.fromHex("0x0000000000000000000000001111111111111111111111111111111111111111");
    const topic1_b = try Hash.fromHex("0x0000000000000000000000002222222222222222222222222222222222222222");

    const logs = [_]EventLog{
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, topic1_a },
            .data = &[_]u8{},
            .block_number = 1,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, topic1_b },
            .data = &[_]u8{},
            .block_number = 2,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{Hash.ZERO},
            .data = &[_]u8{},
            .block_number = 3,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    // Filter: Transfer signature, any from address
    const filter_topics = [_]?Hash{ topic0, null };
    const filtered = try filterLogs(allocator, &logs, &filter_topics);
    defer allocator.free(filtered);

    // Should match both Transfer logs (regardless of topic1)
    try std.testing.expectEqual(@as(usize, 2), filtered.len);
    try std.testing.expectEqual(@as(u64, 1), filtered[0].block_number.?);
    try std.testing.expectEqual(@as(u64, 2), filtered[1].block_number.?);
}

test "EventLog: filterLogs - all wildcards" {
    const allocator = std.testing.allocator;

    const logs = [_]EventLog{
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{Hash.ZERO},
            .data = &[_]u8{},
            .block_number = 1,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ Hash.ZERO, Hash.ZERO },
            .data = &[_]u8{},
            .block_number = 2,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    // Empty filter matches all logs
    const filter_topics = [_]?Hash{};
    const filtered = try filterLogs(allocator, &logs, &filter_topics);
    defer allocator.free(filtered);

    try std.testing.expectEqual(@as(usize, 2), filtered.len);
}

test "EventLog: filterLogs - multiple topic constraints" {
    const allocator = std.testing.allocator;

    const topic0 = Hash.keccak256("Transfer(address,address,uint256)");
    const from_addr = try Hash.fromHex("0x0000000000000000000000001111111111111111111111111111111111111111");
    const to_addr = try Hash.fromHex("0x0000000000000000000000002222222222222222222222222222222222222222");

    const logs = [_]EventLog{
        // Matches: correct topic0, from, and to
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, from_addr, to_addr },
            .data = &[_]u8{},
            .block_number = 1,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        // Doesn't match: wrong from address
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, Hash.ZERO, to_addr },
            .data = &[_]u8{},
            .block_number = 2,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        // Doesn't match: wrong to address
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, from_addr, Hash.ZERO },
            .data = &[_]u8{},
            .block_number = 3,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    // Filter: specific topic0, from, and to
    const filter_topics = [_]?Hash{ topic0, from_addr, to_addr };
    const filtered = try filterLogs(allocator, &logs, &filter_topics);
    defer allocator.free(filtered);

    try std.testing.expectEqual(@as(usize, 1), filtered.len);
    try std.testing.expectEqual(@as(u64, 1), filtered[0].block_number.?);
}

test "EventLog: filterLogs - wildcard in middle position" {
    const allocator = std.testing.allocator;

    const topic0 = Hash.keccak256("Transfer(address,address,uint256)");
    const to_addr = try Hash.fromHex("0x0000000000000000000000002222222222222222222222222222222222222222");

    const logs = [_]EventLog{
        // Matches: correct topic0, any from, specific to
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, Hash.ZERO, to_addr },
            .data = &[_]u8{},
            .block_number = 1,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        // Matches: correct topic0, different from, specific to
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, try Hash.fromHex("0x0000000000000000000000003333333333333333333333333333333333333333"), to_addr },
            .data = &[_]u8{},
            .block_number = 2,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
        // Doesn't match: wrong to address
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{ topic0, Hash.ZERO, Hash.ZERO },
            .data = &[_]u8{},
            .block_number = 3,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    // Filter: Transfer signature, any from address, specific to address
    const filter_topics = [_]?Hash{ topic0, null, to_addr };
    const filtered = try filterLogs(allocator, &logs, &filter_topics);
    defer allocator.free(filtered);

    try std.testing.expectEqual(@as(usize, 2), filtered.len);
    try std.testing.expectEqual(@as(u64, 1), filtered[0].block_number.?);
    try std.testing.expectEqual(@as(u64, 2), filtered[1].block_number.?);
}

test "EventLog: filterLogs - no matches" {
    const allocator = std.testing.allocator;

    const topic0 = Hash.keccak256("Transfer(address,address,uint256)");
    const different_topic = Hash.keccak256("Approval(address,address,uint256)");

    const logs = [_]EventLog{
        .{
            .address = Address.ZERO,
            .topics = &[_]Hash{topic0},
            .data = &[_]u8{},
            .block_number = 1,
            .transaction_hash = null,
            .transaction_index = null,
            .log_index = null,
            .removed = false,
        },
    };

    // Filter for different event signature
    const filter_topics = [_]?Hash{different_topic};
    const filtered = try filterLogs(allocator, &logs, &filter_topics);
    defer allocator.free(filtered);

    try std.testing.expectEqual(@as(usize, 0), filtered.len);
}

test "EventLog: removed flag - tracks reorgs" {
    const log_removed = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = true,
    };

    const log_active = EventLog{
        .address = Address.ZERO,
        .topics = &[_]Hash{},
        .data = &[_]u8{},
        .block_number = 12345,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = null,
        .removed = false,
    };

    try std.testing.expect(log_removed.removed);
    try std.testing.expect(!log_active.removed);
}

test "EventLog: full metadata" {
    const tx_hash = try Hash.fromHex("0x1234567890123456789012345678901234567890123456789012345678901234");
    const contract_addr = try Address.fromHex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    const log = EventLog{
        .address = contract_addr,
        .topics = &[_]Hash{Hash.ZERO},
        .data = &[_]u8{ 0x01, 0x02, 0x03 },
        .block_number = 17000000,
        .transaction_hash = tx_hash,
        .transaction_index = 42,
        .log_index = 123,
        .removed = false,
    };

    try std.testing.expect(log.address.eql(contract_addr));
    try std.testing.expectEqual(@as(usize, 1), log.topics.len);
    try std.testing.expectEqual(@as(usize, 3), log.data.len);
    try std.testing.expectEqual(@as(u64, 17000000), log.block_number.?);
    try std.testing.expect(log.transaction_hash.?.eql(tx_hash));
    try std.testing.expectEqual(@as(u32, 42), log.transaction_index.?);
    try std.testing.expectEqual(@as(u32, 123), log.log_index.?);
    try std.testing.expect(!log.removed);
}
