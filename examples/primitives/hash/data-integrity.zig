const std = @import("std");
const primitives = @import("primitives");

/// Data Integrity Verification Example
///
/// Demonstrates:
/// - Storing data with integrity hashes
/// - Verifying data hasn't been tampered with
/// - Detecting data corruption
/// - Content-addressable storage
const Hash = primitives.hash.Hash;

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    try stdout.print("\n=== Data Integrity Verification Example ===\n\n", .{});

    // ============================================================
    // Simple Integrity Check
    // ============================================================

    try stdout.print("--- Simple Integrity Check ---\n\n", .{});

    const original_data = "Important data that must not be tampered with";
    const original_hash = Hash.keccak256String(original_data);

    // Later, verify the data
    const received_data = "Important data that must not be tampered with";
    const received_hash = Hash.keccak256String(received_data);

    if (Hash.equals(original_hash, received_hash)) {
        try stdout.print("Data integrity verified: PASS\n", .{});
    } else {
        try stdout.print("Data integrity verification: FAIL\n", .{});
    }

    // Tampered data
    const tampered_data = "Important data that MUST not be tampered with"; // Changed case
    const tampered_hash = Hash.keccak256String(tampered_data);

    if (Hash.equals(original_hash, tampered_hash)) {
        try stdout.print("Tampered data check: PASS (should not happen)\n", .{});
    } else {
        try stdout.print("Tampered data detected: FAIL (expected)\n", .{});
    }

    // ============================================================
    // File Integrity
    // ============================================================

    try stdout.print("\n--- File Integrity ---\n\n", .{});

    // Simulate file content
    const file_content = "File content goes here";
    const file_hash = Hash.keccak256String(file_content);

    var hex_buf: [66]u8 = undefined;
    const hex = Hash.toHex(file_hash, &hex_buf);

    try stdout.print("Original file hash: {s}\n", .{hex[0..20]});
    try stdout.print("                    ...{s}\n", .{hex[62..]});

    // Verify file content hasn't changed
    const loaded_content = "File content goes here";
    const loaded_hash = Hash.keccak256String(loaded_content);

    if (Hash.equals(file_hash, loaded_hash)) {
        try stdout.print("File integrity: VERIFIED\n", .{});
    } else {
        try stdout.print("File integrity: CORRUPTED\n", .{});
    }

    // ============================================================
    // Multiple File Tracking
    // ============================================================

    try stdout.print("\n--- Multiple File Tracking ---\n\n", .{});

    const FileInfo = struct {
        name: []const u8,
        content: []const u8,
        hash: Hash,
    };

    var files = [_]FileInfo{
        .{
            .name = "config.json",
            .content = "{\"setting\":\"value\"}",
            .hash = undefined,
        },
        .{
            .name = "data.txt",
            .content = "Important data",
            .hash = undefined,
        },
        .{
            .name = "readme.md",
            .content = "# Readme",
            .hash = undefined,
        },
    };

    // Compute hashes
    for (&files) |*file| {
        file.hash = Hash.keccak256String(file.content);
    }

    try stdout.print("Tracked files:\n", .{});
    for (files) |file| {
        var display_buf: [20]u8 = undefined;
        const display = Hash.format(file.hash, 6, 4, &display_buf);
        try stdout.print("  {s}: {s}\n", .{ file.name, display });
    }

    // Verify all files
    var all_valid = true;
    for (files) |file| {
        const current_hash = Hash.keccak256String(file.content);
        if (!Hash.equals(file.hash, current_hash)) {
            all_valid = false;
            try stdout.print("File corrupted: {s}\n", .{file.name});
        }
    }

    if (all_valid) {
        try stdout.print("All files verified successfully\n", .{});
    }

    // ============================================================
    // Chained Hashing for Tamper Evidence
    // ============================================================

    try stdout.print("\n--- Chained Hashing (Blockchain-like) ---\n\n", .{});

    const Block = struct {
        data: []const u8,
        prev_hash: Hash,
        hash: Hash,

        fn create(data: []const u8, prev_hash: Hash) @This() {
            // Combine prev_hash + data
            var buf: [32 + 256]u8 = undefined;
            @memcpy(buf[0..32], &prev_hash);
            @memcpy(buf[32 .. 32 + data.len], data);

            return .{
                .data = data,
                .prev_hash = prev_hash,
                .hash = Hash.keccak256(buf[0 .. 32 + data.len]),
            };
        }
    };

    // Genesis block
    const genesis = Block{
        .data = "Genesis",
        .prev_hash = Hash.ZERO,
        .hash = Hash.keccak256String("Genesis"),
    };

    try stdout.print("Block 0 (genesis): {s}\n", .{genesis.data});

    // Block 1
    const block1 = Block.create("Transaction 1", genesis.hash);
    var b1_buf: [20]u8 = undefined;
    try stdout.print("Block 1: {s} (hash: {s})\n", .{ block1.data, Hash.format(block1.hash, 6, 4, &b1_buf) });

    // Block 2
    const block2 = Block.create("Transaction 2", block1.hash);
    var b2_buf: [20]u8 = undefined;
    try stdout.print("Block 2: {s} (hash: {s})\n", .{ block2.data, Hash.format(block2.hash, 6, 4, &b2_buf) });

    // Verify chain integrity
    var prev = genesis.hash;
    const blocks = [_]Block{ block1, block2 };

    var chain_valid = true;
    for (blocks) |block| {
        if (!Hash.equals(prev, block.prev_hash)) {
            chain_valid = false;
            break;
        }
        prev = block.hash;
    }

    if (chain_valid) {
        try stdout.print("Chain integrity: VERIFIED\n", .{});
    } else {
        try stdout.print("Chain integrity: BROKEN\n", .{});
    }

    // ============================================================
    // Merkle Tree for Batch Verification
    // ============================================================

    try stdout.print("\n--- Merkle Tree Batch Verification ---\n\n", .{});

    // Leaf hashes
    const leaf1 = Hash.keccak256String("data1");
    const leaf2 = Hash.keccak256String("data2");
    const leaf3 = Hash.keccak256String("data3");
    const leaf4 = Hash.keccak256String("data4");

    // Hash pairs
    const hashPair = struct {
        fn call(left: Hash, right: Hash) Hash {
            var combined: [64]u8 = undefined;
            @memcpy(combined[0..32], &left);
            @memcpy(combined[32..64], &right);
            return Hash.keccak256(&combined);
        }
    }.call;

    const node1 = hashPair(leaf1, leaf2);
    const node2 = hashPair(leaf3, leaf4);
    const root = hashPair(node1, node2);

    var root_buf: [20]u8 = undefined;
    try stdout.print("Merkle root: {s}\n", .{Hash.format(root, 8, 6, &root_buf)});

    // Verify single leaf with proof
    // Proof for leaf1: [leaf2, node2]
    const proof = [_]Hash{ leaf2, node2 };

    var current = leaf1;
    for (proof) |sibling| {
        current = hashPair(current, sibling);
    }

    if (Hash.equals(current, root)) {
        try stdout.print("Merkle proof verified: leaf1 is in tree\n", .{});
    } else {
        try stdout.print("Merkle proof failed\n", .{});
    }

    // ============================================================
    // Content-Addressable Storage
    // ============================================================

    try stdout.print("\n--- Content-Addressable Storage ---\n\n", .{});

    const Content = struct {
        data: []const u8,

        fn address(self: @This()) Hash {
            return Hash.keccak256String(self.data);
        }
    };

    const content1 = Content{ .data = "Hello, world!" };
    const content2 = Content{ .data = "Different content" };

    const addr1 = content1.address();
    const addr2 = content2.address();

    var a1_buf: [20]u8 = undefined;
    var a2_buf: [20]u8 = undefined;

    try stdout.print("Content 1 address: {s}\n", .{Hash.format(addr1, 8, 6, &a1_buf)});
    try stdout.print("Content 2 address: {s}\n", .{Hash.format(addr2, 8, 6, &a2_buf)});

    // Same content always has same address
    const content1_duplicate = Content{ .data = "Hello, world!" };
    if (Hash.equals(content1.address(), content1_duplicate.address())) {
        try stdout.print("Same content has same address: VERIFIED\n", .{});
    }

    // ============================================================
    // Checksum List Verification
    // ============================================================

    try stdout.print("\n--- Checksum List Verification ---\n\n", .{});

    const ChecksumEntry = struct {
        name: []const u8,
        expected_hash: Hash,
    };

    const checksums = [_]ChecksumEntry{
        .{ .name = "file1.txt", .expected_hash = Hash.keccak256String("content1") },
        .{ .name = "file2.txt", .expected_hash = Hash.keccak256String("content2") },
        .{ .name = "file3.txt", .expected_hash = Hash.keccak256String("content3") },
    };

    // Simulate files
    const actual_files = [_]struct { []const u8, []const u8 }{
        .{ "file1.txt", "content1" },
        .{ "file2.txt", "content2" },
        .{ "file3.txt", "content3" },
    };

    try stdout.print("Verifying checksums:\n", .{});
    for (checksums, actual_files) |checksum, actual| {
        const actual_hash = Hash.keccak256String(actual[1]);
        if (Hash.equals(checksum.expected_hash, actual_hash)) {
            try stdout.print("  {s}: OK\n", .{checksum.name});
        } else {
            try stdout.print("  {s}: FAILED\n", .{checksum.name});
        }
    }

    // ============================================================
    // Detecting Bit Flips
    // ============================================================

    try stdout.print("\n--- Detecting Bit Flips ---\n\n", .{});

    const data = [_]u8{ 1, 2, 3, 4, 5 };
    const data_hash = Hash.keccak256(&data);

    // Flip one bit
    var corrupted = data;
    corrupted[2] = 4; // Changed 3 to 4 (one bit flip)

    const corrupted_hash = Hash.keccak256(&corrupted);

    if (Hash.equals(data_hash, corrupted_hash)) {
        try stdout.print("Bit flip NOT detected (should not happen)\n", .{});
    } else {
        try stdout.print("Bit flip DETECTED\n", .{});
        try stdout.print("Original:  {s}...\n", .{Hash.toHex(data_hash, &hex_buf)[0..20]});
        try stdout.print("Corrupted: {s}...\n", .{Hash.toHex(corrupted_hash, &hex_buf)[0..20]});
    }

    try stdout.print("\n=== Example Complete ===\n\n", .{});
}
