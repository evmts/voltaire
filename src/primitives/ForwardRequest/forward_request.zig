//! ForwardRequest - EIP-2771 Meta-Transaction Forward Request
//!
//! Represents a forward request for GSN (Gas Station Network) meta-transactions.
//! Enables gasless transactions by having a relayer submit on behalf of the user.
//!
//! ## EIP-2771 Specification
//! https://eips.ethereum.org/EIPS/eip-2771
//!
//! ForwardRequest struct per GSN:
//! - from: address (actual signer)
//! - to: address (target contract)
//! - value: uint256 (ETH value to send)
//! - gas: uint256 (gas limit for inner call)
//! - nonce: uint256 (replay protection)
//! - data: bytes (calldata to execute)
//! - validUntilTime: uint256 (expiration timestamp)
//!
//! ## Usage
//! ```zig
//! const ForwardRequest = @import("primitives").ForwardRequest;
//!
//! // Create a forward request
//! const req = ForwardRequest.from(.{
//!     .from = sender_address,
//!     .to = target_contract,
//!     .value = 0,
//!     .gas = 100000,
//!     .nonce = 1,
//!     .data = calldata,
//!     .valid_until_time = 1700000000,
//! });
//!
//! // Compute EIP-712 hash for signing
//! const hash = try req.hash(allocator, domain);
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;
const Domain = primitives.Domain;
const crypto = @import("crypto");

/// EIP-712 type hash for ForwardRequest
/// keccak256("ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntilTime)")
pub const FORWARD_REQUEST_TYPEHASH: [32]u8 = computeTypeHash();

fn computeTypeHash() [32]u8 {
    const type_string = "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntilTime)";
    var result: [32]u8 = undefined;
    crypto.Keccak256.hash(type_string, &result);
    return result;
}

/// ForwardRequest - EIP-2771 meta-transaction request
pub const ForwardRequest = struct {
    /// Actual signer/sender of the meta-transaction
    from: Address.Address,

    /// Target contract to call
    to: Address.Address,

    /// ETH value to send with the call
    value: u256,

    /// Gas limit for the inner call
    gas: u256,

    /// Nonce for replay protection
    nonce: u256,

    /// Calldata to execute on target contract
    data: []const u8,

    /// Unix timestamp after which request is invalid
    valid_until_time: u256,

    /// Compute EIP-712 struct hash
    /// structHash = keccak256(typeHash || encodeData)
    pub fn structHash(self: ForwardRequest) [32]u8 {
        // Encode: typeHash || from || to || value || gas || nonce || keccak256(data) || validUntilTime
        // Each field is 32 bytes
        var encoded: [32 * 8]u8 = undefined;

        // typeHash
        @memcpy(encoded[0..32], &FORWARD_REQUEST_TYPEHASH);

        // from (address, left-padded to 32 bytes)
        @memset(encoded[32..44], 0);
        @memcpy(encoded[44..64], &self.from.bytes);

        // to (address, left-padded to 32 bytes)
        @memset(encoded[64..76], 0);
        @memcpy(encoded[76..96], &self.to.bytes);

        // value (uint256, big-endian)
        std.mem.writeInt(u256, encoded[96..128], self.value, .big);

        // gas (uint256, big-endian)
        std.mem.writeInt(u256, encoded[128..160], self.gas, .big);

        // nonce (uint256, big-endian)
        std.mem.writeInt(u256, encoded[160..192], self.nonce, .big);

        // keccak256(data)
        var data_hash: [32]u8 = undefined;
        crypto.Keccak256.hash(self.data, &data_hash);
        @memcpy(encoded[192..224], &data_hash);

        // validUntilTime (uint256, big-endian)
        std.mem.writeInt(u256, encoded[224..256], self.valid_until_time, .big);

        // Hash the encoded data
        var result: [32]u8 = undefined;
        crypto.Keccak256.hash(&encoded, &result);
        return result;
    }

    /// Compute EIP-712 hash for signing
    /// hash = keccak256("\x19\x01" || domainSeparator || structHash)
    pub fn hash(self: ForwardRequest, allocator: std.mem.Allocator, domain: Domain) ![32]u8 {
        // Get domain separator
        const domain_sep = try domain.toHash(allocator);

        // Get struct hash
        const struct_hash = self.structHash();

        // Concatenate: "\x19\x01" || domainSeparator || structHash
        var data: [2 + 32 + 32]u8 = undefined;
        data[0] = 0x19;
        data[1] = 0x01;
        @memcpy(data[2..34], &domain_sep.bytes);
        @memcpy(data[34..66], &struct_hash);

        // Final hash
        var result: [32]u8 = undefined;
        crypto.Keccak256.hash(&data, &result);
        return result;
    }

    /// Check equality between two ForwardRequests
    pub fn equals(self: ForwardRequest, other: ForwardRequest) bool {
        return self.from.equals(other.from) and
            self.to.equals(other.to) and
            self.value == other.value and
            self.gas == other.gas and
            self.nonce == other.nonce and
            std.mem.eql(u8, self.data, other.data) and
            self.valid_until_time == other.valid_until_time;
    }

    /// Check if the request has expired
    pub fn isExpired(self: ForwardRequest, current_time: u256) bool {
        return current_time > self.valid_until_time;
    }

    /// Check if the request is valid (not expired)
    pub fn isValid(self: ForwardRequest, current_time: u256) bool {
        return !self.isExpired(current_time);
    }

    /// Get the EIP-712 type string
    pub fn getTypeString() []const u8 {
        return "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntilTime)";
    }
};

// ============================================================================
// Constructors
// ============================================================================

/// Create ForwardRequest from struct
pub fn from(data: ForwardRequest) ForwardRequest {
    return data;
}

/// Create ForwardRequest from individual fields
pub fn fromFields(
    from_addr: Address.Address,
    to_addr: Address.Address,
    value: u256,
    gas: u256,
    nonce: u256,
    data: []const u8,
    valid_until_time: u256,
) ForwardRequest {
    return .{
        .from = from_addr,
        .to = to_addr,
        .value = value,
        .gas = gas,
        .nonce = nonce,
        .data = data,
        .valid_until_time = valid_until_time,
    };
}

// ============================================================================
// Tests
// ============================================================================

test "ForwardRequest: from creates request" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };
    const data = "test data";

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 1000,
        .gas = 100000,
        .nonce = 1,
        .data = data,
        .valid_until_time = 1700000000,
    });

    try std.testing.expect(req.from.equals(from_addr));
    try std.testing.expect(req.to.equals(to_addr));
    try std.testing.expectEqual(@as(u256, 1000), req.value);
    try std.testing.expectEqual(@as(u256, 100000), req.gas);
    try std.testing.expectEqual(@as(u256, 1), req.nonce);
    try std.testing.expectEqualStrings(data, req.data);
    try std.testing.expectEqual(@as(u256, 1700000000), req.valid_until_time);
}

test "ForwardRequest: fromFields creates request" {
    const from_addr = Address.Address{ .bytes = [_]u8{0x11} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0x22} ** 20 };

    const req = fromFields(
        from_addr,
        to_addr,
        0,
        50000,
        5,
        "calldata",
        1800000000,
    );

    try std.testing.expect(req.from.equals(from_addr));
    try std.testing.expectEqual(@as(u256, 0), req.value);
    try std.testing.expectEqual(@as(u256, 5), req.nonce);
}

test "ForwardRequest: structHash produces consistent result" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    const hash1 = req.structHash();
    const hash2 = req.structHash();

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "ForwardRequest: different requests produce different hashes" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req1 = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "test1",
        .valid_until_time = 1700000000,
    });

    const req2 = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 2, // Different nonce
        .data = "test1",
        .valid_until_time = 1700000000,
    });

    const hash1 = req1.structHash();
    const hash2 = req2.structHash();

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "ForwardRequest: hash with domain produces EIP-712 hash" {
    const allocator = std.testing.allocator;

    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    const domain = Domain{
        .name = "GSN Relayed Transaction",
        .version = "2",
        .chain_id = 1,
        .verifying_contract = to_addr,
    };

    const hash1 = try req.hash(allocator, domain);
    const hash2 = try req.hash(allocator, domain);

    // Same request with same domain produces same hash
    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "ForwardRequest: different domains produce different hashes" {
    const allocator = std.testing.allocator;

    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    const domain1 = Domain{
        .name = "GSN v1",
        .version = "1",
        .chain_id = 1,
    };

    const domain2 = Domain{
        .name = "GSN v2",
        .version = "2",
        .chain_id = 1,
    };

    const hash1 = try req.hash(allocator, domain1);
    const hash2 = try req.hash(allocator, domain2);

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "ForwardRequest: equals identical requests" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };
    const data = "same data";

    const req1 = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 1000,
        .gas = 100000,
        .nonce = 1,
        .data = data,
        .valid_until_time = 1700000000,
    });

    const req2 = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 1000,
        .gas = 100000,
        .nonce = 1,
        .data = data,
        .valid_until_time = 1700000000,
    });

    try std.testing.expect(req1.equals(req2));
}

test "ForwardRequest: equals different from addresses" {
    const from1 = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const from2 = Address.Address{ .bytes = [_]u8{0xcc} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req1 = from(.{
        .from = from1,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    const req2 = from(.{
        .from = from2,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    try std.testing.expect(!req1.equals(req2));
}

test "ForwardRequest: equals different values" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req1 = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 1000,
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    const req2 = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 2000, // Different value
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    try std.testing.expect(!req1.equals(req2));
}

test "ForwardRequest: equals different data" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req1 = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "data1",
        .valid_until_time = 1700000000,
    });

    const req2 = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "data2", // Different data
        .valid_until_time = 1700000000,
    });

    try std.testing.expect(!req1.equals(req2));
}

test "ForwardRequest: isExpired returns true when expired" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    // Time after validUntilTime
    try std.testing.expect(req.isExpired(1700000001));
    try std.testing.expect(!req.isValid(1700000001));
}

test "ForwardRequest: isExpired returns false when not expired" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    // Time before validUntilTime
    try std.testing.expect(!req.isExpired(1699999999));
    try std.testing.expect(req.isValid(1699999999));
}

test "ForwardRequest: isExpired edge case at exact time" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "test",
        .valid_until_time = 1700000000,
    });

    // Exactly at validUntilTime - not expired yet
    try std.testing.expect(!req.isExpired(1700000000));
    try std.testing.expect(req.isValid(1700000000));
}

test "ForwardRequest: getTypeString returns correct string" {
    const expected = "ForwardRequest(address from,address to,uint256 value,uint256 gas,uint256 nonce,bytes data,uint256 validUntilTime)";
    try std.testing.expectEqualStrings(expected, ForwardRequest.getTypeString());
}

test "ForwardRequest: FORWARD_REQUEST_TYPEHASH is correct" {
    const type_string = ForwardRequest.getTypeString();
    var expected: [32]u8 = undefined;
    crypto.Keccak256.hash(type_string, &expected);
    try std.testing.expectEqualSlices(u8, &expected, &FORWARD_REQUEST_TYPEHASH);
}

test "ForwardRequest: structHash with empty data" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 100000,
        .nonce = 1,
        .data = "",
        .valid_until_time = 1700000000,
    });

    // Should not panic with empty data
    const hash_result = req.structHash();
    try std.testing.expectEqual(@as(usize, 32), hash_result.len);
}

test "ForwardRequest: structHash with large value" {
    const from_addr = Address.Address{ .bytes = [_]u8{0xaa} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0xbb} ** 20 };

    const large_value: u256 = std.math.maxInt(u256);

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = large_value,
        .gas = large_value,
        .nonce = large_value,
        .data = "test",
        .valid_until_time = large_value,
    });

    // Should handle max u256 values
    const hash_result = req.structHash();
    try std.testing.expectEqual(@as(usize, 32), hash_result.len);
}

test "ForwardRequest: zero value request" {
    const from_addr = Address.Address{ .bytes = [_]u8{0} ** 20 };
    const to_addr = Address.Address{ .bytes = [_]u8{0} ** 20 };

    const req = from(.{
        .from = from_addr,
        .to = to_addr,
        .value = 0,
        .gas = 0,
        .nonce = 0,
        .data = "",
        .valid_until_time = 0,
    });

    // Should handle all-zero request
    const hash_result = req.structHash();
    try std.testing.expectEqual(@as(usize, 32), hash_result.len);
}
