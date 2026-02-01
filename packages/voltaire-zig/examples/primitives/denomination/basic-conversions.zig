const std = @import("std");
const primitives = @import("primitives");
const Denomination = primitives.Denomination;
const Wei = Denomination.Wei;
const Gwei = Denomination.Gwei;
const Ether = Denomination.Ether;

pub fn main() !void {
    std.debug.print("\n=== Basic Denomination Conversions ===\n\n", .{});

    // Example 1: Ether to Wei and Gwei
    std.debug.print("1. Converting from Ether\n", .{});
    std.debug.print("   ------------------------\n", .{});

    const one_ether = Ether.from_u256(Denomination.U256.from_u64(1));
    const wei_from_ether = one_ether.to_wei();
    const gwei_from_ether = one_ether.to_gwei();

    std.debug.print("   1 Ether = {} Wei\n", .{wei_from_ether.value});
    std.debug.print("   1 Ether = {} Gwei\n\n", .{gwei_from_ether.value});

    // Example 2: Gwei to Wei and Ether
    std.debug.print("2. Converting from Gwei\n", .{});
    std.debug.print("   ----------------------\n", .{});

    const fifty_gwei = Gwei.from_u256(Denomination.U256.from_u64(50));
    const wei_from_gwei = fifty_gwei.to_wei();
    const ether_from_gwei = fifty_gwei.to_ether(); // Truncates to 0

    std.debug.print("   50 Gwei = {} Wei\n", .{wei_from_gwei.value});
    std.debug.print("   50 Gwei = {} Ether (truncated)\n\n", .{ether_from_gwei.value});

    // Example 3: Wei to Gwei and Ether
    std.debug.print("3. Converting from Wei\n", .{});
    std.debug.print("   --------------------\n", .{});

    // 1.5 ETH in Wei = 1_500_000_000_000_000_000
    var limbs: [4]u64 = .{ 0x14d1120d7b160000, 0, 0, 0 };
    const large_wei = Wei.from_u256(Denomination.U256.from_limbs(limbs));
    const gwei_from_wei = large_wei.to_gwei();
    const ether_from_wei = large_wei.to_ether();

    std.debug.print("   {} Wei = {} Gwei\n", .{ large_wei.value, gwei_from_wei.value });
    std.debug.print("   {} Wei = {} Ether\n\n", .{ large_wei.value, ether_from_wei.value });

    // Example 4: Integer division truncation
    std.debug.print("4. Integer Division Truncation\n", .{});
    std.debug.print("   ----------------------------\n", .{});

    // 1.5 Gwei in Wei
    const partial_gwei = Wei.from_u256(Denomination.U256.from_u64(1_500_000_000));
    const truncated_gwei = partial_gwei.to_gwei();
    std.debug.print("   {} Wei = {} Gwei (expected 1.5, got 1)\n", .{ partial_gwei.value, truncated_gwei.value });

    // 0.5 ETH in Wei
    var partial_limbs: [4]u64 = .{ 0x6f05b59d3b20000, 0, 0, 0 };
    const partial_ether = Wei.from_u256(Denomination.U256.from_limbs(partial_limbs));
    const truncated_ether = partial_ether.to_ether();
    std.debug.print("   {} Wei = {} Ether (expected 0.5, got 0)\n\n", .{ partial_ether.value, truncated_ether.value });

    // Example 5: Safe round-trip conversions
    std.debug.print("5. Round-trip Conversions\n", .{});
    std.debug.print("   -----------------------\n", .{});

    // Safe: Gwei -> Wei -> Gwei (no loss)
    const original_gwei = Gwei.from_u256(Denomination.U256.from_u64(100));
    const to_wei = original_gwei.to_wei();
    const back_to_gwei = to_wei.to_gwei();
    std.debug.print("   Original: {} Gwei\n", .{original_gwei.value});
    std.debug.print("   To Wei:   {} Wei\n", .{to_wei.value});
    std.debug.print("   Back:     {} Gwei\n", .{back_to_gwei.value});
    std.debug.print("   Match:    {s}\n\n", .{if (original_gwei.value.eq(back_to_gwei.value)) "✓" else "✗"});

    // Unsafe: Wei -> Gwei -> Wei (loses fractional Gwei)
    const original_wei = Wei.from_u256(Denomination.U256.from_u64(1_500_000_000)); // 1.5 Gwei
    const to_gwei_lossy = original_wei.to_gwei();
    const back_to_wei_lossy = to_gwei_lossy.to_wei();
    std.debug.print("   Original: {} Wei\n", .{original_wei.value});
    std.debug.print("   To Gwei:  {} Gwei (truncated)\n", .{to_gwei_lossy.value});
    std.debug.print("   Back:     {} Wei\n", .{back_to_wei_lossy.value});
    const lost = original_wei.value.sub(back_to_wei_lossy.value);
    std.debug.print("   Lost:     {} Wei\n\n", .{lost});

    // Example 6: Common values reference
    std.debug.print("6. Common Values Reference\n", .{});
    std.debug.print("   ------------------------\n", .{});

    const values = [_]struct { name: []const u8, wei: u64 }{
        .{ .name = "Dust", .wei = 1 },
        .{ .name = "Small", .wei = 1_000_000_000 },
        .{ .name = "Transfer gas (21k @ 50 Gwei)", .wei = 1_050_000 }, // Will need proper U256
    };

    for (values) |v| {
        const w = Wei.from_u256(Denomination.U256.from_u64(v.wei));
        const g = w.to_gwei();
        const e = w.to_ether();
        std.debug.print("   {s}:\n", .{v.name});
        std.debug.print("     {} Wei = {} Gwei = {} Ether\n", .{ w.value, g.value, e.value });
    }

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
