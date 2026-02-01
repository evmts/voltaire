//! Fixed-width 64-bit unsigned integer type with checked arithmetic
//!
//! Provides a branded u64 type matching the TypeScript Uint64 API with:
//! - Overflow-checked arithmetic operations
//! - Bitwise operations
//! - Hex string conversion
//! - Comparison operations

const std = @import("std");
const testing = std.testing;

/// Branded 64-bit unsigned integer
pub const Uint64 = struct {
    value: u64,

    const Self = @This();

    // Constants
    pub const MIN: Self = .{ .value = 0 };
    pub const MAX: Self = .{ .value = std.math.maxInt(u64) };
    pub const ZERO: Self = .{ .value = 0 };
    pub const ONE: Self = .{ .value = 1 };
    pub const SIZE: usize = 8;
    pub const BITS: usize = 64;

    // Construction
    pub fn from(val: u64) Self {
        return .{ .value = val };
    }

    pub fn fromNumber(val: anytype) ?Self {
        const T = @TypeOf(val);
        if (@typeInfo(T) == .int or @typeInfo(T) == .comptime_int) {
            if (val < 0 or val > std.math.maxInt(u64)) return null;
            return .{ .value = @intCast(val) };
        }
        return null;
    }

    pub fn fromHex(hex: []const u8) !Self {
        const trimmed = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X'))
            hex[2..]
        else
            hex;

        if (trimmed.len == 0 or trimmed.len > 16) return error.InvalidHex;

        const val = std.fmt.parseInt(u64, trimmed, 16) catch return error.InvalidHex;
        return .{ .value = val };
    }

    pub fn fromBytes(bytes: []const u8) ?Self {
        if (bytes.len != 8) return null;
        return .{ .value = std.mem.readInt(u64, bytes[0..8], .big) };
    }

    pub fn fromBytesLittle(bytes: []const u8) ?Self {
        if (bytes.len != 8) return null;
        return .{ .value = std.mem.readInt(u64, bytes[0..8], .little) };
    }

    // Conversion
    pub fn toNumber(self: Self) u64 {
        return self.value;
    }

    pub fn toBigInt(self: Self) u128 {
        return @as(u128, self.value);
    }

    pub fn toHex(self: Self, buf: *[18]u8) []const u8 {
        buf[0] = '0';
        buf[1] = 'x';
        const hex_chars = "0123456789abcdef";
        inline for (0..16) |i| {
            const shift: u6 = @intCast(60 - i * 4);
            buf[2 + i] = hex_chars[(self.value >> shift) & 0x0f];
        }
        return buf[0..18];
    }

    pub fn toBytes(self: Self, buf: *[8]u8) []const u8 {
        std.mem.writeInt(u64, buf, self.value, .big);
        return buf[0..8];
    }

    pub fn toBytesLittle(self: Self, buf: *[8]u8) []const u8 {
        std.mem.writeInt(u64, buf, self.value, .little);
        return buf[0..8];
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

    pub fn pow(self: Self, exp: u6) ?Self {
        if (exp == 0) return ONE;
        if (self.value == 0) return ZERO;
        if (self.value == 1) return ONE;

        var result: u128 = 1;
        var base: u128 = self.value;
        var e = exp;

        while (e > 0) {
            if (e & 1 == 1) {
                result *= base;
                if (result > std.math.maxInt(u64)) return null;
            }
            e >>= 1;
            if (e > 0) {
                base *= base;
                if (base > std.math.maxInt(u64)) return null;
            }
        }

        return .{ .value = @intCast(result) };
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

    pub fn shiftLeft(self: Self, bits: u6) Self {
        return .{ .value = self.value << bits };
    }

    pub fn shiftRight(self: Self, bits: u6) Self {
        return .{ .value = self.value >> bits };
    }

    pub fn rotateLeft(self: Self, bits: u6) Self {
        return .{ .value = std.math.rotl(u64, self.value, bits) };
    }

    pub fn rotateRight(self: Self, bits: u6) Self {
        return .{ .value = std.math.rotr(u64, self.value, bits) };
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

    pub fn bitLength(self: Self) u7 {
        if (self.value == 0) return 0;
        return @intCast(64 - @clz(self.value));
    }

    pub fn leadingZeros(self: Self) u7 {
        return @clz(self.value);
    }

    pub fn trailingZeros(self: Self) u7 {
        return @ctz(self.value);
    }

    pub fn popCount(self: Self) u7 {
        return @popCount(self.value);
    }

    // Byte swap
    pub fn byteSwap(self: Self) Self {
        return .{ .value = @byteSwap(self.value) };
    }

    // Reverse bits
    pub fn reverseBits(self: Self) Self {
        return .{ .value = @bitReverse(self.value) };
    }

    // Hi/Lo parts
    pub fn hi(self: Self) u32 {
        return @truncate(self.value >> 32);
    }

    pub fn lo(self: Self) u32 {
        return @truncate(self.value);
    }

    pub fn fromHiLo(high: u32, low: u32) Self {
        return .{ .value = (@as(u64, high) << 32) | @as(u64, low) };
    }
};

// Tests
test "Uint64 constants" {
    try testing.expectEqual(@as(u64, 0), Uint64.MIN.value);
    try testing.expectEqual(@as(u64, 18446744073709551615), Uint64.MAX.value);
    try testing.expectEqual(@as(u64, 0), Uint64.ZERO.value);
    try testing.expectEqual(@as(u64, 1), Uint64.ONE.value);
    try testing.expectEqual(@as(usize, 8), Uint64.SIZE);
    try testing.expectEqual(@as(usize, 64), Uint64.BITS);
}

test "Uint64 from" {
    const a = Uint64.from(42);
    try testing.expectEqual(@as(u64, 42), a.value);

    const b = Uint64.from(0);
    try testing.expectEqual(@as(u64, 0), b.value);

    const c = Uint64.from(18446744073709551615);
    try testing.expectEqual(@as(u64, 18446744073709551615), c.value);
}

test "Uint64 fromNumber" {
    const a = Uint64.fromNumber(42);
    try testing.expect(a != null);
    try testing.expectEqual(@as(u64, 42), a.?.value);

    const c = Uint64.fromNumber(-1);
    try testing.expect(c == null);
}

test "Uint64 fromHex" {
    const a = try Uint64.fromHex("0x000000000000002a");
    try testing.expectEqual(@as(u64, 42), a.value);

    const b = try Uint64.fromHex("ffffffffffffffff");
    try testing.expectEqual(@as(u64, 18446744073709551615), b.value);

    const c = try Uint64.fromHex("0X0000000000000000");
    try testing.expectEqual(@as(u64, 0), c.value);

    try testing.expectError(error.InvalidHex, Uint64.fromHex("0x10000000000000000"));
    try testing.expectError(error.InvalidHex, Uint64.fromHex(""));
    try testing.expectError(error.InvalidHex, Uint64.fromHex("0x"));
}

test "Uint64 fromBytes" {
    const bytes_be = [_]u8{ 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x2a };
    const a = Uint64.fromBytes(&bytes_be);
    try testing.expect(a != null);
    try testing.expectEqual(@as(u64, 42), a.?.value);

    const bytes_le = [_]u8{ 0x2a, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00 };
    const b = Uint64.fromBytesLittle(&bytes_le);
    try testing.expect(b != null);
    try testing.expectEqual(@as(u64, 42), b.?.value);

    const empty: []const u8 = &.{};
    try testing.expect(Uint64.fromBytes(empty) == null);

    const too_long = [_]u8{ 1, 2, 3, 4, 5, 6, 7, 8, 9 };
    try testing.expect(Uint64.fromBytes(&too_long) == null);
}

test "Uint64 toNumber" {
    const a = Uint64.from(42);
    try testing.expectEqual(@as(u64, 42), a.toNumber());
}

test "Uint64 toBigInt" {
    const a = Uint64.from(42);
    try testing.expectEqual(@as(u128, 42), a.toBigInt());
}

test "Uint64 toHex" {
    var buf: [18]u8 = undefined;

    const a = Uint64.from(42);
    try testing.expectEqualStrings("0x000000000000002a", a.toHex(&buf));

    const b = Uint64.from(18446744073709551615);
    try testing.expectEqualStrings("0xffffffffffffffff", b.toHex(&buf));

    const c = Uint64.from(0);
    try testing.expectEqualStrings("0x0000000000000000", c.toHex(&buf));
}

test "Uint64 toBytes" {
    var buf: [8]u8 = undefined;
    const a = Uint64.from(0x123456789ABCDEF0);
    const bytes = a.toBytes(&buf);
    try testing.expectEqual(@as(usize, 8), bytes.len);
    try testing.expectEqual(@as(u8, 0x12), bytes[0]);
    try testing.expectEqual(@as(u8, 0x34), bytes[1]);
    try testing.expectEqual(@as(u8, 0x56), bytes[2]);
    try testing.expectEqual(@as(u8, 0x78), bytes[3]);
    try testing.expectEqual(@as(u8, 0x9A), bytes[4]);
    try testing.expectEqual(@as(u8, 0xBC), bytes[5]);
    try testing.expectEqual(@as(u8, 0xDE), bytes[6]);
    try testing.expectEqual(@as(u8, 0xF0), bytes[7]);

    const bytes_le = a.toBytesLittle(&buf);
    try testing.expectEqual(@as(u8, 0xF0), bytes_le[0]);
    try testing.expectEqual(@as(u8, 0xDE), bytes_le[1]);
    try testing.expectEqual(@as(u8, 0xBC), bytes_le[2]);
    try testing.expectEqual(@as(u8, 0x9A), bytes_le[3]);
    try testing.expectEqual(@as(u8, 0x78), bytes_le[4]);
    try testing.expectEqual(@as(u8, 0x56), bytes_le[5]);
    try testing.expectEqual(@as(u8, 0x34), bytes_le[6]);
    try testing.expectEqual(@as(u8, 0x12), bytes_le[7]);
}

test "Uint64 checked add" {
    const a = Uint64.from(10000000000000000000);
    const b = Uint64.from(5000000000000000000);
    const result = a.add(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u64, 15000000000000000000), result.?.value);

    const c = Uint64.from(10000000000000000000);
    const d = Uint64.from(10000000000000000000);
    try testing.expect(c.add(d) == null);
}

test "Uint64 checked sub" {
    const a = Uint64.from(10000000000000000000);
    const b = Uint64.from(5000000000000000000);
    const result = a.sub(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u64, 5000000000000000000), result.?.value);

    const c = Uint64.from(5000000000000000000);
    const d = Uint64.from(10000000000000000000);
    try testing.expect(c.sub(d) == null);
}

test "Uint64 checked mul" {
    const a = Uint64.from(1000000000);
    const b = Uint64.from(1000000000);
    const result = a.mul(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u64, 1000000000000000000), result.?.value);

    const c = Uint64.from(10000000000);
    const d = Uint64.from(10000000000);
    try testing.expect(c.mul(d) == null);
}

test "Uint64 checked div" {
    const a = Uint64.from(10000000000000000000);
    const b = Uint64.from(1000000000);
    const result = a.div(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u64, 10000000000), result.?.value);

    const c = Uint64.from(100);
    const d = Uint64.from(0);
    try testing.expect(c.div(d) == null);
}

test "Uint64 checked mod" {
    const a = Uint64.from(10000000000000000000);
    const b = Uint64.from(3000000000000000000);
    const result = a.mod(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u64, 1000000000000000000), result.?.value);

    const c = Uint64.from(100);
    const d = Uint64.from(0);
    try testing.expect(c.mod(d) == null);
}

test "Uint64 checked pow" {
    const a = Uint64.from(2);
    const result = a.pow(20);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u64, 1048576), result.?.value);

    const b = Uint64.from(10);
    const result2 = b.pow(18);
    try testing.expect(result2 != null);
    try testing.expectEqual(@as(u64, 1000000000000000000), result2.?.value);

    const c = Uint64.from(10);
    try testing.expect(c.pow(20) == null);

    try testing.expectEqual(@as(u64, 1), Uint64.from(5).pow(0).?.value);
    try testing.expectEqual(@as(u64, 0), Uint64.from(0).pow(5).?.value);
    try testing.expectEqual(@as(u64, 1), Uint64.from(1).pow(63).?.value);
}

test "Uint64 wrapping arithmetic" {
    const a = Uint64.from(10000000000000000000);
    const b = Uint64.from(10000000000000000000);
    const expected = a.value +% b.value;
    try testing.expectEqual(expected, a.wrappingAdd(b).value);

    const c = Uint64.from(5000000000000000000);
    const d = Uint64.from(10000000000000000000);
    const expected2 = c.value -% d.value;
    try testing.expectEqual(expected2, c.wrappingSub(d).value);
}

test "Uint64 saturating arithmetic" {
    const a = Uint64.from(10000000000000000000);
    const b = Uint64.from(10000000000000000000);
    try testing.expectEqual(@as(u64, 18446744073709551615), a.saturatingAdd(b).value);

    const c = Uint64.from(5000000000000000000);
    const d = Uint64.from(10000000000000000000);
    try testing.expectEqual(@as(u64, 0), c.saturatingSub(d).value);
}

test "Uint64 comparison" {
    const a = Uint64.from(10000000000000000000);
    const b = Uint64.from(10000000000000000000);
    const c = Uint64.from(5000000000000000000);

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

test "Uint64 bitwise operations" {
    const a = Uint64.from(0xFFFFFFFF00000000);
    const b = Uint64.from(0x0F0F0F0F0F0F0F0F);

    try testing.expectEqual(@as(u64, 0x0F0F0F0F00000000), a.bitwiseAnd(b).value);
    try testing.expectEqual(@as(u64, 0xFFFFFFFF0F0F0F0F), a.bitwiseOr(b).value);
    try testing.expectEqual(@as(u64, 0xF0F0F0F00F0F0F0F), a.bitwiseXor(b).value);
    try testing.expectEqual(@as(u64, 0x00000000FFFFFFFF), a.bitwiseNot().value);
}

test "Uint64 shift operations" {
    const a = Uint64.from(0x00000000000000FF);
    try testing.expectEqual(@as(u64, 0x000000000000FF00), a.shiftLeft(8).value);
    try testing.expectEqual(@as(u64, 0x000000000000000F), a.shiftRight(4).value);
}

test "Uint64 rotate operations" {
    const a = Uint64.from(0x123456789ABCDEF0);
    try testing.expectEqual(@as(u64, 0x23456789ABCDEF01), a.rotateLeft(4).value);
    try testing.expectEqual(@as(u64, 0x0123456789ABCDEF), a.rotateRight(4).value);
}

test "Uint64 utility functions" {
    const zero = Uint64.from(0);
    const nonzero = Uint64.from(42);

    try testing.expect(zero.isZero());
    try testing.expect(!nonzero.isZero());

    const a = Uint64.from(1000000000000);
    const b = Uint64.from(2000000000000);
    try testing.expectEqual(@as(u64, 1000000000000), a.min(b).value);
    try testing.expectEqual(@as(u64, 2000000000000), a.max(b).value);
}

test "Uint64 bit counting" {
    const a = Uint64.from(0x0010000000000000);
    try testing.expectEqual(@as(u7, 53), a.bitLength());
    try testing.expectEqual(@as(u7, 11), a.leadingZeros());
    try testing.expectEqual(@as(u7, 52), a.trailingZeros());
    try testing.expectEqual(@as(u7, 1), a.popCount());

    const zero = Uint64.from(0);
    try testing.expectEqual(@as(u7, 0), zero.bitLength());
    try testing.expectEqual(@as(u7, 64), zero.leadingZeros());
}

test "Uint64 byteSwap" {
    const a = Uint64.from(0x123456789ABCDEF0);
    try testing.expectEqual(@as(u64, 0xF0DEBC9A78563412), a.byteSwap().value);
}

test "Uint64 reverseBits" {
    const a = Uint64.from(0x8000000000000000);
    try testing.expectEqual(@as(u64, 0x0000000000000001), a.reverseBits().value);
}

test "Uint64 hi/lo parts" {
    const a = Uint64.from(0x123456789ABCDEF0);
    try testing.expectEqual(@as(u32, 0x12345678), a.hi());
    try testing.expectEqual(@as(u32, 0x9ABCDEF0), a.lo());

    const b = Uint64.fromHiLo(0x12345678, 0x9ABCDEF0);
    try testing.expectEqual(@as(u64, 0x123456789ABCDEF0), b.value);
}
