// Transaction Operations Example
//
// This example demonstrates how to work with Ethereum transactions including:
// - Creating legacy transactions
// - Encoding transactions for signing
// - Signing transactions with private keys
// - Computing transaction hashes
// - Detecting transaction types
// - Working with access lists

const std = @import("std");
const primitives = @import("primitives");
const crypto_pkg = @import("crypto");

const Transaction = primitives.Transaction;
const LegacyTransaction = Transaction.LegacyTransaction;
const Eip1559Transaction = Transaction.Eip1559Transaction;
const AccessListItem = Transaction.AccessListItem;
const TransactionType = Transaction.TransactionType;
const Address = primitives.Address.Address;
const Hash = crypto_pkg.Hash.Hash;
const Crypto = crypto_pkg.Crypto;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n=== Ethereum Transaction Operations Example ===\n\n", .{});

    // Example 1: Creating a legacy transaction
    std.debug.print("1. Creating a Legacy Transaction\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Create a simple value transfer transaction
    const recipient = try Address.fromHex("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    const unsigned_tx = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000, // 20 gwei
        .gas_limit = 21000, // Standard transfer
        .to = recipient,
        .value = 1_000_000_000_000_000_000, // 1 ETH
        .data = &[_]u8{}, // No data for simple transfer
        .v = 0, // Unsigned (will be set during signing)
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Nonce: {}\n", .{unsigned_tx.nonce});
    std.debug.print("  Gas Price: {} gwei\n", .{unsigned_tx.gas_price / 1_000_000_000});
    std.debug.print("  Gas Limit: {}\n", .{unsigned_tx.gas_limit});
    std.debug.print("  To: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&recipient.bytes)});
    std.debug.print("  Value: {} ETH\n", .{unsigned_tx.value / 1_000_000_000_000_000_000});
    std.debug.print("\n", .{});

    // Example 2: Encoding transaction for signing (EIP-155)
    std.debug.print("2. Encoding Transaction for Signing (EIP-155)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const chain_id: u64 = 1; // Ethereum mainnet
    const encoded = try Transaction.encodeLegacyForSigning(allocator, unsigned_tx, chain_id);
    defer allocator.free(encoded);

    std.debug.print("  Chain ID: {} (Ethereum Mainnet)\n", .{chain_id});
    std.debug.print("  Encoded Length: {} bytes\n", .{encoded.len});
    std.debug.print("  Encoded (hex): 0x{s}\n", .{std.fmt.fmtSliceHexLower(encoded)});
    std.debug.print("\n", .{});

    // Example 3: Signing a transaction
    std.debug.print("3. Signing a Transaction\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Test private key (DO NOT use in production!)
    const private_key = Crypto.PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    // Sign the transaction
    const signed_tx = try Transaction.signLegacyTransaction(
        allocator,
        unsigned_tx,
        private_key,
        chain_id,
    );

    std.debug.print("  Signature v: {}\n", .{signed_tx.v});
    std.debug.print("  Signature r: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&signed_tx.r)});
    std.debug.print("  Signature s: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&signed_tx.s)});
    std.debug.print("\n", .{});

    // Example 4: Computing transaction hash
    std.debug.print("4. Computing Transaction Hash\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const tx_hash = try Transaction.computeLegacyTransactionHash(allocator, signed_tx);

    std.debug.print("  Transaction Hash: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&tx_hash.bytes)});
    std.debug.print("  This is the unique identifier for this transaction\n", .{});
    std.debug.print("\n", .{});

    // Example 5: Detecting transaction type
    std.debug.print("5. Detecting Transaction Types\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Legacy transaction (no type prefix)
    const legacy_data = [_]u8{0xf8} ++ [_]u8{0} ** 10;
    const legacy_type = Transaction.detectTransactionType(&legacy_data);
    std.debug.print("  Legacy transaction type: {s}\n", .{@tagName(legacy_type)});

    // EIP-1559 transaction (0x02 prefix)
    const eip1559_data = [_]u8{0x02} ++ [_]u8{0} ** 10;
    const eip1559_type = Transaction.detectTransactionType(&eip1559_data);
    std.debug.print("  EIP-1559 transaction type: {s}\n", .{@tagName(eip1559_type)});

    // EIP-4844 blob transaction (0x03 prefix)
    const eip4844_data = [_]u8{0x03} ++ [_]u8{0} ** 10;
    const eip4844_type = Transaction.detectTransactionType(&eip4844_data);
    std.debug.print("  EIP-4844 blob transaction type: {s}\n", .{@tagName(eip4844_type)});
    std.debug.print("\n", .{});

    // Example 6: Working with access lists
    std.debug.print("6. Working with Access Lists (EIP-2930 / EIP-1559)\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Create storage keys
    const storage_key_1 = Hash.fromU256(0).bytes;
    const storage_key_2 = Hash.fromU256(1).bytes;
    const storage_keys = [_][32]u8{ storage_key_1, storage_key_2 };

    // Create access list with one contract and two storage slots
    const contract_addr = try Address.fromHex("0x0000000000000000000000000000000000000001");
    const access_list = [_]AccessListItem{
        .{
            .address = contract_addr,
            .storage_keys = &storage_keys,
        },
    };

    // Encode the access list
    const encoded_access_list = try Transaction.encodeAccessList(allocator, &access_list);
    defer allocator.free(encoded_access_list);

    std.debug.print("  Access list contains:\n", .{});
    std.debug.print("    - Contract: 0x{s}\n", .{std.fmt.fmtSliceHexLower(&contract_addr.bytes)});
    std.debug.print("    - Storage slots: {}\n", .{storage_keys.len});
    std.debug.print("  Encoded access list length: {} bytes\n", .{encoded_access_list.len});
    std.debug.print("\n", .{});

    // Example 7: Creating an EIP-1559 transaction
    std.debug.print("7. Creating an EIP-1559 Transaction\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    const eip1559_tx = Eip1559Transaction{
        .chain_id = 1,
        .nonce = 5,
        .max_priority_fee_per_gas = 2_000_000_000, // 2 gwei tip
        .max_fee_per_gas = 30_000_000_000, // 30 gwei max
        .gas_limit = 50000,
        .to = recipient,
        .value = 500_000_000_000_000_000, // 0.5 ETH
        .data = &[_]u8{}, // No calldata
        .access_list = &access_list,
        .v = 0, // Unsigned
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Chain ID: {}\n", .{eip1559_tx.chain_id});
    std.debug.print("  Nonce: {}\n", .{eip1559_tx.nonce});
    std.debug.print("  Max Priority Fee: {} gwei\n", .{eip1559_tx.max_priority_fee_per_gas / 1_000_000_000});
    std.debug.print("  Max Fee Per Gas: {} gwei\n", .{eip1559_tx.max_fee_per_gas / 1_000_000_000});
    std.debug.print("  Gas Limit: {}\n", .{eip1559_tx.gas_limit});
    std.debug.print("  Value: {} ETH\n", .{eip1559_tx.value / 1_000_000_000_000_000_000});
    std.debug.print("  Access List Items: {}\n", .{eip1559_tx.access_list.len});

    // Encode EIP-1559 transaction
    const encoded_1559 = try Transaction.encodeEip1559ForSigning(allocator, eip1559_tx);
    defer allocator.free(encoded_1559);

    std.debug.print("  Encoded Length: {} bytes\n", .{encoded_1559.len});
    std.debug.print("  Transaction Type Byte: 0x{x:0>2}\n", .{encoded_1559[0]});
    std.debug.print("\n", .{});

    // Example 8: Contract creation transaction
    std.debug.print("8. Contract Creation Transaction\n", .{});
    std.debug.print("-" ** 50 ++ "\n", .{});

    // Simple contract creation bytecode (example)
    const init_code = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };

    const contract_creation_tx = LegacyTransaction{
        .nonce = 10,
        .gas_price = 25_000_000_000, // 25 gwei
        .gas_limit = 200000, // Higher for contract creation
        .to = null, // null means contract creation
        .value = 0, // No ETH sent
        .data = &init_code, // Contract bytecode
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  To: null (Contract Creation)\n", .{});
    std.debug.print("  Gas Limit: {} (higher for contract creation)\n", .{contract_creation_tx.gas_limit});
    std.debug.print("  Init Code Length: {} bytes\n", .{init_code.len});
    std.debug.print("\n", .{});

    std.debug.print("=== Example Complete ===\n\n", .{});
}
