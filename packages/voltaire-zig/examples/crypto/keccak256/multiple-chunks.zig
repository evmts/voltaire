const std = @import("std");
const crypto = @import("crypto");

/// Multiple Chunk Hashing
///
/// Demonstrates efficient hashing of pre-chunked data:
/// - Hash multiple chunks in sequence
/// - Merkle tree construction
/// - ABI encoding patterns
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== Multiple Chunk Hashing ===\n\n", .{});

    // 1. Basic Multiple Chunk Hashing
    try stdout.print("1. Basic Multiple Chunk Hashing\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const chunk1 = [_]u8{ 1, 2, 3 };
    const chunk2 = [_]u8{ 4, 5, 6 };
    const chunk3 = [_]u8{ 7, 8, 9 };

    // Method 1: Hash chunks via batch
    const chunks = [_][]const u8{ &chunk1, &chunk2, &chunk3 };
    var batch_hashes: [3][32]u8 = undefined;
    try crypto.keccak_asm.keccak256_batch(&chunks, &batch_hashes);

    // Method 2: Hash concatenated
    const concatenated = [_]u8{ 1, 2, 3, 4, 5, 6, 7, 8, 9 };
    var single_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&concatenated, &single_hash);

    try stdout.print("Chunk 1: [{d}, {d}, {d}]\n", .{ chunk1[0], chunk1[1], chunk1[2] });
    try stdout.print("Chunk 2: [{d}, {d}, {d}]\n", .{ chunk2[0], chunk2[1], chunk2[2] });
    try stdout.print("Chunk 3: [{d}, {d}, {d}]\n\n", .{ chunk3[0], chunk3[1], chunk3[2] });

    // Hash concatenated chunks as single operation
    try stdout.print("Hash from concatenated: 0x", .{});
    for (single_hash) |byte| try stdout.print("{x:0>2}", .{byte});

    // For comparison, show that batching produces individual hashes
    try stdout.print("\n\nNote: Batch hashing produces separate hashes\n", .{});
    try stdout.print("For Merkle trees, combine hashes explicitly\n\n", .{});

    // 2. Merkle Tree Node Hashing
    try stdout.print("2. Merkle Tree Node Hashing\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Pattern: hash(leftHash ++ rightHash)\n\n", .{});

    // Create leaf hashes
    var leaf1: [32]u8 = undefined;
    var leaf2: [32]u8 = undefined;
    var leaf3: [32]u8 = undefined;
    var leaf4: [32]u8 = undefined;

    try crypto.keccak_asm.keccak256("Transaction 1", &leaf1);
    try crypto.keccak_asm.keccak256("Transaction 2", &leaf2);
    try crypto.keccak_asm.keccak256("Transaction 3", &leaf3);
    try crypto.keccak_asm.keccak256("Transaction 4", &leaf4);

    try stdout.print("Leaf hashes:\n", .{});
    try stdout.print("  Leaf 1: 0x", .{});
    for (leaf1[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n", .{});
    try stdout.print("  Leaf 2: 0x", .{});
    for (leaf2[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n", .{});
    try stdout.print("  Leaf 3: 0x", .{});
    for (leaf3[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n", .{});
    try stdout.print("  Leaf 4: 0x", .{});
    for (leaf4[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n\n", .{});

    // Build tree level 1 - concatenate leaf hashes
    var node1_input: [64]u8 = undefined;
    @memcpy(node1_input[0..32], &leaf1);
    @memcpy(node1_input[32..64], &leaf2);
    var node1: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&node1_input, &node1);

    var node2_input: [64]u8 = undefined;
    @memcpy(node2_input[0..32], &leaf3);
    @memcpy(node2_input[32..64], &leaf4);
    var node2: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&node2_input, &node2);

    try stdout.print("Level 1 nodes:\n", .{});
    try stdout.print("  Node 1: 0x", .{});
    for (node1[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n", .{});
    try stdout.print("  Node 2: 0x", .{});
    for (node2[0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("...\n\n", .{});

    // Build root
    var root_input: [64]u8 = undefined;
    @memcpy(root_input[0..32], &node1);
    @memcpy(root_input[32..64], &node2);
    var root: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&root_input, &root);

    try stdout.print("Merkle root: 0x", .{});
    for (root) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    // 3. Streaming Data Pattern
    try stdout.print("3. Streaming Data Pattern\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Hash large data in chunks without loading all at once\n\n", .{});

    // Simulate receiving data in chunks
    const data_chunks = [_][]const u8{
        "This is chunk 1. ",
        "This is chunk 2. ",
        "This is chunk 3. ",
        "End of data.",
    };

    // Concatenate all chunks
    var buffer = std.ArrayList(u8).init(allocator);
    defer buffer.deinit();

    try stdout.print("Chunks received:\n", .{});
    for (data_chunks, 0..) |chunk, i| {
        try stdout.print("  Chunk {d}: \"{s}\"\n", .{ i + 1, chunk });
        try buffer.appendSlice(chunk);
    }

    var stream_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(buffer.items, &stream_hash);

    try stdout.print("\nStream hash: 0x", .{});
    for (stream_hash) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    // 4. Message Signing with Prefix (EIP-191)
    try stdout.print("4. Message Signing with Prefix (EIP-191)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Pattern: keccak256(prefix ++ message)\n\n", .{});

    const message = "Hello, Ethereum!";
    const prefix = "\x19Ethereum Signed Message:\n";

    // Build complete message: prefix + length + message
    var eip191_buffer = std.ArrayList(u8).init(allocator);
    defer eip191_buffer.deinit();

    try eip191_buffer.appendSlice(prefix);
    try std.fmt.format(eip191_buffer.writer(), "{d}", .{message.len});
    try eip191_buffer.appendSlice(message);

    var eip191_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(eip191_buffer.items, &eip191_hash);

    try stdout.print("Prefix:  \"\\x19Ethereum Signed Message:\\n\"\n", .{});
    try stdout.print("Length:  {d}\n", .{message.len});
    try stdout.print("Message: \"{s}\"\n\n", .{message});
    try stdout.print("EIP-191 hash: 0x", .{});
    for (eip191_hash) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    // 5. Dynamic Array Encoding
    try stdout.print("5. Dynamic Array Encoding\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("ABI encoding: length ++ elements\n\n", .{});

    // Encode array: [1, 2, 3, 4, 5]
    var array_buffer = std.ArrayList(u8).init(allocator);
    defer array_buffer.deinit();

    // Length (32 bytes, big-endian 5)
    var length_bytes = [_]u8{0} ** 32;
    length_bytes[31] = 5;
    try array_buffer.appendSlice(&length_bytes);

    // Elements (5 x 32 bytes)
    for (1..6) |i| {
        var element = [_]u8{0} ** 32;
        element[31] = @intCast(i);
        try array_buffer.appendSlice(&element);
    }

    var array_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(array_buffer.items, &array_hash);

    try stdout.print("Array: [1, 2, 3, 4, 5]\n", .{});
    try stdout.print("Encoded bytes: {d} (32 length + 5*32 elements)\n", .{array_buffer.items.len});
    try stdout.print("\nArray encoding hash: 0x", .{});
    for (array_hash) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    // 6. Batch Processing Performance
    try stdout.print("6. Batch Processing\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const batch_size = 10;
    var inputs: [batch_size][]const u8 = undefined;
    var input_data: [batch_size][16]u8 = undefined;
    var outputs: [batch_size][32]u8 = undefined;

    // Prepare input data
    for (0..batch_size) |i| {
        for (input_data[i], 0..) |*byte, j| {
            byte.* = @truncate((i * 16 + j));
        }
        inputs[i] = &input_data[i];
    }

    // Batch hash all inputs
    try crypto.keccak_asm.keccak256_batch(&inputs, &outputs);

    try stdout.print("Batch processed {d} inputs\n", .{batch_size});
    try stdout.print("\nFirst 3 hashes:\n", .{});
    for (0..3) |i| {
        try stdout.print("  Hash {d}: 0x", .{i + 1});
        for (outputs[i][0..10]) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print("...\n", .{});
    }
    try stdout.print("\n", .{});

    try stdout.print("=== Complete ===\n", .{});
}
