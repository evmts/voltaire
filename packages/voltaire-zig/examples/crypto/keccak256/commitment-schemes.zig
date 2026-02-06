const std = @import("std");
const crypto = @import("crypto");

/// Cryptographic Commitment Schemes
///
/// Demonstrates using Keccak256 for commitments:
/// - Commit-reveal schemes
/// - Secret commitments with nonces
/// - Hash chains
/// - Merkle proofs
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== Cryptographic Commitment Schemes ===\n\n", .{});

    // 1. Basic Commit-Reveal
    try stdout.print("1. Basic Commit-Reveal Scheme\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Commit to a value without revealing it\n\n", .{});

    const alice_choice = "rock";
    var alice_nonce: [32]u8 = undefined;
    std.crypto.random.bytes(&alice_nonce);

    // Create commitment: hash(choice || nonce)
    var commit_data = std.ArrayList(u8).init(allocator);
    defer commit_data.deinit();
    try commit_data.appendSlice(alice_choice);
    try commit_data.appendSlice(&alice_nonce);

    var commitment: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(commit_data.items, &commitment);

    try stdout.print("Commit Phase:\n", .{});
    try stdout.print("Alice's choice: \"{s}\" (kept secret)\n", .{alice_choice});
    try stdout.print("Nonce:          0x", .{});
    for (alice_nonce) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nCommitment:     0x", .{});
    for (commitment) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    const bob_choice = "paper";
    try stdout.print("Bob sees commitment and makes his choice:\n", .{});
    try stdout.print("Bob's choice: \"{s}\"\n\n", .{bob_choice});

    // Reveal Phase
    try stdout.print("Reveal Phase:\n", .{});
    var revealed: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(commit_data.items, &revealed);

    const verified = std.mem.eql(u8, &commitment, &revealed);
    try stdout.print("Alice reveals: \"{s}\"\n", .{alice_choice});
    try stdout.print("Commitment matches: {}\n", .{verified});

    const bob_wins = std.mem.eql(u8, bob_choice, "paper") and std.mem.eql(u8, alice_choice, "rock");
    try stdout.print("Winner: {s}\n\n", .{if (bob_wins) "Bob" else "Alice"});

    // 2. Timestamped Document Commitment
    try stdout.print("2. Timestamped Document Commitment\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Prove document existed at specific time\n\n", .{});

    const document = "Important legal document content";
    const timestamp = std.time.milliTimestamp();

    var doc_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(document, &doc_hash);

    // Create timestamped commitment
    var ts_data = std.ArrayList(u8).init(allocator);
    defer ts_data.deinit();
    try ts_data.appendSlice(&doc_hash);

    var ts_bytes: [8]u8 = undefined;
    std.mem.writeInt(u64, &ts_bytes, @bitCast(timestamp), .big);
    try ts_data.appendSlice(&ts_bytes);

    var ts_commitment: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(ts_data.items, &ts_commitment);

    try stdout.print("Document: \"{s}...\"\n", .{document[0..30]});
    try stdout.print("Timestamp: {d}\n", .{timestamp});
    try stdout.print("Document hash: 0x", .{});
    for (doc_hash) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nTimestamped commitment: 0x", .{});
    for (ts_commitment) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    // 3. Merkle Proof
    try stdout.print("3. Merkle Proof\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Prove inclusion in a set without revealing all items\n\n", .{});

    // Build Merkle tree
    var leaves: [4][32]u8 = undefined;
    try crypto.keccak_asm.keccak256("Transaction 1", &leaves[0]);
    try crypto.keccak_asm.keccak256("Transaction 2", &leaves[1]);
    try crypto.keccak_asm.keccak256("Transaction 3", &leaves[2]);
    try crypto.keccak_asm.keccak256("Transaction 4", &leaves[3]);

    try stdout.print("Merkle tree leaves:\n", .{});
    for (leaves, 0..) |leaf, i| {
        try stdout.print("  Tx {d}: 0x", .{i + 1});
        for (leaf[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print("...\n", .{});
    }

    // Build tree level 1
    var level1: [2][32]u8 = undefined;
    var node_data: [64]u8 = undefined;

    @memcpy(node_data[0..32], &leaves[0]);
    @memcpy(node_data[32..64], &leaves[1]);
    try crypto.keccak_asm.keccak256(&node_data, &level1[0]);

    @memcpy(node_data[0..32], &leaves[2]);
    @memcpy(node_data[32..64], &leaves[3]);
    try crypto.keccak_asm.keccak256(&node_data, &level1[1]);

    // Build root
    @memcpy(node_data[0..32], &level1[0]);
    @memcpy(node_data[32..64], &level1[1]);
    var root: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&node_data, &root);

    try stdout.print("\nMerkle root: 0x", .{});
    for (root) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    // Prove Transaction 2 is included
    const proof_index: usize = 1;
    try stdout.print("Proof for Transaction 2:\n", .{});
    try stdout.print("  Leaf:    0x", .{});
    for (leaves[proof_index][0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n  Sibling: 0x", .{});
    for (leaves[0][0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n  Uncle:   0x", .{});
    for (level1[1][0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n\n", .{});

    // Verify proof
    @memcpy(node_data[0..32], &leaves[0]);
    @memcpy(node_data[32..64], &leaves[proof_index]);
    var step1: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&node_data, &step1);

    @memcpy(node_data[0..32], &step1);
    @memcpy(node_data[32..64], &level1[1]);
    var computed_root: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&node_data, &computed_root);

    try stdout.print("Computed root: 0x", .{});
    for (computed_root) |byte| try stdout.print("{x:0>2}", .{byte});
    const proof_valid = std.mem.eql(u8, &computed_root, &root);
    try stdout.print("\nProof valid: {}\n\n", .{proof_valid});

    // 4. Hash Chain for One-Time Passwords
    try stdout.print("4. Hash Chain for One-Time Passwords\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const chain_length = 5;
    var chain = try allocator.alloc([32]u8, chain_length);
    defer allocator.free(chain);

    // Initial secret
    std.crypto.random.bytes(&chain[0]);

    // Build chain forwards
    for (1..chain_length) |i| {
        try crypto.keccak_asm.keccak256(&chain[i - 1], &chain[i]);
    }

    try stdout.print("Hash chain (built forwards):\n", .{});
    for (chain, 0..) |link, i| {
        try stdout.print("  Link {d}: 0x", .{i});
        for (link[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print("...\n", .{});
    }

    // Publish only the final hash
    try stdout.print("\nPublic commitment: 0x", .{});
    for (chain[chain_length - 1]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    // Use chain backwards (reveal one at a time)
    try stdout.print("Using passwords (backwards):\n", .{});
    var i: usize = chain_length - 1;
    while (i > 0) : (i -= 1) {
        const password = &chain[i - 1];
        var hashed: [32]u8 = undefined;
        try crypto.keccak_asm.keccak256(password, &hashed);

        const expected_commitment = &chain[i];
        const valid = std.mem.eql(u8, &hashed, expected_commitment);

        try stdout.print("  Password {d}: 0x", .{chain_length - i});
        for (password[0..6]) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print("... (valid: {})\n", .{valid});
    }

    try stdout.print("\nEach password can only be used once\n", .{});
    try stdout.print("Previous passwords cannot be derived from later ones\n\n", .{});

    // 5. Blind Commitment
    try stdout.print("5. Blind Commitment (Sealed Bid)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const Bid = struct {
        bidder: []const u8,
        amount: u64,
        nonce: [32]u8,
        commitment: [32]u8,
    };

    var bids = std.ArrayList(Bid).init(allocator);
    defer bids.deinit();

    const bidders = [_]struct { name: []const u8, amount: u64 }{
        .{ .name = "Alice", .amount = 100 },
        .{ .name = "Bob", .amount = 150 },
        .{ .name = "Carol", .amount = 125 },
    };

    try stdout.print("Commit Phase:\n", .{});
    for (bidders) |bidder| {
        var bid: Bid = undefined;
        bid.bidder = bidder.name;
        bid.amount = bidder.amount;
        std.crypto.random.bytes(&bid.nonce);

        var bid_data = std.ArrayList(u8).init(allocator);
        defer bid_data.deinit();
        try bid_data.appendSlice(bidder.name);

        var amount_bytes: [8]u8 = undefined;
        std.mem.writeInt(u64, &amount_bytes, bidder.amount, .big);
        try bid_data.appendSlice(&amount_bytes);
        try bid_data.appendSlice(&bid.nonce);

        try crypto.keccak_asm.keccak256(bid_data.items, &bid.commitment);

        try stdout.print("  {s}: 0x", .{bidder.name});
        for (bid.commitment[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print("...\n", .{});

        try bids.append(bid);
    }

    try stdout.print("\nReveal Phase:\n", .{});
    var highest_bid: u64 = 0;
    var winner: []const u8 = "";

    for (bids.items) |bid| {
        var bid_data = std.ArrayList(u8).init(allocator);
        defer bid_data.deinit();
        try bid_data.appendSlice(bid.bidder);

        var amount_bytes: [8]u8 = undefined;
        std.mem.writeInt(u64, &amount_bytes, bid.amount, .big);
        try bid_data.appendSlice(&amount_bytes);
        try bid_data.appendSlice(&bid.nonce);

        var revealed: [32]u8 = undefined;
        try crypto.keccak_asm.keccak256(bid_data.items, &revealed);

        const valid = std.mem.eql(u8, &bid.commitment, &revealed);
        try stdout.print("  {s}: ${d} (verified: {})\n", .{ bid.bidder, bid.amount, valid });

        if (valid and bid.amount > highest_bid) {
            highest_bid = bid.amount;
            winner = bid.bidder;
        }
    }

    try stdout.print("\nWinner: {s} with bid of ${d}\n\n", .{ winner, highest_bid });

    try stdout.print("=== Complete ===\n", .{});
}
