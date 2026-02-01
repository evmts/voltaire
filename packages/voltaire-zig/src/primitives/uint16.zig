//! Fixed-width 16-bit unsigned integer type with checked arithmetic
//!
//! Provides a branded u16 type matching the TypeScript Uint16 API with:
//! - Overflow-checked arithmetic operations
//! - Bitwise operations
//! - Hex string conversion
//! - Comparison operations

const std = @import("std");
const testing = std.testing;

/// Branded 16-bit unsigned integer
pub const Uint16 = struct {
    value: u16,

    const Self = @This();

    // Constants
    pub const MIN: Self = .{ .value = 0 };
    pub const MAX: Self = .{ .value = std.math.maxInt(u16) };
    pub const ZERO: Self = .{ .value = 0 };
    pub const ONE: Self = .{ .value = 1 };
    pub const SIZE: usize = 2;
    pub const BITS: usize = 16;

    // Construction
    pub fn from(val: u16) Self {
        return .{ .value = val };
    }

    pub fn fromNumber(val: anytype) ?Self {
        const T = @TypeOf(val);
        if (@typeInfo(T) == .int or @typeInfo(T) == .comptime_int) {
            if (val < 0 or val > std.math.maxInt(u16)) return null;
            return .{ .value = @intCast(val) };
        }
        return null;
    }

    pub fn fromHex(hex: []const u8) !Self {
        const trimmed = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X'))
            hex[2..]
        else
            hex;

        if (trimmed.len == 0 or trimmed.len > 4) return error.InvalidHex;

        const val = std.fmt.parseInt(u16, trimmed, 16) catch return error.InvalidHex;
        return .{ .value = val };
    }

    pub fn fromBytes(bytes: []const u8) ?Self {
        if (bytes.len != 2) return null;
        return .{ .value = std.mem.readInt(u16, bytes[0..2], .big) };
    }

    pub fn fromBytesLittle(bytes: []const u8) ?Self {
        if (bytes.len != 2) return null;
        return .{ .value = std.mem.readInt(u16, bytes[0..2], .little) };
    }

    // Conversion
    pub fn toNumber(self: Self) u16 {
        return self.value;
    }

    pub fn toHex(self: Self, buf: *[6]u8) []const u8 {
        buf[0] = '0';
        buf[1] = 'x';
        const hex_chars = "0123456789abcdef";
        buf[2] = hex_chars[(self.value >> 12) & 0x0f];
        buf[3] = hex_chars[(self.value >> 8) & 0x0f];
        buf[4] = hex_chars[(self.value >> 4) & 0x0f];
        buf[5] = hex_chars[self.value & 0x0f];
        return buf[0..6];
    }

    pub fn toBytes(self: Self, buf: *[2]u8) []const u8 {
        std.mem.writeInt(u16, buf, self.value, .big);
        return buf[0..2];
    }

    pub fn toBytesLittle(self: Self, buf: *[2]u8) []const u8 {
        std.mem.writeInt(u16, buf, self.value, .little);
        return buf[0..2];
    }

    // Checked arithmetic (returns null on overflow)
    pub fn add(self: Self, other: Self) ?Self {
        const result = @addWithOverflow(self.value, other.value);
        if (result[1] != 0) return null;
        return .{ .value = result[0] };
    }

    pub fn sub(self: Self, other: Self) ?Self {
        const result = @subWithOverflow(self.value, other.value);
        if (result[1] != 0) return null;
        return .{ .value = result[0] };
    }

    pub fn mul(self: Self, other: Self) ?Self {
        const result = @mulWithOverflow(self.value, other.value);
        if (result[1] != 0) return null;
        return .{ .value = result[0] };
    }

    pub fn div(self: Self, other: Self) ?Self {
        if (other.value == 0) return null;
        return .{ .value = self.value / other.value };
    }

    pub fn mod(self: Self, other: Self) ?Self {
        if (other.value == 0) return null;
        return .{ .value = self.value % other.value };
    }

    // Wrapping arithmetic
    pub fn wrappingAdd(self: Self, other: Self) Self {
        return .{ .value = self.value +% other.value };
    }

    pub fn wrappingSub(self: Self, other: Self) Self {
        return .{ .value = self.value -% other.value };
    }

    pub fn wrappingMul(self: Self, other: Self) Self {
        return .{ .value = self.value *% other.value };
    }

    // Saturating arithmetic
    pub fn saturatingAdd(self: Self, other: Self) Self {
        return .{ .value = self.value +| other.value };
    }

    pub fn saturatingSub(self: Self, other: Self) Self {
        return .{ .value = self.value -| other.value };
    }

    pub fn saturatingMul(self: Self, other: Self) Self {
        return .{ .value = self.value *| other.value };
    }

    // Comparison
    pub fn equals(self: Self, other: Self) bool {
        return self.value == other.value;
    }

    pub fn compare(self: Self, other: Self) std.math.Order {
        return std.math.order(self.value, other.value);
    }

    pub fn lessThan(self: Self, other: Self) bool {
        return self.value < other.value;
    }

    pub fn greaterThan(self: Self, other: Self) bool {
        return self.value > other.value;
    }

    pub fn lessThanOrEqual(self: Self, other: Self) bool {
        return self.value <= other.value;
    }

    pub fn greaterThanOrEqual(self: Self, other: Self) bool {
        return self.value >= other.value;
    }

    // Bitwise operations
    pub fn bitwiseAnd(self: Self, other: Self) Self {
        return .{ .value = self.value & other.value };
    }

    pub fn bitwiseOr(self: Self, other: Self) Self {
        return .{ .value = self.value | other.value };
    }

    pub fn bitwiseXor(self: Self, other: Self) Self {
        return .{ .value = self.value ^ other.value };
    }

    pub fn bitwiseNot(self: Self) Self {
        return .{ .value = ~self.value };
    }

    pub fn shiftLeft(self: Self, bits: u4) Self {
        return .{ .value = self.value << bits };
    }

    pub fn shiftRight(self: Self, bits: u4) Self {
        return .{ .value = self.value >> bits };
    }

    // Utility
    pub fn isZero(self: Self) bool {
        return self.value == 0;
    }

    pub fn min(self: Self, other: Self) Self {
        return .{ .value = @min(self.value, other.value) };
    }

    pub fn max(self: Self, other: Self) Self {
        return .{ .value = @max(self.value, other.value) };
    }

    pub fn bitLength(self: Self) u5 {
        if (self.value == 0) return 0;
        return @intCast(16 - @clz(self.value));
    }

    pub fn leadingZeros(self: Self) u5 {
        return @clz(self.value);
    }

    pub fn trailingZeros(self: Self) u5 {
        return @ctz(self.value);
    }

    pub fn popCount(self: Self) u5 {
        return @popCount(self.value);
    }

    // Byte swap
    pub fn byteSwap(self: Self) Self {
        return .{ .value = @byteSwap(self.value) };
    }
};

// Tests
test "Uint16 constants" {
    try testing.expectEqual(@as(u16, 0), Uint16.MIN.value);
    try testing.expectEqual(@as(u16, 65535), Uint16.MAX.value);
    try testing.expectEqual(@as(u16, 0), Uint16.ZERO.value);
    try testing.expectEqual(@as(u16, 1), Uint16.ONE.value);
    try testing.expectEqual(@as(usize, 2), Uint16.SIZE);
    try testing.expectEqual(@as(usize, 16), Uint16.BITS);
}

test "Uint16 from" {
    const a = Uint16.from(42);
    try testing.expectEqual(@as(u16, 42), a.value);

    const b = Uint16.from(0);
    try testing.expectEqual(@as(u16, 0), b.value);

    const c = Uint16.from(65535);
    try testing.expectEqual(@as(u16, 65535), c.value);
}

test "Uint16 fromNumber" {
    const a = Uint16.fromNumber(42);
    try testing.expect(a != null);
    try testing.expectEqual(@as(u16, 42), a.?.value);

    const b = Uint16.fromNumber(65536);
    try testing.expect(b == null);

    const c = Uint16.fromNumber(-1);
    try testing.expect(c == null);
}

test "Uint16 fromHex" {
    const a = try Uint16.fromHex("0x002a");
    try testing.expectEqual(@as(u16, 42), a.value);

    const b = try Uint16.fromHex("ffff");
    try testing.expectEqual(@as(u16, 65535), b.value);

    const c = try Uint16.fromHex("0X0000");
    try testing.expectEqual(@as(u16, 0), c.value);

    try testing.expectError(error.InvalidHex, Uint16.fromHex("0x10000"));
    try testing.expectError(error.InvalidHex, Uint16.fromHex(""));
    try testing.expectError(error.InvalidHex, Uint16.fromHex("0x"));
}

test "Uint16 fromBytes" {
    const bytes_be = [_]u8{ 0x00, 0x2a };
    const a = Uint16.fromBytes(&bytes_be);
    try testing.expect(a != null);
    try testing.expectEqual(@as(u16, 42), a.?.value);

    const bytes_le = [_]u8{ 0x2a, 0x00 };
    const b = Uint16.fromBytesLittle(&bytes_le);
    try testing.expect(b != null);
    try testing.expectEqual(@as(u16, 42), b.?.value);

    const empty: []const u8 = &.{};
    try testing.expect(Uint16.fromBytes(empty) == null);

    const too_long = [_]u8{ 1, 2, 3 };
    try testing.expect(Uint16.fromBytes(&too_long) == null);
}

test "Uint16 toNumber" {
    const a = Uint16.from(42);
    try testing.expectEqual(@as(u16, 42), a.toNumber());
}

test "Uint16 toHex" {
    var buf: [6]u8 = undefined;

    const a = Uint16.from(42);
    try testing.expectEqualStrings("0x002a", a.toHex(&buf));

    const b = Uint16.from(65535);
    try testing.expectEqualStrings("0xffff", b.toHex(&buf));

    const c = Uint16.from(0);
    try testing.expectEqualStrings("0x0000", c.toHex(&buf));
}

test "Uint16 toBytes" {
    var buf: [2]u8 = undefined;
    const a = Uint16.from(0x1234);
    const bytes = a.toBytes(&buf);
    try testing.expectEqual(@as(usize, 2), bytes.len);
    try testing.expectEqual(@as(u8, 0x12), bytes[0]);
    try testing.expectEqual(@as(u8, 0x34), bytes[1]);

    const bytes_le = a.toBytesLittle(&buf);
    try testing.expectEqual(@as(u8, 0x34), bytes_le[0]);
    try testing.expectEqual(@as(u8, 0x12), bytes_le[1]);
}

test "Uint16 checked add" {
    const a = Uint16.from(30000);
    const b = Uint16.from(20000);
    const result = a.add(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u16, 50000), result.?.value);

    const c = Uint16.from(40000);
    const d = Uint16.from(30000);
    try testing.expect(c.add(d) == null);
}

test "Uint16 checked sub" {
    const a = Uint16.from(30000);
    const b = Uint16.from(20000);
    const result = a.sub(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u16, 10000), result.?.value);

    const c = Uint16.from(10000);
    const d = Uint16.from(20000);
    try testing.expect(c.sub(d) == null);
}

test "Uint16 checked mul" {
    const a = Uint16.from(200);
    const b = Uint16.from(300);
    const result = a.mul(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u16, 60000), result.?.value);

    const c = Uint16.from(300);
    const d = Uint16.from(300);
    try testing.expect(c.mul(d) == null);
}

test "Uint16 checked div" {
    const a = Uint16.from(10000);
    const b = Uint16.from(100);
    const result = a.div(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u16, 100), result.?.value);

    const c = Uint16.from(100);
    const d = Uint16.from(0);
    try testing.expect(c.div(d) == null);
}

test "Uint16 checked mod" {
    const a = Uint16.from(10000);
    const b = Uint16.from(3000);
    const result = a.mod(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u16, 1000), result.?.value);

    const c = Uint16.from(100);
    const d = Uint16.from(0);
    try testing.expect(c.mod(d) == null);
}

test "Uint16 wrapping arithmetic" {
    const a = Uint16.from(40000);
    const b = Uint16.from(30000);
    try testing.expectEqual(@as(u16, 4464), a.wrappingAdd(b).value);

    const c = Uint16.from(10000);
    const d = Uint16.from(20000);
    try testing.expectEqual(@as(u16, 55536), c.wrappingSub(d).value);

    const e = Uint16.from(300);
    const f = Uint16.from(300);
    try testing.expectEqual(@as(u16, 24464), e.wrappingMul(f).value);
}

test "Uint16 saturating arithmetic" {
    const a = Uint16.from(40000);
    const b = Uint16.from(30000);
    try testing.expectEqual(@as(u16, 65535), a.saturatingAdd(b).value);

    const c = Uint16.from(10000);
    const d = Uint16.from(20000);
    try testing.expectEqual(@as(u16, 0), c.saturatingSub(d).value);

    const e = Uint16.from(300);
    const f = Uint16.from(300);
    try testing.expectEqual(@as(u16, 65535), e.saturatingMul(f).value);
}

test "Uint16 comparison" {
    const a = Uint16.from(10000);
    const b = Uint16.from(10000);
    const c = Uint16.from(5000);

    try testing.expect(a.equals(b));
    try testing.expect(!a.equals(c));

    try testing.expectEqual(std.math.Order.eq, a.compare(b));
    try testing.expectEqual(std.math.Order.gt, a.compare(c));
    try testing.expectEqual(std.math.Order.lt, c.compare(a));

    try testing.expect(!a.lessThan(b));
    try testing.expect(c.lessThan(a));
    try testing.expect(a.greaterThan(c));
    try testing.expect(a.lessThanOrEqual(b));
    try testing.expect(a.greaterThanOrEqual(b));
}

test "Uint16 bitwise operations" {
    const a = Uint16.from(0xFF00);
    const b = Uint16.from(0x0F0F);

    try testing.expectEqual(@as(u16, 0x0F00), a.bitwiseAnd(b).value);
    try testing.expectEqual(@as(u16, 0xFF0F), a.bitwiseOr(b).value);
    try testing.expectEqual(@as(u16, 0xF00F), a.bitwiseXor(b).value);
    try testing.expectEqual(@as(u16, 0x00FF), a.bitwiseNot().value);
}

test "Uint16 shift operations" {
    const a = Uint16.from(0x00FF);
    try testing.expectEqual(@as(u16, 0x0FF0), a.shiftLeft(4).value);
    try testing.expectEqual(@as(u16, 0x000F), a.shiftRight(4).value);
}

test "Uint16 utility functions" {
    const zero = Uint16.from(0);
    const nonzero = Uint16.from(42);

    try testing.expect(zero.isZero());
    try testing.expect(!nonzero.isZero());

    const a = Uint16.from(1000);
    const b = Uint16.from(2000);
    try testing.expectEqual(@as(u16, 1000), a.min(b).value);
    try testing.expectEqual(@as(u16, 2000), a.max(b).value);
}

test "Uint16 bit counting" {
    const a = Uint16.from(0b0010110000000000);
    try testing.expectEqual(@as(u5, 14), a.bitLength());
    try testing.expectEqual(@as(u5, 2), a.leadingZeros());
    try testing.expectEqual(@as(u5, 10), a.trailingZeros());
    try testing.expectEqual(@as(u5, 3), a.popCount());

    const zero = Uint16.from(0);
    try testing.expectEqual(@as(u5, 0), zero.bitLength());
    try testing.expectEqual(@as(u5, 16), zero.leadingZeros());
}

test "Uint16 byteSwap" {
    const a = Uint16.from(0x1234);
    try testing.expectEqual(@as(u16, 0x3412), a.byteSwap().value);
}
