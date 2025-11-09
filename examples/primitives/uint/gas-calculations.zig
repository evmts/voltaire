//! EVM Gas Calculations Example
//!
//! Demonstrates:
//! - Intrinsic gas costs
//! - Memory expansion costs
//! - EIP-1559 base fee calculations
//! - Gas optimization patterns

const std = @import("std");
const primitives = @import("primitives");
const Uint = primitives.Uint;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== EVM Gas Calculations Example ===\n\n", .{});

    // Gas constants
    const TX_BASE_COST: u256 = 21_000;
    const TX_DATA_ZERO_COST: u256 = 4;
    const TX_DATA_NONZERO_COST: u256 = 16;
    const MEMORY_COST_PER_WORD: u256 = 3;
    const QUADRATIC_DENOMINATOR: u256 = 512;
    const BASE_FEE_MAX_CHANGE: u256 = 8;
    const ELASTICITY_MULTIPLIER: u256 = 2;

    // 1. Intrinsic gas calculation
    std.debug.print("1. Intrinsic Gas Calculation\n", .{});
    std.debug.print("   ------------------------\n", .{});

    // Empty transaction
    const empty_gas = TX_BASE_COST;
    std.debug.print("   Empty transaction: {} gas\n\n", .{empty_gas});

    // Data with zeros
    const zero_count: u256 = 100;
    const zero_gas = TX_BASE_COST + (TX_DATA_ZERO_COST * zero_count);
    std.debug.print("   100 zero bytes: {} gas\n", .{zero_gas});
    std.debug.print("   ({} base + {} * 100)\n\n", .{ TX_BASE_COST, TX_DATA_ZERO_COST });

    // Data with non-zeros
    const nonzero_count: u256 = 100;
    const nonzero_gas = TX_BASE_COST + (TX_DATA_NONZERO_COST * nonzero_count);
    std.debug.print("   100 non-zero bytes: {} gas\n", .{nonzero_gas});
    std.debug.print("   ({} base + {} * 100)\n\n", .{ TX_BASE_COST, TX_DATA_NONZERO_COST });

    // ERC20 transfer (4 byte selector + mostly zeros)
    const erc20_nonzero: u256 = 4;
    const erc20_zero: u256 = 64; // Approximate
    const erc20_gas = TX_BASE_COST + (TX_DATA_NONZERO_COST * erc20_nonzero) + (TX_DATA_ZERO_COST * erc20_zero);
    std.debug.print("   ERC20 transfer: {} gas\n\n", .{erc20_gas});

    // 2. Memory expansion costs
    std.debug.print("2. Memory Expansion Costs\n", .{});
    std.debug.print("   ---------------------\n", .{});

    const expansions = [_]struct { from: u256, to: u256, desc: []const u8 }{
        .{ .from = 0, .to = 32, .desc = "0 → 32 bytes (1 word)" },
        .{ .from = 32, .to = 64, .desc = "32 → 64 bytes (2 words)" },
        .{ .from = 0, .to = 1024, .desc = "0 → 1024 bytes (32 words)" },
        .{ .from = 1024, .to = 10000, .desc = "1024 → 10000 bytes (significant)" },
    };

    for (expansions) |exp| {
        // Calculate memory cost: (words * 3) + (words^2 / 512)
        const new_words = (exp.to + 31) / 32;
        const old_words = (exp.from + 31) / 32;

        const new_linear = new_words * MEMORY_COST_PER_WORD;
        const old_linear = old_words * MEMORY_COST_PER_WORD;

        const new_quad = (new_words * new_words) / QUADRATIC_DENOMINATOR;
        const old_quad = (old_words * old_words) / QUADRATIC_DENOMINATOR;

        const new_total = new_linear + new_quad;
        const old_total = old_linear + old_quad;

        const cost = new_total - old_total;

        std.debug.print("   {s}: {} gas\n", .{ exp.desc, cost });
    }
    std.debug.print("\n", .{});

    // 3. EIP-1559 base fee calculation
    std.debug.print("3. EIP-1559 Base Fee Calculation\n", .{});
    std.debug.print("   ----------------------------\n", .{});

    const base_fee: u256 = 1_000_000_000; // 1 gwei
    const gas_limit: u256 = 30_000_000;
    const gas_target: u256 = gas_limit / ELASTICITY_MULTIPLIER;

    std.debug.print("   Current base fee: {} wei (1 gwei)\n", .{base_fee});
    std.debug.print("   Gas limit: {}\n", .{gas_limit});
    std.debug.print("   Gas target: {}\n\n", .{gas_target});

    const scenarios = [_]struct { used: u256, desc: []const u8 }{
        .{ .used = gas_target, .desc = "At target (no change)" },
        .{ .used = 29_000_000, .desc = "High usage (~97%)" },
        .{ .used = 1_000_000, .desc = "Low usage (~3%)" },
    };

    for (scenarios) |scenario| {
        const next_fee = calculateNextBaseFee(base_fee, scenario.used, gas_target);
        const percent_used = (@as(f64, @floatFromInt(scenario.used)) / @as(f64, @floatFromInt(gas_limit))) * 100.0;

        const change = if (next_fee > base_fee) next_fee - base_fee else base_fee - next_fee;
        const change_percent = (@as(f64, @floatFromInt(change)) / @as(f64, @floatFromInt(base_fee))) * 100.0;

        std.debug.print("   {s}:\n", .{scenario.desc});
        std.debug.print("   - Gas used: {} ({d:.1}%)\n", .{ scenario.used, percent_used });
        std.debug.print("   - Next base fee: {} wei\n", .{next_fee});
        std.debug.print("   - Change: {s}{d:.2}%\n\n", .{ if (next_fee > base_fee) "+" else "-", change_percent });
    }

    // 4. Gas optimization analysis
    std.debug.print("4. Gas Optimization Analysis\n", .{});
    std.debug.print("   ------------------------\n", .{});

    const SLOAD_COST: u256 = 2100;
    const SSTORE_SET: u256 = 20_000;
    const SSTORE_RESET: u256 = 5000;

    std.debug.print("   Storage operation costs:\n", .{});
    std.debug.print("   - SLOAD (cold): {} gas\n", .{SLOAD_COST});
    std.debug.print("   - SSTORE (set): {} gas\n", .{SSTORE_SET});
    std.debug.print("   - SSTORE (reset): {} gas\n\n", .{SSTORE_RESET});

    const num_reads: u256 = 10;
    const storage_reads = SLOAD_COST * num_reads;
    const memory_reads = 3 * num_reads;

    std.debug.print("   {} reads comparison:\n", .{num_reads});
    std.debug.print("   - From storage: {} gas\n", .{storage_reads});
    std.debug.print("   - From memory: {} gas\n", .{memory_reads});
    std.debug.print("   - Savings: {} gas\n\n", .{storage_reads - memory_reads});

    // 5. Complete transaction cost
    std.debug.print("5. Complete Transaction Cost\n", .{});
    std.debug.print("   -----------------------\n", .{});

    const tx_gas_price: u256 = 50_000_000_000; // 50 gwei
    const tx_gas_used: u256 = 100_000;
    const tx_value: u256 = 1_000_000_000_000_000_000; // 1 ETH

    const gas_cost = tx_gas_used * tx_gas_price;
    const total_cost = gas_cost + tx_value;

    const gas_cost_ether = @as(f64, @floatFromInt(gas_cost)) / 1e18;
    const total_cost_ether = @as(f64, @floatFromInt(total_cost)) / 1e18;

    std.debug.print("   Gas price: 50 gwei\n", .{});
    std.debug.print("   Gas used: {}\n", .{tx_gas_used});
    std.debug.print("   Transaction value: 1.000000 ETH\n\n", .{});

    std.debug.print("   Gas cost: {d:.6} ETH\n", .{gas_cost_ether});
    std.debug.print("   Total cost: {d:.6} ETH\n\n", .{total_cost_ether});

    // 6. Batch transaction savings
    std.debug.print("6. Batch Transaction Savings\n", .{});
    std.debug.print("   ------------------------\n", .{});

    const num_transfers: u256 = 10;
    const separate_cost = TX_BASE_COST * num_transfers;
    const batch_cost = TX_BASE_COST + (25_000 * (num_transfers - 1));

    std.debug.print("   {} separate transfers:\n", .{num_transfers});
    std.debug.print("   - Cost: {} gas\n\n", .{separate_cost});

    std.debug.print("   {} batched transfers:\n", .{num_transfers});
    std.debug.print("   - Cost: {} gas\n", .{batch_cost});
    std.debug.print("   - Savings: {} gas\n", .{separate_cost - batch_cost});
    std.debug.print("   - Percentage: {}%\n\n", .{((separate_cost - batch_cost) * 100) / separate_cost});

    std.debug.print("=== Example Complete ===\n\n", .{});
}

fn calculateNextBaseFee(current: u256, gas_used: u256, gas_target: u256) u256 {
    if (gas_used == gas_target) return current;

    if (gas_used > gas_target) {
        // Increase base fee
        const delta = gas_used - gas_target;
        const increase = (current * delta / gas_target) / 8;
        return @max(current + increase, 1);
    } else {
        // Decrease base fee
        const delta = gas_target - gas_used;
        const decrease = (current * delta / gas_target) / 8;
        return current - decrease;
    }
}
