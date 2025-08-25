//! Tests for CREATE/CREATE2 code storage and retrieval via get_code_by_address
//! These tests verify that contract code is properly stored in the database
//! and can be retrieved after deployment

const std = @import("std");
const frame_mod = @import("frame.zig");
const Frame = frame_mod.Frame;
const evm_mod = @import("evm.zig");
const Evm = evm_mod.Evm;
const primitives = @import("primitives");
const Address = primitives.Address.Address;
const address_utils = primitives.Address;
const memory_database = @import("memory_database.zig");
const MemoryDatabase = memory_database.MemoryDatabase;
const Account = @import("database_interface_account.zig").Account;
const Host = @import("host.zig").Host;
const Hardfork = @import("hardfork.zig").Hardfork;
const ZERO_ADDRESS = @import("primitives").ZERO_ADDRESS;

fn to_address(n: u32) Address {
    var addr = ZERO_ADDRESS;
    std.mem.writeInt(u32, addr[16..20], n, .big);
    return addr;
}

fn to_u256(addr: Address) u256 {
    return address_utils.to_u256(addr);
}

// Helper to create test EVM
const TestEvm = struct {
    evm: *Evm,
    memory_db: *MemoryDatabase,
};

fn createTestEvm(allocator: std.mem.Allocator) !TestEvm {
    var memory_db = try allocator.create(MemoryDatabase);
    memory_db.* = MemoryDatabase.init(allocator);
    
    const db_interface = memory_db.to_database_interface();
    const evm = try allocator.create(Evm);
    evm.* = try Evm.init(allocator, db_interface, null, null);
    
    return TestEvm{ .evm = evm, .memory_db = memory_db };
}

// Simple contract that returns its own code
const RETURN_OWN_CODE_CONTRACT = [_]u8{
    // Get code size
    0x38,       // CODESIZE
    0x60, 0x00, // PUSH1 0 (offset)
    0x52,       // MSTORE
    
    // Copy code to memory
    0x38,       // CODESIZE
    0x60, 0x00, // PUSH1 0 (dest offset)
    0x60, 0x00, // PUSH1 0 (src offset)
    0x39,       // CODECOPY
    
    // Return the code
    0x38,       // CODESIZE
    0x60, 0x00, // PUSH1 0 (memory offset)
    0xF3,       // RETURN
};

// Simple contract constructor that deploys a minimal contract
// Constructor: stores a simple "hello" contract
const CONSTRUCTOR_CONTRACT = [_]u8{
    // Load the runtime code and return it
    0x60, 0x0A, // PUSH1 10 (size of runtime code)
    0x60, 0x0C, // PUSH1 12 (offset to runtime code)
    0x60, 0x00, // PUSH1 0 (memory dest)
    0x39,       // CODECOPY
    0x60, 0x0A, // PUSH1 10 (size)
    0x60, 0x00, // PUSH1 0 (offset)
    0xF3,       // RETURN
    
    // Runtime code starts here (offset 12):
    0x60, 0x42, // PUSH1 0x42 ("hello" value)
    0x60, 0x00, // PUSH1 0
    0x52,       // MSTORE
    0x60, 0x20, // PUSH1 32
    0x60, 0x00, // PUSH1 0
    0xF3,       // RETURN
};

test "CREATE stores code and retrieves via get_code_by_address" {
    const allocator = std.testing.allocator;
    
    // Create EVM
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    const creator_address = to_address(0x1000);
    const host = evm.to_host();
    const F = Frame(.{ .has_database = true });
    
    // Set up creator account with balance
    var creator_account = Account.zero();
    creator_account.balance = 100000;
    try evm.database.set_account(creator_address, creator_account);
    
    // Prepare CREATE bytecode:
    // 1. Put constructor code in memory
    // 2. Call CREATE
    var create_bytecode = std.ArrayList(u8).init(allocator);
    defer create_bytecode.deinit();
    
    // Store constructor code in memory at offset 0
    for (CONSTRUCTOR_CONTRACT, 0..) |byte, i| {
        try create_bytecode.append(0x60); // PUSH1
        try create_bytecode.append(byte);
        try create_bytecode.append(0x60); // PUSH1
        try create_bytecode.append(@intCast(i));
        try create_bytecode.append(0x52); // MSTORE8
    }
    
    // CREATE: value=0, offset=0, size=len(CONSTRUCTOR_CONTRACT)
    try create_bytecode.append(0x60); // PUSH1
    try create_bytecode.append(@intCast(CONSTRUCTOR_CONTRACT.len)); // size
    try create_bytecode.append(0x60); // PUSH1 
    try create_bytecode.append(0x00); // offset
    try create_bytecode.append(0x60); // PUSH1
    try create_bytecode.append(0x00); // value
    try create_bytecode.append(0xF0); // CREATE
    
    // STOP
    try create_bytecode.append(0x00);
    
    // Execute CREATE
    var frame = try F.init(allocator, create_bytecode.items, 1000000, evm.database, host, false);
    defer frame.deinit(allocator);
    
    frame.contract_address = creator_address;
    frame.caller = creator_address;
    frame.value = 0;
    
    const execute_result = frame.execute();
    
    // Should succeed
    try std.testing.expectError(Frame(.{ .has_database = true }).Error.STOP, execute_result);
    
    // Get the created address from stack
    try std.testing.expectEqual(@as(usize, 1), frame.stack.size());
    const created_address_u256 = try frame.stack.pop();
    const created_address = address_utils.from_u256(created_address_u256);
    
    // Verify the created contract exists
    const created_account = try evm.database.get_account(created_address);
    try std.testing.expect(created_account != null);
    
    // Get the deployed code
    const deployed_code = try evm.database.get_code_by_hash(created_account.?.code_hash);
    
    // The deployed code should be the runtime code (last 10 bytes of CONSTRUCTOR_CONTRACT)
    const expected_runtime_code = CONSTRUCTOR_CONTRACT[12..];
    try std.testing.expectEqualSlices(u8, expected_runtime_code, deployed_code);
    
    // Verify we can also get code by address
    const code_by_address = try evm.database.get_code_by_address(created_address);
    try std.testing.expectEqualSlices(u8, expected_runtime_code, code_by_address);
}

test "CREATE2 stores code with deterministic address" {
    const allocator = std.testing.allocator;
    
    // Create EVM
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    const creator_address = to_address(0x2000);
    const salt: u256 = 0x123456789abcdef;
    
    // Set up creator account
    var creator_account = Account.zero();
    creator_account.balance = 100000;
    try evm.database.set_account(creator_address, creator_account);
    
    // Calculate expected CREATE2 address
    const expected_address = try calculateCreate2Address(creator_address, salt, &CONSTRUCTOR_CONTRACT);
    
    const host = evm.to_host();
    const F = Frame(.{ .has_database = true });
    
    // Prepare CREATE2 bytecode
    var create2_bytecode = std.ArrayList(u8).init(allocator);
    defer create2_bytecode.deinit();
    
    // Store constructor code in memory
    for (CONSTRUCTOR_CONTRACT, 0..) |byte, i| {
        try create2_bytecode.append(0x60); // PUSH1
        try create2_bytecode.append(byte);
        try create2_bytecode.append(0x60); // PUSH1
        try create2_bytecode.append(@intCast(i));
        try create2_bytecode.append(0x52); // MSTORE8
    }
    
    // CREATE2: salt, size, offset, value
    // Push salt (32 bytes)
    try create2_bytecode.appendSlice(&[_]u8{ 0x7F }); // PUSH32
    var salt_bytes: [32]u8 = @bitCast(salt);
    // Convert to big-endian
    std.mem.reverse(u8, &salt_bytes);
    try create2_bytecode.appendSlice(&salt_bytes);
    
    try create2_bytecode.append(0x60); // PUSH1
    try create2_bytecode.append(@intCast(CONSTRUCTOR_CONTRACT.len)); // size
    try create2_bytecode.append(0x60); // PUSH1
    try create2_bytecode.append(0x00); // offset
    try create2_bytecode.append(0x60); // PUSH1
    try create2_bytecode.append(0x00); // value
    try create2_bytecode.append(0xF5); // CREATE2
    
    // STOP
    try create2_bytecode.append(0x00);
    
    // Execute CREATE2
    var frame = try F.init(allocator, create2_bytecode.items, 1000000, evm.database, host, false);
    defer frame.deinit(allocator);
    
    frame.contract_address = creator_address;
    frame.caller = creator_address;
    frame.value = 0;
    
    const execute_result = frame.execute();
    
    // Should succeed
    try std.testing.expectError(Frame(.{ .has_database = true }).Error.STOP, execute_result);
    
    // Get the created address from stack
    try std.testing.expectEqual(@as(usize, 1), frame.stack.size());
    const created_address_u256 = try frame.stack.pop();
    const created_address = address_utils.from_u256(created_address_u256);
    
    // Verify it matches the expected CREATE2 address
    try std.testing.expectEqual(expected_address, created_address);
    
    // Verify the contract exists and has correct code
    const created_account = try evm.database.get_account(created_address);
    try std.testing.expect(created_account != null);
    
    const deployed_code = try evm.database.get_code_by_address(created_address);
    const expected_runtime_code = CONSTRUCTOR_CONTRACT[12..];
    try std.testing.expectEqualSlices(u8, expected_runtime_code, deployed_code);
}

test "get_code_by_address returns empty for non-existent contracts" {
    const allocator = std.testing.allocator;
    
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    const non_existent_address = to_address(0x9999);
    
    // Should return empty slice for non-existent contract
    const code = try evm.database.get_code_by_address(non_existent_address);
    try std.testing.expectEqual(@as(usize, 0), code.len);
}

test "get_code_by_address returns empty for EOA (externally owned account)" {
    const allocator = std.testing.allocator;
    
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    const eoa_address = to_address(0x4000);
    
    // Create an EOA (account with balance but no code)
    var eoa_account = Account.zero();
    eoa_account.balance = 1000;
    try evm.database.set_account(eoa_address, eoa_account);
    
    // Should return empty code for EOA
    const code = try evm.database.get_code_by_address(eoa_address);
    try std.testing.expectEqual(@as(usize, 0), code.len);
}

test "Code storage persistence across multiple operations" {
    const allocator = std.testing.allocator;
    
    const result = try createTestEvm(allocator);
    var evm = result.evm;
    var memory_db = result.memory_db;
    defer {
        evm.deinit();
        allocator.destroy(evm);
        memory_db.deinit();
        allocator.destroy(memory_db);
    }
    
    const test_code = [_]u8{ 0x60, 0x42, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xF3 };
    const contract_address = to_address(0x5000);
    
    // Manually set contract code
    const code_hash = try evm.database.set_code(&test_code);
    var account = Account.zero();
    account.code_hash = code_hash;
    try evm.database.set_account(contract_address, account);
    
    // Retrieve code multiple times to ensure persistence
    for (0..5) |_| {
        const retrieved_code = try evm.database.get_code_by_address(contract_address);
        try std.testing.expectEqualSlices(u8, &test_code, retrieved_code);
        
        const retrieved_code_by_hash = try evm.database.get_code_by_hash(code_hash);
        try std.testing.expectEqualSlices(u8, &test_code, retrieved_code_by_hash);
    }
    
    // Modify account but keep same code hash
    account.balance = 9999;
    try evm.database.set_account(contract_address, account);
    
    // Code should still be the same
    const code_after_balance_change = try evm.database.get_code_by_address(contract_address);
    try std.testing.expectEqualSlices(u8, &test_code, code_after_balance_change);
}

// Helper function to calculate CREATE2 address
// address = keccak256(0xff ++ creator ++ salt ++ keccak256(init_code))[12:]
fn calculateCreate2Address(creator: Address, salt: u256, init_code: []const u8) !Address {
    const crypto = @import("crypto");
    
    // Calculate init_code hash
    var init_code_hash: [32]u8 = undefined;
    crypto.keccak256(&init_code_hash, init_code);
    
    // Prepare data for CREATE2 address calculation
    var data: [85]u8 = undefined;
    data[0] = 0xFF;
    @memcpy(data[1..21], &creator);
    
    // Convert salt to big-endian bytes
    var salt_bytes: [32]u8 = @bitCast(salt);
    std.mem.reverse(u8, &salt_bytes);
    @memcpy(data[21..53], &salt_bytes);
    @memcpy(data[53..85], &init_code_hash);
    
    // Hash the data
    var hash: [32]u8 = undefined;
    crypto.keccak256(&hash, &data);
    
    // Take last 20 bytes as address
    var address: Address = undefined;
    @memcpy(&address, hash[12..32]);
    return address;
}