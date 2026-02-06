const std = @import("std");
const primitives = @import("primitives");
const Denomination = primitives.Denomination;
const Wei = Denomination.Wei;
const Gwei = Denomination.Gwei;
const Ether = Denomination.Ether;
const U256 = Denomination.U256;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Balance Formatting and Display ===\n\n", .{});

    // Example 1: Format Wei as Ether with decimals
    std.debug.print("1. Formatting Wei as Ether\n", .{});
    std.debug.print("   ------------------------\n", .{});

    // 1.234567890123456789 ETH
    var limbs1: [4]u64 = .{ 0x112210f4b16c1cb5, 0, 0, 0 };
    const balance1 = Wei.from_u256(U256.from_limbs(limbs1));

    // 0.5 ETH
    var limbs2: [4]u64 = .{ 0x6f05b59d3b20000, 0, 0, 0 };
    const balance2 = Wei.from_u256(U256.from_limbs(limbs2));

    // 1 ETH
    const balance3 = Ether.from_u256(U256.from_u64(1)).to_wei();

    const balances = [_]Wei{ balance1, balance2, balance3 };

    for (balances) |balance| {
        std.debug.print("   {} Wei\n", .{balance.value});
        const ether = balance.to_ether();
        const gwei = balance.to_gwei();
        std.debug.print("     {} Ether (whole part)\n", .{ether.value});
        std.debug.print("     {} Gwei\n", .{gwei.value});
    }

    std.debug.print("\n", .{});

    // Example 2: Smart unit selection
    std.debug.print("2. Smart Unit Selection\n", .{});
    std.debug.print("   ---------------------\n", .{});

    const amounts = [_]Wei{
        Ether.from_u256(U256.from_u64(1)).to_wei(), // 1 ETH
        Gwei.from_u256(U256.from_u64(50)).to_wei(), // 50 Gwei
        Wei.from_u256(U256.from_u64(1_000)), // 1000 Wei
    };

    for (amounts) |amount| {
        const wei_value = amount.value;

        // Check if >= 0.01 ETH (10^16 Wei)
        const threshold_eth = U256.from_u64(10_000_000_000_000_000);
        if (wei_value.gte(threshold_eth)) {
            const eth = amount.to_ether();
            std.debug.print("   {} Wei → {} ETH\n", .{ wei_value, eth.value });
        } else {
            const threshold_gwei = U256.from_u64(10_000);
            if (wei_value.gte(threshold_gwei)) {
                const gwei = amount.to_gwei();
                std.debug.print("   {} Wei → {} Gwei\n", .{ wei_value, gwei.value });
            } else {
                std.debug.print("   {} Wei → {} Wei\n", .{ wei_value, wei_value });
            }
        }
    }

    std.debug.print("\n", .{});

    // Example 3: Balance comparison
    std.debug.print("3. Balance Comparison\n", .{});
    std.debug.print("   -------------------\n", .{});

    // Wallet A: 1.234567890123456789 ETH
    const wallet_a = balance1;

    // Wallet B: 0.987654321098765432 ETH
    var wallet_b_limbs: [4]u64 = .{ 0x0db3ccdc82a94f58, 0, 0, 0 };
    const wallet_b = Wei.from_u256(U256.from_limbs(wallet_b_limbs));

    std.debug.print("   Wallet A: {} Wei\n", .{wallet_a.value});
    std.debug.print("   Wallet B: {} Wei\n", .{wallet_b.value});

    const difference = wallet_a.value.sub(wallet_b.value);
    const total = wallet_a.value.wrapping_add(wallet_b.value);

    std.debug.print("   Difference: {} Wei\n", .{difference});
    std.debug.print("   Total: {} Wei\n", .{total});

    std.debug.print("\n", .{});

    // Example 4: Percentage of balance
    std.debug.print("4. Percentage of Balance\n", .{});
    std.debug.print("   ----------------------\n", .{});

    const total_balance = Ether.from_u256(U256.from_u64(10)).to_wei(); // 10 ETH

    const percentages = [_]u64{ 100, 50, 25, 10, 1 };

    for (percentages) |pct| {
        const pct_u256 = U256.from_u64(pct);
        const hundred = U256.from_u64(100);

        const numerator = total_balance.value.wrapping_mul(pct_u256);
        const amount_value = numerator.div_rem(hundred).quotient;
        const amount = Wei.from_u256(amount_value);

        std.debug.print("   {}%: {} Wei\n", .{ pct, amount.value });
    }

    std.debug.print("\n", .{});

    // Example 5: Working with dust amounts
    std.debug.print("5. Working with Dust Amounts\n", .{});
    std.debug.print("   ---------------------------\n", .{});

    const dust_threshold = Wei.from_u256(U256.from_u64(1_000_000_000_000)); // 0.000001 ETH

    const test_amounts = [_]u64{ 100, 1_000_000_000, 1_000_000_000_000, 1_000_000_000_000_000 };

    for (test_amounts) |amt| {
        const amount = Wei.from_u256(U256.from_u64(amt));
        const is_dust = amount.value.lt(dust_threshold.value);

        std.debug.print("   {} Wei: {s}\n", .{ amount.value, if (is_dust) "dust" else "significant" });
    }

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
