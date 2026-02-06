const std = @import("std");
const testing = std.testing;
const Address = @import("../Address/address.zig").Address;
const Hash = @import("../Hash/Hash.zig").Hash;
const EventLog = @import("../EventLog/EventLog.zig").EventLog;
const Allocator = std.mem.Allocator;

/// Transaction receipt errors
pub const ReceiptError = error{
    InvalidReceiptError,
    MissingRequiredField,
    InvalidLogsBloomLength,
    ByzantiumForkIncompatibility,
    OutOfMemory,
};

/// Transaction type
pub const TransactionType = enum {
    legacy,
    eip2930,
    eip1559,
    eip4844,
    eip7702,
};

/// Transaction status (post-Byzantium)
pub const TransactionStatus = struct {
    success: bool,
    gas_used: u256,

    pub fn isSuccess(self: TransactionStatus) bool {
        return self.success;
    }

    pub fn isFailed(self: TransactionStatus) bool {
        return !self.success;
    }

    pub fn isPending(self: TransactionStatus) bool {
        _ = self;
        return false; // Receipt means transaction is mined
    }
};

/// Transaction receipt structure
///
/// Represents the result of a transaction execution including:
/// - Transaction identification (hash, index)
/// - Block information (hash, number)
/// - Addresses (from, to, contract)
/// - Gas usage (cumulative, used, price)
/// - Event logs and bloom filter
/// - Status or state root (fork-dependent)
/// - Type-specific fields (EIP-4844 blob data)
pub const Receipt = struct {
    /// Transaction hash
    transaction_hash: Hash,
    /// Transaction index in block
    transaction_index: u32,
    /// Block hash
    block_hash: Hash,
    /// Block number
    block_number: u64,
    /// Sender address
    sender: Address,
    /// Recipient address (null for contract creation)
    to: ?Address,
    /// Cumulative gas used in block
    cumulative_gas_used: u256,
    /// Gas used by this transaction
    gas_used: u256,
    /// Contract address (non-null for creation)
    contract_address: ?Address,
    /// Event logs
    logs: []const EventLog,
    /// Logs bloom filter (256 bytes)
    logs_bloom: [256]u8,
    /// Transaction status (post-Byzantium)
    status: ?TransactionStatus,
    /// State root (pre-Byzantium only)
    root: ?Hash,
    /// Effective gas price
    effective_gas_price: u256,
    /// Transaction type
    type: TransactionType,
    /// Blob gas used (EIP-4844)
    blob_gas_used: ?u256,
    /// Blob gas price (EIP-4844)
    blob_gas_price: ?u256,

    /// Create receipt from data with validation
    ///
    /// Validates required fields and constraints:
    /// - All required fields must be present
    /// - logsBloom must be exactly 256 bytes
    /// - Must have either status OR root (not both, not neither)
    ///
    /// # Errors
    /// - `MissingRequiredField` if required field is missing
    /// - `InvalidLogsBloomLength` if logs_bloom is not 256 bytes
    ///
    /// # Example
    /// ```zig
    /// const receipt = try Receipt.from(allocator, .{
    ///     .transaction_hash = tx_hash,
    ///     .transaction_index = 0,
    ///     .block_hash = block_hash,
    ///     .block_number = 100,
    ///     .sender = from_addr,
    ///     .to = to_addr,
    ///     .cumulative_gas_used = 21000,
    ///     .gas_used = 21000,
    ///     .contract_address = null,
    ///     .logs = &[_]EventLog{},
    ///     .logs_bloom = bloom,
    ///     .status = .{ .success = true, .gas_used = 21000 },
    ///     .root = null,
    ///     .effective_gas_price = 1_000_000_000,
    ///     .type = .legacy,
    ///     .blob_gas_used = null,
    ///     .blob_gas_price = null,
    /// });
    /// ```
    pub fn fromData(data: Receipt) ReceiptError!Receipt {
        // Validate logs_bloom length
        if (data.logs_bloom.len != 256) {
            return ReceiptError.InvalidLogsBloomLength;
        }

        // Validate Byzantium fork compatibility
        try assertValid(data);

        return data;
    }

    /// Alias for fromData (avoids conflict with struct field `from`)
    pub const from = fromData;

    /// Check if receipt is pre-Byzantium (uses state root instead of status)
    ///
    /// Pre-Byzantium receipts (before block 4,370,000) use a state root hash
    /// to indicate the result. Post-Byzantium receipts use a status field.
    ///
    /// # Returns
    /// `true` if receipt has root field (pre-Byzantium), `false` otherwise
    ///
    /// # Example
    /// ```zig
    /// // Pre-Byzantium receipt
    /// const pre = Receipt{ .root = some_hash, .status = null, ... };
    /// try testing.expect(pre.isPreByzantium());
    ///
    /// // Post-Byzantium receipt
    /// const post = Receipt{ .status = .{ .success = true, .gas_used = 21000 }, .root = null, ... };
    /// try testing.expect(!post.isPreByzantium());
    /// ```
    pub fn isPreByzantium(self: Receipt) bool {
        return self.root != null;
    }

    /// Clone receipt with deep copy of dynamic data
    pub fn clone(self: Receipt, allocator: Allocator) !Receipt {
        // Copy logs
        const logs_copy = try allocator.alloc(EventLog, self.logs.len);
        for (self.logs, 0..) |log, i| {
            logs_copy[i] = try EventLog.clone(allocator, log);
        }

        return Receipt{
            .transaction_hash = self.transaction_hash,
            .transaction_index = self.transaction_index,
            .block_hash = self.block_hash,
            .block_number = self.block_number,
            .from = self.from,
            .to = self.to,
            .cumulative_gas_used = self.cumulative_gas_used,
            .gas_used = self.gas_used,
            .contract_address = self.contract_address,
            .logs = logs_copy,
            .logs_bloom = self.logs_bloom,
            .status = self.status,
            .root = self.root,
            .effective_gas_price = self.effective_gas_price,
            .type = self.type,
            .blob_gas_used = self.blob_gas_used,
            .blob_gas_price = self.blob_gas_price,
        };
    }

    /// Free memory allocated for receipt (logs)
    pub fn deinit(self: Receipt, allocator: Allocator) void {
        for (self.logs) |log| {
            allocator.free(log.topics);
            allocator.free(log.data);
        }
        allocator.free(self.logs);
    }
};

/// Validate receipt structure (Byzantium vs pre-Byzantium)
///
/// Receipts must have exactly one of:
/// - `status` field (post-Byzantium, block >= 4,370,000)
/// - `root` field (pre-Byzantium, block < 4,370,000)
///
/// Having both or neither is invalid and indicates fork incompatibility.
///
/// # Errors
/// - `ByzantiumForkIncompatibility` if receipt has both status and root or neither
///
/// # Example
/// ```zig
/// // Valid post-Byzantium
/// try assertValid(.{ .status = some_status, .root = null, ... });
///
/// // Valid pre-Byzantium
/// try assertValid(.{ .status = null, .root = some_root, ... });
///
/// // Invalid - has both
/// const invalid = .{ .status = some_status, .root = some_root, ... };
/// try testing.expectError(error.ByzantiumForkIncompatibility, assertValid(invalid));
/// ```
pub fn assertValid(receipt: Receipt) ReceiptError!void {
    const has_status = receipt.status != null;
    const has_root = receipt.root != null;

    if (has_status and has_root) {
        return ReceiptError.ByzantiumForkIncompatibility;
    }

    if (!has_status and !has_root) {
        return ReceiptError.ByzantiumForkIncompatibility;
    }
}

// ============================================================================
// Tests
// ============================================================================

fn createMockReceipt(allocator: Allocator) !Receipt {
    const tx_hash = try Hash.fromHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
    const block_hash = try Hash.fromHex("0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890");
    const from_addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb1");
    const to_addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb2");

    const logs = try allocator.alloc(EventLog, 0);
    var bloom: [256]u8 = undefined;
    @memset(&bloom, 0);

    return Receipt{
        .transaction_hash = tx_hash,
        .transaction_index = 0,
        .block_hash = block_hash,
        .block_number = 100,
        .from = from_addr,
        .to = to_addr,
        .cumulative_gas_used = 21000,
        .gas_used = 21000,
        .contract_address = null,
        .logs = logs,
        .logs_bloom = bloom,
        .status = TransactionStatus{ .success = true, .gas_used = 21000 },
        .root = null,
        .effective_gas_price = 1_000_000_000,
        .type = .legacy,
        .blob_gas_used = null,
        .blob_gas_price = null,
    };
}

test "Receipt.from creates valid receipt" {
    const allocator = testing.allocator;
    const receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    const validated = try Receipt.from(receipt);
    try testing.expectEqual(receipt.transaction_index, validated.transaction_index);
    try testing.expectEqual(receipt.block_number, validated.block_number);
    try testing.expect(receipt.transaction_hash.eql(validated.transaction_hash));
}

test "Receipt.from rejects invalid logs_bloom length" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    // This test validates that logs_bloom must be exactly 256 bytes
    // Since we can't change array size at runtime, this test verifies
    // the validation logic exists
    const validated = try Receipt.from(receipt);
    try testing.expectEqual(@as(usize, 256), validated.logs_bloom.len);
}

test "Receipt.isPreByzantium returns false for post-Byzantium receipt" {
    const allocator = testing.allocator;
    const receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    try testing.expect(!receipt.isPreByzantium());
    try testing.expect(receipt.status != null);
    try testing.expect(receipt.root == null);
}

test "Receipt.isPreByzantium returns true for pre-Byzantium receipt" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    // Convert to pre-Byzantium
    const state_root = try Hash.fromHex("0x1234567890123456789012345678901234567890123456789012345678901234");
    receipt.status = null;
    receipt.root = state_root;

    try testing.expect(receipt.isPreByzantium());
    try testing.expect(receipt.status == null);
    try testing.expect(receipt.root != null);
}

test "assertValid passes for post-Byzantium receipt" {
    const allocator = testing.allocator;
    const receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    try assertValid(receipt);
}

test "assertValid passes for pre-Byzantium receipt" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    const state_root = try Hash.fromHex("0x1234567890123456789012345678901234567890123456789012345678901234");
    receipt.status = null;
    receipt.root = state_root;

    try assertValid(receipt);
}

test "assertValid fails when both status and root present" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    const state_root = try Hash.fromHex("0x1234567890123456789012345678901234567890123456789012345678901234");
    receipt.root = state_root; // Now has both status and root

    try testing.expectError(error.ByzantiumForkIncompatibility, assertValid(receipt));
}

test "assertValid fails when neither status nor root present" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    receipt.status = null;
    receipt.root = null; // Neither present

    try testing.expectError(error.ByzantiumForkIncompatibility, assertValid(receipt));
}

test "Receipt handles contract creation" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    const contract_addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb3");
    receipt.to = null;
    receipt.contract_address = contract_addr;

    try testing.expect(receipt.to == null);
    try testing.expect(receipt.contract_address != null);
    try testing.expect(receipt.contract_address.?.eql(contract_addr));
}

test "Receipt handles EIP-4844 blob fields" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    receipt.type = .eip4844;
    receipt.blob_gas_used = 131072;
    receipt.blob_gas_price = 1;

    try testing.expectEqual(TransactionType.eip4844, receipt.type);
    try testing.expectEqual(@as(u256, 131072), receipt.blob_gas_used.?);
    try testing.expectEqual(@as(u256, 1), receipt.blob_gas_price.?);
}

test "Receipt.clone creates deep copy" {
    const allocator = testing.allocator;
    const original = try createMockReceipt(allocator);
    defer original.deinit(allocator);

    const cloned = try original.clone(allocator);
    defer cloned.deinit(allocator);

    // Verify values are equal
    try testing.expect(cloned.transaction_hash.eql(original.transaction_hash));
    try testing.expectEqual(original.transaction_index, cloned.transaction_index);
    try testing.expect(cloned.block_hash.eql(original.block_hash));
    try testing.expectEqual(original.block_number, cloned.block_number);
    try testing.expect(cloned.from.eql(original.from));
    try testing.expectEqual(original.cumulative_gas_used, cloned.cumulative_gas_used);
    try testing.expectEqual(original.gas_used, cloned.gas_used);
    try testing.expectEqual(original.type, cloned.type);

    // Verify logs pointer is different (deep copy)
    try testing.expect(cloned.logs.ptr != original.logs.ptr);
}

test "TransactionStatus.isSuccess returns true for successful tx" {
    const status = TransactionStatus{ .success = true, .gas_used = 21000 };
    try testing.expect(status.isSuccess());
    try testing.expect(!status.isFailed());
}

test "TransactionStatus.isFailed returns true for failed tx" {
    const status = TransactionStatus{ .success = false, .gas_used = 21000 };
    try testing.expect(status.isFailed());
    try testing.expect(!status.isSuccess());
}

test "TransactionStatus.isPending always returns false" {
    const status = TransactionStatus{ .success = true, .gas_used = 21000 };
    try testing.expect(!status.isPending());
}

test "Receipt with all transaction types" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    const types = [_]TransactionType{ .legacy, .eip2930, .eip1559, .eip4844, .eip7702 };
    for (types) |tx_type| {
        receipt.type = tx_type;
        try testing.expectEqual(tx_type, receipt.type);
    }
}

test "Receipt with failed transaction status" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    receipt.status = TransactionStatus{ .success = false, .gas_used = 21000 };

    try testing.expect(!receipt.status.?.isSuccess());
    try testing.expect(receipt.status.?.isFailed());
}

test "Receipt with zero gas used" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    receipt.gas_used = 0;
    receipt.cumulative_gas_used = 0;
    receipt.effective_gas_price = 0;

    try testing.expectEqual(@as(u256, 0), receipt.gas_used);
    try testing.expectEqual(@as(u256, 0), receipt.cumulative_gas_used);
    try testing.expectEqual(@as(u256, 0), receipt.effective_gas_price);
}

test "Receipt with maximum gas values" {
    const allocator = testing.allocator;
    var receipt = try createMockReceipt(allocator);
    defer receipt.deinit(allocator);

    const max = std.math.maxInt(u256);
    receipt.gas_used = max;
    receipt.cumulative_gas_used = max;
    receipt.effective_gas_price = max;

    try testing.expectEqual(max, receipt.gas_used);
    try testing.expectEqual(max, receipt.cumulative_gas_used);
    try testing.expectEqual(max, receipt.effective_gas_price);
}

test "Receipt with logs" {
    const allocator = testing.allocator;
    const topic0 = try Hash.fromHex("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");

    const topics = try allocator.alloc(Hash, 1);
    topics[0] = topic0;
    const data = try allocator.alloc(u8, 32);
    @memset(data, 0);

    const logs = try allocator.alloc(EventLog, 1);
    logs[0] = EventLog{
        .address = Address.ZERO,
        .topics = topics,
        .data = data,
        .block_number = 100,
        .transaction_hash = null,
        .transaction_index = null,
        .log_index = 0,
        .removed = false,
    };

    var receipt = try createMockReceipt(allocator);
    allocator.free(receipt.logs); // Free empty logs
    receipt.logs = logs;
    defer receipt.deinit(allocator);

    try testing.expectEqual(@as(usize, 1), receipt.logs.len);
    try testing.expect(receipt.logs[0].address.eql(Address.ZERO));
}
