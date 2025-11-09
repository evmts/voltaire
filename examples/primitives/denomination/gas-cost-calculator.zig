const std = @import("std");
const primitives = @import("primitives");
const Denomination = primitives.Denomination;
const Wei = Denomination.Wei;
const Gwei = Denomination.Gwei;
const Ether = Denomination.Ether;
const U256 = Denomination.U256;

pub fn main() !void {
    std.debug.print("\n=== Gas Cost Calculator ===\n\n", .{});

    // Example 1: Basic gas cost calculation
    std.debug.print("1. Basic Transfer (21,000 gas)\n", .{});
    std.debug.print("   -----------------------------\n", .{});

    const gas_used = U256.from_u64(21_000);

    const gas_prices = [_]struct { name: []const u8, gwei: u64 }{
        .{ .name = "Slow", .gwei = 20 },
        .{ .name = "Standard", .gwei = 50 },
        .{ .name = "Fast", .gwei = 100 },
        .{ .name = "Urgent", .gwei = 200 },
    };

    for (gas_prices) |price_info| {
        const gas_price = Gwei.from_u256(U256.from_u64(price_info.gwei));
        const gas_price_wei = gas_price.to_wei();

        // Calculate: gasPrice * gasUsed
        const cost_wei = gas_price_wei.value.wrapping_mul(gas_used);
        const cost = Wei.from_u256(cost_wei);
        const cost_gwei = cost.to_gwei();

        std.debug.print("   {s} ({} Gwei):\n", .{ price_info.name, price_info.gwei });
        std.debug.print("     Cost: {} Wei\n", .{cost.value});
        std.debug.print("     Cost: {} Gwei\n", .{cost_gwei.value});
    }

    std.debug.print("\n", .{});

    // Example 2: ERC-20 token transfer
    std.debug.print("2. ERC-20 Token Transfer (65,000 gas)\n", .{});
    std.debug.print("   ------------------------------------\n", .{});

    const token_gas_used = U256.from_u64(65_000);

    for (gas_prices) |price_info| {
        const gas_price = Gwei.from_u256(U256.from_u64(price_info.gwei));
        const gas_price_wei = gas_price.to_wei();
        const cost_wei = gas_price_wei.value.wrapping_mul(token_gas_used);
        const cost = Wei.from_u256(cost_wei);

        std.debug.print("   {s}: {} Wei\n", .{ price_info.name, cost.value });
    }

    std.debug.print("\n", .{});

    // Example 3: Complex DEX swap
    std.debug.print("3. Uniswap Swap (150,000 gas)\n", .{});
    std.debug.print("   ---------------------------\n", .{});

    const swap_gas_used = U256.from_u64(150_000);

    for (gas_prices) |price_info| {
        const gas_price = Gwei.from_u256(U256.from_u64(price_info.gwei));
        const gas_price_wei = gas_price.to_wei();
        const cost_wei = gas_price_wei.value.wrapping_mul(swap_gas_used);
        const cost = Wei.from_u256(cost_wei);

        std.debug.print("   {s}: {} Wei\n", .{ price_info.name, cost.value });
    }

    std.debug.print("\n", .{});

    // Example 4: Total transaction cost (value + gas)
    std.debug.print("4. Total Transaction Cost\n", .{});
    std.debug.print("   -----------------------\n", .{});

    const transfer_value = Ether.from_u256(U256.from_u64(1)).to_wei(); // 1 ETH
    const gas_price = Gwei.from_u256(U256.from_u64(50));
    const gas_price_wei = gas_price.to_wei();
    const gas_cost = Wei.from_u256(gas_price_wei.value.wrapping_mul(gas_used));

    const total_cost = Wei.from_u256(transfer_value.value.wrapping_add(gas_cost.value));

    std.debug.print("   Transfer value: 1 ETH\n", .{});
    std.debug.print("   Gas cost: {} Wei\n", .{gas_cost.value});
    std.debug.print("   Total cost: {} Wei\n", .{total_cost.value});
    std.debug.print("\n", .{});

    // Example 5: Balance check
    std.debug.print("5. Sufficient Balance Check\n", .{});
    std.debug.print("   -------------------------\n", .{});

    // 2 ETH balance
    var balance_limbs: [4]u64 = .{ 0x1bc16d674ec80000, 0, 0, 0 };
    const balance = Wei.from_u256(U256.from_limbs(balance_limbs));

    const value = Ether.from_u256(U256.from_u64(1)).to_wei(); // 1 ETH

    const required = value.value.wrapping_add(gas_cost.value);
    const sufficient = balance.value.gte(required);

    std.debug.print("   Balance: {} Wei\n", .{balance.value});
    std.debug.print("   Value: {} Wei\n", .{value.value});
    std.debug.print("   Gas: {} Wei\n", .{gas_cost.value});
    std.debug.print("   Can send: {s}\n", .{if (sufficient) "✓" else "✗"});
    std.debug.print("\n", .{});

    // Example 6: Gas price recommendations
    std.debug.print("6. Gas Price Recommendations\n", .{});
    std.debug.print("   --------------------------\n", .{});

    const current_base_fee: u64 = 40; // 40 Gwei base fee

    const safe = @as(u64, @intFromFloat(@ceil(@as(f64, @floatFromInt(current_base_fee)) * 1.2)));
    const standard = @as(u64, @intFromFloat(@ceil(@as(f64, @floatFromInt(current_base_fee)) * 1.5)));
    const fast = current_base_fee * 2;
    const instant = current_base_fee * 3;

    std.debug.print("   Current base fee: {} Gwei\n", .{current_base_fee});
    std.debug.print("   Safe: {} Gwei\n", .{safe});
    std.debug.print("   Standard: {} Gwei\n", .{standard});
    std.debug.print("   Fast: {} Gwei\n", .{fast});
    std.debug.print("   Instant: {} Gwei\n", .{instant});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
