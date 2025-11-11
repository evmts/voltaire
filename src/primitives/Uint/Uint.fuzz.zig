const std = @import("std");
const testing = std.testing;
const Uint = @import("Uint.zig").Uint;

const U8 = Uint(8, 1);
const U64 = Uint(64, 1);
const U128 = Uint(128, 2);
const U256 = Uint(256, 4);
const U512 = Uint(512, 8);

// ============================================================================
// Parsing Fuzzing
// ============================================================================

test "fuzz from_str_radix decimal" {
    const input = testing.fuzzInput(.{});

    const result = U256.from_str_radix(input, 10) catch |err| switch (err) {
        error.InvalidChar,
        error.Overflow,
        error.InvalidRadix,
        error.EmptyInput,
        => return,
    };

    // If parsing succeeded, verify invariants
    try testing.expect(result.le(U256.MAX));
}

test "fuzz from_str_radix hex" {
    const input = testing.fuzzInput(.{});

    const result = U256.from_str_radix(input, 16) catch |err| switch (err) {
        error.InvalidChar,
        error.Overflow,
        error.InvalidRadix,
        error.EmptyInput,
        => return,
    };

    try testing.expect(result.le(U256.MAX));
}

test "fuzz from_str_radix various radixes" {
    const input = testing.fuzzInput(.{});
    if (input.len < 2) return;

    // Use first byte to determine radix (2-36)
    const radix_byte = input[0];
    const radix: u64 = @max(2, @min(36, radix_byte));
    const text = input[1..];

    _ = U256.from_str_radix(text, radix) catch return;
}

test "fuzz from_str" {
    const input = testing.fuzzInput(.{});

    _ = U256.from_str(input) catch |err| switch (err) {
        error.InvalidChar,
        error.Overflow,
        error.InvalidRadix,
        error.EmptyInput,
        => return,
    };
}

// ============================================================================
// Arithmetic Operations Fuzzing
// ============================================================================

test "fuzz add overflow" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    const result = a.overflowing_add(b);

    // Verify overflow detection
    if (!result.overflow) {
        try testing.expect(result.result.ge(a));
        try testing.expect(result.result.ge(b));
    }

    // checked_add should return null on overflow
    const checked = a.checked_add(b);
    if (result.overflow) {
        try testing.expect(checked == null);
    } else {
        try testing.expect(checked != null);
        try testing.expectEqual(result.result, checked.?);
    }
}

test "fuzz sub underflow" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    const result = a.overflowing_sub(b);

    // Verify underflow detection
    if (!result.overflow) {
        try testing.expect(a.ge(b));
        try testing.expect(result.result.le(a));
    }

    // checked_sub should return null on underflow
    const checked = a.checked_sub(b);
    if (result.overflow) {
        try testing.expect(checked == null);
    } else {
        try testing.expect(checked != null);
        try testing.expectEqual(result.result, checked.?);
    }
}

test "fuzz mul overflow" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    const result = a.overflowing_mul(b);

    // checked_mul should return null on overflow
    const checked = a.checked_mul(b);
    if (result.overflow) {
        try testing.expect(checked == null);
    } else {
        try testing.expect(checked != null);
        try testing.expectEqual(result.result, checked.?);
    }

    // Zero multiplication always succeeds
    if (a.is_zero() or b.is_zero()) {
        try testing.expect(result.result.is_zero());
    }
}

test "fuzz division by zero" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const a = U256.from_le_bytes(input[0..32]);
    const zero = U256.ZERO;

    // checked_div should return null on division by zero
    const result = a.checked_div(zero);
    try testing.expect(result == null);

    // checked_rem should return null on division by zero
    const rem_result = a.checked_rem(zero);
    try testing.expect(rem_result == null);
}

test "fuzz division properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    if (b.is_zero()) return;

    const result = a.div_rem(b);

    // Verify division identity: a = b * q + r where r < b
    const product = b.wrapping_mul(result.quotient);
    const reconstructed = product.wrapping_add(result.remainder);

    try testing.expectEqual(a, reconstructed);
    try testing.expect(result.remainder.lt(b));
}

test "fuzz pow overflow" {
    const input = testing.fuzzInput(.{});
    if (input.len < 36) return;

    const base = U256.from_le_bytes(input[0..32]);
    const exp = std.mem.readInt(u32, input[32..36], .little);

    const result = base.overflowing_pow(exp);

    const checked = base.checked_pow(exp);
    if (result.overflow) {
        try testing.expect(checked == null);
    } else {
        try testing.expect(checked != null);
        try testing.expectEqual(result.result, checked.?);
    }

    // Power of zero is always 1 (except 0^0 which is 1 by convention)
    if (exp == 0) {
        try testing.expectEqual(U256.ONE, result.result);
    }

    // Power of one always returns base (if no overflow)
    if (exp == 1 and !result.overflow) {
        try testing.expectEqual(base, result.result);
    }
}

// ============================================================================
// Bitwise Operations Fuzzing
// ============================================================================

test "fuzz bitwise and properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    const result = a.bit_and(b);

    // AND is commutative
    try testing.expectEqual(result, b.bit_and(a));

    // AND with zero is zero
    try testing.expectEqual(U256.ZERO, a.bit_and(U256.ZERO));

    // AND with MAX is identity
    try testing.expectEqual(a, a.bit_and(U256.MAX));

    // Result should be <= both operands
    try testing.expect(result.le(a));
    try testing.expect(result.le(b));
}

test "fuzz bitwise or properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    const result = a.bit_or(b);

    // OR is commutative
    try testing.expectEqual(result, b.bit_or(a));

    // OR with zero is identity
    try testing.expectEqual(a, a.bit_or(U256.ZERO));

    // OR with MAX is MAX
    try testing.expectEqual(U256.MAX, a.bit_or(U256.MAX));

    // Result should be >= both operands
    try testing.expect(result.ge(a));
    try testing.expect(result.ge(b));
}

test "fuzz bitwise xor properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    const result = a.bit_xor(b);

    // XOR is commutative
    try testing.expectEqual(result, b.bit_xor(a));

    // XOR with zero is identity
    try testing.expectEqual(a, a.bit_xor(U256.ZERO));

    // XOR with self is zero
    try testing.expectEqual(U256.ZERO, a.bit_xor(a));

    // Double XOR returns original: (a ^ b) ^ b = a
    try testing.expectEqual(a, result.bit_xor(b));
}

test "fuzz bitwise not properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const a = U256.from_le_bytes(input[0..32]);

    const result = a.bit_not();

    // Double NOT returns original
    try testing.expectEqual(a, result.bit_not());

    // NOT(0) = MAX
    try testing.expectEqual(U256.MAX, U256.ZERO.bit_not());

    // NOT(MAX) = 0
    try testing.expectEqual(U256.ZERO, U256.MAX.bit_not());
}

test "fuzz shift left overflow" {
    const input = testing.fuzzInput(.{});
    if (input.len < 36) return;

    const a = U256.from_le_bytes(input[0..32]);
    const shift = std.mem.readInt(u32, input[32..36], .little);

    const result = a.wrapping_shl(shift);

    // Shifting by 0 is identity
    if (shift == 0) {
        try testing.expectEqual(a, result);
    }

    // Shifting by >= bits gives zero (wrapped)
    if (shift >= 256) {
        try testing.expectEqual(U256.ZERO, result);
    }

    // Shifting left by n and right by n (if < 256) should preserve some bits
    if (shift < 256 and !a.is_zero()) {
        const back = result.wrapping_shr(shift);
        // Only high bits are preserved
        if (shift == 0) {
            try testing.expectEqual(a, back);
        }
    }
}

test "fuzz shift right" {
    const input = testing.fuzzInput(.{});
    if (input.len < 36) return;

    const a = U256.from_le_bytes(input[0..32]);
    const shift = std.mem.readInt(u32, input[32..36], .little);

    const result = a.wrapping_shr(shift);

    // Shifting by 0 is identity
    if (shift == 0) {
        try testing.expectEqual(a, result);
    }

    // Shifting by >= bits gives zero
    if (shift >= 256) {
        try testing.expectEqual(U256.ZERO, result);
    }

    // Result should be <= original
    try testing.expect(result.le(a));
}

test "fuzz rotate operations" {
    const input = testing.fuzzInput(.{});
    if (input.len < 36) return;

    const a = U256.from_le_bytes(input[0..32]);
    const n = std.mem.readInt(u32, input[32..36], .little);

    const left = a.rotate_left(n);
    const right = a.rotate_right(n);

    // Rotate left by n then right by n returns original
    try testing.expectEqual(a, left.rotate_right(n));
    try testing.expectEqual(a, right.rotate_left(n));

    // Rotate by 0 is identity
    try testing.expectEqual(a, a.rotate_left(0));
    try testing.expectEqual(a, a.rotate_right(0));

    // Rotate by 256 is identity (full rotation)
    try testing.expectEqual(a, a.rotate_left(256));
    try testing.expectEqual(a, a.rotate_right(256));
}

// ============================================================================
// Comparison Fuzzing
// ============================================================================

test "fuzz comparison consistency" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    // Equality is symmetric
    try testing.expectEqual(a.eq(b), b.eq(a));

    // lt and ge are opposites
    try testing.expectEqual(a.lt(b), !a.ge(b));

    // gt and le are opposites
    try testing.expectEqual(a.gt(b), !a.le(b));

    // Exactly one of lt, eq, gt must be true
    const is_lt = a.lt(b);
    const is_eq = a.eq(b);
    const is_gt = a.gt(b);

    const count = @intFromBool(is_lt) + @intFromBool(is_eq) + @intFromBool(is_gt);
    try testing.expectEqual(@as(u8, 1), count);

    // Compare with cmp function
    const order = a.cmp(b);
    if (is_lt) try testing.expectEqual(std.math.Order.lt, order);
    if (is_eq) try testing.expectEqual(std.math.Order.eq, order);
    if (is_gt) try testing.expectEqual(std.math.Order.gt, order);
}

test "fuzz branch-free comparison equivalence" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    // Branch-free should match regular comparison
    try testing.expectEqual(a.lt(b), a.ltBranchFree(b));
    try testing.expectEqual(a.gt(b), a.gtBranchFree(b));
    try testing.expectEqual(a.le(b), a.leBranchFree(b));
    try testing.expectEqual(a.ge(b), a.geBranchFree(b));
}

// ============================================================================
// Modular Arithmetic Fuzzing
// ============================================================================

test "fuzz add_mod properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 96) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);
    const modulus = U256.from_le_bytes(input[64..96]);

    if (modulus.is_zero()) return;

    const result = a.add_mod(b, modulus);

    // Result must be less than modulus
    try testing.expect(result.lt(modulus));

    // Commutative
    try testing.expectEqual(result, b.add_mod(a, modulus));

    // Identity: (a + 0) mod m = a mod m
    try testing.expectEqual(a.reduce_mod(modulus), a.add_mod(U256.ZERO, modulus));
}

test "fuzz mul_mod properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 96) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);
    const modulus = U256.from_le_bytes(input[64..96]);

    if (modulus.is_zero()) return;

    const result = a.mul_mod(b, modulus);

    // Result must be less than modulus
    try testing.expect(result.lt(modulus));

    // Commutative
    try testing.expectEqual(result, b.mul_mod(a, modulus));

    // Zero property: (a * 0) mod m = 0
    try testing.expectEqual(U256.ZERO, a.mul_mod(U256.ZERO, modulus));

    // Identity: (a * 1) mod m = a mod m
    try testing.expectEqual(a.reduce_mod(modulus), a.mul_mod(U256.ONE, modulus));
}

test "fuzz pow_mod properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 96) return;

    const base = U256.from_le_bytes(input[0..32]);
    const exp = U256.from_le_bytes(input[32..64]);
    const modulus = U256.from_le_bytes(input[64..96]);

    if (modulus.is_zero() or modulus.eq(U256.ONE)) return;

    const result = base.pow_mod(exp, modulus);

    // Result must be less than modulus
    try testing.expect(result.lt(modulus));

    // base^0 mod m = 1 (if m > 1)
    if (exp.is_zero()) {
        try testing.expectEqual(U256.ONE, result);
    }

    // base^1 mod m = base mod m
    if (exp.eq(U256.ONE)) {
        try testing.expectEqual(base.reduce_mod(modulus), result);
    }

    // 0^exp mod m = 0 (for exp > 0)
    if (base.is_zero() and !exp.is_zero()) {
        try testing.expectEqual(U256.ZERO, result);
    }
}

// ============================================================================
// Byte Encoding/Decoding Fuzzing
// ============================================================================

test "fuzz le_bytes roundtrip" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const original = U256.from_le_bytes(input[0..32]);

    var bytes: [32]u8 = undefined;
    original.to_le_bytes(&bytes);

    const decoded = U256.from_le_bytes(&bytes);

    try testing.expectEqual(original, decoded);
}

test "fuzz be_bytes roundtrip" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const original = U256.from_be_bytes(input[0..32]);

    var bytes: [32]u8 = undefined;
    original.to_be_bytes(&bytes);

    const decoded = U256.from_be_bytes(&bytes);

    try testing.expectEqual(original, decoded);
}

test "fuzz byte operations" {
    const input = testing.fuzzInput(.{});
    if (input.len < 33) return;

    const value = U256.from_le_bytes(input[0..32]);
    const index = @as(usize, input[32]) % 32;

    const byte_value = value.byte(index);

    // Setting and getting should roundtrip
    const modified = value.set_byte(index, byte_value);
    try testing.expectEqual(value, modified);

    // Setting a different value should change only that byte
    const new_value: u8 = byte_value +% 1;
    const changed = value.set_byte(index, new_value);
    try testing.expectEqual(new_value, changed.byte(index));

    // Other bytes should be unchanged
    for (0..32) |i| {
        if (i != index) {
            try testing.expectEqual(value.byte(i), changed.byte(i));
        }
    }
}

test "fuzz swap_bytes involution" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const original = U256.from_le_bytes(input[0..32]);

    const swapped = original.swap_bytes();
    const back = swapped.swap_bytes();

    // Swapping twice returns original
    try testing.expectEqual(original, back);
}

test "fuzz reverse_bits involution" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const original = U256.from_le_bytes(input[0..32]);

    const reversed = original.reverse_bits();
    const back = reversed.reverse_bits();

    // Reversing twice returns original
    try testing.expectEqual(original, back);
}

// ============================================================================
// Bit Manipulation Fuzzing
// ============================================================================

test "fuzz get_bit set_bit consistency" {
    const input = testing.fuzzInput(.{});
    if (input.len < 33) return;

    const value = U256.from_le_bytes(input[0..32]);
    const bit_index = @as(usize, input[32]);

    if (bit_index >= 256) return;

    const bit_value = value.get_bit(bit_index);

    // Setting to current value should not change
    const unchanged = value.set_bit(bit_index, bit_value);
    try testing.expectEqual(value, unchanged);

    // Setting to opposite value and back should roundtrip
    const flipped = value.set_bit(bit_index, !bit_value);
    const back = flipped.set_bit(bit_index, bit_value);
    try testing.expectEqual(value, back);

    // Flipped bit should have opposite value
    try testing.expectEqual(!bit_value, flipped.get_bit(bit_index));
}

test "fuzz count_ones and count_zeros" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = U256.from_le_bytes(input[0..32]);

    const ones = value.count_ones();
    const zeros = value.count_zeros();

    // Must sum to total bits
    try testing.expectEqual(@as(u32, 256), ones + zeros);

    // NOT should swap counts
    const notted = value.bit_not();
    try testing.expectEqual(ones, notted.count_zeros());
    try testing.expectEqual(zeros, notted.count_ones());
}

test "fuzz leading_zeros and bit_len" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = U256.from_le_bytes(input[0..32]);

    const lz = value.leading_zeros();
    const bl = value.bit_len();

    if (value.is_zero()) {
        try testing.expectEqual(@as(u32, 256), lz);
        try testing.expectEqual(@as(usize, 0), bl);
    } else {
        // leading_zeros + bit_len should equal total bits
        try testing.expectEqual(@as(usize, 256), lz + bl);
    }
}

test "fuzz trailing_zeros" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = U256.from_le_bytes(input[0..32]);

    const tz = value.trailing_zeros();

    if (value.is_zero()) {
        try testing.expectEqual(@as(u32, 256), tz);
    } else {
        // Bit at position tz should be 1
        try testing.expect(value.get_bit(tz));

        // All bits before tz should be 0
        for (0..tz) |i| {
            try testing.expect(!value.get_bit(i));
        }
    }
}

// ============================================================================
// Mathematical Properties Fuzzing
// ============================================================================

test "fuzz gcd properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    const result = a.gcd(b);

    // gcd is commutative
    try testing.expectEqual(result, b.gcd(a));

    // gcd(a, 0) = a
    try testing.expectEqual(a, a.gcd(U256.ZERO));
    try testing.expectEqual(b, U256.ZERO.gcd(b));

    // gcd(a, a) = a
    try testing.expectEqual(a, a.gcd(a));

    // Result divides both inputs
    if (!a.is_zero() and !result.is_zero()) {
        const div_a = a.div_rem(result);
        try testing.expectEqual(U256.ZERO, div_a.remainder);
    }
    if (!b.is_zero() and !result.is_zero()) {
        const div_b = b.div_rem(result);
        try testing.expectEqual(U256.ZERO, div_b.remainder);
    }
}

test "fuzz sqrt properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = U256.from_le_bytes(input[0..32]);

    const root = value.sqrt();

    // sqrt(0) = 0
    if (value.is_zero()) {
        try testing.expectEqual(U256.ZERO, root);
        return;
    }

    // root^2 <= value < (root+1)^2
    const root_squared = root.wrapping_mul(root);
    try testing.expect(root_squared.le(value));

    const next_root = root.wrapping_add(U256.ONE);
    const next_squared = next_root.overflowing_mul(next_root);
    if (!next_squared.overflow) {
        try testing.expect(value.lt(next_squared.result));
    }
}

test "fuzz is_power_of_two properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = U256.from_le_bytes(input[0..32]);

    const is_pow2 = value.is_power_of_two();

    if (is_pow2) {
        // Power of two has exactly one bit set
        try testing.expectEqual(@as(u32, 1), value.count_ones());

        // Not zero
        try testing.expect(!value.is_zero());
    }

    // Zero is not power of two
    try testing.expect(!U256.ZERO.is_power_of_two());

    // One is power of two
    try testing.expect(U256.ONE.is_power_of_two());
}

test "fuzz abs_diff symmetry" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    const diff1 = a.abs_diff(b);
    const diff2 = b.abs_diff(a);

    // abs_diff is symmetric
    try testing.expectEqual(diff1, diff2);

    // abs_diff(a, a) = 0
    try testing.expectEqual(U256.ZERO, a.abs_diff(a));

    // abs_diff result should match actual difference
    if (a.ge(b)) {
        const direct = a.wrapping_sub(b);
        try testing.expectEqual(direct, diff1);
    } else {
        const direct = b.wrapping_sub(a);
        try testing.expectEqual(direct, diff1);
    }
}

// ============================================================================
// Edge Cases and Invariants Fuzzing
// ============================================================================

test "fuzz min_max properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 64) return;

    const a = U256.from_le_bytes(input[0..32]);
    const b = U256.from_le_bytes(input[32..64]);

    const min_val = a.min(b);
    const max_val = a.max(b);

    // min <= both operands
    try testing.expect(min_val.le(a));
    try testing.expect(min_val.le(b));

    // max >= both operands
    try testing.expect(max_val.ge(a));
    try testing.expect(max_val.ge(b));

    // min and max are commutative
    try testing.expectEqual(min_val, b.min(a));
    try testing.expectEqual(max_val, b.max(a));

    // One of them is a, the other is b (or both if equal)
    const min_is_a = min_val.eq(a);
    const min_is_b = min_val.eq(b);
    const max_is_a = max_val.eq(a);
    const max_is_b = max_val.eq(b);

    try testing.expect(min_is_a or min_is_b);
    try testing.expect(max_is_a or max_is_b);
}

test "fuzz clamp properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 96) return;

    const value = U256.from_le_bytes(input[0..32]);
    var min_val = U256.from_le_bytes(input[32..64]);
    var max_val = U256.from_le_bytes(input[64..96]);

    // Ensure min <= max
    if (max_val.lt(min_val)) {
        const tmp = min_val;
        min_val = max_val;
        max_val = tmp;
    }

    const clamped = value.clamp(min_val, max_val);

    // Result must be in range
    try testing.expect(clamped.ge(min_val));
    try testing.expect(clamped.le(max_val));

    // If value was in range, unchanged
    if (value.ge(min_val) and value.le(max_val)) {
        try testing.expectEqual(value, clamped);
    }
}

test "fuzz zero identity properties" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const a = U256.from_le_bytes(input[0..32]);

    // a + 0 = a
    try testing.expectEqual(a, a.wrapping_add(U256.ZERO));

    // a - 0 = a
    try testing.expectEqual(a, a.wrapping_sub(U256.ZERO));

    // a * 0 = 0
    try testing.expectEqual(U256.ZERO, a.wrapping_mul(U256.ZERO));

    // a * 1 = a
    try testing.expectEqual(a, a.wrapping_mul(U256.ONE));

    // a | 0 = a
    try testing.expectEqual(a, a.bit_or(U256.ZERO));

    // a & MAX = a
    try testing.expectEqual(a, a.bit_and(U256.MAX));

    // a ^ 0 = a
    try testing.expectEqual(a, a.bit_xor(U256.ZERO));
}

// ============================================================================
// Multiple Sizes Fuzzing
// ============================================================================

test "fuzz U8 operations" {
    const input = testing.fuzzInput(.{});
    if (input.len < 2) return;

    const a = U8.from_u64(input[0]);
    const b = U8.from_u64(input[1]);

    // Basic operations should not panic
    _ = a.wrapping_add(b);
    _ = a.wrapping_sub(b);
    _ = a.wrapping_mul(b);
    if (!b.is_zero()) {
        _ = a.div_rem(b);
    }

    // U8 specific: verify masking
    try testing.expect(a.to_u64() <= 255);
    try testing.expect(b.to_u64() <= 255);
}

test "fuzz U64 operations" {
    const input = testing.fuzzInput(.{});
    if (input.len < 16) return;

    const a = U64.from_le_bytes(input[0..8]);
    const b = U64.from_le_bytes(input[8..16]);

    _ = a.wrapping_add(b);
    _ = a.wrapping_sub(b);
    _ = a.wrapping_mul(b);
    if (!b.is_zero()) {
        _ = a.div_rem(b);
    }
}

test "fuzz U512 operations" {
    const input = testing.fuzzInput(.{});
    if (input.len < 128) return;

    const a = U512.from_le_bytes(input[0..64]);
    const b = U512.from_le_bytes(input[64..128]);

    _ = a.wrapping_add(b);
    _ = a.wrapping_sub(b);
    _ = a.overflowing_mul(b); // Don't test full mul due to performance

    if (!b.is_zero()) {
        _ = a.div_rem(b);
    }
}

// ============================================================================
// String Formatting Fuzzing
// ============================================================================

test "fuzz to_string_radix" {
    const input = testing.fuzzInput(.{});
    if (input.len < 33) return;

    const value = U256.from_le_bytes(input[0..32]);
    const radix_byte = input[32];
    const radix: u64 = @max(2, @min(36, radix_byte));

    const allocator = testing.allocator;

    const str = value.to_string_radix(allocator, radix) catch return;
    defer allocator.free(str);

    // Verify string is not empty
    try testing.expect(str.len > 0);

    // Parse back should give original value
    const parsed = U256.from_str_radix(str, radix) catch return;
    try testing.expectEqual(value, parsed);
}

test "fuzz format output" {
    const input = testing.fuzzInput(.{});
    if (input.len < 32) return;

    const value = U256.from_le_bytes(input[0..32]);

    const allocator = testing.allocator;

    // Default format (decimal)
    const str = std.fmt.allocPrint(allocator, "{}", .{value}) catch return;
    defer allocator.free(str);

    try testing.expect(str.len > 0);

    // Hex format
    const hex_str = std.fmt.allocPrint(allocator, "{x}", .{value}) catch return;
    defer allocator.free(hex_str);

    try testing.expect(hex_str.len > 0);
}
