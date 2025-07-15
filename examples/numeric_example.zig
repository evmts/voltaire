const std = @import("std");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("=== Ethereum Numeric Utilities Demo ===\n\n", .{});

    // 1. Unit constants
    std.debug.print("1. Ethereum Unit Constants:\n", .{});
    std.debug.print("   1 wei = {} wei\n", .{primitives.Numeric.WEI});
    std.debug.print("   1 kwei = {} wei\n", .{primitives.Numeric.KWEI});
    std.debug.print("   1 mwei = {} wei\n", .{primitives.Numeric.MWEI});
    std.debug.print("   1 gwei = {} wei\n", .{primitives.Numeric.GWEI});
    std.debug.print("   1 szabo = {} wei\n", .{primitives.Numeric.SZABO});
    std.debug.print("   1 finney = {} wei\n", .{primitives.Numeric.FINNEY});
    std.debug.print("   1 ether = {} wei\n\n", .{primitives.Numeric.ETHER});

    // 2. Parsing ether values
    std.debug.print("2. Parsing Ether Values:\n", .{});
    const ether_values = [_][]const u8{ "1", "1.5", "0.001", "2.5", "0.1" };
    for (ether_values) |ether_str| {
        const wei_value = try primitives.Numeric.parse_ether(ether_str);
        std.debug.print("   {s} ETH = {} wei\n", .{ ether_str, wei_value });
    }
    std.debug.print("\n", .{});

    // 3. Parsing gwei values
    std.debug.print("3. Parsing Gwei Values:\n", .{});
    const gwei_values = [_][]const u8{ "1", "20", "100", "0.5", "1.5" };
    for (gwei_values) |gwei_str| {
        const wei_value = try primitives.Numeric.parse_gwei(gwei_str);
        std.debug.print("   {s} gwei = {} wei\n", .{ gwei_str, wei_value });
    }
    std.debug.print("\n", .{});

    // 4. Formatting wei to ether
    std.debug.print("4. Formatting Wei to Ether:\n", .{});
    const wei_values = [_]u256{ primitives.Numeric.ETHER, primitives.Numeric.ETHER * 2 + primitives.Numeric.ETHER / 2, primitives.Numeric.FINNEY, primitives.Numeric.GWEI * 100, primitives.Numeric.ETHER / 10 };
    for (wei_values) |wei_val| {
        const ether_str = try primitives.Numeric.format_ether(allocator, wei_val);
        defer allocator.free(ether_str);
        std.debug.print("   {} wei = {s}\n", .{ wei_val, ether_str });
    }
    std.debug.print("\n", .{});

    // 5. Formatting wei to gwei
    std.debug.print("5. Formatting Wei to Gwei:\n", .{});
    const gwei_wei_values = [_]u256{ primitives.Numeric.GWEI, primitives.Numeric.GWEI * 20, primitives.Numeric.GWEI / 2, primitives.Numeric.GWEI * 100 };
    for (gwei_wei_values) |wei_val| {
        const gwei_str = try primitives.Numeric.format_gwei(allocator, wei_val);
        defer allocator.free(gwei_str);
        std.debug.print("   {} wei = {s}\n", .{ wei_val, gwei_str });
    }
    std.debug.print("\n", .{});

    // 6. Unit conversions
    std.debug.print("6. Unit Conversions:\n", .{});
    const conversions = [_]struct { value: u256, from: primitives.Numeric.Unit, to: primitives.Numeric.Unit }{
        .{ .value = 1, .from = .ether, .to = .gwei },
        .{ .value = 1000, .from = .gwei, .to = .finney },
        .{ .value = 1, .from = .finney, .to = .wei },
        .{ .value = 1000000, .from = .wei, .to = .kwei },
        .{ .value = 2, .from = .ether, .to = .finney },
    };
    for (conversions) |conv| {
        const result = try primitives.Numeric.convert_units(conv.value, conv.from, conv.to);
        std.debug.print("   {} {s} = {} {s}\n", .{ conv.value, conv.from.to_string(), result, conv.to.to_string() });
    }
    std.debug.print("\n", .{});

    // 7. Gas cost calculations
    std.debug.print("7. Gas Cost Calculations:\n", .{});
    const gas_scenarios = [_]struct { gas_used: u64, gas_price_gwei: u256 }{
        .{ .gas_used = 21000, .gas_price_gwei = 20 }, // Simple transfer
        .{ .gas_used = 50000, .gas_price_gwei = 30 }, // Contract call
        .{ .gas_used = 100000, .gas_price_gwei = 50 }, // Complex transaction
        .{ .gas_used = 200000, .gas_price_gwei = 100 }, // Contract deployment
    };
    for (gas_scenarios) |scenario| {
        const cost_wei = primitives.Numeric.calculate_gas_cost(scenario.gas_used, scenario.gas_price_gwei);
        const cost_str = try primitives.Numeric.format_gas_cost(allocator, scenario.gas_used, scenario.gas_price_gwei);
        defer allocator.free(cost_str);
        std.debug.print("   {} gas @ {} gwei = {} wei ({s})\n", .{ scenario.gas_used, scenario.gas_price_gwei, cost_wei, cost_str });
    }
    std.debug.print("\n", .{});

    // 8. Safe math operations
    std.debug.print("8. Safe Math Operations:\n", .{});
    const a: u256 = 1000000000000000000; // 1 ether
    const b: u256 = 500000000000000000; // 0.5 ether
    const large: u256 = std.math.maxInt(u256);

    std.debug.print("   {} + {} = {?}\n", .{ a, b, primitives.Numeric.safe_add(a, b) });
    std.debug.print("   {} - {} = {?}\n", .{ a, b, primitives.Numeric.safe_sub(a, b) });
    std.debug.print("   {} * 2 = {?}\n", .{ a, primitives.Numeric.safe_mul(a, 2) });
    std.debug.print("   {} / {} = {?}\n", .{ a, b, primitives.Numeric.safe_div(a, b) });
    std.debug.print("   MAX + 1 = {?} (overflow protection)\n", .{primitives.Numeric.safe_add(large, 1)});
    std.debug.print("   {} - {} = {?} (underflow protection)\n", .{ b, a, primitives.Numeric.safe_sub(b, a) });
    std.debug.print("\n", .{});

    // 9. Percentage calculations
    std.debug.print("9. Percentage Calculations:\n", .{});
    const base_value: u256 = primitives.Numeric.ETHER; // 1 ETH
    const percentages = [_]u256{ 10, 25, 50, 75, 100 };
    for (percentages) |pct| {
        const result = primitives.Numeric.calculate_percentage(base_value, pct);
        const result_str = try primitives.Numeric.format_ether(allocator, result);
        defer allocator.free(result_str);
        std.debug.print("   {}% of 1 ETH = {s}\n", .{ pct, result_str });
    }
    std.debug.print("\n", .{});

    // 10. Min/Max operations
    std.debug.print("10. Min/Max Operations:\n", .{});
    const val1 = primitives.Numeric.ETHER;
    const val2 = primitives.Numeric.ETHER * 2;

    const min_val = primitives.Numeric.min(val1, val2);
    const max_val = primitives.Numeric.max(val1, val2);
    const min_str = try primitives.Numeric.format_ether(allocator, min_val);
    defer allocator.free(min_str);
    const max_str = try primitives.Numeric.format_ether(allocator, max_val);
    defer allocator.free(max_str);

    std.debug.print("   min(1 ETH, 2 ETH) = {s}\n", .{min_str});
    std.debug.print("   max(1 ETH, 2 ETH) = {s}\n", .{max_str});
    std.debug.print("\n", .{});

    // 11. Real-world example: Transaction cost analysis
    std.debug.print("11. Real-world Example - Transaction Cost Analysis:\n", .{});
    const tx_gas: u64 = 21000;
    const gas_prices = [_]u256{ 10, 20, 50, 100, 200 };

    std.debug.print("   Transaction gas: {} units\n", .{tx_gas});
    std.debug.print("   Gas price scenarios:\n", .{});
    for (gas_prices) |gas_price| {
        const cost_wei = primitives.Numeric.calculate_gas_cost(tx_gas, gas_price);
        const cost_eth = try primitives.Numeric.format_ether(allocator, cost_wei);
        defer allocator.free(cost_eth);
        std.debug.print("     {} gwei: {s}\n", .{ gas_price, cost_eth });
    }

    std.debug.print("\n=== All numeric utilities working perfectly! ===\n", .{});
}
