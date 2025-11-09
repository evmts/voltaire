const std = @import("std");
const primitives = @import("primitives");

/// Event Signature Example
///
/// Demonstrates:
/// - Computing event signatures (topic0)
/// - Filtering logs by event type
/// - Working with common ERC standards
/// - Event signature registry

const Hash = primitives.hash.Hash;

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("\n=== Event Signature Example ===\n\n", .{});

    // ============================================================
    // Computing Event Signatures
    // ============================================================

    try stdout.print("--- Computing Event Signatures ---\n\n", .{});

    // Event signatures are keccak256(eventName(param1Type,param2Type,...))
    // The hash becomes topic0 in event logs

    // ERC-20 Events
    const transfer_sig = Hash.keccak256String("Transfer(address,address,uint256)");
    const approval_sig = Hash.keccak256String("Approval(address,address,uint256)");

    var hex_buf: [66]u8 = undefined;

    try stdout.print("ERC-20 Transfer: {s}\n", .{Hash.toHex(transfer_sig, &hex_buf)});
    try stdout.print("ERC-20 Approval: {s}\n", .{Hash.toHex(approval_sig, &hex_buf)});

    // ERC-721 Events
    const approval_for_all_sig = Hash.keccak256String("ApprovalForAll(address,address,bool)");
    try stdout.print("\nERC-721 ApprovalForAll: {s}\n", .{Hash.toHex(approval_for_all_sig, &hex_buf)});

    // ERC-1155 Events
    const transfer_single_sig = Hash.keccak256String("TransferSingle(address,address,address,uint256,uint256)");
    const transfer_batch_sig = Hash.keccak256String("TransferBatch(address,address,address,uint256[],uint256[])");

    try stdout.print("\nERC-1155 TransferSingle: {s}\n", .{Hash.toHex(transfer_single_sig, &hex_buf)});
    try stdout.print("ERC-1155 TransferBatch: {s}\n", .{Hash.toHex(transfer_batch_sig, &hex_buf)});

    // Custom Events
    const deposit_sig = Hash.keccak256String("Deposit(address,uint256)");
    const withdrawal_sig = Hash.keccak256String("Withdrawal(address,uint256)");
    const swap_sig = Hash.keccak256String("Swap(address,uint256,uint256,uint256,uint256,address)");

    try stdout.print("\nCustom Deposit: {s}\n", .{Hash.toHex(deposit_sig, &hex_buf)});
    try stdout.print("Custom Withdrawal: {s}\n", .{Hash.toHex(withdrawal_sig, &hex_buf)});
    try stdout.print("Custom Swap: {s}\n", .{Hash.toHex(swap_sig, &hex_buf)});

    // ============================================================
    // Event Log Structure
    // ============================================================

    try stdout.print("\n--- Event Log Structure ---\n\n", .{});

    const EventLog = struct {
        topics: []const Hash,
        data: []const u8,
    };

    // Example Transfer event log
    // topics = [signature, from, to]
    // data = value (ABI-encoded)

    try stdout.print("Event log structure:\n", .{});
    try stdout.print("  topics[0] = event signature hash (topic0)\n", .{});
    try stdout.print("  topics[1..n] = indexed parameters\n", .{});
    try stdout.print("  data = non-indexed parameters (ABI-encoded)\n", .{});

    // ============================================================
    // Filtering by Event Type
    // ============================================================

    try stdout.print("\n--- Filtering by Event Type ---\n\n", .{});

    fn isTransferEvent(topic0: Hash) bool {
        return Hash.equals(topic0, transfer_sig);
    }

    fn isApprovalEvent(topic0: Hash) bool {
        return Hash.equals(topic0, approval_sig);
    }

    fn isDepositEvent(topic0: Hash) bool {
        return Hash.equals(topic0, deposit_sig);
    }

    // Test filtering
    const test_topics = [_]Hash{ transfer_sig, approval_sig, deposit_sig, transfer_sig };

    var transfer_count: usize = 0;
    var approval_count: usize = 0;
    var deposit_count: usize = 0;

    for (test_topics) |topic| {
        if (isTransferEvent(topic)) transfer_count += 1;
        if (isApprovalEvent(topic)) approval_count += 1;
        if (isDepositEvent(topic)) deposit_count += 1;
    }

    try stdout.print("Event counts:\n", .{});
    try stdout.print("  Transfers: {d}\n", .{transfer_count});
    try stdout.print("  Approvals: {d}\n", .{approval_count});
    try stdout.print("  Deposits: {d}\n", .{deposit_count});

    // ============================================================
    // Event Type Classification
    // ============================================================

    try stdout.print("\n--- Event Type Classification ---\n\n", .{});

    const EventType = enum {
        Transfer,
        Approval,
        Deposit,
        Unknown,

        fn fromTopic0(topic0: Hash) @This() {
            if (Hash.equals(topic0, transfer_sig)) return .Transfer;
            if (Hash.equals(topic0, approval_sig)) return .Approval;
            if (Hash.equals(topic0, deposit_sig)) return .Deposit;
            return .Unknown;
        }

        fn name(self: @This()) []const u8 {
            return switch (self) {
                .Transfer => "Transfer",
                .Approval => "Approval",
                .Deposit => "Deposit",
                .Unknown => "Unknown",
            };
        }
    };

    try stdout.print("Classifying events:\n", .{});
    for (test_topics, 0..) |topic, i| {
        const event_type = EventType.fromTopic0(topic);
        try stdout.print("  Event {d}: {s}\n", .{ i + 1, event_type.name() });
    }

    // ============================================================
    // Known Event Signatures
    // ============================================================

    try stdout.print("\n--- Known Event Signatures ---\n\n", .{});

    // Verify against known hashes
    const known_transfer = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    // Parse known hash
    const expected = Hash.fromHex(known_transfer);

    if (Hash.equals(transfer_sig, expected)) {
        try stdout.print("Transfer signature verified: PASS\n", .{});
    } else {
        try stdout.print("Transfer signature verified: FAIL\n", .{});
    }

    // ============================================================
    // Computing Function Selectors from Event Signatures
    // ============================================================

    try stdout.print("\n--- Related: Function Selectors ---\n\n", .{});

    // Function selectors are first 4 bytes of keccak256
    const transfer_func = Hash.keccak256String("transfer(address,uint256)");
    const selector = transfer_func[0..4];

    try stdout.print("transfer(address,uint256) selector: 0x", .{});
    for (selector) |byte| {
        try stdout.print("{x:0>2}", .{byte});
    }
    try stdout.print("\n", .{});

    // ============================================================
    // Anonymous Events
    // ============================================================

    try stdout.print("\n--- Anonymous Events ---\n\n", .{});

    try stdout.print("Anonymous events:\n", .{});
    try stdout.print("  - Don't include event signature in topics\n", .{});
    try stdout.print("  - Can have up to 4 indexed parameters (vs 3 for regular)\n", .{});
    try stdout.print("  - More gas efficient (saves 375 gas)\n", .{});
    try stdout.print("  - Harder to filter (need contract address + topics)\n", .{});

    // ============================================================
    // All ERC-20 Event Signatures
    // ============================================================

    try stdout.print("\n--- ERC-20 Event Signatures ---\n\n", .{});

    const erc20_events = [_][]const u8{
        "Transfer(address,address,uint256)",
        "Approval(address,address,uint256)",
    };

    try stdout.print("ERC-20 event hashes:\n", .{});
    for (erc20_events) |sig| {
        const hash = Hash.keccak256String(sig);
        try stdout.print("  {s}\n", .{sig});
        try stdout.print("    {s}\n", .{Hash.toHex(hash, &hex_buf)});
    }

    // ============================================================
    // Building Topic Filters
    // ============================================================

    try stdout.print("\n--- Building Topic Filters ---\n\n", .{});

    // Topic filter for eth_getLogs
    const TopicFilter = struct {
        topic0: ?Hash, // Event signature (null = any event)
        topic1: ?Hash, // First indexed param (null = any)
        topic2: ?Hash, // Second indexed param (null = any)
        topic3: ?Hash, // Third indexed param (null = any)

        fn matches(self: @This(), topics: []const Hash) bool {
            if (topics.len == 0) return false;

            // Check topic0
            if (self.topic0) |t0| {
                if (!Hash.equals(topics[0], t0)) return false;
            }

            // Check topic1
            if (topics.len > 1 and self.topic1 != null) {
                if (!Hash.equals(topics[1], self.topic1.?)) return false;
            }

            // Check topic2
            if (topics.len > 2 and self.topic2 != null) {
                if (!Hash.equals(topics[2], self.topic2.?)) return false;
            }

            // Check topic3
            if (topics.len > 3 and self.topic3 != null) {
                if (!Hash.equals(topics[3], self.topic3.?)) return false;
            }

            return true;
        }
    };

    // Filter for Transfer events only
    const transfer_filter = TopicFilter{
        .topic0 = transfer_sig,
        .topic1 = null, // any from
        .topic2 = null, // any to
        .topic3 = null,
    };

    // Test filter
    const test_log_topics = [_]Hash{transfer_sig};
    if (transfer_filter.matches(&test_log_topics)) {
        try stdout.print("Transfer filter matched\n", .{});
    }

    // ============================================================
    // Event Signature Collision
    // ============================================================

    try stdout.print("\n--- Event Signature Collision ---\n\n", .{});

    // Different events can theoretically have same signature hash
    // (though extremely unlikely with keccak256)
    // Always verify contract address when filtering

    try stdout.print("Event signature collision:\n", .{});
    try stdout.print("  - Extremely unlikely with keccak256 (2^256 space)\n", .{});
    try stdout.print("  - Always filter by contract address too\n", .{});
    try stdout.print("  - Multiple contracts may emit same event signature\n", .{});

    try stdout.print("\n=== Example Complete ===\n\n", .{});
}
