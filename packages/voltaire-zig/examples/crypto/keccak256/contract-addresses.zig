const std = @import("std");
const crypto = @import("crypto");
const primitives = @import("primitives");

/// Contract Address Calculation
///
/// Demonstrates how Ethereum calculates contract addresses:
/// - CREATE: Hash of RLP([deployer, nonce])
/// - CREATE2: Deterministic address from deployer, salt, and bytecode
/// - Real-world examples and comparisons
pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== Contract Address Calculation ===\n\n", .{});

    // 1. CREATE: Nonce-based Contract Addresses
    try stdout.print("1. CREATE: Nonce-Based Addresses\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Formula: keccak256(rlp([sender, nonce]))[12:]\n\n", .{});

    // Parse deployer address
    const deployer_hex = "742d35Cc6634C0532925a3b844Bc9e7595f51e3e";
    var deployer: [20]u8 = undefined;
    _ = try std.fmt.hexToBytes(&deployer, deployer_hex);

    try stdout.print("Deployer: 0x", .{});
    for (deployer) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    // Calculate contract addresses for different nonces
    const nonces = [_]u64{ 0, 1, 5, 10, 100 };
    for (nonces) |nonce| {
        const contract_addr = try calculateCreateAddress(&deployer, nonce, allocator);
        try stdout.print("Nonce {d:>3}: 0x", .{nonce});
        for (contract_addr) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print("\n", .{});
    }

    try stdout.print("\nNote: First contract deployed by an EOA has nonce 0\n", .{});
    try stdout.print("      Smart contract deployers start at nonce 1\n\n", .{});

    // 2. CREATE2: Deterministic Contract Addresses
    try stdout.print("2. CREATE2: Deterministic Addresses\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});
    try stdout.print("Formula: keccak256(0xff ++ sender ++ salt ++ keccak256(initCode))[12:]\n\n", .{});

    // Simple bytecode example
    const init_code = [_]u8{
        0x60, 0x80, 0x60, 0x40, 0x52, // PUSH1 0x80, PUSH1 0x40, MSTORE
        0x34, 0x80, 0x15, 0x61, 0x00, 0x0f, // CALLVALUE, DUP1, ISZERO, PUSH2 0x000f
    };

    try stdout.print("Factory:  0x", .{});
    for (deployer) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nInitCode: 0x", .{});
    for (init_code) |byte| try stdout.print("{x:0>2}", .{byte});

    var init_code_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&init_code, &init_code_hash);
    try stdout.print("\nInitCode Hash: 0x", .{});
    for (init_code_hash) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\n", .{});

    // Calculate CREATE2 addresses with different salts
    const salts = [_]u64{ 0, 1, 42, 12345 };
    for (salts) |salt_val| {
        var salt: [32]u8 = [_]u8{0} ** 32;
        var i: usize = 31;
        var temp_salt = salt_val;
        while (temp_salt > 0) : ({
            if (i == 0) break;
            i -= 1;
        }) {
            salt[i] = @truncate(temp_salt);
            temp_salt >>= 8;
        }

        const contract_addr = try calculateCreate2Address(&deployer, &salt, &init_code);
        try stdout.print("Salt {d:>5}: 0x", .{salt_val});
        for (contract_addr) |byte| try stdout.print("{x:0>2}", .{byte});
        try stdout.print("\n", .{});
    }

    try stdout.print("\nNote: Same factory + salt + initCode always produces same address\n\n", .{});

    // 3. CREATE vs CREATE2 Comparison
    try stdout.print("3. CREATE vs CREATE2 Comparison\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const deployer2_hex = "A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    var deployer2: [20]u8 = undefined;
    _ = try std.fmt.hexToBytes(&deployer2, deployer2_hex);

    const create_addr = try calculateCreateAddress(&deployer2, 1, allocator);
    var salt_zero: [32]u8 = [_]u8{0} ** 32;
    const create2_addr = try calculateCreate2Address(&deployer2, &salt_zero, &init_code);

    try stdout.print("Same deployer, different methods:\n\n", .{});
    try stdout.print("Deployer:      0x", .{});
    for (deployer2) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nCREATE (n=1):  0x", .{});
    for (create_addr) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nCREATE2 (s=0): 0x", .{});
    for (create2_addr) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\n\nCREATE:  Depends on deployer state (nonce)\n", .{});
    try stdout.print("CREATE2: Independent of deployer state (deterministic)\n\n", .{});

    // 4. Bytecode Hash Importance
    try stdout.print("4. Bytecode Hash in CREATE2\n", .{});
    try stdout.print("{s}\n", .{"-" ** 40});

    const bytecode1 = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x52 };
    const bytecode2 = [_]u8{ 0x60, 0x80, 0x60, 0x40, 0x53 }; // Last byte different

    const addr1 = try calculateCreate2Address(&deployer, &salt_zero, &bytecode1);
    const addr2 = try calculateCreate2Address(&deployer, &salt_zero, &bytecode2);

    try stdout.print("Bytecode 1: 0x", .{});
    for (bytecode1) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nAddress 1:  0x", .{});
    for (addr1) |byte| try stdout.print("{x:0>2}", .{byte});

    try stdout.print("\n\nBytecode 2: 0x", .{});
    for (bytecode2) |byte| try stdout.print("{x:0>2}", .{byte});
    try stdout.print("\nAddress 2:  0x", .{});
    for (addr2) |byte| try stdout.print("{x:0>2}", .{byte});

    try stdout.print("\n\nSmall bytecode change -> completely different address\n", .{});
    try stdout.print("This prevents front-running attacks on CREATE2\n\n", .{});

    try stdout.print("=== Complete ===\n", .{});
}

/// Calculate CREATE contract address
fn calculateCreateAddress(deployer: *const [20]u8, nonce: u64, allocator: std.mem.Allocator) ![20]u8 {
    // RLP encode [deployer, nonce]
    var rlp_data = std.ArrayList(u8).init(allocator);
    defer rlp_data.deinit();

    // List prefix
    const list_prefix = if (nonce < 128)
        21 + 1 // Address (21 bytes) + nonce (1 byte)
    else
        21 + 2; // Address (21 bytes) + nonce prefix + value

    if (list_prefix < 56) {
        try rlp_data.append(0xc0 + @as(u8, @intCast(list_prefix)));
    } else {
        unreachable; // Simplified for example
    }

    // Encode address (20 bytes)
    try rlp_data.append(0x94); // 0x80 + 20
    try rlp_data.appendSlice(deployer);

    // Encode nonce
    if (nonce == 0) {
        try rlp_data.append(0x80);
    } else if (nonce < 128) {
        try rlp_data.append(@intCast(nonce));
    } else {
        try rlp_data.append(0x81);
        try rlp_data.append(@intCast(nonce));
    }

    // Hash and return last 20 bytes
    var hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(rlp_data.items, &hash);

    var result: [20]u8 = undefined;
    @memcpy(&result, hash[12..32]);
    return result;
}

/// Calculate CREATE2 contract address
fn calculateCreate2Address(deployer: *const [20]u8, salt: *const [32]u8, init_code: []const u8) ![20]u8 {
    // Hash the init code
    var init_code_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(init_code, &init_code_hash);

    // Construct: 0xff ++ deployer ++ salt ++ init_code_hash
    var data: [1 + 20 + 32 + 32]u8 = undefined;
    data[0] = 0xff;
    @memcpy(data[1..21], deployer);
    @memcpy(data[21..53], salt);
    @memcpy(data[53..85], &init_code_hash);

    // Hash and return last 20 bytes
    var hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(&data, &hash);

    var result: [20]u8 = undefined;
    @memcpy(&result, hash[12..32]);
    return result;
}
