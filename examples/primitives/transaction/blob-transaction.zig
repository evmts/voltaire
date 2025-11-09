// EIP-4844 Blob Transaction Example
//
// Demonstrates blob transactions for L2 data availability:
// - Creating blob transactions
// - Blob gas cost calculation
// - Cost comparison with calldata

const std = @import("std");
const primitives = @import("primitives");

const Hash = primitives.Hash.Hash;
const Address = primitives.Address.Address;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();

    std.debug.print("\n=== EIP-4844 Blob Transaction Examples ===\n\n", .{});

    // Example 1: Blob transaction basics
    std.debug.print("1. Blob Transaction Basics\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const blob_count: u32 = 2;
    const max_fee_per_blob_gas: u64 = 2_000_000_000; // 2 gwei

    std.debug.print("Creating blob transaction with:\n", .{});
    std.debug.print("  Blob Count: {}\n", .{blob_count});
    std.debug.print("  Max Fee Per Blob Gas: {} gwei\n", .{max_fee_per_blob_gas / 1_000_000_000});
    std.debug.print("  To: Must not be null (no contract creation)\n", .{});
    std.debug.print("\n", .{});

    // Example 2: Blob size and gas
    std.debug.print("2. Blob Size and Gas\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const BLOB_SIZE: u64 = 131_072; // 128 KB per blob
    const BLOB_GAS_PER_BLOB: u64 = 131_072;

    std.debug.print("Each Blob:\n", .{});
    std.debug.print("  Size: {} bytes (128 KB)\n", .{BLOB_SIZE});
    std.debug.print("  Gas: {} blob gas\n", .{BLOB_GAS_PER_BLOB});
    std.debug.print("\n", .{});

    const total_blob_size = BLOB_SIZE * blob_count;
    const total_blob_gas = BLOB_GAS_PER_BLOB * blob_count;

    std.debug.print("This Transaction:\n", .{});
    std.debug.print("  Blobs: {}\n", .{blob_count});
    std.debug.print("  Total Size: {} bytes ({} KB)\n", .{ total_blob_size, total_blob_size / 1024 });
    std.debug.print("  Total Blob Gas: {}\n", .{total_blob_gas});
    std.debug.print("\n", .{});

    std.debug.print("Maximum Limits:\n", .{});
    std.debug.print("  Max Blobs per TX: 6\n", .{});
    std.debug.print("  Max Size per TX: {} bytes (768 KB)\n", .{6 * BLOB_SIZE});
    std.debug.print("  Max Blob Gas per TX: {}\n", .{6 * BLOB_GAS_PER_BLOB});
    std.debug.print("\n", .{});

    // Example 3: Blob gas cost calculation
    std.debug.print("3. Blob Gas Cost Calculation\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const blob_base_fee: u64 = 1; // 1 wei per blob gas (example)
    const blob_gas_cost = total_blob_gas * blob_base_fee;

    std.debug.print("Blob Gas Pricing:\n", .{});
    std.debug.print("  Blob Base Fee: {} wei\n", .{blob_base_fee});
    std.debug.print("  Blob Count: {}\n", .{blob_count});
    std.debug.print("  Blob Gas Cost: {} wei\n", .{blob_gas_cost});
    std.debug.print("  Formula: blob_count × 131,072 × blob_base_fee\n", .{});
    std.debug.print("  Calculation: {} × 131,072 × {} = {}\n", .{ blob_count, blob_base_fee, blob_gas_cost });
    std.debug.print("\n", .{});

    // Example 4: Total transaction cost
    std.debug.print("4. Total Transaction Cost\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const base_fee: u64 = 15_000_000_000; // Execution base fee
    const gas_used: u64 = 50_000;
    const priority_fee: u64 = 1_000_000_000;

    const effective_gas_price = base_fee + priority_fee;
    const execution_cost = effective_gas_price * gas_used;
    const total_cost = execution_cost + blob_gas_cost;

    std.debug.print("Execution Cost:\n", .{});
    std.debug.print("  Base Fee: {} gwei\n", .{base_fee / 1_000_000_000});
    std.debug.print("  Gas Used: {}\n", .{gas_used});
    std.debug.print("  Effective Gas Price: {} gwei\n", .{effective_gas_price / 1_000_000_000});
    std.debug.print("  Execution Cost: {} wei\n", .{execution_cost});
    std.debug.print("\n", .{});

    std.debug.print("Blob Cost:\n", .{});
    std.debug.print("  Blob Base Fee: {} wei\n", .{blob_base_fee});
    std.debug.print("  Blob Gas: {}\n", .{total_blob_gas});
    std.debug.print("  Blob Cost: {} wei\n", .{blob_gas_cost});
    std.debug.print("\n", .{});

    std.debug.print("Total Transaction Cost:\n", .{});
    std.debug.print("  Execution: {} wei\n", .{execution_cost});
    std.debug.print("  Blobs: {} wei\n", .{blob_gas_cost});
    std.debug.print("  Total: {} wei\n", .{total_cost});
    std.debug.print("\n", .{});

    // Example 5: Blob vs calldata cost comparison
    std.debug.print("5. Blob vs Calldata Cost Comparison\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const data_size: u64 = 131_072; // 128 KB

    // Calldata cost (16 gas per byte)
    const calldata_gas_per_byte: u64 = 16;
    const calldata_gas_cost = data_size * calldata_gas_per_byte;
    const calldata_cost_wei = calldata_gas_cost * base_fee;

    // Blob cost (1 gas per byte, approximately)
    const blob_gas_per_byte: u64 = 1;
    const blob_gas_cost_for_data = data_size * blob_gas_per_byte * blob_base_fee;

    std.debug.print("For 128 KB of data:\n\n", .{});

    std.debug.print("Calldata:\n", .{});
    std.debug.print("  Gas per byte: {}\n", .{calldata_gas_per_byte});
    std.debug.print("  Total gas: {}\n", .{calldata_gas_cost});
    std.debug.print("  Cost: {} wei\n", .{calldata_cost_wei});
    std.debug.print("  Stored: Forever\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Blobs:\n", .{});
    std.debug.print("  Gas per byte: ~1\n", .{});
    std.debug.print("  Total gas: {}\n", .{data_size});
    std.debug.print("  Cost: {} wei\n", .{blob_gas_cost_for_data});
    std.debug.print("  Stored: ~18 days\n", .{});
    std.debug.print("\n", .{});

    const savings = calldata_cost_wei - blob_gas_cost_for_data;
    const savings_percent = (@as(f64, @floatFromInt(savings)) / @as(f64, @floatFromInt(calldata_cost_wei))) * 100.0;

    std.debug.print("Savings:\n", .{});
    std.debug.print("  Wei saved: {}\n", .{savings});
    std.debug.print("  Percentage: {d:.2}%\n", .{savings_percent});
    std.debug.print("  ~16x cheaper for L2 rollup data!\n", .{});
    std.debug.print("\n", .{});

    // Example 6: Blob versioned hashes
    std.debug.print("6. Blob Versioned Hashes (KZG Commitments)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Versioned Hash Format:\n", .{});
    std.debug.print("  Byte 0: Version (0x01 = SHA-256)\n", .{});
    std.debug.print("  Bytes 1-31: sha256(kzg_commitment)[1:]\n", .{});
    std.debug.print("\n", .{});

    // Example blob hashes
    const blob_hash_1 = Hash.fromU256(0x0100000000000000000000000000000000000000000000000000000000000001);
    const blob_hash_2 = Hash.fromU256(0x0100000000000000000000000000000000000000000000000000000000000002);

    std.debug.print("Blob 1:\n", .{});
    std.debug.print("  Hash: 0x{X}\n", .{blob_hash_1});
    std.debug.print("  Version: 0x01\n", .{});
    std.debug.print("  Type: SHA-256\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Blob 2:\n", .{});
    std.debug.print("  Hash: 0x{X}\n", .{blob_hash_2});
    std.debug.print("  Version: 0x01\n", .{});
    std.debug.print("  Type: SHA-256\n", .{});
    std.debug.print("\n", .{});

    // Example 7: Blob transaction limitations
    std.debug.print("7. Blob Transaction Limitations\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Restrictions:\n", .{});
    std.debug.print("  ✗ to cannot be null (no contract creation)\n", .{});
    std.debug.print("  ✗ Blob data pruned after ~18 days\n", .{});
    std.debug.print("  ✗ Maximum 6 blobs per transaction\n", .{});
    std.debug.print("  ✗ Requires Dencun hard fork\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Best for:\n", .{});
    std.debug.print("  ✓ L2 rollup data availability\n", .{});
    std.debug.print("  ✓ Temporary large data (<768 KB)\n", .{});
    std.debug.print("  ✓ Cost optimization vs calldata\n", .{});
    std.debug.print("\n", .{});

    // Example 8: Blob base fee market
    std.debug.print("8. Blob Base Fee Market\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Blob gas pricing (separate from execution gas):\n", .{});
    std.debug.print("  Target: 3 blobs per block\n", .{});
    std.debug.print("  Max: 6 blobs per block\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Fee Adjustment:\n", .{});
    std.debug.print("  1 blobs: ↓ Decrease (Low usage)\n", .{});
    std.debug.print("  3 blobs: → Stable (Target/equilibrium)\n", .{});
    std.debug.print("  5 blobs: ↑ Increase (High usage)\n", .{});
    std.debug.print("  6 blobs: ↑ Increase (Maximum)\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Independent Markets:\n", .{});
    std.debug.print("  executionBaseFee - For regular gas (EIP-1559)\n", .{});
    std.debug.print("  blobBaseFee - For blob gas (EIP-4844)\n", .{});
    std.debug.print("  Each adjusts based on its own usage\n", .{});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
