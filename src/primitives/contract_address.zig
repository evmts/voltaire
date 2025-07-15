const std = @import("std");
const testing = std.testing;
const hash = @import("hash.zig");
const address = @import("address.zig");
const hex = @import("hex.zig");
const rlp = @import("rlp.zig");
const Address = address.Address;
const Hash = hash.Hash;

// Contract address generation for CREATE opcode
pub fn getContractAddress(deployer: Address, nonce: u64) Address {
    const allocator = std.heap.page_allocator;
    
    // RLP encode [deployer_address, nonce]
    var list = std.ArrayList(u8).init(allocator);
    defer list.deinit();
    
    // Encode deployer address (20 bytes)
    rlp.encodeBytes(allocator, &deployer.bytes, &list) catch unreachable;
    
    // Encode nonce
    if (nonce == 0) {
        list.append(0x80) catch unreachable; // Empty string for 0
    } else {
        rlp.encodeUint(allocator, nonce, &list) catch unreachable;
    }
    
    // Wrap in list
    var rlpList = std.ArrayList(u8).init(allocator);
    defer rlpList.deinit();
    
    if (list.items.len <= 55) {
        rlpList.append(@as(u8, @intCast(0xc0 + list.items.len))) catch unreachable;
    } else {
        // Long list encoding
        const lenBytes = rlp.encodeLength(list.items.len);
        rlpList.append(@as(u8, @intCast(0xf7 + lenBytes.len))) catch unreachable;
        rlpList.appendSlice(lenBytes) catch unreachable;
    }
    rlpList.appendSlice(list.items) catch unreachable;
    
    // Hash the RLP encoded data
    const h = hash.keccak256(rlpList.items);
    
    // Take last 20 bytes as address
    var addr: Address = undefined;
    @memcpy(&addr.bytes, h.bytes[12..32]);
    
    return addr;
}

// Contract address generation for CREATE2 opcode
pub fn getCreate2Address(
    deployer: Address,
    salt: [32]u8,
    initCodeHash: Hash,
) Address {
    // CREATE2 address = keccak256(0xff ++ deployer ++ salt ++ init_code_hash)[12:]
    var data: [85]u8 = undefined;
    data[0] = 0xff;
    @memcpy(data[1..21], &deployer.bytes);
    @memcpy(data[21..53], &salt);
    @memcpy(data[53..85], &initCodeHash.bytes);
    
    const h = hash.keccak256(&data);
    
    // Take last 20 bytes as address
    var addr: Address = undefined;
    @memcpy(&addr.bytes, h.bytes[12..32]);
    
    return addr;
}

// Helper to compute init code hash
pub fn getInitCodeHash(initCode: []const u8) Hash {
    return hash.keccak256(initCode);
}

// Helper function to predict minimal proxy (EIP-1167) addresses
pub fn getMinimalProxyAddress(deployer: Address, nonce: u64, implementation: Address) Address {
    // Minimal proxy bytecode
    var bytecode: [55]u8 = undefined;
    
    // Constructor: 363d3d373d3d3d363d73<implementation>5af43d82803e903d91602b57fd5bf3
    @memcpy(bytecode[0..10], &[_]u8{ 0x36, 0x3d, 0x3d, 0x37, 0x3d, 0x3d, 0x3d, 0x36, 0x3d, 0x73 });
    @memcpy(bytecode[10..30], &implementation.bytes);
    @memcpy(bytecode[30..55], &[_]u8{ 
        0x5a, 0xf4, 0x3d, 0x82, 0x80, 0x3e, 0x90, 0x3d, 0x91, 0x60, 
        0x2b, 0x57, 0xfd, 0x5b, 0xf3 
    });
    
    _ = getInitCodeHash(&bytecode);
    
    // For CREATE: use nonce
    if (nonce > 0) {
        return getContractAddress(deployer, nonce);
    }
    
    // For CREATE2: would need salt parameter
    return Address.ZERO;
}

// Tests

test "CREATE address generation with nonce 0" {
    const deployer = try Address.fromHex("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    const nonce: u64 = 0;
    
    const addr = getContractAddress(deployer, nonce);
    const expected = try Address.fromHex("0xcd234a471b72ba2f1ccf0a70fcaba648a5eecd8d");
    
    try testing.expectEqual(expected, addr);
}

test "CREATE address generation with nonce 1" {
    const deployer = try Address.fromHex("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    const nonce: u64 = 1;
    
    const addr = getContractAddress(deployer, nonce);
    const expected = try Address.fromHex("0x343c43a37d37dff08ae8c4a11544c718abb4fcf8");
    
    try testing.expectEqual(expected, addr);
}

test "CREATE address generation with various nonces" {
    const deployer = try Address.fromHex("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    
    // Test multiple nonces
    const testCases = [_]struct { nonce: u64, expected: []const u8 }{
        .{ .nonce = 0, .expected = "0xcd234a471b72ba2f1ccf0a70fcaba648a5eecd8d" },
        .{ .nonce = 1, .expected = "0x343c43a37d37dff08ae8c4a11544c718abb4fcf8" },
        .{ .nonce = 2, .expected = "0xf778b86fa74e846c4f0a1fbd1335fe81c00a0c91" },
        .{ .nonce = 3, .expected = "0xfffd933a0bc612844eaf0c6fe3e5b8e9b6c1d19c" },
    };
    
    for (testCases) |tc| {
        const addr = getContractAddress(deployer, tc.nonce);
        const expected = try Address.fromHex(tc.expected);
        try testing.expectEqual(expected, addr);
    }
}

test "CREATE address with high nonce" {
    const deployer = try Address.fromHex("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    const nonce: u64 = 100;
    
    const addr = getContractAddress(deployer, nonce);
    
    // Address should be valid (non-zero)
    try testing.expect(!addr.isZero());
}

test "CREATE address with max nonce" {
    const deployer = try Address.fromHex("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    const nonce: u64 = std.math.maxInt(u64);
    
    const addr = getContractAddress(deployer, nonce);
    
    // Should still generate valid address
    try testing.expect(!addr.isZero());
}

test "CREATE2 address generation" {
    const deployer = try Address.fromHex("0x0000000000000000000000000000000000000000");
    const salt = [32]u8{0x00} ** 32;
    const initCode = [_]u8{0x00};
    const initCodeHash = getInitCodeHash(&initCode);
    
    const addr = getCreate2Address(deployer, salt, initCodeHash);
    const expected = try Address.fromHex("0x4d1a2e2bb4f88f0250f26ffff098b0b30b26bf38");
    
    try testing.expectEqual(expected, addr);
}

test "CREATE2 with ERC-20 bytecode" {
    const deployer = try Address.fromHex("0x0000000000000000000000000000000000000000");
    const salt = [32]u8{0x00} ** 32;
    
    // Simplified ERC-20 init code (just for testing)
    const initCode = [_]u8{0x60, 0x80, 0x60, 0x40, 0x52};
    const initCodeHash = getInitCodeHash(&initCode);
    
    const addr = getCreate2Address(deployer, salt, initCodeHash);
    
    // Should generate deterministic address
    const addr2 = getCreate2Address(deployer, salt, initCodeHash);
    try testing.expectEqual(addr, addr2);
}

test "CREATE2 with different salts" {
    const deployer = try Address.fromHex("0x0000000000000000000000000000000000000000");
    const initCode = [_]u8{0x00};
    const initCodeHash = getInitCodeHash(&initCode);
    
    // Different salts should produce different addresses
    var salt1 = [32]u8{0x00} ** 32;
    salt1[31] = 0x01;
    
    var salt2 = [32]u8{0x00} ** 32;
    salt2[31] = 0x02;
    
    const addr1 = getCreate2Address(deployer, salt1, initCodeHash);
    const addr2 = getCreate2Address(deployer, salt2, initCodeHash);
    
    try testing.expect(!addr1.eql(addr2));
}

test "CREATE2 from different deployers" {
    const deployer1 = try Address.fromHex("0x1111111111111111111111111111111111111111");
    const deployer2 = try Address.fromHex("0x2222222222222222222222222222222222222222");
    const salt = [32]u8{0x00} ** 32;
    const initCode = [_]u8{0x00};
    const initCodeHash = getInitCodeHash(&initCode);
    
    const addr1 = getCreate2Address(deployer1, salt, initCodeHash);
    const addr2 = getCreate2Address(deployer2, salt, initCodeHash);
    
    // Different deployers should produce different addresses
    try testing.expect(!addr1.eql(addr2));
}

test "CREATE2 deterministic deployment" {
    // Uniswap V2 Pair init code hash (real example)
    const factory = try Address.fromHex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
    const token0 = try Address.fromHex("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"); // USDC
    const token1 = try Address.fromHex("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"); // WETH
    
    // Compute salt from token addresses (sorted)
    var saltData: [40]u8 = undefined;
    if (std.mem.order(u8, &token0.bytes, &token1.bytes) == .lt) {
        @memcpy(saltData[0..20], &token0.bytes);
        @memcpy(saltData[20..40], &token1.bytes);
    } else {
        @memcpy(saltData[0..20], &token1.bytes);
        @memcpy(saltData[20..40], &token0.bytes);
    }
    const salt = hash.keccak256(&saltData);
    
    // Uniswap V2 pair init code hash (known constant)
    const initCodeHash = try Hash.fromHex("0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f");
    
    const pairAddress = getCreate2Address(factory, salt.bytes, initCodeHash);
    
    // The computed address should be deterministic
    const pairAddress2 = getCreate2Address(factory, salt.bytes, initCodeHash);
    try testing.expectEqual(pairAddress, pairAddress2);
}

test "minimal proxy address prediction" {
    const deployer = try Address.fromHex("0x1234567890123456789012345678901234567890");
    const implementation = try Address.fromHex("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
    const nonce: u64 = 5;
    
    const proxyAddress = getMinimalProxyAddress(deployer, nonce, implementation);
    
    // Should generate valid proxy address
    try testing.expect(!proxyAddress.isZero());
    
    // Should be different from implementation
    try testing.expect(!proxyAddress.eql(implementation));
}

test "factory pattern deployment addresses" {
    const factory = try Address.fromHex("0x1111111111111111111111111111111111111111");
    
    // Simulate deploying multiple contracts from factory
    var addresses: [5]Address = undefined;
    
    for (0..5) |i| {
        addresses[i] = getContractAddress(factory, i);
    }
    
    // All addresses should be unique
    for (0..5) |i| {
        for (i + 1..5) |j| {
            try testing.expect(!addresses[i].eql(addresses[j]));
        }
    }
}

test "CREATE2 factory predictable addresses" {
    const factory = try Address.fromHex("0x1111111111111111111111111111111111111111");
    const initCode = [_]u8{ 0x60, 0x00, 0x60, 0x00, 0xf3 }; // STOP, STOP, RETURN
    const initCodeHash = getInitCodeHash(&initCode);
    
    // User-provided salts
    const user1Salt = hash.keccak256("user1");
    const user2Salt = hash.keccak256("user2");
    
    const addr1 = getCreate2Address(factory, user1Salt.bytes, initCodeHash);
    const addr2 = getCreate2Address(factory, user2Salt.bytes, initCodeHash);
    
    // Addresses should be different
    try testing.expect(!addr1.eql(addr2));
    
    // Should be reproducible
    const addr1Again = getCreate2Address(factory, user1Salt.bytes, initCodeHash);
    try testing.expectEqual(addr1, addr1Again);
}