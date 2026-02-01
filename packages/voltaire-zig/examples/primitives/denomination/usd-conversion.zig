const std = @import("std");
const primitives = @import("primitives");
const Denomination = primitives.Denomination;
const Wei = Denomination.Wei;
const Gwei = Denomination.Gwei;
const Ether = Denomination.Ether;
const U256 = Denomination.U256;

pub fn main() !void {
    std.debug.print("\n=== USD Price Conversions ===\n\n", .{});

    // Example 1: Wei to USD conversion (simplified - using integer math)
    std.debug.print("1. Converting Wei to USD\n", .{});
    std.debug.print("   ----------------------\n", .{});

    const eth_price: u64 = 2000; // $2000 per ETH

    const balances = [_]Wei{
        Ether.from_u256(U256.from_u64(1)).to_wei(), // 1 ETH
        Wei.from_u256(U256.from_u64(500_000_000_000_000_000)), // 0.5 ETH
        Wei.from_u256(U256.from_u64(100_000_000_000_000_000)), // 0.1 ETH
    };

    std.debug.print("   ETH Price: ${}\n", .{eth_price});

    for (balances) |balance| {
        // Simple conversion: (wei / 1e18) * ethPrice
        // For integer math, we'll show the Wei value and calculated USD (simplified)
        const eth_whole = balance.to_ether();
        const usd_value = eth_whole.value.wrapping_mul(U256.from_u64(eth_price));

        std.debug.print("   {} Wei ≈ ${} USD (whole ETH only)\n", .{ balance.value, usd_value });
    }

    std.debug.print("\n", .{});

    // Example 2: Gas cost in USD
    std.debug.print("2. Gas Cost in USD\n", .{});
    std.debug.print("   ----------------\n", .{});

    const operations = [_]struct { name: []const u8, gas: u64 }{
        .{ .name = "Transfer", .gas = 21_000 },
        .{ .name = "ERC-20 Transfer", .gas = 65_000 },
        .{ .name = "Uniswap Swap", .gas = 150_000 },
    };

    const gas_prices = [_]struct { name: []const u8, gwei: u64 }{
        .{ .name = "Slow", .gwei = 20 },
        .{ .name = "Standard", .gwei = 50 },
        .{ .name = "Fast", .gwei = 100 },
    };

    for (operations) |op| {
        std.debug.print("   {s} ({} gas):\n", .{ op.name, op.gas });

        for (gas_prices) |price| {
            const gas_price = Gwei.from_u256(U256.from_u64(price.gwei));
            const gas_price_wei = gas_price.to_wei();
            const gas_used = U256.from_u64(op.gas);

            const cost_wei = gas_price_wei.value.wrapping_mul(gas_used);
            const cost = Wei.from_u256(cost_wei);

            // Convert to ETH for USD calculation (simplified)
            const cost_eth = cost.to_ether();

            std.debug.print("     {s} ({} Gwei): {} Wei\n", .{ price.name, price.gwei, cost.value });
        }
    }

    std.debug.print("\n", .{});

    // Example 3: Price comparison
    std.debug.print("3. Transaction Cost at Different ETH Prices\n", .{});
    std.debug.print("   -----------------------------------------\n", .{});

    // 0.00105 ETH (21k @ 50 Gwei)
    const tx_cost = Wei.from_u256(U256.from_u64(1_050_000_000_000_000));

    const eth_prices = [_]u64{ 1000, 2000, 3000, 4000, 5000 };

    std.debug.print("   Transaction cost: {} Wei\n", .{tx_cost.value});
    std.debug.print("   At different ETH prices:\n", .{});

    for (eth_prices) |price| {
        // Simplified USD calculation
        std.debug.print("     ETH = ${}: ~${} USD (approx)\n", .{ price, @divFloor(price * 105, 100000) });
    }

    std.debug.print("\n", .{});

    // Example 4: Monthly gas budget
    std.debug.print("4. Monthly Gas Budget Analysis\n", .{});
    std.debug.print("   ----------------------------\n", .{});

    const monthly_transfers: u64 = 10;
    const monthly_token_transfers: u64 = 20;
    const monthly_swaps: u64 = 5;

    const avg_gas_price = Gwei.from_u256(U256.from_u64(50));
    const avg_gas_price_wei = avg_gas_price.to_wei();

    // Calculate costs
    const transfer_gas = U256.from_u64(21_000);
    const token_gas = U256.from_u64(65_000);
    const swap_gas = U256.from_u64(150_000);

    const transfer_cost = avg_gas_price_wei.value.wrapping_mul(transfer_gas);
    const token_cost = avg_gas_price_wei.value.wrapping_mul(token_gas);
    const swap_cost = avg_gas_price_wei.value.wrapping_mul(swap_gas);

    const total_transfer_cost = transfer_cost.wrapping_mul(U256.from_u64(monthly_transfers));
    const total_token_cost = token_cost.wrapping_mul(U256.from_u64(monthly_token_transfers));
    const total_swap_cost = swap_cost.wrapping_mul(U256.from_u64(monthly_swaps));

    std.debug.print("   ETH Price: ${}\n", .{eth_price});
    std.debug.print("   Avg Gas Price: {} Gwei\n", .{avg_gas_price.value});
    std.debug.print("\n", .{});
    std.debug.print("   Monthly Activity:\n", .{});
    std.debug.print("     {} transfers: {} Wei total\n", .{ monthly_transfers, total_transfer_cost });
    std.debug.print("     {} token transfers: {} Wei total\n", .{ monthly_token_transfers, total_token_cost });
    std.debug.print("     {} swaps: {} Wei total\n", .{ monthly_swaps, total_swap_cost });

    const total_monthly = total_transfer_cost.wrapping_add(total_token_cost).wrapping_add(total_swap_cost);
    std.debug.print("   Total Monthly Cost: {} Wei\n", .{total_monthly});

    std.debug.print("\n", .{});

    // Example 5: Cost comparison matrix
    std.debug.print("5. Gas Cost Matrix\n", .{});
    std.debug.print("   ----------------\n", .{});

    std.debug.print("   Gas Price | 21k Transfer  | 65k Token     | 150k Swap\n", .{});
    std.debug.print("   ----------|---------------|---------------|-------------\n", .{});

    for (gas_prices) |price| {
        const price_gwei = Gwei.from_u256(U256.from_u64(price.gwei));
        const price_wei = price_gwei.to_wei();

        const transfer = price_wei.value.wrapping_mul(U256.from_u64(21_000));
        const token = price_wei.value.wrapping_mul(U256.from_u64(65_000));
        const swap = price_wei.value.wrapping_mul(U256.from_u64(150_000));

        std.debug.print("   {d:9} | {d:13} | {d:13} | {d:13}\n", .{ price.gwei, transfer, token, swap });
    }

    std.debug.print("\n", .{});

    // Example 6: ROI analysis
    std.debug.print("6. Transaction ROI Analysis\n", .{});
    std.debug.print("   -------------------------\n", .{});

    // Arbitrage: 0.1 ETH profit, 300k gas @ 100 Gwei
    const arb_gas_price = Gwei.from_u256(U256.from_u64(100));
    const arb_gas_used = U256.from_u64(300_000);
    const arb_profit = Wei.from_u256(U256.from_u64(100_000_000_000_000_000)); // 0.1 ETH

    const arb_gas_cost_wei = arb_gas_price.to_wei().value.wrapping_mul(arb_gas_used);
    const arb_gas_cost = Wei.from_u256(arb_gas_cost_wei);

    const arb_profitable = arb_profit.value.gt(arb_gas_cost.value);

    std.debug.print("   Arbitrage opportunity:\n", .{});
    std.debug.print("     Gas cost: {} Wei\n", .{arb_gas_cost.value});
    std.debug.print("     Profit: {} Wei\n", .{arb_profit.value});
    std.debug.print("     Net profit: {} Wei\n", .{arb_profit.value.sub(arb_gas_cost.value)});
    std.debug.print("     Worth it: {s}\n", .{if (arb_profitable) "✓" else "✗"});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
