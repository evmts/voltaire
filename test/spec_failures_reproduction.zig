const std = @import("std");
const differential_testor = @import("differential/differential_testor.zig");

// Test case 1: SSTORE combinations with initial values (sstore_combinations_initial20_2_Paris)
// This test verifies SSTORE opcode behavior with different initial storage values
// Requires Paris hardfork for correct gas calculations
test "sstore_combinations_initial20_2_paris" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Contract code: Set storage slots 0, 1, 2 to values 0, 1, 2
    // Assembly: [[0]] 0  [[1]] 1  [[2]] 2
    // This tests SSTORE gas costs when initial storage value is 2, changed to 0
    const bytecode = [_]u8{
        0x60, 0x00, // PUSH1 0 (value)
        0x60, 0x00, // PUSH1 0 (key)
        0x55,       // SSTORE (set storage[0] = 0)
        0x60, 0x01, // PUSH1 1 (value)
        0x60, 0x01, // PUSH1 1 (key)
        0x55,       // SSTORE (set storage[1] = 1)
        0x60, 0x02, // PUSH1 2 (value)
        0x60, 0x02, // PUSH1 2 (key)
        0x55,       // SSTORE (set storage[2] = 2)
        0x00,       // STOP
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 2: Random state test with complex bytecode patterns
// Tests edge cases in opcode execution and stack management
test "random_state_test_121_complex_execution" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Complex bytecode mixing arithmetic, comparisons, and jumps
    // This pattern often causes divergences between Frame and MinimalEvm
    const bytecode = [_]u8{
        0x42,       // TIMESTAMP
        0x18,       // XOR
        0x45,       // GASLIMIT
        0x04,       // DIV
        0x8f,       // SWAP16 (will likely cause stack issues)
        0x43,       // NUMBER
        0x44,       // DIFFICULTY
        0x43,       // NUMBER
        0x24,       // AND
        0x43,       // NUMBER
        0x45,       // GASLIMIT
        0x14,       // EQ
        0x90,       // SWAP1
        0x45,       // GASLIMIT
        0x57,       // JUMPI (conditional jump)
        0x5b,       // JUMPDEST
        0x00,       // STOP
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 3: Empty balance parsing edge case
// Tests handling of accounts with zero balance
test "empty_balance_account_handling" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Bytecode that checks balance and performs operations
    const bytecode = [_]u8{
        0x30,       // ADDRESS (get current contract address)
        0x31,       // BALANCE (get balance of current contract)
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE (store balance at memory[0])
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3,       // RETURN
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 4: SSTORE gas calculation edge case (sstore_combinations_initial00_Paris)
// Tests SSTORE from zero to non-zero value
test "sstore_combinations_initial00_paris" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Contract that tests SSTORE from 0 to various values (cold storage)
    const bytecode = [_]u8{
        0x60, 0x01, // PUSH1 1 (value)
        0x60, 0x00, // PUSH1 0 (key)
        0x55,       // SSTORE (set storage[0] = 1, was 0)
        0x60, 0x02, // PUSH1 2 (value)
        0x60, 0x01, // PUSH1 1 (key)
        0x55,       // SSTORE (set storage[1] = 2, was 0)
        0x60, 0x00, // PUSH1 0 (return value)
        0x60, 0x00, // PUSH1 0 (return offset)
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3,       // RETURN
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 5: Complex random state with multiple operations
// Tests instruction sequences that may cause execution divergences
test "random_state_test_248_multi_op" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Complex bytecode mixing arithmetic and storage operations
    const bytecode = [_]u8{
        0x60, 0xff, // PUSH1 255
        0x80,       // DUP1
        0x81,       // DUP2
        0x01,       // ADD (255 + 255 = 510, but wraps to 254)
        0x90,       // SWAP1
        0x50,       // POP
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE (store result)
        0x42,       // TIMESTAMP
        0x43,       // NUMBER
        0x44,       // DIFFICULTY
        0x45,       // GASLIMIT
        0x14,       // EQ (compare DIFFICULTY and GASLIMIT)
        0x60, 0x01, // PUSH1 1
        0x55,       // SSTORE (store comparison result)
        0x00,       // STOP
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 6: JUMP table validation
// Tests invalid jump destinations and jump validation
test "random_state_test_143_jump_validation" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Bytecode with potentially invalid JUMP destinations
    const bytecode = [_]u8{
        0x60, 0x08, // PUSH1 8 (jump destination)
        0x56,       // JUMP
        0x60, 0x01, // PUSH1 1 (dead code - should not execute)
        0x60, 0x00, // PUSH1 0 (dead code)
        0x55,       // SSTORE (dead code)
        0x5b,       // JUMPDEST (valid destination at position 8)
        0x60, 0x42, // PUSH1 0x42
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE
        0x00,       // STOP
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 7: Memory expansion edge case
// Tests large memory offsets and expansion costs
test "random_state_test_174_memory_expansion" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Bytecode that tests memory expansion with large offsets
    const bytecode = [_]u8{
        0x60, 0xff, // PUSH1 255 (value)
        0x61, 0xff, 0xff, // PUSH2 0xffff (large offset)
        0x52,       // MSTORE (expand memory to large offset)
        0x60, 0x00, // PUSH1 0
        0x51,       // MLOAD (load from memory[0])
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE (store loaded value)
        0x00,       // STOP
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 8: Stack underflow edge case
// Tests operations that may cause stack underflow
test "random_state_test_309_stack_underflow" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Bytecode that attempts operations with insufficient stack items
    // This should fail gracefully, not crash
    const bytecode = [_]u8{
        0x01,       // ADD (requires 2 stack items, but stack is empty)
        0x01,       // ADD (still no items on stack)
        0x01,       // ADD (still no items on stack)
        0x00,       // STOP
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 9: Division by zero edge case
// Tests division operations with zero divisor
test "random_state_test_59_division_by_zero" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Bytecode: DIV with zero divisor should return 0
    const bytecode = [_]u8{
        0x60, 0x0a, // PUSH1 10 (dividend)
        0x60, 0x00, // PUSH1 0 (divisor - zero)
        0x04,       // DIV (10 / 0 should return 0)
        0x60, 0x00, // PUSH1 0 (memory offset)
        0x52,       // MSTORE (store result)
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3,       // RETURN
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 10: Large gas consumption patterns
// Tests opcodes that consume varying amounts of gas
test "random_state_test_280_gas_consumption" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Bytecode that performs many operations with different gas costs
    const bytecode = [_]u8{
        0x60, 0x01, // PUSH1 1 (low gas cost)
        0x60, 0x02, // PUSH1 2
        0x60, 0x03, // PUSH1 3
        0x60, 0x04, // PUSH1 4
        0x60, 0x05, // PUSH1 5
        0x01,       // ADD (medium gas cost)
        0x01,       // ADD
        0x01,       // ADD
        0x01,       // ADD
        0x50,       // POP (low gas cost)
        0x20,       // KECCAK256 would be high gas, but needs memory setup
        // Instead use multiple SSTORE operations (high gas cost)
        0x60, 0xaa, // PUSH1 0xaa
        0x60, 0x00, // PUSH1 0
        0x55,       // SSTORE
        0x60, 0xbb, // PUSH1 0xbb
        0x60, 0x01, // PUSH1 1
        0x55,       // SSTORE
        0x60, 0xcc, // PUSH1 0xcc
        0x60, 0x02, // PUSH1 2
        0x55,       // SSTORE
        0x00,       // STOP
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 11: EXP operation edge cases
// Tests exponentiation with various inputs that may cause issues
test "exp_edge_cases" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Test EXP with zero exponent (should always return 1)
    const bytecode = [_]u8{
        0x60, 0x00, // PUSH1 0 (exponent)
        0x60, 0xff, // PUSH1 255 (base)
        0x0a,       // EXP (255^0 should equal 1)
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        // Test EXP with base 0 (should return 0)
        0x60, 0x05, // PUSH1 5 (exponent)
        0x60, 0x00, // PUSH1 0 (base)
        0x0a,       // EXP (0^5 should equal 0)
        0x60, 0x20, // PUSH1 32
        0x52,       // MSTORE
        0x60, 0x40, // PUSH1 64
        0x60, 0x00, // PUSH1 0
        0xf3,       // RETURN
    };

    try testor.test_bytecode(&bytecode);
}

// Test case 12: MOD operation edge cases
// Tests modulo operations with various edge cases
test "mod_edge_cases" {
    var testor = try differential_testor.DifferentialTestor.init(std.testing.allocator);
    defer testor.deinit();

    // Test MOD with zero modulus (should return 0)
    const bytecode = [_]u8{
        0x60, 0x00, // PUSH1 0 (modulus)
        0x60, 0x0a, // PUSH1 10 (dividend)
        0x06,       // MOD (10 % 0 should return 0)
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        // Test MOD with same values (should return 0)
        0x60, 0x07, // PUSH1 7 (modulus)
        0x60, 0x07, // PUSH1 7 (dividend)
        0x06,       // MOD (7 % 7 should return 0)
        0x60, 0x20, // PUSH1 32
        0x52,       // MSTORE
        0x60, 0x40, // PUSH1 64
        0x60, 0x00, // PUSH1 0
        0xf3,       // RETURN
    };

    try testor.test_bytecode(&bytecode);
}