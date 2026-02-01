const std = @import("std");
const basicTypes = @import("basicTypes.zig");

/// SSZ container (struct) encoding
/// See: https://github.com/ethereum/consensus-specs/blob/dev/ssz/simple-serialize.md
///
/// Containers serialize to:
/// 1. Fixed part: All fixed-size fields in declaration order + offsets for variable fields
/// 2. Variable part: Concatenated variable-size fields in declaration order
/// Checks if a type is fixed-size for SSZ purposes
pub fn isFixedSize(comptime T: type) bool {
    return switch (@typeInfo(T)) {
        .Int, .Bool => true,
        .Array => |arr| isFixedSize(arr.child),
        .Struct => |s| {
            inline for (s.fields) |field| {
                if (!isFixedSize(field.type)) return false;
            }
            return true;
        },
        else => false,
    };
}

/// Returns the fixed size of a type in bytes (errors if not fixed-size)
pub fn fixedSize(comptime T: type) !usize {
    if (!isFixedSize(T)) return error.NotFixedSize;

    return switch (@typeInfo(T)) {
        .Int => |int| int.bits / 8,
        .Bool => 1,
        .Array => |arr| {
            const child_size = try fixedSize(arr.child);
            return arr.len * child_size;
        },
        .Struct => @sizeOf(T),
        else => error.UnsupportedType,
    };
}

/// Encodes a container (struct)
/// Caller owns returned memory
pub fn encodeContainer(allocator: std.mem.Allocator, comptime T: type, value: T) ![]u8 {
    const type_info = @typeInfo(T);
    if (type_info != .Struct) return error.NotAContainer;

    // Calculate sizes
    var fixed_part_size: usize = 0;
    var variable_fields_count: usize = 0;

    inline for (type_info.Struct.fields) |field| {
        if (isFixedSize(field.type)) {
            fixed_part_size += try fixedSize(field.type);
        } else {
            fixed_part_size += 4; // offset
            variable_fields_count += 1;
        }
    }

    // For simplicity in this basic implementation, we'll just pack fixed fields
    // A complete implementation would handle variable fields with offsets
    if (variable_fields_count > 0) {
        return error.VariableFieldsNotYetSupported;
    }

    // Allocate result
    const result = try allocator.alloc(u8, fixed_part_size);
    errdefer allocator.free(result);

    // Serialize fixed fields
    var offset: usize = 0;
    inline for (type_info.Struct.fields) |field| {
        const field_value = @field(value, field.name);
        const field_size = try fixedSize(field.type);

        switch (@typeInfo(field.type)) {
            .Int => |int| {
                if (int.bits == 8) {
                    result[offset] = field_value;
                } else if (int.bits == 16) {
                    const bytes = basicTypes.encodeUint16(field_value);
                    @memcpy(result[offset..][0..2], &bytes);
                } else if (int.bits == 32) {
                    const bytes = basicTypes.encodeUint32(field_value);
                    @memcpy(result[offset..][0..4], &bytes);
                } else if (int.bits == 64) {
                    const bytes = basicTypes.encodeUint64(field_value);
                    @memcpy(result[offset..][0..8], &bytes);
                } else if (int.bits == 256) {
                    const bytes = basicTypes.encodeUint256(field_value);
                    @memcpy(result[offset..][0..32], &bytes);
                } else {
                    return error.UnsupportedIntSize;
                }
            },
            .Bool => {
                result[offset] = if (field_value) 1 else 0;
            },
            .Array => {
                const field_bytes = std.mem.asBytes(&field_value);
                @memcpy(result[offset..][0..field_size], field_bytes);
            },
            else => return error.UnsupportedFieldType,
        }

        offset += field_size;
    }

    return result;
}

test "isFixedSize" {
    try std.testing.expect(isFixedSize(u8));
    try std.testing.expect(isFixedSize(u16));
    try std.testing.expect(isFixedSize(u32));
    try std.testing.expect(isFixedSize(u64));
    try std.testing.expect(isFixedSize(bool));
    try std.testing.expect(isFixedSize([32]u8));
    try std.testing.expect(!isFixedSize([]u8));
    try std.testing.expect(!isFixedSize([]const u8));
}

test "fixedSize" {
    try std.testing.expectEqual(@as(usize, 1), try fixedSize(u8));
    try std.testing.expectEqual(@as(usize, 2), try fixedSize(u16));
    try std.testing.expectEqual(@as(usize, 4), try fixedSize(u32));
    try std.testing.expectEqual(@as(usize, 8), try fixedSize(u64));
    try std.testing.expectEqual(@as(usize, 1), try fixedSize(bool));
    try std.testing.expectEqual(@as(usize, 32), try fixedSize([32]u8));
}

test "encodeContainer simple struct" {
    const TestStruct = struct {
        a: u8,
        b: u16,
        c: u32,
    };

    const allocator = std.testing.allocator;
    const value = TestStruct{
        .a = 0x01,
        .b = 0x0203,
        .c = 0x04050607,
    };

    const result = try encodeContainer(allocator, TestStruct, value);
    defer allocator.free(result);

    try std.testing.expectEqual(@as(usize, 7), result.len); // 1 + 2 + 4
    try std.testing.expectEqual(@as(u8, 0x01), result[0]);
    try std.testing.expectEqual(@as(u8, 0x03), result[1]); // little-endian
    try std.testing.expectEqual(@as(u8, 0x02), result[2]);
    try std.testing.expectEqual(@as(u8, 0x07), result[3]); // little-endian
    try std.testing.expectEqual(@as(u8, 0x06), result[4]);
    try std.testing.expectEqual(@as(u8, 0x05), result[5]);
    try std.testing.expectEqual(@as(u8, 0x04), result[6]);
}

test "encodeContainer with bool" {
    const TestStruct = struct {
        flag: bool,
        value: u8,
    };

    const allocator = std.testing.allocator;
    const value = TestStruct{
        .flag = true,
        .value = 42,
    };

    const result = try encodeContainer(allocator, TestStruct, value);
    defer allocator.free(result);

    try std.testing.expectEqual(@as(usize, 2), result.len);
    try std.testing.expectEqual(@as(u8, 1), result[0]);
    try std.testing.expectEqual(@as(u8, 42), result[1]);
}
