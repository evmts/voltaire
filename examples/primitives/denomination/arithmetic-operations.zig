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

    std.debug.print("\n=== Arithmetic Operations with Denominations ===\n\n", .{});

    // Example 1: Adding values in Wei
    std.debug.print("1. Adding Wei Values\n", .{});
    std.debug.print("   ------------------\n", .{});

    // 1 ETH
    const wallet1 = Ether.from_u256(U256.from_u64(1)).to_wei();

    // 0.5 ETH
    var limbs2: [4]u64 = .{ 0x6f05b59d3b20000, 0, 0, 0 };
    const wallet2 = Wei.from_u256(U256.from_limbs(limbs2));

    // 0.25 ETH
    var limbs3: [4]u64 = .{ 0x3782dace9d90000, 0, 0, 0 };
    const wallet3 = Wei.from_u256(U256.from_limbs(limbs3));

    const total = Wei.from_u256(
        wallet1.value.wrapping_add(wallet2.value).wrapping_add(wallet3.value),
    );

    std.debug.print("   Wallet 1: {} Wei\n", .{wallet1.value});
    std.debug.print("   Wallet 2: {} Wei\n", .{wallet2.value});
    std.debug.print("   Wallet 3: {} Wei\n", .{wallet3.value});
    std.debug.print("   Total: {} Wei\n", .{total.value});

    std.debug.print("\n", .{});

    // Example 2: Subtracting gas costs from balance
    std.debug.print("2. Deducting Gas Costs\n", .{});
    std.debug.print("   -------------------\n", .{});

    const balance = Ether.from_u256(U256.from_u64(2)).to_wei(); // 2 ETH
    const gas_price = Gwei.from_u256(U256.from_u64(50));
    const gas_used = U256.from_u64(21_000);

    const gas_price_wei = gas_price.to_wei();
    const gas_cost = Wei.from_u256(gas_price_wei.value.wrapping_mul(gas_used));

    const sufficient = balance.value.gte(gas_cost.value);
    const new_balance = if (sufficient) Wei.from_u256(balance.value.sub(gas_cost.value)) else Wei.from_u256(U256.from_u64(0));

    std.debug.print("   Balance: {} Wei\n", .{balance.value});
    std.debug.print("   Gas cost: {} Wei\n", .{gas_cost.value});
    std.debug.print("   Sufficient: {s}\n", .{if (sufficient) "✓" else "✗"});
    std.debug.print("   New balance: {} Wei\n", .{new_balance.value});

    std.debug.print("\n", .{});

    // Example 3: Calculating percentages
    std.debug.print("3. Percentage Calculations\n", .{});
    std.debug.print("   ------------------------\n", .{});

    const amount = Ether.from_u256(U256.from_u64(10)).to_wei(); // 10 ETH

    const percentages = [_]struct { pct: u64, name: []const u8 }{
        .{ .pct = 100, .name = "1%" },
        .{ .pct = 250, .name = "2.5%" },
        .{ .pct = 500, .name = "5%" },
        .{ .pct = 1000, .name = "10%" },
        .{ .pct = 5000, .name = "50%" },
    };

    std.debug.print("   Amount: {} Wei\n", .{amount.value});

    for (percentages) |p| {
        const pct_u256 = U256.from_u64(p.pct);
        const basis = U256.from_u64(10_000); // 100% = 10,000 basis points

        const numerator = amount.value.wrapping_mul(pct_u256);
        const result = numerator.div_rem(basis).quotient;
        const fee = Wei.from_u256(result);

        std.debug.print("   {s}: {} Wei\n", .{ p.name, fee.value });
    }

    std.debug.print("\n", .{});

    // Example 4: Splitting values equally
    std.debug.print("4. Splitting Values Equally\n", .{});
    std.debug.print("   -------------------------\n", .{});

    const total_amount = Ether.from_u256(U256.from_u64(1)).to_wei(); // 1 ETH
    const parts = U256.from_u64(3);

    const share = total_amount.value.div_rem(parts).quotient;
    const remainder = total_amount.value.div_rem(parts).remainder;

    std.debug.print("   Total: {} Wei\n", .{total_amount.value});
    std.debug.print("   Split into 3 parts:\n", .{});
    std.debug.print("     Part 1 (with remainder): {} Wei\n", .{share.wrapping_add(remainder)});
    std.debug.print("     Part 2: {} Wei\n", .{share});
    std.debug.print("     Part 3: {} Wei\n", .{share});

    // Verify
    const verify = share.wrapping_mul(U256.from_u64(3)).wrapping_add(remainder);
    std.debug.print("   Verify sum: {} Wei\n", .{verify});

    std.debug.print("\n", .{});

    // Example 5: Weighted distribution
    std.debug.print("5. Weighted Distribution\n", .{});
    std.debug.print("   ----------------------\n", .{});

    const total_pool = Ether.from_u256(U256.from_u64(10)).to_wei(); // 10 ETH
    const weights = [_]u64{ 50, 30, 20 }; // 50%, 30%, 20%
    const total_weight = U256.from_u64(100);

    std.debug.print("   Total pool: {} Wei\n", .{total_pool.value});
    std.debug.print("   Distribution:\n", .{});

    var distributed = U256.from_u64(0);

    for (weights, 0..) |w, i| {
        const weight_u256 = U256.from_u64(w);

        if (i == weights.len - 1) {
            // Last share gets remainder
            const share_final = total_pool.value.sub(distributed);
            std.debug.print("     Share {} ({}%): {} Wei\n", .{ i + 1, w, share_final });
        } else {
            const numerator = total_pool.value.wrapping_mul(weight_u256);
            const share_value = numerator.div_rem(total_weight).quotient;
            distributed = distributed.wrapping_add(share_value);
            std.debug.print("     Share {} ({}%): {} Wei\n", .{ i + 1, w, share_value });
        }
    }

    std.debug.print("\n", .{});

    // Example 6: Safe denomination mixing
    std.debug.print("6. Safe Denomination Mixing\n", .{});
    std.debug.print("   -------------------------\n", .{});

    const eth_part = Ether.from_u256(U256.from_u64(1)); // 1 ETH
    const gwei_part = Gwei.from_u256(U256.from_u64(500)); // 500 Gwei
    const wei_part = Wei.from_u256(U256.from_u64(123_456_789)); // Some Wei

    // Convert all to Wei
    const eth_wei = eth_part.to_wei();
    const gwei_wei = gwei_part.to_wei();

    const combined = eth_wei.value.wrapping_add(gwei_wei.value).wrapping_add(wei_part.value);

    std.debug.print("   Combining different denominations:\n", .{});
    std.debug.print("     {} Ether\n", .{eth_part.value});
    std.debug.print("     {} Gwei\n", .{gwei_part.value});
    std.debug.print("     {} Wei\n", .{wei_part.value});
    std.debug.print("   Total: {} Wei\n", .{combined});

    std.debug.print("\n", .{});

    // Example 7: Running balance with transactions
    std.debug.print("7. Running Balance Tracker\n", .{});
    std.debug.print("   ------------------------\n", .{});

    const initial_balance = Ether.from_u256(U256.from_u64(5)).to_wei(); // 5 ETH

    const transactions = [_]struct { credit: bool, amount: Wei, desc: []const u8 }{
        .{ .credit = false, .amount = Ether.from_u256(U256.from_u64(1)).to_wei(), .desc = "Send 1 ETH" },
        .{ .credit = true, .amount = Wei.from_u256(U256.from_u64(500_000_000_000_000_000)), .desc = "Receive 0.5 ETH" },
        .{ .credit = false, .amount = Wei.from_u256(U256.from_u64(50_000_000_000_000)), .desc = "Gas fee" },
        .{ .credit = true, .amount = Ether.from_u256(U256.from_u64(2)).to_wei(), .desc = "Receive 2 ETH" },
    };

    var current_balance = initial_balance.value;

    std.debug.print("   Initial balance: {} Wei\n", .{current_balance});

    for (transactions) |tx| {
        const sign = if (tx.credit) "+" else "-";

        if (tx.credit) {
            current_balance = current_balance.wrapping_add(tx.amount.value);
        } else {
            current_balance = current_balance.sub(tx.amount.value);
        }

        std.debug.print("   {s}{} Wei ({s}) → {} Wei\n", .{ sign, tx.amount.value, tx.desc, current_balance });
    }

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
