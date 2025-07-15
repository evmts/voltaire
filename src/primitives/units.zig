const std = @import("std");
const testing = std.testing;
const Allocator = std.mem.Allocator;

// Ethereum unit constants
pub const WEI_PER_GWEI: u256 = 1_000_000_000;
pub const WEI_PER_ETHER: u256 = 1_000_000_000_000_000_000;
pub const GWEI_PER_ETHER: u256 = 1_000_000_000;

// Unit error types
pub const UnitError = error{
    InvalidFormat,
    InvalidCharacter,
    TooManyDecimals,
    OutOfMemory,
};

// Unit conversion functions
pub fn parseEther(_: Allocator, value: []const u8) !u256 {
    // Parse decimal string to wei
    var dotIndex: ?usize = null;
    for (value, 0..) |c, i| {
        if (c == '.') {
            if (dotIndex != null) return UnitError.InvalidFormat; // Multiple dots
            dotIndex = i;
        } else if (!std.ascii.isDigit(c)) {
            return UnitError.InvalidCharacter;
        }
    }
    
    if (dotIndex) |idx| {
        // Has decimal part
        const integerPart = value[0..idx];
        const decimalPart = value[idx + 1 ..];
        
        if (decimalPart.len > 18) return UnitError.TooManyDecimals;
        
        // Parse integer part
        var result: u256 = 0;
        if (integerPart.len > 0) {
            result = try std.fmt.parseInt(u256, integerPart, 10);
            result *= WEI_PER_ETHER;
        }
        
        // Parse decimal part
        if (decimalPart.len > 0) {
            var decimalWei = try std.fmt.parseInt(u256, decimalPart, 10);
            // Scale based on number of decimal places
            const scaleFactor = std.math.pow(u256, 10, 18 - decimalPart.len);
            decimalWei *= scaleFactor;
            result += decimalWei;
        }
        
        return result;
    } else {
        // No decimal part
        const result = try std.fmt.parseInt(u256, value, 10);
        return result * WEI_PER_ETHER;
    }
}

pub fn parseGwei(_: Allocator, value: []const u8) !u256 {
    // Similar to parseEther but with 9 decimal places
    var dotIndex: ?usize = null;
    for (value, 0..) |c, i| {
        if (c == '.') {
            if (dotIndex != null) return UnitError.InvalidFormat;
            dotIndex = i;
        } else if (!std.ascii.isDigit(c)) {
            return UnitError.InvalidCharacter;
        }
    }
    
    if (dotIndex) |idx| {
        const integerPart = value[0..idx];
        const decimalPart = value[idx + 1 ..];
        
        if (decimalPart.len > 9) return UnitError.TooManyDecimals;
        
        var result: u256 = 0;
        if (integerPart.len > 0) {
            result = try std.fmt.parseInt(u256, integerPart, 10);
            result *= WEI_PER_GWEI;
        }
        
        if (decimalPart.len > 0) {
            var decimalWei = try std.fmt.parseInt(u256, decimalPart, 10);
            const scaleFactor = std.math.pow(u256, 10, 9 - decimalPart.len);
            decimalWei *= scaleFactor;
            result += decimalWei;
        }
        
        return result;
    } else {
        const result = try std.fmt.parseInt(u256, value, 10);
        return result * WEI_PER_GWEI;
    }
}

pub fn formatEther(allocator: Allocator, wei: u256) ![]u8 {
    // Convert wei to ether string
    const ether = wei / WEI_PER_ETHER;
    const remainder = wei % WEI_PER_ETHER;
    
    if (remainder == 0) {
        return std.fmt.allocPrint(allocator, "{d}", .{ether});
    }
    
    // Format decimal part (up to 18 places)
    var decimalStr = try std.fmt.allocPrint(allocator, "{d:0>18}", .{remainder});
    defer allocator.free(decimalStr);
    
    // Trim trailing zeros
    var decimalLen = decimalStr.len;
    while (decimalLen > 0 and decimalStr[decimalLen - 1] == '0') {
        decimalLen -= 1;
    }
    
    return std.fmt.allocPrint(allocator, "{d}.{s}", .{ ether, decimalStr[0..decimalLen] });
}

pub fn formatGwei(allocator: Allocator, wei: u256) ![]u8 {
    const gwei = wei / WEI_PER_GWEI;
    const remainder = wei % WEI_PER_GWEI;
    
    if (remainder == 0) {
        return std.fmt.allocPrint(allocator, "{d}", .{gwei});
    }
    
    var decimalStr = try std.fmt.allocPrint(allocator, "{d:0>9}", .{remainder});
    defer allocator.free(decimalStr);
    
    var decimalLen = decimalStr.len;
    while (decimalLen > 0 and decimalStr[decimalLen - 1] == '0') {
        decimalLen -= 1;
    }
    
    return std.fmt.allocPrint(allocator, "{d}.{s}", .{ gwei, decimalStr[0..decimalLen] });
}

// Tests

test "parse ether integer values" {
    const allocator = testing.allocator;
    
    // Parse whole numbers
    try testing.expectEqual(WEI_PER_ETHER, try parseEther(allocator, "1"));
    try testing.expectEqual(10 * WEI_PER_ETHER, try parseEther(allocator, "10"));
    try testing.expectEqual(0, try parseEther(allocator, "0"));
    try testing.expectEqual(1000 * WEI_PER_ETHER, try parseEther(allocator, "1000"));
}

test "parse ether decimal values" {
    const allocator = testing.allocator;
    
    // Parse decimals
    try testing.expectEqual(WEI_PER_ETHER / 2, try parseEther(allocator, "0.5"));
    try testing.expectEqual(WEI_PER_ETHER + WEI_PER_ETHER / 2, try parseEther(allocator, "1.5"));
    try testing.expectEqual(100_000_000_000_000_000, try parseEther(allocator, "0.1"));
    try testing.expectEqual(1_000_000_000_000_000, try parseEther(allocator, "0.001"));
    try testing.expectEqual(1, try parseEther(allocator, "0.000000000000000001"));
    
    // Leading zeros
    try testing.expectEqual(WEI_PER_ETHER / 10, try parseEther(allocator, "0.1"));
    try testing.expectEqual(WEI_PER_ETHER / 10, try parseEther(allocator, "0.10"));
    try testing.expectEqual(WEI_PER_ETHER / 10, try parseEther(allocator, "0.100"));
}

test "parse ether edge cases" {
    const allocator = testing.allocator;
    
    // Maximum decimals (18)
    try testing.expectEqual(123_456_789_012_345_678, try parseEther(allocator, "0.123456789012345678"));
    
    // Too many decimals
    const result = parseEther(allocator, "0.1234567890123456789");
    try testing.expectError(UnitError.TooManyDecimals, result);
    
    // Invalid characters
    try testing.expectError(UnitError.InvalidCharacter, parseEther(allocator, "1.5a"));
    try testing.expectError(UnitError.InvalidCharacter, parseEther(allocator, "abc"));
    
    // Multiple dots
    try testing.expectError(UnitError.InvalidFormat, parseEther(allocator, "1.2.3"));
}

test "parse gwei" {
    const allocator = testing.allocator;
    
    // Whole gwei
    try testing.expectEqual(WEI_PER_GWEI, try parseGwei(allocator, "1"));
    try testing.expectEqual(20 * WEI_PER_GWEI, try parseGwei(allocator, "20"));
    
    // Decimal gwei
    try testing.expectEqual(WEI_PER_GWEI + 500_000_000, try parseGwei(allocator, "1.5"));
    try testing.expectEqual(100_000_000, try parseGwei(allocator, "0.1"));
    try testing.expectEqual(1, try parseGwei(allocator, "0.000000001"));
    
    // Maximum decimals (9)
    try testing.expectEqual(123_456_789, try parseGwei(allocator, "0.123456789"));
}

test "format ether" {
    const allocator = testing.allocator;
    
    // Whole ether
    const ether1 = try formatEther(allocator, WEI_PER_ETHER);
    defer allocator.free(ether1);
    try testing.expectEqualStrings("1", ether1);
    
    const ether10 = try formatEther(allocator, 10 * WEI_PER_ETHER);
    defer allocator.free(ether10);
    try testing.expectEqualStrings("10", ether10);
    
    // Decimal ether
    const halfEther = try formatEther(allocator, WEI_PER_ETHER / 2);
    defer allocator.free(halfEther);
    try testing.expectEqualStrings("0.5", halfEther);
    
    const decimalEther = try formatEther(allocator, WEI_PER_ETHER + 123_456_789_000_000_000);
    defer allocator.free(decimalEther);
    try testing.expectEqualStrings("1.123456789", decimalEther);
    
    // Small amounts
    const oneWei = try formatEther(allocator, 1);
    defer allocator.free(oneWei);
    try testing.expectEqualStrings("0.000000000000000001", oneWei);
    
    // Zero
    const zero = try formatEther(allocator, 0);
    defer allocator.free(zero);
    try testing.expectEqualStrings("0", zero);
}

test "format gwei" {
    const allocator = testing.allocator;
    
    // Whole gwei
    const gwei1 = try formatGwei(allocator, WEI_PER_GWEI);
    defer allocator.free(gwei1);
    try testing.expectEqualStrings("1", gwei1);
    
    const gwei20 = try formatGwei(allocator, 20 * WEI_PER_GWEI);
    defer allocator.free(gwei20);
    try testing.expectEqualStrings("20", gwei20);
    
    // Decimal gwei
    const decimalGwei = try formatGwei(allocator, WEI_PER_GWEI + 500_000_000);
    defer allocator.free(decimalGwei);
    try testing.expectEqualStrings("1.5", decimalGwei);
    
    // Small amounts
    const oneWeiGwei = try formatGwei(allocator, 1);
    defer allocator.free(oneWeiGwei);
    try testing.expectEqualStrings("0.000000001", oneWeiGwei);
}

test "roundtrip ether conversion" {
    const allocator = testing.allocator;
    
    const testValues = [_][]const u8{
        "0",
        "1",
        "0.1",
        "0.123456789",
        "123.456",
        "0.000000000000000001",
        "999999999.999999999999999999",
    };
    
    for (testValues) |value| {
        const wei = try parseEther(allocator, value);
        const formatted = try formatEther(allocator, wei);
        defer allocator.free(formatted);
        
        // Parse again and compare wei values
        const wei2 = try parseEther(allocator, formatted);
        try testing.expectEqual(wei, wei2);
    }
}

test "roundtrip gwei conversion" {
    const allocator = testing.allocator;
    
    const testValues = [_][]const u8{
        "0",
        "1",
        "20",
        "0.1",
        "0.123456789",
        "123.456",
        "0.000000001",
    };
    
    for (testValues) |value| {
        const wei = try parseGwei(allocator, value);
        const formatted = try formatGwei(allocator, wei);
        defer allocator.free(formatted);
        
        const wei2 = try parseGwei(allocator, formatted);
        try testing.expectEqual(wei, wei2);
    }
}

test "gas price conversions" {
    const allocator = testing.allocator;
    
    // Common gas prices
    const baseFee20Gwei = 20 * WEI_PER_GWEI;
    const priorityFee2Gwei = 2 * WEI_PER_GWEI;
    const maxFee = baseFee20Gwei + priorityFee2Gwei;
    
    const baseStr = try formatGwei(allocator, baseFee20Gwei);
    defer allocator.free(baseStr);
    try testing.expectEqualStrings("20", baseStr);
    
    const priorityStr = try formatGwei(allocator, priorityFee2Gwei);
    defer allocator.free(priorityStr);
    try testing.expectEqualStrings("2", priorityStr);
    
    const maxStr = try formatGwei(allocator, maxFee);
    defer allocator.free(maxStr);
    try testing.expectEqualStrings("22", maxStr);
}

test "transaction value formatting" {
    const allocator = testing.allocator;
    
    // 0.001 ETH transaction
    const smallTx = 1_000_000_000_000_000;
    const smallStr = try formatEther(allocator, smallTx);
    defer allocator.free(smallStr);
    try testing.expectEqualStrings("0.001", smallStr);
    
    // 1.23456789 ETH transaction
    const preciseTx = 1_234_567_890_000_000_000;
    const preciseStr = try formatEther(allocator, preciseTx);
    defer allocator.free(preciseStr);
    try testing.expectEqualStrings("1.23456789", preciseStr);
    
    // Large transaction
    const largeTx = 1000 * WEI_PER_ETHER;
    const largeStr = try formatEther(allocator, largeTx);
    defer allocator.free(largeStr);
    try testing.expectEqualStrings("1000", largeStr);
}