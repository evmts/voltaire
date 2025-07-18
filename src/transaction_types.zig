const std = @import("std");

/// Chain ID type
pub const ChainId = u64;

/// 256-bit unsigned integer type
pub const U256 = u256;

/// Ethereum address (20 bytes)
pub const Address = [20]u8;

/// 256-bit hash (32 bytes)
pub const B256 = [32]u8;

/// Dynamic byte array
pub const Bytes = []u8;

/// Transaction type enumeration based on EIP-2718
pub const TxType = enum(u8) {
    legacy = 0x00,
    eip2930 = 0x01,
    eip1559 = 0x02,
    eip4844 = 0x03,
    eip7702 = 0x04,
};

/// Transaction destination - either an address or contract creation
pub const TxKind = union(enum) {
    call: Address,
    create,

    pub fn is_create(self: TxKind) bool {
        return switch (self) {
            .create => true,
            .call => false,
        };
    }
};

/// Access list item for EIP-2930
pub const AccessListItem = struct {
    address: Address,
    storage_keys: []B256,
};

/// Access list for EIP-2930+ transactions
pub const AccessList = []AccessListItem;

/// Signed authorization for EIP-7702
pub const SignedAuthorization = struct {
    chain_id: ChainId,
    address: Address,
    nonce: ?u64, // Optional nonce
    y_parity: u8,
    r: U256,
    s: U256,
};

/// Legacy transaction (Type 0x00)
/// Pre-EIP-2718 transaction format
pub const TxLegacy = struct {
    /// EIP-155 chain ID (optional for pre-EIP-155 transactions)
    chain_id: ?ChainId,
    /// Transaction nonce
    nonce: u64,
    /// Gas price in wei
    gas_price: u128,
    /// Gas limit
    gas_limit: u64,
    /// Transaction recipient or contract creation
    to: TxKind,
    /// Value transferred in wei
    value: U256,
    /// Transaction input data
    input: Bytes,

    pub const TX_TYPE: u8 = 0x00;

    pub fn tx_type(self: TxLegacy) TxType {
        _ = self;
        return .legacy;
    }

    pub fn is_create(self: TxLegacy) bool {
        return self.to.is_create();
    }
};

/// EIP-2930 transaction (Type 0x01)
/// Transaction with access list
pub const TxEip2930 = struct {
    /// EIP-155 chain ID
    chain_id: ChainId,
    /// Transaction nonce
    nonce: u64,
    /// Gas price in wei
    gas_price: u128,
    /// Gas limit
    gas_limit: u64,
    /// Transaction recipient or contract creation
    to: TxKind,
    /// Value transferred in wei
    value: U256,
    /// Access list specifying addresses and storage keys
    access_list: AccessList,
    /// Transaction input data
    input: Bytes,

    pub const TX_TYPE: u8 = 0x01;

    pub fn tx_type(self: TxEip2930) TxType {
        _ = self;
        return .eip2930;
    }

    pub fn is_create(self: TxEip2930) bool {
        return self.to.is_create();
    }
};

/// EIP-1559 transaction (Type 0x02)
/// Fee market transaction with priority fee
pub const TxEip1559 = struct {
    /// EIP-155 chain ID
    chain_id: ChainId,
    /// Transaction nonce
    nonce: u64,
    /// Gas limit
    gas_limit: u64,
    /// Maximum fee per gas (Gas Fee Cap)
    max_fee_per_gas: u128,
    /// Maximum priority fee per gas (Gas Tip Cap)
    max_priority_fee_per_gas: u128,
    /// Transaction recipient or contract creation
    to: TxKind,
    /// Value transferred in wei
    value: U256,
    /// Access list specifying addresses and storage keys
    access_list: AccessList,
    /// Transaction input data
    input: Bytes,

    pub const TX_TYPE: u8 = 0x02;

    pub fn tx_type(self: TxEip1559) TxType {
        _ = self;
        return .eip1559;
    }

    pub fn is_create(self: TxEip1559) bool {
        return self.to.is_create();
    }

    pub fn is_dynamic_fee(self: TxEip1559) bool {
        _ = self;
        return true;
    }
};

/// EIP-4844 transaction (Type 0x03)
/// Blob transaction with blob gas fee
pub const TxEip4844 = struct {
    /// EIP-155 chain ID
    chain_id: ChainId,
    /// Transaction nonce
    nonce: u64,
    /// Gas limit
    gas_limit: u64,
    /// Maximum fee per gas (Gas Fee Cap)
    max_fee_per_gas: u128,
    /// Maximum priority fee per gas (Gas Tip Cap)
    max_priority_fee_per_gas: u128,
    /// Transaction recipient (must be address, not create)
    to: Address,
    /// Value transferred in wei
    value: U256,
    /// Access list specifying addresses and storage keys
    access_list: AccessList,
    /// Versioned hashes of blob data
    blob_versioned_hashes: []B256,
    /// Maximum fee per blob gas (Blob Gas Fee Cap)
    max_fee_per_blob_gas: u128,
    /// Transaction input data
    input: Bytes,

    pub const TX_TYPE: u8 = 0x03;

    pub fn tx_type(self: TxEip4844) TxType {
        _ = self;
        return .eip4844;
    }

    pub fn is_create(self: TxEip4844) bool {
        _ = self;
        return false; // EIP-4844 transactions cannot create contracts
    }

    pub fn is_dynamic_fee(self: TxEip4844) bool {
        _ = self;
        return true;
    }

    /// Calculate total blob gas for this transaction
    pub fn blob_gas(self: TxEip4844) u64 {
        const DATA_GAS_PER_BLOB: u64 = 131072; // From EIP-4844
        return @as(u64, @intCast(self.blob_versioned_hashes.len)) * DATA_GAS_PER_BLOB;
    }
};

/// EIP-7702 transaction (Type 0x04)
/// Authorization transaction for account abstraction
pub const TxEip7702 = struct {
    /// EIP-155 chain ID
    chain_id: ChainId,
    /// Transaction nonce
    nonce: u64,
    /// Gas limit
    gas_limit: u64,
    /// Maximum fee per gas (Gas Fee Cap)
    max_fee_per_gas: u128,
    /// Maximum priority fee per gas (Gas Tip Cap)
    max_priority_fee_per_gas: u128,
    /// Transaction recipient (must be address)
    to: Address,
    /// Value transferred in wei
    value: U256,
    /// Access list specifying addresses and storage keys
    access_list: AccessList,
    /// List of signed authorizations
    authorization_list: []SignedAuthorization,
    /// Transaction input data
    input: Bytes,

    pub const TX_TYPE: u8 = 0x04;

    pub fn tx_type(self: TxEip7702) TxType {
        _ = self;
        return .eip7702;
    }

    pub fn is_create(self: TxEip7702) bool {
        _ = self;
        return false; // EIP-7702 transactions cannot create contracts
    }

    pub fn is_dynamic_fee(self: TxEip7702) bool {
        _ = self;
        return true;
    }
};

/// Union type representing all possible transaction types
pub const TypedTransaction = union(TxType) {
    legacy: TxLegacy,
    eip2930: TxEip2930,
    eip1559: TxEip1559,
    eip4844: TxEip4844,
    eip7702: TxEip7702,

    /// Get the transaction type
    pub fn tx_type(self: TypedTransaction) TxType {
        return switch (self) {
            .legacy => .legacy,
            .eip2930 => .eip2930,
            .eip1559 => .eip1559,
            .eip4844 => .eip4844,
            .eip7702 => .eip7702,
        };
    }

    /// Get the transaction type as a byte
    pub fn tx_type_byte(self: TypedTransaction) u8 {
        return @intFromEnum(self.tx_type());
    }

    /// Check if transaction creates a contract
    pub fn is_create(self: TypedTransaction) bool {
        return switch (self) {
            .legacy => |tx| tx.isCreate(),
            .eip2930 => |tx| tx.isCreate(),
            .eip1559 => |tx| tx.isCreate(),
            .eip4844 => |tx| tx.isCreate(),
            .eip7702 => |tx| tx.isCreate(),
        };
    }

    /// Check if transaction uses dynamic fees
    pub fn is_dynamic_fee(self: TypedTransaction) bool {
        return switch (self) {
            .legacy => false,
            .eip2930 => false,
            .eip1559 => true,
            .eip4844 => true,
            .eip7702 => true,
        };
    }

    /// Get the chain ID
    pub fn chain_id(self: TypedTransaction) ?ChainId {
        return switch (self) {
            .legacy => |tx| tx.chain_id,
            .eip2930 => |tx| tx.chain_id,
            .eip1559 => |tx| tx.chain_id,
            .eip4844 => |tx| tx.chain_id,
            .eip7702 => |tx| tx.chain_id,
        };
    }

    /// Get the nonce
    pub fn nonce(self: TypedTransaction) u64 {
        return switch (self) {
            .legacy => |tx| tx.nonce,
            .eip2930 => |tx| tx.nonce,
            .eip1559 => |tx| tx.nonce,
            .eip4844 => |tx| tx.nonce,
            .eip7702 => |tx| tx.nonce,
        };
    }

    /// Get the gas limit
    pub fn gas_limit(self: TypedTransaction) u64 {
        return switch (self) {
            .legacy => |tx| tx.gas_limit,
            .eip2930 => |tx| tx.gas_limit,
            .eip1559 => |tx| tx.gas_limit,
            .eip4844 => |tx| tx.gas_limit,
            .eip7702 => |tx| tx.gas_limit,
        };
    }

    /// Get the value
    pub fn value(self: TypedTransaction) U256 {
        return switch (self) {
            .legacy => |tx| tx.value,
            .eip2930 => |tx| tx.value,
            .eip1559 => |tx| tx.value,
            .eip4844 => |tx| tx.value,
            .eip7702 => |tx| tx.value,
        };
    }

    /// Get the input data
    pub fn input(self: TypedTransaction) Bytes {
        return switch (self) {
            .legacy => |tx| tx.input,
            .eip2930 => |tx| tx.input,
            .eip1559 => |tx| tx.input,
            .eip4844 => |tx| tx.input,
            .eip7702 => |tx| tx.input,
        };
    }

    /// Get the access list (if available)
    pub fn access_list(self: TypedTransaction) ?AccessList {
        return switch (self) {
            .legacy => null,
            .eip2930 => |tx| tx.access_list,
            .eip1559 => |tx| tx.access_list,
            .eip4844 => |tx| tx.access_list,
            .eip7702 => |tx| tx.access_list,
        };
    }

    /// Get the max fee per gas
    pub fn max_fee_per_gas(self: TypedTransaction) u128 {
        return switch (self) {
            .legacy => |tx| tx.gas_price,
            .eip2930 => |tx| tx.gas_price,
            .eip1559 => |tx| tx.max_fee_per_gas,
            .eip4844 => |tx| tx.max_fee_per_gas,
            .eip7702 => |tx| tx.max_fee_per_gas,
        };
    }

    /// Get the max priority fee per gas (if available)
    pub fn max_priority_fee_per_gas(self: TypedTransaction) ?u128 {
        return switch (self) {
            .legacy => null,
            .eip2930 => null,
            .eip1559 => |tx| tx.max_priority_fee_per_gas,
            .eip4844 => |tx| tx.max_priority_fee_per_gas,
            .eip7702 => |tx| tx.max_priority_fee_per_gas,
        };
    }

    /// Get the max fee per blob gas (if available)
    pub fn max_fee_per_blob_gas(self: TypedTransaction) ?u128 {
        return switch (self) {
            .legacy => null,
            .eip2930 => null,
            .eip1559 => null,
            .eip4844 => |tx| tx.max_fee_per_blob_gas,
            .eip7702 => null,
        };
    }

    /// Get blob versioned hashes (if available)
    pub fn blob_versioned_hashes(self: TypedTransaction) ?[]B256 {
        return switch (self) {
            .legacy => null,
            .eip2930 => null,
            .eip1559 => null,
            .eip4844 => |tx| tx.blob_versioned_hashes,
            .eip7702 => null,
        };
    }

    /// Get authorization list (if available)
    pub fn authorization_list(self: TypedTransaction) ?[]SignedAuthorization {
        return switch (self) {
            .legacy => null,
            .eip2930 => null,
            .eip1559 => null,
            .eip4844 => null,
            .eip7702 => |tx| tx.authorization_list,
        };
    }
};

/// Transaction signature
pub const Signature = struct {
    /// Recovery ID (v value)
    v: u64,
    /// r component
    r: U256,
    /// s component
    s: U256,
    /// y parity (0 or 1)
    y_parity: u8,
};

/// Signed transaction envelope
pub const SignedTransaction = struct {
    transaction: TypedTransaction,
    signature: Signature,
    hash: B256,

    /// Recover the sender address from the signature
    pub fn recover_sender(self: SignedTransaction) !Address {
        // This would need cryptographic implementation
        // Placeholder for now
        _ = self;
        return error.NotImplemented;
    }
};

/// Transaction envelope containing either a typed transaction or signed transaction
pub const TransactionEnvelope = union(enum) {
    typed: TypedTransaction,
    signed: SignedTransaction,

    /// Get the underlying transaction
    pub fn transaction(self: TransactionEnvelope) TypedTransaction {
        return switch (self) {
            .typed => |tx| tx,
            .signed => |signed_tx| signed_tx.transaction,
        };
    }

    /// Check if the transaction is signed
    pub fn is_signed(self: TransactionEnvelope) bool {
        return switch (self) {
            .typed => false,
            .signed => true,
        };
    }
};

/// Utility functions for transaction type identification
pub const TransactionUtils = struct {
    /// Determine transaction type from type byte
    pub fn type_from_byte(type_byte: u8) !TxType {
        return switch (type_byte) {
            0x00 => .legacy,
            0x01 => .eip2930,
            0x02 => .eip1559,
            0x03 => .eip4844,
            0x04 => .eip7702,
            else => error.UnknownTransactionType,
        };
    }

    /// Check if a transaction type supports dynamic fees
    pub fn supports_dynamic_fees(tx_type: TxType) bool {
        return switch (tx_type) {
            .legacy, .eip2930 => false,
            .eip1559, .eip4844, .eip7702 => true,
        };
    }

    /// Check if a transaction type supports access lists
    pub fn supports_access_list(tx_type: TxType) bool {
        return switch (tx_type) {
            .legacy => false,
            .eip2930, .eip1559, .eip4844, .eip7702 => true,
        };
    }

    /// Check if a transaction type supports blobs
    pub fn supports_blobs(tx_type: TxType) bool {
        return switch (tx_type) {
            .eip4844 => true,
            else => false,
        };
    }

    /// Check if a transaction type supports authorizations
    pub fn supports_authorizations(tx_type: TxType) bool {
        return switch (tx_type) {
            .eip7702 => true,
            else => false,
        };
    }
};

// Test functions
test "transaction type identification" {
    const testing = std.testing;

    try testing.expect(try TransactionUtils.type_from_byte(0x00) == .legacy);
    try testing.expect(try TransactionUtils.type_from_byte(0x01) == .eip2930);
    try testing.expect(try TransactionUtils.type_from_byte(0x02) == .eip1559);
    try testing.expect(try TransactionUtils.type_from_byte(0x03) == .eip4844);
    try testing.expect(try TransactionUtils.type_from_byte(0x04) == .eip7702);
}

test "dynamic fee support" {
    const testing = std.testing;

    try testing.expect(!TransactionUtils.supports_dynamic_fees(.legacy));
    try testing.expect(!TransactionUtils.supports_dynamic_fees(.eip2930));
    try testing.expect(TransactionUtils.supports_dynamic_fees(.eip1559));
    try testing.expect(TransactionUtils.supports_dynamic_fees(.eip4844));
    try testing.expect(TransactionUtils.supports_dynamic_fees(.eip7702));
}

test "typed transaction creation" {
    const testing = std.testing;
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const legacy_tx = TxLegacy{
        .chain_id = 1,
        .nonce = 42,
        .gas_price = 20000000000,
        .gas_limit = 21000,
        .to = TxKind{ .call = [_]u8{0} ** 20 },
        .value = 1000000000000000000,
        .input = try allocator.alloc(u8, 0),
    };
    defer allocator.free(legacy_tx.input);

    const typed_tx = TypedTransaction{ .legacy = legacy_tx };

    try testing.expect(typed_tx.tx_type() == .legacy);
    try testing.expect(typed_tx.nonce() == 42);
    try testing.expect(typed_tx.gas_limit() == 21000);
    try testing.expect(!typed_tx.is_dynamic_fee());
}
