//! UserOperation - ERC-4337 Account Abstraction User Operation
//!
//! User operations enable account abstraction by separating transaction validation
//! from execution. Bundlers aggregate user operations and submit them to the
//! EntryPoint contract for execution.
//!
//! Supports ERC-4337 v0.6 format with fields for:
//! - sender: Smart account address
//! - nonce: Anti-replay protection
//! - initCode: Account deployment code
//! - callData: Execution calldata
//! - Gas limits and fee parameters
//! - paymasterAndData: Optional paymaster info
//! - signature: Account signature
//!
//! @see https://eips.ethereum.org/EIPS/eip-4337

const std = @import("std");
const Address = @import("../Address/address.zig");
const Hash = @import("../Hash/Hash.zig");
const Hex = @import("../Hex/Hex.zig");
const crypto = @import("crypto");

/// UserOperation struct per ERC-4337 v0.6
pub const UserOperation = struct {
    /// Smart account address initiating the operation
    sender: Address.Address,
    /// Anti-replay nonce (key + sequence)
    nonce: u256,
    /// Account factory and initialization code for first-time deployment
    init_code: []const u8,
    /// Calldata to execute on the account
    call_data: []const u8,
    /// Gas limit for the execution phase
    call_gas_limit: u256,
    /// Gas limit for the verification phase
    verification_gas_limit: u256,
    /// Fixed gas overhead for bundler compensation
    pre_verification_gas: u256,
    /// Maximum total fee per gas (EIP-1559)
    max_fee_per_gas: u256,
    /// Maximum priority fee per gas (EIP-1559)
    max_priority_fee_per_gas: u256,
    /// Paymaster address and data (empty if self-paying)
    paymaster_and_data: []const u8,
    /// Account signature over userOpHash
    signature: []const u8,

    const Self = @This();

    /// Create UserOperation from parameters
    pub fn from(params: struct {
        sender: Address.Address,
        nonce: u256 = 0,
        init_code: []const u8 = &[_]u8{},
        call_data: []const u8 = &[_]u8{},
        call_gas_limit: u256 = 0,
        verification_gas_limit: u256 = 0,
        pre_verification_gas: u256 = 0,
        max_fee_per_gas: u256 = 0,
        max_priority_fee_per_gas: u256 = 0,
        paymaster_and_data: []const u8 = &[_]u8{},
        signature: []const u8 = &[_]u8{},
    }) Self {
        return .{
            .sender = params.sender,
            .nonce = params.nonce,
            .init_code = params.init_code,
            .call_data = params.call_data,
            .call_gas_limit = params.call_gas_limit,
            .verification_gas_limit = params.verification_gas_limit,
            .pre_verification_gas = params.pre_verification_gas,
            .max_fee_per_gas = params.max_fee_per_gas,
            .max_priority_fee_per_gas = params.max_priority_fee_per_gas,
            .paymaster_and_data = params.paymaster_and_data,
            .signature = params.signature,
        };
    }

    /// Pack UserOperation fields for hashing (without signature)
    /// Returns packed bytes: sender || nonce || keccak256(initCode) || keccak256(callData) ||
    ///   callGasLimit || verificationGasLimit || preVerificationGas ||
    ///   maxFeePerGas || maxPriorityFeePerGas || keccak256(paymasterAndData)
    pub fn pack(self: *const Self, allocator: std.mem.Allocator) ![]u8 {
        // Total size: 20 (sender padded to 32) + 32*9 = 32*10 = 320 bytes
        const result = try allocator.alloc(u8, 320);
        errdefer allocator.free(result);

        var offset: usize = 0;

        // sender (address = 20 bytes, left-padded to 32)
        @memset(result[offset .. offset + 12], 0);
        @memcpy(result[offset + 12 .. offset + 32], &self.sender.bytes);
        offset += 32;

        // nonce (uint256)
        writeU256(result[offset .. offset + 32], self.nonce);
        offset += 32;

        // keccak256(initCode)
        var init_code_hash: [32]u8 = undefined;
        crypto.Keccak256.hash(self.init_code, &init_code_hash);
        @memcpy(result[offset .. offset + 32], &init_code_hash);
        offset += 32;

        // keccak256(callData)
        var call_data_hash: [32]u8 = undefined;
        crypto.Keccak256.hash(self.call_data, &call_data_hash);
        @memcpy(result[offset .. offset + 32], &call_data_hash);
        offset += 32;

        // callGasLimit
        writeU256(result[offset .. offset + 32], self.call_gas_limit);
        offset += 32;

        // verificationGasLimit
        writeU256(result[offset .. offset + 32], self.verification_gas_limit);
        offset += 32;

        // preVerificationGas
        writeU256(result[offset .. offset + 32], self.pre_verification_gas);
        offset += 32;

        // maxFeePerGas
        writeU256(result[offset .. offset + 32], self.max_fee_per_gas);
        offset += 32;

        // maxPriorityFeePerGas
        writeU256(result[offset .. offset + 32], self.max_priority_fee_per_gas);
        offset += 32;

        // keccak256(paymasterAndData)
        var paymaster_hash: [32]u8 = undefined;
        crypto.Keccak256.hash(self.paymaster_and_data, &paymaster_hash);
        @memcpy(result[offset .. offset + 32], &paymaster_hash);

        return result;
    }

    /// Compute userOpHash for signing
    /// userOpHash = keccak256(pack(userOp) || entryPoint || chainId)
    pub fn hash(self: *const Self, allocator: std.mem.Allocator, entry_point: Address.Address, chain_id: u256) ![32]u8 {
        // Pack the user operation
        const pack_result = try self.pack(allocator);
        defer allocator.free(pack_result);

        // Hash the pack_result user operation
        var user_op_hash: [32]u8 = undefined;
        crypto.Keccak256.hash(pack_result, &user_op_hash);

        // Pack with entryPoint and chainId: userOpHash || entryPoint || chainId
        // 32 + 20 + 32 = 84 bytes
        var final_data: [84]u8 = undefined;
        @memcpy(final_data[0..32], &user_op_hash);
        @memcpy(final_data[32..52], &entry_point.bytes);
        writeU256(final_data[52..84], chain_id);

        // Final hash
        var result: [32]u8 = undefined;
        crypto.Keccak256.hash(&final_data, &result);

        return result;
    }

    /// Check equality with another UserOperation
    pub fn equals(self: *const Self, other: *const Self) bool {
        if (!std.mem.eql(u8, &self.sender.bytes, &other.sender.bytes)) return false;
        if (self.nonce != other.nonce) return false;
        if (!std.mem.eql(u8, self.init_code, other.init_code)) return false;
        if (!std.mem.eql(u8, self.call_data, other.call_data)) return false;
        if (self.call_gas_limit != other.call_gas_limit) return false;
        if (self.verification_gas_limit != other.verification_gas_limit) return false;
        if (self.pre_verification_gas != other.pre_verification_gas) return false;
        if (self.max_fee_per_gas != other.max_fee_per_gas) return false;
        if (self.max_priority_fee_per_gas != other.max_priority_fee_per_gas) return false;
        if (!std.mem.eql(u8, self.paymaster_and_data, other.paymaster_and_data)) return false;
        if (!std.mem.eql(u8, self.signature, other.signature)) return false;
        return true;
    }

    /// ABI encode UserOperation for contract calls
    /// Returns tuple-encoded UserOperation per ERC-4337 ABI
    pub fn abiEncode(self: *const Self, allocator: std.mem.Allocator) ![]u8 {
        // ABI encoding layout for UserOperation tuple:
        // - sender (address, 32 bytes padded)
        // - nonce (uint256)
        // - initCode offset (32 bytes)
        // - callData offset (32 bytes)
        // - callGasLimit (uint256)
        // - verificationGasLimit (uint256)
        // - preVerificationGas (uint256)
        // - maxFeePerGas (uint256)
        // - maxPriorityFeePerGas (uint256)
        // - paymasterAndData offset (32 bytes)
        // - signature offset (32 bytes)
        // + dynamic data for initCode, callData, paymasterAndData, signature

        const fixed_size: usize = 11 * 32; // 11 fixed fields
        const init_code_padded = padTo32(self.init_code.len);
        const call_data_padded = padTo32(self.call_data.len);
        const paymaster_padded = padTo32(self.paymaster_and_data.len);
        const signature_padded = padTo32(self.signature.len);

        const total_size = fixed_size + 32 + init_code_padded + 32 + call_data_padded + 32 + paymaster_padded + 32 + signature_padded;
        const encoded = try allocator.alloc(u8, total_size);
        errdefer allocator.free(encoded);

        @memset(encoded, 0);

        var offset: usize = 0;
        var data_offset: usize = fixed_size;

        // sender (address)
        @memcpy(encoded[offset + 12 .. offset + 32], &self.sender.bytes);
        offset += 32;

        // nonce
        writeU256(encoded[offset .. offset + 32], self.nonce);
        offset += 32;

        // initCode offset
        writeU256(encoded[offset .. offset + 32], @intCast(data_offset));
        offset += 32;
        const init_code_offset = data_offset;
        data_offset += 32 + init_code_padded;

        // callData offset
        writeU256(encoded[offset .. offset + 32], @intCast(data_offset));
        offset += 32;
        const call_data_offset = data_offset;
        data_offset += 32 + call_data_padded;

        // callGasLimit
        writeU256(encoded[offset .. offset + 32], self.call_gas_limit);
        offset += 32;

        // verificationGasLimit
        writeU256(encoded[offset .. offset + 32], self.verification_gas_limit);
        offset += 32;

        // preVerificationGas
        writeU256(encoded[offset .. offset + 32], self.pre_verification_gas);
        offset += 32;

        // maxFeePerGas
        writeU256(encoded[offset .. offset + 32], self.max_fee_per_gas);
        offset += 32;

        // maxPriorityFeePerGas
        writeU256(encoded[offset .. offset + 32], self.max_priority_fee_per_gas);
        offset += 32;

        // paymasterAndData offset
        writeU256(encoded[offset .. offset + 32], @intCast(data_offset));
        offset += 32;
        const paymaster_offset = data_offset;
        data_offset += 32 + paymaster_padded;

        // signature offset
        writeU256(encoded[offset .. offset + 32], @intCast(data_offset));
        const signature_offset = data_offset;

        // Write dynamic data

        // initCode (length + data)
        writeU256(encoded[init_code_offset .. init_code_offset + 32], @intCast(self.init_code.len));
        if (self.init_code.len > 0) {
            @memcpy(encoded[init_code_offset + 32 .. init_code_offset + 32 + self.init_code.len], self.init_code);
        }

        // callData (length + data)
        writeU256(encoded[call_data_offset .. call_data_offset + 32], @intCast(self.call_data.len));
        if (self.call_data.len > 0) {
            @memcpy(encoded[call_data_offset + 32 .. call_data_offset + 32 + self.call_data.len], self.call_data);
        }

        // paymasterAndData (length + data)
        writeU256(encoded[paymaster_offset .. paymaster_offset + 32], @intCast(self.paymaster_and_data.len));
        if (self.paymaster_and_data.len > 0) {
            @memcpy(encoded[paymaster_offset + 32 .. paymaster_offset + 32 + self.paymaster_and_data.len], self.paymaster_and_data);
        }

        // signature (length + data)
        writeU256(encoded[signature_offset .. signature_offset + 32], @intCast(self.signature.len));
        if (self.signature.len > 0) {
            @memcpy(encoded[signature_offset + 32 .. signature_offset + 32 + self.signature.len], self.signature);
        }

        return encoded;
    }

    /// ABI decode UserOperation from bytes
    pub fn abiDecode(allocator: std.mem.Allocator, data: []const u8) !Self {
        if (data.len < 11 * 32) return error.InsufficientData;

        var offset: usize = 0;

        // sender
        const sender = Address.fromBytes(data[offset + 12 .. offset + 32]) catch return error.InvalidAddress;
        offset += 32;

        // nonce
        const nonce = readU256(data[offset .. offset + 32]);
        offset += 32;

        // initCode offset
        const init_code_offset = @as(usize, @intCast(readU256(data[offset .. offset + 32])));
        offset += 32;

        // callData offset
        const call_data_offset = @as(usize, @intCast(readU256(data[offset .. offset + 32])));
        offset += 32;

        // callGasLimit
        const call_gas_limit = readU256(data[offset .. offset + 32]);
        offset += 32;

        // verificationGasLimit
        const verification_gas_limit = readU256(data[offset .. offset + 32]);
        offset += 32;

        // preVerificationGas
        const pre_verification_gas = readU256(data[offset .. offset + 32]);
        offset += 32;

        // maxFeePerGas
        const max_fee_per_gas = readU256(data[offset .. offset + 32]);
        offset += 32;

        // maxPriorityFeePerGas
        const max_priority_fee_per_gas = readU256(data[offset .. offset + 32]);
        offset += 32;

        // paymasterAndData offset
        const paymaster_offset = @as(usize, @intCast(readU256(data[offset .. offset + 32])));
        offset += 32;

        // signature offset
        const signature_offset = @as(usize, @intCast(readU256(data[offset .. offset + 32])));

        // Read dynamic data
        const init_code = try readDynamicBytes(allocator, data, init_code_offset);
        errdefer allocator.free(init_code);

        const call_data = try readDynamicBytes(allocator, data, call_data_offset);
        errdefer allocator.free(call_data);

        const paymaster_and_data = try readDynamicBytes(allocator, data, paymaster_offset);
        errdefer allocator.free(paymaster_and_data);

        const signature = try readDynamicBytes(allocator, data, signature_offset);

        return .{
            .sender = sender,
            .nonce = nonce,
            .init_code = init_code,
            .call_data = call_data,
            .call_gas_limit = call_gas_limit,
            .verification_gas_limit = verification_gas_limit,
            .pre_verification_gas = pre_verification_gas,
            .max_fee_per_gas = max_fee_per_gas,
            .max_priority_fee_per_gas = max_priority_fee_per_gas,
            .paymaster_and_data = paymaster_and_data,
            .signature = signature,
        };
    }

    /// Free allocated memory for dynamic fields
    pub fn deinit(self: *Self, allocator: std.mem.Allocator) void {
        if (self.init_code.len > 0) allocator.free(self.init_code);
        if (self.call_data.len > 0) allocator.free(self.call_data);
        if (self.paymaster_and_data.len > 0) allocator.free(self.paymaster_and_data);
        if (self.signature.len > 0) allocator.free(self.signature);
    }
};

/// PackedUserOperation for ERC-4337 v0.7
pub const PackedUserOperation = struct {
    sender: Address.Address,
    nonce: u256,
    init_code: []const u8,
    call_data: []const u8,
    /// Packed: verificationGasLimit (128 bits) || callGasLimit (128 bits)
    account_gas_limits: [32]u8,
    pre_verification_gas: u256,
    /// Packed: maxPriorityFeePerGas (128 bits) || maxFeePerGas (128 bits)
    gas_fees: [32]u8,
    paymaster_and_data: []const u8,
    signature: []const u8,

    const Self = @This();

    /// Create PackedUserOperation from regular UserOperation
    pub fn fromUserOp(user_op: *const UserOperation) Self {
        var account_gas_limits: [32]u8 = undefined;
        var gas_fees: [32]u8 = undefined;

        // Pack verificationGasLimit (high 128 bits) || callGasLimit (low 128 bits)
        writeU128(account_gas_limits[0..16], @truncate(user_op.verification_gas_limit));
        writeU128(account_gas_limits[16..32], @truncate(user_op.call_gas_limit));

        // Pack maxPriorityFeePerGas (high 128 bits) || maxFeePerGas (low 128 bits)
        writeU128(gas_fees[0..16], @truncate(user_op.max_priority_fee_per_gas));
        writeU128(gas_fees[16..32], @truncate(user_op.max_fee_per_gas));

        return .{
            .sender = user_op.sender,
            .nonce = user_op.nonce,
            .init_code = user_op.init_code,
            .call_data = user_op.call_data,
            .account_gas_limits = account_gas_limits,
            .pre_verification_gas = user_op.pre_verification_gas,
            .gas_fees = gas_fees,
            .paymaster_and_data = user_op.paymaster_and_data,
            .signature = user_op.signature,
        };
    }

    /// Convert back to regular UserOperation
    pub fn toUserOp(self: *const Self) UserOperation {
        return .{
            .sender = self.sender,
            .nonce = self.nonce,
            .init_code = self.init_code,
            .call_data = self.call_data,
            .call_gas_limit = readU128(self.account_gas_limits[16..32]),
            .verification_gas_limit = readU128(self.account_gas_limits[0..16]),
            .pre_verification_gas = self.pre_verification_gas,
            .max_fee_per_gas = readU128(self.gas_fees[16..32]),
            .max_priority_fee_per_gas = readU128(self.gas_fees[0..16]),
            .paymaster_and_data = self.paymaster_and_data,
            .signature = self.signature,
        };
    }
};

// ============================================================================
// Helper functions
// ============================================================================

fn writeU256(buf: []u8, value: u256) void {
    std.debug.assert(buf.len == 32);
    var v = value;
    var i: usize = 32;
    while (i > 0) {
        i -= 1;
        buf[i] = @truncate(v & 0xff);
        v >>= 8;
    }
}

fn readU256(buf: []const u8) u256 {
    std.debug.assert(buf.len == 32);
    var result: u256 = 0;
    for (buf) |byte| {
        result = (result << 8) | byte;
    }
    return result;
}

fn writeU128(buf: []u8, value: u128) void {
    std.debug.assert(buf.len == 16);
    var v = value;
    var i: usize = 16;
    while (i > 0) {
        i -= 1;
        buf[i] = @truncate(v & 0xff);
        v >>= 8;
    }
}

fn readU128(buf: []const u8) u256 {
    std.debug.assert(buf.len == 16);
    var result: u256 = 0;
    for (buf) |byte| {
        result = (result << 8) | byte;
    }
    return result;
}

fn padTo32(len: usize) usize {
    if (len == 0) return 0;
    return ((len + 31) / 32) * 32;
}

fn readDynamicBytes(allocator: std.mem.Allocator, data: []const u8, offset: usize) ![]u8 {
    if (offset + 32 > data.len) return error.InvalidOffset;
    const len = @as(usize, @intCast(readU256(data[offset .. offset + 32])));
    if (len == 0) return &[_]u8{};
    if (offset + 32 + len > data.len) return error.InsufficientData;
    const result = try allocator.alloc(u8, len);
    @memcpy(result, data[offset + 32 .. offset + 32 + len]);
    return result;
}

// ============================================================================
// Tests
// ============================================================================

test "UserOperation.from - basic creation" {
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const user_op = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
        .call_gas_limit = 100000,
        .verification_gas_limit = 200000,
        .pre_verification_gas = 50000,
        .max_fee_per_gas = 1000000000,
        .max_priority_fee_per_gas = 1000000000,
    });

    try std.testing.expect(Address.equals(user_op.sender, sender));
    try std.testing.expectEqual(@as(u256, 1), user_op.nonce);
    try std.testing.expectEqual(@as(u256, 100000), user_op.call_gas_limit);
    try std.testing.expectEqual(@as(u256, 200000), user_op.verification_gas_limit);
    try std.testing.expectEqual(@as(u256, 50000), user_op.pre_verification_gas);
}

test "UserOperation.from - with init code and call data" {
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const init_code = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };
    const call_data = [_]u8{ 0xb6, 0x1d, 0x27, 0xf6 };

    const user_op = UserOperation.from(.{
        .sender = sender,
        .nonce = 0,
        .init_code = &init_code,
        .call_data = &call_data,
    });

    try std.testing.expectEqual(@as(usize, 5), user_op.init_code.len);
    try std.testing.expectEqual(@as(usize, 4), user_op.call_data.len);
    try std.testing.expectEqualSlices(u8, &init_code, user_op.init_code);
    try std.testing.expectEqualSlices(u8, &call_data, user_op.call_data);
}

test "UserOperation.pack - produces consistent output" {
    const allocator = std.testing.allocator;
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");

    const user_op = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
        .call_gas_limit = 100000,
        .verification_gas_limit = 200000,
        .pre_verification_gas = 50000,
        .max_fee_per_gas = 1000000000,
        .max_priority_fee_per_gas = 1000000000,
    });

    const packed1 = try user_op.pack(allocator);
    defer allocator.free(packed1);

    const packed2 = try user_op.pack(allocator);
    defer allocator.free(packed2);

    try std.testing.expectEqual(@as(usize, 320), packed1.len);
    try std.testing.expectEqualSlices(u8, packed1, packed2);
}

test "UserOperation.pack - includes sender correctly" {
    const allocator = std.testing.allocator;
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");

    const user_op = UserOperation.from(.{
        .sender = sender,
    });

    const pack_data = try user_op.pack(allocator);
    defer allocator.free(pack_data);

    // First 32 bytes should contain sender (left-padded)
    try std.testing.expectEqualSlices(u8, &[_]u8{0} ** 12, pack_data[0..12]);
    try std.testing.expectEqualSlices(u8, &sender.bytes, pack_data[12..32]);
}

test "UserOperation.hash - deterministic" {
    const allocator = std.testing.allocator;
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const entry_point = try Address.fromHex("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");

    const user_op = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
        .call_gas_limit = 100000,
        .verification_gas_limit = 200000,
        .pre_verification_gas = 50000,
        .max_fee_per_gas = 1000000000,
        .max_priority_fee_per_gas = 1000000000,
    });

    const hash1 = try user_op.hash(allocator, entry_point, 1);
    const hash2 = try user_op.hash(allocator, entry_point, 1);

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "UserOperation.hash - different chain id produces different hash" {
    const allocator = std.testing.allocator;
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const entry_point = try Address.fromHex("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");

    const user_op = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
    });

    const hash1 = try user_op.hash(allocator, entry_point, 1);
    const hash2 = try user_op.hash(allocator, entry_point, 137);

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "UserOperation.hash - different entry point produces different hash" {
    const allocator = std.testing.allocator;
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const entry_point_v06 = try Address.fromHex("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");
    const entry_point_v07 = try Address.fromHex("0x0000000071727De22E5E9d8BAf0edAc6f37da032");

    const user_op = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
    });

    const hash1 = try user_op.hash(allocator, entry_point_v06, 1);
    const hash2 = try user_op.hash(allocator, entry_point_v07, 1);

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "UserOperation.equals - same operations" {
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");

    const user_op1 = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
        .call_gas_limit = 100000,
    });

    const user_op2 = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
        .call_gas_limit = 100000,
    });

    try std.testing.expect(user_op1.equals(&user_op2));
}

test "UserOperation.equals - different nonce" {
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");

    const user_op1 = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
    });

    const user_op2 = UserOperation.from(.{
        .sender = sender,
        .nonce = 2,
    });

    try std.testing.expect(!user_op1.equals(&user_op2));
}

test "UserOperation.equals - different sender" {
    const sender1 = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const sender2 = try Address.fromHex("0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789");

    const user_op1 = UserOperation.from(.{
        .sender = sender1,
    });

    const user_op2 = UserOperation.from(.{
        .sender = sender2,
    });

    try std.testing.expect(!user_op1.equals(&user_op2));
}

test "UserOperation.abiEncode and abiDecode roundtrip" {
    const allocator = std.testing.allocator;
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const init_code = [_]u8{ 0x60, 0x80, 0x60, 0x40 };
    const call_data = [_]u8{ 0xb6, 0x1d, 0x27, 0xf6 };
    const signature = [_]u8{ 0x01, 0x02, 0x03 };

    const user_op = UserOperation.from(.{
        .sender = sender,
        .nonce = 42,
        .init_code = &init_code,
        .call_data = &call_data,
        .call_gas_limit = 100000,
        .verification_gas_limit = 200000,
        .pre_verification_gas = 50000,
        .max_fee_per_gas = 1000000000,
        .max_priority_fee_per_gas = 100000000,
        .signature = &signature,
    });

    const encoded = try user_op.abiEncode(allocator);
    defer allocator.free(encoded);

    var decoded = try UserOperation.abiDecode(allocator, encoded);
    defer decoded.deinit(allocator);

    try std.testing.expect(Address.equals(decoded.sender, sender));
    try std.testing.expectEqual(@as(u256, 42), decoded.nonce);
    try std.testing.expectEqual(@as(u256, 100000), decoded.call_gas_limit);
    try std.testing.expectEqual(@as(u256, 200000), decoded.verification_gas_limit);
    try std.testing.expectEqual(@as(u256, 50000), decoded.pre_verification_gas);
    try std.testing.expectEqual(@as(u256, 1000000000), decoded.max_fee_per_gas);
    try std.testing.expectEqual(@as(u256, 100000000), decoded.max_priority_fee_per_gas);
    try std.testing.expectEqualSlices(u8, &init_code, decoded.init_code);
    try std.testing.expectEqualSlices(u8, &call_data, decoded.call_data);
    try std.testing.expectEqualSlices(u8, &signature, decoded.signature);
}

test "PackedUserOperation.fromUserOp - packs gas limits correctly" {
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");

    const user_op = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
        .call_gas_limit = 100000,
        .verification_gas_limit = 200000,
        .pre_verification_gas = 50000,
        .max_fee_per_gas = 1000000000,
        .max_priority_fee_per_gas = 100000000,
    });

    const packed_op = PackedUserOperation.fromUserOp(&user_op);

    // Verify sender is preserved
    try std.testing.expect(Address.equals(packed_op.sender, sender));
    try std.testing.expectEqual(@as(u256, 1), packed_op.nonce);
    try std.testing.expectEqual(@as(u256, 50000), packed_op.pre_verification_gas);
}

test "PackedUserOperation roundtrip" {
    const sender = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");

    const user_op = UserOperation.from(.{
        .sender = sender,
        .nonce = 1,
        .call_gas_limit = 100000,
        .verification_gas_limit = 200000,
        .pre_verification_gas = 50000,
        .max_fee_per_gas = 1000000000,
        .max_priority_fee_per_gas = 100000000,
    });

    const packed_op = PackedUserOperation.fromUserOp(&user_op);
    const unpacked = packed_op.toUserOp();

    try std.testing.expect(user_op.equals(&unpacked));
}

test "writeU256 and readU256 roundtrip" {
    var buf: [32]u8 = undefined;

    // Test zero
    writeU256(&buf, 0);
    try std.testing.expectEqual(@as(u256, 0), readU256(&buf));

    // Test one
    writeU256(&buf, 1);
    try std.testing.expectEqual(@as(u256, 1), readU256(&buf));

    // Test max
    const max_val = std.math.maxInt(u256);
    writeU256(&buf, max_val);
    try std.testing.expectEqual(max_val, readU256(&buf));

    // Test arbitrary value
    const val: u256 = 0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0;
    writeU256(&buf, val);
    try std.testing.expectEqual(val, readU256(&buf));
}

test "writeU128 and readU128 roundtrip" {
    var buf: [16]u8 = undefined;

    // Test zero
    writeU128(&buf, 0);
    try std.testing.expectEqual(@as(u256, 0), readU128(&buf));

    // Test one
    writeU128(&buf, 1);
    try std.testing.expectEqual(@as(u256, 1), readU128(&buf));

    // Test max u128
    const max_val: u128 = std.math.maxInt(u128);
    writeU128(&buf, max_val);
    try std.testing.expectEqual(@as(u256, max_val), readU128(&buf));
}

test "padTo32" {
    try std.testing.expectEqual(@as(usize, 0), padTo32(0));
    try std.testing.expectEqual(@as(usize, 32), padTo32(1));
    try std.testing.expectEqual(@as(usize, 32), padTo32(31));
    try std.testing.expectEqual(@as(usize, 32), padTo32(32));
    try std.testing.expectEqual(@as(usize, 64), padTo32(33));
    try std.testing.expectEqual(@as(usize, 64), padTo32(64));
    try std.testing.expectEqual(@as(usize, 96), padTo32(65));
}
