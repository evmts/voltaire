const std = @import("std");
const crypto = @import("crypto");

/// Content Addressing with Keccak256
///
/// Demonstrates using Keccak256 for content-addressed storage:
/// - Immutable content identification
/// - Data integrity verification
/// - Deduplication
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== Content Addressing with Keccak256 ===\n\n", .{});

    // 1. Basic Content Addressing
    try stdout.print("1. Basic Content Addressing\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Content hash = unique identifier for data\n\n", .{});

    const content1 = "Hello, World!";
    const content2 = "Hello, World!";
    const content3 = "Hello, World?"; // Slightly different

    var hash1: [32]u8 = undefined;
    var hash2: [32]u8 = undefined;
    var hash3: [32]u8 = undefined;

    try crypto.keccak_asm.keccak256(content1, &hash1);
    try crypto.keccak_asm.keccak256(content2, &hash2);
    try crypto.keccak_asm.keccak256(content3, &hash3);

    try stdout.print("Content 1: \"{s}\"\n", .{content1});
    try stdout.print("Hash:      0x", .{});
    for (hash1) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    try stdout.print("Content 2: \"{s}\"\n", .{content2});
    try stdout.print("Hash:      0x", .{});
    for (hash2) |byte| try stdout.print("{x:0>2}", .{byte});
    const same12 = std.mem.eql(u8, &hash1, &hash2);
    try stdout.print("\nSame as 1: {}\n\n", .{same12});

    try stdout.print("Content 3: \"{s}\"\n", .{content3});
    try stdout.print("Hash:      0x", .{});
    for (hash3) |byte| try stdout.print("{x:0>2}", .{byte});
    const same13 = std.mem.eql(u8, &hash1, &hash3);
    try stdout.print("\nSame as 1: {}\n\n", .{same13});

    // 2. Content Store Implementation
    try stdout.print("2. Content Store Implementation\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    var store = ContentStore.init(allocator);
    defer store.deinit();

    const data1 = "First piece of data";
    const data2 = "Second piece of data";
    const data3 = "First piece of data"; // Duplicate

    const hash1_key = try store.put(data1);
    const hash2_key = try store.put(data2);
    const hash3_key = try store.put(data3);

    try stdout.print("Stored content:\n", .{});
    try stdout.print("  Data 1: 0x", .{});
    for (hash1_key[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n", .{});
    try stdout.print("  Data 2: 0x", .{});
    for (hash2_key[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n", .{});
    try stdout.print("  Data 3: 0x", .{});
    for (hash3_key[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("... (duplicate)\n\n", .{});

    try stdout.print("Total unique items: {d}\n", .{store.store.count()});
    try stdout.print("Automatic deduplication: data1 and data3 have same hash\n\n", .{});

    // Retrieve and verify
    if (store.get(&hash1_key)) |retrieved| {
        const is_valid = store.verify(&hash1_key, retrieved);
        try stdout.print("Retrieved data: \"{s}\"\n", .{retrieved});
        try stdout.print("Integrity check: {}\n\n", .{is_valid});
    }

    // 3. Smart Contract Code Storage
    try stdout.print("3. Smart Contract Code Storage\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Ethereum stores contract code by hash\n\n", .{});

    const contract_code1 = [_]u8{
        0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15,
        0x61, 0x00, 0x0f, 0x57, 0x60, 0x00, 0x80, 0xfd,
    };

    const contract_code2 = [_]u8{
        0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15,
        0x61, 0x00, 0x10, 0x57, 0x60, 0x00, 0x80, 0xfd, // Slightly different
    };

    var code_hash1: [32]u8 = undefined;
    var code_hash2: [32]u8 = undefined;

    try crypto.keccak_asm.keccak256(&contract_code1, &code_hash1);
    try crypto.keccak_asm.keccak256(&contract_code2, &code_hash2);

    try stdout.print("Contract 1 code: 0x", .{});
    for (contract_code1) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nCode hash:       0x", .{});
    for (code_hash1) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    try stdout.print("Contract 2 code: 0x", .{});
    for (contract_code2) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nCode hash:       0x", .{});
    for (code_hash2) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    try stdout.print("Different code -> different hash (even 1 byte)\n", .{});
    try stdout.print("Ethereum stores account.codeHash for verification\n\n", .{});

    // 4. File Integrity Verification
    try stdout.print("4. File Integrity Verification\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    // Build original file
    var original_file = std.ArrayList(u8).init(allocator);
    defer original_file.deinit();

    try original_file.appendSlice(&[_]u8{ 0x89, 0x50, 0x4e, 0x47 }); // PNG header
    try original_file.appendSlice(&[_]u8{ 0x0d, 0x0a, 0x1a, 0x0a });
    for (0..100) |i| {
        try original_file.append(@truncate(i % 256));
    }

    var expected_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(original_file.items, &expected_hash);

    try stdout.print("Expected hash: 0x", .{});
    for (expected_hash) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nFile size:     {d} bytes\n\n", .{original_file.items.len});

    // Verify received file
    var received_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(original_file.items, &received_hash);

    try stdout.print("Received hash: 0x", .{});
    for (received_hash) |byte| try stdout.print("{x:0>2}", .{byte});
    const verified = std.mem.eql(u8, &expected_hash, &received_hash);
    try stdout.print("\nVerified:      {}\n", .{verified});

    // Simulate corruption
    original_file.items[50] ^= 0xff;
    var corrupted_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(original_file.items, &corrupted_hash);

    try stdout.print("\nCorrupted hash: 0x", .{});
    for (corrupted_hash) |byte| try stdout.print("{x:0>2}", .{byte});
    const corrupted_verified = std.mem.eql(u8, &expected_hash, &corrupted_hash);
    try stdout.print("\nVerified:       {}\n\n", .{corrupted_verified});

    // 5. Merkle DAG for Large Files
    try stdout.print("5. Merkle DAG for Large Files\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const chunk_size = 256;
    const large_file_size = 1024;
    var large_file = try allocator.alloc(u8, large_file_size);
    defer allocator.free(large_file);

    // Fill with pattern
    for (large_file, 0..) |*byte, i| {
        byte.* = @truncate(i);
    }

    const chunk_count = (large_file_size + chunk_size - 1) / chunk_size;
    var chunk_hashes = try allocator.alloc([32]u8, chunk_count);
    defer allocator.free(chunk_hashes);

    try stdout.print("File size:    {d} bytes\n", .{large_file_size});
    try stdout.print("Chunk size:   {d} bytes\n", .{chunk_size});
    try stdout.print("Chunk count:  {d}\n\n", .{chunk_count});

    try stdout.print("Chunk hashes:\n", .{});
    for (0..chunk_count) |i| {
        const start = i * chunk_size;
        const end = @min(start + chunk_size, large_file_size);
        const chunk = large_file[start..end];

        try crypto.keccak_asm.keccak256(chunk, &chunk_hashes[i]);

        try stdout.print("  Chunk {d}: 0x", .{i});
        for (chunk_hashes[i][0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print("...\n", .{});
    }

    // Build root hash from all chunk hashes
    const all_hashes_size = chunk_count * 32;
    var all_chunk_hashes = try allocator.alloc(u8, all_hashes_size);
    defer allocator.free(all_chunk_hashes);

    for (chunk_hashes, 0..) |chunk_hash, i| {
        @memcpy(all_chunk_hashes[i * 32 .. (i + 1) * 32], &chunk_hash);
    }

    var root_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(all_chunk_hashes, &root_hash);

    try stdout.print("\nRoot hash: 0x", .{});
    for (root_hash) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\nBenefit: Can verify individual chunks without full file\n\n", .{});

    try stdout.print("=== Complete ===\n", .{});
}

/// Simple content-addressed storage
const ContentStore = struct {
    store: std.StringHashMap([]const u8),
    allocator: std.mem.Allocator,

    fn init(allocator: std.mem.Allocator) ContentStore {
        return .{
            .store = std.StringHashMap([]const u8).init(allocator),
            .allocator = allocator,
        };
    }

    fn deinit(self: *ContentStore) void {
        var it = self.store.iterator();
        while (it.next()) |entry| {
            self.allocator.free(entry.key_ptr.*);
            self.allocator.free(entry.value_ptr.*);
        }
        self.store.deinit();
    }

    fn put(self: *ContentStore, content: []const u8) ![32]u8 {
        var hash: [32]u8 = undefined;
        try crypto.keccak_asm.keccak256(content, &hash);

        // Create hex string key
        var key_buf: [64]u8 = undefined;
        _ = try std.fmt.bufPrint(&key_buf, "{x}", .{std.fmt.fmtSliceHexLower(&hash)});

        const key = try self.allocator.dupe(u8, &key_buf);
        const value = try self.allocator.dupe(u8, content);

        try self.store.put(key, value);
        return hash;
    }

    fn get(self: *ContentStore, hash: *const [32]u8) ?[]const u8 {
        var key_buf: [64]u8 = undefined;
        const key = std.fmt.bufPrint(&key_buf, "{x}", .{std.fmt.fmtSliceHexLower(hash)}) catch return null;
        return self.store.get(key);
    }

    fn verify(self: *ContentStore, hash: *const [32]u8, content: []const u8) bool {
        _ = self;
        var computed: [32]u8 = undefined;
        crypto.keccak_asm.keccak256(content, &computed) catch return false;
        return std.mem.eql(u8, hash, &computed);
    }
};
