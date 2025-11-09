// EIP-2930 Access List Transaction Example
//
// Demonstrates EIP-2930 (Type 1) transactions with access lists for gas optimization:
// - Creating access list transactions
// - Building access lists for contract interactions
// - Calculating gas savings from access lists
// - Comparing with and without access lists

const std = @import("std");
const primitives = @import("primitives");

const Transaction = primitives.Transaction;
const EIP2930Transaction = Transaction.EIP2930Transaction;
const Address = primitives.Address.Address;
const AccessList = Transaction.AccessList;
const AccessListItem = Transaction.AccessListItem;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== EIP-2930 Access List Transactions ===\n\n", .{});

    // Example 1: Basic EIP-2930 transaction without access list
    std.debug.print("1. Basic EIP-2930 Transaction (no access list)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const recipient = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

    const basic = EIP2930Transaction{
        .chain_id = 1,
        .nonce = 0,
        .gas_price = 20_000_000_000, // 20 gwei (still uses fixed gas price)
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000, // 1 ETH
        .data = &[_]u8{}, // Empty data
        .access_list = &[_]AccessListItem{}, // Empty access list
        .y_parity = 0, // Note: y_parity instead of v
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Type: EIP-2930 (0x01)\n", .{});
    std.debug.print("  Chain ID: {}\n", .{basic.chain_id});
    std.debug.print("  Gas Price: {} gwei\n", .{basic.gas_price / 1_000_000_000});
    std.debug.print("  y_parity: {} (0 or 1, not v)\n", .{basic.y_parity});
    std.debug.print("  Access List: {} entries\n", .{basic.access_list.len});
    std.debug.print("\n", .{});

    // Example 2: EIP-2930 with access list for contract interaction
    std.debug.print("2. EIP-2930 with Access List (ERC20 transfer)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const token_contract = try Address.fromHex("0x6B175474E89094C44Da98b954EedeAC495271d0F"); // DAI
    const sender_addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

    // Storage slots for ERC20 balances
    const sender_balance_slot = [_]u8{0} ** 31 ++ [_]u8{1};
    const recipient_balance_slot = [_]u8{0} ** 31 ++ [_]u8{2};

    // Build access list
    var storage_keys = try allocator.alloc([32]u8, 2);
    defer allocator.free(storage_keys);
    storage_keys[0] = sender_balance_slot;
    storage_keys[1] = recipient_balance_slot;

    var access_list_items = try allocator.alloc(AccessListItem, 1);
    defer allocator.free(access_list_items);
    access_list_items[0] = AccessListItem{
        .address = token_contract,
        .storage_keys = storage_keys,
    };

    // ERC20 transfer calldata
    var call_data = [_]u8{
        0xa9, 0x05, 0x9c, 0xbb, // transfer(address,uint256)
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x12, 0x34, 0x56, 0x78,
        0x90, 0x12, 0x34, 0x56,
        0x78, 0x90, 0x12, 0x34,
        0x56, 0x78, 0x90, 0x12,
        0x34, 0x56, 0x78, 0x90,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x0d, 0xe0, 0xb6, 0xb3,
        0xa7, 0x64, 0x00, 0x00,
    };

    const with_access_list = EIP2930Transaction{
        .chain_id = 1,
        .nonce = 5,
        .gas_price = 25_000_000_000, // 25 gwei
        .gas_limit = 100_000,
        .to = token_contract,
        .value = 0,
        .data = &call_data,
        .access_list = access_list_items,
        .y_parity = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Contract: 0x{X}\n", .{token_contract.bytes});
    std.debug.print("  Function: transfer(address,uint256)\n", .{});
    std.debug.print("  Access List Entries: {}\n", .{with_access_list.access_list.len});
    std.debug.print("  Accessing:\n", .{});
    std.debug.print("    - Contract: 0x{X}\n", .{token_contract.bytes});
    std.debug.print("    - Storage Keys: {}\n", .{access_list_items[0].storage_keys.len});
    std.debug.print("      • sender balance slot\n", .{});
    std.debug.print("      • recipient balance slot\n", .{});
    std.debug.print("\n", .{});

    // Example 3: Gas savings calculation
    std.debug.print("3. Access List Gas Cost Analysis\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Gas costs (Berlin hard fork)
    const COLD_ACCOUNT_ACCESS: u64 = 2600;
    const COLD_SLOAD: u64 = 2100;
    const WARM_ACCOUNT_ACCESS: u64 = 100;
    const WARM_SLOAD: u64 = 100;
    const ACCESS_LIST_ADDRESS_COST: u64 = 2400;
    const ACCESS_LIST_STORAGE_KEY_COST: u64 = 1900;

    // Without access list
    const without_access_list_cost =
        COLD_ACCOUNT_ACCESS + // First access to contract
        COLD_SLOAD + // Read sender balance
        COLD_SLOAD; // Read recipient balance

    // With access list
    const access_list_cost =
        ACCESS_LIST_ADDRESS_COST + // Add contract to list
        (ACCESS_LIST_STORAGE_KEY_COST * 2); // Add 2 storage keys

    const with_access_list_cost =
        WARM_ACCOUNT_ACCESS + // Contract already in list
        WARM_SLOAD + // Sender balance already in list
        WARM_SLOAD; // Recipient balance already in list

    const total_without = without_access_list_cost;
    const total_with = access_list_cost + with_access_list_cost;
    const savings = total_without - total_with;

    std.debug.print("Without access list:\n", .{});
    std.debug.print("  Cold account access:  {} gas\n", .{COLD_ACCOUNT_ACCESS});
    std.debug.print("  Cold SLOAD (×2):      {} gas\n", .{COLD_SLOAD * 2});
    std.debug.print("  Total:                {} gas\n", .{total_without});
    std.debug.print("\n", .{});
    std.debug.print("With access list:\n", .{});
    std.debug.print("  Access list cost:     {} gas\n", .{access_list_cost});
    std.debug.print("    - Address entry:    {} gas\n", .{ACCESS_LIST_ADDRESS_COST});
    std.debug.print("    - Storage keys (×2): {} gas\n", .{ACCESS_LIST_STORAGE_KEY_COST * 2});
    std.debug.print("  Warm access cost:     {} gas\n", .{with_access_list_cost});
    std.debug.print("    - Warm account:     {} gas\n", .{WARM_ACCOUNT_ACCESS});
    std.debug.print("    - Warm SLOAD (×2):  {} gas\n", .{WARM_SLOAD * 2});
    std.debug.print("  Total:                {} gas\n", .{total_with});
    std.debug.print("\n", .{});
    std.debug.print("Gas savings:            {} gas ({d:.1}%)\n", .{ savings, @as(f64, @floatFromInt(savings)) / @as(f64, @floatFromInt(total_without)) * 100.0 });
    std.debug.print("\n", .{});

    // Example 4: Complex access list with multiple contracts
    std.debug.print("4. Complex Multi-Contract Access List\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const uniswap_router = try Address.fromHex("0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D");
    const weth_contract = try Address.fromHex("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2");

    var complex_access_list = try allocator.alloc(AccessListItem, 3);
    defer allocator.free(complex_access_list);

    complex_access_list[0] = AccessListItem{
        .address = uniswap_router,
        .storage_keys = &[_][32]u8{}, // Router state
    };
    complex_access_list[1] = AccessListItem{
        .address = token_contract,
        .storage_keys = &[_][32]u8{sender_balance_slot}, // Token balance
    };
    complex_access_list[2] = AccessListItem{
        .address = weth_contract,
        .storage_keys = &[_][32]u8{sender_balance_slot}, // WETH balance
    };

    std.debug.print("  Transaction: Uniswap token swap\n", .{});
    std.debug.print("  Access List:\n", .{});
    for (complex_access_list, 0..) |entry, i| {
        std.debug.print("    [{d}] 0x{X}\n", .{ i, entry.address.bytes });
        std.debug.print("        Storage keys: {}\n", .{entry.storage_keys.len});
    }
    std.debug.print("\n", .{});

    // Example 5: When to use access lists
    std.debug.print("5. Access List Best Practices\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});
    std.debug.print("✓ Use access lists when:\n", .{});
    std.debug.print("  • Accessing same storage multiple times\n", .{});
    std.debug.print("  • Complex contract interactions\n", .{});
    std.debug.print("  • Gas savings > access list overhead\n", .{});
    std.debug.print("\n", .{});
    std.debug.print("✗ Avoid access lists when:\n", .{});
    std.debug.print("  • Simple ETH transfers\n", .{});
    std.debug.print("  • Single storage read\n", .{});
    std.debug.print("  • Small transactions\n", .{});
    std.debug.print("\n", .{});

    // Example 6: EIP-2930 vs Legacy comparison
    std.debug.print("6. EIP-2930 vs Legacy Comparison\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});
    std.debug.print("Feature                  Legacy    EIP-2930\n", .{});
    std.debug.print("Type byte                None      0x01\n", .{});
    std.debug.print("Chain ID                 In v      Explicit\n", .{});
    std.debug.print("Signature format         v/r/s     yParity/r/s\n", .{});
    std.debug.print("Gas pricing              Fixed     Fixed\n", .{});
    std.debug.print("Access list support      No        Yes\n", .{});
    std.debug.print("Gas optimization         No        Yes\n", .{});
    std.debug.print("\n", .{});

    // Example 7: Converting y_parity to v (and vice versa)
    std.debug.print("7. yParity vs v Conversion\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const chain_id: u64 = 1;
    const y_parity: u8 = 0;

    // Legacy v = chain_id * 2 + 35 + y_parity
    const legacy_v = chain_id * 2 + 35 + y_parity;

    std.debug.print("Chain ID: {}\n", .{chain_id});
    std.debug.print("yParity (EIP-2930): {}\n", .{y_parity});
    std.debug.print("v (Legacy): {}\n", .{legacy_v});
    std.debug.print("\n", .{});
    std.debug.print("Conversion formulas:\n", .{});
    std.debug.print("  EIP-2930 → Legacy: v = chain_id * 2 + 35 + y_parity\n", .{});
    std.debug.print("  Legacy → EIP-2930: y_parity = v % 2\n", .{});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
