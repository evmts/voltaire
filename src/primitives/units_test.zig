const std = @import("std");
const testing = std.testing;

// Ethereum unit constants
pub const WEI_PER_GWEI: u256 = 1_000_000_000;
pub const WEI_PER_ETHER: u256 = 1_000_000_000_000_000_000;
pub const GWEI_PER_ETHER: u256 = 1_000_000_000;

// Unit conversion functions
pub fn parse_ether(allocator: std.mem.Allocator, value: []const u8) !u256 {
    // Parse decimal string to wei
    var dot_index: ?usize = null;
    for (value, 0..) |c, i| {
        if (c == '.') {
            if (dot_index != null) return error.InvalidFormat; // Multiple dots
            dot_index = i;
        } else if (!std.ascii.isDigit(c)) {
            return error.InvalidCharacter;
        }
    }
    
    if (dot_index) |idx| {
        // Has decimal part
        const integer_part = value[0..idx];
        const decimal_part = value[idx + 1 ..];
        
        if (decimal_part.len > 18) return error.TooManyDecimals;
        
        // Parse integer part
        var result: u256 = 0;
        if (integer_part.len > 0) {
            result = try std.fmt.parseInt(u256, integer_part, 10);
            result *= WEI_PER_ETHER;
        }
        
        // Parse decimal part
        if (decimal_part.len > 0) {
            var decimal_wei = try std.fmt.parseInt(u256, decimal_part, 10);
            // Scale based on number of decimal places
            const scale_factor = std.math.pow(u256, 10, 18 - decimal_part.len);
            decimal_wei *= scale_factor;
            result += decimal_wei;
        }
        
        return result;
    } else {
        // No decimal part
        const result = try std.fmt.parseInt(u256, value, 10);
        return result * WEI_PER_ETHER;
    }
}

pub fn parse_gwei(allocator: std.mem.Allocator, value: []const u8) !u256 {
    // Similar to parse_ether but with 9 decimal places
    var dot_index: ?usize = null;
    for (value, 0..) |c, i| {
        if (c == '.') {
            if (dot_index != null) return error.InvalidFormat;
            dot_index = i;
        } else if (!std.ascii.isDigit(c)) {
            return error.InvalidCharacter;
        }
    }
    
    if (dot_index) |idx| {
        const integer_part = value[0..idx];
        const decimal_part = value[idx + 1 ..];
        
        if (decimal_part.len > 9) return error.TooManyDecimals;
        
        var result: u256 = 0;
        if (integer_part.len > 0) {
            result = try std.fmt.parseInt(u256, integer_part, 10);
            result *= WEI_PER_GWEI;
        }
        
        if (decimal_part.len > 0) {
            var decimal_wei = try std.fmt.parseInt(u256, decimal_part, 10);
            const scale_factor = std.math.pow(u256, 10, 9 - decimal_part.len);
            decimal_wei *= scale_factor;
            result += decimal_wei;
        }
        
        return result;
    } else {
        const result = try std.fmt.parseInt(u256, value, 10);
        return result * WEI_PER_GWEI;
    }
}

pub fn format_ether(allocator: std.mem.Allocator, wei: u256) ![]u8 {
    // Convert wei to ether string
    const ether = wei / WEI_PER_ETHER;
    const remainder = wei % WEI_PER_ETHER;
    
    if (remainder == 0) {
        return std.fmt.allocPrint(allocator, "{d}", .{ether});
    }
    
    // Format decimal part (up to 18 places)
    var decimal_str = try std.fmt.allocPrint(allocator, "{d:0>18}", .{remainder});
    defer allocator.free(decimal_str);
    
    // Trim trailing zeros
    var decimal_len = decimal_str.len;
    while (decimal_len > 0 and decimal_str[decimal_len - 1] == '0') {
        decimal_len -= 1;
    }
    
    return std.fmt.allocPrint(allocator, "{d}.{s}", .{ ether, decimal_str[0..decimal_len] });
}

pub fn format_gwei(allocator: std.mem.Allocator, wei: u256) ![]u8 {
    const gwei = wei / WEI_PER_GWEI;
    const remainder = wei % WEI_PER_GWEI;
    
    if (remainder == 0) {
        return std.fmt.allocPrint(allocator, "{d}", .{gwei});
    }
    
    var decimal_str = try std.fmt.allocPrint(allocator, "{d:0>9}", .{remainder});
    defer allocator.free(decimal_str);
    
    var decimal_len = decimal_str.len;
    while (decimal_len > 0 and decimal_str[decimal_len - 1] == '0') {
        decimal_len -= 1;
    }
    
    return std.fmt.allocPrint(allocator, "{d}.{s}", .{ gwei, decimal_str[0..decimal_len] });
}

// Test parse ether
test "parse ether integer values" {
    const allocator = testing.allocator;
    
    // Parse whole numbers
    try testing.expectEqual(WEI_PER_ETHER, try parse_ether(allocator, "1"));
    try testing.expectEqual(10 * WEI_PER_ETHER, try parse_ether(allocator, "10"));
    try testing.expectEqual(0, try parse_ether(allocator, "0"));
    try testing.expectEqual(1000 * WEI_PER_ETHER, try parse_ether(allocator, "1000"));
}

test "parse ether decimal values" {
    const allocator = testing.allocator;
    
    // Parse decimals
    try testing.expectEqual(WEI_PER_ETHER / 2, try parse_ether(allocator, "0.5"));
    try testing.expectEqual(WEI_PER_ETHER + WEI_PER_ETHER / 2, try parse_ether(allocator, "1.5"));
    try testing.expectEqual(100_000_000_000_000_000, try parse_ether(allocator, "0.1"));
    try testing.expectEqual(1_000_000_000_000_000, try parse_ether(allocator, "0.001"));
    try testing.expectEqual(1, try parse_ether(allocator, "0.000000000000000001"));
    
    // Leading zeros
    try testing.expectEqual(WEI_PER_ETHER / 10, try parse_ether(allocator, "0.1"));
    try testing.expectEqual(WEI_PER_ETHER / 10, try parse_ether(allocator, "0.10"));
    try testing.expectEqual(WEI_PER_ETHER / 10, try parse_ether(allocator, "0.100"));
}

test "parse ether edge cases" {
    const allocator = testing.allocator;
    
    // Maximum decimals (18)
    try testing.expectEqual(123_456_789_012_345_678, try parse_ether(allocator, "0.123456789012345678"));
    
    // Too many decimals
    const result = parse_ether(allocator, "0.1234567890123456789");
    try testing.expectError(error.TooManyDecimals, result);
    
    // Invalid characters
    try testing.expectError(error.InvalidCharacter, parse_ether(allocator, "1.5a"));
    try testing.expectError(error.InvalidCharacter, parse_ether(allocator, "abc"));
    
    // Multiple dots
    try testing.expectError(error.InvalidFormat, parse_ether(allocator, "1.2.3"));
}

test "parse gwei" {
    const allocator = testing.allocator;
    
    // Whole gwei
    try testing.expectEqual(WEI_PER_GWEI, try parse_gwei(allocator, "1"));
    try testing.expectEqual(20 * WEI_PER_GWEI, try parse_gwei(allocator, "20"));
    
    // Decimal gwei
    try testing.expectEqual(WEI_PER_GWEI + 500_000_000, try parse_gwei(allocator, "1.5"));
    try testing.expectEqual(100_000_000, try parse_gwei(allocator, "0.1"));
    try testing.expectEqual(1, try parse_gwei(allocator, "0.000000001"));
    
    // Maximum decimals (9)
    try testing.expectEqual(123_456_789, try parse_gwei(allocator, "0.123456789"));
}

test "format ether" {
    const allocator = testing.allocator;
    
    // Whole ether
    const ether1 = try format_ether(allocator, WEI_PER_ETHER);
    defer allocator.free(ether1);
    try testing.expectEqualStrings("1", ether1);
    
    const ether10 = try format_ether(allocator, 10 * WEI_PER_ETHER);
    defer allocator.free(ether10);
    try testing.expectEqualStrings("10", ether10);
    
    // Decimal ether
    const half_ether = try format_ether(allocator, WEI_PER_ETHER / 2);
    defer allocator.free(half_ether);
    try testing.expectEqualStrings("0.5", half_ether);
    
    const decimal_ether = try format_ether(allocator, WEI_PER_ETHER + 123_456_789_000_000_000);
    defer allocator.free(decimal_ether);
    try testing.expectEqualStrings("1.123456789", decimal_ether);
    
    // Small amounts
    const one_wei = try format_ether(allocator, 1);
    defer allocator.free(one_wei);
    try testing.expectEqualStrings("0.000000000000000001", one_wei);
    
    // Zero
    const zero = try format_ether(allocator, 0);
    defer allocator.free(zero);
    try testing.expectEqualStrings("0", zero);
}

test "format gwei" {
    const allocator = testing.allocator;
    
    // Whole gwei
    const gwei1 = try format_gwei(allocator, WEI_PER_GWEI);
    defer allocator.free(gwei1);
    try testing.expectEqualStrings("1", gwei1);
    
    const gwei20 = try format_gwei(allocator, 20 * WEI_PER_GWEI);
    defer allocator.free(gwei20);
    try testing.expectEqualStrings("20", gwei20);
    
    // Decimal gwei
    const decimal_gwei = try format_gwei(allocator, WEI_PER_GWEI + 500_000_000);
    defer allocator.free(decimal_gwei);
    try testing.expectEqualStrings("1.5", decimal_gwei);
    
    // Small amounts
    const one_wei_gwei = try format_gwei(allocator, 1);
    defer allocator.free(one_wei_gwei);
    try testing.expectEqualStrings("0.000000001", one_wei_gwei);
}

// Test roundtrip conversions
test "roundtrip ether conversion" {
    const allocator = testing.allocator;
    
    const test_values = [_][]const u8{
        "0",
        "1",
        "0.1",
        "0.123456789",
        "123.456",
        "0.000000000000000001",
        "999999999.999999999999999999",
    };
    
    for (test_values) |value| {
        const wei = try parse_ether(allocator, value);
        const formatted = try format_ether(allocator, wei);
        defer allocator.free(formatted);
        
        // Parse again and compare wei values
        const wei2 = try parse_ether(allocator, formatted);
        try testing.expectEqual(wei, wei2);
    }
}

test "roundtrip gwei conversion" {
    const allocator = testing.allocator;
    
    const test_values = [_][]const u8{
        "0",
        "1",
        "20",
        "0.1",
        "0.123456789",
        "123.456",
        "0.000000001",
    };
    
    for (test_values) |value| {
        const wei = try parse_gwei(allocator, value);
        const formatted = try format_gwei(allocator, wei);
        defer allocator.free(formatted);
        
        const wei2 = try parse_gwei(allocator, formatted);
        try testing.expectEqual(wei, wei2);
    }
}

// Test common gas price conversions
test "gas price conversions" {
    const allocator = testing.allocator;
    
    // Common gas prices
    const base_fee_20_gwei = 20 * WEI_PER_GWEI;
    const priority_fee_2_gwei = 2 * WEI_PER_GWEI;
    const max_fee = base_fee_20_gwei + priority_fee_2_gwei;
    
    const base_str = try format_gwei(allocator, base_fee_20_gwei);
    defer allocator.free(base_str);
    try testing.expectEqualStrings("20", base_str);
    
    const priority_str = try format_gwei(allocator, priority_fee_2_gwei);
    defer allocator.free(priority_str);
    try testing.expectEqualStrings("2", priority_str);
    
    const max_str = try format_gwei(allocator, max_fee);
    defer allocator.free(max_str);
    try testing.expectEqualStrings("22", max_str);
}

// Test transaction value formatting
test "transaction value formatting" {
    const allocator = testing.allocator;
    
    // 0.001 ETH transaction
    const small_tx = 1_000_000_000_000_000;
    const small_str = try format_ether(allocator, small_tx);
    defer allocator.free(small_str);
    try testing.expectEqualStrings("0.001", small_str);
    
    // 1.23456789 ETH transaction
    const precise_tx = 1_234_567_890_000_000_000;
    const precise_str = try format_ether(allocator, precise_tx);
    defer allocator.free(precise_str);
    try testing.expectEqualStrings("1.23456789", precise_str);
    
    // Large transaction
    const large_tx = 1000 * WEI_PER_ETHER;
    const large_str = try format_ether(allocator, large_tx);
    defer allocator.free(large_str);
    try testing.expectEqualStrings("1000", large_str);
}