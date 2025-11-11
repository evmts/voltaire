// Transaction Type Detection Example
//
// Demonstrates:
// - Detecting transaction type from type field
// - Type-specific operations for each transaction type
// - Handling all transaction types
// - Feature detection across transaction types

const std = @import("std");
const primitives = @import("primitives");

const Transaction = primitives.Transaction;
const LegacyTransaction = Transaction.LegacyTransaction;
const EIP2930Transaction = Transaction.EIP2930Transaction;
const EIP1559Transaction = Transaction.EIP1559Transaction;
const EIP4844Transaction = Transaction.EIP4844Transaction;
const EIP7702Transaction = Transaction.EIP7702Transaction;
const Address = primitives.Address.Address;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Transaction Type Detection ===\n\n", .{});

    // Example 1: Transaction type enumeration
    std.debug.print("1. Transaction Type Enumeration\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const TypeInfo = struct {
        type_byte: u8,
        name: []const u8,
        introduced: []const u8,
    };

    const types = [_]TypeInfo{
        .{ .type_byte = 0x00, .name = "Legacy", .introduced = "Genesis (2015)" },
        .{ .type_byte = 0x01, .name = "EIP-2930", .introduced = "Berlin (2021)" },
        .{ .type_byte = 0x02, .name = "EIP-1559", .introduced = "London (2021)" },
        .{ .type_byte = 0x03, .name = "EIP-4844", .introduced = "Dencun (2024)" },
        .{ .type_byte = 0x04, .name = "EIP-7702", .introduced = "Pectra (TBD)" },
    };

    std.debug.print("Type  Hex   Name       Hard Fork\n\n", .{});
    for (types) |t| {
        std.debug.print("{d}     0x{X:0>2}   {s:<10} {s}\n", .{ t.type_byte, t.type_byte, t.name, t.introduced });
    }
    std.debug.print("\n", .{});

    // Example 2: Detecting from type byte
    std.debug.print("2. Detecting Transaction Type from Bytes\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Transaction Type Detection Rules:\n\n", .{});
    std.debug.print("  0xf8-0xff → Legacy (RLP list)\n", .{});
    std.debug.print("  0x01      → EIP-2930\n", .{});
    std.debug.print("  0x02      → EIP-1559\n", .{});
    std.debug.print("  0x03      → EIP-4844\n", .{});
    std.debug.print("  0x04      → EIP-7702\n", .{});
    std.debug.print("\n", .{});

    // Example 3: Type-specific operations
    std.debug.print("3. Type-Specific Operations\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const recipient = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e");

    const legacy_tx = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .v = 37, // Chain ID 1
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const eip1559_tx = EIP1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .access_list = &[_]Transaction.AccessListItem{},
        .y_parity = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("Legacy Transaction:\n", .{});
    std.debug.print("  Type: 0x00 (Legacy)\n", .{});
    std.debug.print("  Gas Price: {} gwei\n", .{legacy_tx.gas_price / 1_000_000_000});
    std.debug.print("  v: {}\n", .{legacy_tx.v});

    const legacy_chain_id = if (legacy_tx.v == 27 or legacy_tx.v == 28) null else (legacy_tx.v - 35) / 2;
    if (legacy_chain_id) |cid| {
        std.debug.print("  Chain ID: {} (from v)\n", .{cid});
    }
    std.debug.print("  Has Access List: false\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("EIP-1559 Transaction:\n", .{});
    std.debug.print("  Type: 0x02 (EIP-1559)\n", .{});
    std.debug.print("  Chain ID: {}\n", .{eip1559_tx.chain_id});
    std.debug.print("  Max Fee: {} gwei\n", .{eip1559_tx.max_fee_per_gas / 1_000_000_000});
    std.debug.print("  Priority Fee: {} gwei\n", .{eip1559_tx.max_priority_fee_per_gas / 1_000_000_000});
    std.debug.print("  yParity: {}\n", .{eip1559_tx.y_parity});
    std.debug.print("  Has Access List: true\n", .{});
    std.debug.print("\n", .{});

    // Example 4: Feature detection
    std.debug.print("4. Feature Detection by Transaction Type\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Feature         Legacy  EIP-2930  EIP-1559  EIP-4844  EIP-7702\n", .{});
    std.debug.print("-" ** 60 ++ "\n", .{});
    std.debug.print("Access List     ✗       ✓         ✓         ✓         ✓\n", .{});
    std.debug.print("Dynamic Fees    ✗       ✗         ✓         ✓         ✓\n", .{});
    std.debug.print("Blobs           ✗       ✗         ✗         ✓         ✗\n", .{});
    std.debug.print("Authorization   ✗       ✗         ✗         ✗         ✓\n", .{});
    std.debug.print("Create Contract ✓       ✓         ✓         ✗         ✓\n", .{});
    std.debug.print("\n", .{});

    // Example 5: Type compatibility matrix
    std.debug.print("5. Transaction Type Compatibility\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Network Support:\n", .{});
    std.debug.print("  Pre-Berlin:  Legacy only\n", .{});
    std.debug.print("  Berlin:      Legacy, EIP-2930\n", .{});
    std.debug.print("  London:      Legacy, EIP-2930, EIP-1559\n", .{});
    std.debug.print("  Dencun:      Legacy, EIP-2930, EIP-1559, EIP-4844\n", .{});
    std.debug.print("  Pectra:      All types (including EIP-7702)\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("Gas Pricing:\n", .{});
    std.debug.print("  Legacy:      Fixed gasPrice\n", .{});
    std.debug.print("  EIP-2930:    Fixed gasPrice + access lists\n", .{});
    std.debug.print("  EIP-1559+:   Dynamic (baseFee + priorityFee)\n", .{});
    std.debug.print("\n", .{});

    // Example 6: Signature format differences
    std.debug.print("6. Signature Format Differences\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Transaction Type  Signature Format\n", .{});
    std.debug.print("-" ** 40 ++ "\n", .{});
    std.debug.print("Legacy            v/r/s (v includes chain ID)\n", .{});
    std.debug.print("EIP-2930          yParity/r/s (explicit chain ID)\n", .{});
    std.debug.print("EIP-1559          yParity/r/s (explicit chain ID)\n", .{});
    std.debug.print("EIP-4844          yParity/r/s (explicit chain ID)\n", .{});
    std.debug.print("EIP-7702          yParity/r/s (explicit chain ID)\n", .{});
    std.debug.print("\n", .{});

    // Example 7: RLP encoding differences
    std.debug.print("7. RLP Encoding Differences\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Legacy:   rlp([nonce, gasPrice, ...]) - No type prefix\n", .{});
    std.debug.print("EIP-2930: 0x01 || rlp([chainId, nonce, ...])\n", .{});
    std.debug.print("EIP-1559: 0x02 || rlp([chainId, nonce, ...])\n", .{});
    std.debug.print("EIP-4844: 0x03 || rlp([chainId, nonce, ...])\n", .{});
    std.debug.print("EIP-7702: 0x04 || rlp([chainId, nonce, ...])\n", .{});
    std.debug.print("\n", .{});

    // Example 8: Use case recommendations
    std.debug.print("8. Use Case Recommendations\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("When to use each type:\n\n", .{});
    std.debug.print("Legacy:\n", .{});
    std.debug.print("  • Required by older infrastructure\n", .{});
    std.debug.print("  • Pre-London networks\n", .{});
    std.debug.print("  • Simple transfers\n\n", .{});

    std.debug.print("EIP-2930:\n", .{});
    std.debug.print("  • Gas optimization via access lists\n", .{});
    std.debug.print("  • Berlin+ networks without EIP-1559\n\n", .{});

    std.debug.print("EIP-1559:\n", .{});
    std.debug.print("  • Modern Ethereum mainnet (default)\n", .{});
    std.debug.print("  • Predictable fee market\n", .{});
    std.debug.print("  • Most L2s\n\n", .{});

    std.debug.print("EIP-4844:\n", .{});
    std.debug.print("  • L2 rollup data availability\n", .{});
    std.debug.print("  • Large temporary data (< 768 KB)\n", .{});
    std.debug.print("  • Dencun+ networks\n\n", .{});

    std.debug.print("EIP-7702:\n", .{});
    std.debug.print("  • Temporary smart contract delegation\n", .{});
    std.debug.print("  • Batched operations from EOA\n", .{});
    std.debug.print("  • Account abstraction features\n", .{});

    std.debug.print("\n=== Example Complete ===\n\n", .{});
}
