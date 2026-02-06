// Gas Calculations Example
//
// Demonstrates gas calculations for all transaction types

const std = @import("std");

pub fn main() !void {
    std.debug.print("\n=== Transaction Gas Calculations ===\n\n", .{});

    // Example 1: Legacy transaction gas cost
    std.debug.print("1. Legacy Transaction Gas Cost\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const legacy_gas_price: u64 = 20_000_000_000; // 20 gwei
    const legacy_gas_used: u64 = 21000;
    const legacy_value: u64 = 1_000_000_000_000_000_000; // 1 ETH

    const legacy_gas_cost = legacy_gas_price * legacy_gas_used;
    const legacy_total_cost = legacy_gas_cost + legacy_value;

    std.debug.print("Legacy Transaction:\n", .{});
    std.debug.print("  Gas Price: {} gwei\n", .{legacy_gas_price / 1_000_000_000});
    std.debug.print("  Gas Used: {}\n", .{legacy_gas_used});
    std.debug.print("  Gas Cost: {} wei\n", .{legacy_gas_cost});
    std.debug.print("  Transfer Value: {} wei\n", .{legacy_value});
    std.debug.print("  Total Cost: {} wei\n", .{legacy_total_cost});
    std.debug.print("\n", .{});

    // Example 2: EIP-1559 effective gas price
    std.debug.print("2. EIP-1559 Effective Gas Price\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const base_fee: u64 = 15_000_000_000; // 15 gwei
    const max_priority_fee: u64 = 2_000_000_000; // 2 gwei
    const max_fee_per_gas: u64 = 30_000_000_000; // 30 gwei
    const eip1559_gas_used: u64 = 21000;
    const eip1559_value: u64 = 1_000_000_000_000_000_000;

    // effectiveGasPrice = baseFee + min(maxPriorityFeePerGas, maxFeePerGas - baseFee)
    const max_priority_allowed = @min(max_priority_fee, max_fee_per_gas - base_fee);
    const effective_gas_price = base_fee + max_priority_allowed;

    const eip1559_max_cost = max_fee_per_gas * eip1559_gas_used + eip1559_value;
    const eip1559_actual_cost = effective_gas_price * eip1559_gas_used + eip1559_value;
    const refund = (max_fee_per_gas - effective_gas_price) * eip1559_gas_used;

    std.debug.print("EIP-1559 Transaction:\n", .{});
    std.debug.print("  Base Fee: {} gwei\n", .{base_fee / 1_000_000_000});
    std.debug.print("  Max Priority Fee: {} gwei\n", .{max_priority_fee / 1_000_000_000});
    std.debug.print("  Max Fee: {} gwei\n", .{max_fee_per_gas / 1_000_000_000});
    std.debug.print("\n", .{});
    std.debug.print("  Effective Gas Price: {} gwei\n", .{effective_gas_price / 1_000_000_000});
    std.debug.print("  Formula: baseFee + min(priorityFee, maxFee - baseFee)\n", .{});
    std.debug.print("  = 15 + min(2, 30 - 15) = 15 + 2 = 17 gwei\n", .{});
    std.debug.print("\n", .{});
    std.debug.print("  Maximum Possible Cost: {} wei\n", .{eip1559_max_cost});
    std.debug.print("  Actual Cost: {} wei\n", .{eip1559_actual_cost});
    std.debug.print("  Refund: {} wei\n", .{refund});
    std.debug.print("\n", .{});

    // Example 3: EIP-4844 blob gas costs
    std.debug.print("3. EIP-4844 Blob Gas Costs\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const blob_count: u32 = 3;
    const BLOB_GAS_PER_BLOB: u64 = 131_072;
    const blob_base_fee: u64 = 1; // 1 wei per blob gas
    const blob_gas_used: u64 = 50_000;

    const total_blob_gas = BLOB_GAS_PER_BLOB * blob_count;
    const exec_cost = effective_gas_price * blob_gas_used;
    const blob_cost = total_blob_gas * blob_base_fee;
    const total_blob_tx_cost = exec_cost + blob_cost;

    std.debug.print("EIP-4844 Blob Transaction:\n", .{});
    std.debug.print("  Blob Count: {}\n", .{blob_count});
    std.debug.print("  Blob Gas per Blob: {}\n", .{BLOB_GAS_PER_BLOB});
    std.debug.print("  Total Blob Gas: {}\n", .{total_blob_gas});
    std.debug.print("\n", .{});
    std.debug.print("Execution Gas:\n", .{});
    std.debug.print("  Base Fee: {} gwei\n", .{base_fee / 1_000_000_000});
    std.debug.print("  Effective Price: {} gwei\n", .{effective_gas_price / 1_000_000_000});
    std.debug.print("  Gas Used: {}\n", .{blob_gas_used});
    std.debug.print("  Execution Cost: {} wei\n", .{exec_cost});
    std.debug.print("\n", .{});
    std.debug.print("Blob Gas:\n", .{});
    std.debug.print("  Blob Base Fee: {} wei\n", .{blob_base_fee});
    std.debug.print("  Blob Cost: {} wei\n", .{blob_cost});
    std.debug.print("  Formula: {} × {} × {} = {}\n", .{ blob_count, BLOB_GAS_PER_BLOB, blob_base_fee, blob_cost });
    std.debug.print("\n", .{});
    std.debug.print("Total Cost:\n", .{});
    std.debug.print("  Execution: {} wei\n", .{exec_cost});
    std.debug.print("  Blobs: {} wei\n", .{blob_cost});
    std.debug.print("  Total: {} wei\n", .{total_blob_tx_cost});
    std.debug.print("\n", .{});

    // Example 4: Fee estimation strategy
    std.debug.print("4. Fee Estimation Strategy\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const current_base_fee: u64 = 15_000_000_000;

    std.debug.print("Current Block:\n", .{});
    std.debug.print("  Base Fee: {} gwei\n", .{current_base_fee / 1_000_000_000});
    std.debug.print("\n", .{});

    std.debug.print("Conservative (next few blocks):\n", .{});
    std.debug.print("  Max Priority Fee: 1 gwei\n", .{});
    std.debug.print("  Max Fee: {} gwei (base + 5)\n", .{(current_base_fee + 5_000_000_000) / 1_000_000_000});
    std.debug.print("\n", .{});

    std.debug.print("Standard (next block likely):\n", .{});
    std.debug.print("  Max Priority Fee: 2 gwei\n", .{});
    std.debug.print("  Max Fee: {} gwei (2× base)\n", .{(current_base_fee * 2) / 1_000_000_000});
    std.debug.print("\n", .{});

    std.debug.print("Aggressive (next block priority):\n", .{});
    std.debug.print("  Max Priority Fee: 5 gwei\n", .{});
    std.debug.print("  Max Fee: {} gwei (3× base)\n", .{(current_base_fee * 3) / 1_000_000_000});
    std.debug.print("\n", .{});

    // Example 5: Complete cost breakdown
    std.debug.print("5. Complete Cost Breakdown\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Legacy Transaction:\n", .{});
    std.debug.print("  Gas: {} wei ({} gwei)\n", .{ legacy_gas_cost, legacy_gas_cost / 1_000_000_000 });
    std.debug.print("  Value: {} wei\n", .{legacy_value});
    std.debug.print("  Total: {} wei\n", .{legacy_total_cost});
    std.debug.print("\n", .{});

    std.debug.print("EIP-1559 Transaction:\n", .{});
    std.debug.print("  Gas (max): {} wei\n", .{eip1559_max_cost - eip1559_value});
    std.debug.print("  Gas (actual): {} wei\n", .{eip1559_actual_cost - eip1559_value});
    std.debug.print("  Refund: {} wei\n", .{refund});
    std.debug.print("  Value: {} wei\n", .{eip1559_value});
    std.debug.print("  Total: {} wei\n", .{eip1559_actual_cost});
    std.debug.print("\n", .{});

    std.debug.print("EIP-4844 Transaction:\n", .{});
    std.debug.print("  Execution Gas: {} wei\n", .{exec_cost});
    std.debug.print("  Blob Gas: {} wei\n", .{blob_cost});
    std.debug.print("  Total: {} wei\n", .{total_blob_tx_cost});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
