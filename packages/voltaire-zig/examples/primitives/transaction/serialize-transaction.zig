// Transaction Serialization Example
//
// Demonstrates RLP encoding/decoding for:
// - Legacy transaction serialization
// - EIP-1559 transaction serialization
// - Type detection from bytes
// - Round-trip serialization

const std = @import("std");
const primitives = @import("primitives");

const Transaction = primitives.Transaction;
const LegacyTransaction = Transaction.LegacyTransaction;
const Eip1559Transaction = Transaction.Eip1559Transaction;
const Address = primitives.Address.Address;
const TransactionType = Transaction.TransactionType;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Transaction Serialization Examples ===\n\n", .{});

    // Example 1: Serialize Legacy transaction
    std.debug.print("1. Legacy Transaction Serialization\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const recipient = try Address.fromHex("0x3535353535353535353535353535353535353535");

    const legacy_tx = LegacyTransaction{
        .nonce = 9,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .v = 37,
        .r = [_]u8{
            0x28, 0xef, 0x61, 0x34, 0x0b, 0xd9, 0x39, 0xbc,
            0x21, 0x95, 0xfe, 0x53, 0x75, 0x67, 0x86, 0x60,
            0x03, 0xe1, 0xa1, 0x5d, 0x3c, 0x71, 0xff, 0x63,
            0xe1, 0x59, 0x06, 0x20, 0xaa, 0x63, 0x62, 0x76,
        },
        .s = [_]u8{
            0x67, 0xcb, 0xe9, 0xd8, 0x99, 0x7f, 0x76, 0x1a,
            0xec, 0xb7, 0x03, 0x30, 0x4b, 0x38, 0x00, 0xcc,
            0xf5, 0x55, 0xc9, 0xf3, 0xdc, 0x64, 0x21, 0x4b,
            0x29, 0x7f, 0xb1, 0x96, 0x6a, 0x3b, 0x6d, 0x83,
        },
    };

    std.debug.print("Original Transaction:\n", .{});
    std.debug.print("  Nonce: {}\n", .{legacy_tx.nonce});
    std.debug.print("  Gas Price: {} gwei\n", .{legacy_tx.gas_price / 1_000_000_000});
    std.debug.print("  To: 0x{X}\n", .{recipient.bytes});
    std.debug.print("\n", .{});

    // Serialize transaction
    const legacy_serialized = try Transaction.serializeLegacy(allocator, legacy_tx);
    defer allocator.free(legacy_serialized);

    std.debug.print("Serialized:\n", .{});
    std.debug.print("  Bytes: 0x{X}\n", .{legacy_serialized});
    std.debug.print("  Length: {} bytes\n", .{legacy_serialized.len});
    std.debug.print("  Format: RLP list (no type prefix for legacy)\n", .{});
    std.debug.print("\n", .{});

    // Detect type
    const detected_type = Transaction.detectTransactionType(legacy_serialized);
    std.debug.print("Detected Type: {s}\n", .{@tagName(detected_type)});
    std.debug.print("\n", .{});

    // Example 2: Serialize EIP-1559 transaction
    std.debug.print("2. EIP-1559 Transaction Serialization\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const eip1559_tx = Eip1559Transaction{
        .chain_id = 1,
        .nonce = 42,
        .max_priority_fee_per_gas = 2_000_000_000,
        .max_fee_per_gas = 30_000_000_000,
        .gas_limit = 21000,
        .to = recipient,
        .value = 1_000_000_000_000_000_000,
        .data = &[_]u8{},
        .access_list = &[_]Transaction.AccessListItem{},
        .v = 0, // yParity
        .r = [_]u8{
            0x28, 0xef, 0x61, 0x34, 0x0b, 0xd9, 0x39, 0xbc,
            0x21, 0x95, 0xfe, 0x53, 0x75, 0x67, 0x86, 0x60,
            0x03, 0xe1, 0xa1, 0x5d, 0x3c, 0x71, 0xff, 0x63,
            0xe1, 0x59, 0x06, 0x20, 0xaa, 0x63, 0x62, 0x76,
        },
        .s = [_]u8{
            0x67, 0xcb, 0xe9, 0xd8, 0x99, 0x7f, 0x76, 0x1a,
            0xec, 0xb7, 0x03, 0x30, 0x4b, 0x38, 0x00, 0xcc,
            0xf5, 0x55, 0xc9, 0xf3, 0xdc, 0x64, 0x21, 0x4b,
            0x29, 0x7f, 0xb1, 0x96, 0x6a, 0x3b, 0x6d, 0x83,
        },
    };

    std.debug.print("Original Transaction:\n", .{});
    std.debug.print("  Type: EIP-1559 (0x02)\n", .{});
    std.debug.print("  Chain ID: {}\n", .{eip1559_tx.chain_id});
    std.debug.print("  Nonce: {}\n", .{eip1559_tx.nonce});
    std.debug.print("\n", .{});

    // Serialize EIP-1559
    const eip1559_serialized = try Transaction.encodeEip1559ForSigning(allocator, eip1559_tx);
    defer allocator.free(eip1559_serialized);

    std.debug.print("Serialized:\n", .{});
    std.debug.print("  Bytes: 0x{X}\n", .{eip1559_serialized});
    std.debug.print("  Length: {} bytes\n", .{eip1559_serialized.len});
    std.debug.print("  Type Byte: 0x{x:0>2}\n", .{eip1559_serialized[0]});
    std.debug.print("  Format: 0x02 || RLP([...])\n", .{});
    std.debug.print("\n", .{});

    // Example 3: Type detection
    std.debug.print("3. Transaction Type Detection\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Legacy transaction (no type prefix)
    const legacy_data = [_]u8{0xf8} ++ [_]u8{0} ** 10;
    const legacy_type = Transaction.detectTransactionType(&legacy_data);
    std.debug.print("Legacy transaction:\n", .{});
    std.debug.print("  First Byte: 0x{x:0>2}\n", .{legacy_data[0]});
    std.debug.print("  Detected Type: {s}\n", .{@tagName(legacy_type)});
    std.debug.print("  Is Legacy: {}\n", .{legacy_type == TransactionType.Legacy});
    std.debug.print("\n", .{});

    // EIP-1559 transaction (0x02 prefix)
    const eip1559_data = [_]u8{0x02} ++ [_]u8{0} ** 10;
    const eip1559_type = Transaction.detectTransactionType(&eip1559_data);
    std.debug.print("EIP-1559 transaction:\n", .{});
    std.debug.print("  First Byte: 0x{x:0>2}\n", .{eip1559_data[0]});
    std.debug.print("  Detected Type: {s}\n", .{@tagName(eip1559_type)});
    std.debug.print("  Is EIP-1559: {}\n", .{eip1559_type == TransactionType.Eip1559});
    std.debug.print("\n", .{});

    // EIP-4844 blob transaction (0x03 prefix)
    const eip4844_data = [_]u8{0x03} ++ [_]u8{0} ** 10;
    const eip4844_type = Transaction.detectTransactionType(&eip4844_data);
    std.debug.print("EIP-4844 blob transaction:\n", .{});
    std.debug.print("  First Byte: 0x{x:0>2}\n", .{eip4844_data[0]});
    std.debug.print("  Detected Type: {s}\n", .{@tagName(eip4844_type)});
    std.debug.print("  Is EIP-4844: {}\n", .{eip4844_type == TransactionType.Eip4844Blob});
    std.debug.print("\n", .{});

    // Example 4: Network transmission format
    std.debug.print("4. Network Transmission Format\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const tx_hash = try Transaction.computeLegacyTransactionHash(allocator, legacy_tx);

    std.debug.print("Broadcasting Transaction:\n", .{});
    std.debug.print("  Transaction Hash: 0x{X}\n", .{tx_hash});
    std.debug.print("  Serialized Size: {} bytes\n", .{legacy_serialized.len});
    std.debug.print("  Ready for:\n", .{});
    std.debug.print("    - Gossip protocol (p2p broadcast)\n", .{});
    std.debug.print("    - Block inclusion (by miners)\n", .{});
    std.debug.print("    - RPC submission (eth_sendRawTransaction)\n", .{});
    std.debug.print("\n", .{});

    // Example 5: RLP encoding structure
    std.debug.print("5. RLP Encoding Structure\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Legacy Transaction RLP:\n", .{});
    std.debug.print("  rlp([nonce, gasPrice, gasLimit, to, value, data, v, r, s])\n", .{});
    std.debug.print("  No type prefix - direct RLP list\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("EIP-1559 Transaction RLP:\n", .{});
    std.debug.print("  0x02 || rlp([chainId, nonce, maxPriorityFee, maxFee, ...\n", .{});
    std.debug.print("              gasLimit, to, value, data, accessList, yParity, r, s])\n", .{});
    std.debug.print("  Type byte prefix + RLP list\n", .{});
    std.debug.print("\n", .{});

    // Example 6: Size comparison
    std.debug.print("6. Serialization Size Comparison\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    std.debug.print("Legacy Transaction:\n", .{});
    std.debug.print("  Size: {} bytes\n", .{legacy_serialized.len});
    std.debug.print("  Fields: 9 (nonce, gasPrice, gasLimit, to, value, data, v, r, s)\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("EIP-1559 Transaction:\n", .{});
    std.debug.print("  Size: {} bytes\n", .{eip1559_serialized.len});
    std.debug.print("  Fields: 12 (chainId, nonce, maxPriorityFee, maxFee, gasLimit,\n", .{});
    std.debug.print("              to, value, data, accessList, yParity, r, s)\n", .{});
    std.debug.print("  Overhead: Type byte (1) + Additional fields\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
