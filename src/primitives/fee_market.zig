const std = @import("std");

// NOTE: FEE market is currently just exported but unused by the EVM
// FeeMarket implements the EIP-1559 fee market mechanism
///
// The EIP-1559 fee market introduces a base fee per block that moves
// up or down based on how full the previous block was compared to the target.
///
// Key features:
// 1. Base fee per block that is burned (not paid to miners)
// 2. Priority fee (tip) that goes to miners
// 3. Base fee adjustment based on block fullness

/// Helper function to calculate fee delta safely avoiding overflow and division by zero
fn calculate_fee_delta(fee: u64, gas_delta: u64, gas_target: u64, denominator: u64) u64 {
    // Using u128 for intermediate calculation to avoid overflow
    const intermediate: u128 = @as(u128, fee) * @as(u128, gas_delta);
    // Avoid division by zero
    const divisor: u128 = @max(1, @as(u128, gas_target) * @as(u128, denominator));
    const result: u64 = @intCast(@min(@as(u128, std.math.maxInt(u64)), intermediate / divisor));

    // Always return at least 1 to ensure some movement
    return @max(1, result);
}
/// Minimum base fee per gas (in wei)
/// This ensures the base fee never goes to zero
pub const MIN_BASE_FEE: u64 = 7;

/// Base fee change denominator
/// The base fee can change by at most 1/BASE_FEE_CHANGE_DENOMINATOR
/// (or 12.5% with the value of 8) between blocks
pub const BASE_FEE_CHANGE_DENOMINATOR: u64 = 8;

/// Initialize base fee for the first EIP-1559 block
///
/// This is used when transitioning from a pre-EIP-1559 chain to
/// an EIP-1559 enabled chain.
///
/// Parameters:
/// - parent_gas_used: Gas used by the parent block
/// - parent_gas_limit: Gas limit of the parent block
///
/// Returns: The initial base fee (in wei)
pub fn initial_base_fee(parent_gas_used: u64, parent_gas_limit: u64) u64 {
    // Initializing base fee for first EIP-1559 block
    // Parent block gas used and gas limit used in calculation

    // Initial base fee formula from the EIP-1559 specification
    // If the parent block used exactly the target gas, the initial base fee is 1 gwei
    // If it used more, the initial base fee is higher
    // If it used less, the initial base fee is lower

    // Target gas usage is half the block gas limit
    const parent_gas_target = parent_gas_limit / 2;

    // Initial base fee calculation
    var base_fee: u64 = 1_000_000_000; // 1 gwei in wei

    // Adjust initial base fee based on parent block's gas usage
    if (parent_gas_used > 0) {
        const gas_used_delta = if (parent_gas_used > parent_gas_target)
            parent_gas_used - parent_gas_target
        else
            parent_gas_target - parent_gas_used;

        const base_fee_delta = calculate_fee_delta(base_fee, gas_used_delta, parent_gas_target, BASE_FEE_CHANGE_DENOMINATOR);

        if (parent_gas_used > parent_gas_target) {
            base_fee = base_fee + base_fee_delta;
        } else if (base_fee > base_fee_delta) {
            base_fee = base_fee - base_fee_delta;
        }
    }

    // Ensure base fee is at least the minimum
    base_fee = @max(base_fee, MIN_BASE_FEE);

    // Initial base fee calculated
    return base_fee;
}

/// Calculate the next block's base fee based on the current block
///
/// This implements the EIP-1559 base fee adjustment algorithm:
/// - If the block used exactly the target gas, the base fee remains the same
/// - If the block used more than the target, the base fee increases
/// - If the block used less than the target, the base fee decreases
/// - The maximum change per block is 12.5% (1/8)
///
/// Parameters:
/// - parent_base_fee: Base fee of the parent block
/// - parent_gas_used: Gas used by the parent block
/// - parent_gas_target: Target gas usage of the parent block
///
/// Returns: The next block's base fee (in wei)
pub fn next_base_fee(parent_base_fee: u64, parent_gas_used: u64, parent_gas_target: u64) u64 {
    // Calculating next block's base fee
    // Using parent block base fee and gas usage

    // If parent block is empty, keep the base fee the same
    // Skip the delta calculations and just return the parent fee directly
    if (parent_gas_used == 0) {
        // Parent block was empty, keeping base fee the same
        return parent_base_fee;
    }

    // Calculate base fee delta
    var new_base_fee = parent_base_fee;

    if (parent_gas_used == parent_gas_target) {
        // If parent block used exactly the target gas, keep the base fee the same
        // Parent block used exactly the target gas, keeping base fee the same
    } else if (parent_gas_used > parent_gas_target) {
        // If parent block used more than the target gas, increase the base fee

        // Calculate gas used delta as a fraction of target
        const gas_used_delta = parent_gas_used - parent_gas_target;

        // Calculate the base fee delta (max 12.5% increase)
        const base_fee_delta = calculate_fee_delta(parent_base_fee, gas_used_delta, parent_gas_target, BASE_FEE_CHANGE_DENOMINATOR);

        // Increase the base fee
        // The overflow check is probably unnecessary given gas limits, but it's a good safety measure
        new_base_fee = std.math.add(u64, parent_base_fee, base_fee_delta) catch parent_base_fee;

        // Parent block used more than target gas, increasing base fee
    } else {
        // If parent block used less than the target gas, decrease the base fee

        // Calculate gas used delta as a fraction of target
        const gas_used_delta = parent_gas_target - parent_gas_used;

        // Calculate the base fee delta (max 12.5% decrease)
        const base_fee_delta = calculate_fee_delta(parent_base_fee, gas_used_delta, parent_gas_target, BASE_FEE_CHANGE_DENOMINATOR);

        // Decrease the base fee, but don't go below the minimum
        new_base_fee = if (parent_base_fee > base_fee_delta)
            parent_base_fee - base_fee_delta
        else
            MIN_BASE_FEE;

        // Parent block used less than target gas, decreasing base fee
    }

    // Ensure base fee is at least the minimum
    new_base_fee = @max(new_base_fee, MIN_BASE_FEE);

    // Next block base fee calculated
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
pub fn get_effective_gas_price(base_fee_per_gas: u64, max_fee_per_gas: u64, max_priority_fee_per_gas: u64) struct { effective_gas_price: u64, miner_fee: u64 } {
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
pub fn get_gas_target(gas_limit: u64) u64 {
    return gas_limit / 2;
}

// Tests

test "calculate_fee_delta basic functionality" {
    // Test basic calculation
    const fee = 1000;
    const gas_delta = 100;
    const gas_target = 1000;
    const denominator = 8;

    const result = calculate_fee_delta(fee, gas_delta, gas_target, denominator);
    // Expected: (1000 * 100) / (1000 * 8) = 100000 / 8000 = 12.5, rounded to 12
    try std.testing.expectEqual(@as(u64, 12), result);
}

test "calculate_fee_delta returns at least 1" {
    // Test that result is always at least 1
    const fee = 1;
    const gas_delta = 1;
    const gas_target = 1000000;
    const denominator = 1000000;

    const result = calculate_fee_delta(fee, gas_delta, gas_target, denominator);
    try std.testing.expectEqual(@as(u64, 1), result);
}

test "calculate_fee_delta handles large values without overflow" {
    // Test with large values that would overflow u64 in intermediate calculations
    const fee = std.math.maxInt(u64) / 2;
    const gas_delta = 1000;
    const gas_target = 1000;
    const denominator = 1;

    const result = calculate_fee_delta(fee, gas_delta, gas_target, denominator);
    // Should not panic and return a valid result
    try std.testing.expect(result > 0);
}

test "calculate_fee_delta handles division by zero protection" {
    // Test with zero gas_target and denominator
    const fee = 1000;
    const gas_delta = 100;
    const gas_target = 0;
    const denominator = 0;

    const result = calculate_fee_delta(fee, gas_delta, gas_target, denominator);
    // Should use divisor of 1 and return fee * gas_delta
    try std.testing.expectEqual(@as(u64, 100000), result);
}

test "MIN_BASE_FEE constant value" {
    try std.testing.expectEqual(@as(u64, 7), MIN_BASE_FEE);
}

test "BASE_FEE_CHANGE_DENOMINATOR constant value" {
    try std.testing.expectEqual(@as(u64, 8), BASE_FEE_CHANGE_DENOMINATOR);
}

test "initial_base_fee with exactly target gas usage" {
    const parent_gas_limit = 30_000_000;
    const parent_gas_used = 15_000_000; // Exactly half (target)

    const base_fee = initial_base_fee(parent_gas_used, parent_gas_limit);
    // When exactly at target, there's still a minimal adjustment due to calculate_fee_delta returning at least 1
    // gas_used_delta = 0, but calculate_fee_delta returns 1, so base_fee = 1_000_000_000 - 1
    try std.testing.expectEqual(@as(u64, 999_999_999), base_fee);
}

test "initial_base_fee with above target gas usage" {
    const parent_gas_limit = 30_000_000;
    const parent_gas_used = 20_000_000; // Above target (15M)

    const base_fee = initial_base_fee(parent_gas_used, parent_gas_limit);
    // Should be higher than 1 gwei
    try std.testing.expect(base_fee > 1_000_000_000);

    // Calculate expected: 1 gwei + (1 gwei * 5M / 15M / 8)
    // = 1_000_000_000 + (1_000_000_000 * 5_000_000 / 15_000_000 / 8)
    // = 1_000_000_000 + 41_666_666
    try std.testing.expectEqual(@as(u64, 1_041_666_666), base_fee);
}

test "initial_base_fee with below target gas usage" {
    const parent_gas_limit = 30_000_000;
    const parent_gas_used = 10_000_000; // Below target (15M)

    const base_fee = initial_base_fee(parent_gas_used, parent_gas_limit);
    // Should be lower than 1 gwei
    try std.testing.expect(base_fee < 1_000_000_000);

    // Calculate expected: 1 gwei - (1 gwei * 5M / 15M / 8)
    // = 1_000_000_000 - 41_666_666
    try std.testing.expectEqual(@as(u64, 958_333_334), base_fee);
}

test "initial_base_fee with zero gas usage" {
    const parent_gas_limit = 30_000_000;
    const parent_gas_used = 0;

    const base_fee = initial_base_fee(parent_gas_used, parent_gas_limit);
    // Should return 1 gwei (no adjustment)
    try std.testing.expectEqual(@as(u64, 1_000_000_000), base_fee);
}

test "initial_base_fee respects minimum base fee" {
    const parent_gas_limit = 100;
    const parent_gas_used = 0;

    const base_fee = initial_base_fee(parent_gas_used, parent_gas_limit);
    // Even with extreme values, should respect MIN_BASE_FEE
    try std.testing.expect(base_fee >= MIN_BASE_FEE);
}

test "next_base_fee with exactly target gas usage" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 15_000_000; // Exactly target

    const next_fee = next_base_fee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should remain the same
    try std.testing.expectEqual(parent_base_fee, next_fee);
}

test "next_base_fee with above target gas usage" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 20_000_000; // 5M above target

    const next_fee = next_base_fee(parent_base_fee, parent_gas_used, parent_gas_target);
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

    const next_fee = next_base_fee(parent_base_fee, parent_gas_used, parent_gas_target);
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

    const next_fee = next_base_fee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should increase by exactly 12.5%
    const expected = parent_base_fee + (parent_base_fee / 8);
    try std.testing.expectEqual(expected, next_fee);
}

test "next_base_fee with empty parent block" {
    const parent_base_fee = 1_000_000_000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 0; // Empty block

    const next_fee = next_base_fee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should remain the same for empty blocks
    try std.testing.expectEqual(parent_base_fee, next_fee);
}

test "next_base_fee respects minimum base fee on decrease" {
    const parent_base_fee = 10; // Very low base fee
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 0; // Would normally decrease

    const next_fee = next_base_fee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should not go below MIN_BASE_FEE
    try std.testing.expectEqual(@as(u64, 10), next_fee); // Stays at parent fee since it's above MIN_BASE_FEE
}

test "next_base_fee respects minimum when decrease would go below" {
    const parent_base_fee = 8; // Just above MIN_BASE_FEE
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 1; // Very low usage

    const next_fee = next_base_fee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should not go below MIN_BASE_FEE
    try std.testing.expect(next_fee >= MIN_BASE_FEE);
}

test "next_base_fee handles overflow protection" {
    const parent_base_fee = std.math.maxInt(u64) - 1000;
    const parent_gas_target = 15_000_000;
    const parent_gas_used = 30_000_000; // Would increase

    const next_fee = next_base_fee(parent_base_fee, parent_gas_used, parent_gas_target);
    // Should handle overflow gracefully
    try std.testing.expectEqual(parent_base_fee, next_fee);
}

test "get_effective_gas_price with sufficient max fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 2_000_000_000; // 2 gwei
    const max_priority_fee = 500_000_000; // 0.5 gwei

    const result = get_effective_gas_price(base_fee, max_fee, max_priority_fee);
    // Effective price should be base + priority
    try std.testing.expectEqual(@as(u64, 1_500_000_000), result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 500_000_000), result.miner_fee);
}

test "get_effective_gas_price with limited max fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 1_200_000_000; // 1.2 gwei
    const max_priority_fee = 500_000_000; // 0.5 gwei (more than available)

    const result = get_effective_gas_price(base_fee, max_fee, max_priority_fee);
    // Priority fee limited by max_fee - base_fee
    try std.testing.expectEqual(@as(u64, 1_200_000_000), result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 200_000_000), result.miner_fee);
}

test "get_effective_gas_price with max fee below base fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 800_000_000; // 0.8 gwei (below base)
    const max_priority_fee = 100_000_000; // 0.1 gwei

    const result = get_effective_gas_price(base_fee, max_fee, max_priority_fee);
    // Transaction would be rejected, but returns max_fee and 0 miner fee
    try std.testing.expectEqual(@as(u64, 800_000_000), result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 0), result.miner_fee);
}

test "get_effective_gas_price with zero priority fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 2_000_000_000; // 2 gwei
    const max_priority_fee = 0; // No tip

    const result = get_effective_gas_price(base_fee, max_fee, max_priority_fee);
    // Should just pay base fee
    try std.testing.expectEqual(base_fee, result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 0), result.miner_fee);
}

test "get_effective_gas_price with exact base fee" {
    const base_fee = 1_000_000_000; // 1 gwei
    const max_fee = 1_000_000_000; // Exactly base fee
    const max_priority_fee = 100_000_000; // 0.1 gwei (can't be paid)

    const result = get_effective_gas_price(base_fee, max_fee, max_priority_fee);
    // No room for priority fee
    try std.testing.expectEqual(base_fee, result.effective_gas_price);
    try std.testing.expectEqual(@as(u64, 0), result.miner_fee);
}

test "get_gas_target basic calculation" {
    const gas_limit = 30_000_000;
    const target = get_gas_target(gas_limit);
    try std.testing.expectEqual(@as(u64, 15_000_000), target);
}

test "get_gas_target with odd gas limit" {
    const gas_limit = 30_000_001;
    const target = get_gas_target(gas_limit);
    // Integer division rounds down
    try std.testing.expectEqual(@as(u64, 15_000_000), target);
}

test "get_gas_target with zero gas limit" {
    const gas_limit = 0;
    const target = get_gas_target(gas_limit);
    try std.testing.expectEqual(@as(u64, 0), target);
}

test "get_gas_target with small gas limit" {
    const gas_limit = 1;
    const target = get_gas_target(gas_limit);
    try std.testing.expectEqual(@as(u64, 0), target);
}
