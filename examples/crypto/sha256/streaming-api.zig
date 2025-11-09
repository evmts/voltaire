const std = @import("std");
const crypto = @import("crypto");
const SHA256 = crypto.SHA256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== SHA256 Streaming API ===\n\n", .{});

    // Example 1: Basic streaming vs one-shot
    std.debug.print("1. Streaming vs One-Shot Hashing\n", .{});
    std.debug.print("{s}\n", .{"-" ** 60});

    const data = [_]u8{ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };

    // One-shot hashing
    const one_shot_hash = SHA256.hash(&data);
    std.debug.print("One-shot hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&one_shot_hash)});

    // Streaming hashing (same result)
    var hasher = SHA256.init();
    hasher.update(&[_]u8{ 1, 2, 3 });
    hasher.update(&[_]u8{ 4, 5, 6 });
    hasher.update(&[_]u8{ 7, 8, 9, 10 });
    const stream_hash = hasher.final();
    std.debug.print("Stream hash:   0x{s}\n", .{std.fmt.fmtSliceHexLower(&stream_hash)});
    std.debug.print("Results match: {}\n\n", .{std.mem.eql(u8, &one_shot_hash, &stream_hash)});

    // Example 2: Chunk size independence
    std.debug.print("2. Chunk Size Independence\n", .{});
    std.debug.print("{s}\n", .{"-" ** 60});
    std.debug.print("Different chunk sizes produce identical hashes\n\n", .{});

    var test_data: [100]u8 = undefined;
    for (&test_data, 0..) |*b, i| {
        b.* = @intCast(i & 0xFF);
    }

    const chunk_sizes = [_]usize{ 1, 7, 16, 32, 64, 100 };
    var hashes: [6][32]u8 = undefined;

    for (chunk_sizes, 0..) |chunk_size, idx| {
        var h = SHA256.init();
        var i: usize = 0;
        while (i < test_data.len) : (i += chunk_size) {
            const end = @min(i + chunk_size, test_data.len);
            h.update(test_data[i..end]);
        }
        hashes[idx] = h.final();

        std.debug.print("Chunk size {d:>3}: 0x{s}...\n", .{
            chunk_size,
            std.fmt.fmtSliceHexLower(hashes[idx][0..10]),
        });
    }

    // Verify all hashes are identical
    var all_same = true;
    for (hashes[1..]) |hash| {
        if (!std.mem.eql(u8, &hashes[0], &hash)) {
            all_same = false;
            break;
        }
    }
    std.debug.print("\nAll hashes identical: {}\n\n", .{all_same});

    // Example 3: Simulated file hashing with progress
    std.debug.print("3. File Hashing with Progress Tracking\n", .{});
    std.debug.print("{s}\n", .{"-" ** 60});

    const file_size = 1024 * 1024; // 1MB
    const chunk_size = 64 * 1024; // 64KB
    std.debug.print("Hashing {} bytes in {} byte chunks...\n\n", .{ file_size, chunk_size });

    var file_hasher = SHA256.init();
    var processed: usize = 0;

    while (processed < file_size) {
        const remaining = file_size - processed;
        const current_chunk = @min(chunk_size, remaining);

        // Simulate chunk data
        var chunk = try allocator.alloc(u8, current_chunk);
        defer allocator.free(chunk);
        for (chunk, 0..) |*b, i| {
            b.* = @intCast((processed + i) & 0xFF);
        }

        file_hasher.update(chunk);
        processed += current_chunk;

        // Report progress
        const progress = (@as(f64, @floatFromInt(processed)) / @as(f64, @floatFromInt(file_size))) * 100.0;
        if (processed == file_size or processed % (chunk_size * 10) == 0) {
            std.debug.print("Progress: {d:.1}% ({}/{}bytes)\n", .{ progress, processed, file_size });
        }
    }

    const large_file_hash = file_hasher.final();
    std.debug.print("\nFinal hash: 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&large_file_hash)});

    // Example 4: Optimal chunk sizes
    std.debug.print("4. Optimal Chunk Sizes\n", .{});
    std.debug.print("{s}\n", .{"-" ** 60});
    std.debug.print("Block size: {} bytes (internal processing unit)\n", .{SHA256.block_size});
    std.debug.print("\nRecommended chunk sizes:\n", .{});
    std.debug.print("  Minimum:  64 bytes (1 block)\n", .{});
    std.debug.print("  Optimal:  16-64 KB (256-1024 blocks)\n", .{});
    std.debug.print("  Maximum:  Limited by available memory\n\n", .{});

    // Demonstrate block size alignment
    const block_aligned_chunks = [_]usize{
        SHA256.block_size,       // 64 bytes
        SHA256.block_size * 16,  // 1 KB
        SHA256.block_size * 256, // 16 KB
        SHA256.block_size * 1024, // 64 KB
    };

    std.debug.print("Block-aligned chunk sizes:\n", .{});
    for (block_aligned_chunks) |size| {
        const blocks = size / SHA256.block_size;
        std.debug.print("  {d:>6} bytes = {d:>4} blocks\n", .{ size, blocks });
    }
    std.debug.print("\n", .{});

    // Example 5: Multi-part message hashing
    std.debug.print("5. Multi-Part Message Hashing\n", .{});
    std.debug.print("{s}\n", .{"-" ** 60});
    std.debug.print("Hashing multi-part message:\n\n", .{});

    const parts = [_][]const u8{
        "Subject: Important Message",
        "This is the message body.",
        "Sent from my device",
    };

    var multi_hasher = SHA256.init();
    for (parts) |part| {
        multi_hasher.update(part);
        std.debug.print("  Part: \"{s}\"\n", .{part});
        std.debug.print("    Bytes: {}\n", .{part.len});
    }

    const multi_hash = multi_hasher.final();
    std.debug.print("\nMulti-part hash: 0x{s}\n\n", .{std.fmt.fmtSliceHexLower(&multi_hash)});

    // Example 6: Hasher lifecycle
    std.debug.print("6. Hasher Lifecycle\n", .{});
    std.debug.print("{s}\n", .{"-" ** 60});

    var h = SHA256.init();
    h.update(&[_]u8{ 1, 2, 3 });
    std.debug.print("Updated with [1, 2, 3]\n", .{});

    const digest = h.final();
    std.debug.print("Called final(): 0x{s}...\n\n", .{std.fmt.fmtSliceHexLower(digest[0..10])});

    std.debug.print("Hasher is now finalized\n", .{});
    std.debug.print("For new hash, create new hasher instance:\n", .{});
    _ = SHA256.init();
    std.debug.print("Created new hasher ✓\n\n", .{});

    std.debug.print("=== Streaming API Complete ===\n", .{});
}
