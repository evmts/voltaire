// Numeric utilities for Ethereum
// Provides unit conversions, number formatting, and parsing functions

const std = @import("std");
const testing = std.testing;

// Error types
pub const NumericError = error{
    InvalidInput,
    InvalidUnit,
    ValueTooLarge,
    ValueTooSmall,
    InvalidFormat,
    DivisionByZero,
    OutOfMemory,
};

// Ethereum unit constants (all in wei)
pub const WEI: u256 = 1;
pub const KWEI: u256 = 1_000;
pub const MWEI: u256 = 1_000_000;
pub const GWEI: u256 = 1_000_000_000;
pub const SZABO: u256 = 1_000_000_000_000;
pub const FINNEY: u256 = 1_000_000_000_000_000;
pub const ETHER: u256 = 1_000_000_000_000_000_000;

// Common unit names
pub const Unit = enum {
    wei,
    kwei,
    mwei,
    gwei,
    szabo,
    finney,
    ether,

    pub fn to_multiplier(self: Unit) u256 {
        return switch (self) {
            .wei => WEI,
            .kwei => KWEI,
            .mwei => MWEI,
            .gwei => GWEI,
            .szabo => SZABO,
            .finney => FINNEY,
            .ether => ETHER,
        };
    }

    pub fn from_string(str: []const u8) ?Unit {
        if (std.mem.eql(u8, str, "wei")) return .wei;
        if (std.mem.eql(u8, str, "kwei")) return .kwei;
        if (std.mem.eql(u8, str, "mwei")) return .mwei;
        if (std.mem.eql(u8, str, "gwei")) return .gwei;
        if (std.mem.eql(u8, str, "szabo")) return .szabo;
        if (std.mem.eql(u8, str, "finney")) return .finney;
        if (std.mem.eql(u8, str, "ether")) return .ether;
        return null;
    }

    pub fn to_string(self: Unit) []const u8 {
        return switch (self) {
            .wei => "wei",
            .kwei => "kwei",
            .mwei => "mwei",
            .gwei => "gwei",
            .szabo => "szabo",
            .finney => "finney",
            .ether => "ether",
        };
    }
};

// Parse ether string to wei
pub fn parse_ether(ether_str: []const u8) !u256 {
    return parse_units(ether_str, .ether);
}

// Parse gwei string to wei
pub fn parse_gwei(gwei_str: []const u8) !u256 {
    return parse_units(gwei_str, .gwei);
}

// Parse units string to wei
pub fn parse_units(value_str: []const u8, unit: Unit) !u256 {
    const trimmed = std.mem.trim(u8, value_str, " \t\n\r");
    if (trimmed.len == 0) return NumericError.InvalidInput;

    // Handle decimal point
    if (std.mem.indexOf(u8, trimmed, ".")) |dot_pos| {
        const integer_part = trimmed[0..dot_pos];
        const decimal_part = trimmed[dot_pos + 1 ..];

        // Parse integer part
        var integer_value: u256 = 0;
        if (integer_part.len > 0) {
            integer_value = try parse_integer(integer_part);
        }

        // Parse decimal part
        var decimal_value: u256 = 0;
        if (decimal_part.len > 0) {
            decimal_value = try parse_decimal(decimal_part, unit);
        }

        const multiplier = unit.to_multiplier();
        const integer_wei = integer_value * multiplier;

        return integer_wei + decimal_value;
    } else {
        // No decimal point, just parse as integer
        const integer_value = try parse_integer(trimmed);
        const multiplier = unit.to_multiplier();
        return integer_value * multiplier;
    }
}

// Format wei to ether string
pub fn format_ether(allocator: std.mem.Allocator, wei_value: u256) ![]u8 {
    return format_units(allocator, wei_value, .ether, null);
}

// Format wei to gwei string
pub fn format_gwei(allocator: std.mem.Allocator, wei_value: u256) ![]u8 {
    return format_units(allocator, wei_value, .gwei, null);
}

// Format wei to specified units
pub fn format_units(allocator: std.mem.Allocator, wei_value: u256, unit: Unit, decimals: ?u8) ![]u8 {
    const multiplier = unit.to_multiplier();
    const unit_name = unit.to_string();

    // Calculate integer and fractional parts
    const integer_part = wei_value / multiplier;
    const remainder = wei_value % multiplier;

    if (remainder == 0) {
        // No fractional part
        return std.fmt.allocPrint(allocator, "{} {s}", .{ integer_part, unit_name });
    }

    // Calculate decimal places needed
    const max_decimals = decimals orelse get_default_decimals(unit);
    const decimal_str = try format_decimal_part(allocator, remainder, multiplier, max_decimals);
    defer allocator.free(decimal_str);

    if (std.mem.eql(u8, decimal_str, "0")) {
        return std.fmt.allocPrint(allocator, "{} {s}", .{ integer_part, unit_name });
    }

    return std.fmt.allocPrint(allocator, "{}.{s} {s}", .{ integer_part, decimal_str, unit_name });
}

// Format wei value without unit suffix
pub fn format_wei(allocator: std.mem.Allocator, wei_value: u256) ![]u8 {
    return std.fmt.allocPrint(allocator, "{}", .{wei_value});
}

// Convert between units
pub fn convert_units(value: u256, from_unit: Unit, to_unit: Unit) !u256 {
    const from_multiplier = from_unit.to_multiplier();
    const to_multiplier = to_unit.to_multiplier();

    // Convert to wei first
    const wei_value = value * from_multiplier;

    // Then convert to target unit
    return wei_value / to_multiplier;
}

// Utility functions for gas calculations
pub fn calculate_gas_cost(gas_used: u64, gas_price_gwei: u256) u256 {
    const gas_price_wei = gas_price_gwei * GWEI;
    return @as(u256, gas_used) * gas_price_wei;
}

pub fn format_gas_cost(allocator: std.mem.Allocator, gas_used: u64, gas_price_gwei: u256) ![]u8 {
    const cost_wei = calculate_gas_cost(gas_used, gas_price_gwei);
    return format_ether(allocator, cost_wei);
}

// Helper functions
fn parse_integer(str: []const u8) !u256 {
    if (str.len == 0) return 0;

    var result: u256 = 0;
    for (str) |c| {
        if (c < '0' or c > '9') return NumericError.InvalidInput;
        const digit = c - '0';
        result = result * 10 + digit;
    }
    return result;
}

fn parse_decimal(decimal_str: []const u8, unit: Unit) !u256 {
    if (decimal_str.len == 0) return 0;

    const multiplier = unit.to_multiplier();
    var result: u256 = 0;
    var place_value = multiplier / 10;

    for (decimal_str) |c| {
        if (c < '0' or c > '9') return NumericError.InvalidInput;
        if (place_value == 0) break; // No more precision available

        const digit = c - '0';
        result += @as(u256, digit) * place_value;
        place_value /= 10;
    }

    return result;
}

fn format_decimal_part(allocator: std.mem.Allocator, remainder: u256, multiplier: u256, max_decimals: u8) ![]u8 {
    var decimal_chars = std.ArrayList(u8).init(allocator);
    defer decimal_chars.deinit();

    var current_remainder = remainder;
    var current_multiplier = multiplier;
    var decimals_added: u8 = 0;

    while (current_remainder > 0 and decimals_added < max_decimals) {
        current_multiplier /= 10;
        if (current_multiplier == 0) break;

        const digit = current_remainder / current_multiplier;
        try decimal_chars.append(@as(u8, @intCast(digit)) + '0');
        current_remainder %= current_multiplier;
        decimals_added += 1;
    }

    // Remove trailing zeros
    while (decimal_chars.items.len > 0 and decimal_chars.items[decimal_chars.items.len - 1] == '0') {
        _ = decimal_chars.pop();
    }

    if (decimal_chars.items.len == 0) {
        return allocator.dupe(u8, "0");
    }

    return decimal_chars.toOwnedSlice();
}

fn get_default_decimals(unit: Unit) u8 {
    return switch (unit) {
        .wei => 0,
        .kwei => 3,
        .mwei => 6,
        .gwei => 9,
        .szabo => 12,
        .finney => 15,
        .ether => 18,
    };
}

// Math utilities
pub fn min(a: u256, b: u256) u256 {
    return if (a < b) a else b;
}

pub fn max(a: u256, b: u256) u256 {
    return if (a > b) a else b;
}

pub fn safe_add(a: u256, b: u256) ?u256 {
    const result = a +% b;
    return if (result < a) null else result;
}

pub fn safe_sub(a: u256, b: u256) ?u256 {
    return if (a >= b) a - b else null;
}

pub fn safe_mul(a: u256, b: u256) ?u256 {
    if (a == 0 or b == 0) return 0;
    const result = a *% b;
    return if (result / a != b) null else result;
}

pub fn safe_div(a: u256, b: u256) ?u256 {
    return if (b == 0) null else a / b;
}

// Percentage calculations
pub fn calculate_percentage(value: u256, percentage: u256) u256 {
    return (value * percentage) / 100;
}

pub fn calculate_percentage_of(part: u256, whole: u256) u256 {
    if (whole == 0) return 0;
    return (part * 100) / whole;
}

// Tests
test "unit conversions" {
    try testing.expectEqual(@as(u256, 1), WEI);
    try testing.expectEqual(@as(u256, 1_000_000_000), GWEI);
    try testing.expectEqual(@as(u256, 1_000_000_000_000_000_000), ETHER);
}

test "parse ether" {
    const result1 = try parse_ether("1");
    try testing.expectEqual(ETHER, result1);

    const result2 = try parse_ether("1.5");
    try testing.expectEqual(ETHER + ETHER / 2, result2);

    const result3 = try parse_ether("0.001");
    try testing.expectEqual(FINNEY, result3);
}

test "parse gwei" {
    const result1 = try parse_gwei("1");
    try testing.expectEqual(GWEI, result1);

    const result2 = try parse_gwei("20");
    try testing.expectEqual(20 * GWEI, result2);

    const result3 = try parse_gwei("0.5");
    try testing.expectEqual(GWEI / 2, result3);
}

test "format ether" {
    const allocator = testing.allocator;

    const result1 = try format_ether(allocator, ETHER);
    defer allocator.free(result1);
    try testing.expectEqualStrings("1 ether", result1);

    const result2 = try format_ether(allocator, ETHER + ETHER / 2);
    defer allocator.free(result2);
    try testing.expectEqualStrings("1.5 ether", result2);

    const result3 = try format_ether(allocator, FINNEY);
    defer allocator.free(result3);
    try testing.expectEqualStrings("0.001 ether", result3);
}

test "format gwei" {
    const allocator = testing.allocator;

    const result1 = try format_gwei(allocator, GWEI);
    defer allocator.free(result1);
    try testing.expectEqualStrings("1 gwei", result1);

    const result2 = try format_gwei(allocator, 20 * GWEI);
    defer allocator.free(result2);
    try testing.expectEqualStrings("20 gwei", result2);
}

test "unit conversion" {
    const result1 = try convert_units(1, .ether, .gwei);
    try testing.expectEqual(@as(u256, 1_000_000_000), result1);

    const result2 = try convert_units(1000, .gwei, .ether);
    try testing.expectEqual(@as(u256, 0), result2); // Less than 1 ether

    const result3 = try convert_units(1_000_000_000, .gwei, .ether);
    try testing.expectEqual(@as(u256, 1), result3);
}

test "gas cost calculations" {
    const gas_used: u64 = 21000;
    const gas_price_gwei: u256 = 20;

    const cost = calculate_gas_cost(gas_used, gas_price_gwei);
    try testing.expectEqual(@as(u256, 21000) * 20 * GWEI, cost);
}

test "safe math operations" {
    try testing.expectEqual(@as(?u256, 5), safe_add(2, 3));
    try testing.expectEqual(@as(?u256, null), safe_add(std.math.maxInt(u256), 1));

    try testing.expectEqual(@as(?u256, 2), safe_sub(5, 3));
    try testing.expectEqual(@as(?u256, null), safe_sub(3, 5));

    try testing.expectEqual(@as(?u256, 6), safe_mul(2, 3));
    try testing.expectEqual(@as(?u256, 0), safe_mul(0, 5));

    try testing.expectEqual(@as(?u256, 2), safe_div(6, 3));
    try testing.expectEqual(@as(?u256, null), safe_div(5, 0));
}

test "percentage calculations" {
    try testing.expectEqual(@as(u256, 50), calculate_percentage(100, 50));
    try testing.expectEqual(@as(u256, 25), calculate_percentage_of(25, 100));
}
