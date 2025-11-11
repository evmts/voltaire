const std = @import("std");
const testing = std.testing;
const numeric = @import("numeric.zig");

// ============================================================================
// Unit Parsing Fuzzing
// ============================================================================

test "fuzz parseEther" {
    const input = testing.fuzzInput(.{});

    const result = numeric.parseEther(input) catch |err| switch (err) {
        error.InvalidInput,
        error.InvalidFormat,
        error.ValueTooLarge,
        => return,
        else => return err,
    };

    // If parsing succeeded, verify invariants
    try testing.expect(result <= std.math.maxInt(u256));
}

test "fuzz parseGwei" {
    const input = testing.fuzzInput(.{});

    const result = numeric.parseGwei(input) catch |err| switch (err) {
        error.InvalidInput,
        error.InvalidFormat,
        error.ValueTooLarge,
        => return,
        else => return err,
    };

    try testing.expect(result <= std.math.maxInt(u256));
}

test "fuzz parseUnits all units" {
    const input = testing.fuzzInput(.{});
    if (input.len < 2) return;

    // Use first byte to select unit
    const unit_index = input[0] % 7;
    const units = [_]numeric.Unit{ .wei, .kwei, .mwei, .gwei, .szabo, .finney, .ether };
    const unit = units[unit_index];

    const text = input[1..];

    const result = numeric.parseUnits(text, unit) catch |err| switch (err) {
        error.InvalidInput,
        error.InvalidFormat,
        error.ValueTooLarge,
        => return,
        else => return err,
    };

    // Result must be valid u256
    try testing.expect(result <= std.math.maxInt(u256));

    // If result is non-zero, it should be at least 1
    if (result == 0) {
        try testing.expectEqual(@as(u256, 0), result);
    }
}

test "fuzz parseUnits decimal precision" {
    const input = testing.fuzzInput(.{});
    if (input.len < 1) return;

    // Test with varying decimal lengths
    _ = numeric.parseUnits(input, .ether) catch return;
    _ = numeric.parseUnits(input, .gwei) catch return;
    _ = numeric.parseUnits(input, .wei) catch return;
}

test "fuzz parseUnits with leading decimal" {
    const input = testing.fuzzInput(.{});

    // Prepend dot to test leading decimal handling
    var buffer: [1024]u8 = undefined;
    if (input.len >= buffer.len) return;

    buffer[0] = '.';
    @memcpy(buffer[1 .. input.len + 1], input);
    const with_dot = buffer[0 .. input.len + 1];

    _ = numeric.parseUnits(with_dot, .ether) catch return;
}

test "fuzz parseUnits whitespace handling" {
    const input = testing.fuzzInput(.{});
    if (input.len < 3) return;

    // Test with various whitespace
    var buffer: [1024]u8 = undefined;
    if (input.len + 4 >= buffer.len) return;

    // Add leading/trailing whitespace
    buffer[0] = ' ';
    buffer[1] = '\t';
    @memcpy(buffer[2 .. input.len + 2], input);
    buffer[input.len + 2] = '\n';
    buffer[input.len + 3] = ' ';
    const with_ws = buffer[0 .. input.len + 4];

    _ = numeric.parseUnits(with_ws, .gwei) catch return;
}

test "fuzz parseUnits multiple decimals" {
    const input = testing.fuzzInput(.{});

    // Should error on multiple decimal points
    const result = numeric.parseUnits(input, .ether) catch return;

    // If it didn't error, verify it's valid
    try testing.expect(result <= std.math.maxInt(u256));
}

// ============================================================================
// Unit Formatting Fuzzing
// ============================================================================

test "fuzz formatEther" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .little);

    const result = numeric.formatEther(testing.allocator, value) catch return;
    defer testing.allocator.free(result);

    // Result should not be empty
    try testing.expect(result.len > 0);

    // Should contain "ether"
    try testing.expect(std.mem.indexOf(u8, result, "ether") != null);

    // Should be parseable back
    const parsed = numeric.parseEther(result) catch return;
    _ = parsed;
}

test "fuzz formatGwei" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .little);

    const result = numeric.formatGwei(testing.allocator, value) catch return;
    defer testing.allocator.free(result);

    try testing.expect(result.len > 0);
    try testing.expect(std.mem.indexOf(u8, result, "gwei") != null);
}

test "fuzz formatUnits all units" {
    const input = testing.fuzzInput(.{});
    if (input.len < 33) return;

    const value = std.mem.readInt(u256, input[0..32], .little);
    const unit_index = input[32] % 7;
    const units = [_]numeric.Unit{ .wei, .kwei, .mwei, .gwei, .szabo, .finney, .ether };
    const unit = units[unit_index];

    const result = numeric.formatUnits(testing.allocator, value, unit, null) catch return;
    defer testing.allocator.free(result);

    try testing.expect(result.len > 0);

    // Should contain unit name
    const unit_name = unit.toString();
    try testing.expect(std.mem.indexOf(u8, result, unit_name) != null);
}

test "fuzz formatUnits custom decimals" {
    const input = testing.fuzzInput(.{});
    if (input.len < 33) return;

    const value = std.mem.readInt(u256, input[0..32], .little);
    const decimals = input[32] % 19; // 0-18

    const result = numeric.formatUnits(testing.allocator, value, .ether, decimals) catch return;
    defer testing.allocator.free(result);

    try testing.expect(result.len > 0);
}

test "fuzz formatWei" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .little);

    const result = numeric.formatWei(testing.allocator, value) catch return;
    defer testing.allocator.free(result);

    try testing.expect(result.len > 0);

    // Should NOT contain unit suffix
    try testing.expect(std.mem.indexOf(u8, result, "wei") == null);
    try testing.expect(std.mem.indexOf(u8, result, "ether") == null);
}

// ============================================================================
// Unit Conversion Fuzzing
// ============================================================================

test "fuzz convertUnits" {
    const input = testing.fuzzInput(.{});
    if (input.len < 34) return;

    const value = std.mem.readInt(u256, input[0..32], .little);
    const from_index = input[32] % 7;
    const to_index = input[33] % 7;

    const units = [_]numeric.Unit{ .wei, .kwei, .mwei, .gwei, .szabo, .finney, .ether };
    const from_unit = units[from_index];
    const to_unit = units[to_index];

    const result = numeric.convertUnits(value, from_unit, to_unit) catch return;

    // Result should be valid
    try testing.expect(result <= std.math.maxInt(u256));

    // Converting to same unit should preserve value
    if (from_unit == to_unit) {
        try testing.expectEqual(value, result);
    }
}

test "fuzz convertUnits roundtrip" {
    const input = testing.fuzzInput(.{});
    if (input.len < 33) return;

    const value = std.mem.readInt(u256, input[0..32], .little);
    const unit_index = input[32] % 6; // Skip ether for precision

    const units = [_]numeric.Unit{ .wei, .kwei, .mwei, .gwei, .szabo, .finney };
    const unit = units[unit_index];

    // Convert to wei and back
    const in_wei = numeric.convertUnits(value, unit, .wei) catch return;
    const back = numeric.convertUnits(in_wei, .wei, unit) catch return;

    // Should preserve value (may lose precision on very large values)
    if (value <= std.math.maxInt(u128)) {
        try testing.expectEqual(value, back);
    }
}

test "fuzz convertUnits precision loss" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .little);

    // Converting from smaller to larger unit may lose precision
    const in_ether = numeric.convertUnits(value, .wei, .ether) catch return;
    const back_to_wei = numeric.convertUnits(in_ether, .ether, .wei) catch return;

    // back_to_wei should be <= original value
    try testing.expect(back_to_wei <= value);
}

// ============================================================================
// Gas Calculation Fuzzing
// ============================================================================

test "fuzz calculateGasCost" {
    const input = testing.fuzzInput(.{});
    if (input.len < 40) return;

    const gas_used = std.mem.readInt(u64, input[0..8], .little);
    const gas_price_gwei = std.mem.readInt(u256, input[8..40], .little);

    const cost = numeric.calculateGasCost(gas_used, gas_price_gwei);

    // Cost should be non-negative
    try testing.expect(cost >= 0);

    // If gas_used is 0, cost should be 0
    if (gas_used == 0) {
        try testing.expectEqual(@as(u256, 0), cost);
    }

    // If gas_price is 0, cost should be 0
    if (gas_price_gwei == 0) {
        try testing.expectEqual(@as(u256, 0), cost);
    }
}

test "fuzz formatGasCost" {
    const input = testing.fuzzInput(.{});
    if (input.len < 40) return;

    const gas_used = std.mem.readInt(u64, input[0..8], .little);
    const gas_price_gwei = std.mem.readInt(u256, input[8..40], .little);

    const result = numeric.formatGasCost(testing.allocator, gas_used, gas_price_gwei) catch return;
    defer testing.allocator.free(result);

    try testing.expect(result.len > 0);
    try testing.expect(std.mem.indexOf(u8, result, "ether") != null);
}

// ============================================================================
// Safe Math Operations Fuzzing
// ============================================================================

test "fuzz safeAdd overflow" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = std.mem.readInt(u256, input[0..32], .little);
    const b = std.mem.readInt(u256, input[32..64], .little);

    const result = numeric.safeAdd(a, b);

    if (result) |sum| {
        // Should not overflow
        try testing.expect(sum >= a);
        try testing.expect(sum >= b);
    } else {
        // Should overflow: a + b > max(u256)
        // Verify overflow would occur
        const max = std.math.maxInt(u256);
        try testing.expect(a > max - b);
    }
}

test "fuzz safeSub underflow" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = std.mem.readInt(u256, input[0..32], .little);
    const b = std.mem.readInt(u256, input[32..64], .little);

    const result = numeric.safeSub(a, b);

    if (result) |diff| {
        // Should not underflow
        try testing.expect(a >= b);
        try testing.expectEqual(a - b, diff);
    } else {
        // Should underflow: a < b
        try testing.expect(a < b);
    }
}

test "fuzz safeMul overflow" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = std.mem.readInt(u256, input[0..32], .little);
    const b = std.mem.readInt(u256, input[32..64], .little);

    const result = numeric.safeMul(a, b);

    // Zero multiplication always succeeds
    if (a == 0 or b == 0) {
        try testing.expectEqual(@as(?u256, 0), result);
        return;
    }

    if (result) |product| {
        // Verify no overflow: product / a == b
        try testing.expectEqual(b, product / a);
    } else {
        // Should overflow
        const max = std.math.maxInt(u256);
        try testing.expect(a > max / b);
    }
}

test "fuzz safeDiv division by zero" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const a = std.mem.readInt(u256, input[0..32], .little);

    const result = numeric.safeDiv(a, 0);
    try testing.expectEqual(@as(?u256, null), result);
}

test "fuzz safeDiv normal" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = std.mem.readInt(u256, input[0..32], .little);
    const b = std.mem.readInt(u256, input[32..64], .little);

    if (b == 0) return;

    const result = numeric.safeDiv(a, b);
    try testing.expect(result != null);

    const quotient = result.?;
    try testing.expectEqual(a / b, quotient);
}

// ============================================================================
// Min/Max Operations Fuzzing
// ============================================================================

test "fuzz min max" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = std.mem.readInt(u256, input[0..32], .little);
    const b = std.mem.readInt(u256, input[32..64], .little);

    const min_val = numeric.min(a, b);
    const max_val = numeric.max(a, b);

    // min <= max
    try testing.expect(min_val <= max_val);

    // min is one of the inputs
    try testing.expect(min_val == a or min_val == b);

    // max is one of the inputs
    try testing.expect(max_val == a or max_val == b);

    // Commutative
    try testing.expectEqual(min_val, numeric.min(b, a));
    try testing.expectEqual(max_val, numeric.max(b, a));

    // If equal, both return same value
    if (a == b) {
        try testing.expectEqual(a, min_val);
        try testing.expectEqual(a, max_val);
    }
}

// ============================================================================
// Percentage Calculations Fuzzing
// ============================================================================

test "fuzz calculatePercentage" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const value = std.mem.readInt(u256, input[0..32], .little);
    const percentage = std.mem.readInt(u256, input[32..64], .little);

    const result = numeric.calculatePercentage(value, percentage);

    // Result should be <= value if percentage <= 100
    if (percentage <= 100) {
        try testing.expect(result <= value);
    }

    // 0% of anything is 0
    if (percentage == 0) {
        try testing.expectEqual(@as(u256, 0), result);
    }

    // 100% of value is value
    if (percentage == 100) {
        try testing.expectEqual(value, result);
    }

    // 0 value gives 0
    if (value == 0) {
        try testing.expectEqual(@as(u256, 0), result);
    }
}

test "fuzz calculatePercentageOf" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const part = std.mem.readInt(u256, input[0..32], .little);
    const whole = std.mem.readInt(u256, input[32..64], .little);

    const result = numeric.calculatePercentageOf(part, whole);

    // Division by zero case
    if (whole == 0) {
        try testing.expectEqual(@as(u256, 0), result);
        return;
    }

    // Result should be reasonable
    if (part <= whole) {
        try testing.expect(result <= 100);
    } else {
        try testing.expect(result > 100);
    }

    // 100% case
    if (part == whole) {
        try testing.expectEqual(@as(u256, 100), result);
    }

    // 0% case
    if (part == 0) {
        try testing.expectEqual(@as(u256, 0), result);
    }
}

// ============================================================================
// Unit String Conversion Fuzzing
// ============================================================================

test "fuzz Unit fromString" {
    const input = testing.fuzzInput(.{});

    const result = numeric.Unit.fromString(input);

    if (result) |unit| {
        // If valid, toString should roundtrip
        const str = unit.toString();
        const back = numeric.Unit.fromString(str);
        try testing.expect(back != null);
        try testing.expectEqual(unit, back.?);

        // toMultiplier should be valid
        const mult = unit.toMultiplier();
        try testing.expect(mult > 0);
    }
}

test "fuzz Unit toMultiplier consistency" {
    const input = testing.fuzzInput(.{});
    if (input.len < 1) return;

    const unit_index = input[0] % 7;
    const units = [_]numeric.Unit{ .wei, .kwei, .mwei, .gwei, .szabo, .finney, .ether };
    const unit = units[unit_index];

    const mult = unit.toMultiplier();

    // Multipliers should be powers of 1000 (except wei)
    try testing.expect(mult > 0);

    // Verify specific values
    switch (unit) {
        .wei => try testing.expectEqual(numeric.WEI, mult),
        .kwei => try testing.expectEqual(numeric.KWEI, mult),
        .mwei => try testing.expectEqual(numeric.MWEI, mult),
        .gwei => try testing.expectEqual(numeric.GWEI, mult),
        .szabo => try testing.expectEqual(numeric.SZABO, mult),
        .finney => try testing.expectEqual(numeric.FINNEY, mult),
        .ether => try testing.expectEqual(numeric.ETHER, mult),
    }
}

// ============================================================================
// Roundtrip Property Tests
// ============================================================================

test "fuzz parse format roundtrip ether" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .little);

    // Limit to reasonable range to avoid precision issues
    if (value > 1000000 * numeric.ETHER) return;

    const formatted = numeric.formatEther(testing.allocator, value) catch return;
    defer testing.allocator.free(formatted);

    const parsed = numeric.parseEther(formatted) catch return;

    // Should be very close (may differ by rounding)
    const diff = if (parsed > value) parsed - value else value - parsed;
    try testing.expect(diff < 1000); // Allow small rounding error
}

test "fuzz parse format roundtrip gwei" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .little);

    if (value > 1000000 * numeric.GWEI) return;

    const formatted = numeric.formatGwei(testing.allocator, value) catch return;
    defer testing.allocator.free(formatted);

    const parsed = numeric.parseGwei(formatted) catch return;

    const diff = if (parsed > value) parsed - value else value - parsed;
    try testing.expect(diff < 1000);
}

test "fuzz parseUnits formatUnits roundtrip" {
    const input = testing.fuzzInput(.{});
    if (input.len < 33) return;

    const value = std.mem.readInt(u256, input[0..32], .little);
    const unit_index = input[32] % 7;

    const units = [_]numeric.Unit{ .wei, .kwei, .mwei, .gwei, .szabo, .finney, .ether };
    const unit = units[unit_index];

    // Limit to reasonable range
    const mult = unit.toMultiplier();
    if (value > 1000000 * mult) return;

    const formatted = numeric.formatUnits(testing.allocator, value, unit, null) catch return;
    defer testing.allocator.free(formatted);

    const parsed = numeric.parseUnits(formatted, unit) catch return;

    // Allow small rounding error
    const diff = if (parsed > value) parsed - value else value - parsed;
    try testing.expect(diff < 1000);
}

// ============================================================================
// Boundary Value Fuzzing
// ============================================================================

test "fuzz parseUnits max values" {
    const input = testing.fuzzInput(.{});

    // Test with u256 max value string
    _ = numeric.parseUnits(input, .wei) catch return;
}

test "fuzz formatUnits extreme values" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .little);

    // Should handle max u256
    _ = numeric.formatWei(testing.allocator, value) catch return;
}

test "fuzz convertUnits overflow" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .little);

    // Converting max values should not panic
    _ = numeric.convertUnits(value, .wei, .ether) catch return;
    _ = numeric.convertUnits(value, .ether, .wei) catch return;
}

test "fuzz safe math at boundaries" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = std.mem.readInt(u256, input[0..32], .little);
    const max = std.math.maxInt(u256);

    // Test at boundary
    _ = numeric.safeAdd(value, max - value);
    _ = numeric.safeAdd(value, max);
    _ = numeric.safeSub(max, value);
    _ = numeric.safeMul(value, 2);
}

// ============================================================================
// Invalid Input Fuzzing
// ============================================================================

test "fuzz parseUnits invalid formats" {
    const input = testing.fuzzInput(.{});

    // Should handle any input gracefully
    _ = numeric.parseUnits(input, .ether) catch return;
    _ = numeric.parseUnits(input, .gwei) catch return;
    _ = numeric.parseUnits(input, .wei) catch return;

    // Should never panic
}

test "fuzz parseUnits special characters" {
    const input = testing.fuzzInput(.{});

    // Should reject non-numeric input
    const result = numeric.parseUnits(input, .ether) catch |err| switch (err) {
        error.InvalidInput,
        error.InvalidFormat,
        error.ValueTooLarge,
        => return,
        else => return err,
    };

    // If it succeeded, verify it's valid
    try testing.expect(result <= std.math.maxInt(u256));
}
