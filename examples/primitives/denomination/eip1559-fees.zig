const std = @import("std");
const primitives = @import("primitives");
const Denomination = primitives.Denomination;
const Wei = Denomination.Wei;
const Gwei = Denomination.Gwei;
const Ether = Denomination.Ether;
const U256 = Denomination.U256;

pub fn main() !void {
    std.debug.print("\n=== EIP-1559 Fee Calculations ===\n\n", .{});

    // Example 1: Basic EIP-1559 fee structure
    std.debug.print("1. EIP-1559 Fee Structure\n", .{});
    std.debug.print("   -----------------------\n", .{});

    const base_fee = Gwei.from_u256(U256.from_u64(30)); // 30 Gwei
    const priority_fee = Gwei.from_u256(U256.from_u64(2)); // 2 Gwei
    const max_fee = Gwei.from_u256(U256.from_u64(50)); // 50 Gwei
    const gas_limit = U256.from_u64(21_000);

    // Minimum cost (base fee only)
    const base_fee_wei = base_fee.to_wei();
    const min_cost_wei = base_fee_wei.value.wrapping_mul(gas_limit);
    const min_cost = Wei.from_u256(min_cost_wei);

    // Maximum cost (max fee)
    const max_fee_wei = max_fee.to_wei();
    const max_cost_wei = max_fee_wei.value.wrapping_mul(gas_limit);
    const max_cost = Wei.from_u256(max_cost_wei);

    // Estimated cost (base + priority)
    const priority_fee_wei = priority_fee.to_wei();
    const effective_fee_wei = base_fee_wei.value.wrapping_add(priority_fee_wei.value);
    const estimated_cost_wei = effective_fee_wei.wrapping_mul(gas_limit);
    const estimated_cost = Wei.from_u256(estimated_cost_wei);

    std.debug.print("   Base Fee: {} Gwei\n", .{base_fee.value});
    std.debug.print("   Priority Fee: {} Gwei\n", .{priority_fee.value});
    std.debug.print("   Max Fee: {} Gwei\n", .{max_fee.value});
    std.debug.print("   Gas Limit: {}\n", .{gas_limit});
    std.debug.print("\n", .{});
    std.debug.print("   Min Cost (base only): {} Gwei\n", .{min_cost.to_gwei().value});
    std.debug.print("   Estimated (base + priority): {} Gwei\n", .{estimated_cost.to_gwei().value});
    std.debug.print("   Max Cost (worst case): {} Gwei\n", .{max_cost.to_gwei().value});

    std.debug.print("\n", .{});

    // Example 2: Calculate effective gas price
    std.debug.print("2. Effective Gas Price\n", .{});
    std.debug.print("   --------------------\n", .{});

    const scenarios = [_]struct { name: []const u8, base: u64, priority: u64, max: u64 }{
        .{ .name = "Normal", .base = 30, .priority = 2, .max = 50 },
        .{ .name = "High base (capped)", .base = 45, .priority = 10, .max = 50 },
        .{ .name = "Low priority", .base = 30, .priority = 1, .max = 50 },
        .{ .name = "Generous tip", .base = 30, .priority = 15, .max = 100 },
    };

    for (scenarios) |scenario| {
        const base = U256.from_u64(scenario.base);
        const priority = U256.from_u64(scenario.priority);
        const max = U256.from_u64(scenario.max);

        // effectiveGasPrice = min(base + priority, max)
        const base_and_priority = base.wrapping_add(priority);
        const effective = if (base_and_priority.lte(max)) base_and_priority else max;

        std.debug.print("   {s}:\n", .{scenario.name});
        std.debug.print("     Base: {} Gwei, Priority: {} Gwei, Max: {} Gwei\n", .{ scenario.base, scenario.priority, scenario.max });
        std.debug.print("     Effective: {} Gwei\n", .{effective});
    }

    std.debug.print("\n", .{});

    // Example 3: Fee budgeting
    std.debug.print("3. Transaction Fee Budgeting\n", .{});
    std.debug.print("   --------------------------\n", .{});

    // 1 ETH balance
    const balance = Ether.from_u256(U256.from_u64(1)).to_wei();

    // 0.5 ETH transfer
    var transfer_limbs: [4]u64 = .{ 0x6f05b59d3b20000, 0, 0, 0 };
    const transfer_value = Wei.from_u256(U256.from_limbs(transfer_limbs));

    const max_fee_price = Gwei.from_u256(U256.from_u64(100));
    const gas_limit_budget = U256.from_u64(21_000);

    // Max possible gas cost
    const max_fee_wei_price = max_fee_price.to_wei();
    const max_gas_cost = max_fee_wei_price.value.wrapping_mul(gas_limit_budget);

    // Total required
    const total_required = transfer_value.value.wrapping_add(max_gas_cost);

    const can_afford = balance.value.gte(total_required);
    const remaining = if (can_afford) balance.value.sub(total_required) else U256.from_u64(0);

    std.debug.print("   Balance: {} Wei\n", .{balance.value});
    std.debug.print("   Transfer: {} Wei\n", .{transfer_value.value});
    std.debug.print("   Max Gas Fee: {} Gwei × {} gas\n", .{ max_fee_price.value, gas_limit_budget });
    std.debug.print("   Can afford: {s}\n", .{if (can_afford) "✓" else "✗"});
    std.debug.print("   Remaining: {} Wei\n", .{remaining});

    std.debug.print("\n", .{});

    // Example 4: Miner tip percentage
    std.debug.print("4. Miner Tip Analysis\n", .{});
    std.debug.print("   -------------------\n", .{});

    const tip_scenarios = [_]struct { base: u64, priority: u64 }{
        .{ .base = 30, .priority = 1 },
        .{ .base = 30, .priority = 2 },
        .{ .base = 30, .priority = 5 },
        .{ .base = 30, .priority = 10 },
    };

    const gas_used = U256.from_u64(21_000);

    for (tip_scenarios) |scenario| {
        const base_gwei = Gwei.from_u256(U256.from_u64(scenario.base));
        const priority_gwei = Gwei.from_u256(U256.from_u64(scenario.priority));

        const base_wei = base_gwei.to_wei();
        const priority_wei = priority_gwei.to_wei();

        const base_paid = base_wei.value.wrapping_mul(gas_used);
        const tip_paid = priority_wei.value.wrapping_mul(gas_used);

        const total = base_paid.wrapping_add(tip_paid);

        std.debug.print("   Base: {} Gwei, Priority: {} Gwei\n", .{ scenario.base, scenario.priority });
        std.debug.print("     Base Fee Paid: {} Wei\n", .{base_paid});
        std.debug.print("     Tip Paid: {} Wei\n", .{tip_paid});

        // Calculate percentage (simplified - actual percentage would need float division)
        if (total.gt(U256.from_u64(0))) {
            const tip_pct_numerator = tip_paid.wrapping_mul(U256.from_u64(10000));
            const tip_pct = tip_pct_numerator.div_rem(total).quotient;
            std.debug.print("     Tip %: {} basis points\n", .{tip_pct});
        }
    }

    std.debug.print("\n", .{});

    // Example 5: Fee savings calculation
    std.debug.print("5. Fee Savings (Legacy vs EIP-1559)\n", .{});
    std.debug.print("   ----------------------------------\n", .{});

    const legacy_gas_price = Gwei.from_u256(U256.from_u64(50));
    const eip1559_base = Gwei.from_u256(U256.from_u64(30));
    const eip1559_priority = Gwei.from_u256(U256.from_u64(2));

    const legacy_wei = legacy_gas_price.to_wei();
    const legacy_cost = legacy_wei.value.wrapping_mul(gas_used);

    const eip1559_base_wei = eip1559_base.to_wei();
    const eip1559_priority_wei = eip1559_priority.to_wei();
    const eip1559_effective = eip1559_base_wei.value.wrapping_add(eip1559_priority_wei.value);
    const eip1559_cost = eip1559_effective.wrapping_mul(gas_used);

    const savings = legacy_cost.sub(eip1559_cost);

    std.debug.print("   Legacy (50 Gwei): {} Wei total\n", .{legacy_cost});
    std.debug.print("   EIP-1559 (30+2): {} Wei total\n", .{eip1559_cost});
    std.debug.print("   Savings: {} Wei\n", .{savings});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
