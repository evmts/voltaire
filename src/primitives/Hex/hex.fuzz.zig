//! Fuzz tests for Hex module
//!
//! Tests hex encoding/decoding, validation, numeric conversions, and utility functions
//! with random inputs to find edge cases, panics, and memory issues.
//!
//! Run with: zig build test --fuzz
//! Or with Docker on macOS:
//!   docker run --rm -it -v $(pwd):/workspace -w /workspace \
//!     ziglang/zig:0.15.1 zig build test --fuzz=300s

const std = @import("std");
const testing = std.testing;
const hex = @import("hex.zig");

fn fuzzIsHex(_: void, input: []const u8) !void {
    const result = hex.isHex(input);

    if (result) {
        try testing.expect(input.len >= 3);
        try testing.expect(std.mem.eql(u8, input[0..2], "0x"));

        for (input[2..]) |c| {
            const valid = switch (c) {
                '0'...'9', 'a'...'f', 'A'...'F' => true,
                else => false,
            };
            try testing.expect(valid);
        }
    }
}

test "fuzz isHex validation" {
    try testing.fuzz({}, fuzzIsHex, .{});
}

fn fuzzHexToBytes(_: void, input: []const u8) !void {
    const result = hex.hexToBytes(testing.allocator, input) catch |err| {
        switch (err) {
            error.InvalidHexFormat,
            error.OddLengthHex,
            error.InvalidHexCharacter,
            error.OutOfMemory,
            => return,
            else => return err,
        }
    };
    defer testing.allocator.free(result);

    try testing.expect(input.len >= 2);
    try testing.expect(std.mem.eql(u8, input[0..2], "0x"));

    const hex_digits = input[2..];
    try testing.expect(hex_digits.len % 2 == 0);
    try testing.expectEqual(hex_digits.len / 2, result.len);
}

test "fuzz hexToBytes conversion" {
    try testing.fuzz({}, fuzzHexToBytes, .{});
}

fn fuzzBytesToHex(_: void, input: []const u8) !void {
    const result = hex.bytesToHex(testing.allocator, input) catch |err| {
        try testing.expectEqual(error.OutOfMemory, err);
        return;
    };
    defer testing.allocator.free(result);

    try testing.expect(result.len >= 2);
    try testing.expectEqualStrings("0x", result[0..2]);
    try testing.expectEqual(2 + input.len * 2, result.len);

    if (input.len > 0) {
        try testing.expect(hex.isHex(result));
    }
}

test "fuzz bytesToHex conversion" {
    try testing.fuzz({}, fuzzBytesToHex, .{});
}

fn fuzzHexRoundtrip(_: void, input: []const u8) !void {
    const hex_str = hex.bytesToHex(testing.allocator, input) catch return;
    defer testing.allocator.free(hex_str);

    const decoded = hex.hexToBytes(testing.allocator, hex_str) catch unreachable;
    defer testing.allocator.free(decoded);

    try testing.expectEqualSlices(u8, input, decoded);
}

test "fuzz hex roundtrip" {
    try testing.fuzz({}, fuzzHexRoundtrip, .{});
}

fn fuzzHexToBytesFixed(_: void, input: []const u8) !void {
    const sizes = [_]usize{ 1, 2, 4, 8, 16, 20, 32, 64 };
    for (sizes) |size| {
        switch (size) {
            1 => {
                const arr = hex.hexToBytesFixed(1, input) catch continue;
                try testing.expectEqual(@as(usize, 1), arr.len);
            },
            2 => {
                const arr = hex.hexToBytesFixed(2, input) catch continue;
                try testing.expectEqual(@as(usize, 2), arr.len);
            },
            4 => {
                const arr = hex.hexToBytesFixed(4, input) catch continue;
                try testing.expectEqual(@as(usize, 4), arr.len);
            },
            8 => {
                const arr = hex.hexToBytesFixed(8, input) catch continue;
                try testing.expectEqual(@as(usize, 8), arr.len);
            },
            16 => {
                const arr = hex.hexToBytesFixed(16, input) catch continue;
                try testing.expectEqual(@as(usize, 16), arr.len);
            },
            20 => {
                const arr = hex.hexToBytesFixed(20, input) catch continue;
                try testing.expectEqual(@as(usize, 20), arr.len);
            },
            32 => {
                const arr = hex.hexToBytesFixed(32, input) catch continue;
                try testing.expectEqual(@as(usize, 32), arr.len);
            },
            64 => {
                const arr = hex.hexToBytesFixed(64, input) catch continue;
                try testing.expectEqual(@as(usize, 64), arr.len);
            },
            else => unreachable,
        }
    }
}

test "fuzz hexToBytesFixed" {
    try testing.fuzz({}, fuzzHexToBytesFixed, .{});
}

fn fuzzHexToU256(_: void, input: []const u8) !void {
    const result = hex.hexToU256(input) catch |err| {
        switch (err) {
            error.InvalidHexFormat,
            error.InvalidHexCharacter,
            error.ValueTooLarge,
            => return,
            else => return err,
        }
    };

    const hex_str = hex.u256ToHex(testing.allocator, result) catch return;
    defer testing.allocator.free(hex_str);

    try testing.expect(hex.isHex(hex_str));
}

test "fuzz hexToU256" {
    try testing.fuzz({}, fuzzHexToU256, .{});
}

fn fuzzHexToU64(_: void, input: []const u8) !void {
    const result = hex.hexToU64(input) catch |err| {
        switch (err) {
            error.InvalidHexFormat,
            error.InvalidHexCharacter,
            error.ValueTooLarge,
            => return,
            else => return err,
        }
    };

    try testing.expect(result <= std.math.maxInt(u64));
}

test "fuzz hexToU64" {
    try testing.fuzz({}, fuzzHexToU64, .{});
}

fn fuzzU256ToHex(_: void, input: []const u8) !void {
    if (input.len < @sizeOf(u256)) return;

    const value = std.mem.readInt(u256, input[0..@sizeOf(u256)], .little);

    const result = hex.u256ToHex(testing.allocator, value) catch |err| {
        try testing.expectEqual(error.OutOfMemory, err);
        return;
    };
    defer testing.allocator.free(result);

    try testing.expect(hex.isHex(result));
    try testing.expect(result.len >= 3);

    const parsed = hex.hexToU256(result) catch unreachable;
    try testing.expectEqual(value, parsed);
}

test "fuzz u256ToHex" {
    try testing.fuzz({}, fuzzU256ToHex, .{});
}

fn fuzzPadLeft(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    const target_len = @as(usize, @intCast(input[0]));
    const data = input[1..];

    const result = hex.padLeft(testing.allocator, data, target_len) catch return;
    defer testing.allocator.free(result);

    try testing.expect(result.len >= data.len);

    if (target_len > data.len) {
        try testing.expectEqual(target_len, result.len);
        const padding = target_len - data.len;
        for (result[0..padding]) |byte| {
            try testing.expectEqual(@as(u8, 0), byte);
        }
        try testing.expectEqualSlices(u8, data, result[padding..]);
    } else {
        try testing.expectEqualSlices(u8, data, result);
    }
}

test "fuzz padLeft" {
    try testing.fuzz({}, fuzzPadLeft, .{});
}

fn fuzzPadRight(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    const target_len = @as(usize, @intCast(input[0]));
    const data = input[1..];

    const result = hex.padRight(testing.allocator, data, target_len) catch return;
    defer testing.allocator.free(result);

    try testing.expect(result.len >= data.len);

    if (target_len > data.len) {
        try testing.expectEqual(target_len, result.len);
        try testing.expectEqualSlices(u8, data, result[0..data.len]);
        for (result[data.len..]) |byte| {
            try testing.expectEqual(@as(u8, 0), byte);
        }
    } else {
        try testing.expectEqualSlices(u8, data, result);
    }
}

test "fuzz padRight" {
    try testing.fuzz({}, fuzzPadRight, .{});
}

fn fuzzTrimLeftZeros(_: void, input: []const u8) !void {
    const result = hex.trimLeftZeros(input);

    try testing.expect(result.len <= input.len);

    if (result.len > 0) {
        try testing.expect(result[0] != 0);
    }

    if (result.len > 0) {
        try testing.expectEqual(input[input.len - 1], result[result.len - 1]);
    }
}

test "fuzz trimLeftZeros" {
    try testing.fuzz({}, fuzzTrimLeftZeros, .{});
}

fn fuzzTrimRightZeros(_: void, input: []const u8) !void {
    const result = hex.trimRightZeros(input);

    try testing.expect(result.len <= input.len);

    if (result.len > 0) {
        try testing.expect(result[result.len - 1] != 0);
    }

    if (result.len > 0) {
        try testing.expectEqual(input[0], result[0]);
    }
}

test "fuzz trimRightZeros" {
    try testing.fuzz({}, fuzzTrimRightZeros, .{});
}

fn fuzzSlice(_: void, input: []const u8) !void {
    if (input.len < 4) return;

    const start = @as(usize, @intCast(input[0]));
    const end = @as(usize, @intCast(input[1])) + start;
    const data = input[2..];

    const result = hex.slice(data, start, end);

    try testing.expect(result.len <= data.len);

    if (start >= data.len) {
        try testing.expectEqual(@as(usize, 0), result.len);
    }

    if (start < data.len and end > start) {
        const expected_len = @min(end, data.len) - start;
        try testing.expectEqual(expected_len, result.len);
    }
}

test "fuzz slice" {
    try testing.fuzz({}, fuzzSlice, .{});
}

fn fuzzConcat(_: void, input: []const u8) !void {
    if (input.len < 3) return;

    const split1 = input[0] % input.len;
    const split2 = if (split1 + 1 < input.len) split1 + 1 + (input[1] % (input.len - split1 - 1)) else input.len;

    const arr1 = input[0..split1];
    const arr2 = input[split1..split2];
    const arr3 = input[split2..];

    const arrays = [_][]const u8{ arr1, arr2, arr3 };

    const result = hex.concat(testing.allocator, &arrays) catch return;
    defer testing.allocator.free(result);

    try testing.expectEqual(input.len, result.len);
    try testing.expectEqualSlices(u8, input, result);
}

test "fuzz concat" {
    try testing.fuzz({}, fuzzConcat, .{});
}

fn fuzzStringConversions(_: void, input: []const u8) !void {
    const hex_result = hex.stringToHex(testing.allocator, input) catch return;
    defer testing.allocator.free(hex_result);

    if (input.len > 0) {
        try testing.expect(hex.isHex(hex_result));
    }

    const str_result = hex.hexToString(testing.allocator, hex_result) catch unreachable;
    defer testing.allocator.free(str_result);

    try testing.expectEqualSlices(u8, input, str_result);
}

test "fuzz string conversions" {
    try testing.fuzz({}, fuzzStringConversions, .{});
}

fn fuzzHexCaseSensitivity(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    var hex_str = std.ArrayList(u8){};
    defer hex_str.deinit(testing.allocator);

    hex_str.appendSlice(testing.allocator, "0x") catch return;

    for (input) |byte| {
        const nibbles = [_]u8{ byte >> 4, byte & 0x0F };
        for (nibbles) |nibble| {
            const c = if (nibble < 10)
                '0' + nibble
            else if ((byte & 1) == 0)
                'a' + (nibble - 10)
            else
                'A' + (nibble - 10);
            hex_str.append(testing.allocator, c) catch return;
        }
    }

    const decoded = hex.hexToBytes(testing.allocator, hex_str.items) catch unreachable;
    defer testing.allocator.free(decoded);

    try testing.expectEqualSlices(u8, input, decoded);
}

test "fuzz hex case sensitivity" {
    try testing.fuzz({}, fuzzHexCaseSensitivity, .{});
}

fn fuzzOddLength(_: void, input: []const u8) !void {
    if (input.len < 2) return;

    var hex_str = std.ArrayList(u8){};
    defer hex_str.deinit(testing.allocator);

    hex_str.appendSlice(testing.allocator, "0x") catch return;

    const hex_chars = "0123456789abcdef";
    const odd_count = (input[0] % 127) * 2 + 1;

    var i: usize = 0;
    while (i < odd_count and i < input.len) : (i += 1) {
        const idx = input[i] % 16;
        hex_str.append(testing.allocator, hex_chars[idx]) catch return;
    }

    const result = hex.hexToBytes(testing.allocator, hex_str.items);
    try testing.expectError(hex.HexError.OddLengthHex, result);
}

test "fuzz odd length hex detection" {
    try testing.fuzz({}, fuzzOddLength, .{});
}

fn fuzzInvalidChars(_: void, input: []const u8) !void {
    if (input.len < 3) return;

    var hex_str = std.ArrayList(u8){};
    defer hex_str.deinit(testing.allocator);

    hex_str.appendSlice(testing.allocator, "0x") catch return;
    hex_str.appendSlice(testing.allocator, "00") catch return;

    const invalid_chars = "ghijklmnopqrstuvwxyzGHIJKLMNOPQRSTUVWXYZ!@#$%^&*() ";
    if (input.len > 0) {
        const idx = input[0] % invalid_chars.len;
        hex_str.append(testing.allocator, invalid_chars[idx]) catch return;
    }

    hex_str.appendSlice(testing.allocator, "0") catch return;

    const result = hex.hexToBytes(testing.allocator, hex_str.items);

    if (hex.isHex(hex_str.items)) {
        _ = result catch |err| {
            try testing.expectEqual(hex.HexError.InvalidHexCharacter, err);
            return;
        };
    }
}

test "fuzz invalid hex characters" {
    try testing.fuzz({}, fuzzInvalidChars, .{});
}

fn fuzzEmptyMinimal(_: void, input: []const u8) !void {
    const empty_hex = "0x";
    const empty_result = hex.hexToBytes(testing.allocator, empty_hex) catch unreachable;
    defer testing.allocator.free(empty_result);
    try testing.expectEqual(@as(usize, 0), empty_result.len);

    if (input.len > 0) {
        var min_hex = std.ArrayList(u8){};
        defer min_hex.deinit(testing.allocator);

        const hex_chars = "0123456789abcdef";
        const high = input[0] >> 4;
        const low = input[0] & 0x0F;

        min_hex.appendSlice(testing.allocator, "0x") catch return;
        min_hex.append(testing.allocator, hex_chars[high]) catch return;
        min_hex.append(testing.allocator, hex_chars[low]) catch return;

        const min_result = hex.hexToBytes(testing.allocator, min_hex.items) catch unreachable;
        defer testing.allocator.free(min_result);

        try testing.expectEqual(@as(usize, 1), min_result.len);
        try testing.expectEqual(input[0], min_result[0]);
    }
}

test "fuzz empty and minimal hex" {
    try testing.fuzz({}, fuzzEmptyMinimal, .{});
}

fn fuzzMaxValues(_: void, input: []const u8) !void {
    if (input.len < @sizeOf(u256)) return;

    const max_u256 = std.math.maxInt(u256);
    const hex_max = hex.u256ToHex(testing.allocator, max_u256) catch return;
    defer testing.allocator.free(hex_max);

    const parsed_max = hex.hexToU256(hex_max) catch unreachable;
    try testing.expectEqual(max_u256, parsed_max);

    const max_u64 = std.math.maxInt(u64);
    const hex_max_64 = hex.u64ToHex(testing.allocator, max_u64) catch return;
    defer testing.allocator.free(hex_max_64);

    const parsed_max_64 = hex.hexToU64(hex_max_64) catch unreachable;
    try testing.expectEqual(max_u64, parsed_max_64);
}

test "fuzz maximum values" {
    try testing.fuzz({}, fuzzMaxValues, .{});
}

fn fuzzBytesToHexFixed(_: void, input: []const u8) !void {
    if (input.len >= 1) {
        const arr1: [1]u8 = .{input[0]};
        const hex1 = hex.bytesToHexFixed(1, arr1);
        try testing.expectEqual(@as(usize, 4), hex1.len);
        try testing.expect(hex.isHex(&hex1));
    }

    if (input.len >= 4) {
        const arr4: [4]u8 = .{ input[0], input[1], input[2], input[3] };
        const hex4 = hex.bytesToHexFixed(4, arr4);
        try testing.expectEqual(@as(usize, 10), hex4.len);
        try testing.expect(hex.isHex(&hex4));
    }

    if (input.len >= 32) {
        var arr32: [32]u8 = undefined;
        @memcpy(&arr32, input[0..32]);
        const hex32 = hex.bytesToHexFixed(32, arr32);
        try testing.expectEqual(@as(usize, 66), hex32.len);
        try testing.expect(hex.isHex(&hex32));
    }
}

test "fuzz bytesToHexFixed" {
    try testing.fuzz({}, fuzzBytesToHexFixed, .{});
}

fn fuzzSizeFunction(_: void, input: []const u8) !void {
    const result = hex.size(input);
    try testing.expectEqual(input.len, result);
}

test "fuzz size function" {
    try testing.fuzz({}, fuzzSizeFunction, .{});
}

fn fuzzLargeInput(_: void, input: []const u8) !void {
    if (input.len > 10000) return;

    const encoded = hex.bytesToHex(testing.allocator, input) catch |err| {
        try testing.expectEqual(error.OutOfMemory, err);
        return;
    };
    defer testing.allocator.free(encoded);

    const decoded = hex.hexToBytes(testing.allocator, encoded) catch |err| {
        try testing.expectEqual(error.OutOfMemory, err);
        return;
    };
    defer testing.allocator.free(decoded);

    try testing.expectEqualSlices(u8, input, decoded);
}

test "fuzz large input handling" {
    try testing.fuzz({}, fuzzLargeInput, .{});
}
