const std = @import("std");
const testing = std.testing;
const Address = @import("address/address.zig");
const Hash = @import("hash_utils.zig");
const Crypto = @import("crypto.zig");
const primitives = @import("primitives");

// EIP-7702 Authorization List
pub const Authorization = struct {
    chain_id: u64,
    address: primitives.Address.Address,
    nonce: u64,
    v: u64,
    r: [32]u8,
    s: [32]u8,
    
    pub fn authority(self: *const Authorization) !primitives.Address.Address {
        // Recover the authority (signer) from the authorization
        const hash = try self.signing_hash();
        const signature = Crypto.Signature{
            .v = self.v,
            .r = self.r,
            .s = self.s,
        };
        
        const allocator = std.heap.page_allocator;
        const public_key = try Crypto.recover_public_key(allocator, hash, signature);
        return Address.from_public_key(public_key.bytes);
    }
    
    pub fn signing_hash(self: *const Authorization) !Hash.Hash {
        const allocator = std.heap.page_allocator;
        
        // RLP encode [chain_id, address, nonce]
        var list = std.ArrayList(u8).init(allocator);
        defer list.deinit();
        
        // Encode chain_id
        try primitives.Rlp.encode_uint(allocator, self.chain_id, &list);
        
        // Encode address
        try primitives.Rlp.encode_bytes(allocator, &self.address, &list);
        
        // Encode nonce
        try primitives.Rlp.encode_uint(allocator, self.nonce, &list);
        
        // Wrap in RLP list
        var rlp_list = std.ArrayList(u8).init(allocator);
        defer rlp_list.deinit();
        
        if (list.items.len <= 55) {
            try rlp_list.append(@as(u8, @intCast(0xc0 + list.items.len)));
        } else {
            const len_bytes = primitives.Rlp.encode_length(list.items.len);
            try rlp_list.append(@as(u8, @intCast(0xf7 + len_bytes.len)));
            try rlp_list.appendSlice(len_bytes);
        }
        try rlp_list.appendSlice(list.items);
        
        // EIP-7702 uses keccak256(MAGIC || rlp([chain_id, address, nonce]))
        var data: [rlp_list.items.len + 1]u8 = undefined;
        data[0] = 0x05; // MAGIC byte for EIP-7702
        @memcpy(data[1..], rlp_list.items);
        
        return Hash.keccak256(&data);
    }
    
    pub fn validate(self: *const Authorization) !void {
        // Chain ID must be non-zero
        if (self.chain_id == 0) {
            return error.InvalidChainId;
        }
        
        // Address must not be zero
        if (Address.is_zero(self.address)) {
            return error.ZeroAddress;
        }
        
        // Signature must be valid
        if (!Crypto.is_valid_signature(.{ .v = self.v, .r = self.r, .s = self.s })) {
            return error.InvalidSignature;
        }
    }
};

// Create a signed authorization
pub fn create_authorization(
    allocator: std.mem.Allocator,
    chain_id: u64,
    address: primitives.Address.Address,
    nonce: u64,
    private_key: Crypto.PrivateKey,
) !Authorization {
    var auth = Authorization{
        .chain_id = chain_id,
        .address = address,
        .nonce = nonce,
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };
    
    const hash = try auth.signing_hash();
    const signature = try Crypto.sign(allocator, private_key, hash);
    
    auth.v = signature.v;
    auth.r = signature.r;
    auth.s = signature.s;
    
    return auth;
}

// Test basic authorization
test "authorization creation and recovery" {
    const allocator = testing.allocator;
    
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{0x42} ** 32,
    };
    
    const signer_address = try Crypto.get_address(allocator, private_key);
    const target_address = primitives.Address.from_hex_comptime("0x1111111111111111111111111111111111111111");
    
    const auth = try create_authorization(
        allocator,
        1, // chain_id
        target_address,
        0, // nonce
        private_key,
    );
    
    // Validate
    try auth.validate();
    
    // Recover authority
    const authority = try auth.authority();
    try testing.expectEqual(signer_address, authority);
}

test "authorization validation" {
    var auth = Authorization{
        .chain_id = 1,
        .address = primitives.Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
        .nonce = 0,
        .v = 27,
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{0x34} ** 32,
    };
    
    // Valid
    try auth.validate();
    
    // Invalid chain ID
    auth.chain_id = 0;
    try testing.expectError(error.InvalidChainId, auth.validate());
    auth.chain_id = 1;
    
    // Zero address
    auth.address = Address.ZERO;
    try testing.expectError(error.ZeroAddress, auth.validate());
}

// Authorization list for transaction
pub const AuthorizationList = []const Authorization;

// RLP encode authorization list
pub fn encode_authorization_list(allocator: std.mem.Allocator, auth_list: AuthorizationList) ![]u8 {
    var list = std.ArrayList(u8).init(allocator);
    defer list.deinit();
    
    for (auth_list) |auth| {
        var auth_fields = std.ArrayList(u8).init(allocator);
        defer auth_fields.deinit();
        
        // Encode fields: [chain_id, address, nonce, v, r, s]
        try primitives.Rlp.encode_uint(allocator, auth.chain_id, &auth_fields);
        try primitives.Rlp.encode_bytes(allocator, &auth.address, &auth_fields);
        try primitives.Rlp.encode_uint(allocator, auth.nonce, &auth_fields);
        try primitives.Rlp.encode_uint(allocator, auth.v, &auth_fields);
        try primitives.Rlp.encode_bytes(allocator, &auth.r, &auth_fields);
        try primitives.Rlp.encode_bytes(allocator, &auth.s, &auth_fields);
        
        // Wrap authorization in RLP list
        if (auth_fields.items.len <= 55) {
            try list.append(@as(u8, @intCast(0xc0 + auth_fields.items.len)));
        } else {
            const len_bytes = primitives.Rlp.encode_length(auth_fields.items.len);
            try list.append(@as(u8, @intCast(0xf7 + len_bytes.len)));
            try list.appendSlice(len_bytes);
        }
        try list.appendSlice(auth_fields.items);
    }
    
    // Wrap entire list
    var result = std.ArrayList(u8).init(allocator);
    if (list.items.len <= 55) {
        try result.append(@as(u8, @intCast(0xc0 + list.items.len)));
    } else {
        const len_bytes = primitives.Rlp.encode_length(list.items.len);
        try result.append(@as(u8, @intCast(0xf7 + len_bytes.len)));
        try result.appendSlice(len_bytes);
    }
    try result.appendSlice(list.items);
    
    return result.toOwnedSlice();
}

test "authorization list encoding" {
    const allocator = testing.allocator;
    
    const private_key = Crypto.PrivateKey{
        .bytes = [_]u8{0x42} ** 32,
    };
    
    const auth1 = try create_authorization(
        allocator,
        1,
        primitives.Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
        0,
        private_key,
    );
    
    const auth2 = try create_authorization(
        allocator,
        1,
        primitives.Address.from_hex_comptime("0x2222222222222222222222222222222222222222"),
        1,
        private_key,
    );
    
    const auth_list = [_]Authorization{ auth1, auth2 };
    
    const encoded = try encode_authorization_list(allocator, &auth_list);
    defer allocator.free(encoded);
    
    // Should produce valid RLP
    try testing.expect(encoded.len > 0);
    try testing.expect(encoded[0] >= 0xc0); // RLP list prefix
}

// Delegation designation
pub const DelegationDesignation = struct {
    authority: primitives.Address.Address,
    delegated_address: primitives.Address.Address,
    
    pub fn is_active(self: *const DelegationDesignation) bool {
        // Delegation is active if delegated address is not zero
        return !Address.is_zero(self.delegated_address);
    }
    
    pub fn revoke(self: *DelegationDesignation) void {
        self.delegated_address = Address.ZERO;
    }
};

test "delegation designation" {
    var delegation = DelegationDesignation{
        .authority = primitives.Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
        .delegated_address = primitives.Address.from_hex_comptime("0x2222222222222222222222222222222222222222"),
    };
    
    // Should be active
    try testing.expect(delegation.is_active());
    
    // Revoke delegation
    delegation.revoke();
    try testing.expect(!delegation.is_active());
    try testing.expectEqual(Address.ZERO, delegation.delegated_address);
}

// Batch authorization processing
pub fn process_authorizations(
    allocator: std.mem.Allocator,
    auth_list: AuthorizationList,
) ![]DelegationDesignation {
    var delegations = std.ArrayList(DelegationDesignation).init(allocator);
    defer delegations.deinit();
    
    for (auth_list) |auth| {
        // Validate authorization
        try auth.validate();
        
        // Recover authority
        const authority = try auth.authority();
        
        // Create delegation
        try delegations.append(.{
            .authority = authority,
            .delegated_address = auth.address,
        });
    }
    
    return delegations.toOwnedSlice();
}

test "batch authorization processing" {
    const allocator = testing.allocator;
    
    const private_key1 = Crypto.PrivateKey{
        .bytes = [_]u8{0x01} ** 32,
    };
    const private_key2 = Crypto.PrivateKey{
        .bytes = [_]u8{0x02} ** 32,
    };
    
    const auth1 = try create_authorization(
        allocator,
        1,
        primitives.Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
        0,
        private_key1,
    );
    
    const auth2 = try create_authorization(
        allocator,
        1,
        primitives.Address.from_hex_comptime("0x2222222222222222222222222222222222222222"),
        0,
        private_key2,
    );
    
    const auth_list = [_]Authorization{ auth1, auth2 };
    
    const delegations = try process_authorizations(allocator, &auth_list);
    defer allocator.free(delegations);
    
    try testing.expectEqual(@as(usize, 2), delegations.len);
    try testing.expect(delegations[0].is_active());
    try testing.expect(delegations[1].is_active());
}

// Gas costs for EIP-7702
pub const PER_EMPTY_ACCOUNT_COST = 25000;
pub const PER_AUTH_BASE_COST = 12500;

pub fn calculate_authorization_gas_cost(auth_list: AuthorizationList, empty_accounts: usize) u64 {
    const auth_cost = auth_list.len * PER_AUTH_BASE_COST;
    const empty_cost = empty_accounts * PER_EMPTY_ACCOUNT_COST;
    return auth_cost + empty_cost;
}

test "authorization gas cost calculation" {
    const auth_list = [_]Authorization{
        .{
            .chain_id = 1,
            .address = primitives.Address.from_hex_comptime("0x1111111111111111111111111111111111111111"),
            .nonce = 0,
            .v = 27,
            .r = [_]u8{0x12} ** 32,
            .s = [_]u8{0x34} ** 32,
        },
        .{
            .chain_id = 1,
            .address = primitives.Address.from_hex_comptime("0x2222222222222222222222222222222222222222"),
            .nonce = 0,
            .v = 27,
            .r = [_]u8{0x56} ** 32,
            .s = [_]u8{0x78} ** 32,
        },
    };
    
    // 2 authorizations, 1 empty account
    const gas_cost = calculate_authorization_gas_cost(&auth_list, 1);
    
    // Expected: 2 * 12500 + 1 * 25000 = 50000
    try testing.expectEqual(@as(u64, 50000), gas_cost);
}