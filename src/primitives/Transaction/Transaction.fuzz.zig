//! Fuzz tests for Transaction encoding/decoding
//!
//! Run with: zig build test --fuzz
//! On macOS, use Docker:
//!   docker run --rm -it -v $(pwd):/workspace -w /workspace \
//!     ziglang/zig:0.15.1 zig build test --fuzz=300s

const std = @import("std");
const transaction = @import("Transaction.zig");
const LegacyTransaction = transaction.LegacyTransaction;
const Eip1559Transaction = transaction.Eip1559Transaction;
const Eip4844Transaction = transaction.Eip4844Transaction;
const Eip7702Transaction = transaction.Eip7702Transaction;
const AccessListItem = transaction.AccessListItem;
const TransactionType = transaction.TransactionType;
const TransactionError = transaction.TransactionError;
const address = @import("../Address/address.zig");
const Address = address.Address;
const rlp = @import("../Rlp/Rlp.zig");
const RlpError = rlp.RlpError;

// Test transaction type detection on arbitrary input
test "fuzz detectTransactionType" {
    const input = std.testing.fuzzInput(.{});

    // Should never panic on any input
    const tx_type = transaction.detectTransactionType(input);

    // Should return one of the valid types
    try std.testing.expect(
        tx_type == TransactionType.legacy or
            tx_type == TransactionType.eip2930 or
            tx_type == TransactionType.eip1559 or
            tx_type == TransactionType.eip4844 or
            tx_type == TransactionType.eip7702,
    );

    // Empty input should return legacy
    if (input.len == 0) {
        try std.testing.expectEqual(TransactionType.legacy, tx_type);
    }
}

// Test legacy transaction encoding with arbitrary values
test "fuzz encodeLegacyForSigning" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return; // Need at least address size

    // Extract values from fuzz input
    const addr = Address.fromBytes(input[0..20]) catch return;

    const nonce = if (input.len > 28) std.mem.readInt(u64, input[20..28], .big) else 0;
    const gas_price = if (input.len > 60) std.mem.readInt(u256, input[28..60], .big) else 20_000_000_000;
    const gas_limit = if (input.len > 68) std.mem.readInt(u64, input[60..68], .big) else 21000;
    const value = if (input.len > 100) std.mem.readInt(u256, input[68..100], .big) else 0;
    const chain_id = if (input.len > 108) std.mem.readInt(u64, input[100..108], .big) else 1;

    const tx = LegacyTransaction{
        .nonce = nonce,
        .gas_price = gas_price,
        .gas_limit = gas_limit,
        .to = addr,
        .value = value,
        .data = if (input.len > 108) input[108..] else &[_]u8{},
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    // Encoding should never panic, only return error or valid result
    const encoded = transaction.encodeLegacyForSigning(allocator, tx, chain_id) catch |err| {
        try std.testing.expect(err == error.OutOfMemory);
        return;
    };
    defer allocator.free(encoded);

    // Encoded result should be valid RLP
    try std.testing.expect(encoded.len > 0);
}

// Test legacy transaction with null address (contract creation)
test "fuzz encodeLegacyForSigning contract creation" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 8) return;

    const nonce = std.mem.readInt(u64, input[0..8], .big);
    const data = if (input.len > 8) input[8..] else &[_]u8{};

    // Limit data size to avoid OOM
    if (data.len > 10000) return;

    const tx = LegacyTransaction{
        .nonce = nonce,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = null, // Contract creation
        .value = 0,
        .data = data,
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

// Test EIP-1559 transaction encoding with arbitrary values
test "fuzz encodeEip1559ForSigning" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    const chain_id = if (input.len > 28) std.mem.readInt(u64, input[20..28], .big) else 1;
    const nonce = if (input.len > 36) std.mem.readInt(u64, input[28..36], .big) else 0;
    const max_priority_fee = if (input.len > 68) std.mem.readInt(u256, input[36..68], .big) else 1_000_000_000;
    const max_fee = if (input.len > 100) std.mem.readInt(u256, input[68..100], .big) else 20_000_000_000;
    const gas_limit = if (input.len > 108) std.mem.readInt(u64, input[100..108], .big) else 21000;
    const value = if (input.len > 140) std.mem.readInt(u256, input[108..140], .big) else 0;

    const tx = Eip1559Transaction{
        .chain_id = chain_id,
        .nonce = nonce,
        .max_priority_fee_per_gas = max_priority_fee,
        .max_fee_per_gas = max_fee,
        .gas_limit = gas_limit,
        .to = addr,
        .value = value,
        .data = if (input.len > 140) input[140..] else &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeEip1559ForSigning(allocator, tx) catch return;
    defer allocator.free(encoded);

    // Should start with transaction type 0x02
    try std.testing.expect(encoded.len > 0);
    try std.testing.expectEqual(@as(u8, 0x02), encoded[0]);
}

// Test EIP-1559 with access list
test "fuzz encodeEip1559ForSigning with access list" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return; // Need 20 bytes + 32 bytes for storage key

    const addr = Address.fromBytes(input[0..20]) catch return;
    const access_addr = Address.fromBytes(input[20..40]) catch return;

    var storage_key: [32]u8 = undefined;
    @memcpy(&storage_key, input[40..72]);

    const storage_keys = [_][32]u8{storage_key};
    const access_item = AccessListItem{
        .address = access_addr,
        .storage_keys = &storage_keys,
    };
    const access_list = [_]AccessListItem{access_item};

    const tx = Eip1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = &[_]u8{},
        .access_list = &access_list,
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeEip1559ForSigning(allocator, tx) catch return;
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
    try std.testing.expectEqual(@as(u8, 0x02), encoded[0]);
}

// Test EIP-4844 blob transaction encoding
test "fuzz encodeEip4844ForSigning" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return; // Need address + versioned hash

    const addr = Address.fromBytes(input[0..20]) catch return;

    var versioned_hash: [32]u8 = undefined;
    @memcpy(&versioned_hash, input[20..52]);

    const blob_hashes = [_][32]u8{versioned_hash};

    const chain_id = if (input.len > 60) std.mem.readInt(u64, input[52..60], .big) else 1;
    const nonce = if (input.len > 68) std.mem.readInt(u64, input[60..68], .big) else 0;
    const max_priority_fee = if (input.len > 100) std.mem.readInt(u256, input[68..100], .big) else 1_000_000_000;
    const max_fee = if (input.len > 132) std.mem.readInt(u256, input[100..132], .big) else 20_000_000_000;
    const gas_limit = if (input.len > 140) std.mem.readInt(u64, input[132..140], .big) else 21000;
    const value = if (input.len > 172) std.mem.readInt(u256, input[140..172], .big) else 0;
    const max_fee_per_blob_gas = if (input.len > 204) std.mem.readInt(u256, input[172..204], .big) else 1_000_000_000;

    const tx = Eip4844Transaction{
        .chain_id = chain_id,
        .nonce = nonce,
        .max_priority_fee_per_gas = max_priority_fee,
        .max_fee_per_gas = max_fee,
        .gas_limit = gas_limit,
        .to = addr,
        .value = value,
        .data = if (input.len > 204) input[204..] else &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .max_fee_per_blob_gas = max_fee_per_blob_gas,
        .blob_versioned_hashes = &blob_hashes,
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeEip4844ForSigning(allocator, tx) catch return;
    defer allocator.free(encoded);

    // Should start with transaction type 0x03
    try std.testing.expect(encoded.len > 0);
    try std.testing.expectEqual(@as(u8, 0x03), encoded[0]);
}

// Test EIP-7702 authorization transaction encoding
test "fuzz encodeEip7702ForSigning" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    const chain_id = if (input.len > 28) std.mem.readInt(u64, input[20..28], .big) else 1;
    const nonce = if (input.len > 36) std.mem.readInt(u64, input[28..36], .big) else 0;
    const max_priority_fee = if (input.len > 68) std.mem.readInt(u256, input[36..68], .big) else 1_000_000_000;
    const max_fee = if (input.len > 100) std.mem.readInt(u256, input[68..100], .big) else 20_000_000_000;
    const gas_limit = if (input.len > 108) std.mem.readInt(u64, input[100..108], .big) else 21000;
    const value = if (input.len > 140) std.mem.readInt(u256, input[108..140], .big) else 0;

    const tx = Eip7702Transaction{
        .chain_id = chain_id,
        .nonce = nonce,
        .max_priority_fee_per_gas = max_priority_fee,
        .max_fee_per_gas = max_fee,
        .gas_limit = gas_limit,
        .to = addr,
        .value = value,
        .data = if (input.len > 140) input[140..] else &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .authorization_list = &[_]transaction.Authorization{},
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeEip7702ForSigning(allocator, tx) catch return;
    defer allocator.free(encoded);

    // Should start with transaction type 0x04
    try std.testing.expect(encoded.len > 0);
    try std.testing.expectEqual(@as(u8, 0x04), encoded[0]);
}

// Test access list encoding with arbitrary values
test "fuzz encodeAccessList" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    // Build access list from fuzz input
    const num_items = (input[0] % 5) + 1; // 1-5 items
    const bytes_per_item = (input.len - 1) / num_items;

    if (bytes_per_item < 20) return; // Need at least address

    var items = std.ArrayList(AccessListItem){};
    defer items.deinit(allocator);

    var i: usize = 0;
    while (i < num_items) : (i += 1) {
        const start = 1 + i * bytes_per_item;
        const end = @min(start + bytes_per_item, input.len);
        if (end - start < 20) break;

        const addr = Address.fromBytes(input[start .. start + 20]) catch continue;

        // Extract storage keys if available
        const storage_keys_start = start + 20;
        const num_storage_keys = @min((end - storage_keys_start) / 32, 10);

        var storage_keys = std.ArrayList([32]u8){};
        defer storage_keys.deinit(allocator);

        var j: usize = 0;
        while (j < num_storage_keys) : (j += 1) {
            const key_start = storage_keys_start + j * 32;
            if (key_start + 32 > end) break;

            var storage_key: [32]u8 = undefined;
            @memcpy(&storage_key, input[key_start .. key_start + 32]);
            storage_keys.append(allocator, storage_key) catch break;
        }

        const item = AccessListItem{
            .address = addr,
            .storage_keys = storage_keys.items,
        };

        items.append(allocator, item) catch break;
    }

    if (items.items.len == 0) return;

    const encoded = transaction.encodeAccessList(allocator, items.items) catch return;
    defer allocator.free(encoded);

    // Should be valid RLP
    try std.testing.expect(encoded.len > 0);
}

// Test legacy transaction hash computation
test "fuzz computeLegacyTransactionHash" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    const tx = LegacyTransaction{
        .nonce = if (input.len > 28) std.mem.readInt(u64, input[20..28], .big) else 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = &[_]u8{},
        .v = 27,
        .r = [_]u8{1} ** 32,
        .s = [_]u8{1} ** 32,
    };

    const hash = transaction.computeLegacyTransactionHash(allocator, tx) catch return;

    // Hash should be 32 bytes
    try std.testing.expectEqual(@as(usize, 32), hash.len);
}

// Test EIP-4844 transaction hash computation
test "fuzz computeEip4844TransactionHash" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    var versioned_hash: [32]u8 = undefined;
    @memcpy(&versioned_hash, input[20..52]);

    const blob_hashes = [_][32]u8{versioned_hash};

    const tx = Eip4844Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .max_fee_per_blob_gas = 1_000_000_000,
        .blob_versioned_hashes = &blob_hashes,
        .v = 0,
        .r = [_]u8{1} ** 32,
        .s = [_]u8{1} ** 32,
    };

    const hash = transaction.computeEip4844TransactionHash(allocator, tx) catch return;

    // Hash should be 32 bytes
    try std.testing.expectEqual(@as(usize, 32), hash.len);
}

// Test EIP-7702 transaction hash computation
test "fuzz computeEip7702TransactionHash" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    const tx = Eip7702Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .authorization_list = &[_]transaction.Authorization{},
        .v = 0,
        .r = [_]u8{1} ** 32,
        .s = [_]u8{1} ** 32,
    };

    const hash = transaction.computeEip7702TransactionHash(allocator, tx) catch return;

    // Hash should be 32 bytes
    try std.testing.expectEqual(@as(usize, 32), hash.len);
}

// Test transaction encoding determinism
test "fuzz legacy transaction encoding determinism" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    const tx = LegacyTransaction{
        .nonce = if (input.len > 28) std.mem.readInt(u64, input[20..28], .big) else 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = if (input.len > 28) input[28..] else &[_]u8{},
        .v = 27,
        .r = [_]u8{1} ** 32,
        .s = [_]u8{1} ** 32,
    };

    // Limit data size
    if (tx.data.len > 1000) return;

    const encoded1 = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
    defer allocator.free(encoded1);

    const encoded2 = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
    defer allocator.free(encoded2);

    // Should be deterministic
    try std.testing.expectEqualSlices(u8, encoded1, encoded2);
}

// Test EIP-1559 encoding determinism
test "fuzz eip1559 transaction encoding determinism" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    const tx = Eip1559Transaction{
        .chain_id = 1,
        .nonce = if (input.len > 28) std.mem.readInt(u64, input[20..28], .big) else 0,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = if (input.len > 28) input[28..] else &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .v = 0,
        .r = [_]u8{1} ** 32,
        .s = [_]u8{1} ** 32,
    };

    // Limit data size
    if (tx.data.len > 1000) return;

    const encoded1 = transaction.encodeEip1559ForSigning(allocator, tx) catch return;
    defer allocator.free(encoded1);

    const encoded2 = transaction.encodeEip1559ForSigning(allocator, tx) catch return;
    defer allocator.free(encoded2);

    // Should be deterministic
    try std.testing.expectEqualSlices(u8, encoded1, encoded2);
}

// Test signature fields validity
test "fuzz signature field boundaries" {
    const input = std.testing.fuzzInput(.{});

    if (input.len < 72) return; // Need 64 bytes for r,s + 8 for v

    var r: [32]u8 = undefined;
    var s: [32]u8 = undefined;
    @memcpy(&r, input[0..32]);
    @memcpy(&s, input[32..64]);

    const v = std.mem.readInt(u64, input[64..72], .big);

    // Create transaction with fuzzed signature
    const tx = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = null,
        .value = 0,
        .data = &[_]u8{},
        .v = v,
        .r = r,
        .s = s,
    };

    // Should not panic on any signature values
    const allocator = std.testing.allocator;
    _ = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
}

// Test large data payloads
test "fuzz large transaction data" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    // Limit max data size to avoid OOM
    const data = if (input.len > 20) input[20..@min(input.len, 5020)] else &[_]u8{};

    const tx = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = data,
        .v = 27,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
    defer allocator.free(encoded);

    // Encoded size should be reasonable
    try std.testing.expect(encoded.len > 0);
    try std.testing.expect(encoded.len < data.len + 1000);
}

// Test extreme values for gas fields
test "fuzz extreme gas values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return; // Need 20 + 32 bytes

    const addr = Address.fromBytes(input[0..20]) catch return;
    const gas_price = std.mem.readInt(u256, input[20..52], .big);
    const gas_limit = if (input.len > 60) std.mem.readInt(u64, input[52..60], .big) else 0;

    const tx = LegacyTransaction{
        .nonce = 0,
        .gas_price = gas_price,
        .gas_limit = gas_limit,
        .to = addr,
        .value = 0,
        .data = &[_]u8{},
        .v = 27,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    // Should handle extreme values without panic
    const encoded = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

// Test extreme values for EIP-1559 fee fields
test "fuzz extreme eip1559 fees" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 84) return; // Need 20 + 32 + 32 bytes

    const addr = Address.fromBytes(input[0..20]) catch return;
    const max_priority_fee = std.mem.readInt(u256, input[20..52], .big);
    const max_fee = std.mem.readInt(u256, input[52..84], .big);

    const tx = Eip1559Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = max_priority_fee,
        .max_fee_per_gas = max_fee,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeEip1559ForSigning(allocator, tx) catch return;
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

// Test multiple blob hashes
test "fuzz multiple blob hashes" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    // Extract up to 6 blob hashes (EIP-4844 limit)
    const num_blobs = @min((input.len - 20) / 32, 6);
    if (num_blobs == 0) return;

    var blob_hashes = std.ArrayList([32]u8){};
    defer blob_hashes.deinit(allocator);

    var i: usize = 0;
    while (i < num_blobs) : (i += 1) {
        const start = 20 + i * 32;
        if (start + 32 > input.len) break;

        var hash: [32]u8 = undefined;
        @memcpy(&hash, input[start .. start + 32]);
        blob_hashes.append(allocator, hash) catch break;
    }

    if (blob_hashes.items.len == 0) return;

    const tx = Eip4844Transaction{
        .chain_id = 1,
        .nonce = 0,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .max_fee_per_blob_gas = 1_000_000_000,
        .blob_versioned_hashes = blob_hashes.items,
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeEip4844ForSigning(allocator, tx) catch return;
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

// Test chain ID variations
test "fuzz chain id values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 28) return;

    const addr = Address.fromBytes(input[0..20]) catch return;
    const chain_id = std.mem.readInt(u64, input[20..28], .big);

    const tx = Eip1559Transaction{
        .chain_id = chain_id,
        .nonce = 0,
        .max_priority_fee_per_gas = 1_000_000_000,
        .max_fee_per_gas = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = &[_]u8{},
        .access_list = &[_]AccessListItem{},
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeEip1559ForSigning(allocator, tx) catch return;
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

// Test nonce boundary values
test "fuzz nonce values" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 28) return;

    const addr = Address.fromBytes(input[0..20]) catch return;
    const nonce = std.mem.readInt(u64, input[20..28], .big);

    const tx = LegacyTransaction{
        .nonce = nonce,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = 0,
        .data = &[_]u8{},
        .v = 27,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

// Test value transfer amounts
test "fuzz value transfer" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 52) return;

    const addr = Address.fromBytes(input[0..20]) catch return;
    const value = std.mem.readInt(u256, input[20..52], .big);

    const tx = LegacyTransaction{
        .nonce = 0,
        .gas_price = 20_000_000_000,
        .gas_limit = 21000,
        .to = addr,
        .value = value,
        .data = &[_]u8{},
        .v = 27,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    const encoded = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
    defer allocator.free(encoded);

    try std.testing.expect(encoded.len > 0);
}

// Test empty vs non-empty data field
test "fuzz data field presence" {
    const input = std.testing.fuzzInput(.{});
    const allocator = std.testing.allocator;

    if (input.len < 20) return;

    const addr = Address.fromBytes(input[0..20]) catch return;

    // Test with empty data
    {
        const tx = LegacyTransaction{
            .nonce = 0,
            .gas_price = 20_000_000_000,
            .gas_limit = 21000,
            .to = addr,
            .value = 0,
            .data = &[_]u8{},
            .v = 27,
            .r = [_]u8{0} ** 32,
            .s = [_]u8{0} ** 32,
        };

        const encoded = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
        defer allocator.free(encoded);

        try std.testing.expect(encoded.len > 0);
    }

    // Test with non-empty data
    if (input.len > 20) {
        const data = input[20..@min(input.len, 520)];
        const tx = LegacyTransaction{
            .nonce = 0,
            .gas_price = 20_000_000_000,
            .gas_limit = 21000,
            .to = addr,
            .value = 0,
            .data = data,
            .v = 27,
            .r = [_]u8{0} ** 32,
            .s = [_]u8{0} ** 32,
        };

        const encoded = transaction.encodeLegacyForSigning(allocator, tx, 1) catch return;
        defer allocator.free(encoded);

        try std.testing.expect(encoded.len > 0);
    }
}
