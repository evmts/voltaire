//! TokenBalance - ERC-20 Token Balance with Decimal Support
//!
//! Represents a token balance as stored on-chain (in base units) with utilities
//! for formatting with decimals. Token balances are uint256 values that can be
//! converted to human-readable format using the token's decimal count.
//!
//! ## Design
//! - Stored as u256 (full range as per ERC-20 spec)
//! - Provides decimal formatting utilities
//! - Supports common token decimal configurations (ETH=18, USDC=6, etc.)
//!
//! ## Usage
//! ```zig
//! const balance = TokenBalance.from(1000000); // 1 USDC in base units
//! const formatted = TokenBalance.format(balance, 6); // "1.0"
//! ```
//!
//! @see https://eips.ethereum.org/EIPS/eip-20

const std = @import("std");

/// TokenBalance type - u256 representing ERC-20 token balance in base units
pub const TokenBalance = u256;

/// Maximum TokenBalance value (2^256 - 1)
pub const MAX: TokenBalance = std.math.maxInt(u256);

/// Minimum TokenBalance value (0)
pub const MIN: TokenBalance = 0;

/// Common decimal counts for ERC-20 tokens
pub const DECIMALS = struct {
    pub const ETH: u8 = 18;
    pub const WETH: u8 = 18;
    pub const USDC: u8 = 6;
    pub const USDT: u8 = 6;
    pub const DAI: u8 = 18;
    pub const WBTC: u8 = 8;
};

/// Create TokenBalance from u256 value (already in base units)
///
/// @param value - u256 value in base units
/// @returns TokenBalance
pub fn from(value: u256) TokenBalance {
    return value;
}

/// Create TokenBalance from u64 value (already in base units)
///
/// @param value - u64 value in base units
/// @returns TokenBalance
pub fn fromNumber(value: u64) TokenBalance {
    return value;
}

/// Create TokenBalance from hex string (with or without 0x prefix)
///
/// @param hex_str - hex string
/// @returns TokenBalance or error
pub fn fromHex(hex_str: []const u8) !TokenBalance {
    var slice = hex_str;
    if (slice.len >= 2 and slice[0] == '0' and (slice[1] == 'x' or slice[1] == 'X')) {
        slice = slice[2..];
    }

    if (slice.len == 0) return 0;
    if (slice.len > 64) return error.ValueTooLarge;

    var result: u256 = 0;
    for (slice) |c| {
        const digit: u8 = switch (c) {
            '0'...'9' => c - '0',
            'a'...'f' => c - 'a' + 10,
            'A'...'F' => c - 'A' + 10,
            else => return error.InvalidHexCharacter,
        };
        result = result * 16 + digit;
    }
    return result;
}

/// Create TokenBalance from human-readable amount and decimals
/// E.g., fromBaseUnit("1.5", 18) for 1.5 ETH
pub fn fromBaseUnit(allocator: std.mem.Allocator, amount: []const u8, decimals: u8) !TokenBalance {
    _ = allocator;

    // Find decimal point position
    var decimal_pos: ?usize = null;
    for (amount, 0..) |c, i| {
        if (c == '.') {
            decimal_pos = i;
            break;
        }
    }

    if (decimal_pos) |pos| {
        // Has decimal point
        const integer_part = amount[0..pos];
        const fractional_part = amount[pos + 1 ..];

        // Parse integer part
        var int_value: u256 = 0;
        for (integer_part) |c| {
            if (c < '0' or c > '9') return error.InvalidNumber;
            int_value = int_value * 10 + (c - '0');
        }

        // Scale integer part
        var scale: u256 = 1;
        for (0..decimals) |_| {
            scale *= 10;
        }
        var result = int_value * scale;

        // Parse and add fractional part
        var frac_scale = scale / 10;
        for (fractional_part) |c| {
            if (c < '0' or c > '9') return error.InvalidNumber;
            if (frac_scale > 0) {
                result += @as(u256, c - '0') * frac_scale;
                frac_scale /= 10;
            }
        }

        return result;
    } else {
        // No decimal point, just integer
        var value: u256 = 0;
        for (amount) |c| {
            if (c < '0' or c > '9') return error.InvalidNumber;
            value = value * 10 + (c - '0');
        }

        // Scale by decimals
        var scale: u256 = 1;
        for (0..decimals) |_| {
            scale *= 10;
        }

        return value * scale;
    }
}

/// Check if two balances are equal
pub fn equals(self: TokenBalance, other: TokenBalance) bool {
    return self == other;
}

/// Compare two balances
/// Returns -1 if self < other, 0 if equal, 1 if self > other
pub fn compare(self: TokenBalance, other: TokenBalance) i8 {
    if (self < other) return -1;
    if (self > other) return 1;
    return 0;
}

/// Convert TokenBalance to u64 (truncates if value exceeds u64 max)
pub fn toNumber(self: TokenBalance) u64 {
    return @truncate(self);
}

/// Convert TokenBalance to u256
pub fn toBigInt(self: TokenBalance) u256 {
    return self;
}

/// Convert TokenBalance to hex string (lowercase with 0x prefix)
/// Returns a fixed 66-byte array (0x + 64 hex chars)
pub fn toHex(self: TokenBalance) [66]u8 {
    const hex_chars = "0123456789abcdef";
    var result: [66]u8 = undefined;
    result[0] = '0';
    result[1] = 'x';

    var value = self;
    var i: usize = 65;
    while (i >= 2) : (i -= 1) {
        result[i] = hex_chars[@as(usize, @truncate(value & 0xf))];
        value >>= 4;
    }
    return result;
}

/// Convert balance to base unit (human-readable string with decimals)
/// Allocates memory for the result string
pub fn toBaseUnit(allocator: std.mem.Allocator, self: TokenBalance, decimals: u8) ![]u8 {
    if (self == 0) {
        const result = try allocator.alloc(u8, 3);
        result[0] = '0';
        result[1] = '.';
        result[2] = '0';
        return result;
    }

    // Calculate scale
    var scale: u256 = 1;
    for (0..decimals) |_| {
        scale *= 10;
    }

    const integer_part = self / scale;
    const fractional_part = self % scale;

    // Convert integer part to string
    var int_digits: [78]u8 = undefined; // Max u256 is 78 digits
    var int_len: usize = 0;
    var temp = integer_part;
    if (temp == 0) {
        int_digits[0] = '0';
        int_len = 1;
    } else {
        while (temp > 0) {
            int_digits[int_len] = @truncate((temp % 10) + '0');
            temp /= 10;
            int_len += 1;
        }
    }

    // Convert fractional part to string (padded)
    var frac_digits: [78]u8 = undefined;
    temp = fractional_part;
    for (0..decimals) |i| {
        frac_digits[decimals - 1 - i] = @truncate((temp % 10) + '0');
        temp /= 10;
    }

    // Trim trailing zeros from fractional part
    var frac_len: usize = decimals;
    while (frac_len > 1 and frac_digits[frac_len - 1] == '0') {
        frac_len -= 1;
    }

    // Allocate result: integer + '.' + fractional
    const result = try allocator.alloc(u8, int_len + 1 + frac_len);

    // Copy integer part (reversed)
    for (0..int_len) |i| {
        result[i] = int_digits[int_len - 1 - i];
    }

    result[int_len] = '.';

    // Copy fractional part
    @memcpy(result[int_len + 1 .. int_len + 1 + frac_len], frac_digits[0..frac_len]);

    return result;
}

/// Format balance as string with specified decimals
/// Alias for toBaseUnit for compatibility with TypeScript API
pub fn format(allocator: std.mem.Allocator, self: TokenBalance, decimals: u8) ![]u8 {
    return toBaseUnit(allocator, self, decimals);
}

// ERC-20 interface selectors
pub const ERC20_SELECTORS = struct {
    pub const balanceOf: [4]u8 = .{ 0x70, 0xa0, 0x82, 0x31 };
    pub const transfer: [4]u8 = .{ 0xa9, 0x05, 0x9c, 0xbb };
    pub const approve: [4]u8 = .{ 0x09, 0x5e, 0xa7, 0xb3 };
    pub const transferFrom: [4]u8 = .{ 0x23, 0xb8, 0x72, 0xdd };
    pub const totalSupply: [4]u8 = .{ 0x18, 0x16, 0x0d, 0xdd };
    pub const allowance: [4]u8 = .{ 0xdd, 0x62, 0xed, 0x3e };
};

/// Add two balances, returning error on overflow
pub fn add(a: TokenBalance, b: TokenBalance) !TokenBalance {
    const result = @addWithOverflow(a, b);
    if (result[1] != 0) return error.Overflow;
    return result[0];
}

/// Subtract two balances, returning error on underflow
pub fn sub(a: TokenBalance, b: TokenBalance) !TokenBalance {
    if (b > a) return error.Underflow;
    return a - b;
}

/// Check if balance is zero
pub fn isZero(self: TokenBalance) bool {
    return self == 0;
}

/// Rich TokenBalance with token metadata
pub const RichTokenBalance = struct {
    token: [20]u8,
    balance: u256,
    decimals: u8,

    /// Create from components
    pub fn init(token: [20]u8, balance: u256, decimals: u8) RichTokenBalance {
        return .{
            .token = token,
            .balance = balance,
            .decimals = decimals,
        };
    }

    /// Check equality
    pub fn eql(self: RichTokenBalance, other: RichTokenBalance) bool {
        return std.mem.eql(u8, &self.token, &other.token) and
            self.balance == other.balance and
            self.decimals == other.decimals;
    }

    /// Format with decimals
    pub fn format_balance(self: RichTokenBalance, allocator: std.mem.Allocator) ![]u8 {
        return toBaseUnit(allocator, self.balance, self.decimals);
    }

    /// Add to balance
    pub fn add_balance(self: *RichTokenBalance, amount: u256) !void {
        self.balance = try add(self.balance, amount);
    }

    /// Subtract from balance
    pub fn sub_balance(self: *RichTokenBalance, amount: u256) !void {
        self.balance = try sub(self.balance, amount);
    }

    /// Check if zero
    pub fn is_zero(self: RichTokenBalance) bool {
        return isZero(self.balance);
    }
};

/// ERC-721 Balance (NFTs)
pub const Erc721Balance = struct {
    token: [20]u8,
    token_ids: []u256,

    /// Create from components
    pub fn init(token: [20]u8, token_ids: []u256) Erc721Balance {
        return .{
            .token = token,
            .token_ids = token_ids,
        };
    }

    /// Check equality
    pub fn eql(self: Erc721Balance, other: Erc721Balance) bool {
        if (!std.mem.eql(u8, &self.token, &other.token)) return false;
        if (self.token_ids.len != other.token_ids.len) return false;
        for (self.token_ids, other.token_ids) |a, b| {
            if (a != b) return false;
        }
        return true;
    }

    /// Check if owns no tokens
    pub fn is_zero(self: Erc721Balance) bool {
        return self.token_ids.len == 0;
    }

    /// Get token count
    pub fn count(self: Erc721Balance) usize {
        return self.token_ids.len;
    }

    /// Check if owns specific token ID
    pub fn owns(self: Erc721Balance, token_id: u256) bool {
        for (self.token_ids) |id| {
            if (id == token_id) return true;
        }
        return false;
    }
};

/// Token ID with balance for ERC-1155
pub const TokenIdBalance = struct {
    id: u256,
    balance: u256,

    pub fn init(id: u256, balance: u256) TokenIdBalance {
        return .{ .id = id, .balance = balance };
    }

    pub fn eql(self: TokenIdBalance, other: TokenIdBalance) bool {
        return self.id == other.id and self.balance == other.balance;
    }
};

/// ERC-1155 Balance (Multi-token)
pub const Erc1155Balance = struct {
    token: [20]u8,
    balances: []TokenIdBalance,

    /// Create from components
    pub fn init(token: [20]u8, balances: []TokenIdBalance) Erc1155Balance {
        return .{
            .token = token,
            .balances = balances,
        };
    }

    /// Check equality
    pub fn eql(self: Erc1155Balance, other: Erc1155Balance) bool {
        if (!std.mem.eql(u8, &self.token, &other.token)) return false;
        if (self.balances.len != other.balances.len) return false;
        for (self.balances, other.balances) |a, b| {
            if (!a.eql(b)) return false;
        }
        return true;
    }

    /// Check if all balances are zero
    pub fn is_zero(self: Erc1155Balance) bool {
        for (self.balances) |b| {
            if (b.balance != 0) return false;
        }
        return true;
    }

    /// Get balance for specific token ID
    pub fn balanceOf(self: Erc1155Balance, token_id: u256) u256 {
        for (self.balances) |b| {
            if (b.id == token_id) return b.balance;
        }
        return 0;
    }

    /// Get total balance across all token IDs
    pub fn totalBalance(self: Erc1155Balance) u256 {
        var total: u256 = 0;
        for (self.balances) |b| {
            total +|= b.balance; // Saturating add
        }
        return total;
    }
};

// ERC-721 interface selectors
pub const ERC721_SELECTORS = struct {
    pub const balanceOf: [4]u8 = .{ 0x70, 0xa0, 0x82, 0x31 };
    pub const ownerOf: [4]u8 = .{ 0x63, 0x52, 0x21, 0x1e };
    pub const transferFrom: [4]u8 = .{ 0x23, 0xb8, 0x72, 0xdd };
    pub const safeTransferFrom: [4]u8 = .{ 0x42, 0x84, 0x2e, 0x0e };
    pub const approve: [4]u8 = .{ 0x09, 0x5e, 0xa7, 0xb3 };
    pub const setApprovalForAll: [4]u8 = .{ 0xa2, 0x2c, 0xb4, 0x65 };
    pub const getApproved: [4]u8 = .{ 0x08, 0x18, 0x12, 0xfc };
    pub const isApprovedForAll: [4]u8 = .{ 0xe9, 0x85, 0xe9, 0xc5 };
};

// ERC-1155 interface selectors
pub const ERC1155_SELECTORS = struct {
    pub const balanceOf: [4]u8 = .{ 0x00, 0xfd, 0xd5, 0x8e };
    pub const balanceOfBatch: [4]u8 = .{ 0x4e, 0x12, 0x73, 0xf4 };
    pub const safeTransferFrom: [4]u8 = .{ 0xf2, 0x42, 0x43, 0x2a };
    pub const safeBatchTransferFrom: [4]u8 = .{ 0x2e, 0xb2, 0xc2, 0xd6 };
    pub const setApprovalForAll: [4]u8 = .{ 0xa2, 0x2c, 0xb4, 0x65 };
    pub const isApprovedForAll: [4]u8 = .{ 0xe9, 0x85, 0xe9, 0xc5 };
};

// Tests

test "TokenBalance.from creates balance from u256" {
    const balance = from(1000000);
    try std.testing.expectEqual(@as(u256, 1000000), balance);
}

test "TokenBalance.from handles zero" {
    const balance = from(0);
    try std.testing.expectEqual(@as(u256, 0), balance);
}

test "TokenBalance.from handles max u256" {
    const balance = from(MAX);
    try std.testing.expectEqual(MAX, balance);
}

test "TokenBalance.fromNumber creates balance from u64" {
    const balance = fromNumber(12345);
    try std.testing.expectEqual(@as(u256, 12345), balance);
}

test "TokenBalance.fromHex parses hex with 0x prefix" {
    const balance = try fromHex("0xf4240"); // 1000000
    try std.testing.expectEqual(@as(u256, 1000000), balance);
}

test "TokenBalance.fromHex parses hex without prefix" {
    const balance = try fromHex("ff");
    try std.testing.expectEqual(@as(u256, 255), balance);
}

test "TokenBalance.fromHex returns error for invalid hex" {
    const result = fromHex("0xgg");
    try std.testing.expectError(error.InvalidHexCharacter, result);
}

test "TokenBalance.equals returns true for same value" {
    const a = from(1000000);
    const b = from(1000000);
    try std.testing.expect(equals(a, b));
}

test "TokenBalance.equals returns false for different values" {
    const a = from(1000000);
    const b = from(2000000);
    try std.testing.expect(!equals(a, b));
}

test "TokenBalance.compare returns correct ordering" {
    try std.testing.expectEqual(@as(i8, -1), compare(from(1), from(2)));
    try std.testing.expectEqual(@as(i8, 0), compare(from(42), from(42)));
    try std.testing.expectEqual(@as(i8, 1), compare(from(100), from(50)));
}

test "TokenBalance.toNumber converts to u64" {
    const balance = from(42);
    try std.testing.expectEqual(@as(u64, 42), toNumber(balance));
}

test "TokenBalance.toBigInt returns u256" {
    const balance = from(42);
    try std.testing.expectEqual(@as(u256, 42), toBigInt(balance));
}

test "TokenBalance.toHex converts to hex string" {
    const balance = from(1000000); // 0xf4240
    const hex = toHex(balance);
    try std.testing.expectEqualStrings("0x00000000000000000000000000000000000000000000000000000000000f4240", &hex);
}

test "TokenBalance.toBaseUnit formats with decimals" {
    const allocator = std.testing.allocator;

    // 1 USDC = 1000000 base units (6 decimals)
    const result = try toBaseUnit(allocator, from(1000000), 6);
    defer allocator.free(result);
    try std.testing.expectEqualStrings("1.0", result);
}

test "TokenBalance.toBaseUnit formats 1.5 ETH" {
    const allocator = std.testing.allocator;

    // 1.5 ETH = 1500000000000000000 wei (18 decimals)
    const result = try toBaseUnit(allocator, from(1500000000000000000), 18);
    defer allocator.free(result);
    try std.testing.expectEqualStrings("1.5", result);
}

test "TokenBalance.toBaseUnit formats zero" {
    const allocator = std.testing.allocator;

    const result = try toBaseUnit(allocator, from(0), 18);
    defer allocator.free(result);
    try std.testing.expectEqualStrings("0.0", result);
}

test "TokenBalance.toBaseUnit formats small fractional" {
    const allocator = std.testing.allocator;

    // 0.000001 ETH = 1000000000000 wei
    const result = try toBaseUnit(allocator, from(1000000000000), 18);
    defer allocator.free(result);
    try std.testing.expectEqualStrings("0.000001", result);
}

test "TokenBalance.fromBaseUnit parses integer" {
    const allocator = std.testing.allocator;

    const result = try fromBaseUnit(allocator, "1", 18);
    try std.testing.expectEqual(@as(u256, 1000000000000000000), result);
}

test "TokenBalance.fromBaseUnit parses decimal" {
    const allocator = std.testing.allocator;

    const result = try fromBaseUnit(allocator, "1.5", 18);
    try std.testing.expectEqual(@as(u256, 1500000000000000000), result);
}

test "TokenBalance.fromBaseUnit parses USDC" {
    const allocator = std.testing.allocator;

    const result = try fromBaseUnit(allocator, "1.0", 6);
    try std.testing.expectEqual(@as(u256, 1000000), result);
}

test "TokenBalance.format is alias for toBaseUnit" {
    const allocator = std.testing.allocator;

    const result = try format(allocator, from(1000000), 6);
    defer allocator.free(result);
    try std.testing.expectEqualStrings("1.0", result);
}

test "TokenBalance.DECIMALS has correct values" {
    try std.testing.expectEqual(@as(u8, 18), DECIMALS.ETH);
    try std.testing.expectEqual(@as(u8, 18), DECIMALS.WETH);
    try std.testing.expectEqual(@as(u8, 6), DECIMALS.USDC);
    try std.testing.expectEqual(@as(u8, 6), DECIMALS.USDT);
    try std.testing.expectEqual(@as(u8, 18), DECIMALS.DAI);
    try std.testing.expectEqual(@as(u8, 8), DECIMALS.WBTC);
}

test "TokenBalance constants are correct" {
    try std.testing.expectEqual(@as(u256, 0), MIN);
    try std.testing.expectEqual(std.math.maxInt(u256), MAX);
}

test "TokenBalance.ERC20_SELECTORS are correct" {
    // balanceOf(address) = 0x70a08231
    try std.testing.expectEqual([4]u8{ 0x70, 0xa0, 0x82, 0x31 }, ERC20_SELECTORS.balanceOf);
    // transfer(address,uint256) = 0xa9059cbb
    try std.testing.expectEqual([4]u8{ 0xa9, 0x05, 0x9c, 0xbb }, ERC20_SELECTORS.transfer);
}

test "TokenBalance complete workflow" {
    const allocator = std.testing.allocator;

    // Create balance from hex (10 USDC)
    const balance = try fromHex("0x989680"); // 10000000

    // Format for display
    const formatted = try format(allocator, balance, 6);
    defer allocator.free(formatted);
    try std.testing.expectEqualStrings("10.0", formatted);

    // Compare with another balance
    const other = from(5000000); // 5 USDC
    try std.testing.expect(!equals(balance, other));
    try std.testing.expectEqual(@as(i8, 1), compare(balance, other));
}
