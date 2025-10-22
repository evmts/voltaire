//! RLP Encoding and Decoding Example
//!
//! This example demonstrates how to use the RLP (Recursive Length Prefix) module
//! to encode and decode various data types according to the Ethereum specification.
//!
//! RLP is Ethereum's primary serialization format used for transactions, blocks,
//! and other data structures. It encodes arbitrarily nested arrays of binary data.

const std = @import("std");
const primitives = @import("primitives");
const rlp = primitives.rlp;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== RLP Encoding and Decoding Examples ===\n\n", .{});

    // Example 1: Encoding and decoding simple bytes
    try example_encode_bytes(allocator);

    // Example 2: Encoding and decoding integers
    try example_encode_integers(allocator);

    // Example 3: Encoding and decoding lists
    try example_encode_lists(allocator);

    // Example 4: Stream decoding multiple items
    try example_stream_decoding(allocator);

    // Example 5: Working with nested structures
    try example_nested_structures(allocator);

    std.debug.print("\n=== All Examples Completed Successfully ===\n", .{});
}

/// Example 1: Encoding and decoding simple byte arrays
fn example_encode_bytes(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 1: Encoding Bytes ---\n", .{});

    // Single byte values less than 0x80 are encoded as themselves
    {
        const single_byte = "a";
        const encoded = try rlp.encode(allocator, single_byte);
        defer allocator.free(encoded);

        std.debug.print("Input: \"{s}\"\n", .{single_byte});
        std.debug.print("Encoded (hex): ", .{});
        printHex(encoded);
        std.debug.print("Encoded length: {} bytes\n", .{encoded.len});

        // Decode to verify
        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .String => |str| {
                std.debug.print("Decoded: \"{s}\"\n", .{str});
            },
            .List => unreachable,
        }
        std.debug.print("\n", .{});
    }

    // Short strings (0-55 bytes) are prefixed with 0x80 + length
    {
        const short_string = "dog";
        const encoded = try rlp.encode(allocator, short_string);
        defer allocator.free(encoded);

        std.debug.print("Input: \"{s}\" ({} bytes)\n", .{ short_string, short_string.len });
        std.debug.print("Encoded (hex): ", .{});
        printHex(encoded);
        std.debug.print("Prefix byte: 0x{x} (0x80 + {})\n", .{ encoded[0], short_string.len });

        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .String => |str| {
                std.debug.print("Decoded: \"{s}\"\n", .{str});
            },
            .List => unreachable,
        }
        std.debug.print("\n", .{});
    }

    // Long strings (>55 bytes) use 0xb7 + length_of_length encoding
    {
        const long_string = "This is a long string that exceeds 55 bytes and requires the long form RLP encoding";
        const encoded = try rlp.encode(allocator, long_string);
        defer allocator.free(encoded);

        std.debug.print("Input: \"{s}\" ({} bytes)\n", .{ long_string, long_string.len });
        std.debug.print("Encoded (hex prefix): ", .{});
        printHex(encoded[0..4]);
        std.debug.print("Prefix byte: 0x{x}\n", .{encoded[0]});
        std.debug.print("Total encoded length: {} bytes\n", .{encoded.len});

        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .String => |str| {
                std.debug.print("Decoded length: {} bytes\n", .{str.len});
                std.debug.print("Strings match: {}\n", .{std.mem.eql(u8, long_string, str)});
            },
            .List => unreachable,
        }
        std.debug.print("\n", .{});
    }
}

/// Example 2: Encoding and decoding integers
fn example_encode_integers(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 2: Encoding Integers ---\n", .{});

    // Zero is encoded as the empty string (0x80)
    {
        const value: u64 = 0;
        const encoded = try rlp.encode(allocator, value);
        defer allocator.free(encoded);

        std.debug.print("Input: {}\n", .{value});
        std.debug.print("Encoded (hex): ", .{});
        printHex(encoded);
        std.debug.print("Note: Zero is encoded as empty string (0x80)\n\n", .{});
    }

    // Small integers less than 128 (0x80) are encoded as single bytes
    {
        const value: u8 = 15;
        const encoded = try rlp.encode(allocator, value);
        defer allocator.free(encoded);

        std.debug.print("Input: {}\n", .{value});
        std.debug.print("Encoded (hex): ", .{});
        printHex(encoded);
        std.debug.print("Note: Single byte less than 0x80 encodes as itself\n\n", .{});
    }

    // Larger integers are encoded as byte arrays with minimal leading bytes
    {
        const value: u64 = 1024;
        const encoded = try rlp.encode(allocator, value);
        defer allocator.free(encoded);

        std.debug.print("Input: {}\n", .{value});
        std.debug.print("Encoded (hex): ", .{});
        printHex(encoded);
        std.debug.print("Format: [0x80+len, byte1, byte2, ...]\n", .{});
        std.debug.print("Explanation: 0x{x} = prefix, 0x{x} 0x{x} = 1024 in big-endian\n\n", .{ encoded[0], encoded[1], encoded[2] });
    }

    // Large integer
    {
        const value: u64 = 1_000_000;
        const encoded = try rlp.encode(allocator, value);
        defer allocator.free(encoded);

        std.debug.print("Input: {}\n", .{value});
        std.debug.print("Encoded (hex): ", .{});
        printHex(encoded);
        std.debug.print("Encoded length: {} bytes\n\n", .{encoded.len});
    }
}

/// Example 3: Encoding and decoding lists
fn example_encode_lists(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 3: Encoding Lists ---\n", .{});

    // Empty list
    {
        const empty_list: [0][]const u8 = .{};
        const encoded = try rlp.encode(allocator, empty_list[0..]);
        defer allocator.free(encoded);

        std.debug.print("Input: [] (empty list)\n", .{});
        std.debug.print("Encoded (hex): ", .{});
        printHex(encoded);
        std.debug.print("Note: 0xc0 represents an empty list\n\n", .{});
    }

    // List of strings
    {
        const list = [_][]const u8{ "cat", "dog", "mouse" };
        const encoded = try rlp.encode(allocator, list[0..]);
        defer allocator.free(encoded);

        std.debug.print("Input: [\"cat\", \"dog\", \"mouse\"]\n", .{});
        std.debug.print("Encoded (hex): ", .{});
        printHex(encoded);
        std.debug.print("Total encoded length: {} bytes\n", .{encoded.len});

        // Decode and verify
        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .List => |items| {
                std.debug.print("Decoded list with {} items:\n", .{items.len});
                for (items, 0..) |item, i| {
                    switch (item) {
                        .String => |str| {
                            std.debug.print("  [{}]: \"{s}\"\n", .{ i, str });
                        },
                        .List => unreachable,
                    }
                }
            },
            .String => unreachable,
        }
        std.debug.print("\n", .{});
    }

    // List of integers
    {
        const numbers = [_]u32{ 1, 2, 3, 4, 5 };
        const encoded = try rlp.encode(allocator, numbers[0..]);
        defer allocator.free(encoded);

        std.debug.print("Input: [1, 2, 3, 4, 5]\n", .{});
        std.debug.print("Encoded (hex): ", .{});
        printHex(encoded);

        const decoded = try rlp.decode(allocator, encoded, false);
        defer decoded.data.deinit(allocator);

        switch (decoded.data) {
            .List => |items| {
                std.debug.print("Decoded list with {} items:\n", .{items.len});
                for (items, 0..) |item, i| {
                    switch (item) {
                        .String => |bytes| {
                            // Integers are decoded as byte arrays
                            const value = if (bytes.len == 0) 0 else if (bytes.len == 1) bytes[0] else blk: {
                                var val: u32 = 0;
                                for (bytes) |byte| {
                                    val = (val << 8) | byte;
                                }
                                break :blk val;
                            };
                            std.debug.print("  [{}]: {}\n", .{ i, value });
                        },
                        .List => unreachable,
                    }
                }
            },
            .String => unreachable,
        }
        std.debug.print("\n", .{});
    }
}

/// Example 4: Stream decoding - processing multiple RLP items sequentially
fn example_stream_decoding(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 4: Stream Decoding ---\n", .{});

    // Create multiple encoded items
    const item1 = try rlp.encode(allocator, "first");
    defer allocator.free(item1);

    const item2 = try rlp.encode(allocator, @as(u64, 42));
    defer allocator.free(item2);

    const list_items = [_][]const u8{ "a", "b", "c" };
    const item3 = try rlp.encode(allocator, list_items[0..]);
    defer allocator.free(item3);

    // Concatenate all items into a stream
    const stream = try std.mem.concat(allocator, u8, &[_][]const u8{ item1, item2, item3 });
    defer allocator.free(stream);

    std.debug.print("Created stream with {} bytes containing 3 RLP items\n", .{stream.len});
    std.debug.print("Stream (hex): ", .{});
    printHex(stream);
    std.debug.print("\n", .{});

    // Decode items one by one using stream mode
    var remaining: []const u8 = stream;
    var item_count: usize = 0;

    while (remaining.len > 0) {
        item_count += 1;
        // Pass true for stream mode to allow remainder
        const decoded = try rlp.decode(allocator, remaining, true);
        defer decoded.data.deinit(allocator);

        std.debug.print("Item {}: ", .{item_count});
        switch (decoded.data) {
            .String => |str| {
                if (str.len > 0 and str.len < 20) {
                    std.debug.print("String: \"{s}\"\n", .{str});
                } else if (str.len == 0) {
                    std.debug.print("Empty string (integer 0)\n", .{});
                } else {
                    std.debug.print("Bytes ({} bytes)\n", .{str.len});
                }
            },
            .List => |items| {
                std.debug.print("List with {} items: [", .{items.len});
                for (items, 0..) |item, i| {
                    switch (item) {
                        .String => |s| {
                            std.debug.print("\"{s}\"", .{s});
                            if (i < items.len - 1) std.debug.print(", ", .{});
                        },
                        .List => std.debug.print("[...]", .{}),
                    }
                }
                std.debug.print("]\n", .{});
            },
        }

        remaining = decoded.remainder;
    }

    std.debug.print("Successfully decoded {} items from stream\n\n", .{item_count});
}

/// Example 5: Working with nested structures
fn example_nested_structures(allocator: std.mem.Allocator) !void {
    std.debug.print("--- Example 5: Nested Structures ---\n", .{});

    // Create a list containing other lists: [["cat"], ["dog", "mouse"]]
    std.debug.print("Creating nested structure: [[\"cat\"], [\"dog\", \"mouse\"]]\n", .{});

    // First, encode inner lists
    const inner1 = [_][]const u8{"cat"};
    const encoded_inner1 = try rlp.encode(allocator, inner1[0..]);
    defer allocator.free(encoded_inner1);

    const inner2 = [_][]const u8{ "dog", "mouse" };
    const encoded_inner2 = try rlp.encode(allocator, inner2[0..]);
    defer allocator.free(encoded_inner2);

    // Now encode the outer list containing the encoded inner lists
    const outer = [_][]const u8{ encoded_inner1, encoded_inner2 };
    const encoded_outer = try rlp.encode(allocator, outer[0..]);
    defer allocator.free(encoded_outer);

    std.debug.print("Encoded (hex): ", .{});
    printHex(encoded_outer);
    std.debug.print("Total size: {} bytes\n\n", .{encoded_outer.len});

    // Decode and display the nested structure
    const decoded = try rlp.decode(allocator, encoded_outer, false);
    defer decoded.data.deinit(allocator);

    std.debug.print("Decoded nested structure:\n", .{});
    switch (decoded.data) {
        .List => |outer_items| {
            std.debug.print("Outer list with {} items:\n", .{outer_items.len});
            for (outer_items, 0..) |outer_item, i| {
                std.debug.print("  Item {}:\n", .{i});
                switch (outer_item) {
                    .List => |inner_items| {
                        std.debug.print("    Inner list with {} items:\n", .{inner_items.len});
                        for (inner_items, 0..) |inner_item, j| {
                            switch (inner_item) {
                                .String => |str| {
                                    std.debug.print("      [{}]: \"{s}\"\n", .{ j, str });
                                },
                                .List => {},
                            }
                        }
                    },
                    .String => |str| {
                        std.debug.print("    String: \"{s}\"\n", .{str});
                    },
                }
            }
        },
        .String => unreachable,
    }
    std.debug.print("\n", .{});
}

/// Helper function to print bytes as hex
fn printHex(bytes: []const u8) void {
    for (bytes) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
}
