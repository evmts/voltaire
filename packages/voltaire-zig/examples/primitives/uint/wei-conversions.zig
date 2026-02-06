//! Wei and Ether Conversions Example
//!
//! Demonstrates:
//! - Converting between wei, gwei, and ether
//! - Working with ETH denominations
//! - Gas price calculations
//! - Transaction cost calculations

const std = @import("std");
const primitives = @import("primitives");
const Uint = primitives.Uint;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Wei and Ether Conversions Example ===\n\n", .{});

    // Constants for Ethereum denominations
    const WEI_PER_GWEI: u256 = std.math.pow(u256, 10, 9); // 10^9
    const WEI_PER_ETHER: u256 = std.math.pow(u256, 10, 18); // 10^18

    // 1. Basic conversions
    std.debug.print("1. Basic Denomination Conversions\n", .{});
    std.debug.print("   ------------------------------\n", .{});

    std.debug.print("   1 Ether = {} wei\n", .{WEI_PER_ETHER});
    std.debug.print("   1 Gwei  = {} wei\n\n", .{WEI_PER_GWEI});

    // Convert various amounts
    const amounts = [_]struct { wei: u256, desc: []const u8 }{
        .{ .wei = 1_000_000_000, .desc = "1 gwei" },
        .{ .wei = 1_000_000_000_000_000_000, .desc = "1 ether" },
        .{ .wei = 250_000_000_000_000_000, .desc = "0.25 ether" },
    };

    for (amounts) |amount| {
        const gwei = amount.wei / WEI_PER_GWEI;
        const ether_f = @as(f64, @floatFromInt(amount.wei)) / @as(f64, @floatFromInt(WEI_PER_ETHER));

        std.debug.print("   {s}:\n", .{amount.desc});
        std.debug.print("   - Wei:   {}\n", .{amount.wei});
        std.debug.print("   - Gwei:  {}\n", .{gwei});
        std.debug.print("   - Ether: {d:.6}\n\n", .{ether_f});
    }

    // 2. Gas price calculations
    std.debug.print("2. Gas Price Calculations\n", .{});
    std.debug.print("   ---------------------\n", .{});

    const gas_price_gwei: u256 = 50;
    const gas_price_wei = gas_price_gwei * WEI_PER_GWEI;

    std.debug.print("   Gas price: {} gwei\n", .{gas_price_gwei});
    std.debug.print("   Gas price: {} wei\n\n", .{gas_price_wei});

    // Calculate costs for different transaction types
    const simple_transfer_gas: u256 = 21_000;
    const erc20_transfer_gas: u256 = 65_000;
    const uniswap_swap_gas: u256 = 150_000;

    const transfers = [_]struct { name: []const u8, gas: u256 }{
        .{ .name = "Simple transfer", .gas = simple_transfer_gas },
        .{ .name = "ERC20 transfer", .gas = erc20_transfer_gas },
        .{ .name = "Uniswap swap", .gas = uniswap_swap_gas },
    };

    for (transfers) |transfer| {
        const cost = transfer.gas * gas_price_wei;
        const cost_ether = @as(f64, @floatFromInt(cost)) / @as(f64, @floatFromInt(WEI_PER_ETHER));
        const cost_gwei = cost / WEI_PER_GWEI;

        std.debug.print("   {s}:\n", .{transfer.name});
        std.debug.print("   - Gas used: {}\n", .{transfer.gas});
        std.debug.print("   - Cost: {d:.6} ETH ({} gwei)\n\n", .{ cost_ether, cost_gwei });
    }

    // 3. EIP-1559 transaction costs
    std.debug.print("3. EIP-1559 Transaction Costs\n", .{});
    std.debug.print("   -------------------------\n", .{});

    const base_fee_gwei: u256 = 30;
    const priority_fee_gwei: u256 = 2;
    const max_fee_gwei: u256 = 50;

    const base_fee_wei = base_fee_gwei * WEI_PER_GWEI;
    const priority_fee_wei = priority_fee_gwei * WEI_PER_GWEI;
    const max_fee_wei = max_fee_gwei * WEI_PER_GWEI;

    std.debug.print("   Base fee: {} gwei\n", .{base_fee_gwei});
    std.debug.print("   Priority fee: {} gwei\n", .{priority_fee_gwei});
    std.debug.print("   Max fee: {} gwei\n\n", .{max_fee_gwei});

    // Effective gas price = min(maxFeePerGas, baseFee + priorityFee)
    const effective_fee = @min(max_fee_wei, base_fee_wei + priority_fee_wei);
    const effective_fee_gwei = effective_fee / WEI_PER_GWEI;

    std.debug.print("   Effective gas price: {} gwei\n\n", .{effective_fee_gwei});

    const tx_gas: u256 = 21_000;
    const tx_cost = tx_gas * effective_fee;
    const tx_cost_ether = @as(f64, @floatFromInt(tx_cost)) / @as(f64, @floatFromInt(WEI_PER_ETHER));

    std.debug.print("   Transaction cost:\n", .{});
    std.debug.print("   - Gas used: {}\n", .{tx_gas});
    std.debug.print("   - Total cost: {d:.6} ETH\n\n", .{tx_cost_ether});

    // 4. Wallet balance calculations
    std.debug.print("4. Wallet Balance Calculations\n", .{});
    std.debug.print("   --------------------------\n", .{});

    const balance: u256 = @as(u256, @intFromFloat(5.5 * @as(f64, @floatFromInt(WEI_PER_ETHER))));
    const tx_value: u256 = 1 * WEI_PER_ETHER;
    const tx_gas_cost: u256 = 21_000 * (50 * WEI_PER_GWEI);

    const balance_ether = @as(f64, @floatFromInt(balance)) / @as(f64, @floatFromInt(WEI_PER_ETHER));
    const tx_value_ether = @as(f64, @floatFromInt(tx_value)) / @as(f64, @floatFromInt(WEI_PER_ETHER));
    const tx_gas_ether = @as(f64, @floatFromInt(tx_gas_cost)) / @as(f64, @floatFromInt(WEI_PER_ETHER));

    std.debug.print("   Current balance: {d:.6} ETH\n", .{balance_ether});
    std.debug.print("   Transaction amount: {d:.6} ETH\n", .{tx_value_ether});
    std.debug.print("   Gas cost: {d:.6} ETH\n\n", .{tx_gas_ether});

    const total_cost = tx_value + tx_gas_cost;
    const remaining = balance - total_cost;
    const total_cost_ether = @as(f64, @floatFromInt(total_cost)) / @as(f64, @floatFromInt(WEI_PER_ETHER));
    const remaining_ether = @as(f64, @floatFromInt(remaining)) / @as(f64, @floatFromInt(WEI_PER_ETHER));

    std.debug.print("   Total cost: {d:.6} ETH\n", .{total_cost_ether});
    std.debug.print("   Remaining balance: {d:.6} ETH\n\n", .{remaining_ether});

    const sufficient = balance >= total_cost;
    std.debug.print("   Sufficient balance? {}\n\n", .{sufficient});

    // 5. Staking rewards calculation
    std.debug.print("5. Staking Rewards Calculation\n", .{});
    std.debug.print("   --------------------------\n", .{});

    const staked_amount: u256 = 32 * WEI_PER_ETHER;
    const annual_rate_basis_points: u256 = 400; // 4% = 400 basis points
    const days_staked: u256 = 365;

    // rewards = staked * rate * (days / 365)
    const rewards = (staked_amount * annual_rate_basis_points * days_staked) / (10000 * 365);
    const rewards_ether = @as(f64, @floatFromInt(rewards)) / @as(f64, @floatFromInt(WEI_PER_ETHER));

    std.debug.print("   Staked amount: 32.000000 ETH\n", .{});
    std.debug.print("   Annual rate: 4.00%\n", .{});
    std.debug.print("   Days staked: {}\n", .{days_staked});
    std.debug.print("   Rewards earned: {d:.6} ETH\n\n", .{rewards_ether});

    const total_staked = staked_amount + rewards;
    const total_ether = @as(f64, @floatFromInt(total_staked)) / @as(f64, @floatFromInt(WEI_PER_ETHER));
    std.debug.print("   Total after rewards: {d:.6} ETH\n\n", .{total_ether});

    // 6. Gas fee comparison
    std.debug.print("6. Gas Fee Comparison\n", .{});
    std.debug.print("   -----------------\n", .{});

    const gas_amount: u256 = 100_000;
    const gas_prices = [_]u256{ 20, 50, 100, 200 };

    std.debug.print("   Gas amount: {}\n\n", .{gas_amount});

    for (gas_prices) |price_gwei| {
        const price_wei = price_gwei * WEI_PER_GWEI;
        const cost = gas_amount * price_wei;
        const cost_ether = @as(f64, @floatFromInt(cost)) / @as(f64, @floatFromInt(WEI_PER_ETHER));
        const cost_usd = cost_ether * 2000.0; // @ $2000/ETH

        std.debug.print("   @ {} gwei:\n", .{price_gwei});
        std.debug.print("   - Cost: {d:.6} ETH\n", .{cost_ether});
        std.debug.print("   - USD (@ $2000/ETH): ${d:.2}\n\n", .{cost_usd});
    }

    // 7. Precise Wei Amounts
    std.debug.print("7. Precise Wei Amounts\n", .{});
    std.debug.print("   ------------------\n", .{});

    const exact_amounts = [_]u256{
        1, // 1 wei
        1_000, // 1000 wei
        WEI_PER_GWEI, // 1 gwei
        WEI_PER_ETHER, // 1 ether
    };

    for (exact_amounts) |amount| {
        const hex = try Uint.toHex(allocator, amount, false);
        defer allocator.free(hex);
        const gwei = amount / WEI_PER_GWEI;
        const ether_f = @as(f64, @floatFromInt(amount)) / @as(f64, @floatFromInt(WEI_PER_ETHER));

        std.debug.print("   {} wei\n", .{amount});
        std.debug.print("   - Hex: {s}\n", .{hex});
        std.debug.print("   - Gwei: {}\n", .{gwei});
        std.debug.print("   - Ether: {d:.6}\n\n", .{ether_f});
    }

    std.debug.print("=== Example Complete ===\n\n", .{});
}
