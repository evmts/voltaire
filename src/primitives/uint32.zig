//! Fixed-width 32-bit unsigned integer type with checked arithmetic
//!
//! Provides a branded u32 type matching the TypeScript Uint32 API with:
//! - Overflow-checked arithmetic operations
//! - Bitwise operations
//! - Hex string conversion
//! - Comparison operations

const std = @import("std");
const testing = std.testing;

/// Branded 32-bit unsigned integer
pub const Uint32 = struct {
    value: u32,

    const Self = @This();

    // Constants
    pub const MIN: Self = .{ .value = 0 };
    pub const MAX: Self = .{ .value = std.math.maxInt(u32) };
    pub const ZERO: Self = .{ .value = 0 };
    pub const ONE: Self = .{ .value = 1 };
    pub const SIZE: usize = 4;
    pub const BITS: usize = 32;

    // Construction
    pub fn from(val: u32) Self {
        return .{ .value = val };
    }

    pub fn fromNumber(val: anytype) ?Self {
        const T = @TypeOf(val);
        if (@typeInfo(T) == .int or @typeInfo(T) == .comptime_int) {
            if (val < 0 or val > std.math.maxInt(u32)) return null;
            return .{ .value = @intCast(val) };
        }
        return null;
    }

    pub fn fromHex(hex: []const u8) !Self {
        const trimmed = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X'))
            hex[2..]
        else
            hex;

        if (trimmed.len == 0 or trimmed.len > 8) return error.InvalidHex;

        const val = std.fmt.parseInt(u32, trimmed, 16) catch return error.InvalidHex;
        return .{ .value = val };
    }

    pub fn fromBytes(bytes: []const u8) ?Self {
        if (bytes.len != 4) return null;
        return .{ .value = std.mem.readInt(u32, bytes[0..4], .big) };
    }

    pub fn fromBytesLittle(bytes: []const u8) ?Self {
        if (bytes.len != 4) return null;
        return .{ .value = std.mem.readInt(u32, bytes[0..4], .little) };
    }

    // Conversion
    pub fn toNumber(self: Self) u32 {
        return self.value;
    }

    pub fn toHex(self: Self, buf: *[10]u8) []const u8 {
        buf[0] = '0';
        buf[1] = 'x';
        const hex_chars = "0123456789abcdef";
        inline for (0..8) |i| {
            const shift: u5 = @intCast(28 - i * 4);
            buf[2 + i] = hex_chars[(self.value >> shift) & 0x0f];
        }
        return buf[0..10];
    }

    pub fn toBytes(self: Self, buf: *[4]u8) []const u8 {
        std.mem.writeInt(u32, buf, self.value, .big);
        return buf[0..4];
    }

    pub fn toBytesLittle(self: Self, buf: *[4]u8) []const u8 {
        std.mem.writeInt(u32, buf, self.value, .little);
        return buf[0..4];
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

    pub fn pow(self: Self, exp: u5) ?Self {
        if (exp == 0) return ONE;
        if (self.value == 0) return ZERO;
        if (self.value == 1) return ONE;

        var result: u64 = 1;
        var base: u64 = self.value;
        var e = exp;

        while (e > 0) {
            if (e & 1 == 1) {
                result *= base;
                if (result > std.math.maxInt(u32)) return null;
            }
            e >>= 1;
            if (e > 0) {
                base *= base;
                if (base > std.math.maxInt(u32)) return null;
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

    pub fn shiftLeft(self: Self, bits: u5) Self {
        return .{ .value = self.value << bits };
    }

    pub fn shiftRight(self: Self, bits: u5) Self {
        return .{ .value = self.value >> bits };
    }

    pub fn rotateLeft(self: Self, bits: u5) Self {
        return .{ .value = std.math.rotl(u32, self.value, bits) };
    }

    pub fn rotateRight(self: Self, bits: u5) Self {
        return .{ .value = std.math.rotr(u32, self.value, bits) };
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

    pub fn bitLength(self: Self) u6 {
        if (self.value == 0) return 0;
        return @intCast(32 - @clz(self.value));
    }

    pub fn leadingZeros(self: Self) u6 {
        return @clz(self.value);
    }

    pub fn trailingZeros(self: Self) u6 {
        return @ctz(self.value);
    }

    pub fn popCount(self: Self) u6 {
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
};

// Tests
test "Uint32 constants" {
    try testing.expectEqual(@as(u32, 0), Uint32.MIN.value);
    try testing.expectEqual(@as(u32, 4294967295), Uint32.MAX.value);
    try testing.expectEqual(@as(u32, 0), Uint32.ZERO.value);
    try testing.expectEqual(@as(u32, 1), Uint32.ONE.value);
    try testing.expectEqual(@as(usize, 4), Uint32.SIZE);
    try testing.expectEqual(@as(usize, 32), Uint32.BITS);
}

test "Uint32 from" {
    const a = Uint32.from(42);
    try testing.expectEqual(@as(u32, 42), a.value);

    const b = Uint32.from(0);
    try testing.expectEqual(@as(u32, 0), b.value);

    const c = Uint32.from(4294967295);
    try testing.expectEqual(@as(u32, 4294967295), c.value);
}

test "Uint32 fromNumber" {
    const a = Uint32.fromNumber(42);
    try testing.expect(a != null);
    try testing.expectEqual(@as(u32, 42), a.?.value);

    const b = Uint32.fromNumber(4294967296);
    try testing.expect(b == null);

    const c = Uint32.fromNumber(-1);
    try testing.expect(c == null);
}

test "Uint32 fromHex" {
    const a = try Uint32.fromHex("0x0000002a");
    try testing.expectEqual(@as(u32, 42), a.value);

    const b = try Uint32.fromHex("ffffffff");
    try testing.expectEqual(@as(u32, 4294967295), b.value);

    const c = try Uint32.fromHex("0X00000000");
    try testing.expectEqual(@as(u32, 0), c.value);

    try testing.expectError(error.InvalidHex, Uint32.fromHex("0x100000000"));
    try testing.expectError(error.InvalidHex, Uint32.fromHex(""));
    try testing.expectError(error.InvalidHex, Uint32.fromHex("0x"));
}

test "Uint32 fromBytes" {
    const bytes_be = [_]u8{ 0x00, 0x00, 0x00, 0x2a };
    const a = Uint32.fromBytes(&bytes_be);
    try testing.expect(a != null);
    try testing.expectEqual(@as(u32, 42), a.?.value);

    const bytes_le = [_]u8{ 0x2a, 0x00, 0x00, 0x00 };
    const b = Uint32.fromBytesLittle(&bytes_le);
    try testing.expect(b != null);
    try testing.expectEqual(@as(u32, 42), b.?.value);

    const empty: []const u8 = &.{};
    try testing.expect(Uint32.fromBytes(empty) == null);

    const too_long = [_]u8{ 1, 2, 3, 4, 5 };
    try testing.expect(Uint32.fromBytes(&too_long) == null);
}

test "Uint32 toNumber" {
    const a = Uint32.from(42);
    try testing.expectEqual(@as(u32, 42), a.toNumber());
}

test "Uint32 toHex" {
    var buf: [10]u8 = undefined;

    const a = Uint32.from(42);
    try testing.expectEqualStrings("0x0000002a", a.toHex(&buf));

    const b = Uint32.from(4294967295);
    try testing.expectEqualStrings("0xffffffff", b.toHex(&buf));

    const c = Uint32.from(0);
    try testing.expectEqualStrings("0x00000000", c.toHex(&buf));
}

test "Uint32 toBytes" {
    var buf: [4]u8 = undefined;
    const a = Uint32.from(0x12345678);
    const bytes = a.toBytes(&buf);
    try testing.expectEqual(@as(usize, 4), bytes.len);
    try testing.expectEqual(@as(u8, 0x12), bytes[0]);
    try testing.expectEqual(@as(u8, 0x34), bytes[1]);
    try testing.expectEqual(@as(u8, 0x56), bytes[2]);
    try testing.expectEqual(@as(u8, 0x78), bytes[3]);

    const bytes_le = a.toBytesLittle(&buf);
    try testing.expectEqual(@as(u8, 0x78), bytes_le[0]);
    try testing.expectEqual(@as(u8, 0x56), bytes_le[1]);
    try testing.expectEqual(@as(u8, 0x34), bytes_le[2]);
    try testing.expectEqual(@as(u8, 0x12), bytes_le[3]);
}

test "Uint32 checked add" {
    const a = Uint32.from(2000000000);
    const b = Uint32.from(1000000000);
    const result = a.add(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u32, 3000000000), result.?.value);

    const c = Uint32.from(3000000000);
    const d = Uint32.from(2000000000);
    try testing.expect(c.add(d) == null);
}

test "Uint32 checked sub" {
    const a = Uint32.from(3000000000);
    const b = Uint32.from(1000000000);
    const result = a.sub(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u32, 2000000000), result.?.value);

    const c = Uint32.from(1000000000);
    const d = Uint32.from(2000000000);
    try testing.expect(c.sub(d) == null);
}

test "Uint32 checked mul" {
    const a = Uint32.from(50000);
    const b = Uint32.from(80000);
    const result = a.mul(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u32, 4000000000), result.?.value);

    const c = Uint32.from(100000);
    const d = Uint32.from(100000);
    try testing.expect(c.mul(d) == null);
}

test "Uint32 checked div" {
    const a = Uint32.from(1000000000);
    const b = Uint32.from(10000);
    const result = a.div(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u32, 100000), result.?.value);

    const c = Uint32.from(100);
    const d = Uint32.from(0);
    try testing.expect(c.div(d) == null);
}

test "Uint32 checked mod" {
    const a = Uint32.from(1000000000);
    const b = Uint32.from(300000000);
    const result = a.mod(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u32, 100000000), result.?.value);

    const c = Uint32.from(100);
    const d = Uint32.from(0);
    try testing.expect(c.mod(d) == null);
}

test "Uint32 checked pow" {
    const a = Uint32.from(2);
    const result = a.pow(10);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u32, 1024), result.?.value);

    const b = Uint32.from(10);
    const result2 = b.pow(9);
    try testing.expect(result2 != null);
    try testing.expectEqual(@as(u32, 1000000000), result2.?.value);

    const c = Uint32.from(100);
    try testing.expect(c.pow(5) == null);

    try testing.expectEqual(@as(u32, 1), Uint32.from(5).pow(0).?.value);
    try testing.expectEqual(@as(u32, 0), Uint32.from(0).pow(5).?.value);
    try testing.expectEqual(@as(u32, 1), Uint32.from(1).pow(31).?.value);
}

test "Uint32 wrapping arithmetic" {
    const a = Uint32.from(3000000000);
    const b = Uint32.from(2000000000);
    try testing.expectEqual(@as(u32, 705032704), a.wrappingAdd(b).value);

    const c = Uint32.from(1000000000);
    const d = Uint32.from(2000000000);
    try testing.expectEqual(@as(u32, 3294967296), c.wrappingSub(d).value);
}

test "Uint32 saturating arithmetic" {
    const a = Uint32.from(3000000000);
    const b = Uint32.from(2000000000);
    try testing.expectEqual(@as(u32, 4294967295), a.saturatingAdd(b).value);

    const c = Uint32.from(1000000000);
    const d = Uint32.from(2000000000);
    try testing.expectEqual(@as(u32, 0), c.saturatingSub(d).value);
}

test "Uint32 comparison" {
    const a = Uint32.from(1000000000);
    const b = Uint32.from(1000000000);
    const c = Uint32.from(500000000);

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

test "Uint32 bitwise operations" {
    const a = Uint32.from(0xFFFF0000);
    const b = Uint32.from(0x0F0F0F0F);

    try testing.expectEqual(@as(u32, 0x0F0F0000), a.bitwiseAnd(b).value);
    try testing.expectEqual(@as(u32, 0xFFFF0F0F), a.bitwiseOr(b).value);
    try testing.expectEqual(@as(u32, 0xF0F00F0F), a.bitwiseXor(b).value);
    try testing.expectEqual(@as(u32, 0x0000FFFF), a.bitwiseNot().value);
}

test "Uint32 shift operations" {
    const a = Uint32.from(0x000000FF);
    try testing.expectEqual(@as(u32, 0x0000FF00), a.shiftLeft(8).value);
    try testing.expectEqual(@as(u32, 0x0000000F), a.shiftRight(4).value);
}

test "Uint32 rotate operations" {
    const a = Uint32.from(0x12345678);
    try testing.expectEqual(@as(u32, 0x23456781), a.rotateLeft(4).value);
    try testing.expectEqual(@as(u32, 0x81234567), a.rotateRight(4).value);
}

test "Uint32 utility functions" {
    const zero = Uint32.from(0);
    const nonzero = Uint32.from(42);

    try testing.expect(zero.isZero());
    try testing.expect(!nonzero.isZero());

    const a = Uint32.from(100000);
    const b = Uint32.from(200000);
    try testing.expectEqual(@as(u32, 100000), a.min(b).value);
    try testing.expectEqual(@as(u32, 200000), a.max(b).value);
}

test "Uint32 bit counting" {
    const a = Uint32.from(0b00101100000000000000000000000000);
    try testing.expectEqual(@as(u6, 30), a.bitLength());
    try testing.expectEqual(@as(u6, 2), a.leadingZeros());
    try testing.expectEqual(@as(u6, 26), a.trailingZeros());
    try testing.expectEqual(@as(u6, 3), a.popCount());

    const zero = Uint32.from(0);
    try testing.expectEqual(@as(u6, 0), zero.bitLength());
    try testing.expectEqual(@as(u6, 32), zero.leadingZeros());
}

test "Uint32 byteSwap" {
    const a = Uint32.from(0x12345678);
    try testing.expectEqual(@as(u32, 0x78563412), a.byteSwap().value);
}

test "Uint32 reverseBits" {
    const a = Uint32.from(0x80000000);
    try testing.expectEqual(@as(u32, 0x00000001), a.reverseBits().value);

    const b = Uint32.from(0x12345678);
    const rev = b.reverseBits();
    try testing.expectEqual(@as(u32, 0x1E6A2C48), rev.value);
}
