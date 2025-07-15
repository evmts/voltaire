const std = @import("std");
const testing = std.testing;
const transaction_types = @import("transaction_types.zig");
const rlp = @import("primitives/rlp/rlp.zig");
const hex = @import("primitives/hex.zig");
const hash = @import("primitives/hash.zig");

// Re-export core types
pub const TxType = transaction_types.TxType;
pub const TypedTransaction = transaction_types.TypedTransaction;
pub const TxLegacy = transaction_types.TxLegacy;
pub const TxEip1559 = transaction_types.TxEip1559;
pub const TxEip2930 = transaction_types.TxEip2930;
pub const TxEip4844 = transaction_types.TxEip4844;
pub const TxEip7702 = transaction_types.TxEip7702;
pub const SignedTransaction = transaction_types.SignedTransaction;
pub const TransactionEnvelope = transaction_types.TransactionEnvelope;
pub const Signature = transaction_types.Signature;
pub const Address = transaction_types.Address;
pub const B256 = transaction_types.B256;
pub const U256 = transaction_types.U256;
pub const ChainId = transaction_types.ChainId;
pub const AccessList = transaction_types.AccessList;
pub const AccessListItem = transaction_types.AccessListItem;
pub const SignedAuthorization = transaction_types.SignedAuthorization;
pub const TxKind = transaction_types.TxKind;

/// Transaction serialization errors
pub const SerializationError = error{
    InvalidTransactionType,
    SerializationFailed,
    DeserializationFailed,
    InvalidSignature,
    OutOfMemory,
    InvalidLength,
    UnsupportedTransactionType,
};

/// Transaction serializer/deserializer
pub const TransactionSerializer = struct {
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) TransactionSerializer {
        return TransactionSerializer{ .allocator = allocator };
    }

    /// Serialize a TypedTransaction to RLP-encoded bytes
    pub fn serializeTypedTransaction(self: *TransactionSerializer, tx: TypedTransaction, signature: ?Signature) ![]u8 {
        switch (tx) {
            .legacy => |legacy| return try self.serializeLegacyTransaction(legacy, signature),
            .eip2930 => |eip2930| return try self.serializeEip2930Transaction(eip2930, signature),
            .eip1559 => |eip1559| return try self.serializeEip1559Transaction(eip1559, signature),
            .eip4844 => |eip4844| return try self.serializeEip4844Transaction(eip4844, signature),
            .eip7702 => |eip7702| return try self.serializeEip7702Transaction(eip7702, signature),
        }
    }

    /// Parse a TypedTransaction from RLP-encoded bytes
    pub fn parseTypedTransaction(self: *TransactionSerializer, data: []const u8) !TypedTransaction {
        if (data.len == 0) return SerializationError.InvalidLength;

        // Check if it's a typed transaction (EIP-2718)
        const first_byte = data[0];

        // Legacy transaction (no type prefix)
        if (first_byte >= 0xc0) {
            return TypedTransaction{ .legacy = try self.parseLegacyTransaction(data) };
        }

        // Typed transaction
        const tx_type: TxType = switch (first_byte) {
            0x01 => .eip2930,
            0x02 => .eip1559,
            0x03 => .eip4844,
            0x04 => .eip7702,
            else => return SerializationError.UnsupportedTransactionType,
        };

        const payload = data[1..];

        switch (tx_type) {
            .eip2930 => return TypedTransaction{ .eip2930 = try self.parseEip2930Transaction(payload) },
            .eip1559 => return TypedTransaction{ .eip1559 = try self.parseEip1559Transaction(payload) },
            .eip4844 => return TypedTransaction{ .eip4844 = try self.parseEip4844Transaction(payload) },
            .eip7702 => return TypedTransaction{ .eip7702 = try self.parseEip7702Transaction(payload) },
            .legacy => unreachable, // Legacy doesn't have type prefix
        }
    }

    /// Get the signing hash for a transaction
    pub fn getSigningHash(self: *TransactionSerializer, tx: TypedTransaction, chain_id: ?ChainId) !B256 {
        const unsigned_data = try self.serializeUnsignedTransaction(tx, chain_id);
        defer self.allocator.free(unsigned_data);
        return hash.keccak256(unsigned_data);
    }

    /// Serialize transaction without signature for signing
    pub fn serializeUnsignedTransaction(self: *TransactionSerializer, tx: TypedTransaction, chain_id: ?ChainId) ![]u8 {
        switch (tx) {
            .legacy => |legacy| return try self.serializeLegacyUnsigned(legacy, chain_id),
            .eip2930 => |eip2930| return try self.serializeEip2930Unsigned(eip2930),
            .eip1559 => |eip1559| return try self.serializeEip1559Unsigned(eip1559),
            .eip4844 => |eip4844| return try self.serializeEip4844Unsigned(eip4844),
            .eip7702 => |eip7702| return try self.serializeEip7702Unsigned(eip7702),
        }
    }

    /// Legacy transaction serialization
    fn serializeLegacyTransaction(self: *TransactionSerializer, tx: TxLegacy, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]const u8).init(self.allocator);
        defer fields.deinit();

        // Basic fields
        try fields.append(try self.encodeU64(tx.nonce));
        try fields.append(try self.encodeU128(tx.gas_price));
        try fields.append(try self.encodeU64(tx.gas_limit));
        try fields.append(try self.encodeTxKind(tx.to));
        try fields.append(try self.encodeU256(tx.value));
        try fields.append(try self.encodeBytes(tx.input));

        // Add signature or chain_id
        if (signature) |sig| {
            const v = if (tx.chain_id) |chain_id|
                @as(u64, sig.y_parity) + 35 + 2 * chain_id
            else
                @as(u64, sig.y_parity) + 27;

            try fields.append(try self.encodeU64(v));
            try fields.append(try self.encodeU256(sig.r));
            try fields.append(try self.encodeU256(sig.s));
        } else if (tx.chain_id) |chain_id| {
            try fields.append(try self.encodeU64(chain_id));
            try fields.append(try self.encodeBytes(&.{})); // Empty r
            try fields.append(try self.encodeBytes(&.{})); // Empty s
        }

        return try self.encodeList(fields.items);
    }

    fn serializeLegacyUnsigned(self: *TransactionSerializer, tx: TxLegacy, chain_id: ?ChainId) ![]u8 {
        var fields = std.ArrayList([]const u8).init(self.allocator);
        defer fields.deinit();

        try fields.append(try self.encodeU64(tx.nonce));
        try fields.append(try self.encodeU128(tx.gas_price));
        try fields.append(try self.encodeU64(tx.gas_limit));
        try fields.append(try self.encodeTxKind(tx.to));
        try fields.append(try self.encodeU256(tx.value));
        try fields.append(try self.encodeBytes(tx.input));

        if (chain_id) |cid| {
            try fields.append(try self.encodeU64(cid));
            try fields.append(try self.encodeBytes(&.{}));
            try fields.append(try self.encodeBytes(&.{}));
        }

        return try self.encodeList(fields.items);
    }

    /// EIP-1559 transaction serialization
    fn serializeEip1559Transaction(self: *TransactionSerializer, tx: TxEip1559, signature: ?Signature) ![]u8 {
        const tx_data = try self.serializeEip1559Fields(tx, signature);
        defer self.allocator.free(tx_data);

        var result = try self.allocator.alloc(u8, 1 + tx_data.len);
        result[0] = 0x02; // EIP-1559 type
        @memcpy(result[1..], tx_data);
        return result;
    }

    fn serializeEip1559Unsigned(self: *TransactionSerializer, tx: TxEip1559) ![]u8 {
        const tx_data = try self.serializeEip1559Fields(tx, null);
        defer self.allocator.free(tx_data);

        var result = try self.allocator.alloc(u8, 1 + tx_data.len);
        result[0] = 0x02;
        @memcpy(result[1..], tx_data);
        return result;
    }

    fn serializeEip1559Fields(self: *TransactionSerializer, tx: TxEip1559, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]const u8).init(self.allocator);
        defer fields.deinit();

        try fields.append(try self.encodeU64(tx.chain_id));
        try fields.append(try self.encodeU64(tx.nonce));
        try fields.append(try self.encodeU128(tx.max_priority_fee_per_gas));
        try fields.append(try self.encodeU128(tx.max_fee_per_gas));
        try fields.append(try self.encodeU64(tx.gas_limit));
        try fields.append(try self.encodeTxKind(tx.to));
        try fields.append(try self.encodeU256(tx.value));
        try fields.append(try self.encodeBytes(tx.input));
        try fields.append(try self.encodeAccessList(tx.access_list));

        if (signature) |sig| {
            try fields.append(try self.encodeU8(sig.y_parity));
            try fields.append(try self.encodeU256(sig.r));
            try fields.append(try self.encodeU256(sig.s));
        }

        return try self.encodeList(fields.items);
    }

    /// EIP-2930 transaction serialization
    fn serializeEip2930Transaction(self: *TransactionSerializer, tx: TxEip2930, signature: ?Signature) ![]u8 {
        const tx_data = try self.serializeEip2930Fields(tx, signature);
        defer self.allocator.free(tx_data);

        var result = try self.allocator.alloc(u8, 1 + tx_data.len);
        result[0] = 0x01; // EIP-2930 type
        @memcpy(result[1..], tx_data);
        return result;
    }

    fn serializeEip2930Unsigned(self: *TransactionSerializer, tx: TxEip2930) ![]u8 {
        const tx_data = try self.serializeEip2930Fields(tx, null);
        defer self.allocator.free(tx_data);

        var result = try self.allocator.alloc(u8, 1 + tx_data.len);
        result[0] = 0x01;
        @memcpy(result[1..], tx_data);
        return result;
    }

    fn serializeEip2930Fields(self: *TransactionSerializer, tx: TxEip2930, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]const u8).init(self.allocator);
        defer fields.deinit();

        try fields.append(try self.encodeU64(tx.chain_id));
        try fields.append(try self.encodeU64(tx.nonce));
        try fields.append(try self.encodeU128(tx.gas_price));
        try fields.append(try self.encodeU64(tx.gas_limit));
        try fields.append(try self.encodeTxKind(tx.to));
        try fields.append(try self.encodeU256(tx.value));
        try fields.append(try self.encodeBytes(tx.input));
        try fields.append(try self.encodeAccessList(tx.access_list));

        if (signature) |sig| {
            try fields.append(try self.encodeU8(sig.y_parity));
            try fields.append(try self.encodeU256(sig.r));
            try fields.append(try self.encodeU256(sig.s));
        }

        return try self.encodeList(fields.items);
    }

    /// EIP-4844 transaction serialization (simplified)
    fn serializeEip4844Transaction(self: *TransactionSerializer, tx: TxEip4844, signature: ?Signature) ![]u8 {
        const tx_data = try self.serializeEip4844Fields(tx, signature);
        defer self.allocator.free(tx_data);

        var result = try self.allocator.alloc(u8, 1 + tx_data.len);
        result[0] = 0x03; // EIP-4844 type
        @memcpy(result[1..], tx_data);
        return result;
    }

    fn serializeEip4844Unsigned(self: *TransactionSerializer, tx: TxEip4844) ![]u8 {
        const tx_data = try self.serializeEip4844Fields(tx, null);
        defer self.allocator.free(tx_data);

        var result = try self.allocator.alloc(u8, 1 + tx_data.len);
        result[0] = 0x03;
        @memcpy(result[1..], tx_data);
        return result;
    }

    fn serializeEip4844Fields(self: *TransactionSerializer, tx: TxEip4844, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]const u8).init(self.allocator);
        defer fields.deinit();

        try fields.append(try self.encodeU64(tx.chain_id));
        try fields.append(try self.encodeU64(tx.nonce));
        try fields.append(try self.encodeU128(tx.max_priority_fee_per_gas));
        try fields.append(try self.encodeU128(tx.max_fee_per_gas));
        try fields.append(try self.encodeU64(tx.gas_limit));
        try fields.append(try self.encodeAddress(tx.to));
        try fields.append(try self.encodeU256(tx.value));
        try fields.append(try self.encodeBytes(tx.input));
        try fields.append(try self.encodeAccessList(tx.access_list));
        try fields.append(try self.encodeU128(tx.max_fee_per_blob_gas));
        try fields.append(try self.encodeBlobVersionedHashes(tx.blob_versioned_hashes));

        if (signature) |sig| {
            try fields.append(try self.encodeU8(sig.y_parity));
            try fields.append(try self.encodeU256(sig.r));
            try fields.append(try self.encodeU256(sig.s));
        }

        return try self.encodeList(fields.items);
    }

    /// EIP-7702 transaction serialization (simplified)
    fn serializeEip7702Transaction(self: *TransactionSerializer, tx: TxEip7702, signature: ?Signature) ![]u8 {
        const tx_data = try self.serializeEip7702Fields(tx, signature);
        defer self.allocator.free(tx_data);

        var result = try self.allocator.alloc(u8, 1 + tx_data.len);
        result[0] = 0x04; // EIP-7702 type
        @memcpy(result[1..], tx_data);
        return result;
    }

    fn serializeEip7702Unsigned(self: *TransactionSerializer, tx: TxEip7702) ![]u8 {
        const tx_data = try self.serializeEip7702Fields(tx, null);
        defer self.allocator.free(tx_data);

        var result = try self.allocator.alloc(u8, 1 + tx_data.len);
        result[0] = 0x04;
        @memcpy(result[1..], tx_data);
        return result;
    }

    fn serializeEip7702Fields(self: *TransactionSerializer, tx: TxEip7702, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]const u8).init(self.allocator);
        defer fields.deinit();

        try fields.append(try self.encodeU64(tx.chain_id));
        try fields.append(try self.encodeU64(tx.nonce));
        try fields.append(try self.encodeU128(tx.max_priority_fee_per_gas));
        try fields.append(try self.encodeU128(tx.max_fee_per_gas));
        try fields.append(try self.encodeU64(tx.gas_limit));
        try fields.append(try self.encodeAddress(tx.to));
        try fields.append(try self.encodeU256(tx.value));
        try fields.append(try self.encodeBytes(tx.input));
        try fields.append(try self.encodeAccessList(tx.access_list));
        try fields.append(try self.encodeAuthorizationList(tx.authorization_list));

        if (signature) |sig| {
            try fields.append(try self.encodeU8(sig.y_parity));
            try fields.append(try self.encodeU256(sig.r));
            try fields.append(try self.encodeU256(sig.s));
        }

        return try self.encodeList(fields.items);
    }

    // PARSING FUNCTIONS

    fn parseLegacyTransaction(self: *TransactionSerializer, data: []const u8) !TxLegacy {
        const decoded = try rlp.decode(self.allocator, data, false);
        defer decoded.data.deinit(self.allocator);

        switch (decoded.data) {
            .List => |fields| {
                if (fields.len < 6 or fields.len > 9) return SerializationError.InvalidLength;

                const nonce = try self.decodeU64(fields[0]);
                const gas_price = try self.decodeU128(fields[1]);
                const gas_limit = try self.decodeU64(fields[2]);
                const to = try self.decodeTxKind(fields[3]);
                const value = try self.decodeU256(fields[4]);
                const input = try self.decodeBytes(fields[5]);

                var chain_id: ?ChainId = null;

                // Handle optional signature/chain_id fields
                if (fields.len > 6) {
                    const v_field = try self.decodeU64(fields[6]);
                    // If r and s are empty, this is chain_id
                    if (fields.len == 9) {
                        const r_empty = switch (fields[7]) {
                            .String => |s| s.len == 0,
                            else => false,
                        };
                        const s_empty = switch (fields[8]) {
                            .String => |s| s.len == 0,
                            else => false,
                        };

                        if (r_empty and s_empty) {
                            chain_id = v_field;
                        } else {
                            // Extract chain_id from v if present
                            if (v_field >= 35) {
                                chain_id = (v_field - 35) / 2;
                            }
                        }
                    }
                }

                return TxLegacy{
                    .chain_id = chain_id,
                    .nonce = nonce,
                    .gas_price = gas_price,
                    .gas_limit = gas_limit,
                    .to = to,
                    .value = value,
                    .input = @constCast(input),
                };
            },
            .String => return SerializationError.DeserializationFailed,
        }
    }

    fn parseEip1559Transaction(self: *TransactionSerializer, data: []const u8) !TxEip1559 {
        const decoded = try rlp.decode(self.allocator, data, false);
        defer decoded.data.deinit(self.allocator);

        switch (decoded.data) {
            .List => |fields| {
                if (fields.len < 9 or fields.len > 12) return SerializationError.InvalidLength;

                return TxEip1559{
                    .chain_id = try self.decodeU64(fields[0]),
                    .nonce = try self.decodeU64(fields[1]),
                    .max_priority_fee_per_gas = try self.decodeU128(fields[2]),
                    .max_fee_per_gas = try self.decodeU128(fields[3]),
                    .gas_limit = try self.decodeU64(fields[4]),
                    .to = try self.decodeTxKind(fields[5]),
                    .value = try self.decodeU256(fields[6]),
                    .input = @constCast(try self.decodeBytes(fields[7])),
                    .access_list = try self.decodeAccessList(fields[8]),
                };
            },
            .String => return SerializationError.DeserializationFailed,
        }
    }

    fn parseEip2930Transaction(self: *TransactionSerializer, data: []const u8) !TxEip2930 {
        const decoded = try rlp.decode(self.allocator, data, false);
        defer decoded.data.deinit(self.allocator);

        switch (decoded.data) {
            .List => |fields| {
                if (fields.len < 8 or fields.len > 11) return SerializationError.InvalidLength;

                return TxEip2930{
                    .chain_id = try self.decodeU64(fields[0]),
                    .nonce = try self.decodeU64(fields[1]),
                    .gas_price = try self.decodeU128(fields[2]),
                    .gas_limit = try self.decodeU64(fields[3]),
                    .to = try self.decodeTxKind(fields[4]),
                    .value = try self.decodeU256(fields[5]),
                    .input = try self.decodeBytes(fields[6]),
                    .access_list = try self.decodeAccessList(fields[7]),
                };
            },
            .String => return SerializationError.DeserializationFailed,
        }
    }

    fn parseEip4844Transaction(self: *TransactionSerializer, data: []const u8) !TxEip4844 {
        const decoded = try rlp.decode(self.allocator, data, false);
        defer decoded.data.deinit(self.allocator);

        switch (decoded.data) {
            .List => |fields| {
                if (fields.len < 11 or fields.len > 14) return SerializationError.InvalidLength;

                return TxEip4844{
                    .chain_id = try self.decodeU64(fields[0]),
                    .nonce = try self.decodeU64(fields[1]),
                    .max_priority_fee_per_gas = try self.decodeU128(fields[2]),
                    .max_fee_per_gas = try self.decodeU128(fields[3]),
                    .gas_limit = try self.decodeU64(fields[4]),
                    .to = try self.decodeAddress(fields[5]),
                    .value = try self.decodeU256(fields[6]),
                    .input = try self.decodeBytes(fields[7]),
                    .access_list = try self.decodeAccessList(fields[8]),
                    .max_fee_per_blob_gas = try self.decodeU128(fields[9]),
                    .blob_versioned_hashes = try self.decodeBlobVersionedHashes(fields[10]),
                };
            },
            .String => return SerializationError.DeserializationFailed,
        }
    }

    fn parseEip7702Transaction(self: *TransactionSerializer, data: []const u8) !TxEip7702 {
        const decoded = try rlp.decode(self.allocator, data, false);
        defer decoded.data.deinit(self.allocator);

        switch (decoded.data) {
            .List => |fields| {
                if (fields.len < 10 or fields.len > 13) return SerializationError.InvalidLength;

                return TxEip7702{
                    .chain_id = try self.decodeU64(fields[0]),
                    .nonce = try self.decodeU64(fields[1]),
                    .max_priority_fee_per_gas = try self.decodeU128(fields[2]),
                    .max_fee_per_gas = try self.decodeU128(fields[3]),
                    .gas_limit = try self.decodeU64(fields[4]),
                    .to = try self.decodeAddress(fields[5]),
                    .value = try self.decodeU256(fields[6]),
                    .input = try self.decodeBytes(fields[7]),
                    .access_list = try self.decodeAccessList(fields[8]),
                    .authorization_list = try self.decodeAuthorizationList(fields[9]),
                };
            },
            .String => return SerializationError.DeserializationFailed,
        }
    }

    // ENCODING HELPER FUNCTIONS

    fn encodeU8(self: *TransactionSerializer, value: u8) ![]const u8 {
        return try rlp.encode(self.allocator, value);
    }

    fn encodeU64(self: *TransactionSerializer, value: u64) ![]const u8 {
        return try rlp.encode(self.allocator, value);
    }

    fn encodeU128(self: *TransactionSerializer, value: u128) ![]const u8 {
        return try rlp.encode(self.allocator, value);
    }

    fn encodeU256(self: *TransactionSerializer, value: U256) ![]const u8 {
        return try rlp.encode(self.allocator, value);
    }

    fn encodeBytes(self: *TransactionSerializer, value: []const u8) ![]const u8 {
        return try rlp.encode(self.allocator, value);
    }

    fn encodeAddress(self: *TransactionSerializer, value: Address) ![]const u8 {
        return try rlp.encode(self.allocator, &value);
    }

    fn encodeTxKind(self: *TransactionSerializer, value: TxKind) ![]const u8 {
        switch (value) {
            .call => |addr| return try self.encodeAddress(addr),
            .create => return try self.encodeBytes(&.{}),
        }
    }

    fn encodeAccessList(self: *TransactionSerializer, _: AccessList) ![]const u8 {
        // Simplified: empty access list
        return try rlp.encode(self.allocator, &[_][]const u8{});
    }

    fn encodeBlobVersionedHashes(self: *TransactionSerializer, _: []const B256) ![]const u8 {
        // Simplified: empty blob hashes
        return try rlp.encode(self.allocator, &[_][]const u8{});
    }

    fn encodeAuthorizationList(self: *TransactionSerializer, _: []const SignedAuthorization) ![]const u8 {
        // Simplified: empty authorization list
        return try rlp.encode(self.allocator, &[_][]const u8{});
    }

    fn encodeList(self: *TransactionSerializer, fields: []const []const u8) ![]u8 {
        return try rlp.encode(self.allocator, fields);
    }

    // DECODING HELPER FUNCTIONS

    fn decodeU64(self: *TransactionSerializer, data: rlp.Data) !u64 {
        _ = self;
        switch (data) {
            .String => |bytes| {
                if (bytes.len == 0) return 0;
                if (bytes.len > 8) return SerializationError.InvalidLength;
                var result: u64 = 0;
                for (bytes) |byte| {
                    result = (result << 8) | byte;
                }
                return result;
            },
            .List => return SerializationError.DeserializationFailed,
        }
    }

    fn decodeU128(self: *TransactionSerializer, data: rlp.Data) !u128 {
        _ = self;
        switch (data) {
            .String => |bytes| {
                if (bytes.len == 0) return 0;
                if (bytes.len > 16) return SerializationError.InvalidLength;
                var result: u128 = 0;
                for (bytes) |byte| {
                    result = (result << 8) | byte;
                }
                return result;
            },
            .List => return SerializationError.DeserializationFailed,
        }
    }

    fn decodeU256(self: *TransactionSerializer, data: rlp.Data) !U256 {
        _ = self;
        switch (data) {
            .String => |bytes| {
                if (bytes.len == 0) return 0;
                if (bytes.len > 32) return SerializationError.InvalidLength;
                var result: U256 = 0;
                for (bytes) |byte| {
                    result = (result << 8) | byte;
                }
                return result;
            },
            .List => return SerializationError.DeserializationFailed,
        }
    }

    fn decodeBytes(self: *TransactionSerializer, data: rlp.Data) ![]const u8 {
        switch (data) {
            .String => |bytes| return try self.allocator.dupe(u8, bytes),
            .List => return SerializationError.DeserializationFailed,
        }
    }

    fn decodeAddress(self: *TransactionSerializer, data: rlp.Data) !Address {
        _ = self;
        switch (data) {
            .String => |bytes| {
                if (bytes.len != 20) return SerializationError.InvalidLength;
                var addr: Address = undefined;
                @memcpy(&addr, bytes);
                return addr;
            },
            .List => return SerializationError.DeserializationFailed,
        }
    }

    fn decodeTxKind(self: *TransactionSerializer, data: rlp.Data) !TxKind {
        switch (data) {
            .String => |bytes| {
                if (bytes.len == 0) return TxKind.create;
                if (bytes.len != 20) return SerializationError.InvalidLength;
                return TxKind{ .call = try self.decodeAddress(data) };
            },
            .List => return SerializationError.DeserializationFailed,
        }
    }

    fn decodeAccessList(self: *TransactionSerializer, _: rlp.Data) !AccessList {
        // Simplified: return empty access list
        return try self.allocator.alloc(AccessListItem, 0);
    }

    fn decodeBlobVersionedHashes(self: *TransactionSerializer, _: rlp.Data) ![]const B256 {
        // Simplified: return empty blob hashes
        return try self.allocator.alloc(B256, 0);
    }

    fn decodeAuthorizationList(self: *TransactionSerializer, _: rlp.Data) ![]const SignedAuthorization {
        // Simplified: return empty authorization list
        return try self.allocator.alloc(SignedAuthorization, 0);
    }
};

/// Utility functions for transaction serialization
pub const TransactionSerializationUtils = struct {
    /// Get transaction type from encoded transaction data
    pub fn getTransactionType(data: []const u8) !TxType {
        if (data.len == 0) return SerializationError.InvalidLength;

        const first_byte = data[0];

        // Legacy transaction starts with RLP list marker (>= 0xc0)
        if (first_byte >= 0xc0) return .legacy;

        // Typed transaction
        return switch (first_byte) {
            0x01 => .eip2930,
            0x02 => .eip1559,
            0x03 => .eip4844,
            0x04 => .eip7702,
            else => SerializationError.UnsupportedTransactionType,
        };
    }

    /// Extract signature from raw transaction data
    pub fn extractSignature(allocator: std.mem.Allocator, data: []const u8) !?Signature {
        var serializer = TransactionSerializer.init(allocator);
        const tx = try serializer.parseTypedTransaction(data);

        // For now, return null as signature extraction is complex
        // In a full implementation, we'd parse the signature from the RLP data
        _ = tx;
        return null;
    }

    /// Calculate transaction hash
    pub fn calculateTransactionHash(_: std.mem.Allocator, data: []const u8) !B256 {
        return hash.keccak256(data);
    }
};

// Tests
test "transaction serialization roundtrip - legacy" {
    const allocator = testing.allocator;
    var serializer = TransactionSerializer.init(allocator);

    const tx = TxLegacy{
        .chain_id = 1,
        .nonce = 42,
        .gas_price = 20000000000,
        .gas_limit = 21000,
        .to = TxKind{ .call = [_]u8{0} ** 20 },
        .value = 1000000000000000000,
        .input = &.{},
    };

    const signature = Signature{
        .v = 27,
        .y_parity = 0,
        .r = 0x123456789abcdef,
        .s = 0xfedcba987654321,
    };

    const serialized = try serializer.serializeLegacyTransaction(tx, signature);
    defer allocator.free(serialized);

    const parsed = try serializer.parseLegacyTransaction(serialized);
    defer allocator.free(parsed.input);

    try testing.expectEqual(tx.chain_id, parsed.chain_id);
    try testing.expectEqual(tx.nonce, parsed.nonce);
    try testing.expectEqual(tx.gas_price, parsed.gas_price);
    try testing.expectEqual(tx.gas_limit, parsed.gas_limit);
    try testing.expectEqual(tx.value, parsed.value);
}

test "transaction type detection" {
    // Legacy transaction (starts with RLP list marker)
    const legacy_data = [_]u8{ 0xc1, 0x80 };
    try testing.expectEqual(TxType.legacy, try TransactionSerializationUtils.getTransactionType(&legacy_data));

    // EIP-1559 transaction
    const eip1559_data = [_]u8{ 0x02, 0xc1, 0x80 };
    try testing.expectEqual(TxType.eip1559, try TransactionSerializationUtils.getTransactionType(&eip1559_data));

    // EIP-2930 transaction
    const eip2930_data = [_]u8{ 0x01, 0xc1, 0x80 };
    try testing.expectEqual(TxType.eip2930, try TransactionSerializationUtils.getTransactionType(&eip2930_data));
}

test "eip1559 serialization" {
    const allocator = testing.allocator;
    var serializer = TransactionSerializer.init(allocator);

    const tx = TxEip1559{
        .chain_id = 1,
        .nonce = 42,
        .max_priority_fee_per_gas = 1000000000,
        .max_fee_per_gas = 20000000000,
        .gas_limit = 21000,
        .to = TxKind{ .call = [_]u8{0} ** 20 },
        .value = 1000000000000000000,
        .input = &.{},
        .access_list = &.{},
    };

    const serialized = try serializer.serializeEip1559Transaction(tx, null);
    defer allocator.free(serialized);

    // Should start with 0x02 (EIP-1559 type)
    try testing.expectEqual(@as(u8, 0x02), serialized[0]);

    const parsed = try serializer.parseEip1559Transaction(serialized[1..]);
    defer allocator.free(parsed.input);
    defer allocator.free(parsed.access_list);

    try testing.expectEqual(tx.chain_id, parsed.chain_id);
    try testing.expectEqual(tx.nonce, parsed.nonce);
    try testing.expectEqual(tx.max_fee_per_gas, parsed.max_fee_per_gas);
}

test "signing hash generation" {
    const allocator = testing.allocator;
    var serializer = TransactionSerializer.init(allocator);

    const tx = TypedTransaction{
        .legacy = TxLegacy{
            .chain_id = 1,
            .nonce = 0,
            .gas_price = 20000000000,
            .gas_limit = 21000,
            .to = TxKind{ .call = [_]u8{0} ** 20 },
            .value = 1000000000000000000,
            .input = &.{},
        },
    };

    const tx_hash = try serializer.getSigningHash(tx, 1);

    // Hash should be 32 bytes
    try testing.expectEqual(@as(usize, 32), tx_hash.len);

    // Hash should be deterministic
    const hash2 = try serializer.getSigningHash(tx, 1);
    try testing.expectEqualSlices(u8, &tx_hash, &hash2);
}
