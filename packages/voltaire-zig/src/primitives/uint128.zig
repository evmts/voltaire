//! Fixed-width 128-bit unsigned integer type with checked arithmetic
//!
//! Provides a branded u128 type matching the TypeScript Uint128 API with:
//! - Overflow-checked arithmetic operations
//! - Bitwise operations
//! - Hex string conversion
//! - Comparison operations

const std = @import("std");
const testing = std.testing;

/// Branded 128-bit unsigned integer
pub const Uint128 = struct {
    value: u128,

    const Self = @This();

    // Constants
    pub const MIN: Self = .{ .value = 0 };
    pub const MAX: Self = .{ .value = std.math.maxInt(u128) };
    pub const ZERO: Self = .{ .value = 0 };
    pub const ONE: Self = .{ .value = 1 };
    pub const SIZE: usize = 16;
    pub const BITS: usize = 128;

    // Construction
    pub fn from(val: u128) Self {
        return .{ .value = val };
    }

    pub fn fromNumber(val: anytype) ?Self {
        const T = @TypeOf(val);
        if (@typeInfo(T) == .int or @typeInfo(T) == .comptime_int) {
            if (val < 0 or val > std.math.maxInt(u128)) return null;
            return .{ .value = @intCast(val) };
        }
        return null;
    }

    pub fn fromHex(hex: []const u8) !Self {
        const trimmed = if (hex.len >= 2 and hex[0] == '0' and (hex[1] == 'x' or hex[1] == 'X'))
            hex[2..]
        else
            hex;

        if (trimmed.len == 0 or trimmed.len > 32) return error.InvalidHex;

        const val = std.fmt.parseInt(u128, trimmed, 16) catch return error.InvalidHex;
        return .{ .value = val };
    }

    pub fn fromBytes(bytes: []const u8) ?Self {
        if (bytes.len != 16) return null;
        return .{ .value = std.mem.readInt(u128, bytes[0..16], .big) };
    }

    pub fn fromBytesLittle(bytes: []const u8) ?Self {
        if (bytes.len != 16) return null;
        return .{ .value = std.mem.readInt(u128, bytes[0..16], .little) };
    }

    // Conversion
    pub fn toNumber(self: Self) u128 {
        return self.value;
    }

    pub fn toU64(self: Self) ?u64 {
        if (self.value > std.math.maxInt(u64)) return null;
        return @intCast(self.value);
    }

    pub fn toHex(self: Self, buf: *[34]u8) []const u8 {
        buf[0] = '0';
        buf[1] = 'x';
        const hex_chars = "0123456789abcdef";
        inline for (0..32) |i| {
            const shift: u7 = @intCast(124 - i * 4);
            buf[2 + i] = hex_chars[@as(usize, @truncate((self.value >> shift) & 0x0f))];
        }
        return buf[0..34];
    }

    pub fn toBytes(self: Self, buf: *[16]u8) []const u8 {
        std.mem.writeInt(u128, buf, self.value, .big);
        return buf[0..16];
    }

    pub fn toBytesLittle(self: Self, buf: *[16]u8) []const u8 {
        std.mem.writeInt(u128, buf, self.value, .little);
        return buf[0..16];
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

    pub fn pow(self: Self, exp: u7) ?Self {
        if (exp == 0) return ONE;
        if (self.value == 0) return ZERO;
        if (self.value == 1) return ONE;

        // Use u256 for intermediate calculations to detect overflow
        var result: u256 = 1;
        var base: u256 = self.value;
        var e = exp;

        while (e > 0) {
            if (e & 1 == 1) {
                result *= base;
                if (result > std.math.maxInt(u128)) return null;
            }
            e >>= 1;
            if (e > 0) {
                base *= base;
                if (base > std.math.maxInt(u128)) return null;
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

    pub fn shiftLeft(self: Self, bits: u7) Self {
        return .{ .value = self.value << bits };
    }

    pub fn shiftRight(self: Self, bits: u7) Self {
        return .{ .value = self.value >> bits };
    }

    pub fn rotateLeft(self: Self, bits: u7) Self {
        return .{ .value = std.math.rotl(u128, self.value, bits) };
    }

    pub fn rotateRight(self: Self, bits: u7) Self {
        return .{ .value = std.math.rotr(u128, self.value, bits) };
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

    pub fn bitLength(self: Self) u8 {
        if (self.value == 0) return 0;
        return @intCast(128 - @clz(self.value));
    }

    pub fn leadingZeros(self: Self) u8 {
        return @clz(self.value);
    }

    pub fn trailingZeros(self: Self) u8 {
        return @ctz(self.value);
    }

    pub fn popCount(self: Self) u8 {
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
    pub fn hi(self: Self) u64 {
        return @truncate(self.value >> 64);
    }

    pub fn lo(self: Self) u64 {
        return @truncate(self.value);
    }

    pub fn fromHiLo(high: u64, low: u64) Self {
        return .{ .value = (@as(u128, high) << 64) | @as(u128, low) };
    }

    // Math utilities
    pub fn gcd(self: Self, other: Self) Self {
        var a = self.value;
        var b = other.value;
        while (b != 0) {
            const t = b;
            b = a % b;
            a = t;
        }
        return .{ .value = a };
    }

    pub fn lcm(self: Self, other: Self) ?Self {
        if (self.value == 0 or other.value == 0) return ZERO;
        const g = self.gcd(other);
        const divided = self.value / g.value;
        return Self.from(divided).mul(other);
    }

    pub fn isPowerOf2(self: Self) bool {
        return self.value != 0 and (self.value & (self.value - 1)) == 0;
    }

    // Aggregation
    pub fn sum(values: []const Self) ?Self {
        var result = ZERO;
        for (values) |v| {
            result = result.add(v) orelse return null;
        }
        return result;
    }

    pub fn product(values: []const Self) ?Self {
        if (values.len == 0) return ONE;
        var result = values[0];
        for (values[1..]) |v| {
            result = result.mul(v) orelse return null;
        }
        return result;
    }

    pub fn minimum(values: []const Self) ?Self {
        if (values.len == 0) return null;
        var result = values[0];
        for (values[1..]) |v| {
            result = result.min(v);
        }
        return result;
    }

    pub fn maximum(values: []const Self) ?Self {
        if (values.len == 0) return null;
        var result = values[0];
        for (values[1..]) |v| {
            result = result.max(v);
        }
        return result;
    }
};

// Tests
test "Uint128 constants" {
    try testing.expectEqual(@as(u128, 0), Uint128.MIN.value);
    try testing.expectEqual(std.math.maxInt(u128), Uint128.MAX.value);
    try testing.expectEqual(@as(u128, 0), Uint128.ZERO.value);
    try testing.expectEqual(@as(u128, 1), Uint128.ONE.value);
    try testing.expectEqual(@as(usize, 16), Uint128.SIZE);
    try testing.expectEqual(@as(usize, 128), Uint128.BITS);
}

test "Uint128 from" {
    const a = Uint128.from(42);
    try testing.expectEqual(@as(u128, 42), a.value);

    const b = Uint128.from(0);
    try testing.expectEqual(@as(u128, 0), b.value);

    const c = Uint128.from(std.math.maxInt(u128));
    try testing.expectEqual(std.math.maxInt(u128), c.value);
}

test "Uint128 fromNumber" {
    const a = Uint128.fromNumber(42);
    try testing.expect(a != null);
    try testing.expectEqual(@as(u128, 42), a.?.value);

    const c = Uint128.fromNumber(-1);
    try testing.expect(c == null);
}

test "Uint128 fromHex" {
    const a = try Uint128.fromHex("0x0000000000000000000000000000002a");
    try testing.expectEqual(@as(u128, 42), a.value);

    const b = try Uint128.fromHex("ffffffffffffffffffffffffffffffff");
    try testing.expectEqual(std.math.maxInt(u128), b.value);

    const c = try Uint128.fromHex("0X00000000000000000000000000000000");
    try testing.expectEqual(@as(u128, 0), c.value);

    try testing.expectError(error.InvalidHex, Uint128.fromHex("0x100000000000000000000000000000000"));
    try testing.expectError(error.InvalidHex, Uint128.fromHex(""));
    try testing.expectError(error.InvalidHex, Uint128.fromHex("0x"));
}

test "Uint128 fromBytes" {
    var bytes_be: [16]u8 = undefined;
    @memset(&bytes_be, 0);
    bytes_be[15] = 0x2a;
    const a = Uint128.fromBytes(&bytes_be);
    try testing.expect(a != null);
    try testing.expectEqual(@as(u128, 42), a.?.value);

    var bytes_le: [16]u8 = undefined;
    @memset(&bytes_le, 0);
    bytes_le[0] = 0x2a;
    const b = Uint128.fromBytesLittle(&bytes_le);
    try testing.expect(b != null);
    try testing.expectEqual(@as(u128, 42), b.?.value);

    const empty: []const u8 = &.{};
    try testing.expect(Uint128.fromBytes(empty) == null);

    var too_long: [17]u8 = undefined;
    try testing.expect(Uint128.fromBytes(&too_long) == null);
}

test "Uint128 toNumber" {
    const a = Uint128.from(42);
    try testing.expectEqual(@as(u128, 42), a.toNumber());
}

test "Uint128 toU64" {
    const a = Uint128.from(42);
    try testing.expect(a.toU64() != null);
    try testing.expectEqual(@as(u64, 42), a.toU64().?);

    const b = Uint128.from(@as(u128, std.math.maxInt(u64)) + 1);
    try testing.expect(b.toU64() == null);
}

test "Uint128 toHex" {
    var buf: [34]u8 = undefined;

    const a = Uint128.from(42);
    try testing.expectEqualStrings("0x0000000000000000000000000000002a", a.toHex(&buf));

    const b = Uint128.from(0);
    try testing.expectEqualStrings("0x00000000000000000000000000000000", b.toHex(&buf));
}

test "Uint128 toBytes" {
    var buf: [16]u8 = undefined;
    const val: u128 = 0x123456789ABCDEF0123456789ABCDEF0;
    const a = Uint128.from(val);
    const bytes = a.toBytes(&buf);
    try testing.expectEqual(@as(usize, 16), bytes.len);
    try testing.expectEqual(@as(u8, 0x12), bytes[0]);
    try testing.expectEqual(@as(u8, 0x34), bytes[1]);
    try testing.expectEqual(@as(u8, 0xF0), bytes[15]);

    const bytes_le = a.toBytesLittle(&buf);
    try testing.expectEqual(@as(u8, 0xF0), bytes_le[0]);
    try testing.expectEqual(@as(u8, 0x12), bytes_le[15]);
}

test "Uint128 checked add" {
    const a = Uint128.from(100);
    const b = Uint128.from(50);
    const result = a.add(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u128, 150), result.?.value);

    const c = Uint128.MAX;
    const d = Uint128.from(1);
    try testing.expect(c.add(d) == null);
}

test "Uint128 checked sub" {
    const a = Uint128.from(100);
    const b = Uint128.from(50);
    const result = a.sub(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u128, 50), result.?.value);

    const c = Uint128.from(50);
    const d = Uint128.from(100);
    try testing.expect(c.sub(d) == null);
}

test "Uint128 checked mul" {
    const a = Uint128.from(1000000000000);
    const b = Uint128.from(1000000000000);
    const result = a.mul(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u128, 1000000000000000000000000), result.?.value);

    const c = Uint128.from(std.math.maxInt(u128) / 2 + 1);
    const d = Uint128.from(2);
    try testing.expect(c.mul(d) == null);
}

test "Uint128 checked div" {
    const a = Uint128.from(1000000000000);
    const b = Uint128.from(1000);
    const result = a.div(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u128, 1000000000), result.?.value);

    const c = Uint128.from(100);
    const d = Uint128.from(0);
    try testing.expect(c.div(d) == null);
}

test "Uint128 checked mod" {
    const a = Uint128.from(100);
    const b = Uint128.from(30);
    const result = a.mod(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u128, 10), result.?.value);

    const c = Uint128.from(100);
    const d = Uint128.from(0);
    try testing.expect(c.mod(d) == null);
}

test "Uint128 checked pow" {
    const a = Uint128.from(2);
    const result = a.pow(40);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u128, 1099511627776), result.?.value);

    try testing.expectEqual(@as(u128, 1), Uint128.from(5).pow(0).?.value);
    try testing.expectEqual(@as(u128, 0), Uint128.from(0).pow(5).?.value);
    try testing.expectEqual(@as(u128, 1), Uint128.from(1).pow(127).?.value);

    const b = Uint128.from(10);
    try testing.expect(b.pow(40) == null);
}

test "Uint128 wrapping arithmetic" {
    const a = Uint128.MAX;
    const b = Uint128.from(1);
    try testing.expectEqual(@as(u128, 0), a.wrappingAdd(b).value);

    const c = Uint128.from(0);
    const d = Uint128.from(1);
    try testing.expectEqual(Uint128.MAX.value, c.wrappingSub(d).value);
}

test "Uint128 saturating arithmetic" {
    const a = Uint128.MAX;
    const b = Uint128.from(1);
    try testing.expectEqual(Uint128.MAX.value, a.saturatingAdd(b).value);

    const c = Uint128.from(0);
    const d = Uint128.from(1);
    try testing.expectEqual(@as(u128, 0), c.saturatingSub(d).value);
}

test "Uint128 comparison" {
    const a = Uint128.from(100);
    const b = Uint128.from(100);
    const c = Uint128.from(50);

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

test "Uint128 bitwise operations" {
    const a = Uint128.from(0xFFFFFFFFFFFFFFFF0000000000000000);
    const b = Uint128.from(0x0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F0F);

    try testing.expectEqual(@as(u128, 0x0F0F0F0F0F0F0F0F0000000000000000), a.bitwiseAnd(b).value);
    try testing.expectEqual(@as(u128, 0xFFFFFFFFFFFFFFFF0F0F0F0F0F0F0F0F), a.bitwiseOr(b).value);
    try testing.expectEqual(@as(u128, 0xF0F0F0F0F0F0F0F00F0F0F0F0F0F0F0F), a.bitwiseXor(b).value);
    try testing.expectEqual(@as(u128, 0x0000000000000000FFFFFFFFFFFFFFFF), a.bitwiseNot().value);
}

test "Uint128 shift operations" {
    const a = Uint128.from(0xFF);
    try testing.expectEqual(@as(u128, 0xFF00), a.shiftLeft(8).value);
    try testing.expectEqual(@as(u128, 0x0F), a.shiftRight(4).value);
}

test "Uint128 rotate operations" {
    const val: u128 = 0x123456789ABCDEF0123456789ABCDEF0;
    const a = Uint128.from(val);
    const rotated_left = a.rotateLeft(4);
    const rotated_back = rotated_left.rotateRight(4);
    try testing.expectEqual(val, rotated_back.value);
}

test "Uint128 utility functions" {
    const zero = Uint128.from(0);
    const nonzero = Uint128.from(42);

    try testing.expect(zero.isZero());
    try testing.expect(!nonzero.isZero());

    const a = Uint128.from(100);
    const b = Uint128.from(200);
    try testing.expectEqual(@as(u128, 100), a.min(b).value);
    try testing.expectEqual(@as(u128, 200), a.max(b).value);
}

test "Uint128 bit counting" {
    const a = Uint128.from(0b00101100);
    try testing.expectEqual(@as(u8, 6), a.bitLength());
    try testing.expectEqual(@as(u8, 122), a.leadingZeros());
    try testing.expectEqual(@as(u8, 2), a.trailingZeros());
    try testing.expectEqual(@as(u8, 3), a.popCount());

    const zero = Uint128.from(0);
    try testing.expectEqual(@as(u8, 0), zero.bitLength());
    try testing.expectEqual(@as(u8, 128), zero.leadingZeros());
}

test "Uint128 byteSwap" {
    const val: u128 = 0x0102030405060708090A0B0C0D0E0F10;
    const a = Uint128.from(val);
    const swapped = a.byteSwap();
    try testing.expectEqual(@as(u128, 0x100F0E0D0C0B0A090807060504030201), swapped.value);
}

test "Uint128 reverseBits" {
    const val: u128 = @as(u128, 1) << 127;
    const a = Uint128.from(val);
    try testing.expectEqual(@as(u128, 1), a.reverseBits().value);
}

test "Uint128 hi/lo parts" {
    const val: u128 = 0x123456789ABCDEF0FEDCBA9876543210;
    const a = Uint128.from(val);
    try testing.expectEqual(@as(u64, 0x123456789ABCDEF0), a.hi());
    try testing.expectEqual(@as(u64, 0xFEDCBA9876543210), a.lo());

    const b = Uint128.fromHiLo(0x123456789ABCDEF0, 0xFEDCBA9876543210);
    try testing.expectEqual(val, b.value);
}

test "Uint128 gcd" {
    const a = Uint128.from(48);
    const b = Uint128.from(18);
    try testing.expectEqual(@as(u128, 6), a.gcd(b).value);

    const c = Uint128.from(100);
    const d = Uint128.from(25);
    try testing.expectEqual(@as(u128, 25), c.gcd(d).value);

    const e = Uint128.from(17);
    const f = Uint128.from(13);
    try testing.expectEqual(@as(u128, 1), e.gcd(f).value);
}

test "Uint128 lcm" {
    const a = Uint128.from(4);
    const b = Uint128.from(6);
    const result = a.lcm(b);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u128, 12), result.?.value);

    const c = Uint128.from(0);
    const d = Uint128.from(5);
    try testing.expectEqual(@as(u128, 0), c.lcm(d).?.value);
}

test "Uint128 isPowerOf2" {
    try testing.expect(Uint128.from(1).isPowerOf2());
    try testing.expect(Uint128.from(2).isPowerOf2());
    try testing.expect(Uint128.from(4).isPowerOf2());
    try testing.expect(Uint128.from(1024).isPowerOf2());
    try testing.expect(!Uint128.from(0).isPowerOf2());
    try testing.expect(!Uint128.from(3).isPowerOf2());
    try testing.expect(!Uint128.from(100).isPowerOf2());
}

test "Uint128 sum" {
    const values = [_]Uint128{
        Uint128.from(10),
        Uint128.from(20),
        Uint128.from(30),
    };
    const result = Uint128.sum(&values);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u128, 60), result.?.value);

    const empty: []const Uint128 = &.{};
    try testing.expectEqual(@as(u128, 0), Uint128.sum(empty).?.value);
}

test "Uint128 product" {
    const values = [_]Uint128{
        Uint128.from(2),
        Uint128.from(3),
        Uint128.from(4),
    };
    const result = Uint128.product(&values);
    try testing.expect(result != null);
    try testing.expectEqual(@as(u128, 24), result.?.value);

    const empty: []const Uint128 = &.{};
    try testing.expectEqual(@as(u128, 1), Uint128.product(empty).?.value);
}

test "Uint128 minimum/maximum" {
    const values = [_]Uint128{
        Uint128.from(50),
        Uint128.from(10),
        Uint128.from(30),
    };
    try testing.expectEqual(@as(u128, 10), Uint128.minimum(&values).?.value);
    try testing.expectEqual(@as(u128, 50), Uint128.maximum(&values).?.value);

    const empty: []const Uint128 = &.{};
    try testing.expect(Uint128.minimum(empty) == null);
    try testing.expect(Uint128.maximum(empty) == null);
}
