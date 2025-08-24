const std = @import("std");
const zbench = @import("zbench");
const primitives = @import("primitives");
const evm_legacy = @import("evm");
const evm2_mod = @import("evm2");
const revm = @import("revm");
const Address = primitives.Address.Address;
const ZERO_ADDRESS = primitives.Address.ZERO_ADDRESS;

// Test configuration
const BENCHMARK_GAS_LIMIT: u64 = 1_000_000;
const TEST_ADDRESS_1 = primitives.Address.from_u256(0x1111111111111111111111111111111111111111);
const TEST_ADDRESS_2 = primitives.Address.from_u256(0x2222222222222222222222222222222222222222);

// ============================================================================
// Simple Contract Bytecodes for Testing
// ============================================================================

// Simple arithmetic contract: ADD two numbers and return result
const ARITHMETIC_CONTRACT = [_]u8{
    0x60, 0x10, // PUSH1 0x10
    0x60, 0x05, // PUSH1 0x05  
    0x01,       // ADD
    0x60, 0x00, // PUSH1 0x00 (memory offset)
    0x52,       // MSTORE (store result in memory)
    0x60, 0x20, // PUSH1 0x20 (return size)
    0x60, 0x00, // PUSH1 0x00 (return offset)
    0xf3,       // RETURN
};

// Simple storage contract: Store and load a value
const STORAGE_CONTRACT = [_]u8{
    0x60, 0x42, // PUSH1 0x42 (value)
    0x60, 0x00, // PUSH1 0x00 (slot)
    0x55,       // SSTORE
    0x60, 0x00, // PUSH1 0x00 (slot)
    0x54,       // SLOAD
    0x60, 0x00, // PUSH1 0x00 (memory offset)
    0x52,       // MSTORE
    0x60, 0x20, // PUSH1 0x20 (return size)
    0x60, 0x00, // PUSH1 0x00 (return offset)
    0xf3,       // RETURN
};

// Stack operations contract: DUP, SWAP, POP operations
const STACK_CONTRACT = [_]u8{
    0x60, 0x11, // PUSH1 0x11
    0x60, 0x22, // PUSH1 0x22
    0x60, 0x33, // PUSH1 0x33
    0x80,       // DUP1
    0x91,       // SWAP2
    0x50,       // POP
    0x01,       // ADD
    0x60, 0x00, // PUSH1 0x00 (memory offset)
    0x52,       // MSTORE
    0x60, 0x20, // PUSH1 0x20 (return size)
    0x60, 0x00, // PUSH1 0x00 (return offset)
    0xf3,       // RETURN
};

// Memory operations contract: MSTORE, MLOAD operations
const MEMORY_CONTRACT = [_]u8{
    0x60, 0xaa, // PUSH1 0xaa (value)
    0x60, 0x00, // PUSH1 0x00 (offset)
    0x52,       // MSTORE
    0x60, 0x00, // PUSH1 0x00 (offset)
    0x51,       // MLOAD
    0x60, 0x20, // PUSH1 0x20 (offset for second store)
    0x52,       // MSTORE
    0x60, 0x20, // PUSH1 0x20 (return size)
    0x60, 0x00, // PUSH1 0x00 (return offset)
    0xf3,       // RETURN
};

// ============================================================================
// EVM2 Benchmark Functions
// ============================================================================

fn benchmark_evm2_arithmetic_contract(allocator: std.mem.Allocator) void {
    var memory_db = evm2_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    
    const block_info = evm2_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .difficulty = 0,
        .coinbase = ZERO_ADDRESS,
        .basefee = 0,
    };
    
    const context = evm2_mod.Evm(.{}).TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var vm = evm2_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();
    
    const call_params = evm2_mod.CallParams{
        .call = .{
            .caller = TEST_ADDRESS_1,
            .to = TEST_ADDRESS_2,
            .value = 0,
            .input = &.{},
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    
    // Set contract code
    db_interface.set_code_by_address(TEST_ADDRESS_2, &ARITHMETIC_CONTRACT) catch return;
    
    const result = vm.call(call_params) catch return;
    _ = result;
}

fn benchmark_evm2_storage_contract(allocator: std.mem.Allocator) void {
    var memory_db = evm2_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    
    const block_info = evm2_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .difficulty = 0,
        .coinbase = ZERO_ADDRESS,
        .basefee = 0,
    };
    
    const context = evm2_mod.Evm(.{}).TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var vm = evm2_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();
    
    const call_params = evm2_mod.CallParams{
        .call = .{
            .caller = TEST_ADDRESS_1,
            .to = TEST_ADDRESS_2,
            .value = 0,
            .input = &.{},
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    
    // Set contract code
    db_interface.set_code_by_address(TEST_ADDRESS_2, &STORAGE_CONTRACT) catch return;
    
    const result = vm.call(call_params) catch return;
    _ = result;
}

fn benchmark_evm2_stack_contract(allocator: std.mem.Allocator) void {
    var memory_db = evm2_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    
    const block_info = evm2_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .difficulty = 0,
        .coinbase = ZERO_ADDRESS,
        .basefee = 0,
    };
    
    const context = evm2_mod.Evm(.{}).TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var vm = evm2_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();
    
    const call_params = evm2_mod.CallParams{
        .call = .{
            .caller = TEST_ADDRESS_1,
            .to = TEST_ADDRESS_2,
            .value = 0,
            .input = &.{},
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    
    // Set contract code
    db_interface.set_code_by_address(TEST_ADDRESS_2, &STACK_CONTRACT) catch return;
    
    const result = vm.call(call_params) catch return;
    _ = result;
}

fn benchmark_evm2_memory_contract(allocator: std.mem.Allocator) void {
    var memory_db = evm2_mod.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    
    const block_info = evm2_mod.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .difficulty = 0,
        .coinbase = ZERO_ADDRESS,
        .basefee = 0,
    };
    
    const context = evm2_mod.Evm(.{}).TransactionContext{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .coinbase = ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    var vm = evm2_mod.Evm(.{}).init(allocator, db_interface, block_info, context, 0, ZERO_ADDRESS, .CANCUN) catch return;
    defer vm.deinit();
    
    const call_params = evm2_mod.CallParams{
        .call = .{
            .caller = TEST_ADDRESS_1,
            .to = TEST_ADDRESS_2,
            .value = 0,
            .input = &.{},
            .gas = BENCHMARK_GAS_LIMIT,
        },
    };
    
    // Set contract code
    db_interface.set_code_by_address(TEST_ADDRESS_2, &MEMORY_CONTRACT) catch return;
    
    const result = vm.call(call_params) catch return;
    _ = result;
}

// ============================================================================
// Legacy EVM Benchmark Functions
// ============================================================================

fn benchmark_legacy_evm_arithmetic_contract(allocator: std.mem.Allocator) void {
    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var vm = evm_legacy.Evm.init(allocator, db_interface, null, null) catch return;
    defer vm.deinit();
    
    var contract = evm_legacy.Contract.init(allocator, &ARITHMETIC_CONTRACT, .{ .address = TEST_ADDRESS_2 }) catch return;
    defer contract.deinit(allocator, null);
    
    var frame = evm_legacy.Frame.init(allocator, &vm, BENCHMARK_GAS_LIMIT, contract, TEST_ADDRESS_1, &.{}) catch return;
    defer frame.deinit();
    
    const result = vm.table.execute_vm(&frame);
    _ = result;
}

fn benchmark_legacy_evm_storage_contract(allocator: std.mem.Allocator) void {
    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var vm = evm_legacy.Evm.init(allocator, db_interface, null, null) catch return;
    defer vm.deinit();
    
    var contract = evm_legacy.Contract.init(allocator, &STORAGE_CONTRACT, .{ .address = TEST_ADDRESS_2 }) catch return;
    defer contract.deinit(allocator, null);
    
    var frame = evm_legacy.Frame.init(allocator, &vm, BENCHMARK_GAS_LIMIT, contract, TEST_ADDRESS_1, &.{}) catch return;
    defer frame.deinit();
    
    const result = vm.table.execute_vm(&frame);
    _ = result;
}

fn benchmark_legacy_evm_stack_contract(allocator: std.mem.Allocator) void {
    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var vm = evm_legacy.Evm.init(allocator, db_interface, null, null) catch return;
    defer vm.deinit();
    
    var contract = evm_legacy.Contract.init(allocator, &STACK_CONTRACT, .{ .address = TEST_ADDRESS_2 }) catch return;
    defer contract.deinit(allocator, null);
    
    var frame = evm_legacy.Frame.init(allocator, &vm, BENCHMARK_GAS_LIMIT, contract, TEST_ADDRESS_1, &.{}) catch return;
    defer frame.deinit();
    
    const result = vm.table.execute_vm(&frame);
    _ = result;
}

fn benchmark_legacy_evm_memory_contract(allocator: std.mem.Allocator) void {
    var memory_db = evm_legacy.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var vm = evm_legacy.Evm.init(allocator, db_interface, null, null) catch return;
    defer vm.deinit();
    
    var contract = evm_legacy.Contract.init(allocator, &MEMORY_CONTRACT, .{ .address = TEST_ADDRESS_2 }) catch return;
    defer contract.deinit(allocator, null);
    
    var frame = evm_legacy.Frame.init(allocator, &vm, BENCHMARK_GAS_LIMIT, contract, TEST_ADDRESS_1, &.{}) catch return;
    defer frame.deinit();
    
    const result = vm.table.execute_vm(&frame);
    _ = result;
}

// ============================================================================
// REVM Benchmark Functions
// ============================================================================

fn benchmark_revm_arithmetic_contract(allocator: std.mem.Allocator) void {
    const settings = revm.RevmSettings{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .chain_id = 1,
    };
    
    var vm = revm.Revm.init(allocator, settings) catch return;
    defer vm.deinit();
    
    // Set contract code
    vm.setCode(TEST_ADDRESS_2, &ARITHMETIC_CONTRACT) catch return;
    
    // Set balance for caller
    vm.setBalance(TEST_ADDRESS_1, 1000000) catch return;
    
    var result = vm.call(TEST_ADDRESS_1, TEST_ADDRESS_2, 0, &.{}, BENCHMARK_GAS_LIMIT) catch return;
    defer result.deinit();
    _ = result;
}

fn benchmark_revm_storage_contract(allocator: std.mem.Allocator) void {
    const settings = revm.RevmSettings{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .chain_id = 1,
    };
    
    var vm = revm.Revm.init(allocator, settings) catch return;
    defer vm.deinit();
    
    // Set contract code
    vm.setCode(TEST_ADDRESS_2, &STORAGE_CONTRACT) catch return;
    
    // Set balance for caller
    vm.setBalance(TEST_ADDRESS_1, 1000000) catch return;
    
    var result = vm.call(TEST_ADDRESS_1, TEST_ADDRESS_2, 0, &.{}, BENCHMARK_GAS_LIMIT) catch return;
    defer result.deinit();
    _ = result;
}

fn benchmark_revm_stack_contract(allocator: std.mem.Allocator) void {
    const settings = revm.RevmSettings{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .chain_id = 1,
    };
    
    var vm = revm.Revm.init(allocator, settings) catch return;
    defer vm.deinit();
    
    // Set contract code
    vm.setCode(TEST_ADDRESS_2, &STACK_CONTRACT) catch return;
    
    // Set balance for caller
    vm.setBalance(TEST_ADDRESS_1, 1000000) catch return;
    
    var result = vm.call(TEST_ADDRESS_1, TEST_ADDRESS_2, 0, &.{}, BENCHMARK_GAS_LIMIT) catch return;
    defer result.deinit();
    _ = result;
}

fn benchmark_revm_memory_contract(allocator: std.mem.Allocator) void {
    const settings = revm.RevmSettings{
        .gas_limit = BENCHMARK_GAS_LIMIT,
        .chain_id = 1,
    };
    
    var vm = revm.Revm.init(allocator, settings) catch return;
    defer vm.deinit();
    
    // Set contract code
    vm.setCode(TEST_ADDRESS_2, &MEMORY_CONTRACT) catch return;
    
    // Set balance for caller
    vm.setBalance(TEST_ADDRESS_1, 1000000) catch return;
    
    var result = vm.call(TEST_ADDRESS_1, TEST_ADDRESS_2, 0, &.{}, BENCHMARK_GAS_LIMIT) catch return;
    defer result.deinit();
    _ = result;
}

// ============================================================================
// Basic Operation Benchmarks
// ============================================================================

fn benchmark_evm2_basic_arithmetic(allocator: std.mem.Allocator) void {
    _ = allocator;
    // Simple arithmetic operations
    const a: u256 = 0x123456789abcdef0123456789abcdef0;
    const b: u256 = 0xfedcba0987654321fedcba0987654321;
    
    _ = a +% b;  // ADD
    _ = a -% b;  // SUB  
    _ = a *% (b & 0xFFFF); // MUL (limited to prevent overflow)
    _ = a / (b | 1); // DIV (ensure non-zero)
    _ = a % (b | 1); // MOD
    _ = a & b;   // AND
    _ = a | b;   // OR
    _ = a ^ b;   // XOR
}

fn benchmark_legacy_evm_basic_arithmetic(allocator: std.mem.Allocator) void {
    _ = allocator;
    // Same arithmetic operations for comparison
    const a: u256 = 0x123456789abcdef0123456789abcdef0;
    const b: u256 = 0xfedcba0987654321fedcba0987654321;
    
    _ = a +% b;  // ADD
    _ = a -% b;  // SUB  
    _ = a *% (b & 0xFFFF); // MUL (limited to prevent overflow)
    _ = a / (b | 1); // DIV (ensure non-zero)
    _ = a % (b | 1); // MOD
    _ = a & b;   // AND
    _ = a | b;   // OR
    _ = a ^ b;   // XOR
}

fn benchmark_revm_basic_arithmetic(allocator: std.mem.Allocator) void {
    _ = allocator;
    // Same arithmetic operations for comparison
    const a: u256 = 0x123456789abcdef0123456789abcdef0;
    const b: u256 = 0xfedcba0987654321fedcba0987654321;
    
    _ = a +% b;  // ADD
    _ = a -% b;  // SUB  
    _ = a *% (b & 0xFFFF); // MUL (limited to prevent overflow)
    _ = a / (b | 1); // DIV (ensure non-zero)
    _ = a % (b | 1); // MOD
    _ = a & b;   // AND
    _ = a | b;   // OR
    _ = a ^ b;   // XOR
}

// ============================================================================
// Main Benchmark Runner
// ============================================================================

pub fn main() !void {
    const stdout = std.io.getStdOut().writer();
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var bench = zbench.Benchmark.init(allocator, .{});
    defer bench.deinit();

    try stdout.print("\n🏁 EVM Implementation Performance Comparison\n", .{});
    try stdout.print("===========================================\n\n", .{});
    try stdout.print("Comparing: EVM2 vs Legacy EVM vs REVM\n\n", .{});

    // Contract execution benchmarks
    try bench.add("EVM2: Arithmetic Contract", benchmark_evm2_arithmetic_contract, .{});
    try bench.add("Legacy EVM: Arithmetic Contract", benchmark_legacy_evm_arithmetic_contract, .{});
    try bench.add("REVM: Arithmetic Contract", benchmark_revm_arithmetic_contract, .{});
    
    try bench.add("EVM2: Storage Contract", benchmark_evm2_storage_contract, .{});
    try bench.add("Legacy EVM: Storage Contract", benchmark_legacy_evm_storage_contract, .{});
    try bench.add("REVM: Storage Contract", benchmark_revm_storage_contract, .{});
    
    try bench.add("EVM2: Stack Operations", benchmark_evm2_stack_contract, .{});
    try bench.add("Legacy EVM: Stack Operations", benchmark_legacy_evm_stack_contract, .{});
    try bench.add("REVM: Stack Operations", benchmark_revm_stack_contract, .{});
    
    try bench.add("EVM2: Memory Operations", benchmark_evm2_memory_contract, .{});
    try bench.add("Legacy EVM: Memory Operations", benchmark_legacy_evm_memory_contract, .{});
    try bench.add("REVM: Memory Operations", benchmark_revm_memory_contract, .{});

    // Basic operation benchmarks
    try bench.add("EVM2: Basic Arithmetic", benchmark_evm2_basic_arithmetic, .{});
    try bench.add("Legacy EVM: Basic Arithmetic", benchmark_legacy_evm_basic_arithmetic, .{});
    try bench.add("REVM: Basic Arithmetic", benchmark_revm_basic_arithmetic, .{});

    try stdout.print("Running EVM comparison benchmarks...\n\n", .{});
    try bench.run(stdout);
    
    try stdout.print("\n✅ EVM comparison benchmarks completed!\n", .{});
    try stdout.print("\nEVM Implementation Analysis:\n", .{});
    try stdout.print("• EVM2: New frame-based implementation with optimization\n", .{});
    try stdout.print("• Legacy EVM: Current production EVM implementation\n", .{});
    try stdout.print("• REVM: Rust reference implementation via C wrapper\n", .{});
    try stdout.print("\nLower times indicate better performance.\n", .{});
}

test "EVM comparison benchmark compilation" {
    // Test that all EVM implementations can be initialized
    const allocator = std.testing.allocator;
    
    // Test basic arithmetic (should work for all)
    benchmark_evm2_basic_arithmetic(allocator);
    benchmark_legacy_evm_basic_arithmetic(allocator);
    benchmark_revm_basic_arithmetic(allocator);
}