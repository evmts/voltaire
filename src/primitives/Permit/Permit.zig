//! Permit - EIP-2612 & Permit2 Gasless Token Approval
//!
//! EIP-2612 allows ERC-20 token holders to approve spending via signatures,
//! enabling gasless transactions. The permit mechanism uses EIP-712 typed data
//! for secure off-chain authorization.
//!
//! ## Supported Standards
//! - **EIP-2612**: Standard permit for ERC-20 tokens
//! - **Permit2**: Uniswap's universal permit system for batch approvals
//!
//! ## Types
//! - `Permit`: EIP-2612 permit (owner, spender, value, nonce, deadline)
//! - `PermitDetails`: Permit2 token details (token, amount, expiration, nonce)
//! - `PermitSingle`: Permit2 single-token permit
//! - `PermitBatch`: Permit2 multi-token batch permit
//!
//! ## Usage
//! ```zig
//! // EIP-2612 Permit
//! const permit = Permit.init(owner, spender, value, nonce, deadline);
//! const hash = permit.hash(domain);
//!
//! // Permit2 Single
//! const details = PermitDetails.init(token, amount, expiration, nonce);
//! const single = PermitSingle.init(details, spender, sigDeadline);
//! const hash2 = single.hash(Permit2Domain.init(chainId, Permit2Contracts.MAINNET));
//!
//! // Permit2 Batch
//! const batch = PermitBatch.init(&details_arr, spender, sigDeadline);
//! const hash3 = try batch.hash(domain, allocator);
//! ```
//!
//! @see https://eips.ethereum.org/EIPS/eip-2612
//! @see https://eips.ethereum.org/EIPS/eip-712
//! @see https://github.com/Uniswap/permit2

const std = @import("std");
const Keccak256 = std.crypto.hash.sha3.Keccak256;

/// EIP-2612 Permit message structure
pub const Permit = struct {
    /// Owner address (20 bytes)
    owner: [20]u8,
    /// Spender address (20 bytes)
    spender: [20]u8,
    /// Approved value (u256)
    value: u256,
    /// Owner's current nonce (u256)
    nonce: u256,
    /// Expiration timestamp (u256)
    deadline: u256,

    /// Create a new Permit (alias: from)
    pub fn init(
        owner: [20]u8,
        spender: [20]u8,
        value: u256,
        nonce: u256,
        deadline: u256,
    ) Permit {
        return .{
            .owner = owner,
            .spender = spender,
            .value = value,
            .nonce = nonce,
            .deadline = deadline,
        };
    }

    /// Alias for init (matches TypeScript naming convention)
    pub const from = init;

    /// Check if two permits are equal
    pub fn equals(self: Permit, other: Permit) bool {
        return std.mem.eql(u8, &self.owner, &other.owner) and
            std.mem.eql(u8, &self.spender, &other.spender) and
            self.value == other.value and
            self.nonce == other.nonce and
            self.deadline == other.deadline;
    }

    /// Convert permit to ABI-encoded struct hash
    /// keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, nonce, deadline))
    pub fn toStructHash(self: Permit) [32]u8 {
        var data: [192]u8 = undefined; // 32 * 6 = 192 bytes

        // PERMIT_TYPEHASH
        @memcpy(data[0..32], &PERMIT_TYPEHASH);

        // owner (padded to 32 bytes)
        @memset(data[32..44], 0);
        @memcpy(data[44..64], &self.owner);

        // spender (padded to 32 bytes)
        @memset(data[64..76], 0);
        @memcpy(data[76..96], &self.spender);

        // value
        std.mem.writeInt(u256, data[96..128], self.value, .big);

        // nonce
        std.mem.writeInt(u256, data[128..160], self.nonce, .big);

        // deadline
        std.mem.writeInt(u256, data[160..192], self.deadline, .big);

        var result: [32]u8 = undefined;
        Keccak256.hash(&data, &result, .{});
        return result;
    }

    /// Check if permit has expired
    pub fn isExpired(self: Permit, current_timestamp: u256) bool {
        return current_timestamp > self.deadline;
    }

    /// Compute full EIP-712 typed data hash for signing
    /// keccak256("\x19\x01" || domainSeparator || structHash)
    pub fn hash(self: Permit, domain: PermitDomain) [32]u8 {
        const struct_hash = self.toStructHash();
        const domain_sep = domain.toSeparator();
        return computeTypedDataHash(domain_sep, struct_hash);
    }

    /// Convert permit to EIP-712 typed data structure for external signing
    /// Returns struct containing domain, types, primary type, and message
    pub fn toTypedData(self: Permit, domain: PermitDomain) PermitTypedData {
        return PermitTypedData{
            .domain = domain,
            .types = &PERMIT_TYPES.Permit,
            .primary_type = "Permit",
            .message = self,
        };
    }
};

/// EIP-712 Domain for Permit signatures
pub const PermitDomain = struct {
    /// Token name
    name: []const u8,
    /// Token version (usually "1")
    version: []const u8,
    /// Chain ID
    chain_id: u64,
    /// Token contract address
    verifying_contract: [20]u8,

    /// Create a new PermitDomain
    pub fn init(
        name: []const u8,
        version: []const u8,
        chain_id: u64,
        verifying_contract: [20]u8,
    ) PermitDomain {
        return .{
            .name = name,
            .version = version,
            .chain_id = chain_id,
            .verifying_contract = verifying_contract,
        };
    }

    /// Compute domain separator hash
    /// keccak256(abi.encode(DOMAIN_TYPEHASH, keccak256(name), keccak256(version), chainId, verifyingContract))
    pub fn toSeparator(self: PermitDomain) [32]u8 {
        var data: [160]u8 = undefined; // 32 * 5 = 160 bytes

        // DOMAIN_TYPEHASH
        @memcpy(data[0..32], &DOMAIN_TYPEHASH);

        // keccak256(name)
        var name_hash: [32]u8 = undefined;
        Keccak256.hash(self.name, &name_hash, .{});
        @memcpy(data[32..64], &name_hash);

        // keccak256(version)
        var version_hash: [32]u8 = undefined;
        Keccak256.hash(self.version, &version_hash, .{});
        @memcpy(data[64..96], &version_hash);

        // chainId
        std.mem.writeInt(u256, data[96..128], self.chain_id, .big);

        // verifyingContract (padded to 32 bytes)
        @memset(data[128..140], 0);
        @memcpy(data[140..160], &self.verifying_contract);

        var result: [32]u8 = undefined;
        Keccak256.hash(&data, &result, .{});
        return result;
    }
};

/// EIP-712 Domain Separator typehash
/// keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
/// Pre-computed value: 0x8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f
pub const DOMAIN_TYPEHASH: [32]u8 = .{
    0x8b, 0x73, 0xc3, 0xc6, 0x9b, 0xb8, 0xfe, 0x3d,
    0x51, 0x2e, 0xcc, 0x4c, 0xf7, 0x59, 0xcc, 0x79,
    0x23, 0x9f, 0x7b, 0x17, 0x9b, 0x0f, 0xfa, 0xca,
    0xa9, 0xa7, 0x5d, 0x52, 0x2b, 0x39, 0x40, 0x0f,
};

/// EIP-2612 Permit typehash
/// keccak256("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)")
/// Pre-computed value: 0x6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c9
pub const PERMIT_TYPEHASH: [32]u8 = .{
    0x6e, 0x71, 0xed, 0xae, 0x12, 0xb1, 0xb9, 0x7f,
    0x4d, 0x1f, 0x60, 0x37, 0x0f, 0xef, 0x10, 0x10,
    0x5f, 0xa2, 0xfa, 0xae, 0x01, 0x26, 0x11, 0x4a,
    0x16, 0x9c, 0x64, 0x84, 0x5d, 0x61, 0x26, 0xc9,
};

/// EIP-712 typed data types for Permit (for reference/encoding)
pub const PERMIT_TYPES = struct {
    pub const Permit = [_]TypeField{
        .{ .name = "owner", .type_name = "address" },
        .{ .name = "spender", .type_name = "address" },
        .{ .name = "value", .type_name = "uint256" },
        .{ .name = "nonce", .type_name = "uint256" },
        .{ .name = "deadline", .type_name = "uint256" },
    };
};

const TypeField = struct {
    name: []const u8,
    type_name: []const u8,
};

/// EIP-712 typed data structure for Permit
/// Can be used for external signing libraries
pub const PermitTypedData = struct {
    domain: PermitDomain,
    types: []const TypeField,
    primary_type: []const u8,
    message: Permit,

    /// Compute the EIP-712 hash for this typed data
    pub fn hash(self: PermitTypedData) [32]u8 {
        return self.message.hash(self.domain);
    }
};

/// Compute full EIP-712 typed data hash for permit
/// keccak256("\x19\x01" || domainSeparator || structHash)
pub fn computeTypedDataHash(domain_separator: [32]u8, struct_hash: [32]u8) [32]u8 {
    var data: [66]u8 = undefined;
    data[0] = 0x19;
    data[1] = 0x01;
    @memcpy(data[2..34], &domain_separator);
    @memcpy(data[34..66], &struct_hash);

    var hash: [32]u8 = undefined;
    Keccak256.hash(&data, &hash, .{});
    return hash;
}

// Known token domain configurations
pub const KnownTokens = struct {
    /// USDC Mainnet (Ethereum) - 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
    pub const USDC_MAINNET = PermitDomain.init(
        "USD Coin",
        "2",
        1,
        .{ 0xa0, 0xb8, 0x69, 0x91, 0xc6, 0x21, 0x8b, 0x36, 0xc1, 0xd1, 0x9d, 0x4a, 0x2e, 0x9e, 0xb0, 0xce, 0x36, 0x06, 0xeb, 0x48 },
    );

    /// USDC Polygon - 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
    pub const USDC_POLYGON = PermitDomain.init(
        "USD Coin",
        "2",
        137,
        .{ 0x27, 0x91, 0xbc, 0xa1, 0xf2, 0xde, 0x46, 0x61, 0xed, 0x88, 0xa3, 0x0c, 0x99, 0xa7, 0xa9, 0x44, 0x9a, 0xa8, 0x41, 0x74 },
    );

    /// USDC Arbitrum - 0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8
    pub const USDC_ARBITRUM = PermitDomain.init(
        "USD Coin",
        "2",
        42161,
        .{ 0xff, 0x97, 0x0a, 0x61, 0xa0, 0x4b, 0x1c, 0xa1, 0x48, 0x34, 0xa4, 0x3f, 0x5d, 0xe4, 0x53, 0x3e, 0xbd, 0xdb, 0x5c, 0xc8 },
    );

    /// DAI Mainnet (Ethereum) - 0x6B175474E89094C44Da98b954EedeAC495271d0F
    pub const DAI_MAINNET = PermitDomain.init(
        "Dai Stablecoin",
        "1",
        1,
        .{ 0x6b, 0x17, 0x54, 0x74, 0xe8, 0x90, 0x94, 0xc4, 0x4d, 0xa9, 0x8b, 0x95, 0x4e, 0xed, 0xea, 0xc4, 0x95, 0x27, 0x1d, 0x0f },
    );

    /// USDT Mainnet (Ethereum) - 0xdAC17F958D2ee523a2206206994597C13D831ec7
    pub const USDT_MAINNET = PermitDomain.init(
        "Tether USD",
        "1",
        1,
        .{ 0xda, 0xc1, 0x7f, 0x95, 0x8d, 0x2e, 0xe5, 0x23, 0xa2, 0x20, 0x62, 0x06, 0x99, 0x45, 0x97, 0xc1, 0x3d, 0x83, 0x1e, 0xc7 },
    );

    /// UNI Mainnet (Ethereum) - 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
    pub const UNI_MAINNET = PermitDomain.init(
        "Uniswap",
        "1",
        1,
        .{ 0x1f, 0x98, 0x40, 0xa8, 0x5d, 0x5a, 0xf5, 0xbf, 0x1d, 0x17, 0x62, 0xf9, 0x25, 0xbd, 0xad, 0xdc, 0x42, 0x01, 0xf9, 0x84 },
    );

    /// WETH Mainnet (Ethereum) - 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
    pub const WETH_MAINNET = PermitDomain.init(
        "Wrapped Ether",
        "1",
        1,
        .{ 0xc0, 0x2a, 0xaa, 0x39, 0xb2, 0x23, 0xfe, 0x8d, 0x0a, 0x0e, 0x5c, 0x4f, 0x27, 0xea, 0xd9, 0x08, 0x3c, 0x75, 0x6c, 0xc2 },
    );
};

// Tests

test "Permit.init creates permit struct" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const permit = Permit.init(owner, spender, 1000, 0, 9999999999);

    try std.testing.expectEqualSlices(u8, &owner, &permit.owner);
    try std.testing.expectEqualSlices(u8, &spender, &permit.spender);
    try std.testing.expectEqual(@as(u256, 1000), permit.value);
    try std.testing.expectEqual(@as(u256, 0), permit.nonce);
    try std.testing.expectEqual(@as(u256, 9999999999), permit.deadline);
}

test "Permit.equals returns true for identical permits" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const permit1 = Permit.init(owner, spender, 1000, 0, 9999999999);
    const permit2 = Permit.init(owner, spender, 1000, 0, 9999999999);

    try std.testing.expect(permit1.equals(permit2));
}

test "Permit.equals returns false for different permits" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const permit1 = Permit.init(owner, spender, 1000, 0, 9999999999);
    const permit2 = Permit.init(owner, spender, 2000, 0, 9999999999);

    try std.testing.expect(!permit1.equals(permit2));
}

test "Permit.isExpired returns false for future deadline" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const permit = Permit.init(owner, spender, 1000, 0, 9999999999);

    try std.testing.expect(!permit.isExpired(1000000000));
}

test "Permit.isExpired returns true for past deadline" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const permit = Permit.init(owner, spender, 1000, 0, 1000000000);

    try std.testing.expect(permit.isExpired(1000000001));
}

test "Permit.toStructHash returns consistent hash" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const permit = Permit.init(owner, spender, 1000, 0, 9999999999);

    const hash1 = permit.toStructHash();
    const hash2 = permit.toStructHash();

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "Permit.toStructHash differs for different permits" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const permit1 = Permit.init(owner, spender, 1000, 0, 9999999999);
    const permit2 = Permit.init(owner, spender, 2000, 0, 9999999999);

    const hash1 = permit1.toStructHash();
    const hash2 = permit2.toStructHash();

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "PermitDomain.init creates domain struct" {
    const contract = [_]u8{0x03} ** 20;

    const domain = PermitDomain.init("Test Token", "1", 1, contract);

    try std.testing.expectEqualStrings("Test Token", domain.name);
    try std.testing.expectEqualStrings("1", domain.version);
    try std.testing.expectEqual(@as(u64, 1), domain.chain_id);
    try std.testing.expectEqualSlices(u8, &contract, &domain.verifying_contract);
}

test "PermitDomain.toSeparator returns consistent hash" {
    const contract = [_]u8{0x03} ** 20;

    const domain = PermitDomain.init("Test Token", "1", 1, contract);

    const sep1 = domain.toSeparator();
    const sep2 = domain.toSeparator();

    try std.testing.expectEqualSlices(u8, &sep1, &sep2);
}

test "PermitDomain.toSeparator differs for different domains" {
    const contract = [_]u8{0x03} ** 20;

    const domain1 = PermitDomain.init("Test Token", "1", 1, contract);
    const domain2 = PermitDomain.init("Other Token", "1", 1, contract);

    const sep1 = domain1.toSeparator();
    const sep2 = domain2.toSeparator();

    try std.testing.expect(!std.mem.eql(u8, &sep1, &sep2));
}

test "computeTypedDataHash combines domain and struct hash" {
    const domain_sep = [_]u8{0xaa} ** 32;
    const struct_hash = [_]u8{0xbb} ** 32;

    const hash = computeTypedDataHash(domain_sep, struct_hash);

    // Verify it's a valid 32-byte hash
    try std.testing.expectEqual(@as(usize, 32), hash.len);

    // Verify same inputs produce same output
    const hash2 = computeTypedDataHash(domain_sep, struct_hash);
    try std.testing.expectEqualSlices(u8, &hash, &hash2);
}

test "DOMAIN_TYPEHASH is correctly computed" {
    // Known value from EIP-712 spec
    var expected: [32]u8 = undefined;
    Keccak256.hash("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)", &expected, .{});

    try std.testing.expectEqualSlices(u8, &expected, &DOMAIN_TYPEHASH);
}

test "PERMIT_TYPEHASH is correctly computed" {
    // Known value from EIP-2612 spec
    var expected: [32]u8 = undefined;
    Keccak256.hash("Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)", &expected, .{});

    try std.testing.expectEqualSlices(u8, &expected, &PERMIT_TYPEHASH);
}

test "KnownTokens have valid configurations" {
    // USDC mainnet
    try std.testing.expectEqualStrings("USD Coin", KnownTokens.USDC_MAINNET.name);
    try std.testing.expectEqual(@as(u64, 1), KnownTokens.USDC_MAINNET.chain_id);

    // DAI mainnet
    try std.testing.expectEqualStrings("Dai Stablecoin", KnownTokens.DAI_MAINNET.name);
    try std.testing.expectEqual(@as(u64, 1), KnownTokens.DAI_MAINNET.chain_id);
}

test "Permit complete workflow" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;
    const contract = [_]u8{0x03} ** 20;

    // Create permit
    const permit = Permit.init(owner, spender, 1000, 0, 9999999999);

    // Create domain
    const domain = PermitDomain.init("Test Token", "1", 1, contract);

    // Compute hashes
    const struct_hash = permit.toStructHash();
    const domain_sep = domain.toSeparator();
    const typed_data_hash = computeTypedDataHash(domain_sep, struct_hash);

    // Verify hash is 32 bytes
    try std.testing.expectEqual(@as(usize, 32), typed_data_hash.len);

    // Verify permit is not expired
    try std.testing.expect(!permit.isExpired(1000000000));
}

test "Permit.hash computes correct EIP-712 hash" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;
    const contract = [_]u8{0x03} ** 20;

    const permit = Permit.init(owner, spender, 1000, 0, 9999999999);
    const domain = PermitDomain.init("Test Token", "1", 1, contract);

    // hash() should equal computeTypedDataHash(domain.toSeparator(), permit.toStructHash())
    const hash1 = permit.hash(domain);
    const hash2 = computeTypedDataHash(domain.toSeparator(), permit.toStructHash());

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "Permit.hash differs for different domains" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;
    const contract = [_]u8{0x03} ** 20;

    const permit = Permit.init(owner, spender, 1000, 0, 9999999999);
    const domain1 = PermitDomain.init("Token A", "1", 1, contract);
    const domain2 = PermitDomain.init("Token B", "1", 1, contract);

    const hash1 = permit.hash(domain1);
    const hash2 = permit.hash(domain2);

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "Permit.hash differs for different chain IDs" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;
    const contract = [_]u8{0x03} ** 20;

    const permit = Permit.init(owner, spender, 1000, 0, 9999999999);
    const domain1 = PermitDomain.init("Token", "1", 1, contract); // Mainnet
    const domain2 = PermitDomain.init("Token", "1", 137, contract); // Polygon

    const hash1 = permit.hash(domain1);
    const hash2 = permit.hash(domain2);

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "Permit.toTypedData returns correct structure" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;
    const contract = [_]u8{0x03} ** 20;

    const permit = Permit.init(owner, spender, 1000, 0, 9999999999);
    const domain = PermitDomain.init("Test Token", "1", 1, contract);

    const typed_data = permit.toTypedData(domain);

    try std.testing.expectEqualStrings("Permit", typed_data.primary_type);
    try std.testing.expectEqualStrings("Test Token", typed_data.domain.name);
    try std.testing.expect(typed_data.message.equals(permit));
    try std.testing.expectEqual(@as(usize, 5), typed_data.types.len);
}

test "PermitTypedData.hash equals Permit.hash" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;
    const contract = [_]u8{0x03} ** 20;

    const permit = Permit.init(owner, spender, 1000, 0, 9999999999);
    const domain = PermitDomain.init("Test Token", "1", 1, contract);

    const typed_data = permit.toTypedData(domain);
    const hash1 = typed_data.hash();
    const hash2 = permit.hash(domain);

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "KnownTokens UNI has valid configuration" {
    try std.testing.expectEqualStrings("Uniswap", KnownTokens.UNI_MAINNET.name);
    try std.testing.expectEqualStrings("1", KnownTokens.UNI_MAINNET.version);
    try std.testing.expectEqual(@as(u64, 1), KnownTokens.UNI_MAINNET.chain_id);
}

test "KnownTokens USDT has valid configuration" {
    try std.testing.expectEqualStrings("Tether USD", KnownTokens.USDT_MAINNET.name);
    try std.testing.expectEqual(@as(u64, 1), KnownTokens.USDT_MAINNET.chain_id);
}

test "KnownTokens WETH has valid configuration" {
    try std.testing.expectEqualStrings("Wrapped Ether", KnownTokens.WETH_MAINNET.name);
    try std.testing.expectEqual(@as(u64, 1), KnownTokens.WETH_MAINNET.chain_id);
}

test "KnownTokens USDC_POLYGON has correct chain ID" {
    try std.testing.expectEqualStrings("USD Coin", KnownTokens.USDC_POLYGON.name);
    try std.testing.expectEqual(@as(u64, 137), KnownTokens.USDC_POLYGON.chain_id);
}

test "KnownTokens USDC_ARBITRUM has correct chain ID" {
    try std.testing.expectEqualStrings("USD Coin", KnownTokens.USDC_ARBITRUM.name);
    try std.testing.expectEqual(@as(u64, 42161), KnownTokens.USDC_ARBITRUM.chain_id);
}

test "Permit.hash with known USDC domain produces deterministic result" {
    // Known test vector: permit for USDC mainnet
    // Owner: 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf (address from private key = 1)
    const owner = [_]u8{ 0x7e, 0x5f, 0x45, 0x52, 0x09, 0x1a, 0x69, 0x12, 0x5d, 0x5d, 0xfc, 0xb7, 0xb8, 0xc2, 0x65, 0x90, 0x29, 0x39, 0x5b, 0xdf };
    const spender = [_]u8{ 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90 };

    const permit = Permit.init(owner, spender, 1000000, 0, 1234567890);

    // Use USDC mainnet domain
    const hash1 = permit.hash(KnownTokens.USDC_MAINNET);
    const hash2 = permit.hash(KnownTokens.USDC_MAINNET);

    // Same inputs should produce same hash
    try std.testing.expectEqualSlices(u8, &hash1, &hash2);

    // Hash should be 32 bytes
    try std.testing.expectEqual(@as(usize, 32), hash1.len);
}

test "different contracts produce different domain separators" {
    const usdc_sep = KnownTokens.USDC_MAINNET.toSeparator();
    const dai_sep = KnownTokens.DAI_MAINNET.toSeparator();
    const uni_sep = KnownTokens.UNI_MAINNET.toSeparator();

    try std.testing.expect(!std.mem.eql(u8, &usdc_sep, &dai_sep));
    try std.testing.expect(!std.mem.eql(u8, &usdc_sep, &uni_sep));
    try std.testing.expect(!std.mem.eql(u8, &dai_sep, &uni_sep));
}

test "Permit.from alias works same as init" {
    const owner = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const permit1 = Permit.init(owner, spender, 1000, 0, 9999999999);
    const permit2 = Permit.from(owner, spender, 1000, 0, 9999999999);

    try std.testing.expect(permit1.equals(permit2));
}

// =============================================================================
// Permit2 Types (Uniswap Permit2 Standard)
// =============================================================================

/// PermitDetails - Token approval details for Permit2
/// Used in both PermitSingle and PermitBatch
pub const PermitDetails = struct {
    /// Token contract address
    token: [20]u8,
    /// Maximum amount allowed (u160 in Permit2, stored as u256 for convenience)
    amount: u256,
    /// Expiration timestamp (u48 in Permit2, stored as u256 for convenience)
    expiration: u256,
    /// Nonce for replay protection (u48 in Permit2, stored as u256 for convenience)
    nonce: u256,

    /// Create a new PermitDetails
    pub fn init(
        token: [20]u8,
        amount: u256,
        expiration: u256,
        nonce: u256,
    ) PermitDetails {
        return .{
            .token = token,
            .amount = amount,
            .expiration = expiration,
            .nonce = nonce,
        };
    }

    /// Alias for init
    pub const from = init;

    /// Check if two PermitDetails are equal
    pub fn equals(self: PermitDetails, other: PermitDetails) bool {
        return std.mem.eql(u8, &self.token, &other.token) and
            self.amount == other.amount and
            self.expiration == other.expiration and
            self.nonce == other.nonce;
    }

    /// Check if permit details have expired
    pub fn isExpired(self: PermitDetails, current_timestamp: u256) bool {
        return current_timestamp > self.expiration;
    }

    /// Convert to struct hash for EIP-712
    /// keccak256(abi.encode(PERMIT_DETAILS_TYPEHASH, token, amount, expiration, nonce))
    pub fn toStructHash(self: PermitDetails) [32]u8 {
        var data: [160]u8 = undefined; // 32 * 5 = 160 bytes

        // PERMIT_DETAILS_TYPEHASH
        @memcpy(data[0..32], &PERMIT_DETAILS_TYPEHASH);

        // token (padded to 32 bytes)
        @memset(data[32..44], 0);
        @memcpy(data[44..64], &self.token);

        // amount
        std.mem.writeInt(u256, data[64..96], self.amount, .big);

        // expiration
        std.mem.writeInt(u256, data[96..128], self.expiration, .big);

        // nonce
        std.mem.writeInt(u256, data[128..160], self.nonce, .big);

        var result: [32]u8 = undefined;
        Keccak256.hash(&data, &result, .{});
        return result;
    }
};

/// PermitSingle - Single token permit for Permit2
/// Used for approving one token at a time
pub const PermitSingle = struct {
    /// Token and amount details
    details: PermitDetails,
    /// Address permitted to spend the tokens
    spender: [20]u8,
    /// Deadline for the signature
    sigDeadline: u256,

    /// Create a new PermitSingle
    pub fn init(
        details: PermitDetails,
        spender: [20]u8,
        sigDeadline: u256,
    ) PermitSingle {
        return .{
            .details = details,
            .spender = spender,
            .sigDeadline = sigDeadline,
        };
    }

    /// Alias for init
    pub const from = init;

    /// Check if two PermitSingle are equal
    pub fn equals(self: PermitSingle, other: PermitSingle) bool {
        return self.details.equals(other.details) and
            std.mem.eql(u8, &self.spender, &other.spender) and
            self.sigDeadline == other.sigDeadline;
    }

    /// Check if the signature deadline has passed
    pub fn isExpired(self: PermitSingle, current_timestamp: u256) bool {
        return current_timestamp > self.sigDeadline;
    }

    /// Convert to struct hash for EIP-712
    /// keccak256(abi.encode(PERMIT_SINGLE_TYPEHASH, hashStruct(details), spender, sigDeadline))
    pub fn toStructHash(self: PermitSingle) [32]u8 {
        var data: [128]u8 = undefined; // 32 * 4 = 128 bytes

        // PERMIT_SINGLE_TYPEHASH
        @memcpy(data[0..32], &PERMIT_SINGLE_TYPEHASH);

        // hash of details struct
        const details_hash = self.details.toStructHash();
        @memcpy(data[32..64], &details_hash);

        // spender (padded to 32 bytes)
        @memset(data[64..76], 0);
        @memcpy(data[76..96], &self.spender);

        // sigDeadline
        std.mem.writeInt(u256, data[96..128], self.sigDeadline, .big);

        var result: [32]u8 = undefined;
        Keccak256.hash(&data, &result, .{});
        return result;
    }

    /// Compute full EIP-712 typed data hash for signing
    pub fn hash(self: PermitSingle, domain: Permit2Domain) [32]u8 {
        const struct_hash = self.toStructHash();
        const domain_sep = domain.toSeparator();
        return computeTypedDataHash(domain_sep, struct_hash);
    }

    /// Convert to EIP-712 typed data structure
    pub fn toTypedData(self: PermitSingle, domain: Permit2Domain) PermitSingleTypedData {
        return PermitSingleTypedData{
            .domain = domain,
            .types = &PERMIT2_TYPES.PermitSingle,
            .primary_type = "PermitSingle",
            .message = self,
        };
    }
};

/// PermitBatch - Multi-token permit for Permit2
/// Used for approving multiple tokens in a single signature
pub const PermitBatch = struct {
    /// Array of token details (up to MAX_BATCH_SIZE)
    details: []const PermitDetails,
    /// Address permitted to spend the tokens
    spender: [20]u8,
    /// Deadline for the signature
    sigDeadline: u256,

    /// Maximum batch size (prevents excessive gas usage)
    pub const MAX_BATCH_SIZE: usize = 256;

    /// Create a new PermitBatch
    pub fn init(
        details: []const PermitDetails,
        spender: [20]u8,
        sigDeadline: u256,
    ) PermitBatch {
        return .{
            .details = details,
            .spender = spender,
            .sigDeadline = sigDeadline,
        };
    }

    /// Alias for init
    pub const from = init;

    /// Check if two PermitBatch are equal
    pub fn equals(self: PermitBatch, other: PermitBatch) bool {
        if (self.details.len != other.details.len) return false;
        for (self.details, other.details) |a, b| {
            if (!a.equals(b)) return false;
        }
        return std.mem.eql(u8, &self.spender, &other.spender) and
            self.sigDeadline == other.sigDeadline;
    }

    /// Check if the signature deadline has passed
    pub fn isExpired(self: PermitBatch, current_timestamp: u256) bool {
        return current_timestamp > self.sigDeadline;
    }

    /// Convert to struct hash for EIP-712
    /// keccak256(abi.encode(PERMIT_BATCH_TYPEHASH, keccak256(abi.encodePacked(details[])), spender, sigDeadline))
    pub fn toStructHash(self: PermitBatch, allocator: std.mem.Allocator) error{OutOfMemory}![32]u8 {
        // First hash all details
        const details_hashes = try allocator.alloc([32]u8, self.details.len);
        defer allocator.free(details_hashes);

        for (self.details, 0..) |detail, i| {
            details_hashes[i] = detail.toStructHash();
        }

        // Flatten for encodePacked
        const packed_data = try allocator.alloc(u8, self.details.len * 32);
        defer allocator.free(packed_data);

        for (details_hashes, 0..) |h, i| {
            @memcpy(packed_data[i * 32 .. (i + 1) * 32], &h);
        }

        // Hash the packed details
        var details_array_hash: [32]u8 = undefined;
        Keccak256.hash(packed_data, &details_array_hash, .{});

        // Now create final struct hash
        var data: [128]u8 = undefined; // 32 * 4 = 128 bytes

        // PERMIT_BATCH_TYPEHASH
        @memcpy(data[0..32], &PERMIT_BATCH_TYPEHASH);

        // hash of details array
        @memcpy(data[32..64], &details_array_hash);

        // spender (padded to 32 bytes)
        @memset(data[64..76], 0);
        @memcpy(data[76..96], &self.spender);

        // sigDeadline
        std.mem.writeInt(u256, data[96..128], self.sigDeadline, .big);

        var result: [32]u8 = undefined;
        Keccak256.hash(&data, &result, .{});
        return result;
    }

    /// Compute full EIP-712 typed data hash for signing
    pub fn hash(self: PermitBatch, domain: Permit2Domain, allocator: std.mem.Allocator) error{OutOfMemory}![32]u8 {
        const struct_hash = try self.toStructHash(allocator);
        const domain_sep = domain.toSeparator();
        return computeTypedDataHash(domain_sep, struct_hash);
    }
};

/// EIP-712 Domain for Permit2 signatures
pub const Permit2Domain = struct {
    /// Protocol name (always "Permit2")
    name: []const u8,
    /// Chain ID
    chain_id: u64,
    /// Permit2 contract address
    verifying_contract: [20]u8,

    /// Create a new Permit2Domain
    pub fn init(
        chain_id: u64,
        verifying_contract: [20]u8,
    ) Permit2Domain {
        return .{
            .name = "Permit2",
            .chain_id = chain_id,
            .verifying_contract = verifying_contract,
        };
    }

    /// Compute domain separator hash
    pub fn toSeparator(self: Permit2Domain) [32]u8 {
        var data: [128]u8 = undefined; // 32 * 4 = 128 bytes

        // PERMIT2_DOMAIN_TYPEHASH (without version field)
        @memcpy(data[0..32], &PERMIT2_DOMAIN_TYPEHASH);

        // keccak256(name)
        var name_hash: [32]u8 = undefined;
        Keccak256.hash(self.name, &name_hash, .{});
        @memcpy(data[32..64], &name_hash);

        // chainId
        std.mem.writeInt(u256, data[64..96], self.chain_id, .big);

        // verifyingContract (padded to 32 bytes)
        @memset(data[96..108], 0);
        @memcpy(data[108..128], &self.verifying_contract);

        var result: [32]u8 = undefined;
        Keccak256.hash(&data, &result, .{});
        return result;
    }
};

/// Permit2 Domain typehash (without version)
/// keccak256("EIP712Domain(string name,uint256 chainId,address verifyingContract)")
pub const PERMIT2_DOMAIN_TYPEHASH: [32]u8 = blk: {
    var result: [32]u8 = undefined;
    Keccak256.hash("EIP712Domain(string name,uint256 chainId,address verifyingContract)", &result, .{});
    break :blk result;
};

/// PermitDetails typehash
/// keccak256("PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)")
pub const PERMIT_DETAILS_TYPEHASH: [32]u8 = blk: {
    var result: [32]u8 = undefined;
    Keccak256.hash("PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)", &result, .{});
    break :blk result;
};

/// PermitSingle typehash
/// keccak256("PermitSingle(PermitDetails details,address spender,uint256 sigDeadline)PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)")
pub const PERMIT_SINGLE_TYPEHASH: [32]u8 = blk: {
    var result: [32]u8 = undefined;
    Keccak256.hash("PermitSingle(PermitDetails details,address spender,uint256 sigDeadline)PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)", &result, .{});
    break :blk result;
};

/// PermitBatch typehash
/// keccak256("PermitBatch(PermitDetails[] details,address spender,uint256 sigDeadline)PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)")
pub const PERMIT_BATCH_TYPEHASH: [32]u8 = blk: {
    var result: [32]u8 = undefined;
    Keccak256.hash("PermitBatch(PermitDetails[] details,address spender,uint256 sigDeadline)PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)", &result, .{});
    break :blk result;
};

/// EIP-712 typed data types for Permit2
pub const PERMIT2_TYPES = struct {
    pub const PermitDetails = [_]TypeField{
        .{ .name = "token", .type_name = "address" },
        .{ .name = "amount", .type_name = "uint160" },
        .{ .name = "expiration", .type_name = "uint48" },
        .{ .name = "nonce", .type_name = "uint48" },
    };

    pub const PermitSingle = [_]TypeField{
        .{ .name = "details", .type_name = "PermitDetails" },
        .{ .name = "spender", .type_name = "address" },
        .{ .name = "sigDeadline", .type_name = "uint256" },
    };

    pub const PermitBatch = [_]TypeField{
        .{ .name = "details", .type_name = "PermitDetails[]" },
        .{ .name = "spender", .type_name = "address" },
        .{ .name = "sigDeadline", .type_name = "uint256" },
    };
};

/// EIP-712 typed data structure for PermitSingle
pub const PermitSingleTypedData = struct {
    domain: Permit2Domain,
    types: []const TypeField,
    primary_type: []const u8,
    message: PermitSingle,

    /// Compute the EIP-712 hash for this typed data
    pub fn hash(self: PermitSingleTypedData) [32]u8 {
        return self.message.hash(self.domain);
    }
};

/// Known Permit2 contract addresses
pub const Permit2Contracts = struct {
    /// Permit2 on Ethereum Mainnet
    pub const MAINNET: [20]u8 = .{
        0x00, 0x00, 0x00, 0x00, 0x00, 0x22, 0xD4, 0x73,
        0x03, 0x0F, 0x11, 0x6d, 0xDE, 0xE9, 0xF6, 0xB4,
        0x3a, 0xC7, 0x8B, 0xa3,
    };

    /// Permit2 on Polygon
    pub const POLYGON: [20]u8 = MAINNET; // Same address across chains

    /// Permit2 on Arbitrum
    pub const ARBITRUM: [20]u8 = MAINNET; // Same address across chains

    /// Permit2 on Optimism
    pub const OPTIMISM: [20]u8 = MAINNET; // Same address across chains

    /// Permit2 on Base
    pub const BASE: [20]u8 = MAINNET; // Same address across chains
};

// =============================================================================
// Permit2 Tests
// =============================================================================

test "PermitDetails.init creates struct" {
    const token = [_]u8{0x01} ** 20;

    const details = PermitDetails.init(token, 1000, 9999999999, 0);

    try std.testing.expectEqualSlices(u8, &token, &details.token);
    try std.testing.expectEqual(@as(u256, 1000), details.amount);
    try std.testing.expectEqual(@as(u256, 9999999999), details.expiration);
    try std.testing.expectEqual(@as(u256, 0), details.nonce);
}

test "PermitDetails.equals returns true for identical" {
    const token = [_]u8{0x01} ** 20;

    const d1 = PermitDetails.init(token, 1000, 9999999999, 0);
    const d2 = PermitDetails.init(token, 1000, 9999999999, 0);

    try std.testing.expect(d1.equals(d2));
}

test "PermitDetails.equals returns false for different" {
    const token = [_]u8{0x01} ** 20;

    const d1 = PermitDetails.init(token, 1000, 9999999999, 0);
    const d2 = PermitDetails.init(token, 2000, 9999999999, 0);

    try std.testing.expect(!d1.equals(d2));
}

test "PermitDetails.isExpired" {
    const token = [_]u8{0x01} ** 20;
    const details = PermitDetails.init(token, 1000, 1000000000, 0);

    try std.testing.expect(!details.isExpired(500000000));
    try std.testing.expect(details.isExpired(1000000001));
}

test "PermitDetails.toStructHash is deterministic" {
    const token = [_]u8{0x01} ** 20;
    const details = PermitDetails.init(token, 1000, 9999999999, 0);

    const hash1 = details.toStructHash();
    const hash2 = details.toStructHash();

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "PermitSingle.init creates struct" {
    const token = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const details = PermitDetails.init(token, 1000, 9999999999, 0);
    const permit = PermitSingle.init(details, spender, 9999999999);

    try std.testing.expect(permit.details.equals(details));
    try std.testing.expectEqualSlices(u8, &spender, &permit.spender);
    try std.testing.expectEqual(@as(u256, 9999999999), permit.sigDeadline);
}

test "PermitSingle.equals" {
    const token = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const details = PermitDetails.init(token, 1000, 9999999999, 0);
    const p1 = PermitSingle.init(details, spender, 9999999999);
    const p2 = PermitSingle.init(details, spender, 9999999999);

    try std.testing.expect(p1.equals(p2));
}

test "PermitSingle.toStructHash is deterministic" {
    const token = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const details = PermitDetails.init(token, 1000, 9999999999, 0);
    const permit = PermitSingle.init(details, spender, 9999999999);

    const hash1 = permit.toStructHash();
    const hash2 = permit.toStructHash();

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "PermitSingle.hash with domain" {
    const token = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const details = PermitDetails.init(token, 1000, 9999999999, 0);
    const permit = PermitSingle.init(details, spender, 9999999999);
    const domain = Permit2Domain.init(1, Permit2Contracts.MAINNET);

    const hash1 = permit.hash(domain);
    const hash2 = permit.hash(domain);

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "PermitBatch.init creates struct" {
    const token1 = [_]u8{0x01} ** 20;
    const token2 = [_]u8{0x02} ** 20;
    const spender = [_]u8{0x03} ** 20;

    const details_arr = [_]PermitDetails{
        PermitDetails.init(token1, 1000, 9999999999, 0),
        PermitDetails.init(token2, 2000, 9999999999, 1),
    };

    const batch = PermitBatch.init(&details_arr, spender, 9999999999);

    try std.testing.expectEqual(@as(usize, 2), batch.details.len);
    try std.testing.expectEqualSlices(u8, &spender, &batch.spender);
}

test "PermitBatch.equals" {
    const token1 = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x03} ** 20;

    const details_arr = [_]PermitDetails{
        PermitDetails.init(token1, 1000, 9999999999, 0),
    };

    const b1 = PermitBatch.init(&details_arr, spender, 9999999999);
    const b2 = PermitBatch.init(&details_arr, spender, 9999999999);

    try std.testing.expect(b1.equals(b2));
}

test "PermitBatch.toStructHash is deterministic" {
    const allocator = std.testing.allocator;
    const token1 = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x03} ** 20;

    const details_arr = [_]PermitDetails{
        PermitDetails.init(token1, 1000, 9999999999, 0),
    };

    const batch = PermitBatch.init(&details_arr, spender, 9999999999);

    const hash1 = try batch.toStructHash(allocator);
    const hash2 = try batch.toStructHash(allocator);

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "PermitBatch.hash with domain" {
    const allocator = std.testing.allocator;
    const token1 = [_]u8{0x01} ** 20;
    const token2 = [_]u8{0x02} ** 20;
    const spender = [_]u8{0x03} ** 20;

    const details_arr = [_]PermitDetails{
        PermitDetails.init(token1, 1000, 9999999999, 0),
        PermitDetails.init(token2, 2000, 9999999999, 1),
    };

    const batch = PermitBatch.init(&details_arr, spender, 9999999999);
    const domain = Permit2Domain.init(1, Permit2Contracts.MAINNET);

    const hash1 = try batch.hash(domain, allocator);
    const hash2 = try batch.hash(domain, allocator);

    try std.testing.expectEqualSlices(u8, &hash1, &hash2);
}

test "Permit2Domain.toSeparator is deterministic" {
    const domain = Permit2Domain.init(1, Permit2Contracts.MAINNET);

    const sep1 = domain.toSeparator();
    const sep2 = domain.toSeparator();

    try std.testing.expectEqualSlices(u8, &sep1, &sep2);
}

test "Permit2Domain differs for different chains" {
    const domain1 = Permit2Domain.init(1, Permit2Contracts.MAINNET);
    const domain2 = Permit2Domain.init(137, Permit2Contracts.POLYGON);

    const sep1 = domain1.toSeparator();
    const sep2 = domain2.toSeparator();

    try std.testing.expect(!std.mem.eql(u8, &sep1, &sep2));
}

test "PERMIT2_DOMAIN_TYPEHASH is correctly computed" {
    var expected: [32]u8 = undefined;
    Keccak256.hash("EIP712Domain(string name,uint256 chainId,address verifyingContract)", &expected, .{});

    try std.testing.expectEqualSlices(u8, &expected, &PERMIT2_DOMAIN_TYPEHASH);
}

test "PERMIT_DETAILS_TYPEHASH is correctly computed" {
    var expected: [32]u8 = undefined;
    Keccak256.hash("PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)", &expected, .{});

    try std.testing.expectEqualSlices(u8, &expected, &PERMIT_DETAILS_TYPEHASH);
}

test "PERMIT_SINGLE_TYPEHASH is correctly computed" {
    var expected: [32]u8 = undefined;
    Keccak256.hash("PermitSingle(PermitDetails details,address spender,uint256 sigDeadline)PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)", &expected, .{});

    try std.testing.expectEqualSlices(u8, &expected, &PERMIT_SINGLE_TYPEHASH);
}

test "PERMIT_BATCH_TYPEHASH is correctly computed" {
    var expected: [32]u8 = undefined;
    Keccak256.hash("PermitBatch(PermitDetails[] details,address spender,uint256 sigDeadline)PermitDetails(address token,uint160 amount,uint48 expiration,uint48 nonce)", &expected, .{});

    try std.testing.expectEqualSlices(u8, &expected, &PERMIT_BATCH_TYPEHASH);
}

test "Permit2Contracts has correct mainnet address" {
    // 0x000000000022D473030F116dDEE9F6B43aC78BA3
    const expected = [_]u8{
        0x00, 0x00, 0x00, 0x00, 0x00, 0x22, 0xD4, 0x73,
        0x03, 0x0F, 0x11, 0x6d, 0xDE, 0xE9, 0xF6, 0xB4,
        0x3a, 0xC7, 0x8B, 0xa3,
    };
    try std.testing.expectEqualSlices(u8, &expected, &Permit2Contracts.MAINNET);
}

test "PermitSingle complete workflow" {
    const token = [_]u8{0xA0} ** 20;
    const spender = [_]u8{0xB0} ** 20;

    // Create permit
    const details = PermitDetails.init(token, 1000000, 9999999999, 0);
    const permit = PermitSingle.init(details, spender, 9999999999);

    // Create domain
    const domain = Permit2Domain.init(1, Permit2Contracts.MAINNET);

    // Compute hash
    const typed_data_hash = permit.hash(domain);

    // Verify hash is 32 bytes and not all zeros
    try std.testing.expectEqual(@as(usize, 32), typed_data_hash.len);
    const zero_hash = [_]u8{0} ** 32;
    try std.testing.expect(!std.mem.eql(u8, &typed_data_hash, &zero_hash));
}

test "PermitBatch complete workflow" {
    const allocator = std.testing.allocator;
    const token1 = [_]u8{0xA0} ** 20;
    const token2 = [_]u8{0xA1} ** 20;
    const token3 = [_]u8{0xA2} ** 20;
    const spender = [_]u8{0xB0} ** 20;

    // Create permit with multiple tokens
    const details_arr = [_]PermitDetails{
        PermitDetails.init(token1, 1000000, 9999999999, 0),
        PermitDetails.init(token2, 2000000, 9999999999, 1),
        PermitDetails.init(token3, 3000000, 9999999999, 2),
    };

    const batch = PermitBatch.init(&details_arr, spender, 9999999999);

    // Create domain
    const domain = Permit2Domain.init(1, Permit2Contracts.MAINNET);

    // Compute hash
    const typed_data_hash = try batch.hash(domain, allocator);

    // Verify hash is 32 bytes and not all zeros
    try std.testing.expectEqual(@as(usize, 32), typed_data_hash.len);
    const zero_hash = [_]u8{0} ** 32;
    try std.testing.expect(!std.mem.eql(u8, &typed_data_hash, &zero_hash));
}

test "PermitSingle hash differs for different spenders" {
    const token = [_]u8{0x01} ** 20;
    const spender1 = [_]u8{0x02} ** 20;
    const spender2 = [_]u8{0x03} ** 20;

    const details = PermitDetails.init(token, 1000, 9999999999, 0);
    const permit1 = PermitSingle.init(details, spender1, 9999999999);
    const permit2 = PermitSingle.init(details, spender2, 9999999999);

    const domain = Permit2Domain.init(1, Permit2Contracts.MAINNET);

    const hash1 = permit1.hash(domain);
    const hash2 = permit2.hash(domain);

    try std.testing.expect(!std.mem.eql(u8, &hash1, &hash2));
}

test "PermitSingle.toTypedData returns correct structure" {
    const token = [_]u8{0x01} ** 20;
    const spender = [_]u8{0x02} ** 20;

    const details = PermitDetails.init(token, 1000, 9999999999, 0);
    const permit = PermitSingle.init(details, spender, 9999999999);
    const domain = Permit2Domain.init(1, Permit2Contracts.MAINNET);

    const typed_data = permit.toTypedData(domain);

    try std.testing.expectEqualStrings("PermitSingle", typed_data.primary_type);
    try std.testing.expectEqualStrings("Permit2", typed_data.domain.name);
    try std.testing.expect(typed_data.message.equals(permit));
}
