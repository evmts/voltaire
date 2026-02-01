const std = @import("std");
const primitives = @import("primitives");
const Hash = primitives.hash.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const a = gpa.allocator();

    std.debug.print("\n=== Hash Validation Example ===\n\n", .{});

    // ============================================================
    // 1. Hex String Validation
    // ============================================================

    std.debug.print("1. Hex String Validation\n\n", .{});

    const TestCase = struct {
        input: []const u8,
        expected: bool,
        reason: []const u8,
    };

    const test_cases = [_]TestCase{
        .{ .input = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", .expected = true, .reason = "Valid with 0x prefix" },
        .{ .input = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", .expected = true, .reason = "Valid without 0x prefix" },
        .{ .input = "0x1234", .expected = false, .reason = "Too short" },
        .{ .input = "0xGGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", .expected = false, .reason = "Invalid hex chars" },
        .{ .input = "0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF", .expected = true, .reason = "Valid uppercase" },
        .{ .input = "", .expected = false, .reason = "Empty string" },
        .{ .input = "0x", .expected = false, .reason = "Only prefix" },
    };

    std.debug.print("Test cases:\n", .{});
    for (test_cases) |case| {
        const is_valid = Hash.isValid(case.input);
        const status: u8 = if (is_valid == case.expected) '✓' else '✗';
        const display = if (case.input.len > 20) blk: {
            var buf: [20]u8 = undefined;
            @memcpy(buf[0..10], case.input[0..10]);
            @memcpy(buf[10..17], "...");
            break :blk buf[0..17];
        } else case.input;
        std.debug.print("  {c} {s:<20} → {} ({s})\n", .{ status, display, is_valid, case.reason });
    }
    std.debug.print("\n", .{});

    // ============================================================
    // 2. Safe Parsing Patterns
    // ============================================================

    std.debug.print("2. Safe Parsing Patterns\n\n", .{});

    // Pattern 1: Return optional (null on error)
    const valid_input = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef";
    const invalid_input = "0x1234";

    std.debug.print("Pattern 1 (optional):\n", .{});

    // Valid
    if (Hash.isValid(valid_input)) {
        const result1 = Hash.fromHex(valid_input) catch null;
        if (result1) |hash| {
            const hex = Hash.toHex(hash);
            std.debug.print("  Valid:   0x{s}...{s}\n", .{ hex[2..8], hex[hex.len - 4 ..] });
        } else {
            std.debug.print("  Valid:   null\n", .{});
        }
    } else {
        std.debug.print("  Valid:   invalid format\n", .{});
    }

    // Invalid
    if (Hash.isValid(invalid_input)) {
        const result2 = Hash.fromHex(invalid_input) catch null;
        if (result2) |hash| {
            const hex = Hash.toHex(hash);
            std.debug.print("  Invalid: 0x{s}...{s}\n", .{ hex[2..8], hex[hex.len - 4 ..] });
        } else {
            std.debug.print("  Invalid: null\n", .{});
        }
    } else {
        std.debug.print("  Invalid: invalid format\n", .{});
    }

    std.debug.print("\nPattern 2 (error return):\n", .{});

    // Valid
    const result3 = Hash.fromHex(valid_input) catch |err| {
        std.debug.print("  Error: {}\n", .{err});
        return err;
    };
    const hex3 = Hash.toHex(result3);
    std.debug.print("  Valid:   0x{s}...{s}\n", .{ hex3[2..8], hex3[hex3.len - 4 ..] });

    // Invalid
    _ = Hash.fromHex(invalid_input) catch |err| {
        std.debug.print("  Invalid: Error: {}\n", .{err});
    };

    std.debug.print("\n", .{});

    // ============================================================
    // 3. Type Safety (Compile-Time)
    // ============================================================

    std.debug.print("3. Type Safety\n\n", .{});

    // In Zig, Hash is [32]u8 - type checked at compile time
    const hash = Hash.random();
    const bytes32: [32]u8 = hash; // Valid
    const hex_typed = Hash.toHex(bytes32);
    std.debug.print("  Hash instance: 0x{s}...{s}\n", .{ hex_typed[2..8], hex_typed[hex_typed.len - 4 ..] });

    // Wrong length would cause compile error
    // var bytes20: [20]u8 = undefined;
    // const invalid: Hash = bytes20; // Compile error!

    std.debug.print("  (Zig provides compile-time type safety)\n\n", .{});

    // ============================================================
    // 4. Filtering Collections
    // ============================================================

    std.debug.print("4. Filtering Collections\n\n", .{});

    var valid_hashes = std.ArrayList(Hash).init(a);
    defer valid_hashes.deinit();

    // Simulate mixed values - in Zig we'd use tagged union
    const hash1 = Hash.random();
    const hash2 = try Hash.keccak256String("hello");

    try valid_hashes.append(hash1);
    try valid_hashes.append(hash2);

    std.debug.print("Valid hashes: {}\n", .{valid_hashes.items.len});
    std.debug.print("Filtered hashes:\n", .{});
    for (valid_hashes.items, 0..) |h, i| {
        const hex = Hash.toHex(h);
        std.debug.print("  {}. 0x{s}...{s}\n", .{ i + 1, hex[2..8], hex[hex.len - 4 ..] });
    }
    std.debug.print("\n", .{});

    // ============================================================
    // 5. API Parameter Validation
    // ============================================================

    std.debug.print("5. API Parameter Validation\n\n", .{});

    const GetLogsParams = struct {
        from_block: u64,
        to_block: u64,
        topics: []const ?[]const u8,
    };

    const validateGetLogsParams = struct {
        fn validate(params: GetLogsParams) !void {
            if (params.to_block < params.from_block) {
                return error.InvalidBlockRange;
            }

            for (params.topics, 0..) |topic, i| {
                if (topic) |t| {
                    if (!Hash.isValid(t)) {
                        std.debug.print("Invalid topic at index {}\n", .{i});
                        return error.InvalidTopic;
                    }
                }
            }
        }
    }.validate;

    // Valid params
    const valid_topics = [_]?[]const u8{
        "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
        null,
        null,
    };
    const valid_params = GetLogsParams{
        .from_block = 1000,
        .to_block = 2000,
        .topics = &valid_topics,
    };

    validateGetLogsParams(valid_params) catch |err| {
        std.debug.print("  ✗ Error: {}\n", .{err});
    };
    std.debug.print("  ✓ Valid params accepted\n", .{});

    // Invalid params
    const invalid_topics = [_]?[]const u8{"0x1234"}; // Too short
    const invalid_params = GetLogsParams{
        .from_block = 1000,
        .to_block = 2000,
        .topics = &invalid_topics,
    };

    validateGetLogsParams(invalid_params) catch |err| {
        std.debug.print("  ✗ Error: {}\n", .{err});
    };
    std.debug.print("\n", .{});

    // ============================================================
    // 6. Zero Hash Validation
    // ============================================================

    std.debug.print("6. Zero Hash Validation\n\n", .{});

    const hashes = [_]Hash{
        Hash.fromBytes(&([_]u8{0} ** 32)), // Zero
        try Hash.keccak256String("hello"), // Non-zero
        Hash.ZERO, // Zero constant
        Hash.random(), // Non-zero
    };

    std.debug.print("Zero hash checks:\n", .{});
    for (hashes, 0..) |h, i| {
        const is_zero = Hash.isZero(h);
        const status = if (is_zero) "ZERO" else "NON-ZERO";
        const hex = Hash.toHex(h);
        std.debug.print("  {}. 0x{s}...{s} → {s}\n", .{ i + 1, hex[2..8], hex[hex.len - 4 ..], status });
    }
    std.debug.print("\n", .{});

    // ============================================================
    // 7. Batch Validation
    // ============================================================

    std.debug.print("7. Batch Validation\n\n", .{});

    const batch_inputs = [_][]const u8{
        "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "0x1234", // Invalid
        "0xGGGG567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef", // Invalid
        "0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
    };

    var valid_list = std.ArrayList(Hash).init(a);
    defer valid_list.deinit();
    var invalid_list = std.ArrayList([]const u8).init(a);
    defer invalid_list.deinit();

    for (batch_inputs) |input| {
        if (Hash.isValid(input)) {
            if (Hash.fromHex(input)) |hash| {
                try valid_list.append(hash);
            } else |_| {
                try invalid_list.append(input);
            }
        } else {
            try invalid_list.append(input);
        }
    }

    std.debug.print("Total inputs: {}\n", .{batch_inputs.len});
    std.debug.print("Valid: {}\n", .{valid_list.items.len});
    std.debug.print("Invalid: {}\n", .{invalid_list.items.len});
    std.debug.print("\nInvalid inputs:\n", .{});
    for (invalid_list.items) |input| {
        const display = if (input.len > 20) blk: {
            var buf: [17]u8 = undefined;
            @memcpy(buf[0..10], input[0..10]);
            @memcpy(buf[10..], "...");
            break :blk buf[0..];
        } else input;
        std.debug.print("  - {s}\n", .{display});
    }
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
