//! TransactionStatus - Transaction lifecycle status for Ethereum
//!
//! Represents the status of a transaction in its lifecycle:
//! - Unknown: Transaction not found
//! - Pending: Transaction submitted but not yet included in a block
//! - Included: Transaction included in block but not finalized
//! - Confirmed: Transaction finalized (sufficient confirmations)
//! - Failed: Transaction execution reverted
//! - Dropped: Transaction dropped from mempool
//! - Replaced: Transaction replaced (nonce reused with higher gas)
//!
//! Also provides ReceiptStatus for transaction receipt status field:
//! - Success = 1
//! - Failure = 0
//!
//! ## Usage
//! ```zig
//! const TransactionStatus = @import("primitives").TransactionStatus;
//!
//! // Create pending status
//! const status = TransactionStatus.pending();
//!
//! // Create from receipt status
//! const from_receipt = TransactionStatus.fromReceipt(1, 21000);
//!
//! // Create included status with block number and gas used
//! const inc = TransactionStatus.included(12345678, 21000);
//!
//! // Create confirmed status with confirmations
//! const conf = TransactionStatus.confirmed(12345678, 21000, 12);
//!
//! // Create failed status with optional revert reason
//! const fail = TransactionStatus.failed("Out of gas");
//!
//! // Create replaced status with new tx hash
//! const repl = TransactionStatus.replaced(newTxHash);
//!
//! // Check status type
//! if (TransactionStatus.isPending(&status)) { ... }
//! if (TransactionStatus.isSuccess(&status)) { ... }
//! ```

const std = @import("std");
const Hash = @import("../Hash/Hash.zig");

/// Receipt status field values per EIP-658
/// Used in transaction receipts to indicate execution outcome
pub const ReceiptStatus = enum(u8) {
    /// Transaction execution failed (reverted)
    failure = 0,
    /// Transaction execution succeeded
    success = 1,

    /// Create from u8 value
    pub fn from(value: u8) !ReceiptStatus {
        return switch (value) {
            0 => .failure,
            1 => .success,
            else => error.InvalidReceiptStatus,
        };
    }

    /// Convert to u8 value
    pub fn toInt(self: ReceiptStatus) u8 {
        return @intFromEnum(self);
    }

    /// Check if success
    pub fn isSuccess(self: ReceiptStatus) bool {
        return self == .success;
    }

    /// Check if failure
    pub fn isFailure(self: ReceiptStatus) bool {
        return self == .failure;
    }
};

test "ReceiptStatus - from valid values" {
    try std.testing.expectEqual(ReceiptStatus.failure, try ReceiptStatus.from(0));
    try std.testing.expectEqual(ReceiptStatus.success, try ReceiptStatus.from(1));
}

test "ReceiptStatus - from invalid value" {
    try std.testing.expectError(error.InvalidReceiptStatus, ReceiptStatus.from(2));
    try std.testing.expectError(error.InvalidReceiptStatus, ReceiptStatus.from(255));
}

test "ReceiptStatus - toInt" {
    try std.testing.expectEqual(@as(u8, 0), ReceiptStatus.failure.toInt());
    try std.testing.expectEqual(@as(u8, 1), ReceiptStatus.success.toInt());
}

test "ReceiptStatus - isSuccess and isFailure" {
    try std.testing.expect(ReceiptStatus.success.isSuccess());
    try std.testing.expect(!ReceiptStatus.success.isFailure());
    try std.testing.expect(ReceiptStatus.failure.isFailure());
    try std.testing.expect(!ReceiptStatus.failure.isSuccess());
}

/// TransactionStatus represents the state of a transaction in its lifecycle
pub const TransactionStatus = union(enum) {
    /// Transaction not found or status unknown
    unknown: void,

    /// Transaction submitted but not yet included in a block
    pending: void,

    /// Transaction included in block but not yet finalized
    included: IncludedData,

    /// Transaction finalized with sufficient confirmations
    confirmed: ConfirmedData,

    /// Transaction execution failed/reverted
    failed: FailedData,

    /// Transaction dropped from mempool
    dropped: DroppedData,

    /// Transaction replaced (nonce reused with higher gas price)
    replaced: ReplacedData,

    pub const IncludedData = struct {
        /// Block number where tx was included
        block_number: u64,
        /// Gas consumed by the transaction
        gas_used: u256,
    };

    pub const ConfirmedData = struct {
        /// Block number where tx was included
        block_number: u64,
        /// Gas consumed by the transaction
        gas_used: u256,
        /// Number of confirmations
        confirmations: u64,
    };

    pub const FailedData = struct {
        /// Optional revert reason (pointer to static or allocated string)
        revert_reason: ?[]const u8,
    };

    pub const DroppedData = struct {
        /// Optional reason for dropping
        reason: ?[]const u8,
    };

    pub const ReplacedData = struct {
        /// Hash of the replacement transaction
        replacement_hash: Hash.Hash,
    };
};

// ============================================================================
// Constructors
// ============================================================================

/// Create a pending status
pub fn pending() TransactionStatus {
    return .{ .pending = {} };
}

test "pending - creates pending status" {
    const status = pending();
    try std.testing.expect(isPending(&status));
    try std.testing.expect(!isIncluded(&status));
    try std.testing.expect(!isConfirmed(&status));
    try std.testing.expect(!isFailed(&status));
    try std.testing.expect(!isReplaced(&status));
}

/// Create an included status with block number and gas used
pub fn included(block_number: u64, gas_used: u256) TransactionStatus {
    return .{ .included = .{ .block_number = block_number, .gas_used = gas_used } };
}

test "included - creates included status" {
    const status = included(12345678, 21000);
    try std.testing.expect(isIncluded(&status));
    try std.testing.expect(!isPending(&status));
    try std.testing.expect(!isConfirmed(&status));
    try std.testing.expectEqual(@as(u64, 12345678), getBlockNumber(&status).?);
    try std.testing.expectEqual(@as(u256, 21000), getGasUsed(&status).?);
}

/// Create a confirmed status with block number, gas used, and confirmations
pub fn confirmed(block_number: u64, gas_used: u256, confirmations: u64) TransactionStatus {
    return .{ .confirmed = .{
        .block_number = block_number,
        .gas_used = gas_used,
        .confirmations = confirmations,
    } };
}

test "confirmed - creates confirmed status" {
    const status = confirmed(12345678, 21000, 12);
    try std.testing.expect(isConfirmed(&status));
    try std.testing.expect(!isPending(&status));
    try std.testing.expect(!isIncluded(&status));
    try std.testing.expectEqual(@as(u64, 12345678), getBlockNumber(&status).?);
    try std.testing.expectEqual(@as(u256, 21000), getGasUsed(&status).?);
    try std.testing.expectEqual(@as(u64, 12), getConfirmations(&status).?);
}

/// Create a failed status with optional revert reason
pub fn failed(revert_reason: ?[]const u8) TransactionStatus {
    return .{ .failed = .{ .revert_reason = revert_reason } };
}

test "failed - creates failed status without reason" {
    const status = failed(null);
    try std.testing.expect(isFailed(&status));
    try std.testing.expect(!isPending(&status));
    try std.testing.expect(!isIncluded(&status));
    try std.testing.expect(getRevertReason(&status) == null);
}

test "failed - creates failed status with reason" {
    const reason = "Out of gas";
    const status = failed(reason);
    try std.testing.expect(isFailed(&status));
    try std.testing.expectEqualStrings(reason, getRevertReason(&status).?);
}

/// Create a replaced status with the replacement transaction hash
pub fn replaced(replacement_hash: Hash.Hash) TransactionStatus {
    return .{ .replaced = .{ .replacement_hash = replacement_hash } };
}

test "replaced - creates replaced status" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0xab);
    const status = replaced(hash);
    try std.testing.expect(isReplaced(&status));
    try std.testing.expect(!isPending(&status));
    const got_hash = getReplacementHash(&status).?;
    try std.testing.expectEqualSlices(u8, &hash, &got_hash);
}

/// Generic constructor from status type string
pub fn from(status_type: []const u8) !TransactionStatus {
    if (std.mem.eql(u8, status_type, "pending")) {
        return pending();
    }
    if (std.mem.eql(u8, status_type, "included")) {
        return included(0, 0);
    }
    if (std.mem.eql(u8, status_type, "confirmed")) {
        return confirmed(0, 0, 0);
    }
    if (std.mem.eql(u8, status_type, "failed")) {
        return failed(null);
    }
    if (std.mem.eql(u8, status_type, "replaced")) {
        return replaced(std.mem.zeroes(Hash.Hash));
    }
    return error.InvalidStatusType;
}

test "from - pending" {
    const status = try from("pending");
    try std.testing.expect(isPending(&status));
}

test "from - included" {
    const status = try from("included");
    try std.testing.expect(isIncluded(&status));
}

test "from - confirmed" {
    const status = try from("confirmed");
    try std.testing.expect(isConfirmed(&status));
}

test "from - failed" {
    const status = try from("failed");
    try std.testing.expect(isFailed(&status));
}

test "from - replaced" {
    const status = try from("replaced");
    try std.testing.expect(isReplaced(&status));
}

test "from - invalid" {
    try std.testing.expectError(error.InvalidStatusType, from("unknown"));
}

// ============================================================================
// Type Checks
// ============================================================================

/// Check if status is pending
pub fn isPending(status: *const TransactionStatus) bool {
    return status.* == .pending;
}

test "isPending - true for pending" {
    const status = pending();
    try std.testing.expect(isPending(&status));
}

test "isPending - false for other types" {
    try std.testing.expect(!isPending(&included(0, 0)));
    try std.testing.expect(!isPending(&confirmed(0, 0, 0)));
    try std.testing.expect(!isPending(&failed(null)));
    try std.testing.expect(!isPending(&replaced(std.mem.zeroes(Hash.Hash))));
}

/// Check if status is included
pub fn isIncluded(status: *const TransactionStatus) bool {
    return status.* == .included;
}

test "isIncluded - true for included" {
    const status = included(12345678, 21000);
    try std.testing.expect(isIncluded(&status));
}

test "isIncluded - false for other types" {
    try std.testing.expect(!isIncluded(&pending()));
    try std.testing.expect(!isIncluded(&confirmed(0, 0, 0)));
    try std.testing.expect(!isIncluded(&failed(null)));
    try std.testing.expect(!isIncluded(&replaced(std.mem.zeroes(Hash.Hash))));
}

/// Check if status is confirmed
pub fn isConfirmed(status: *const TransactionStatus) bool {
    return status.* == .confirmed;
}

test "isConfirmed - true for confirmed" {
    const status = confirmed(12345678, 21000, 12);
    try std.testing.expect(isConfirmed(&status));
}

test "isConfirmed - false for other types" {
    try std.testing.expect(!isConfirmed(&pending()));
    try std.testing.expect(!isConfirmed(&included(0, 0)));
    try std.testing.expect(!isConfirmed(&failed(null)));
    try std.testing.expect(!isConfirmed(&replaced(std.mem.zeroes(Hash.Hash))));
}

/// Check if status is failed
pub fn isFailed(status: *const TransactionStatus) bool {
    return status.* == .failed;
}

test "isFailed - true for failed" {
    const status = failed(null);
    try std.testing.expect(isFailed(&status));
}

test "isFailed - false for other types" {
    try std.testing.expect(!isFailed(&pending()));
    try std.testing.expect(!isFailed(&included(0, 0)));
    try std.testing.expect(!isFailed(&confirmed(0, 0, 0)));
    try std.testing.expect(!isFailed(&replaced(std.mem.zeroes(Hash.Hash))));
}

/// Check if status is replaced
pub fn isReplaced(status: *const TransactionStatus) bool {
    return status.* == .replaced;
}

test "isReplaced - true for replaced" {
    const status = replaced(std.mem.zeroes(Hash.Hash));
    try std.testing.expect(isReplaced(&status));
}

test "isReplaced - false for other types" {
    try std.testing.expect(!isReplaced(&pending()));
    try std.testing.expect(!isReplaced(&included(0, 0)));
    try std.testing.expect(!isReplaced(&confirmed(0, 0, 0)));
    try std.testing.expect(!isReplaced(&failed(null)));
}

/// Check if status indicates transaction is finalized (confirmed or failed)
pub fn isFinalized(status: *const TransactionStatus) bool {
    return status.* == .confirmed or status.* == .failed or status.* == .replaced;
}

test "isFinalized - true for confirmed" {
    try std.testing.expect(isFinalized(&confirmed(0, 0, 0)));
}

test "isFinalized - true for failed" {
    try std.testing.expect(isFinalized(&failed(null)));
}

test "isFinalized - true for replaced" {
    try std.testing.expect(isFinalized(&replaced(std.mem.zeroes(Hash.Hash))));
}

test "isFinalized - false for pending and included" {
    try std.testing.expect(!isFinalized(&pending()));
    try std.testing.expect(!isFinalized(&included(0, 0)));
}

// ============================================================================
// Accessors
// ============================================================================

/// Get block number from included or confirmed status, null otherwise
pub fn getBlockNumber(status: *const TransactionStatus) ?u64 {
    return switch (status.*) {
        .included => |data| data.block_number,
        .confirmed => |data| data.block_number,
        else => null,
    };
}

test "getBlockNumber - included" {
    const status = included(12345678, 21000);
    try std.testing.expectEqual(@as(?u64, 12345678), getBlockNumber(&status));
}

test "getBlockNumber - confirmed" {
    const status = confirmed(12345678, 21000, 12);
    try std.testing.expectEqual(@as(?u64, 12345678), getBlockNumber(&status));
}

test "getBlockNumber - pending returns null" {
    const status = pending();
    try std.testing.expect(getBlockNumber(&status) == null);
}

/// Get gas used from included or confirmed status, null otherwise
pub fn getGasUsed(status: *const TransactionStatus) ?u256 {
    return switch (status.*) {
        .included => |data| data.gas_used,
        .confirmed => |data| data.gas_used,
        else => null,
    };
}

test "getGasUsed - included" {
    const status = included(12345678, 21000);
    try std.testing.expectEqual(@as(?u256, 21000), getGasUsed(&status));
}

test "getGasUsed - confirmed" {
    const status = confirmed(12345678, 21000, 12);
    try std.testing.expectEqual(@as(?u256, 21000), getGasUsed(&status));
}

test "getGasUsed - pending returns null" {
    const status = pending();
    try std.testing.expect(getGasUsed(&status) == null);
}

test "getGasUsed - failed returns null" {
    const status = failed(null);
    try std.testing.expect(getGasUsed(&status) == null);
}

/// Get confirmations from confirmed status, null otherwise
pub fn getConfirmations(status: *const TransactionStatus) ?u64 {
    return switch (status.*) {
        .confirmed => |data| data.confirmations,
        else => null,
    };
}

test "getConfirmations - confirmed" {
    const status = confirmed(12345678, 21000, 12);
    try std.testing.expectEqual(@as(?u64, 12), getConfirmations(&status));
}

test "getConfirmations - included returns null" {
    const status = included(12345678, 21000);
    try std.testing.expect(getConfirmations(&status) == null);
}

test "getConfirmations - pending returns null" {
    const status = pending();
    try std.testing.expect(getConfirmations(&status) == null);
}

/// Get revert reason from failed status, null otherwise
pub fn getRevertReason(status: *const TransactionStatus) ?[]const u8 {
    return switch (status.*) {
        .failed => |data| data.revert_reason,
        else => null,
    };
}

test "getRevertReason - failed with reason" {
    const reason = "Revert: insufficient balance";
    const status = failed(reason);
    try std.testing.expectEqualStrings(reason, getRevertReason(&status).?);
}

test "getRevertReason - failed without reason" {
    const status = failed(null);
    try std.testing.expect(getRevertReason(&status) == null);
}

test "getRevertReason - pending returns null" {
    const status = pending();
    try std.testing.expect(getRevertReason(&status) == null);
}

/// Get replacement hash from replaced status, null otherwise
pub fn getReplacementHash(status: *const TransactionStatus) ?Hash.Hash {
    return switch (status.*) {
        .replaced => |data| data.replacement_hash,
        else => null,
    };
}

test "getReplacementHash - replaced" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0xab);
    const status = replaced(hash);
    const got = getReplacementHash(&status).?;
    try std.testing.expectEqualSlices(u8, &hash, &got);
}

test "getReplacementHash - pending returns null" {
    const status = pending();
    try std.testing.expect(getReplacementHash(&status) == null);
}

// ============================================================================
// State Transitions
// ============================================================================

/// Transition pending status to included
pub fn transitionToIncluded(status: *const TransactionStatus, block_number: u64, gas_used: u256) !TransactionStatus {
    if (status.* != .pending) {
        return error.InvalidTransition;
    }
    return included(block_number, gas_used);
}

test "transitionToIncluded - from pending" {
    const p = pending();
    const inc = try transitionToIncluded(&p, 12345678, 21000);
    try std.testing.expect(isIncluded(&inc));
    try std.testing.expectEqual(@as(u64, 12345678), getBlockNumber(&inc).?);
}

test "transitionToIncluded - from non-pending fails" {
    const inc = included(0, 0);
    try std.testing.expectError(error.InvalidTransition, transitionToIncluded(&inc, 0, 0));
}

/// Transition included status to confirmed
pub fn transitionToConfirmed(status: *const TransactionStatus, confirmations: u64) !TransactionStatus {
    return switch (status.*) {
        .included => |data| confirmed(data.block_number, data.gas_used, confirmations),
        else => error.InvalidTransition,
    };
}

test "transitionToConfirmed - from included" {
    const inc = included(12345678, 21000);
    const conf = try transitionToConfirmed(&inc, 12);
    try std.testing.expect(isConfirmed(&conf));
    try std.testing.expectEqual(@as(u64, 12), getConfirmations(&conf).?);
}

test "transitionToConfirmed - from pending fails" {
    const p = pending();
    try std.testing.expectError(error.InvalidTransition, transitionToConfirmed(&p, 12));
}

/// Transition pending status to replaced
pub fn transitionToReplaced(status: *const TransactionStatus, replacement_hash: Hash.Hash) !TransactionStatus {
    if (status.* != .pending) {
        return error.InvalidTransition;
    }
    return replaced(replacement_hash);
}

test "transitionToReplaced - from pending" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0xcd);
    const p = pending();
    const repl = try transitionToReplaced(&p, hash);
    try std.testing.expect(isReplaced(&repl));
}

test "transitionToReplaced - from included fails" {
    const inc = included(0, 0);
    try std.testing.expectError(error.InvalidTransition, transitionToReplaced(&inc, std.mem.zeroes(Hash.Hash)));
}

// ============================================================================
// Converters
// ============================================================================

/// Convert status to string representation
pub fn toString(status: *const TransactionStatus) []const u8 {
    return switch (status.*) {
        .pending => "pending",
        .included => "included",
        .confirmed => "confirmed",
        .failed => "failed",
        .replaced => "replaced",
    };
}

test "toString - pending" {
    const status = pending();
    try std.testing.expectEqualStrings("pending", toString(&status));
}

test "toString - included" {
    const status = included(0, 0);
    try std.testing.expectEqualStrings("included", toString(&status));
}

test "toString - confirmed" {
    const status = confirmed(0, 0, 0);
    try std.testing.expectEqualStrings("confirmed", toString(&status));
}

test "toString - failed" {
    const status = failed(null);
    try std.testing.expectEqualStrings("failed", toString(&status));
}

test "toString - replaced" {
    const status = replaced(std.mem.zeroes(Hash.Hash));
    try std.testing.expectEqualStrings("replaced", toString(&status));
}

// ============================================================================
// Equality
// ============================================================================

/// Check if two statuses are equal (full equality including data)
pub fn equals(a: *const TransactionStatus, b: *const TransactionStatus) bool {
    return switch (a.*) {
        .pending => b.* == .pending,
        .included => |data_a| switch (b.*) {
            .included => |data_b| data_a.block_number == data_b.block_number and data_a.gas_used == data_b.gas_used,
            else => false,
        },
        .confirmed => |data_a| switch (b.*) {
            .confirmed => |data_b| data_a.block_number == data_b.block_number and
                data_a.gas_used == data_b.gas_used and
                data_a.confirmations == data_b.confirmations,
            else => false,
        },
        .failed => |data_a| switch (b.*) {
            .failed => |data_b| blk: {
                if (data_a.revert_reason == null and data_b.revert_reason == null) {
                    break :blk true;
                }
                if (data_a.revert_reason != null and data_b.revert_reason != null) {
                    break :blk std.mem.eql(u8, data_a.revert_reason.?, data_b.revert_reason.?);
                }
                break :blk false;
            },
            else => false,
        },
        .replaced => |data_a| switch (b.*) {
            .replaced => |data_b| std.mem.eql(u8, &data_a.replacement_hash, &data_b.replacement_hash),
            else => false,
        },
    };
}

test "equals - pending equal" {
    const a = pending();
    const b = pending();
    try std.testing.expect(equals(&a, &b));
}

test "equals - included equal" {
    const a = included(12345678, 21000);
    const b = included(12345678, 21000);
    try std.testing.expect(equals(&a, &b));
}

test "equals - included not equal different block" {
    const a = included(12345678, 21000);
    const b = included(12345679, 21000);
    try std.testing.expect(!equals(&a, &b));
}

test "equals - confirmed equal" {
    const a = confirmed(12345678, 21000, 12);
    const b = confirmed(12345678, 21000, 12);
    try std.testing.expect(equals(&a, &b));
}

test "equals - confirmed not equal different confirmations" {
    const a = confirmed(12345678, 21000, 12);
    const b = confirmed(12345678, 21000, 24);
    try std.testing.expect(!equals(&a, &b));
}

test "equals - failed equal no reason" {
    const a = failed(null);
    const b = failed(null);
    try std.testing.expect(equals(&a, &b));
}

test "equals - failed equal same reason" {
    const reason = "Out of gas";
    const a = failed(reason);
    const b = failed(reason);
    try std.testing.expect(equals(&a, &b));
}

test "equals - failed not equal different reason" {
    const a = failed("Reason A");
    const b = failed("Reason B");
    try std.testing.expect(!equals(&a, &b));
}

test "equals - replaced equal" {
    var hash: Hash.Hash = undefined;
    @memset(&hash, 0xab);
    const a = replaced(hash);
    const b = replaced(hash);
    try std.testing.expect(equals(&a, &b));
}

test "equals - replaced not equal" {
    var hash_a: Hash.Hash = undefined;
    var hash_b: Hash.Hash = undefined;
    @memset(&hash_a, 0xab);
    @memset(&hash_b, 0xcd);
    const a = replaced(hash_a);
    const b = replaced(hash_b);
    try std.testing.expect(!equals(&a, &b));
}

test "equals - different types not equal" {
    const p = pending();
    const inc = included(0, 0);
    const conf = confirmed(0, 0, 0);
    const f = failed(null);
    const r = replaced(std.mem.zeroes(Hash.Hash));
    try std.testing.expect(!equals(&p, &inc));
    try std.testing.expect(!equals(&p, &conf));
    try std.testing.expect(!equals(&p, &f));
    try std.testing.expect(!equals(&p, &r));
    try std.testing.expect(!equals(&inc, &conf));
}

/// Check type-only equality (ignores data values)
pub fn equalsType(a: *const TransactionStatus, b: *const TransactionStatus) bool {
    return @intFromEnum(a.*) == @intFromEnum(b.*);
}

test "equalsType - included same type different values" {
    const a = included(12345678, 21000);
    const b = included(87654321, 30000);
    try std.testing.expect(equalsType(&a, &b));
}

test "equalsType - different types" {
    const p = pending();
    const inc = included(0, 0);
    try std.testing.expect(!equalsType(&p, &inc));
}
