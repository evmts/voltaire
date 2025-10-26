//! EIP-4844 Blob Transaction Example
//!
//! This example demonstrates how to create and work with EIP-4844 blob transactions,
//! which are used for layer 2 scaling by providing temporary blob storage.
//!
//! Key Concepts:
//! - Blob versioned hashes for KZG commitments
//! - Separate blob gas market with dynamic pricing
//! - Max fee per blob gas calculation
//! - Transaction serialization and signing
//! - Blob gas economics

const std = @import("std");
const primitives = @import("primitives");
const crypto_pkg = @import("crypto");

const Transaction = primitives.Transaction;
const Eip4844Transaction = Transaction.Eip4844Transaction;
const Address = primitives.Address.Address;
const AccessListItem = Transaction.AccessListItem;
const Blob = primitives.Blob;
const VersionedHash = Blob.VersionedHash;
const BlobCommitment = Blob.BlobCommitment;
const Crypto = crypto_pkg.Crypto;
const hash_mod = crypto_pkg.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n" ++ "=" ** 80 ++ "\n", .{});
    std.debug.print("  EIP-4844 Blob Transaction Example\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    // Example 1: Understanding Blob Versioned Hashes
    std.debug.print("1. Creating Blob Versioned Hashes\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // In a real scenario, these commitments would come from KZG commitment
    // computation on the actual blob data. Here we use example commitments.
    const commitment1: BlobCommitment = [_]u8{0x01} ** 48;
    const commitment2: BlobCommitment = [_]u8{0x02} ** 48;
    const commitment3: BlobCommitment = [_]u8{0x03} ** 48;

    // Convert commitments to versioned hashes
    // versioned_hash = 0x01 || sha256(commitment)[1:]
    const versioned_hash_1 = Blob.commitmentToVersionedHash(commitment1);
    const versioned_hash_2 = Blob.commitmentToVersionedHash(commitment2);
    const versioned_hash_3 = Blob.commitmentToVersionedHash(commitment3);

    std.debug.print("  Blob 1 versioned hash: 0x{X}\n", .{versioned_hash_1.bytes});
    std.debug.print("  Blob 2 versioned hash: 0x{X}\n", .{versioned_hash_2.bytes});
    std.debug.print("  Blob 3 versioned hash: 0x{X}\n", .{versioned_hash_3.bytes});
    std.debug.print("  Version byte: 0x{x:0>2} (KZG commitment version)\n", .{Blob.BLOB_COMMITMENT_VERSION_KZG});
    std.debug.print("\n", .{});

    // Example 2: Understanding Blob Gas Economics
    std.debug.print("2. Blob Gas Economics and Pricing\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Calculate blob gas pricing based on network congestion
    const excess_blob_gas: u64 = 2 * Blob.BLOB_GAS_PER_BLOB; // 2 blobs worth of excess
    const blob_base_fee = Blob.calculateBlobGasPrice(excess_blob_gas);

    std.debug.print("  Blob gas per blob: {} gas\n", .{Blob.BLOB_GAS_PER_BLOB});
    std.debug.print("  Max blobs per transaction: {}\n", .{Blob.MAX_BLOBS_PER_TRANSACTION});
    std.debug.print("  Current excess blob gas: {} gas\n", .{excess_blob_gas});
    std.debug.print("  Current blob base fee: {} wei\n", .{blob_base_fee});
    std.debug.print("\n", .{});

    // Calculate max_fee_per_blob_gas (similar to max_fee_per_gas for regular gas)
    // Users typically set this to blob_base_fee * buffer (e.g., 1.2x for 20% buffer)
    const buffer_multiplier = 120; // 120% (20% buffer)
    const max_fee_per_blob_gas = (blob_base_fee * buffer_multiplier) / 100;

    std.debug.print("  Recommended max_fee_per_blob_gas: {} wei\n", .{max_fee_per_blob_gas});
    std.debug.print("  (blob_base_fee * 1.2 for 20% buffer)\n", .{});
    std.debug.print("\n", .{});

    // Example 3: Creating an EIP-4844 Blob Transaction
    std.debug.print("3. Creating an EIP-4844 Blob Transaction\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const recipient = try Address.fromHex("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Blob transactions require all three versioned hashes
    const blob_versioned_hashes = [_]VersionedHash{
        versioned_hash_1,
        versioned_hash_2,
        versioned_hash_3,
    };

    // Create the unsigned blob transaction
    const unsigned_blob_tx = Eip4844Transaction{
        .chain_id = 1, // Ethereum mainnet
        .nonce = 42,
        .max_priority_fee_per_gas = 2_000_000_000, // 2 gwei priority fee
        .max_fee_per_gas = 30_000_000_000, // 30 gwei max fee
        .gas_limit = 100000, // Higher than standard transfer due to blob handling
        .to = recipient, // Note: blob transactions MUST have a recipient (cannot be null)
        .value = 0, // No ETH transfer in this example
        .data = &[_]u8{}, // Could include calldata for contract interaction
        .access_list = &[_]AccessListItem{}, // Empty access list
        .max_fee_per_blob_gas = max_fee_per_blob_gas,
        .blob_versioned_hashes = &blob_versioned_hashes,
        .v = 0, // Unsigned (will be set during signing)
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Transaction Fields:\n", .{});
    std.debug.print("    Chain ID: {}\n", .{unsigned_blob_tx.chain_id});
    std.debug.print("    Nonce: {}\n", .{unsigned_blob_tx.nonce});
    std.debug.print("    To: 0x{X}\n", .{recipient.bytes});
    std.debug.print("    Max Priority Fee: {} gwei\n", .{unsigned_blob_tx.max_priority_fee_per_gas / 1_000_000_000});
    std.debug.print("    Max Fee Per Gas: {} gwei\n", .{unsigned_blob_tx.max_fee_per_gas / 1_000_000_000});
    std.debug.print("    Gas Limit: {}\n", .{unsigned_blob_tx.gas_limit});
    std.debug.print("    Max Fee Per Blob Gas: {} wei\n", .{unsigned_blob_tx.max_fee_per_blob_gas});
    std.debug.print("    Blob Count: {}\n", .{unsigned_blob_tx.blob_versioned_hashes.len});
    std.debug.print("\n", .{});

    // Example 4: Calculate Blob Gas Costs
    std.debug.print("4. Calculating Blob Gas Costs\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const total_blob_gas = unsigned_blob_tx.blob_versioned_hashes.len * Blob.BLOB_GAS_PER_BLOB;
    const estimated_blob_cost = total_blob_gas * blob_base_fee;
    const max_blob_cost = total_blob_gas * max_fee_per_blob_gas;

    std.debug.print("  Total blob gas: {} gas\n", .{total_blob_gas});
    std.debug.print("  Estimated blob cost: {} wei ({d} ETH)\n", .{ estimated_blob_cost, @as(f64, @floatFromInt(estimated_blob_cost)) / 1e18 });
    std.debug.print("  Maximum blob cost: {} wei ({d} ETH)\n", .{ max_blob_cost, @as(f64, @floatFromInt(max_blob_cost)) / 1e18 });
    std.debug.print("\n", .{});

    std.debug.print("  Note: Blob gas is paid separately from regular gas.\n", .{});
    std.debug.print("  Total transaction cost = regular gas cost + blob gas cost\n", .{});
    std.debug.print("\n", .{});

    // Example 5: Encode Transaction for Signing
    std.debug.print("5. Encoding Transaction for Signing\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const encoded = try Transaction.encodeEip4844ForSigning(allocator, unsigned_blob_tx);
    defer allocator.free(encoded);

    std.debug.print("  Encoded transaction length: {} bytes\n", .{encoded.len});
    std.debug.print("  Transaction type byte: 0x{x:0>2} (EIP-4844)\n", .{encoded[0]});
    std.debug.print("  Encoded (first 64 bytes): 0x{X}\n", .{encoded[0..@min(64, encoded.len)]});
    std.debug.print("\n", .{});

    // Example 6: Sign the Transaction
    std.debug.print("6. Signing the Blob Transaction\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Test private key (DO NOT use in production!)
    const private_key = Crypto.PrivateKey{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    // Sign the encoded transaction
    const signed_blob_tx = try Transaction.signEip4844Transaction(
        allocator,
        unsigned_blob_tx,
        private_key,
    );

    std.debug.print("  Signature:\n", .{});
    std.debug.print("    v: {}\n", .{signed_blob_tx.v});
    std.debug.print("    r: 0x{X}\n", .{signed_blob_tx.r});
    std.debug.print("    s: 0x{X}\n", .{signed_blob_tx.s});
    std.debug.print("\n", .{});

    // Example 7: Compute Transaction Hash
    std.debug.print("7. Computing Transaction Hash\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const tx_hash = try Transaction.computeEip4844TransactionHash(allocator, signed_blob_tx);

    std.debug.print("  Transaction Hash: 0x{X}\n", .{tx_hash});
    std.debug.print("  This hash uniquely identifies the blob transaction\n", .{});
    std.debug.print("\n", .{});

    // Example 8: Blob Transaction Validation
    std.debug.print("8. Validating Blob Transaction\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Create a BlobTransaction for validation
    const blob_tx_validator = Blob.BlobTransaction{
        .max_fee_per_blob_gas = signed_blob_tx.max_fee_per_blob_gas,
        .blob_versioned_hashes = signed_blob_tx.blob_versioned_hashes,
    };

    try blob_tx_validator.validate();
    std.debug.print("  Validation passed!\n", .{});
    std.debug.print("  - Blob count is between 1 and {}\n", .{Blob.MAX_BLOBS_PER_TRANSACTION});
    std.debug.print("  - All versioned hashes are valid (version 0x01)\n", .{});
    std.debug.print("  - Max fee per blob gas is non-zero\n", .{});
    std.debug.print("\n", .{});

    // Example 9: Blob Gas Usage Statistics
    std.debug.print("9. Blob Gas Usage Statistics\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const blob_gas_used = blob_tx_validator.blobGasUsed();
    const blob_gas_cost = blob_tx_validator.blobGasCost(blob_base_fee);

    std.debug.print("  Blob gas used: {} gas\n", .{blob_gas_used});
    std.debug.print("  Blob gas cost: {} wei\n", .{blob_gas_cost});
    std.debug.print("  Average cost per blob: {} wei\n", .{blob_gas_cost / blob_versioned_hashes.len});
    std.debug.print("\n", .{});

    // Example 10: Understanding Excess Blob Gas
    std.debug.print("10. Understanding Excess Blob Gas Dynamics\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Simulating block progression:\n", .{});
    var current_excess: u64 = 0;

    // Block 1: Low usage (1 blob)
    const block1_usage = Blob.BLOB_GAS_PER_BLOB;
    var price = Blob.calculateBlobGasPrice(current_excess);
    std.debug.print("    Block 1: {} blobs used, price = {} wei\n", .{ block1_usage / Blob.BLOB_GAS_PER_BLOB, price });
    current_excess = Blob.calculateExcessBlobGas(current_excess, block1_usage);

    // Block 2: High usage (6 blobs - maximum)
    const block2_usage = 6 * Blob.BLOB_GAS_PER_BLOB;
    price = Blob.calculateBlobGasPrice(current_excess);
    std.debug.print("    Block 2: {} blobs used, price = {} wei\n", .{ block2_usage / Blob.BLOB_GAS_PER_BLOB, price });
    current_excess = Blob.calculateExcessBlobGas(current_excess, block2_usage);

    // Block 3: High usage again (6 blobs)
    const block3_usage = 6 * Blob.BLOB_GAS_PER_BLOB;
    price = Blob.calculateBlobGasPrice(current_excess);
    std.debug.print("    Block 3: {} blobs used, price = {} wei (price increased!)\n", .{ block3_usage / Blob.BLOB_GAS_PER_BLOB, price });
    current_excess = Blob.calculateExcessBlobGas(current_excess, block3_usage);

    // Block 4: Low usage (1 blob)
    const block4_usage = Blob.BLOB_GAS_PER_BLOB;
    price = Blob.calculateBlobGasPrice(current_excess);
    std.debug.print("    Block 4: {} blobs used, price = {} wei\n", .{ block4_usage / Blob.BLOB_GAS_PER_BLOB, price });
    current_excess = Blob.calculateExcessBlobGas(current_excess, block4_usage);

    std.debug.print("\n", .{});
    std.debug.print("  Target blob gas per block: {} gas (3 blobs)\n", .{3 * Blob.BLOB_GAS_PER_BLOB});
    std.debug.print("  Usage above target increases price, below target decreases price\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("=" ** 80 ++ "\n", .{});
    std.debug.print("  Example Complete!\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    std.debug.print("Key Takeaways:\n", .{});
    std.debug.print("- EIP-4844 transactions use blob_versioned_hashes for KZG commitments\n", .{});
    std.debug.print("- Blob gas is separate from regular gas with its own fee market\n", .{});
    std.debug.print("- max_fee_per_blob_gas works like max_fee_per_gas for blob gas\n", .{});
    std.debug.print("- Transactions can include 1-6 blobs (131KB each)\n", .{});
    std.debug.print("- Blob data is temporary and pruned after ~18 days\n", .{});
    std.debug.print("- Blob gas price adjusts based on network congestion (excess blob gas)\n", .{});
    std.debug.print("- Transaction type 0x03 indicates EIP-4844 blob transaction\n", .{});
    std.debug.print("- Blob transactions MUST have a recipient (to cannot be null)\n\n", .{});
}
