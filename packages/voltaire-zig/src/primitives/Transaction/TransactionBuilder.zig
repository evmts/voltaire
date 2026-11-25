//! TransactionBuilder - fluent construction of every Ethereum transaction type.
//!
//! Setters return a new builder by value, so calls chain:
//!
//! ```zig
//! const tx = try TransactionBuilder.init()
//!     .setChainId(1)
//!     .setNonce(0)
//!     .setMaxFeePerGas(30_000_000_000)
//!     .setMaxPriorityFeePerGas(1_000_000_000)
//!     .setGasLimit(21_000)
//!     .setTo(recipient)
//!     .setValue(1_000_000_000_000_000_000)
//!     .build(); // Built{ .eip1559 = ... }
//! ```
//!
//! Type detection, when `setType` is not called:
//!
//! | Field set                                       | Type    |
//! | ----------------------------------------------- | ------- |
//! | authorization list                              | eip7702 |
//! | blob versioned hashes or max fee per blob gas   | eip4844 |
//! | max fee per gas or max priority fee per gas     | eip1559 |
//! | gas price and access list                       | eip2930 |
//! | gas price                                       | legacy  |
//!
//! `build` validates required fields and rejects fields the resolved type
//! cannot carry. Slices (data, access list, blob hashes, authorizations) are
//! borrowed, not copied: they must outlive the built transaction.

const std = @import("std");
const testing = std.testing;
const Transaction = @import("Transaction.zig");
const address = @import("../Address/address.zig");
const authorization = @import("../Authorization/authorization.zig");
const blob = @import("../Blob/blob.zig");
const crypto_pkg = @import("crypto");
const hash = crypto_pkg.Hash;
const crypto = crypto_pkg.Crypto;

const Allocator = std.mem.Allocator;
const Address = address.Address;
const Hash = hash.Hash;
const Authorization = authorization.Authorization;
const VersionedHash = blob.VersionedHash;
const TransactionType = Transaction.TransactionType;
const AccessListItem = Transaction.AccessListItem;

pub const BuildError = error{
    /// No gas price or EIP-1559 fee fields were set.
    MissingFeeFields,
    /// Gas price was combined with EIP-1559 fee fields.
    ConflictingFeeFields,
    MissingGasPrice,
    MissingMaxFeePerGas,
    MissingMaxPriorityFeePerGas,
    MissingMaxFeePerBlobGas,
    MissingGasLimit,
    /// Typed transactions (EIP-2718) require a chain id.
    MissingChainId,
    /// EIP-4844 and EIP-7702 forbid contract creation.
    MissingRecipient,
    /// EIP-4844 requires at least one blob versioned hash.
    MissingBlobVersionedHashes,
    /// EIP-7702 requires a non-empty authorization list.
    MissingAuthorizationList,
    /// A field was set that the resolved transaction type cannot carry.
    FieldNotAllowedForType,
    /// max_priority_fee_per_gas exceeds max_fee_per_gas.
    PriorityFeeExceedsMaxFee,
};

/// Unsigned or signed transaction of any supported type.
pub const Built = union(TransactionType) {
    legacy: Transaction.LegacyTransaction,
    eip2930: Transaction.Eip2930Transaction,
    eip1559: Transaction.Eip1559Transaction,
    eip4844: Transaction.Eip4844Transaction,
    eip7702: Transaction.Eip7702Transaction,

    pub fn transactionType(self: Built) TransactionType {
        return std.meta.activeTag(self);
    }
};

pub const TransactionBuilder = struct {
    tx_type: ?TransactionType = null,
    chain_id: ?u64 = null,
    nonce: u64 = 0,
    gas_price: ?u256 = null,
    max_priority_fee_per_gas: ?u256 = null,
    max_fee_per_gas: ?u256 = null,
    max_fee_per_blob_gas: ?u256 = null,
    gas_limit: ?u64 = null,
    to: ?Address = null,
    value: u256 = 0,
    data: []const u8 = &.{},
    access_list: ?[]const AccessListItem = null,
    blob_versioned_hashes: ?[]const VersionedHash = null,
    authorization_list: ?[]const Authorization = null,

    pub fn init() TransactionBuilder {
        return .{};
    }

    /// Force a transaction type instead of detecting it from the fields.
    pub fn setType(self: TransactionBuilder, t: TransactionType) TransactionBuilder {
        var b = self;
        b.tx_type = t;
        return b;
    }

    pub fn setChainId(self: TransactionBuilder, v: u64) TransactionBuilder {
        var b = self;
        b.chain_id = v;
        return b;
    }

    pub fn setNonce(self: TransactionBuilder, v: u64) TransactionBuilder {
        var b = self;
        b.nonce = v;
        return b;
    }

    pub fn setGasPrice(self: TransactionBuilder, v: u256) TransactionBuilder {
        var b = self;
        b.gas_price = v;
        return b;
    }

    pub fn setMaxPriorityFeePerGas(self: TransactionBuilder, v: u256) TransactionBuilder {
        var b = self;
        b.max_priority_fee_per_gas = v;
        return b;
    }

    pub fn setMaxFeePerGas(self: TransactionBuilder, v: u256) TransactionBuilder {
        var b = self;
        b.max_fee_per_gas = v;
        return b;
    }

    pub fn setMaxFeePerBlobGas(self: TransactionBuilder, v: u256) TransactionBuilder {
        var b = self;
        b.max_fee_per_blob_gas = v;
        return b;
    }

    pub fn setGasLimit(self: TransactionBuilder, v: u64) TransactionBuilder {
        var b = self;
        b.gas_limit = v;
        return b;
    }

    pub fn setTo(self: TransactionBuilder, v: Address) TransactionBuilder {
        var b = self;
        b.to = v;
        return b;
    }

    pub fn setValue(self: TransactionBuilder, v: u256) TransactionBuilder {
        var b = self;
        b.value = v;
        return b;
    }

    pub fn setData(self: TransactionBuilder, v: []const u8) TransactionBuilder {
        var b = self;
        b.data = v;
        return b;
    }

    pub fn setAccessList(self: TransactionBuilder, v: []const AccessListItem) TransactionBuilder {
        var b = self;
        b.access_list = v;
        return b;
    }

    pub fn setBlobVersionedHashes(self: TransactionBuilder, v: []const VersionedHash) TransactionBuilder {
        var b = self;
        b.blob_versioned_hashes = v;
        return b;
    }

    pub fn setAuthorizationList(self: TransactionBuilder, v: []const Authorization) TransactionBuilder {
        var b = self;
        b.authorization_list = v;
        return b;
    }

    /// Resolve the transaction type: the explicit type, else detection from fields.
    pub fn resolveType(self: TransactionBuilder) BuildError!TransactionType {
        if (self.tx_type) |t| return t;
        if (self.authorization_list != null) return .eip7702;
        if (self.blob_versioned_hashes != null or self.max_fee_per_blob_gas != null) return .eip4844;
        if (self.max_fee_per_gas != null or self.max_priority_fee_per_gas != null) {
            if (self.gas_price != null) return BuildError.ConflictingFeeFields;
            return .eip1559;
        }
        if (self.gas_price != null) {
            if (self.access_list != null) return .eip2930;
            return .legacy;
        }
        return BuildError.MissingFeeFields;
    }

    /// Validate fields and produce an unsigned transaction (zero signature).
    pub fn build(self: TransactionBuilder) BuildError!Built {
        const t = try self.resolveType();
        const zero = @as([32]u8, @splat(0));
        const gas_limit = self.gas_limit orelse return BuildError.MissingGasLimit;
        const access_list: []const AccessListItem = self.access_list orelse &.{};

        // Fields each type cannot carry.
        const has_1559 = self.max_fee_per_gas != null or self.max_priority_fee_per_gas != null;
        const has_blob = self.blob_versioned_hashes != null or self.max_fee_per_blob_gas != null;
        const has_auth = self.authorization_list != null;
        switch (t) {
            .legacy => if (has_1559 or has_blob or has_auth or self.access_list != null)
                return BuildError.FieldNotAllowedForType,
            .eip2930 => if (has_1559 or has_blob or has_auth) return BuildError.FieldNotAllowedForType,
            .eip1559 => if (has_blob or has_auth) return BuildError.FieldNotAllowedForType,
            .eip4844 => if (has_auth) return BuildError.FieldNotAllowedForType,
            .eip7702 => if (has_blob) return BuildError.FieldNotAllowedForType,
        }

        switch (t) {
            .legacy, .eip2930 => {
                if (has_1559) return BuildError.ConflictingFeeFields;
                const gas_price = self.gas_price orelse return BuildError.MissingGasPrice;
                if (t == .legacy) return .{ .legacy = .{
                    .nonce = self.nonce,
                    .gas_price = gas_price,
                    .gas_limit = gas_limit,
                    .to = self.to,
                    .value = self.value,
                    .data = self.data,
                    .v = 0,
                    .r = zero,
                    .s = zero,
                } };
                return .{ .eip2930 = .{
                    .chain_id = self.chain_id orelse return BuildError.MissingChainId,
                    .nonce = self.nonce,
                    .gas_price = gas_price,
                    .gas_limit = gas_limit,
                    .to = self.to,
                    .value = self.value,
                    .data = self.data,
                    .access_list = access_list,
                    .y_parity = 0,
                    .r = zero,
                    .s = zero,
                } };
            },
            .eip1559, .eip4844, .eip7702 => {
                if (self.gas_price != null) return BuildError.ConflictingFeeFields;
                const chain_id = self.chain_id orelse return BuildError.MissingChainId;
                const max_fee = self.max_fee_per_gas orelse return BuildError.MissingMaxFeePerGas;
                const priority = self.max_priority_fee_per_gas orelse return BuildError.MissingMaxPriorityFeePerGas;
                if (priority > max_fee) return BuildError.PriorityFeeExceedsMaxFee;
                switch (t) {
                    .eip1559 => return .{ .eip1559 = .{
                        .chain_id = chain_id,
                        .nonce = self.nonce,
                        .max_priority_fee_per_gas = priority,
                        .max_fee_per_gas = max_fee,
                        .gas_limit = gas_limit,
                        .to = self.to,
                        .value = self.value,
                        .data = self.data,
                        .access_list = access_list,
                        .y_parity = 0,
                        .r = zero,
                        .s = zero,
                    } },
                    .eip4844 => {
                        const to = self.to orelse return BuildError.MissingRecipient;
                        const blob_fee = self.max_fee_per_blob_gas orelse return BuildError.MissingMaxFeePerBlobGas;
                        const hashes = self.blob_versioned_hashes orelse return BuildError.MissingBlobVersionedHashes;
                        if (hashes.len == 0) return BuildError.MissingBlobVersionedHashes;
                        return .{ .eip4844 = .{
                            .chain_id = chain_id,
                            .nonce = self.nonce,
                            .max_priority_fee_per_gas = priority,
                            .max_fee_per_gas = max_fee,
                            .gas_limit = gas_limit,
                            .to = to,
                            .value = self.value,
                            .data = self.data,
                            .access_list = access_list,
                            .max_fee_per_blob_gas = blob_fee,
                            .blob_versioned_hashes = hashes,
                            .y_parity = 0,
                            .r = zero,
                            .s = zero,
                        } };
                    },
                    .eip7702 => {
                        const to = self.to orelse return BuildError.MissingRecipient;
                        const auths = self.authorization_list orelse return BuildError.MissingAuthorizationList;
                        if (auths.len == 0) return BuildError.MissingAuthorizationList;
                        return .{ .eip7702 = .{
                            .chain_id = chain_id,
                            .nonce = self.nonce,
                            .max_priority_fee_per_gas = priority,
                            .max_fee_per_gas = max_fee,
                            .gas_limit = gas_limit,
                            .to = to,
                            .value = self.value,
                            .data = self.data,
                            .access_list = access_list,
                            .authorization_list = auths,
                            .y_parity = 0,
                            .r = zero,
                            .s = zero,
                        } };
                    },
                    else => unreachable,
                }
            },
        }
    }

    /// RLP preimage whose keccak256 is signed. Legacy uses EIP-155 when a
    /// chain id is set, the pre-EIP-155 form otherwise. Caller frees.
    pub fn encodeForSigning(self: TransactionBuilder, allocator: Allocator) ![]u8 {
        return switch (try self.build()) {
            .legacy => |tx| if (self.chain_id) |c|
                Transaction.encodeLegacyForSigning(allocator, tx, c)
            else
                Transaction.encodeLegacyForSigningPreEip155(allocator, tx),
            .eip2930 => |tx| Transaction.encodeEip2930ForSigning(allocator, tx),
            .eip1559 => |tx| Transaction.encodeEip1559ForSigning(allocator, tx),
            .eip4844 => |tx| Transaction.encodeEip4844ForSigning(allocator, tx),
            .eip7702 => |tx| Transaction.encodeEip7702ForSigning(allocator, tx),
        };
    }

    /// keccak256 of `encodeForSigning`.
    pub fn signingHash(self: TransactionBuilder, allocator: Allocator) !Hash {
        const encoded = try self.encodeForSigning(allocator);
        defer allocator.free(encoded);
        return hash.keccak256(encoded);
    }

    /// Build and sign. Legacy `v` is EIP-155 (`chain_id * 2 + 35 + y`) when a
    /// chain id is set, `27 + y` otherwise. Typed transactions get `y_parity`.
    pub fn sign(self: TransactionBuilder, allocator: Allocator, private_key: crypto.PrivateKey) !Built {
        var built = try self.build();
        if (built == .legacy) {
            if (self.chain_id) |c| {
                built.legacy = try Transaction.signLegacyTransaction(allocator, built.legacy, private_key, c);
                return built;
            }
        }

        const h = try self.signingHash(allocator);
        const sig = try crypto.unaudited_signHash(h, private_key);
        const y: u8 = if (sig.v >= 27) sig.v - 27 else sig.v;
        var r: [32]u8 = undefined;
        var s: [32]u8 = undefined;
        std.mem.writeInt(u256, &r, sig.r, .big);
        std.mem.writeInt(u256, &s, sig.s, .big);

        switch (built) {
            .legacy => |*tx| {
                tx.v = @as(u64, y) + 27;
                tx.r = r;
                tx.s = s;
            },
            inline .eip2930, .eip1559, .eip4844, .eip7702 => |*tx| {
                tx.y_parity = y;
                tx.r = r;
                tx.s = s;
            },
        }
        return built;
    }
};

// Tests

const test_key: crypto.PrivateKey = [_]u8{
    0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
    0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
    0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
    0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
};

fn recipient() !Address {
    return Address.fromHex("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
}

fn signer() !Address {
    return crypto.publicKeyToAddress(try crypto.unaudited_getPublicKey(test_key));
}

fn recover(h: Hash, y: u8, r: [32]u8, s: [32]u8) !Address {
    return crypto.unaudited_recoverAddress(h, .{
        .r = std.mem.readInt(u256, &r, .big),
        .s = std.mem.readInt(u256, &s, .big),
        .v = y + 27,
    });
}

test "builder detects legacy from gas price" {
    const built = try TransactionBuilder.init()
        .setNonce(9)
        .setGasPrice(20_000_000_000)
        .setGasLimit(21_000)
        .setTo(try recipient())
        .setValue(1_000_000_000_000_000_000)
        .build();
    try testing.expectEqual(TransactionType.legacy, built.transactionType());
    try testing.expectEqual(@as(u64, 9), built.legacy.nonce);
    try testing.expectEqual(@as(u256, 20_000_000_000), built.legacy.gas_price);
    try testing.expectEqual(@as(u64, 0), built.legacy.v);
}

test "builder matches EIP-155 example signing preimage" {
    // https://eips.ethereum.org/EIPS/eip-155 example
    const allocator = testing.allocator;
    const encoded = try TransactionBuilder.init()
        .setChainId(1)
        .setNonce(9)
        .setGasPrice(20_000_000_000)
        .setGasLimit(21_000)
        .setTo(try Address.fromHex("0x3535353535353535353535353535353535353535"))
        .setValue(1_000_000_000_000_000_000)
        .encodeForSigning(allocator);
    defer allocator.free(encoded);
    var expected: [45]u8 = undefined;
    _ = try std.fmt.hexToBytes(&expected, "ec098504a817c800825208943535353535353535353535353535353535353535880de0b6b3a764000080018080");
    try testing.expectEqualSlices(u8, &expected, encoded);
}

test "builder detects eip2930 from gas price plus access list" {
    const list = [_]AccessListItem{.{ .address = try recipient(), .storage_keys = &.{} }};
    const built = try TransactionBuilder.init()
        .setChainId(1)
        .setGasPrice(1)
        .setGasLimit(30_000)
        .setAccessList(&list)
        .build();
    try testing.expectEqual(TransactionType.eip2930, built.transactionType());
    try testing.expectEqual(@as(usize, 1), built.eip2930.access_list.len);
    try testing.expect(built.eip2930.to == null);
}

test "builder detects eip1559 from fee fields" {
    const built = try TransactionBuilder.init()
        .setChainId(1)
        .setMaxFeePerGas(30)
        .setMaxPriorityFeePerGas(2)
        .setGasLimit(21_000)
        .setTo(try recipient())
        .build();
    try testing.expectEqual(TransactionType.eip1559, built.transactionType());
    try testing.expectEqual(@as(u256, 30), built.eip1559.max_fee_per_gas);
    try testing.expectEqual(@as(u256, 2), built.eip1559.max_priority_fee_per_gas);
    try testing.expectEqual(@as(usize, 0), built.eip1559.access_list.len);
}

test "builder detects eip4844 from blob fields" {
    const hashes = [_]VersionedHash{.{ .bytes = [_]u8{0x01} ++ @as([31]u8, @splat(0xaa)) }};
    const built = try TransactionBuilder.init()
        .setChainId(1)
        .setMaxFeePerGas(30)
        .setMaxPriorityFeePerGas(2)
        .setMaxFeePerBlobGas(5)
        .setBlobVersionedHashes(&hashes)
        .setGasLimit(21_000)
        .setTo(try recipient())
        .build();
    try testing.expectEqual(TransactionType.eip4844, built.transactionType());
    try testing.expectEqual(@as(u256, 5), built.eip4844.max_fee_per_blob_gas);
    try testing.expectEqual(@as(usize, 1), built.eip4844.blob_versioned_hashes.len);
}

test "builder detects eip7702 from authorization list" {
    const auths = [_]Authorization{.{
        .chain_id = 1,
        .address = try recipient(),
        .nonce = 0,
        .v = 0,
        .r = @as([32]u8, @splat(1)),
        .s = @as([32]u8, @splat(2)),
    }};
    const built = try TransactionBuilder.init()
        .setChainId(1)
        .setMaxFeePerGas(30)
        .setMaxPriorityFeePerGas(2)
        .setAuthorizationList(&auths)
        .setGasLimit(50_000)
        .setTo(try recipient())
        .build();
    try testing.expectEqual(TransactionType.eip7702, built.transactionType());
    try testing.expectEqual(@as(usize, 1), built.eip7702.authorization_list.len);
}

test "builder explicit type overrides detection" {
    const built = try TransactionBuilder.init()
        .setType(.eip2930)
        .setChainId(5)
        .setGasPrice(1)
        .setGasLimit(21_000)
        .build();
    try testing.expectEqual(TransactionType.eip2930, built.transactionType());
    try testing.expectEqual(@as(u64, 5), built.eip2930.chain_id);
}

test "builder rejects invalid field combinations" {
    const base = TransactionBuilder.init().setGasLimit(21_000);
    try testing.expectError(BuildError.MissingFeeFields, base.build());
    try testing.expectError(BuildError.MissingGasLimit, TransactionBuilder.init().setGasPrice(1).build());
    try testing.expectError(BuildError.ConflictingFeeFields, base.setGasPrice(1).setMaxFeePerGas(2).build());
    try testing.expectError(BuildError.MissingChainId, base.setMaxFeePerGas(2).setMaxPriorityFeePerGas(1).build());
    try testing.expectError(BuildError.MissingMaxPriorityFeePerGas, base.setChainId(1).setMaxFeePerGas(2).build());
    try testing.expectError(BuildError.PriorityFeeExceedsMaxFee, base.setChainId(1).setMaxFeePerGas(1).setMaxPriorityFeePerGas(2).build());
    try testing.expectError(BuildError.MissingChainId, base.setType(.eip2930).setGasPrice(1).build());
    try testing.expectError(BuildError.FieldNotAllowedForType, base.setType(.legacy).setGasPrice(1).setAccessList(&.{}).build());
    try testing.expectError(BuildError.MissingGasPrice, base.setType(.legacy).build());

    const fees = base.setChainId(1).setMaxFeePerGas(2).setMaxPriorityFeePerGas(1);
    const hashes = [_]VersionedHash{.{ .bytes = @as([32]u8, @splat(0x01)) }};
    try testing.expectError(BuildError.MissingRecipient, fees.setMaxFeePerBlobGas(1).setBlobVersionedHashes(&hashes).build());
    try testing.expectError(BuildError.MissingBlobVersionedHashes, fees.setTo(try recipient()).setMaxFeePerBlobGas(1).build());
    try testing.expectError(BuildError.MissingBlobVersionedHashes, fees.setTo(try recipient()).setMaxFeePerBlobGas(1).setBlobVersionedHashes(&.{}).build());
    try testing.expectError(BuildError.MissingMaxFeePerBlobGas, fees.setTo(try recipient()).setBlobVersionedHashes(&hashes).build());
    try testing.expectError(BuildError.MissingRecipient, fees.setAuthorizationList(&.{}).build());
    try testing.expectError(BuildError.MissingAuthorizationList, fees.setTo(try recipient()).setAuthorizationList(&.{}).build());
    try testing.expectError(BuildError.FieldNotAllowedForType, fees.setType(.eip1559).setMaxFeePerBlobGas(1).build());
}

test "builder signing hash matches per-type encoder" {
    const allocator = testing.allocator;
    const b = TransactionBuilder.init()
        .setChainId(1)
        .setNonce(3)
        .setMaxFeePerGas(30)
        .setMaxPriorityFeePerGas(2)
        .setGasLimit(21_000)
        .setTo(try recipient());
    const built = try b.build();
    const encoded = try Transaction.encodeEip1559ForSigning(allocator, built.eip1559);
    defer allocator.free(encoded);
    try testing.expectEqual(hash.keccak256(encoded), try b.signingHash(allocator));
    try testing.expectEqual(@as(u8, 0x02), encoded[0]);
}

test "builder sign recovers signer for every type" {
    const allocator = testing.allocator;
    const me = try signer();
    const to = try recipient();
    const hashes = [_]VersionedHash{.{ .bytes = [_]u8{0x01} ++ @as([31]u8, @splat(0xbb)) }};
    const auths = [_]Authorization{.{ .chain_id = 1, .address = to, .nonce = 0, .v = 0, .r = @as([32]u8, @splat(1)), .s = @as([32]u8, @splat(2)) }};
    const fees = TransactionBuilder.init().setChainId(1).setGasLimit(60_000).setTo(to).setMaxFeePerGas(30).setMaxPriorityFeePerGas(2);

    const builders = [_]TransactionBuilder{
        TransactionBuilder.init().setGasPrice(1).setGasLimit(21_000).setTo(to),
        TransactionBuilder.init().setChainId(1).setGasPrice(1).setGasLimit(21_000).setTo(to).setAccessList(&.{}),
        fees,
        fees.setMaxFeePerBlobGas(3).setBlobVersionedHashes(&hashes),
        fees.setAuthorizationList(&auths),
    };
    const types = [_]TransactionType{ .legacy, .eip2930, .eip1559, .eip4844, .eip7702 };

    for (builders, types) |b, t| {
        const signed = try b.sign(allocator, test_key);
        try testing.expectEqual(t, signed.transactionType());
        const h = try b.signingHash(allocator);
        const got = switch (signed) {
            .legacy => |tx| blk: {
                try testing.expect(tx.v == 27 or tx.v == 28);
                break :blk try recover(h, @intCast(tx.v - 27), tx.r, tx.s);
            },
            inline else => |tx| blk: {
                try testing.expect(tx.y_parity <= 1);
                break :blk try recover(h, tx.y_parity, tx.r, tx.s);
            },
        };
        try testing.expectEqual(me, got);
    }
}

test "builder sign legacy with chain id uses EIP-155 v" {
    const allocator = testing.allocator;
    const b = TransactionBuilder.init().setChainId(1).setGasPrice(1).setGasLimit(21_000).setTo(try recipient());
    const signed = try b.sign(allocator, test_key);
    try testing.expect(signed.legacy.v == 37 or signed.legacy.v == 38);
    const got = try recover(try b.signingHash(allocator), @intCast(signed.legacy.v - 37), signed.legacy.r, signed.legacy.s);
    try testing.expectEqual(try signer(), got);
}
