const std = @import("std");

/// EIP-1559 fee market mechanism
/// Base fee adjusts based on block fullness; burned, not paid to miners
/// Calculate `fee * gas_delta / gas_target / denominator` without overflow.
///
/// Returns the raw rounded-down delta (may be 0). EIP-1559 forces a minimum
/// delta of 1 only on upward adjustments; callers apply that rule.
fn calculateFeeDelta(fee: u64, gas_delta: u64, gas_target: u64, denominator: u64) u64 {
    // Using u128 for intermediate calculation to avoid overflow
    const intermediate: u128 = @as(u128, fee) * @as(u128, gas_delta);
    // Avoid division by zero
    const divisor: u128 = @max(1, @as(u128, gas_target) * @as(u128, denominator));
    return @intCast(@min(@as(u128, std.math.maxInt(u64)), intermediate / divisor));
}
/// Base fee change denominator (12.5% max change per block)
pub const BASE_FEE_CHANGE_DENOMINATOR: u64 = 8;

/// Elasticity multiplier (gas limit = target * elasticity)
pub const ELASTICITY_MULTIPLIER: u64 = 2;

/// Base fee of the London fork block (EIP-1559 `INITIAL_BASE_FEE`, 1 gwei)
pub const INITIAL_BASE_FEE: u64 = 1_000_000_000;

/// Base fee of the first EIP-1559 (London fork) block.
///
/// EIP-1559: the fork block's base fee is `INITIAL_BASE_FEE`; parent
/// utilization does not adjust it. The parameters are kept for API
/// compatibility and do not affect the result.
pub fn initialBaseFee(parent_gas_used: u64, parent_gas_limit: u64) u64 {
    _ = parent_gas_used;
    _ = parent_gas_limit;
    return INITIAL_BASE_FEE;
}

/// Calculate the next block's base fee based on the current block
///
/// This implements the EIP-1559 base fee adjustment algorithm:
/// - If the block used exactly the target gas, the base fee remains the same
/// - If the block used more than the target, the base fee increases by
///   `max(1, fee * delta / target / 8)`
/// - If the block used less than the target (including an empty block), the
///   base fee decreases by `fee * delta / target / 8` (no minimum delta)
/// - The maximum change per block is 12.5% (1/8)
/// - No floor applies: EIP-1559 defines none. A 1 wei base fee at target
///   stays 1 wei and a 0 base fee stays 0.
/// - An upward adjustment that does not fit in u64 saturates at
///   `maxInt(u64)`; it never silently stays at `parent_base_fee`.
///
/// Parameters:
/// - parent_base_fee: Base fee of the parent block
/// - parent_gas_used: Gas used by the parent block
/// - parent_gas_target: Target gas usage of the parent block
///
/// Returns: The next block's base fee (in wei)
pub fn nextBaseFee(parent_base_fee: u64, parent_gas_used: u64, parent_gas_target: u64) u64 {
    var new_base_fee = parent_base_fee;

    if (parent_gas_used == parent_gas_target) {
        // At target: base fee unchanged
    } else if (parent_gas_used > parent_gas_target) {
        const gas_used_delta = parent_gas_used - parent_gas_target;
        // Upward adjustment is at least 1 wei (EIP-1559)
        const base_fee_delta = @max(1, calculateFeeDelta(parent_base_fee, gas_used_delta, parent_gas_target, BASE_FEE_CHANGE_DENOMINATOR));
        // Sum in u128 and saturate at maxInt(u64): a fee that cannot be
        // represented still rises to the ceiling instead of freezing at parent.
        const raised: u128 = @as(u128, parent_base_fee) + @as(u128, base_fee_delta);
        new_base_fee = @intCast(@min(raised, @as(u128, std.math.maxInt(u64))));
    } else {
        // Below target (an empty parent block included): no minimum delta
        const gas_used_delta = parent_gas_target - parent_gas_used;
        const base_fee_delta = calculateFeeDelta(parent_base_fee, gas_used_delta, parent_gas_target, BASE_FEE_CHANGE_DENOMINATOR);
        new_base_fee = parent_base_fee -| base_fee_delta;
    }

    return new_base_fee;
}

/// Calculate the effective gas price for an EIP-1559 transaction
///
/// The effective gas price is the minimum of:
/// 1. max_fee_per_gas specified by the sender
/// 2. base_fee_per_gas + max_priority_fee_per_gas
///
/// Parameters:
/// - base_fee_per_gas: Current block's base fee
/// - max_fee_per_gas: Maximum fee the sender is willing to pay
/// - max_priority_fee_per_gas: Maximum tip the sender is willing to pay to the miner
///
/// Returns: The effective gas price, and the miner's portion of the fee
pub fn getEffectiveGasPrice(base_fee_per_gas: u64, max_fee_per_gas: u64, max_priority_fee_per_gas: u64) struct { effective_gas_price: u64, miner_fee: u64 } {
    // Calculating effective gas price
    // Using base fee, max fee, and max priority fee

    // Ensure the transaction at least pays the base fee
    if (max_fee_per_gas < base_fee_per_gas) {
        // Transaction's max fee is less than base fee
        // In a real implementation, this transaction would be rejected
        // For now, just return the max fee and zero miner fee
        return .{ .effective_gas_price = max_fee_per_gas, .miner_fee = 0 };
    }

    // Calculate the priority fee (tip to miner)
    // This is limited by both max_priority_fee_per_gas and the leftover after base fee
    const max_priority_fee = @min(max_priority_fee_per_gas, max_fee_per_gas - base_fee_per_gas);

    // The effective gas price is base fee plus priority fee
    const effective_gas_price = base_fee_per_gas + max_priority_fee;

    // Effective gas price and miner fee calculated

    return .{ .effective_gas_price = effective_gas_price, .miner_fee = max_priority_fee };
}

/// Get the gas target for a block
///
/// The gas target is the desired gas usage per block, which is typically
/// half of the maximum gas limit.
///
/// Parameters:
/// - gas_limit: The block's gas limit
///
/// Returns: The gas target for the block
pub fn getGasTarget(gas_limit: u64) u64 {
    return gas_limit / ELASTICITY_MULTIPLIER;
}

/// Convert gwei (as f64) to wei (u64)
///
/// 1 gwei = 1,000,000,000 wei
///
/// Parameters:
/// - gwei: Amount in gwei (as floating point)
///
/// Returns: Amount in wei
///
/// Errors:
/// - `error.NotFinite`: `gwei` is NaN or infinite
/// - `error.Negative`: `gwei` is below zero
/// - `error.Overflow`: the wei amount does not fit in u64
pub fn gweiToWei(gwei: f64) error{ NotFinite, Negative, Overflow }!u64 {
    if (!std.math.isFinite(gwei)) return error.NotFinite;
    if (gwei < 0) return error.Negative;
    const wei_f64 = @floor(gwei * 1_000_000_000.0);
    // 2^64 is exactly representable; every f64 below it converts safely.
    if (wei_f64 >= 18446744073709551616.0) return error.Overflow;
    return @intFromFloat(wei_f64);
}

/// Convert wei (u64) to gwei string representation
///
/// 1 gwei = 1,000,000,000 wei
/// Returns a formatted string with 9 decimal places
///
/// Parameters:
/// - allocator: Memory allocator for string formatting
/// - wei: Amount in wei
///
/// Returns: Formatted gwei string (caller owns memory)
pub fn weiToGwei(allocator: std.mem.Allocator, wei: u64) ![]const u8 {
    const gwei_whole = wei / 1_000_000_000;
    const gwei_fraction = wei % 1_000_000_000;
    return std.fmt.allocPrint(allocator, "{d}.{d:0>9}", .{ gwei_whole, gwei_fraction });
}

/// Check if a transaction can be included in a block
///
/// A transaction can be included if:
/// 1. maxFeePerGas >= baseFee (for regular tx)
/// 2. maxFeePerBlobGas >= blobBaseFee (for blob tx, if applicable)
///
/// Parameters:
/// - max_fee_per_gas: Maximum fee per gas the sender is willing to pay
/// - base_fee: Current block's base fee
/// - max_fee_per_blob_gas: Optional max fee per blob gas (for blob transactions)
/// - blob_base_fee: Optional blob base fee (for blob transactions)
///
/// Returns: true if transaction can be included, false otherwise
pub fn canIncludeTx(
    max_fee_per_gas: u64,
    base_fee: u64,
    max_fee_per_blob_gas: ?u64,
    blob_base_fee: ?u64,
) bool {
    // Check if max fee covers base fee
    if (max_fee_per_gas < base_fee) {
        return false;
    }

    // If blob parameters provided, check blob fee too
    if (max_fee_per_blob_gas) |max_blob_fee| {
        if (blob_base_fee) |blob_fee| {
            if (max_blob_fee < blob_fee) {
                return false;
            }
        }
    }

    return true;
}

// Tests

test "calculateFeeDelta basic functionality" {
    // Test basic calculation
    const fee = 1000;
    const gas_delta = 100;
    const gas_target = 1000;
    const denominator = 8;

    const result = calculateFeeDelta(fee, gas_delta, gas_target, denominator);
    // Expected: (1000 * 100) / (1000 * 8) = 100000 / 8000 = 12.5, rounded to 12
    try std.testing.expectEqual(@as(u64, 12), result);
}

test "calculateFeeDelta rounds down to zero (no forced minimum)" {
    const fee = 1;
    const gas_delta = 1;
    const gas_target = 1000000;
    const denominator = 1000000;

    const result = calculateFeeDelta(fee, gas_delta, gas_target, denominator);
    try std.testing.expectEqual(@as(u64, 0), result);
}

test "calculateFeeDelta handles large values without overflow" {
    // Test with large values that would overflow u64 in intermediate calculations
    const fee = std.math.maxInt(u64) / 2;
    const gas_delta = 1000;
    const gas_target = 1000;
    const denominator = 1;

    const result = calculateFeeDelta(fee, gas_delta, gas_target, denominator);
    // Should not panic and return a valid result
    try std.testing.expect(result > 0);
}

test "calculateFeeDelta handles division by zero protection" {
    // Test with zero gas_target and denominator
    const fee = 1000;
    const gas_delta = 100;
    const gas_target = 0;
    const denominator = 0;

    const result = calculateFeeDelta(fee, gas_delta, gas_target, denominator);
    // Should use divisor of 1 and return fee * gas_delta
    try std.testing.expectEqual(@as(u64, 100000), result);
}

test "nextBaseFee applies no minimum base fee clamp" {
    // EIP-1559 has no base fee floor. At target the fee is unchanged.
    try std.testing.expectEqual(@as(u64, 1), nextBaseFee(1, 15_000_000, 15_000_000));
    try std.testing.expectEqual(@as(u64, 0), nextBaseFee(0, 15_000_000, 15_000_000));
    // Below target: 1 * delta / target / 8 rounds to 0, so 1 wei stays 1 wei.
    try std.testing.expectEqual(@as(u64, 1), nextBaseFee(1, 0, 15_000_000));
    try std.testing.expectEqual(@as(u64, 0), nextBaseFee(0, 0, 15_000_000));
    // Fees below the old 7 wei clamp are preserved, not raised.
    try std.testing.expectEqual(@as(u64, 6), nextBaseFee(6, 15_000_000, 15_000_000));
    // Above target: the forced 1 wei upward delta lifts 0 to 1.
    try std.testing.expectEqual(@as(u64, 1), nextBaseFee(0, 30_000_000, 15_000_000));
}

test "BASE_FEE_CHANGE_DENOMINATOR constant value" {
    try std.testing.expectEqual(@as(u64, 8), BASE_FEE_CHANGE_DENOMINATOR);
}

test "initial_base_fee with exactly target gas usage" {
    // London fork block: INITIAL_BASE_FEE, no parent utilization adjustment
    try std.testing.expectEqual(INITIAL_BASE_FEE, initialBaseFee(15_000_000, 30_000_000));
}

test "initial_base_fee with above target gas usage" {
    // Parent utilization above target does not adjust the fork block base fee
    try std.testing.expectEqual(@as(u64, 1_000_000_000), initialBaseFee(20_000_000, 30_000_000));
}

test "initial_base_fee with below target gas usage" {
    // Parent utilization below target does not adjust the fork block base fee
    try std.testing.expectEqual(@as(u64, 1_000_000_000), initialBaseFee(10_000_000, 30_000_000));
}

test "initial_base_fee with zero gas usage" {
    const parent_gas_limit = 30_000_000;
    const parent_gas_used = 0;

    const base_fee = initialBaseFee(parent_gas_used, parent_gas_limit);
    // Should return 1 gwei (no adjustment)
    try std.testing.expectEqual(@as(u64, 1_000_000_000), base_fee);
}

test "initial_base_fee is INITIAL_BASE_FEE at tiny gas limits" {
    try std.testing.expectEqual(INITIAL_BASE_FEE, initialBaseFee(0, 100));
    try std.testing.expectEqual(@as(u64, 1_000_000_000), INITIAL_BASE_FEE);
}

test "next_base_fee with exactly target gas usage" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 15_000_000; // Exactly target

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should remain the same
    try std.testing.expectEqual(parent_base_fee, next_fee);
}

test "next_base_fee with above target gas usage" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 20_000_000; // 5M above target

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should increase by up to 12.5%
    try std.testing.expect(next_fee > parent_base_fee);

    // Expected increase: base_fee * (5M / 15M) / 8 = base_fee * 1/24
    const expected = parent_base_fee + (parent_base_fee / 24);
    try std.testing.expectEqual(expected, next_fee);
}

test "next_base_fee with below target gas usage" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 10_000_000; // 5M below target

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should decrease by up to 12.5%
    try std.testing.expect(next_fee < parent_base_fee);

    // Expected decrease: base_fee * (5M / 15M) / 8 = base_fee * 1/24
    const expected = parent_base_fee - (parent_base_fee / 24);
    try std.testing.expectEqual(expected, next_fee);
}

test "next_base_fee with maximum increase (full block)" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 30_000_000; // Double the target (full block)

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should increase by exactly 12.5%
    const expected = parent_base_fee + (parent_base_fee / 8);
    try std.testing.expectEqual(expected, next_fee);
}

test "next_base_fee with empty parent block" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 0; // Empty block

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Empty block uses the standard downward formula: -12.5%
    try std.testing.expectEqual(@as(u64, 875_000_000), next_fee);
}

test "next_base_fee respects minimum base fee on decrease" {
    const parent_base_fee = 10; // Very low base fee
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 0; // Empty block decreases by 10 / 8 = 1

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    try std.testing.expectEqual(@as(u64, 9), next_fee);
}

test "next_base_fee is unchanged when the downward delta rounds to zero" {
    const parent_base_fee = 8;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 1; // Very low usage

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // 8 * (15M - 1) / 15M / 8 rounds to 0
    try std.testing.expectEqual(@as(u64, 8), next_fee);
}

test "next_base_fee handles overflow protection" {
    const parent_base_fee = std.math.maxInt(u64) - 1000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 30_000_000; // Would increase

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // +12.5% does not fit in u64: saturate at the ceiling, never freeze at parent
    try std.testing.expectEqual(@as(u64, std.math.maxInt(u64)), next_fee);
    try std.testing.expect(next_fee > parent_base_fee);
}

test "get_effective_gas_price with sufficient max fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 2_000_000_000; // 2 gwei
    const max_priority_fee = 500_000_000; // 0.5 gwei

    const result = getEffectiveGasPrice(base_fee, max_fee, max_priority_fee);
    // Effective price should be base + priority
    try std.testing.expectEqual(@as(u64, 1_500_000_000), result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 500_000_000), result.miner_fee);
}

test "get_effective_gas_price with limited max fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 1_200_000_000; // 1.2 gwei
    const max_priority_fee = 500_000_000; // 0.5 gwei (more than available)

    const result = getEffectiveGasPrice(base_fee, max_fee, max_priority_fee);
    // Priority fee limited by max_fee - base_fee
    try std.testing.expectEqual(@as(u64, 1_200_000_000), result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 200_000_000), result.miner_fee);
}

test "get_effective_gas_price with max fee below base fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 800_000_000; // 0.8 gwei (below base)
    const max_priority_fee = 100_000_000; // 0.1 gwei

    const result = getEffectiveGasPrice(base_fee, max_fee, max_priority_fee);
    // Transaction would be rejected, but returns max_fee and 0 miner fee
    try std.testing.expectEqual(@as(u64, 800_000_000), result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 0), result.miner_fee);
}

test "get_effective_gas_price with zero priority fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 2_000_000_000; // 2 gwei
    const max_priority_fee = 0; // No tip

    const result = getEffectiveGasPrice(base_fee, max_fee, max_priority_fee);
    // Should just pay base fee
    try std.testing.expectEqual(base_fee, result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 0), result.miner_fee);
}

test "get_effective_gas_price with exact base fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 1_000_000_000; // Exactly base fee
    const max_priority_fee = 100_000_000; // 0.1 gwei (can't be paid)

    const result = getEffectiveGasPrice(base_fee, max_fee, max_priority_fee);
    // No room for priority fee
    try std.testing.expectEqual(base_fee, result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 0), result.miner_fee);
}

test "get_gas_target basic calculation" {
    const gas_limit = 30_000_000;
    const target = getGasTarget(gas_limit);
    try std.testing.expectEqual(@as(u64, 15_000_000), target);
}

test "get_gas_target with odd gas limit" {
    const gas_limit = 30_000_001;
    const target = getGasTarget(gas_limit);
    // Integer division rounds down
    try std.testing.expectEqual(@as(u64, 15_000_000), target);
}

test "get_gas_target with zero gas limit" {
    const gas_limit = 0;
    const target = getGasTarget(gas_limit);
    try std.testing.expectEqual(@as(u64, 0), target);
}

test "get_gas_target with small gas limit" {
    const gas_limit = 1;
    const target = getGasTarget(gas_limit);
    try std.testing.expectEqual(@as(u64, 0), target);
}

// Additional comprehensive tests for initialBaseFee

test "initialBaseFee with maximum gas limit" {
    try std.testing.expectEqual(INITIAL_BASE_FEE, initialBaseFee(std.math.maxInt(u64) / 2, std.math.maxInt(u64)));
}

test "initialBaseFee with full parent block" {
    // Full parent block does not raise the fork block base fee
    try std.testing.expectEqual(INITIAL_BASE_FEE, initialBaseFee(30_000_000, 30_000_000));
}

test "initialBaseFee with very small gas limit" {
    try std.testing.expectEqual(INITIAL_BASE_FEE, initialBaseFee(50, 100));
}

test "initialBaseFee with near-zero parent gas used" {
    try std.testing.expectEqual(INITIAL_BASE_FEE, initialBaseFee(1, 30_000_000));
}

test "initialBaseFee with extreme below-target usage" {
    try std.testing.expectEqual(INITIAL_BASE_FEE, initialBaseFee(100, 30_000_000));
}

test "initialBaseFee ignores parent utilization at small limits" {
    try std.testing.expectEqual(INITIAL_BASE_FEE, initialBaseFee(1, 1000));
}

// Additional comprehensive tests for nextBaseFee

test "nextBaseFee with minimal above-target usage" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 15_000_001; // Just 1 over target

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should increase minimally (at least by 1)
    try std.testing.expect(next_fee > parent_base_fee);
    try std.testing.expect(next_fee - parent_base_fee >= 1);
}

test "nextBaseFee with minimal below-target usage" {
    const parent_base_fee = 100;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 14_999_999; // Just 1 under target

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // 100 * 1 / 15M / 8 rounds to 0: no forced 1-wei decrease (EIP-1559)
    try std.testing.expectEqual(parent_base_fee, next_fee);
}

test "nextBaseFee precision with small base fee" {
    const parent_base_fee = 10; // Very small base fee
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 20_000_000; // Above target

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should still increase by at least 1 due to minimum delta
    try std.testing.expect(next_fee > parent_base_fee);
    try std.testing.expect(next_fee - parent_base_fee >= 1);
}

test "nextBaseFee precision with large base fee" {
    const parent_base_fee = 1_000_000_000_000; // 1000 gwei
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 16_000_000; // Slightly above target

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should calculate precise increase
    try std.testing.expect(next_fee > parent_base_fee);

    // Expected: base_fee * (1M / 15M) / 8 = base_fee * 1/120
    const expected_delta = parent_base_fee / 120;
    const expected = parent_base_fee + expected_delta;
    try std.testing.expectEqual(expected, next_fee);
}

test "nextBaseFee with very high gas usage" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 100_000_000; // Way above target (beyond 2x elasticity)

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // EIP-1559 has no cap in the formula; 12.5% is the max only because
    // gas_used <= gas_limit = 2 * target. 1e9 * 85M / 15M / 8 = 708_333_333
    try std.testing.expectEqual(@as(u64, 1_708_333_333), next_fee);
}

test "nextBaseFee decrease at single-digit base fee" {
    const parent_base_fee = 8;
    const parent_gas_target = 1_000;
    const parent_gas_used = 1;

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // 8 * 999 / 1000 / 8 rounds to 0: base fee unchanged
    try std.testing.expectEqual(@as(u64, 8), next_fee);
    // An empty block decreases it: 8 * 1000 / 1000 / 8 = 1
    try std.testing.expectEqual(@as(u64, 7), nextBaseFee(8, 0, 1_000));
}

test "nextBaseFee at 7 wei with empty block" {
    const parent_base_fee = 7;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 0; // Empty block

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // 7 * target / target / 8 rounds to 0: the fee stops falling by rounding, not by a clamp
    try std.testing.expectEqual(@as(u64, 7), next_fee);
}

test "nextBaseFee at 7 wei with below-target usage" {
    const parent_base_fee = 7;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 1_000_000; // Below target

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Delta rounds to 0
    try std.testing.expectEqual(@as(u64, 7), next_fee);
}

test "nextBaseFee with gas used exceeding realistic limits" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 1_000_000_000; // Unrealistically high

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Uncapped formula: 1e9 * 985M / 15M / 8 = 8_208_333_333
    try std.testing.expectEqual(@as(u64, 9_208_333_333), next_fee);
}

test "nextBaseFee precision loss with integer division" {
    const parent_base_fee = 15; // Base fee that doesn't divide evenly
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 20_000_000; // Above target

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should handle integer division correctly
    try std.testing.expect(next_fee > parent_base_fee);
    // Minimum increase should be 1
    try std.testing.expect(next_fee - parent_base_fee >= 1);
}

test "nextBaseFee with maximum safe base fee" {
    const parent_base_fee = std.math.maxInt(u64) / 2;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 20_000_000; // Above target would increase

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should not overflow - calculateFeeDelta handles this
    try std.testing.expect(next_fee >= parent_base_fee);
}

test "nextBaseFee boundary at exact target after increase" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    // First increase
    const parent_gas_used_high = 20_000_000;
    const increased_fee = nextBaseFee(parent_base_fee, parent_gas_used_high, parent_gas_target);

    // Then at target
    const next_fee = nextBaseFee(increased_fee, parent_gas_target, parent_gas_target);
    // Should stay at increased fee
    try std.testing.expectEqual(increased_fee, next_fee);
}

test "nextBaseFee boundary at exact target after decrease" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    // First decrease
    const parent_gas_used_low = 10_000_000;
    const decreased_fee = nextBaseFee(parent_base_fee, parent_gas_used_low, parent_gas_target);

    // Then at target
    const next_fee = nextBaseFee(decreased_fee, parent_gas_target, parent_gas_target);
    // Should stay at decreased fee
    try std.testing.expectEqual(decreased_fee, next_fee);
}

test "nextBaseFee with zero gas target" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 0; // Edge case
    const parent_gas_used = 0;

    const next_fee = nextBaseFee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Empty block behavior
    try std.testing.expectEqual(parent_base_fee, next_fee);
}

// Edge case tests for fee delta calculations

test "calculateFeeDelta with maximum fee and small delta" {
    const fee = std.math.maxInt(u64) / 10;
    const gas_delta = 1;
    const gas_target = 15_000_000;
    const denominator = 8;

    const result = calculateFeeDelta(fee, gas_delta, gas_target, denominator);
    // Should not overflow and return valid result
    try std.testing.expect(result >= 1);
}

test "calculateFeeDelta with zero fee" {
    const result = calculateFeeDelta(0, 1_000_000, 15_000_000, 8);
    try std.testing.expectEqual(@as(u64, 0), result);
}

test "calculateFeeDelta with zero gas delta" {
    const result = calculateFeeDelta(1_000_000_000, 0, 15_000_000, 8);
    try std.testing.expectEqual(@as(u64, 0), result);
}

test "calculateFeeDelta with all maximum values" {
    const fee = std.math.maxInt(u64);
    const gas_delta = std.math.maxInt(u64);
    const gas_target = std.math.maxInt(u64);
    const denominator = std.math.maxInt(u64);

    const result = calculateFeeDelta(fee, gas_delta, gas_target, denominator);
    // Should handle overflow and return capped result
    try std.testing.expect(result > 0);
    try std.testing.expect(result <= std.math.maxInt(u64));
}

test "calculateFeeDelta rounding behavior" {
    // Test that integer division rounds down correctly
    const fee = 1000;
    const gas_delta = 3;
    const gas_target = 100;
    const denominator = 8;

    const result = calculateFeeDelta(fee, gas_delta, gas_target, denominator);
    // (1000 * 3) / (100 * 8) = 3000 / 800 = 3.75 -> rounds to 3
    try std.testing.expectEqual(@as(u64, 3), result);
}

// Tests for sequential fee adjustments (realistic block sequences)

test "nextBaseFee sequence of full blocks" {
    var current_fee: u64 = 1_000_000_000;
    const gas_target: u64 = 15_000_000;
    const gas_used: u64 = 30_000_000; // Full block

    // After 10 full blocks, fee should compound
    var i: usize = 0;
    while (i < 10) : (i += 1) {
        const next = nextBaseFee(current_fee, gas_used, gas_target);
        // Each step should increase by 12.5%
        try std.testing.expect(next > current_fee);
        current_fee = next;
    }

    // After 10 blocks at 12.5% increase each, fee should be significantly higher
    try std.testing.expect(current_fee > 3_000_000_000); // More than 3x original
}

test "nextBaseFee sequence of empty blocks" {
    var current_fee: u64 = 1_000_000_000;
    const gas_target: u64 = 15_000_000;

    // Each empty block decreases the base fee by exactly 12.5%
    var i: usize = 0;
    while (i < 10) : (i += 1) {
        const next = nextBaseFee(current_fee, 0, gas_target);
        try std.testing.expectEqual(current_fee - current_fee / 8, next);
        current_fee = next;
    }

    try std.testing.expectEqual(@as(u64, 263_075_578), current_fee);
}

test "nextBaseFee sequence alternating full and empty" {
    var current_fee: u64 = 1_000_000_000;
    const gas_target: u64 = 15_000_000;

    var i: usize = 0;
    while (i < 10) : (i += 1) {
        if (i % 2 == 0) {
            current_fee = nextBaseFee(current_fee, 30_000_000, gas_target);
        } else {
            current_fee = nextBaseFee(current_fee, 0, gas_target);
        }
    }

    // 1.125 * 0.875 < 1: five full/empty pairs lower the fee
    try std.testing.expectEqual(@as(u64, 924_278_556), current_fee);
}

test "nextBaseFee sequence descending to fixed point" {
    var current_fee: u64 = 1_000_000_000;
    const gas_target: u64 = 15_000_000;
    const gas_used: u64 = 100; // Very low usage

    // Decrease until the rounded-down delta reaches 0
    var i: usize = 0;
    while (i < 1000) : (i += 1) {
        const next = nextBaseFee(current_fee, gas_used, gas_target);
        if (next == current_fee) break;
        current_fee = next;
    }

    // 8 * 14_999_900 / 15M / 8 rounds to 0, so the fee settles at 8 wei
    try std.testing.expectEqual(@as(u64, 145), i);
    try std.testing.expectEqual(@as(u64, 8), current_fee);
}

test "nextBaseFee empty parent block follows EIP-1559 downward formula" {
    // 1 gwei -> 875M wei, not unchanged
    try std.testing.expectEqual(@as(u64, 875_000_000), nextBaseFee(1_000_000_000, 0, 15_000_000));
}

test "nextBaseFee forces a 1 wei minimum delta only upward" {
    // Upward: 1000 * 1 / 15M / 8 rounds to 0, forced to 1
    try std.testing.expectEqual(@as(u64, 1_001), nextBaseFee(1_000, 15_000_001, 15_000_000));
    // Downward: same magnitude rounds to 0 and stays 0
    try std.testing.expectEqual(@as(u64, 1_000), nextBaseFee(1_000, 14_999_999, 15_000_000));
}

// Tests for new APIs

test "ELASTICITY_MULTIPLIER constant value" {
    try std.testing.expectEqual(@as(u64, 2), ELASTICITY_MULTIPLIER);
}

test "gweiToWei converts 1 gwei" {
    const wei = try gweiToWei(1.0);
    try std.testing.expectEqual(@as(u64, 1_000_000_000), wei);
}

test "gweiToWei converts fractional gwei" {
    const wei = try gweiToWei(1.5);
    try std.testing.expectEqual(@as(u64, 1_500_000_000), wei);
}

test "gweiToWei converts zero" {
    const wei = try gweiToWei(0.0);
    try std.testing.expectEqual(@as(u64, 0), wei);
}

test "gweiToWei converts large values" {
    const wei = try gweiToWei(100.0);
    try std.testing.expectEqual(@as(u64, 100_000_000_000), wei);
}

test "gweiToWei truncates sub-wei precision" {
    const wei = try gweiToWei(1.0000000001);
    try std.testing.expectEqual(@as(u64, 1_000_000_000), wei);
}

test "gweiToWei rejects NaN, infinity, negative, and out-of-range input" {
    try std.testing.expectError(error.NotFinite, gweiToWei(std.math.nan(f64)));
    try std.testing.expectError(error.NotFinite, gweiToWei(std.math.inf(f64)));
    try std.testing.expectError(error.NotFinite, gweiToWei(-std.math.inf(f64)));
    try std.testing.expectError(error.Negative, gweiToWei(-1.0));
    try std.testing.expectError(error.Negative, gweiToWei(-0.000000001));
    // 2^64 wei = 18446744073.709551616 gwei
    try std.testing.expectError(error.Overflow, gweiToWei(18446744073.709551616));
    try std.testing.expectError(error.Overflow, gweiToWei(1e300));
    // 2^32 gwei = 2^41 * 5^9 wei is exactly representable and in range
    try std.testing.expectEqual(@as(u64, 4_294_967_296_000_000_000), try gweiToWei(4294967296.0));
    // Negative zero is zero
    try std.testing.expectEqual(@as(u64, 0), try gweiToWei(-0.0));
}

test "weiToGwei converts 1 gwei" {
    const allocator = std.testing.allocator;
    const gwei = try weiToGwei(allocator, 1_000_000_000);
    defer allocator.free(gwei);
    try std.testing.expectEqualStrings("1.000000000", gwei);
}

test "weiToGwei converts fractional gwei" {
    const allocator = std.testing.allocator;
    const gwei = try weiToGwei(allocator, 1_234_567_890);
    defer allocator.free(gwei);
    try std.testing.expectEqualStrings("1.234567890", gwei);
}

test "weiToGwei converts zero" {
    const allocator = std.testing.allocator;
    const gwei = try weiToGwei(allocator, 0);
    defer allocator.free(gwei);
    try std.testing.expectEqualStrings("0.000000000", gwei);
}

test "weiToGwei converts large values" {
    const allocator = std.testing.allocator;
    const gwei = try weiToGwei(allocator, 100_000_000_000);
    defer allocator.free(gwei);
    try std.testing.expectEqualStrings("100.000000000", gwei);
}

test "weiToGwei converts small values" {
    const allocator = std.testing.allocator;
    const gwei = try weiToGwei(allocator, 7);
    defer allocator.free(gwei);
    try std.testing.expectEqualStrings("0.000000007", gwei);
}

test "canIncludeTx returns true when maxFee covers baseFee" {
    const can_include = canIncludeTx(1_000_000_000, 900_000_000, null, null);
    try std.testing.expect(can_include);
}

test "canIncludeTx returns false when maxFee below baseFee" {
    const can_include = canIncludeTx(800_000_000, 900_000_000, null, null);
    try std.testing.expect(!can_include);
}

test "canIncludeTx returns true when maxFee equals baseFee" {
    const can_include = canIncludeTx(1_000_000_000, 1_000_000_000, null, null);
    try std.testing.expect(can_include);
}

test "canIncludeTx returns true for blob tx with sufficient fees" {
    const can_include = canIncludeTx(2_000_000_000, 1_500_000_000, 10_000_000, 5_000_000);
    try std.testing.expect(can_include);
}

test "canIncludeTx returns false for blob tx with insufficient blob fee" {
    const can_include = canIncludeTx(2_000_000_000, 1_500_000_000, 3_000_000, 5_000_000);
    try std.testing.expect(!can_include);
}

test "canIncludeTx returns false for blob tx with insufficient gas fee" {
    const can_include = canIncludeTx(1_000_000_000, 1_500_000_000, 10_000_000, 5_000_000);
    try std.testing.expect(!can_include);
}

test "getGasTarget uses ELASTICITY_MULTIPLIER" {
    const gas_limit = 30_000_000;
    const target = getGasTarget(gas_limit);
    try std.testing.expectEqual(@as(u64, 15_000_000), target);
    try std.testing.expectEqual(gas_limit / ELASTICITY_MULTIPLIER, target);
}

test "nextBaseFee saturates at maxInt(u64) when the upward delta overflows" {
    const max = std.math.maxInt(u64);
    const target: u64 = 15_000_000;

    // Full block at the ceiling: +12.5% does not fit, so saturate (never freeze)
    try std.testing.expectEqual(@as(u64, max), nextBaseFee(max, 2 * target, target));
    try std.testing.expectEqual(@as(u64, max), nextBaseFee(max - 1, 2 * target, target));

    // Just below the ceiling with the minimum 1 wei bump: exact, no saturation
    try std.testing.expectEqual(@as(u64, max), nextBaseFee(max - 1, (1 << 62) + 1, 1 << 62));

    // Parent whose +12.5% overflows rises to the ceiling, above the parent
    const parent: u64 = max - max / 16;
    const next = nextBaseFee(parent, 2 * target, target);
    try std.testing.expectEqual(@as(u64, max), next);
    try std.testing.expect(next > parent);

    // Largest parent whose +12.5% still fits is exact: p + p / 8
    const fits: u64 = max / 9 * 8;
    try std.testing.expectEqual(fits + fits / 8, nextBaseFee(fits, 2 * target, target));

    // At target and below target are unaffected at the ceiling
    try std.testing.expectEqual(@as(u64, max), nextBaseFee(max, target, target));
    try std.testing.expectEqual(max - max / 8, nextBaseFee(max, 0, target));
}
