//! Domain - EIP-712 Domain Separator Structure
//!
//! Used to create domain-specific signatures for dApps. At least one field
//! must be defined (name, version, chain_id, verifying_contract, or salt).
//!
//! ## Usage
//! ```zig
//! const Domain = @import("primitives").Domain;
//! const crypto = @import("crypto");
//!
//! // Create domain
//! var domain = Domain{
//!     .name = "MyDApp",
//!     .version = "1",
//!     .chain_id = 1,
//!     .verifying_contract = address,
//!     .salt = null,
//! };
//!
//! // Compute domain separator hash
//! const sep = domain.toHash(allocator);
//! ```

const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;
const DomainSeparator = primitives.DomainSeparator;
const crypto = @import("crypto");

/// EIP-712 field definition
pub const EIP712Field = struct {
    name: []const u8,
    type: []const u8,
};

/// EIP-712 Domain Separator structure
pub const Domain = struct {
    /// dApp name
    name: ?[]const u8 = null,
    /// Domain version
    version: ?[]const u8 = null,
    /// EIP-155 chain ID
    chain_id: ?u64 = null,
    /// Contract address
    verifying_contract: ?Address = null,
    /// Salt for disambiguation
    salt: ?[32]u8 = null,

    /// Validate domain has at least one field
    pub fn validate(self: Domain) !void {
        if (self.name == null and
            self.version == null and
            self.chain_id == null and
            self.verifying_contract == null and
            self.salt == null)
        {
            return error.InvalidDomain;
        }
    }

    /// Get EIP712Domain type fields for this domain (allocates buffer)
    pub fn getEIP712DomainType(self: Domain, buffer: *[5]EIP712Field) []const EIP712Field {
        var count: usize = 0;

        if (self.name != null) {
            buffer[count] = EIP712Field{ .name = "name", .type = "string" };
            count += 1;
        }
        if (self.version != null) {
            buffer[count] = EIP712Field{ .name = "version", .type = "string" };
            count += 1;
        }
        if (self.chain_id != null) {
            buffer[count] = EIP712Field{ .name = "chainId", .type = "uint256" };
            count += 1;
        }
        if (self.verifying_contract != null) {
            buffer[count] = EIP712Field{ .name = "verifyingContract", .type = "address" };
            count += 1;
        }
        if (self.salt != null) {
            buffer[count] = EIP712Field{ .name = "salt", .type = "bytes32" };
            count += 1;
        }

        return buffer[0..count];
    }

    /// Get the type string for EIP712Domain
    pub fn getTypeString(self: Domain, allocator: std.mem.Allocator) ![]u8 {
        var parts = std.ArrayList([]const u8){};
        defer parts.deinit(allocator);

        if (self.name != null) try parts.append(allocator, "string name");
        if (self.version != null) try parts.append(allocator, "string version");
        if (self.chain_id != null) try parts.append(allocator, "uint256 chainId");
        if (self.verifying_contract != null) try parts.append(allocator, "address verifyingContract");
        if (self.salt != null) try parts.append(allocator, "bytes32 salt");

        // Join with commas
        var result = std.ArrayList(u8){};
        defer result.deinit(allocator);

        try result.appendSlice(allocator, "EIP712Domain(");
        for (parts.items, 0..) |part, i| {
            if (i > 0) try result.append(allocator, ',');
            try result.appendSlice(allocator, part);
        }
        try result.append(allocator, ')');

        return try result.toOwnedSlice(allocator);
    }

    /// Compute the domain separator hash
    /// Returns the keccak256 hash of the encoded domain
    pub fn toHash(self: Domain, allocator: std.mem.Allocator) !DomainSeparator {
        try self.validate();

        // Get type string: "EIP712Domain(string name,string version,...)"
        const type_string = try self.getTypeString(allocator);
        defer allocator.free(type_string);

        // Compute typeHash = keccak256(typeString)
        var type_hash: [32]u8 = undefined;
        crypto.Keccak256.hash(type_string, &type_hash);

        // Encode domain data
        var encoded_data = std.ArrayList(u8){};
        defer encoded_data.deinit(allocator);

        // Start with type hash
        try encoded_data.appendSlice(allocator, &type_hash);

        // Add encoded fields in order
        if (self.name) |name| {
            // keccak256(name)
            var name_hash: [32]u8 = undefined;
            crypto.Keccak256.hash(name, &name_hash);
            try encoded_data.appendSlice(allocator, &name_hash);
        }

        if (self.version) |version| {
            // keccak256(version)
            var version_hash: [32]u8 = undefined;
            crypto.Keccak256.hash(version, &version_hash);
            try encoded_data.appendSlice(allocator, &version_hash);
        }

        if (self.chain_id) |chain_id| {
            // uint256 encoded (32 bytes, big-endian)
            var chain_bytes: [32]u8 = [_]u8{0} ** 32;
            std.mem.writeInt(u64, chain_bytes[24..32], chain_id, .big);
            try encoded_data.appendSlice(allocator, &chain_bytes);
        }

        if (self.verifying_contract) |addr| {
            // address encoded (left-padded to 32 bytes)
            var addr_bytes: [32]u8 = [_]u8{0} ** 32;
            @memcpy(addr_bytes[12..32], &addr.bytes);
            try encoded_data.appendSlice(allocator, &addr_bytes);
        }

        if (self.salt) |salt| {
            // bytes32 as-is
            try encoded_data.appendSlice(allocator, &salt);
        }

        // Hash the encoded data
        var result: [32]u8 = undefined;
        crypto.Keccak256.hash(encoded_data.items, &result);

        return DomainSeparator.from(result);
    }

    /// Check if two domains are equal
    pub fn equals(self: Domain, other: Domain) bool {
        // Compare names
        if (self.name == null and other.name != null) return false;
        if (self.name != null and other.name == null) return false;
        if (self.name != null and other.name != null) {
            if (!std.mem.eql(u8, self.name.?, other.name.?)) return false;
        }

        // Compare versions
        if (self.version == null and other.version != null) return false;
        if (self.version != null and other.version == null) return false;
        if (self.version != null and other.version != null) {
            if (!std.mem.eql(u8, self.version.?, other.version.?)) return false;
        }

        // Compare chain_id
        if (self.chain_id == null and other.chain_id != null) return false;
        if (self.chain_id != null and other.chain_id == null) return false;
        if (self.chain_id != null and other.chain_id != null) {
            if (self.chain_id.? != other.chain_id.?) return false;
        }

        // Compare verifying_contract
        if (self.verifying_contract == null and other.verifying_contract != null) return false;
        if (self.verifying_contract != null and other.verifying_contract == null) return false;
        if (self.verifying_contract != null and other.verifying_contract != null) {
            if (!self.verifying_contract.?.equals(other.verifying_contract.?)) return false;
        }

        // Compare salt
        if (self.salt == null and other.salt != null) return false;
        if (self.salt != null and other.salt == null) return false;
        if (self.salt != null and other.salt != null) {
            if (!std.mem.eql(u8, &self.salt.?, &other.salt.?)) return false;
        }

        return true;
    }

    /// Get ERC-5267 fields bitmap
    pub fn getFieldsBitmap(self: Domain) u8 {
        var bitmap: u8 = 0;
        if (self.name != null) bitmap |= 0x01;
        if (self.version != null) bitmap |= 0x02;
        if (self.chain_id != null) bitmap |= 0x04;
        if (self.verifying_contract != null) bitmap |= 0x08;
        if (self.salt != null) bitmap |= 0x10;
        return bitmap;
    }

    /// ERC-5267 response structure
    pub const Erc5267Response = struct {
        fields: u8,
        name: []const u8,
        version: []const u8,
        chain_id: u64,
        verifying_contract: Address,
        salt: [32]u8,
    };

    /// Convert to ERC-5267 eip712Domain() response format
    /// Per ERC-5267, missing fields are filled with default values
    /// https://eips.ethereum.org/EIPS/eip-5267
    pub fn toErc5267Response(self: Domain) Erc5267Response {
        return Erc5267Response{
            .fields = self.getFieldsBitmap(),
            .name = self.name orelse "",
            .version = self.version orelse "",
            .chain_id = self.chain_id orelse 0,
            .verifying_contract = self.verifying_contract orelse Address.ZERO_ADDRESS,
            .salt = self.salt orelse [_]u8{0} ** 32,
        };
    }
};

// ============================================================================
// Tests
// ============================================================================

test "Domain: validate succeeds with name" {
    const domain = Domain{ .name = "Test" };
    try domain.validate();
}

test "Domain: validate succeeds with version" {
    const domain = Domain{ .version = "1" };
    try domain.validate();
}

test "Domain: validate succeeds with chain_id" {
    const domain = Domain{ .chain_id = 1 };
    try domain.validate();
}

test "Domain: validate succeeds with verifying_contract" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const domain = Domain{ .verifying_contract = addr };
    try domain.validate();
}

test "Domain: validate succeeds with salt" {
    const domain = Domain{ .salt = [_]u8{0xab} ** 32 };
    try domain.validate();
}

test "Domain: validate fails with no fields" {
    const domain = Domain{};
    try std.testing.expectError(error.InvalidDomain, domain.validate());
}

test "Domain: getTypeString with all fields" {
    const allocator = std.testing.allocator;
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const domain = Domain{
        .name = "Test",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = addr,
        .salt = [_]u8{0} ** 32,
    };

    const type_string = try domain.getTypeString(allocator);
    defer allocator.free(type_string);

    try std.testing.expectEqualStrings(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract,bytes32 salt)",
        type_string,
    );
}

test "Domain: getTypeString with name only" {
    const allocator = std.testing.allocator;
    const domain = Domain{ .name = "Test" };

    const type_string = try domain.getTypeString(allocator);
    defer allocator.free(type_string);

    try std.testing.expectEqualStrings("EIP712Domain(string name)", type_string);
}

test "Domain: getTypeString with name and version" {
    const allocator = std.testing.allocator;
    const domain = Domain{
        .name = "Test",
        .version = "1",
    };

    const type_string = try domain.getTypeString(allocator);
    defer allocator.free(type_string);

    try std.testing.expectEqualStrings("EIP712Domain(string name,string version)", type_string);
}

test "Domain: toHash produces consistent result" {
    const allocator = std.testing.allocator;
    const domain = Domain{
        .name = "Test",
        .version = "1",
        .chain_id = 1,
    };

    const hash1 = try domain.toHash(allocator);
    const hash2 = try domain.toHash(allocator);

    try std.testing.expect(hash1.equals(hash2));
}

test "Domain: toHash different domains produce different hashes" {
    const allocator = std.testing.allocator;
    const domain1 = Domain{ .name = "Test1" };
    const domain2 = Domain{ .name = "Test2" };

    const hash1 = try domain1.toHash(allocator);
    const hash2 = try domain2.toHash(allocator);

    try std.testing.expect(!hash1.equals(hash2));
}

test "Domain: equals same domain" {
    const domain = Domain{
        .name = "Test",
        .version = "1",
    };
    try std.testing.expect(domain.equals(domain));
}

test "Domain: equals identical domains" {
    const a = Domain{
        .name = "Test",
        .version = "1",
        .chain_id = 1,
    };
    const b = Domain{
        .name = "Test",
        .version = "1",
        .chain_id = 1,
    };
    try std.testing.expect(a.equals(b));
}

test "Domain: equals different names" {
    const a = Domain{ .name = "Test1" };
    const b = Domain{ .name = "Test2" };
    try std.testing.expect(!a.equals(b));
}

test "Domain: equals different versions" {
    const a = Domain{ .name = "Test", .version = "1" };
    const b = Domain{ .name = "Test", .version = "2" };
    try std.testing.expect(!a.equals(b));
}

test "Domain: equals different chain_id" {
    const a = Domain{ .name = "Test", .chain_id = 1 };
    const b = Domain{ .name = "Test", .chain_id = 5 };
    try std.testing.expect(!a.equals(b));
}

test "Domain: equals null vs non-null" {
    const a = Domain{ .name = "Test" };
    const b = Domain{ .name = "Test", .version = "1" };
    try std.testing.expect(!a.equals(b));
}

test "Domain: getFieldsBitmap" {
    const domain_name = Domain{ .name = "Test" };
    try std.testing.expectEqual(@as(u8, 0x01), domain_name.getFieldsBitmap());

    const domain_version = Domain{ .version = "1" };
    try std.testing.expectEqual(@as(u8, 0x02), domain_version.getFieldsBitmap());

    const domain_chain = Domain{ .chain_id = 1 };
    try std.testing.expectEqual(@as(u8, 0x04), domain_chain.getFieldsBitmap());

    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const domain_contract = Domain{ .verifying_contract = addr };
    try std.testing.expectEqual(@as(u8, 0x08), domain_contract.getFieldsBitmap());

    const domain_salt = Domain{ .salt = [_]u8{0} ** 32 };
    try std.testing.expectEqual(@as(u8, 0x10), domain_salt.getFieldsBitmap());

    const domain_all = Domain{
        .name = "Test",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = addr,
        .salt = [_]u8{0} ** 32,
    };
    try std.testing.expectEqual(@as(u8, 0x1f), domain_all.getFieldsBitmap());
}

test "Domain: known test vector from EIP-712 spec" {
    // Test against known EIP-712 domain separator from the official spec
    // https://eips.ethereum.org/EIPS/eip-712
    // Domain: name="Ether Mail", version="1", chainId=1,
    //         verifyingContract=0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC
    // Expected hash: 0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f
    const allocator = std.testing.allocator;
    const domain = Domain{
        .name = "Ether Mail",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = try Address.fromHex("0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"),
    };

    const hash = try domain.toHash(allocator);

    // Verify against expected EIP-712 domain separator
    const expected = try DomainSeparator.fromHex("0xf2cee375fa42b42143804025fc449deafd50cc031ca257e0b194a650a912090f");
    try std.testing.expect(hash.equals(expected));
}

test "Domain: getEIP712DomainType with all fields" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const domain = Domain{
        .name = "Test",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = addr,
        .salt = [_]u8{0} ** 32,
    };

    var buffer: [5]EIP712Field = undefined;
    const fields = domain.getEIP712DomainType(&buffer);

    try std.testing.expectEqual(@as(usize, 5), fields.len);
    try std.testing.expectEqualStrings("name", fields[0].name);
    try std.testing.expectEqualStrings("string", fields[0].type);
    try std.testing.expectEqualStrings("version", fields[1].name);
    try std.testing.expectEqualStrings("string", fields[1].type);
    try std.testing.expectEqualStrings("chainId", fields[2].name);
    try std.testing.expectEqualStrings("uint256", fields[2].type);
    try std.testing.expectEqualStrings("verifyingContract", fields[3].name);
    try std.testing.expectEqualStrings("address", fields[3].type);
    try std.testing.expectEqualStrings("salt", fields[4].name);
    try std.testing.expectEqualStrings("bytes32", fields[4].type);
}

test "Domain: getEIP712DomainType with partial fields" {
    const domain = Domain{
        .name = "Test",
        .chain_id = 1,
    };

    var buffer: [5]EIP712Field = undefined;
    const fields = domain.getEIP712DomainType(&buffer);

    try std.testing.expectEqual(@as(usize, 2), fields.len);
    try std.testing.expectEqualStrings("name", fields[0].name);
    try std.testing.expectEqualStrings("chainId", fields[1].name);
}

test "Domain: typeHash for EIP712Domain" {
    // Verify the type hash matches expected keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
    const allocator = std.testing.allocator;
    const domain = Domain{
        .name = "Ether Mail",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = try Address.fromHex("0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC"),
    };

    const type_string = try domain.getTypeString(allocator);
    defer allocator.free(type_string);

    // Verify type string is correct
    try std.testing.expectEqualStrings(
        "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)",
        type_string,
    );
}

test "Domain: typeHash with salt field" {
    const allocator = std.testing.allocator;
    const domain = Domain{
        .name = "Test",
        .version = "1",
        .chain_id = 1,
        .salt = [_]u8{0xab} ** 32,
    };

    const type_string = try domain.getTypeString(allocator);
    defer allocator.free(type_string);

    // Verify type string includes salt
    try std.testing.expectEqualStrings(
        "EIP712Domain(string name,string version,uint256 chainId,bytes32 salt)",
        type_string,
    );
}

test "Domain: domain separator with only name" {
    const allocator = std.testing.allocator;
    const domain = Domain{
        .name = "SimpleDapp",
    };

    const type_string = try domain.getTypeString(allocator);
    defer allocator.free(type_string);

    try std.testing.expectEqualStrings(
        "EIP712Domain(string name)",
        type_string,
    );

    // Verify toHash works for minimal domain
    const hash = try domain.toHash(allocator);
    try std.testing.expect(!hash.isZero());
}

test "Domain: toErc5267Response with all fields" {
    const addr = try Address.fromHex("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
    const domain = Domain{
        .name = "Test",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = addr,
        .salt = [_]u8{0xab} ** 32,
    };

    const response = domain.toErc5267Response();

    try std.testing.expectEqual(@as(u8, 0x1f), response.fields);
    try std.testing.expectEqualStrings("Test", response.name);
    try std.testing.expectEqualStrings("1", response.version);
    try std.testing.expectEqual(@as(u64, 1), response.chain_id);
    try std.testing.expect(response.verifying_contract.equals(addr));
    try std.testing.expectEqual([_]u8{0xab} ** 32, response.salt);
}

test "Domain: toErc5267Response with partial fields uses defaults" {
    const domain = Domain{
        .name = "Test",
        .chain_id = 1,
    };

    const response = domain.toErc5267Response();

    try std.testing.expectEqual(@as(u8, 0x05), response.fields); // name + chain_id
    try std.testing.expectEqualStrings("Test", response.name);
    try std.testing.expectEqualStrings("", response.version); // default empty
    try std.testing.expectEqual(@as(u64, 1), response.chain_id);
    try std.testing.expect(response.verifying_contract.equals(Address.ZERO_ADDRESS)); // default zero
    try std.testing.expectEqual([_]u8{0} ** 32, response.salt); // default zeros
}
