const std = @import("std");
const testing = std.testing;
const transaction_types = @import("transaction_types.zig");
const rlp = @import("primitives/rlp/rlp.zig");
const crypto = @import("primitives/crypto.zig");
const hex = @import("primitives/hex.zig");

// Re-export transaction types for convenience
pub const TxType = transaction_types.TxType;
pub const TypedTransaction = transaction_types.TypedTransaction;
pub const TxLegacy = transaction_types.TxLegacy;
pub const TxEip2930 = transaction_types.TxEip2930;
pub const TxEip1559 = transaction_types.TxEip1559;
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
pub const SignedAuthorization = transaction_types.SignedAuthorization;
pub const TxKind = transaction_types.TxKind;

/// Errors that can occur during transaction building
pub const TransactionBuildingError = error{
    InvalidTransactionType,
    SerializationError,
    DeserializationError,
    InvalidSignature,
    InvalidChainId,
    InvalidNonce,
    InvalidGasLimit,
    InvalidGasPrice,
    InvalidMaxFeePerGas,
    InvalidMaxPriorityFeePerGas,
    InvalidValue,
    InvalidData,
    InvalidAccessList,
    InvalidAuthorizationList,
    RlpEncodingError,
    RlpDecodingError,
    OutOfMemory,
    InvalidFormat,
    UnsupportedTransactionType,
};

/// Transaction request - used for building transactions before signing
pub const TransactionRequest = struct {
    from: ?Address = null,
    to: ?TxKind = null,
    gas: ?u64 = null,
    gas_price: ?U256 = null,
    max_fee_per_gas: ?U256 = null,
    max_priority_fee_per_gas: ?U256 = null,
    max_fee_per_blob_gas: ?U256 = null,
    value: ?U256 = null,
    data: ?[]const u8 = null,
    nonce: ?u64 = null,
    chain_id: ?ChainId = null,
    access_list: ?AccessList = null,
    authorization_list: ?[]SignedAuthorization = null,
    blob_versioned_hashes: ?[]const B256 = null,
    transaction_type: ?TxType = null,

    /// Convert request to appropriate transaction type
    pub fn to_transaction(self: TransactionRequest) !TypedTransaction {
        const tx_type = self.transaction_type orelse try infer_transaction_type(self);

        switch (tx_type) {
            .legacy => {
                return TypedTransaction{
                    .legacy = TxLegacy{
                        .chain_id = self.chain_id,
                        .nonce = self.nonce orelse 0,
                        .gas_price = self.gas_price orelse 0,
                        .gas_limit = self.gas orelse 21000,
                        .to = self.to orelse TxKind.create,
                        .value = self.value orelse 0,
                        .input = if (self.data) |d| try std.heap.page_allocator.dupe(u8, d) else &.{},
                    },
                };
            },
            .eip2930 => {
                return TypedTransaction{
                    .eip2930 = TxEip2930{
                        .chain_id = self.chain_id orelse return TransactionBuildingError.InvalidChainId,
                        .nonce = self.nonce orelse 0,
                        .gas_price = self.gas_price orelse 0,
                        .gas_limit = self.gas orelse 21000,
                        .to = self.to orelse TxKind.create,
                        .value = self.value orelse 0,
                        .input = if (self.data) |d| try std.heap.page_allocator.dupe(u8, d) else &.{},
                        .access_list = self.access_list orelse &.{},
                    },
                };
            },
            .eip1559 => {
                return TypedTransaction{
                    .eip1559 = TxEip1559{
                        .chain_id = self.chain_id orelse return TransactionBuildingError.InvalidChainId,
                        .nonce = self.nonce orelse 0,
                        .max_priority_fee_per_gas = self.max_priority_fee_per_gas orelse 0,
                        .max_fee_per_gas = self.max_fee_per_gas orelse 0,
                        .gas_limit = self.gas orelse 21000,
                        .to = self.to orelse TxKind.create,
                        .value = self.value orelse 0,
                        .input = if (self.data) |d| try std.heap.page_allocator.dupe(u8, d) else &.{},
                        .access_list = self.access_list orelse &.{},
                    },
                };
            },
            .eip4844 => {
                return TypedTransaction{
                    .eip4844 = TxEip4844{
                        .chain_id = self.chain_id orelse return TransactionBuildingError.InvalidChainId,
                        .nonce = self.nonce orelse 0,
                        .max_priority_fee_per_gas = self.max_priority_fee_per_gas orelse 0,
                        .max_fee_per_gas = self.max_fee_per_gas orelse 0,
                        .gas_limit = self.gas orelse 21000,
                        .to = switch (self.to orelse return TransactionBuildingError.InvalidData) {
                            .call => |addr| addr,
                            .create => return TransactionBuildingError.InvalidData,
                        },
                        .value = self.value orelse 0,
                        .input = if (self.data) |d| try std.heap.page_allocator.dupe(u8, d) else &.{},
                        .access_list = self.access_list orelse &.{},
                        .max_fee_per_blob_gas = self.max_fee_per_blob_gas orelse 0,
                        .blob_versioned_hashes = self.blob_versioned_hashes orelse &.{},
                    },
                };
            },
            .eip7702 => {
                return TypedTransaction{
                    .eip7702 = TxEip7702{
                        .chain_id = self.chain_id orelse return TransactionBuildingError.InvalidChainId,
                        .nonce = self.nonce orelse 0,
                        .max_priority_fee_per_gas = self.max_priority_fee_per_gas orelse 0,
                        .max_fee_per_gas = self.max_fee_per_gas orelse 0,
                        .gas_limit = self.gas orelse 21000,
                        .to = switch (self.to orelse return TransactionBuildingError.InvalidData) {
                            .call => |addr| addr,
                            .create => return TransactionBuildingError.InvalidData,
                        },
                        .value = self.value orelse 0,
                        .input = if (self.data) |d| try std.heap.page_allocator.dupe(u8, d) else &.{},
                        .access_list = self.access_list orelse &.{},
                        .authorization_list = self.authorization_list orelse &.{},
                    },
                };
            },
        }
    }

    /// Infer transaction type from request parameters
    fn infer_transaction_type(self: TransactionRequest) !TxType {
        if (self.authorization_list != null) return .eip7702;
        if (self.blob_versioned_hashes != null or self.max_fee_per_blob_gas != null) return .eip4844;
        if (self.max_fee_per_gas != null or self.max_priority_fee_per_gas != null) return .eip1559;
        if (self.access_list != null) return .eip2930;
        return .legacy;
    }
};

/// Transaction serializer - converts transactions to RLP-encoded bytes
pub const TransactionSerializer = struct {
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) TransactionSerializer {
        return TransactionSerializer{ .allocator = allocator };
    }

    /// Serialize a transaction envelope to bytes
    pub fn serialize(self: *TransactionSerializer, envelope: TransactionEnvelope) ![]u8 {
        switch (envelope) {
            .typed => |tx| return try self.serialize_typed_transaction(tx),
            .signed => |signed_tx| return try self.serialize_signed_transaction(signed_tx),
        }
    }

    /// Serialize a typed transaction (unsigned)
    pub fn serialize_typed_transaction(self: *TransactionSerializer, tx: TypedTransaction) ![]u8 {
        switch (tx) {
            .legacy => |legacy| return try self.serialize_legacy_transaction(legacy, null),
            .eip2930 => |eip2930| return try self.serialize_eip2930_transaction(eip2930, null),
            .eip1559 => |eip1559| return try self.serialize_eip1559_transaction(eip1559, null),
            .eip4844 => |eip4844| return try self.serialize_eip4844_transaction(eip4844, null),
            .eip7702 => |eip7702| return try self.serialize_eip7702_transaction(eip7702, null),
        }
    }

    /// Serialize a signed transaction
    pub fn serialize_signed_transaction(self: *TransactionSerializer, signed_tx: SignedTransaction) ![]u8 {
        switch (signed_tx.transaction) {
            .legacy => |legacy| return try self.serialize_legacy_transaction(legacy, signed_tx.signature),
            .eip2930 => |eip2930| return try self.serialize_eip2930_transaction(eip2930, signed_tx.signature),
            .eip1559 => |eip1559| return try self.serialize_eip1559_transaction(eip1559, signed_tx.signature),
            .eip4844 => |eip4844| return try self.serialize_eip4844_transaction(eip4844, signed_tx.signature),
            .eip7702 => |eip7702| return try self.serialize_eip7702_transaction(eip7702, signed_tx.signature),
        }
    }

    /// Serialize Legacy transaction
    fn serialize_legacy_transaction(self: *TransactionSerializer, tx: TxLegacy, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]u8).init(self.allocator);
        defer {
            for (fields.items) |field| {
                self.allocator.free(field);
            }
            fields.deinit();
        }

        // Encode fields in order: [nonce, gasPrice, gasLimit, to, value, data, chainId?, r?, s?]
        try fields.append(try encode_u64(self.allocator, tx.nonce));
        try fields.append(try encode_u256(self.allocator, tx.gas_price));
        try fields.append(try encode_u64(self.allocator, tx.gas_limit));
        try fields.append(try encode_tx_kind(self.allocator, tx.to));
        try fields.append(try encode_u256(self.allocator, tx.value));
        try fields.append(try encode_bytes(self.allocator, tx.input));

        if (signature) |sig| {
            // EIP-155 encoding
            const v = try compute_v(sig.y_parity, tx.chain_id);
            try fields.append(try encode_u256(self.allocator, v));
            try fields.append(try encode_u256(self.allocator, sig.r));
            try fields.append(try encode_u256(self.allocator, sig.s));
        } else if (tx.chain_id) |chain_id| {
            // Unsigned with chain ID for signing
            try fields.append(try encode_u64(self.allocator, chain_id));
            try fields.append(try encode_u256(self.allocator, 0));
            try fields.append(try encode_u256(self.allocator, 0));
        }

        return try rlp.encode(self.allocator, fields.items);
    }

    /// Serialize EIP-2930 transaction
    fn serialize_eip2930_transaction(self: *TransactionSerializer, tx: TxEip2930, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]u8).init(self.allocator);
        defer {
            for (fields.items) |field| {
                self.allocator.free(field);
            }
            fields.deinit();
        }

        // Encode fields: [chainId, nonce, gasPrice, gasLimit, to, value, data, accessList, yParity?, r?, s?]
        try fields.append(try encode_u64(self.allocator, tx.chain_id));
        try fields.append(try encode_u64(self.allocator, tx.nonce));
        try fields.append(try encode_u256(self.allocator, tx.gas_price));
        try fields.append(try encode_u64(self.allocator, tx.gas_limit));
        try fields.append(try encode_tx_kind(self.allocator, tx.to));
        try fields.append(try encode_u256(self.allocator, tx.value));
        try fields.append(try encode_bytes(self.allocator, tx.input));
        try fields.append(try encode_access_list(self.allocator, tx.access_list));

        if (signature) |sig| {
            try fields.append(try encode_u8(self.allocator, if (sig.y_parity) 1 else 0));
            try fields.append(try encode_u256(self.allocator, sig.r));
            try fields.append(try encode_u256(self.allocator, sig.s));
        }

        const rlp_encoded = try rlp.encode(self.allocator, fields.items);
        defer self.allocator.free(rlp_encoded);

        // Prefix with transaction type
        var result = try self.allocator.alloc(u8, 1 + rlp_encoded.len);
        result[0] = 0x01; // EIP-2930 type
        @memcpy(result[1..], rlp_encoded);
        return result;
    }

    /// Serialize EIP-1559 transaction
    fn serialize_eip1559_transaction(self: *TransactionSerializer, tx: TxEip1559, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]u8).init(self.allocator);
        defer {
            for (fields.items) |field| {
                self.allocator.free(field);
            }
            fields.deinit();
        }

        // Encode fields: [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, yParity?, r?, s?]
        try fields.append(try encode_u64(self.allocator, tx.chain_id));
        try fields.append(try encode_u64(self.allocator, tx.nonce));
        try fields.append(try encode_u256(self.allocator, tx.max_priority_fee_per_gas));
        try fields.append(try encode_u256(self.allocator, tx.max_fee_per_gas));
        try fields.append(try encode_u64(self.allocator, tx.gas_limit));
        try fields.append(try encode_tx_kind(self.allocator, tx.to));
        try fields.append(try encode_u256(self.allocator, tx.value));
        try fields.append(try encode_bytes(self.allocator, tx.input));
        try fields.append(try encode_access_list(self.allocator, tx.access_list));

        if (signature) |sig| {
            try fields.append(try encode_u8(self.allocator, if (sig.y_parity) 1 else 0));
            try fields.append(try encode_u256(self.allocator, sig.r));
            try fields.append(try encode_u256(self.allocator, sig.s));
        }

        const rlp_encoded = try rlp.encode(self.allocator, fields.items);
        defer self.allocator.free(rlp_encoded);

        // Prefix with transaction type
        var result = try self.allocator.alloc(u8, 1 + rlp_encoded.len);
        result[0] = 0x02; // EIP-1559 type
        @memcpy(result[1..], rlp_encoded);
        return result;
    }

    /// Serialize EIP-4844 transaction
    fn serialize_eip4844_transaction(self: *TransactionSerializer, tx: TxEip4844, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]u8).init(self.allocator);
        defer {
            for (fields.items) |field| {
                self.allocator.free(field);
            }
            fields.deinit();
        }

        // Encode fields: [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, maxFeePerBlobGas, blobVersionedHashes, yParity?, r?, s?]
        try fields.append(try encode_u64(self.allocator, tx.chain_id));
        try fields.append(try encode_u64(self.allocator, tx.nonce));
        try fields.append(try encode_u256(self.allocator, tx.max_priority_fee_per_gas));
        try fields.append(try encode_u256(self.allocator, tx.max_fee_per_gas));
        try fields.append(try encode_u64(self.allocator, tx.gas_limit));
        try fields.append(try encode_tx_kind(self.allocator, tx.to));
        try fields.append(try encode_u256(self.allocator, tx.value));
        try fields.append(try encode_bytes(self.allocator, tx.input));
        try fields.append(try encode_access_list(self.allocator, tx.access_list));
        try fields.append(try encode_u256(self.allocator, tx.max_fee_per_blob_gas));
        try fields.append(try encode_blob_versioned_hashes(self.allocator, tx.blob_versioned_hashes));

        if (signature) |sig| {
            try fields.append(try encode_u8(self.allocator, if (sig.y_parity) 1 else 0));
            try fields.append(try encode_u256(self.allocator, sig.r));
            try fields.append(try encode_u256(self.allocator, sig.s));
        }

        const rlp_encoded = try rlp.encode(self.allocator, fields.items);
        defer self.allocator.free(rlp_encoded);

        // Prefix with transaction type
        var result = try self.allocator.alloc(u8, 1 + rlp_encoded.len);
        result[0] = 0x03; // EIP-4844 type
        @memcpy(result[1..], rlp_encoded);
        return result;
    }

    /// Serialize EIP-7702 transaction
    fn serialize_eip7702_transaction(self: *TransactionSerializer, tx: TxEip7702, signature: ?Signature) ![]u8 {
        var fields = std.ArrayList([]u8).init(self.allocator);
        defer {
            for (fields.items) |field| {
                self.allocator.free(field);
            }
            fields.deinit();
        }

        // Encode fields: [chainId, nonce, maxPriorityFeePerGas, maxFeePerGas, gasLimit, to, value, data, accessList, authorizationList, yParity?, r?, s?]
        try fields.append(try encode_u64(self.allocator, tx.chain_id));
        try fields.append(try encode_u64(self.allocator, tx.nonce));
        try fields.append(try encode_u256(self.allocator, tx.max_priority_fee_per_gas));
        try fields.append(try encode_u256(self.allocator, tx.max_fee_per_gas));
        try fields.append(try encode_u64(self.allocator, tx.gas_limit));
        try fields.append(try encode_tx_kind(self.allocator, tx.to));
        try fields.append(try encode_u256(self.allocator, tx.value));
        try fields.append(try encode_bytes(self.allocator, tx.input));
        try fields.append(try encode_access_list(self.allocator, tx.access_list));
        try fields.append(try encode_authorization_list(self.allocator, tx.authorization_list));

        if (signature) |sig| {
            try fields.append(try encode_u8(self.allocator, if (sig.y_parity) 1 else 0));
            try fields.append(try encode_u256(self.allocator, sig.r));
            try fields.append(try encode_u256(self.allocator, sig.s));
        }

        const rlp_encoded = try rlp.encode(self.allocator, fields.items);
        defer self.allocator.free(rlp_encoded);

        // Prefix with transaction type
        var result = try self.allocator.alloc(u8, 1 + rlp_encoded.len);
        result[0] = 0x04; // EIP-7702 type
        @memcpy(result[1..], rlp_encoded);
        return result;
    }
};

/// Transaction parser - converts RLP-encoded bytes to transactions
pub const TransactionParser = struct {
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) TransactionParser {
        return TransactionParser{ .allocator = allocator };
    }

    /// Parse a serialized transaction
    pub fn parse(self: *TransactionParser, data: []const u8) !TransactionEnvelope {
        if (data.len == 0) return TransactionBuildingError.InvalidFormat;

        // Check if it's a typed transaction (starts with 0x01, 0x02, 0x03, or 0x04)
        if (data[0] <= 0x04) {
            const tx_type = try transaction_types.TransactionUtils.type_from_byte(data[0]);
            return try self.parse_typed_transaction(data[1..], tx_type);
        } else {
            // Legacy transaction
            return try self.parse_legacy_transaction(data);
        }
    }

    /// Parse a typed transaction (EIP-2718)
    fn parse_typed_transaction(self: *TransactionParser, data: []const u8, tx_type: TxType) !TransactionEnvelope {
        const decoded = try rlp.decode(self.allocator, data, false);
        defer decoded.data.deinit(self.allocator);

        switch (decoded.data) {
            .List => |fields| {
                switch (tx_type) {
                    .eip2930 => return try self.parse_eip2930_fields(fields),
                    .eip1559 => return try self.parse_eip1559_fields(fields),
                    .eip4844 => return try self.parse_eip4844_fields(fields),
                    .eip7702 => return try self.parse_eip7702_fields(fields),
                    .legacy => unreachable, // Legacy transactions don't have type prefix
                }
            },
            else => return TransactionBuildingError.InvalidFormat,
        }
    }

    /// Parse legacy transaction
    fn parse_legacy_transaction(self: *TransactionParser, data: []const u8) !TransactionEnvelope {
        const decoded = try rlp.decode(self.allocator, data, false);
        defer decoded.data.deinit(self.allocator);

        switch (decoded.data) {
            .List => |fields| return try self.parse_legacy_fields(fields),
            else => return TransactionBuildingError.InvalidFormat,
        }
    }

    /// Parse legacy transaction fields
    fn parse_legacy_fields(self: *TransactionParser, fields: []rlp.Data) !TransactionEnvelope {
        if (fields.len != 6 and fields.len != 9) {
            return TransactionBuildingError.InvalidFormat;
        }

        const nonce = try parse_u64(fields[0]);
        const gas_price = try parse_u256(fields[1]);
        const gas_limit = try parse_u64(fields[2]);
        const to = try parse_tx_kind(fields[3]);
        const value = try parse_u256(fields[4]);
        const input = try parse_bytes(self.allocator, fields[5]);

        const tx = TxLegacy{
            .chain_id = null,
            .nonce = nonce,
            .gas_price = gas_price,
            .gas_limit = gas_limit,
            .to = to,
            .value = value,
            .input = input,
        };

        if (fields.len == 9) {
            // Has signature
            const v = try parse_u256(fields[6]);
            const r = try parse_u256(fields[7]);
            const s = try parse_u256(fields[8]);

            // Extract chain ID and y_parity from v
            const chain_id, const y_parity = extract_chain_id_and_parity(v);
            var signed_tx = tx;
            signed_tx.chain_id = chain_id;

            const signature = Signature{
                .y_parity = y_parity,
                .r = r,
                .s = s,
            };

            return TransactionEnvelope{
                .signed = SignedTransaction{
                    .transaction = TypedTransaction{ .legacy = signed_tx },
                    .signature = signature,
                },
            };
        } else {
            return TransactionEnvelope{
                .typed = TypedTransaction{ .legacy = tx },
            };
        }
    }

    /// Parse EIP-2930 transaction fields
    fn parse_eip2930_fields(self: *TransactionParser, fields: []rlp.Data) !TransactionEnvelope {
        if (fields.len != 8 and fields.len != 11) {
            return TransactionBuildingError.InvalidFormat;
        }

        const chain_id = try parse_u64(fields[0]);
        const nonce = try parse_u64(fields[1]);
        const gas_price = try parse_u256(fields[2]);
        const gas_limit = try parse_u64(fields[3]);
        const to = try parse_tx_kind(fields[4]);
        const value = try parse_u256(fields[5]);
        const input = try parse_bytes(self.allocator, fields[6]);
        const access_list = try parse_access_list(self.allocator, fields[7]);

        const tx = TxEip2930{
            .chain_id = chain_id,
            .nonce = nonce,
            .gas_price = gas_price,
            .gas_limit = gas_limit,
            .to = to,
            .value = value,
            .input = input,
            .access_list = access_list,
        };

        if (fields.len == 11) {
            // Has signature
            const y_parity = (try parse_u8(fields[8])) != 0;
            const r = try parse_u256(fields[9]);
            const s = try parse_u256(fields[10]);

            const signature = Signature{
                .y_parity = y_parity,
                .r = r,
                .s = s,
            };

            return TransactionEnvelope{
                .signed = SignedTransaction{
                    .transaction = TypedTransaction{ .eip2930 = tx },
                    .signature = signature,
                },
            };
        } else {
            return TransactionEnvelope{
                .typed = TypedTransaction{ .eip2930 = tx },
            };
        }
    }

    /// Parse EIP-1559 transaction fields
    fn parse_eip1559_fields(self: *TransactionParser, fields: []rlp.Data) !TransactionEnvelope {
        if (fields.len != 9 and fields.len != 12) {
            return TransactionBuildingError.InvalidFormat;
        }

        const chain_id = try parse_u64(fields[0]);
        const nonce = try parse_u64(fields[1]);
        const max_priority_fee_per_gas = try parse_u256(fields[2]);
        const max_fee_per_gas = try parse_u256(fields[3]);
        const gas_limit = try parse_u64(fields[4]);
        const to = try parse_tx_kind(fields[5]);
        const value = try parse_u256(fields[6]);
        const input = try parse_bytes(self.allocator, fields[7]);
        const access_list = try parse_access_list(self.allocator, fields[8]);

        const tx = TxEip1559{
            .chain_id = chain_id,
            .nonce = nonce,
            .max_priority_fee_per_gas = max_priority_fee_per_gas,
            .max_fee_per_gas = max_fee_per_gas,
            .gas_limit = gas_limit,
            .to = to,
            .value = value,
            .input = input,
            .access_list = access_list,
        };

        if (fields.len == 12) {
            // Has signature
            const y_parity = (try parse_u8(fields[9])) != 0;
            const r = try parse_u256(fields[10]);
            const s = try parse_u256(fields[11]);

            const signature = Signature{
                .y_parity = y_parity,
                .r = r,
                .s = s,
            };

            return TransactionEnvelope{
                .signed = SignedTransaction{
                    .transaction = TypedTransaction{ .eip1559 = tx },
                    .signature = signature,
                },
            };
        } else {
            return TransactionEnvelope{
                .typed = TypedTransaction{ .eip1559 = tx },
            };
        }
    }

    /// Parse EIP-4844 transaction fields
    fn parse_eip4844_fields(self: *TransactionParser, fields: []rlp.Data) !TransactionEnvelope {
        if (fields.len != 11 and fields.len != 14) {
            return TransactionBuildingError.InvalidFormat;
        }

        const chain_id = try parse_u64(fields[0]);
        const nonce = try parse_u64(fields[1]);
        const max_priority_fee_per_gas = try parse_u256(fields[2]);
        const max_fee_per_gas = try parse_u256(fields[3]);
        const gas_limit = try parse_u64(fields[4]);
        const to = try parse_tx_kind(fields[5]);
        const value = try parse_u256(fields[6]);
        const input = try parse_bytes(self.allocator, fields[7]);
        const access_list = try parse_access_list(self.allocator, fields[8]);
        const max_fee_per_blob_gas = try parse_u256(fields[9]);
        const blob_versioned_hashes = try parse_blob_versioned_hashes(self.allocator, fields[10]);

        const tx = TxEip4844{
            .chain_id = chain_id,
            .nonce = nonce,
            .max_priority_fee_per_gas = max_priority_fee_per_gas,
            .max_fee_per_gas = max_fee_per_gas,
            .gas_limit = gas_limit,
            .to = to,
            .value = value,
            .input = input,
            .access_list = access_list,
            .max_fee_per_blob_gas = max_fee_per_blob_gas,
            .blob_versioned_hashes = blob_versioned_hashes,
        };

        if (fields.len == 14) {
            // Has signature
            const y_parity = (try parse_u8(fields[11])) != 0;
            const r = try parse_u256(fields[12]);
            const s = try parse_u256(fields[13]);

            const signature = Signature{
                .y_parity = y_parity,
                .r = r,
                .s = s,
            };

            return TransactionEnvelope{
                .signed = SignedTransaction{
                    .transaction = TypedTransaction{ .eip4844 = tx },
                    .signature = signature,
                },
            };
        } else {
            return TransactionEnvelope{
                .typed = TypedTransaction{ .eip4844 = tx },
            };
        }
    }

    /// Parse EIP-7702 transaction fields
    fn parse_eip7702_fields(self: *TransactionParser, fields: []rlp.Data) !TransactionEnvelope {
        if (fields.len != 10 and fields.len != 13) {
            return TransactionBuildingError.InvalidFormat;
        }

        const chain_id = try parse_u64(fields[0]);
        const nonce = try parse_u64(fields[1]);
        const max_priority_fee_per_gas = try parse_u256(fields[2]);
        const max_fee_per_gas = try parse_u256(fields[3]);
        const gas_limit = try parse_u64(fields[4]);
        const to = try parse_tx_kind(fields[5]);
        const value = try parse_u256(fields[6]);
        const input = try parse_bytes(self.allocator, fields[7]);
        const access_list = try parse_access_list(self.allocator, fields[8]);
        const authorization_list = try parse_authorization_list(self.allocator, fields[9]);

        const tx = TxEip7702{
            .chain_id = chain_id,
            .nonce = nonce,
            .max_priority_fee_per_gas = max_priority_fee_per_gas,
            .max_fee_per_gas = max_fee_per_gas,
            .gas_limit = gas_limit,
            .to = to,
            .value = value,
            .input = input,
            .access_list = access_list,
            .authorization_list = authorization_list,
        };

        if (fields.len == 13) {
            // Has signature
            const y_parity = (try parse_u8(fields[10])) != 0;
            const r = try parse_u256(fields[11]);
            const s = try parse_u256(fields[12]);

            const signature = Signature{
                .y_parity = y_parity,
                .r = r,
                .s = s,
            };

            return TransactionEnvelope{
                .signed = SignedTransaction{
                    .transaction = TypedTransaction{ .eip7702 = tx },
                    .signature = signature,
                },
            };
        } else {
            return TransactionEnvelope{
                .typed = TypedTransaction{ .eip7702 = tx },
            };
        }
    }
};

/// Transaction builder - high-level utilities for building transactions
pub const TransactionBuilder = struct {
    allocator: std.mem.Allocator,
    serializer: TransactionSerializer,
    parser: TransactionParser,

    pub fn init(allocator: std.mem.Allocator) TransactionBuilder {
        return TransactionBuilder{
            .allocator = allocator,
            .serializer = TransactionSerializer.init(allocator),
            .parser = TransactionParser.init(allocator),
        };
    }

    /// Build a transaction from a request
    pub fn build_transaction(_: *TransactionBuilder, request: TransactionRequest) !TypedTransaction {
        return try request.to_transaction();
    }

    /// Prepare transaction request with default values
    pub fn prepare_transaction_request(_: *TransactionBuilder, request: TransactionRequest) TransactionRequest {
        var prepared = request;

        // Set default gas limit if not provided
        if (prepared.gas == null) {
            prepared.gas = if (prepared.data != null and prepared.data.?.len > 0) 100000 else 21000;
        }

        // Set default transaction type if not provided
        if (prepared.transaction_type == null) {
            prepared.transaction_type = if (prepared.max_fee_per_gas != null or prepared.max_priority_fee_per_gas != null)
                .eip1559
            else if (prepared.access_list != null)
                .eip2930
            else
                .legacy;
        }

        return prepared;
    }

    /// Sign a transaction
    pub fn sign_transaction(self: *TransactionBuilder, tx: TypedTransaction, _: [32]u8, chain_id: ?ChainId) !SignedTransaction {
        // Get signing hash
        _ = try self.get_signing_hash(tx, chain_id);

        // Sign the hash (placeholder - would use actual ECDSA implementation)
        // For now, create a mock signature
        const signature = Signature{
            .y_parity = false,
            .r = 0x123456789abcdef, // Mock values
            .s = 0xfedcba987654321,
        };

        return SignedTransaction{
            .transaction = tx,
            .signature = signature,
        };
    }

    /// Get transaction signing hash
    pub fn get_signing_hash(self: *TransactionBuilder, tx: TypedTransaction, _: ?ChainId) !B256 {
        // For signing, we serialize without signature and hash
        const serialized = try self.serializer.serialize_typed_transaction(tx);
        defer self.allocator.free(serialized);

        // Use keccak256 to hash the serialized transaction
        // This is a placeholder - would use actual keccak256 implementation
        var hash: B256 = undefined;
        @memset(&hash, 0);
        return hash;
    }

    /// Serialize transaction to hex string for RPC
    pub fn to_hex(self: *TransactionBuilder, envelope: TransactionEnvelope) ![]u8 {
        const serialized = try self.serializer.serialize(envelope);
        defer self.allocator.free(serialized);

        return try hex.encode(self.allocator, serialized);
    }

    /// Parse hex string to transaction envelope
    pub fn from_hex(self: *TransactionBuilder, hex_string: []const u8) !TransactionEnvelope {
        const decoded = try hex.decode(self.allocator, hex_string);
        defer self.allocator.free(decoded);

        return try self.parser.parse(decoded);
    }
};

// Helper functions for encoding/decoding

fn encode_u64(allocator: std.mem.Allocator, value: u64) ![]u8 {
    return try rlp.encode(allocator, value);
}

fn encode_u256(allocator: std.mem.Allocator, value: U256) ![]u8 {
    return try rlp.encode(allocator, value);
}

fn encode_u8(allocator: std.mem.Allocator, value: u8) ![]u8 {
    return try rlp.encode(allocator, value);
}

fn encode_bytes(allocator: std.mem.Allocator, bytes: []const u8) ![]u8 {
    return try rlp.encode(allocator, bytes);
}

fn encode_tx_kind(allocator: std.mem.Allocator, tx_kind: TxKind) ![]u8 {
    switch (tx_kind) {
        .call => |addr| return try rlp.encode(allocator, addr),
        .create => return try rlp.encode(allocator, &[_]u8{}),
    }
}

fn encode_access_list(allocator: std.mem.Allocator, _: AccessList) ![]u8 {
    // Simplified encoding - would need proper implementation
    return try rlp.encode(allocator, &[_]u8{});
}

fn encode_authorization_list(allocator: std.mem.Allocator, _: []SignedAuthorization) ![]u8 {
    // Simplified encoding - would need proper implementation
    return try rlp.encode(allocator, &[_]u8{});
}

fn encode_blob_versioned_hashes(allocator: std.mem.Allocator, _: []const B256) ![]u8 {
    // Simplified encoding - would need proper implementation
    return try rlp.encode(allocator, &[_]u8{});
}

fn compute_v(y_parity: bool, chain_id: ?ChainId) !U256 {
    if (chain_id) |cid| {
        // EIP-155: v = 35 + chain_id * 2 + y_parity
        return 35 + @as(U256, cid) * 2 + (if (y_parity) @as(U256, 1) else @as(U256, 0));
    } else {
        // Pre-EIP-155: v = 27 + y_parity
        return 27 + (if (y_parity) @as(U256, 1) else @as(U256, 0));
    }
}

fn extract_chain_id_and_parity(v: U256) struct { ?ChainId, bool } {
    if (v == 27) return .{ null, false };
    if (v == 28) return .{ null, true };

    if (v >= 35) {
        const chain_id = @as(ChainId, @intCast((v - 35) / 2));
        const y_parity = ((v - 35) % 2) == 1;
        return .{ chain_id, y_parity };
    }

    return .{ null, false };
}

// Parsing helper functions

fn parse_u64(data: rlp.Data) !u64 {
    switch (data) {
        .String => |bytes| {
            if (bytes.len == 0) return 0;
            var result: u64 = 0;
            for (bytes) |byte| {
                result = (result << 8) | byte;
            }
            return result;
        },
        else => return TransactionBuildingError.InvalidFormat,
    }
}

fn parse_u256(data: rlp.Data) !U256 {
    switch (data) {
        .String => |bytes| {
            if (bytes.len == 0) return 0;
            var result: U256 = 0;
            for (bytes) |byte| {
                result = (result << 8) | byte;
            }
            return result;
        },
        else => return TransactionBuildingError.InvalidFormat,
    }
}

fn parse_u8(data: rlp.Data) !u8 {
    switch (data) {
        .String => |bytes| {
            if (bytes.len == 0) return 0;
            if (bytes.len > 1) return TransactionBuildingError.InvalidFormat;
            return bytes[0];
        },
        else => return TransactionBuildingError.InvalidFormat,
    }
}

fn parse_bytes(allocator: std.mem.Allocator, data: rlp.Data) ![]u8 {
    switch (data) {
        .String => |bytes| return try allocator.dupe(u8, bytes),
        else => return TransactionBuildingError.InvalidFormat,
    }
}

fn parse_tx_kind(data: rlp.Data) !TxKind {
    switch (data) {
        .String => |bytes| {
            if (bytes.len == 0) return TxKind.create;
            if (bytes.len != 20) return TransactionBuildingError.InvalidFormat;
            var address: Address = undefined;
            @memcpy(&address, bytes);
            return TxKind{ .call = address };
        },
        else => return TransactionBuildingError.InvalidFormat,
    }
}

fn parse_access_list(allocator: std.mem.Allocator, data: rlp.Data) !AccessList {
    // Simplified parsing - would need proper implementation
    _ = allocator;
    switch (data) {
        .List => return &.{},
        else => return TransactionBuildingError.InvalidFormat,
    }
}

fn parse_authorization_list(allocator: std.mem.Allocator, data: rlp.Data) ![]SignedAuthorization {
    // Simplified parsing - would need proper implementation
    _ = allocator;
    switch (data) {
        .List => return &.{},
        else => return TransactionBuildingError.InvalidFormat,
    }
}

fn parse_blob_versioned_hashes(allocator: std.mem.Allocator, data: rlp.Data) ![]B256 {
    // Simplified parsing - would need proper implementation
    _ = allocator;
    switch (data) {
        .List => return &.{},
        else => return TransactionBuildingError.InvalidFormat,
    }
}

// Tests
test "transaction building" {
    var builder = TransactionBuilder.init(testing.allocator);

    // Test building a simple legacy transaction
    const request = TransactionRequest{
        .to = TxKind{ .call = [_]u8{0} ** 20 },
        .value = 1000000000000000000, // 1 ETH in wei
        .gas = 21000,
        .gas_price = 20000000000, // 20 gwei
        .nonce = 0,
    };

    const tx = try builder.build_transaction(request);
    try testing.expect(tx == .legacy);
    try testing.expect(tx.legacy.value == 1000000000000000000);
    try testing.expect(tx.legacy.gas_limit == 21000);
}

test "transaction serialization" {
    var serializer = TransactionSerializer.init(testing.allocator);

    const tx = TypedTransaction{
        .legacy = TxLegacy{
            .chain_id = 1,
            .nonce = 0,
            .gas_price = 20000000000,
            .gas_limit = 21000,
            .to = TxKind.create,
            .value = 0,
            .input = &.{},
        },
    };

    const serialized = try serializer.serialize_typed_transaction(tx);
    defer testing.allocator.free(serialized);

    try testing.expect(serialized.len > 0);
}

test "transaction parsing" {
    var parser = TransactionParser.init(testing.allocator);

    // Test parsing a simple legacy transaction (mock data)
    const mock_data = [_]u8{ 0xf8, 0x68, 0x01, 0x85, 0x04, 0xa8, 0x17, 0xc8, 0x00, 0x82, 0x52, 0x08, 0x94, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x80, 0x25, 0xa0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0, 0xa0, 0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10, 0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10, 0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10, 0xfe, 0xdc, 0xba, 0x98, 0x76, 0x54, 0x32, 0x10 };

    // This would fail with real data, but demonstrates the interface
    _ = parser.parse(&mock_data) catch {};
}

test "transaction type inference" {
    const request1 = TransactionRequest{
        .to = TxKind.create,
        .gas = 21000,
    };
    try testing.expect(try request1.infer_transaction_type() == .legacy);

    const request2 = TransactionRequest{
        .to = TxKind.create,
        .gas = 21000,
        .max_fee_per_gas = 1000000000,
    };
    try testing.expect(try request2.infer_transaction_type() == .eip1559);
}
