//! TransactionUrl - ERC-681 Transaction URL Format
//!
//! ERC-681 defines a standard URL format for representing Ethereum transactions.
//! This enables QR codes, deep links, and wallet integrations.
//!
//! Format: `ethereum:<address>[@<chainId>][/<function>][?<params>]`
//!
//! ## Usage
//! ```zig
//! const TransactionUrl = @import("primitives").TransactionUrl;
//!
//! // Parse URL
//! const parsed = try TransactionUrl.parse("ethereum:0x1234...@1?value=1000000000000000000");
//!
//! // Format URL
//! const url = try TransactionUrl.format(allocator, .{
//!     .target = address,
//!     .chain_id = 1,
//!     .value = 1000000000000000000,
//! });
//! ```
//!
//! @see https://eips.ethereum.org/EIPS/eip-681

const std = @import("std");
const Address = @import("../Address/address.zig");
const Hex = @import("../Hex/Hex.zig");

/// Parsed transaction URL components
pub const ParsedTransactionUrl = struct {
    /// Target address
    target: Address.Address,

    /// Chain ID (optional)
    chain_id: ?u64 = null,

    /// Value in wei (optional)
    value: ?u256 = null,

    /// Gas limit (optional)
    gas: ?u64 = null,

    /// Gas price in wei (optional)
    gas_price: ?u256 = null,

    /// Calldata (optional, caller owns memory)
    data: ?[]const u8 = null,

    /// Function name (optional)
    function_name: ?[]const u8 = null,
};

// ============================================================================
// Constructors
// ============================================================================

/// Create a ParsedTransactionUrl from address
pub fn from(target: Address.Address) ParsedTransactionUrl {
    return .{ .target = target };
}

test "from - creates with address only" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const url = from(addr);
    try std.testing.expect(Address.equals(url.target, addr));
    try std.testing.expect(url.chain_id == null);
    try std.testing.expect(url.value == null);
}

/// Create a ParsedTransactionUrl from hex string address
pub fn fromHex(hex: []const u8) !ParsedTransactionUrl {
    const addr = try Address.fromHex(hex);
    return from(addr);
}

test "fromHex - creates from hex string" {
    const url = try fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const expected = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    try std.testing.expect(Address.equals(url.target, expected));
}

test "fromHex - invalid hex" {
    try std.testing.expectError(error.InvalidHexString, fromHex("0xinvalid"));
}

// ============================================================================
// Parser
// ============================================================================

/// Parse ERC-681 transaction URL
///
/// Format: ethereum:<address>[@<chainId>][/<function>][?<params>]
///
/// Query parameters:
/// - value: wei amount (decimal)
/// - gas: gas limit
/// - gasPrice: gas price in wei
/// - data: hex-encoded calldata (0x...)
pub fn parse(allocator: std.mem.Allocator, url: []const u8) !ParsedTransactionUrl {
    // Validate scheme
    if (!std.mem.startsWith(u8, url, "ethereum:")) {
        return error.InvalidTransactionUrlScheme;
    }

    // Remove scheme
    var remaining = url[9..];

    // Extract query string if present
    var query_string: ?[]const u8 = null;
    if (std.mem.indexOf(u8, remaining, "?")) |idx| {
        query_string = remaining[idx + 1 ..];
        remaining = remaining[0..idx];
    }

    // Extract function name if present
    var function_name: ?[]const u8 = null;
    if (std.mem.indexOf(u8, remaining, "/")) |idx| {
        function_name = remaining[idx + 1 ..];
        remaining = remaining[0..idx];
    }

    // Extract chain ID if present
    var chain_id: ?u64 = null;
    if (std.mem.indexOf(u8, remaining, "@")) |idx| {
        const chain_str = remaining[idx + 1 ..];
        chain_id = std.fmt.parseInt(u64, chain_str, 10) catch return error.InvalidChainId;
        remaining = remaining[0..idx];
    }

    // Parse address
    const target = Address.fromHex(remaining) catch return error.InvalidTransactionUrlAddress;

    // Build result
    var result = ParsedTransactionUrl{
        .target = target,
        .chain_id = chain_id,
        .function_name = function_name,
    };

    // Parse query parameters
    if (query_string) |qs| {
        try parseQueryString(allocator, qs, &result);
    }

    return result;
}

fn parseQueryString(allocator: std.mem.Allocator, query: []const u8, result: *ParsedTransactionUrl) !void {
    var iter = std.mem.splitSequence(u8, query, "&");
    while (iter.next()) |pair| {
        if (std.mem.indexOf(u8, pair, "=")) |eq_idx| {
            const key = pair[0..eq_idx];
            const value = pair[eq_idx + 1 ..];

            if (std.mem.eql(u8, key, "value")) {
                result.value = std.fmt.parseInt(u256, value, 10) catch return error.InvalidValue;
            } else if (std.mem.eql(u8, key, "gas")) {
                result.gas = std.fmt.parseInt(u64, value, 10) catch return error.InvalidGas;
            } else if (std.mem.eql(u8, key, "gasPrice")) {
                result.gas_price = std.fmt.parseInt(u256, value, 10) catch return error.InvalidGasPrice;
            } else if (std.mem.eql(u8, key, "data")) {
                // Parse hex data
                result.data = Hex.toBytes(value, allocator) catch return error.InvalidData;
            }
            // Ignore unknown parameters
        }
    }
}

test "parse - address only" {
    const url = try parse(std.testing.allocator, "ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const expected = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    try std.testing.expect(Address.equals(url.target, expected));
    try std.testing.expect(url.chain_id == null);
}

test "parse - with chain id" {
    const url = try parse(std.testing.allocator, "ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e@1");
    try std.testing.expectEqual(@as(?u64, 1), url.chain_id);
}

test "parse - with value" {
    const url = try parse(std.testing.allocator, "ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e?value=1000000000000000000");
    try std.testing.expectEqual(@as(?u256, 1000000000000000000), url.value);
}

test "parse - with function name" {
    const url = try parse(std.testing.allocator, "ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e/transfer");
    try std.testing.expectEqualStrings("transfer", url.function_name.?);
}

test "parse - full url" {
    const url = try parse(std.testing.allocator, "ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e@1/transfer?value=1000000000000000000&gas=21000");
    try std.testing.expectEqual(@as(?u64, 1), url.chain_id);
    try std.testing.expectEqual(@as(?u256, 1000000000000000000), url.value);
    try std.testing.expectEqual(@as(?u64, 21000), url.gas);
    try std.testing.expectEqualStrings("transfer", url.function_name.?);
}

test "parse - with data" {
    const url = try parse(std.testing.allocator, "ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e?data=0xdeadbeef");
    defer if (url.data) |d| std.testing.allocator.free(d);
    try std.testing.expect(url.data != null);
    try std.testing.expectEqualSlices(u8, &[_]u8{ 0xde, 0xad, 0xbe, 0xef }, url.data.?);
}

test "parse - invalid scheme" {
    try std.testing.expectError(error.InvalidTransactionUrlScheme, parse(std.testing.allocator, "http:0xa0cf798816d4b9b9866b5330eea46a18382f251e"));
}

test "parse - invalid address" {
    try std.testing.expectError(error.InvalidTransactionUrlAddress, parse(std.testing.allocator, "ethereum:invalid"));
}

test "parse - invalid chain id" {
    try std.testing.expectError(error.InvalidChainId, parse(std.testing.allocator, "ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e@notanumber"));
}

// ============================================================================
// Formatter
// ============================================================================

/// Format ParsedTransactionUrl as ERC-681 URL string
/// Caller owns returned memory
pub fn format(allocator: std.mem.Allocator, url: ParsedTransactionUrl) ![]u8 {
    var result = std.ArrayList(u8){};
    errdefer result.deinit(allocator);

    // Scheme and checksummed address
    try result.appendSlice(allocator, "ethereum:");
    const checksum = Address.toChecksummed(url.target);
    try result.appendSlice(allocator, &checksum);

    // Chain ID
    if (url.chain_id) |chain_id| {
        try result.append(allocator, '@');
        var buf: [20]u8 = undefined;
        const chain_str = std.fmt.bufPrint(&buf, "{d}", .{chain_id}) catch unreachable;
        try result.appendSlice(allocator, chain_str);
    }

    // Function name
    if (url.function_name) |func| {
        try result.append(allocator, '/');
        try result.appendSlice(allocator, func);
    }

    // Query parameters
    var has_params = false;

    if (url.value) |value| {
        try result.append(if (has_params) '&' else '?');
        has_params = true;
        try result.appendSlice(allocator, "value=");
        var buf: [78]u8 = undefined; // u256 max is 78 digits
        const val_str = std.fmt.bufPrint(&buf, "{d}", .{value}) catch unreachable;
        try result.appendSlice(allocator, val_str);
    }

    if (url.gas) |gas| {
        try result.append(if (has_params) '&' else '?');
        has_params = true;
        try result.appendSlice(allocator, "gas=");
        var buf: [20]u8 = undefined;
        const gas_str = std.fmt.bufPrint(&buf, "{d}", .{gas}) catch unreachable;
        try result.appendSlice(allocator, gas_str);
    }

    if (url.gas_price) |gas_price| {
        try result.append(if (has_params) '&' else '?');
        has_params = true;
        try result.appendSlice(allocator, "gasPrice=");
        var buf: [78]u8 = undefined;
        const gp_str = std.fmt.bufPrint(&buf, "{d}", .{gas_price}) catch unreachable;
        try result.appendSlice(allocator, gp_str);
    }

    if (url.data) |data| {
        try result.append(if (has_params) '&' else '?');
        // has_params = true; // Not needed as last param
        try result.appendSlice(allocator, "data=");
        const hex = try Hex.toHex(allocator, data);
        defer allocator.free(hex);
        try result.appendSlice(allocator, hex);
    }

    return result.toOwnedSlice(allocator);
}

test "format - address only" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const url = ParsedTransactionUrl{ .target = addr };
    const formatted = try format(std.testing.allocator, url);
    defer std.testing.allocator.free(formatted);
    try std.testing.expect(std.mem.startsWith(u8, formatted, "ethereum:0x"));
}

test "format - with chain id" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const url = ParsedTransactionUrl{ .target = addr, .chain_id = 1 };
    const formatted = try format(std.testing.allocator, url);
    defer std.testing.allocator.free(formatted);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "@1") != null);
}

test "format - with value" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const url = ParsedTransactionUrl{ .target = addr, .value = 1000000000000000000 };
    const formatted = try format(std.testing.allocator, url);
    defer std.testing.allocator.free(formatted);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "value=1000000000000000000") != null);
}

test "format - full url" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const url = ParsedTransactionUrl{
        .target = addr,
        .chain_id = 1,
        .function_name = "transfer",
        .value = 1000000000000000000,
        .gas = 21000,
    };
    const formatted = try format(std.testing.allocator, url);
    defer std.testing.allocator.free(formatted);

    try std.testing.expect(std.mem.indexOf(u8, formatted, "@1/") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "transfer") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "value=") != null);
    try std.testing.expect(std.mem.indexOf(u8, formatted, "gas=") != null);
}

test "format and parse roundtrip" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const original = ParsedTransactionUrl{
        .target = addr,
        .chain_id = 1,
        .value = 1000000000000000000,
        .gas = 21000,
    };

    const formatted = try format(std.testing.allocator, original);
    defer std.testing.allocator.free(formatted);

    const parsed = try parse(std.testing.allocator, formatted);

    try std.testing.expect(Address.equals(original.target, parsed.target));
    try std.testing.expectEqual(original.chain_id, parsed.chain_id);
    try std.testing.expectEqual(original.value, parsed.value);
    try std.testing.expectEqual(original.gas, parsed.gas);
}

// ============================================================================
// Equality
// ============================================================================

/// Check if two ParsedTransactionUrls are equal
pub fn equals(a: *const ParsedTransactionUrl, b: *const ParsedTransactionUrl) bool {
    if (!Address.equals(a.target, b.target)) return false;
    if (a.chain_id != b.chain_id) return false;
    if (a.value != b.value) return false;
    if (a.gas != b.gas) return false;
    if (a.gas_price != b.gas_price) return false;

    // Compare function names
    if (a.function_name != null and b.function_name != null) {
        if (!std.mem.eql(u8, a.function_name.?, b.function_name.?)) return false;
    } else if (a.function_name != null or b.function_name != null) {
        return false;
    }

    // Compare data
    if (a.data != null and b.data != null) {
        if (!std.mem.eql(u8, a.data.?, b.data.?)) return false;
    } else if (a.data != null or b.data != null) {
        return false;
    }

    return true;
}

test "equals - same urls" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const a = ParsedTransactionUrl{ .target = addr, .chain_id = 1, .value = 100 };
    const b = ParsedTransactionUrl{ .target = addr, .chain_id = 1, .value = 100 };
    try std.testing.expect(equals(&a, &b));
}

test "equals - different chain id" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const a = ParsedTransactionUrl{ .target = addr, .chain_id = 1 };
    const b = ParsedTransactionUrl{ .target = addr, .chain_id = 137 };
    try std.testing.expect(!equals(&a, &b));
}

test "equals - different value" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const a = ParsedTransactionUrl{ .target = addr, .value = 100 };
    const b = ParsedTransactionUrl{ .target = addr, .value = 200 };
    try std.testing.expect(!equals(&a, &b));
}

// ============================================================================
// Validation
// ============================================================================

/// Check if a string is a valid ERC-681 URL
pub fn isValid(url: []const u8) bool {
    if (!std.mem.startsWith(u8, url, "ethereum:")) return false;

    var remaining = url[9..];

    // Extract query string
    if (std.mem.indexOf(u8, remaining, "?")) |idx| {
        remaining = remaining[0..idx];
    }

    // Extract function name
    if (std.mem.indexOf(u8, remaining, "/")) |idx| {
        remaining = remaining[0..idx];
    }

    // Extract chain ID
    if (std.mem.indexOf(u8, remaining, "@")) |idx| {
        const chain_str = remaining[idx + 1 ..];
        _ = std.fmt.parseInt(u64, chain_str, 10) catch return false;
        remaining = remaining[0..idx];
    }

    // Validate address
    return Address.isValidAddress(remaining);
}

test "isValid - valid url" {
    try std.testing.expect(isValid("ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e"));
    try std.testing.expect(isValid("ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e@1"));
    try std.testing.expect(isValid("ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e@1?value=100"));
}

test "isValid - invalid url" {
    try std.testing.expect(!isValid("http:0xa0cf798816d4b9b9866b5330eea46a18382f251e"));
    try std.testing.expect(!isValid("ethereum:invalid"));
    try std.testing.expect(!isValid("ethereum:0xa0cf798816d4b9b9866b5330eea46a18382f251e@notanumber"));
}

// ============================================================================
// Conversion to string (alias)
// ============================================================================

/// Convert to string (alias for format)
pub fn toString(allocator: std.mem.Allocator, url: ParsedTransactionUrl) ![]u8 {
    return format(allocator, url);
}

test "toString - same as format" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const url = ParsedTransactionUrl{ .target = addr, .chain_id = 1 };

    const str = try toString(std.testing.allocator, url);
    defer std.testing.allocator.free(str);
    const fmt = try format(std.testing.allocator, url);
    defer std.testing.allocator.free(fmt);

    try std.testing.expectEqualStrings(fmt, str);
}

// ============================================================================
// Block Explorer URLs
// ============================================================================

/// Supported block explorers
pub const Explorer = enum {
    etherscan,
    blockscout,
    basescan,
    arbiscan,
    polygonscan,
    optimistic_etherscan,
    snowtrace,
    bscscan,
    ftmscan,
    gnosisscan,
    custom,

    /// Get explorer base URL for a chain ID
    pub fn getBaseUrl(explorer: Explorer, chain_id: u64) ?[]const u8 {
        return switch (explorer) {
            .etherscan => switch (chain_id) {
                1 => "https://etherscan.io",
                5 => "https://goerli.etherscan.io",
                11155111 => "https://sepolia.etherscan.io",
                17000 => "https://holesky.etherscan.io",
                else => null,
            },
            .blockscout => switch (chain_id) {
                1 => "https://eth.blockscout.com",
                100 => "https://gnosis.blockscout.com",
                else => null,
            },
            .basescan => switch (chain_id) {
                8453 => "https://basescan.org",
                84531 => "https://goerli.basescan.org",
                84532 => "https://sepolia.basescan.org",
                else => null,
            },
            .arbiscan => switch (chain_id) {
                42161 => "https://arbiscan.io",
                421613 => "https://goerli.arbiscan.io",
                421614 => "https://sepolia.arbiscan.io",
                else => null,
            },
            .polygonscan => switch (chain_id) {
                137 => "https://polygonscan.com",
                80001 => "https://mumbai.polygonscan.com",
                80002 => "https://amoy.polygonscan.com",
                else => null,
            },
            .optimistic_etherscan => switch (chain_id) {
                10 => "https://optimistic.etherscan.io",
                420 => "https://goerli-optimism.etherscan.io",
                11155420 => "https://sepolia-optimism.etherscan.io",
                else => null,
            },
            .snowtrace => switch (chain_id) {
                43114 => "https://snowtrace.io",
                43113 => "https://testnet.snowtrace.io",
                else => null,
            },
            .bscscan => switch (chain_id) {
                56 => "https://bscscan.com",
                97 => "https://testnet.bscscan.com",
                else => null,
            },
            .ftmscan => switch (chain_id) {
                250 => "https://ftmscan.com",
                4002 => "https://testnet.ftmscan.com",
                else => null,
            },
            .gnosisscan => switch (chain_id) {
                100 => "https://gnosisscan.io",
                else => null,
            },
            .custom => null,
        };
    }

    /// Get default explorer for a chain ID
    pub fn defaultForChain(chain_id: u64) Explorer {
        return switch (chain_id) {
            1, 5, 11155111, 17000 => .etherscan,
            8453, 84531, 84532 => .basescan,
            42161, 421613, 421614 => .arbiscan,
            137, 80001, 80002 => .polygonscan,
            10, 420, 11155420 => .optimistic_etherscan,
            43114, 43113 => .snowtrace,
            56, 97 => .bscscan,
            250, 4002 => .ftmscan,
            100 => .gnosisscan,
            else => .blockscout,
        };
    }
};

const Hash = @import("../Hash/Hash.zig");

/// Generate block explorer URL for a transaction
/// Caller owns returned memory
pub fn explorerUrl(allocator: std.mem.Allocator, tx_hash: Hash.Hash, chain_id: u64, explorer: ?Explorer) ![]u8 {
    const expl = explorer orelse Explorer.defaultForChain(chain_id);
    const base_url = expl.getBaseUrl(chain_id) orelse return error.UnsupportedChain;

    var result = std.ArrayList(u8){};
    errdefer result.deinit(allocator);

    try result.appendSlice(allocator, base_url);
    try result.appendSlice(allocator, "/tx/0x");

    // Append hex-encoded hash
    const hex_chars = "0123456789abcdef";
    for (tx_hash) |byte| {
        try result.append(allocator, hex_chars[byte >> 4]);
        try result.append(allocator, hex_chars[byte & 0x0f]);
    }

    return result.toOwnedSlice(allocator);
}

test "explorerUrl - etherscan mainnet" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0xab);
    const url = try explorerUrl(std.testing.allocator, hash, 1, .etherscan);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://etherscan.io/tx/0x"));
}

test "explorerUrl - default explorer" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0xab);
    const url = try explorerUrl(std.testing.allocator, hash, 1, null);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://etherscan.io/tx/0x"));
}

test "explorerUrl - sepolia" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0xcd);
    const url = try explorerUrl(std.testing.allocator, hash, 11155111, null);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://sepolia.etherscan.io/tx/0x"));
}

test "explorerUrl - polygon" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0xef);
    const url = try explorerUrl(std.testing.allocator, hash, 137, null);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://polygonscan.com/tx/0x"));
}

test "explorerUrl - arbitrum" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0x12);
    const url = try explorerUrl(std.testing.allocator, hash, 42161, null);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://arbiscan.io/tx/0x"));
}

test "explorerUrl - base" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0x34);
    const url = try explorerUrl(std.testing.allocator, hash, 8453, null);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://basescan.org/tx/0x"));
}

test "explorerUrl - optimism" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0x56);
    const url = try explorerUrl(std.testing.allocator, hash, 10, null);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://optimistic.etherscan.io/tx/0x"));
}

test "explorerUrl - unsupported chain with specific explorer" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0x78);
    try std.testing.expectError(error.UnsupportedChain, explorerUrl(std.testing.allocator, hash, 999999, .etherscan));
}

/// Generate block explorer URL for an address
/// Caller owns returned memory
pub fn explorerAddressUrl(allocator: std.mem.Allocator, address: Address.Address, chain_id: u64, explorer: ?Explorer) ![]u8 {
    const expl = explorer orelse Explorer.defaultForChain(chain_id);
    const base_url = expl.getBaseUrl(chain_id) orelse return error.UnsupportedChain;

    var result = std.ArrayList(u8){};
    errdefer result.deinit(allocator);

    try result.appendSlice(allocator, base_url);
    try result.appendSlice(allocator, "/address/");
    const checksum = Address.toChecksummed(address);
    try result.appendSlice(allocator, &checksum);

    return result.toOwnedSlice(allocator);
}

test "explorerAddressUrl - etherscan mainnet" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const url = try explorerAddressUrl(std.testing.allocator, addr, 1, .etherscan);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://etherscan.io/address/0x"));
}

test "explorerAddressUrl - polygon" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const url = try explorerAddressUrl(std.testing.allocator, addr, 137, null);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://polygonscan.com/address/0x"));
}

/// Generate block explorer URL for a block
/// Caller owns returned memory
pub fn explorerBlockUrl(allocator: std.mem.Allocator, block_number: u64, chain_id: u64, explorer: ?Explorer) ![]u8 {
    const expl = explorer orelse Explorer.defaultForChain(chain_id);
    const base_url = expl.getBaseUrl(chain_id) orelse return error.UnsupportedChain;

    var result = std.ArrayList(u8){};
    errdefer result.deinit(allocator);

    try result.appendSlice(allocator, base_url);
    try result.appendSlice(allocator, "/block/");
    var buf: [20]u8 = undefined;
    const block_str = std.fmt.bufPrint(&buf, "{d}", .{block_number}) catch unreachable;
    try result.appendSlice(allocator, block_str);

    return result.toOwnedSlice(allocator);
}

test "explorerBlockUrl - etherscan mainnet" {
    const url = try explorerBlockUrl(std.testing.allocator, 12345678, 1, .etherscan);
    defer std.testing.allocator.free(url);
    try std.testing.expectEqualStrings("https://etherscan.io/block/12345678", url);
}

test "explorerBlockUrl - polygon" {
    const url = try explorerBlockUrl(std.testing.allocator, 50000000, 137, null);
    defer std.testing.allocator.free(url);
    try std.testing.expectEqualStrings("https://polygonscan.com/block/50000000", url);
}

/// Generate block explorer URL for a token
/// Caller owns returned memory
pub fn explorerTokenUrl(allocator: std.mem.Allocator, token_address: Address.Address, chain_id: u64, explorer: ?Explorer) ![]u8 {
    const expl = explorer orelse Explorer.defaultForChain(chain_id);
    const base_url = expl.getBaseUrl(chain_id) orelse return error.UnsupportedChain;

    var result = std.ArrayList(u8){};
    errdefer result.deinit(allocator);

    try result.appendSlice(allocator, base_url);
    try result.appendSlice(allocator, "/token/");
    const checksum = Address.toChecksummed(token_address);
    try result.appendSlice(allocator, &checksum);

    return result.toOwnedSlice(allocator);
}

test "explorerTokenUrl - etherscan mainnet" {
    const addr = try Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const url = try explorerTokenUrl(std.testing.allocator, addr, 1, .etherscan);
    defer std.testing.allocator.free(url);
    try std.testing.expect(std.mem.startsWith(u8, url, "https://etherscan.io/token/0x"));
}

test "Explorer.defaultForChain - mainnet" {
    try std.testing.expectEqual(Explorer.etherscan, Explorer.defaultForChain(1));
}

test "Explorer.defaultForChain - polygon" {
    try std.testing.expectEqual(Explorer.polygonscan, Explorer.defaultForChain(137));
}

test "Explorer.defaultForChain - arbitrum" {
    try std.testing.expectEqual(Explorer.arbiscan, Explorer.defaultForChain(42161));
}

test "Explorer.defaultForChain - base" {
    try std.testing.expectEqual(Explorer.basescan, Explorer.defaultForChain(8453));
}

test "Explorer.defaultForChain - optimism" {
    try std.testing.expectEqual(Explorer.optimistic_etherscan, Explorer.defaultForChain(10));
}

test "Explorer.defaultForChain - unknown chain falls back to blockscout" {
    try std.testing.expectEqual(Explorer.blockscout, Explorer.defaultForChain(999999));
}
