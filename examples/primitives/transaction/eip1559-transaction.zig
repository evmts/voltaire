// EIP-1559 Transaction Example
//
// Demonstrates EIP-1559 (Type 2) transactions with:
// - Dynamic fee market mechanics
// - Base fee + priority fee
// - Access lists for gas optimization
// - Effective gas price calculation

const std = @import("std");
const primitives = @import("primitives");

const Transaction = primitives.Transaction;
const Eip1559Transaction = Transaction.Eip1559Transaction;
const AccessListItem = Transaction.AccessListItem;
const Address = primitives.Address.Address;
const Hash = primitives.Hash.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== EIP-1559 Transaction Examples ===\n\n", .{});

    // Example 1: Basic EIP-1559 transaction
    std.debug.print("1. Basic EIP-1559 Transaction\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const recipient = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

    const basic_tx = Eip1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 2_000_000_000, // 2 gwei tip
        .max_fee_per_gas = 30_000_000_000, // 30 gwei max
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000, // 1 ETH
        .data = &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .v = 0, // yParity
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Type: EIP-1559 (0x02)\n", .{});
    std.debug.print("  Chain ID: {}\n", .{basic_tx.chain_id});
    std.debug.print("  Nonce: {}\n", .{basic_tx.nonce});
    std.debug.print("  Max Priority Fee: {} gwei\n", .{basic_tx.max_priority_fee_per_gas / 1_000_000_000});
    std.debug.print("  Max Fee Per Gas: {} gwei\n", .{basic_tx.max_fee_per_gas / 1_000_000_000});
    std.debug.print("  Gas Limit: {}\n", .{basic_tx.gas_limit});
    std.debug.print("  To: 0x{X}\n", .{recipient.bytes});
    std.debug.print("  Value: {} ETH\n", .{basic_tx.value / 1_000_000_000_000_000_000});
    std.debug.print("  yParity: {}\n", .{basic_tx.v});
    std.debug.print("\n", .{});

    // Example 2: Effective gas price calculation
    std.debug.print("2. Effective Gas Price Calculation\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const Scenario = struct {
        base_fee: u64,
        description: []const u8,
    };

    const scenarios = [_]Scenario{
        .{ .base_fee = 15_000_000_000, .description = "Normal block" },
        .{ .base_fee = 25_000_000_000, .description = "Busy block" },
        .{ .base_fee = 28_000_000_000, .description = "Very busy (near max)" },
        .{ .base_fee = 30_000_000_000, .description = "At max fee" },
    };

    std.debug.print("Transaction: maxFee=30 gwei, priority=2 gwei\n\n", .{});

    for (scenarios) |scenario| {
        // effectiveGasPrice = baseFee + min(maxPriorityFeePerGas, maxFeePerGas - baseFee)
        const max_priority = @min(basic_tx.max_priority_fee_per_gas, basic_tx.max_fee_per_gas - scenario.base_fee);
        const effective_gas_price = scenario.base_fee + max_priority;
        const actual_priority = effective_gas_price - scenario.base_fee;

        std.debug.print("  {s}:\n", .{scenario.description});
        std.debug.print("    Base Fee: {} gwei\n", .{scenario.base_fee / 1_000_000_000});
        std.debug.print("    Effective Gas Price: {} gwei\n", .{effective_gas_price / 1_000_000_000});
        std.debug.print("    Actual Priority: {} gwei\n", .{actual_priority / 1_000_000_000});
        std.debug.print("    Formula: min({} + 2, 30) = {}\n", .{ scenario.base_fee / 1_000_000_000, effective_gas_price / 1_000_000_000 });
        std.debug.print("\n", .{});
    }

    // Example 3: Transaction with access list
    std.debug.print("3. Transaction with Access List\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const dai_contract = try Address.fromHex("0x6B175474E89094C44Da98b954EedeAC495271d0F");
    const user_address = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

    // Create storage keys
    const storage_key_1 = Hash.fromU256(1);
    const storage_key_2 = Hash.fromU256(2);
    const storage_key_3 = Hash.fromU256(3);

    const storage_keys_1 = [_][32]u8{ storage_key_1, storage_key_2 };
    const storage_keys_2 = [_][32]u8{storage_key_3};

    const access_list = [_]AccessListItem{
        .{
            .address = dai_contract,
            .storage_keys = &storage_keys_1,
        },
        .{
            .address = user_address,
            .storage_keys = &storage_keys_2,
        },
    };

    const access_list_tx = Eip1559Transaction{
        .chain_id = 1,
        .nonce = 5,
        .max_priority_fee_per_gas = 2_000_000_000,
        .max_fee_per_gas = 30_000_000_000,
        .gas_limit = 50_000,
        .to = dai_contract,
        .value = 0,
        .data = &[_]u8{ 0xa9, 0x05, 0x9c, 0xbb }, // transfer() selector
        .access_list = &access_list,
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Has Access List: {}\n", .{access_list_tx.access_list.len > 0});
    std.debug.print("  Access List Items: {}\n", .{access_list_tx.access_list.len});

    for (access_list_tx.access_list, 0..) |item, i| {
        std.debug.print("  Item {}:\n", .{i + 1});
        std.debug.print("    Address: 0x{X}\n", .{item.address.bytes});
        std.debug.print("    Storage Keys: {}\n", .{item.storage_keys.len});
    }
    std.debug.print("\n", .{});

    // Example 4: Fee estimation strategies
    std.debug.print("4. Fee Estimation Strategies\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const current_base_fee: u64 = 15_000_000_000; // 15 gwei

    // Conservative
    std.debug.print("Conservative Strategy:\n", .{});
    std.debug.print("  Max Priority Fee: 1 gwei\n", .{});
    std.debug.print("  Max Fee: {} gwei (base + 5 gwei)\n", .{(current_base_fee + 5_000_000_000) / 1_000_000_000});
    std.debug.print("  Expected Inclusion: Next few blocks\n\n", .{});

    // Standard
    std.debug.print("Standard Strategy:\n", .{});
    std.debug.print("  Max Priority Fee: 2 gwei\n", .{});
    std.debug.print("  Max Fee: {} gwei (2x base)\n", .{(current_base_fee * 2) / 1_000_000_000});
    std.debug.print("  Expected Inclusion: Next block (likely)\n\n", .{});

    // Aggressive
    std.debug.print("Aggressive Strategy:\n", .{});
    std.debug.print("  Max Priority Fee: 5 gwei\n", .{});
    std.debug.print("  Max Fee: {} gwei (3x base)\n", .{(current_base_fee * 3) / 1_000_000_000});
    std.debug.print("  Expected Inclusion: Next block (high priority)\n\n", .{});

    // Example 5: Cost calculation
    std.debug.print("5. Transaction Cost Calculation\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const base_fee: u64 = 15_000_000_000;
    const gas_used: u64 = 21000;
    const max_priority = @min(basic_tx.max_priority_fee_per_gas, basic_tx.max_fee_per_gas - base_fee);
    const effective_gas_price = base_fee + max_priority;

    const max_possible_cost = basic_tx.max_fee_per_gas * basic_tx.gas_limit + basic_tx.value;
    const actual_cost = effective_gas_price * gas_used + basic_tx.value;
    const refund = (basic_tx.max_fee_per_gas - effective_gas_price) * gas_used;

    std.debug.print("  Gas Used: {}\n", .{gas_used});
    std.debug.print("  Base Fee: {} gwei\n", .{base_fee / 1_000_000_000});
    std.debug.print("  Effective Gas Price: {} gwei\n", .{effective_gas_price / 1_000_000_000});
    std.debug.print("\n", .{});
    std.debug.print("  Maximum Possible Cost: {} ETH\n", .{max_possible_cost / 1_000_000_000_000_000_000});
    std.debug.print("  Actual Cost: {} ETH\n", .{actual_cost / 1_000_000_000_000_000_000});
    std.debug.print("  Refund: {} ETH\n", .{refund / 1_000_000_000_000_000_000});
    std.debug.print("\n", .{});

    // Example 6: Benefits over legacy
    std.debug.print("6. EIP-1559 vs Legacy Benefits\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});
    std.debug.print("  ✓ Predictable fees (base fee adjusts automatically)\n", .{});
    std.debug.print("  ✓ No overpaying (pay actual, refund excess)\n", .{});
    std.debug.print("  ✓ Faster inclusion (priority fee to miners)\n", .{});
    std.debug.print("  ✓ ETH burn (base fee burned, reduces supply)\n", .{});
    std.debug.print("  ✓ Better UX (set max, pay actual)\n", .{});
    std.debug.print("\n", .{});

    // Example 7: Contract deployment
    std.debug.print("7. Contract Deployment with EIP-1559\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const bytecode = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };

    const deployment = Eip1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 2_000_000_000,
        .max_fee_per_gas = 30_000_000_000,
        .gas_limit = 500_000, // High for deployment
        .to = null, // null = contract creation
        .value = 0,
        .data = &bytecode,
        .access_list = &[_]AccessListItem{},
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  To: null (contract creation)\n", .{});
    std.debug.print("  Gas Limit: {}\n", .{deployment.gas_limit});
    std.debug.print("  Bytecode Length: {} bytes\n", .{bytecode.len});
    std.debug.print("  Is Contract Creation: {}\n", .{deployment.to == null});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
