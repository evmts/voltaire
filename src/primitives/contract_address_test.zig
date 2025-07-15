const std = @import("std");
const testing = std.testing;
const Hash = @import("hash_utils.zig");
const Address = @import("address/address.zig");
const Hex = @import("hex.zig");
const primitives = @import("primitives");

// Contract address generation for CREATE opcode
pub fn get_contract_address(deployer: primitives.Address.Address, nonce: u64) primitives.Address.Address {
    const allocator = std.heap.page_allocator;
    
    // RLP encode [deployer_address, nonce]
    var list = std.ArrayList(u8).init(allocator);
    defer list.deinit();
    
    // Encode deployer address (20 bytes)
    primitives.Rlp.encode_bytes(allocator, &deployer, &list) catch unreachable;
    
    // Encode nonce
    if (nonce == 0) {
        list.append(0x80) catch unreachable; // Empty string for 0
    } else {
        primitives.Rlp.encode_uint(allocator, nonce, &list) catch unreachable;
    }
    
    // Wrap in list
    var rlp_list = std.ArrayList(u8).init(allocator);
    defer rlp_list.deinit();
    
    if (list.items.len <= 55) {
        rlp_list.append(@as(u8, @intCast(0xc0 + list.items.len))) catch unreachable;
    } else {
        // Long list encoding
        const len_bytes = primitives.Rlp.encode_length(list.items.len);
        rlp_list.append(@as(u8, @intCast(0xf7 + len_bytes.len))) catch unreachable;
        rlp_list.appendSlice(len_bytes) catch unreachable;
    }
    rlp_list.appendSlice(list.items) catch unreachable;
    
    // Hash the RLP encoded data
    const hash = Hash.keccak256(rlp_list.items);
    
    // Take last 20 bytes as address
    var address: primitives.Address.Address = undefined;
    @memcpy(&address, hash[12..32]);
    
    return address;
}

// Contract address generation for CREATE2 opcode
pub fn get_create2_address(
    deployer: primitives.Address.Address,
    salt: [32]u8,
    init_code_hash: Hash.Hash,
) primitives.Address.Address {
    // CREATE2 address = keccak256(0xff ++ deployer ++ salt ++ init_code_hash)[12:]
    var data: [85]u8 = undefined;
    data[0] = 0xff;
    @memcpy(data[1..21], &deployer);
    @memcpy(data[21..53], &salt);
    @memcpy(data[53..85], &init_code_hash);
    
    const hash = Hash.keccak256(&data);
    
    // Take last 20 bytes as address
    var address: primitives.Address.Address = undefined;
    @memcpy(&address, hash[12..32]);
    
    return address;
}

// Helper to compute init code hash
pub fn get_init_code_hash(init_code: []const u8) Hash.Hash {
    return Hash.keccak256(init_code);
}

// Test CREATE address generation
test "CREATE address generation with nonce 0" {
    const deployer = primitives.Address.from_hex_comptime("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    const nonce: u64 = 0;
    
    const address = get_contract_address(deployer, nonce);
    const expected = primitives.Address.from_hex_comptime("0xcd234a471b72ba2f1ccf0a70fcaba648a5eecd8d");
    
    try testing.expectEqual(expected, address);
}

test "CREATE address generation with nonce 1" {
    const deployer = primitives.Address.from_hex_comptime("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    const nonce: u64 = 1;
    
    const address = get_contract_address(deployer, nonce);
    const expected = primitives.Address.from_hex_comptime("0x343c43a37d37dff08ae8c4a11544c718abb4fcf8");
    
    try testing.expectEqual(expected, address);
}

test "CREATE address generation with various nonces" {
    const deployer = primitives.Address.from_hex_comptime("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    
    // Test multiple nonces
    const test_cases = [_]struct { nonce: u64, expected: []const u8 }{
        .{ .nonce = 0, .expected = "0xcd234a471b72ba2f1ccf0a70fcaba648a5eecd8d" },
        .{ .nonce = 1, .expected = "0x343c43a37d37dff08ae8c4a11544c718abb4fcf8" },
        .{ .nonce = 2, .expected = "0xf778b86fa74e846c4f0a1fbd1335fe81c00a0c91" },
        .{ .nonce = 3, .expected = "0xfffd933a0bc612844eaf0c6fe3e5b8e9b6c1d19c" },
    };
    
    for (test_cases) |tc| {
        const address = get_contract_address(deployer, tc.nonce);
        const expected = try primitives.Address.from_hex(tc.expected);
        try testing.expectEqual(expected, address);
    }
}

test "CREATE address with high nonce" {
    const deployer = primitives.Address.from_hex_comptime("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    const nonce: u64 = 100;
    
    const address = get_contract_address(deployer, nonce);
    
    // Address should be valid (non-zero)
    try testing.expect(!Address.is_zero(address));
}

test "CREATE address with max nonce" {
    const deployer = primitives.Address.from_hex_comptime("0x6ac7ea33f8831ea9dcc53393aaa88b25a785dbf0");
    const nonce: u64 = std.math.maxInt(u64);
    
    const address = get_contract_address(deployer, nonce);
    
    // Should still generate valid address
    try testing.expect(!Address.is_zero(address));
}

test "CREATE2 address generation" {
    const deployer = primitives.Address.from_hex_comptime("0x0000000000000000000000000000000000000000");
    const salt = [32]u8{0x00} ** 32;
    const init_code = [_]u8{0x00};
    const init_code_hash = get_init_code_hash(&init_code);
    
    const address = get_create2_address(deployer, salt, init_code_hash);
    const expected = primitives.Address.from_hex_comptime("0x4d1a2e2bb4f88f0250f26ffff098b0b30b26bf38");
    
    try testing.expectEqual(expected, address);
}

test "CREATE2 with ERC-20 bytecode" {
    const deployer = primitives.Address.from_hex_comptime("0x0000000000000000000000000000000000000000");
    const salt = [32]u8{0x00} ** 32;
    
    // Simplified ERC-20 init code (just for testing)
    const init_code = [_]u8{0x60, 0x80, 0x60, 0x40, 0x52};
    const init_code_hash = get_init_code_hash(&init_code);
    
    const address = get_create2_address(deployer, salt, init_code_hash);
    
    // Should generate deterministic address
    const address2 = get_create2_address(deployer, salt, init_code_hash);
    try testing.expectEqual(address, address2);
}

test "CREATE2 with different salts" {
    const deployer = primitives.Address.from_hex_comptime("0x0000000000000000000000000000000000000000");
    const init_code = [_]u8{0x00};
    const init_code_hash = get_init_code_hash(&init_code);
    
    // Different salts should produce different addresses
    var salt1 = [32]u8{0x00} ** 32;
    salt1[31] = 0x01;
    
    var salt2 = [32]u8{0x00} ** 32;
    salt2[31] = 0x02;
    
    const address1 = get_create2_address(deployer, salt1, init_code_hash);
    const address2 = get_create2_address(deployer, salt2, init_code_hash);
    
    try testing.expect(!Address.equal(address1, address2));
}

test "CREATE2 from different deployers" {
    const deployer1 = primitives.Address.from_hex_comptime("0x1111111111111111111111111111111111111111");
    const deployer2 = primitives.Address.from_hex_comptime("0x2222222222222222222222222222222222222222");
    const salt = [32]u8{0x00} ** 32;
    const init_code = [_]u8{0x00};
    const init_code_hash = get_init_code_hash(&init_code);
    
    const address1 = get_create2_address(deployer1, salt, init_code_hash);
    const address2 = get_create2_address(deployer2, salt, init_code_hash);
    
    // Different deployers should produce different addresses
    try testing.expect(!Address.equal(address1, address2));
}

test "CREATE2 deterministic deployment" {
    // Uniswap V2 Pair init code hash (real example)
    const factory = primitives.Address.from_hex_comptime("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f");
    const token0 = primitives.Address.from_hex_comptime("0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"); // USDC
    const token1 = primitives.Address.from_hex_comptime("0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"); // WETH
    
    // Compute salt from token addresses (sorted)
    var salt_data: [40]u8 = undefined;
    if (std.mem.order(u8, &token0, &token1) == .lt) {
        @memcpy(salt_data[0..20], &token0);
        @memcpy(salt_data[20..40], &token1);
    } else {
        @memcpy(salt_data[0..20], &token1);
        @memcpy(salt_data[20..40], &token0);
    }
    const salt = Hash.keccak256(&salt_data);
    
    // Uniswap V2 pair init code hash (known constant)
    const init_code_hash = Hash.from_hex_comptime("0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f");
    
    const pair_address = get_create2_address(factory, salt, init_code_hash);
    
    // The computed address should be deterministic
    const pair_address2 = get_create2_address(factory, salt, init_code_hash);
    try testing.expectEqual(pair_address, pair_address2);
}

// Helper function to predict minimal proxy (EIP-1167) addresses
pub fn get_minimal_proxy_address(deployer: primitives.Address.Address, nonce: u64, implementation: primitives.Address.Address) primitives.Address.Address {
    // Minimal proxy bytecode
    var bytecode: [55]u8 = undefined;
    
    // Constructor: 363d3d373d3d3d363d73<implementation>5af43d82803e903d91602b57fd5bf3
    @memcpy(bytecode[0..10], &[_]u8{ 0x36, 0x3d, 0x3d, 0x37, 0x3d, 0x3d, 0x3d, 0x36, 0x3d, 0x73 });
    @memcpy(bytecode[10..30], &implementation);
    @memcpy(bytecode[30..55], &[_]u8{ 
        0x5a, 0xf4, 0x3d, 0x82, 0x80, 0x3e, 0x90, 0x3d, 0x91, 0x60, 
        0x2b, 0x57, 0xfd, 0x5b, 0xf3 
    });
    
    const init_code_hash = get_init_code_hash(&bytecode);
    
    // For CREATE: use nonce
    if (nonce > 0) {
        return get_contract_address(deployer, nonce);
    }
    
    // For CREATE2: would need salt parameter
    return Address.ZERO;
}

test "minimal proxy address prediction" {
    const deployer = primitives.Address.from_hex_comptime("0x1234567890123456789012345678901234567890");
    const implementation = primitives.Address.from_hex_comptime("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
    const nonce: u64 = 5;
    
    const proxy_address = get_minimal_proxy_address(deployer, nonce, implementation);
    
    // Should generate valid proxy address
    try testing.expect(!Address.is_zero(proxy_address));
    
    // Should be different from implementation
    try testing.expect(!Address.equal(proxy_address, implementation));
}

// Test factory pattern deployments
test "factory pattern deployment addresses" {
    const factory = primitives.Address.from_hex_comptime("0x1111111111111111111111111111111111111111");
    
    // Simulate deploying multiple contracts from factory
    var addresses: [5]primitives.Address.Address = undefined;
    
    for (0..5) |i| {
        addresses[i] = get_contract_address(factory, i);
    }
    
    // All addresses should be unique
    for (0..5) |i| {
        for (i + 1..5) |j| {
            try testing.expect(!Address.equal(addresses[i], addresses[j]));
        }
    }
}

// Test CREATE2 factory with predictable addresses
test "CREATE2 factory predictable addresses" {
    const factory = primitives.Address.from_hex_comptime("0x1111111111111111111111111111111111111111");
    const init_code = [_]u8{ 0x60, 0x00, 0x60, 0x00, 0xf3 }; // STOP, STOP, RETURN
    const init_code_hash = get_init_code_hash(&init_code);
    
    // User-provided salts
    const user1_salt = Hash.keccak256("user1");
    const user2_salt = Hash.keccak256("user2");
    
    const addr1 = get_create2_address(factory, user1_salt, init_code_hash);
    const addr2 = get_create2_address(factory, user2_salt, init_code_hash);
    
    // Addresses should be different
    try testing.expect(!Address.equal(addr1, addr2));
    
    // Should be reproducible
    const addr1_again = get_create2_address(factory, user1_salt, init_code_hash);
    try testing.expectEqual(addr1, addr1_again);
}