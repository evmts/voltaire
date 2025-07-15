const std = @import("std");
const testing = std.testing;
const address = @import("address.zig");
const hash = @import("hash.zig");
const crypto = @import("crypto.zig");
const rlp = @import("rlp.zig");
const Address = address.Address;
const Hash = hash.Hash;
const Allocator = std.mem.Allocator;

// EIP-7702 Authorization List

// Authorization error types
pub const AuthorizationError = error{
    InvalidChainId,
    ZeroAddress,
    InvalidSignature,
    OutOfMemory,
};

// Authorization structure
pub const Authorization = struct {
    chainId: u64,
    address: Address,
    nonce: u64,
    v: u64,
    r: [32]u8,
    s: [32]u8,
    
    pub fn authority(self: *const Authorization) !Address {
        // Recover the authority (signer) from the authorization
        const h = try self.signingHash();
        const signature = crypto.Signature{
            .v = self.v,
            .r = self.r,
            .s = self.s,
        };
        
        const allocator = std.heap.page_allocator;
        const publicKey = try crypto.recoverPublicKey(allocator, h, signature);
        return address.fromPublicKey(publicKey.bytes);
    }
    
    pub fn signingHash(self: *const Authorization) !Hash {
        const allocator = std.heap.page_allocator;
        
        // RLP encode [chain_id, address, nonce]
        var list = std.ArrayList(u8).init(allocator);
        defer list.deinit();
        
        // Encode chain_id
        try rlp.encodeUint(allocator, self.chainId, &list);
        
        // Encode address
        try rlp.encodeBytes(allocator, &self.address.bytes, &list);
        
        // Encode nonce
        try rlp.encodeUint(allocator, self.nonce, &list);
        
        // Wrap in RLP list
        var rlpList = std.ArrayList(u8).init(allocator);
        defer rlpList.deinit();
        
        if (list.items.len <= 55) {
            try rlpList.append(@as(u8, @intCast(0xc0 + list.items.len)));
        } else {
            const lenBytes = rlp.encodeLength(list.items.len);
            try rlpList.append(@as(u8, @intCast(0xf7 + lenBytes.len)));
            try rlpList.appendSlice(lenBytes);
        }
        try rlpList.appendSlice(list.items);
        
        // EIP-7702 uses keccak256(MAGIC || rlp([chain_id, address, nonce]))
        var data: [rlpList.items.len + 1]u8 = undefined;
        data[0] = 0x05; // MAGIC byte for EIP-7702
        @memcpy(data[1..], rlpList.items);
        
        return hash.keccak256(&data);
    }
    
    pub fn validate(self: *const Authorization) !void {
        // Chain ID must be non-zero
        if (self.chainId == 0) {
            return AuthorizationError.InvalidChainId;
        }
        
        // Address must not be zero
        if (self.address.isZero()) {
            return AuthorizationError.ZeroAddress;
        }
        
        // Signature must be valid
        if (!crypto.isValidSignature(.{ .v = self.v, .r = self.r, .s = self.s })) {
            return AuthorizationError.InvalidSignature;
        }
    }
};

// Create a signed authorization
pub fn createAuthorization(
    allocator: Allocator,
    chainId: u64,
    addr: Address,
    nonce: u64,
    privateKey: crypto.PrivateKey,
) !Authorization {
    var auth = Authorization{
        .chainId = chainId,
        .address = addr,
        .nonce = nonce,
        .v = 0,
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };
    
    const h = try auth.signingHash();
    const signature = try crypto.sign(allocator, privateKey, h);
    
    auth.v = signature.v;
    auth.r = signature.r;
    auth.s = signature.s;
    
    return auth;
}

// Authorization list for transaction
pub const AuthorizationList = []const Authorization;

// RLP encode authorization list
pub fn encodeAuthorizationList(allocator: Allocator, authList: AuthorizationList) ![]u8 {
    var list = std.ArrayList(u8).init(allocator);
    defer list.deinit();
    
    for (authList) |auth| {
        var authFields = std.ArrayList(u8).init(allocator);
        defer authFields.deinit();
        
        // Encode fields: [chain_id, address, nonce, v, r, s]
        try rlp.encodeUint(allocator, auth.chainId, &authFields);
        try rlp.encodeBytes(allocator, &auth.address.bytes, &authFields);
        try rlp.encodeUint(allocator, auth.nonce, &authFields);
        try rlp.encodeUint(allocator, auth.v, &authFields);
        try rlp.encodeBytes(allocator, &auth.r, &authFields);
        try rlp.encodeBytes(allocator, &auth.s, &authFields);
        
        // Wrap authorization in RLP list
        if (authFields.items.len <= 55) {
            try list.append(@as(u8, @intCast(0xc0 + authFields.items.len)));
        } else {
            const lenBytes = rlp.encodeLength(authFields.items.len);
            try list.append(@as(u8, @intCast(0xf7 + lenBytes.len)));
            try list.appendSlice(lenBytes);
        }
        try list.appendSlice(authFields.items);
    }
    
    // Wrap entire list
    var result = std.ArrayList(u8).init(allocator);
    if (list.items.len <= 55) {
        try result.append(@as(u8, @intCast(0xc0 + list.items.len)));
    } else {
        const lenBytes = rlp.encodeLength(list.items.len);
        try result.append(@as(u8, @intCast(0xf7 + lenBytes.len)));
        try result.appendSlice(lenBytes);
    }
    try result.appendSlice(list.items);
    
    return result.toOwnedSlice();
}

// Delegation designation
pub const DelegationDesignation = struct {
    authority: Address,
    delegatedAddress: Address,
    
    pub fn isActive(self: *const DelegationDesignation) bool {
        // Delegation is active if delegated address is not zero
        return !self.delegatedAddress.isZero();
    }
    
    pub fn revoke(self: *DelegationDesignation) void {
        self.delegatedAddress = Address.ZERO;
    }
};

// Batch authorization processing
pub fn processAuthorizations(
    allocator: Allocator,
    authList: AuthorizationList,
) ![]DelegationDesignation {
    var delegations = std.ArrayList(DelegationDesignation).init(allocator);
    defer delegations.deinit();
    
    for (authList) |auth| {
        // Validate authorization
        try auth.validate();
        
        // Recover authority
        const auth_addr = try auth.authority();
        
        // Create delegation
        try delegations.append(.{
            .authority = auth_addr,
            .delegatedAddress = auth.address,
        });
    }
    
    return delegations.toOwnedSlice();
}

// Gas costs for EIP-7702
pub const PER_EMPTY_ACCOUNT_COST = 25000;
pub const PER_AUTH_BASE_COST = 12500;

pub fn calculateAuthorizationGasCost(authList: AuthorizationList, emptyAccounts: usize) u64 {
    const authCost = authList.len * PER_AUTH_BASE_COST;
    const emptyCost = emptyAccounts * PER_EMPTY_ACCOUNT_COST;
    return authCost + emptyCost;
}

// Tests

test "authorization creation and recovery" {
    const allocator = testing.allocator;
    
    const privateKey = crypto.PrivateKey{
        .bytes = [_]u8{0x42} ** 32,
    };
    
    const signerAddress = try crypto.getAddress(allocator, privateKey);
    const targetAddress = try Address.fromHex("0x1111111111111111111111111111111111111111");
    
    const auth = try createAuthorization(
        allocator,
        1, // chain_id
        targetAddress,
        0, // nonce
        privateKey,
    );
    
    // Validate
    try auth.validate();
    
    // Recover authority
    const auth_addr = try auth.authority();
    try testing.expectEqual(signerAddress, auth_addr);
}

test "authorization validation" {
    var auth = Authorization{
        .chainId = 1,
        .address = try Address.fromHex("0x1111111111111111111111111111111111111111"),
        .nonce = 0,
        .v = 27,
        .r = [_]u8{0x12} ** 32,
        .s = [_]u8{0x34} ** 32,
    };
    
    // Valid
    try auth.validate();
    
    // Invalid chain ID
    auth.chainId = 0;
    try testing.expectError(AuthorizationError.InvalidChainId, auth.validate());
    auth.chainId = 1;
    
    // Zero address
    auth.address = Address.ZERO;
    try testing.expectError(AuthorizationError.ZeroAddress, auth.validate());
}

test "authorization list encoding" {
    const allocator = testing.allocator;
    
    const privateKey = crypto.PrivateKey{
        .bytes = [_]u8{0x42} ** 32,
    };
    
    const auth1 = try createAuthorization(
        allocator,
        1,
        try Address.fromHex("0x1111111111111111111111111111111111111111"),
        0,
        privateKey,
    );
    
    const auth2 = try createAuthorization(
        allocator,
        1,
        try Address.fromHex("0x2222222222222222222222222222222222222222"),
        1,
        privateKey,
    );
    
    const authList = [_]Authorization{ auth1, auth2 };
    
    const encoded = try encodeAuthorizationList(allocator, &authList);
    defer allocator.free(encoded);
    
    // Should produce valid RLP
    try testing.expect(encoded.len > 0);
    try testing.expect(encoded[0] >= 0xc0); // RLP list prefix
}

test "delegation designation" {
    var delegation = DelegationDesignation{
        .authority = try Address.fromHex("0x1111111111111111111111111111111111111111"),
        .delegatedAddress = try Address.fromHex("0x2222222222222222222222222222222222222222"),
    };
    
    // Should be active
    try testing.expect(delegation.isActive());
    
    // Revoke delegation
    delegation.revoke();
    try testing.expect(!delegation.isActive());
    try testing.expectEqual(Address.ZERO, delegation.delegatedAddress);
}

test "batch authorization processing" {
    const allocator = testing.allocator;
    
    const privateKey1 = crypto.PrivateKey{
        .bytes = [_]u8{0x01} ** 32,
    };
    const privateKey2 = crypto.PrivateKey{
        .bytes = [_]u8{0x02} ** 32,
    };
    
    const auth1 = try createAuthorization(
        allocator,
        1,
        try Address.fromHex("0x1111111111111111111111111111111111111111"),
        0,
        privateKey1,
    );
    
    const auth2 = try createAuthorization(
        allocator,
        1,
        try Address.fromHex("0x2222222222222222222222222222222222222222"),
        0,
        privateKey2,
    );
    
    const authList = [_]Authorization{ auth1, auth2 };
    
    const delegations = try processAuthorizations(allocator, &authList);
    defer allocator.free(delegations);
    
    try testing.expectEqual(@as(usize, 2), delegations.len);
    try testing.expect(delegations[0].isActive());
    try testing.expect(delegations[1].isActive());
}

test "authorization gas cost calculation" {
    const authList = [_]Authorization{
        .{
            .chainId = 1,
            .address = try Address.fromHex("0x1111111111111111111111111111111111111111"),
            .nonce = 0,
            .v = 27,
            .r = [_]u8{0x12} ** 32,
            .s = [_]u8{0x34} ** 32,
        },
        .{
            .chainId = 1,
            .address = try Address.fromHex("0x2222222222222222222222222222222222222222"),
            .nonce = 0,
            .v = 27,
            .r = [_]u8{0x56} ** 32,
            .s = [_]u8{0x78} ** 32,
        },
    };
    
    // 2 authorizations, 1 empty account
    const gasCost = calculateAuthorizationGasCost(&authList, 1);
    
    // Expected: 2 * 12500 + 1 * 25000 = 50000
    try testing.expectEqual(@as(u64, 50000), gasCost);
}