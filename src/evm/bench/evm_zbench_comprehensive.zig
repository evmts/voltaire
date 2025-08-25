const std = @import("std");
const zbench = @import("zbench");
const crypto = @import("crypto");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

// ============================================================================
// Performance-Critical EVM Operations
// ============================================================================

/// Memory expansion patterns - tests memory growth under different scenarios
fn benchmark_memory_expansion_patterns(allocator: std.mem.Allocator) void {
    var memory = std.ArrayList(u8){};
    defer memory.deinit(allocator);
    
    // Simulate EVM memory expansion in 32-byte chunks
    const expansion_sizes = [_]usize{ 32, 64, 128, 256, 512, 1024, 2048, 4096 };
    for (expansion_sizes) |size| {
        memory.resize(allocator, size) catch continue;
        // Touch memory to ensure allocation
        if (memory.items.len > 0) {
            memory.items[size - 1] = 0xAA;
        }
    }
}

/// Large memory copies - tests MCOPY-like operations
fn benchmark_large_memory_copies(allocator: std.mem.Allocator) void {
    const source = allocator.alloc(u8, 4096) catch return;
    defer allocator.free(source);
    const dest = allocator.alloc(u8, 4096) catch return;
    defer allocator.free(dest);
    
    // Fill source with pattern
    for (source, 0..) |*byte, i| {
        byte.* = @truncate(i);
    }
    
    // Perform multiple copy operations of different sizes
    const copy_sizes = [_]usize{ 32, 128, 512, 1024, 2048, 4096 };
    for (copy_sizes) |size| {
        if (size <= source.len) {
            @memcpy(dest[0..size], source[0..size]);
        }
    }
}

/// Memory zeroing operations
fn benchmark_memory_zeroing(allocator: std.mem.Allocator) void {
    const memory = allocator.alloc(u8, 8192) catch return;
    defer allocator.free(memory);
    
    // Zero different sized regions
    const zero_sizes = [_]usize{ 32, 128, 512, 1024, 4096, 8192 };
    for (zero_sizes) |size| {
        if (size <= memory.len) {
            @memset(memory[0..size], 0);
        }
    }
}

/// Deep stack DUP/SWAP operations
fn benchmark_deep_stack_dup_swap(allocator: std.mem.Allocator) void {
    _ = allocator;
    var stack = [_]u256{0} ** 1024;
    var top: usize = 0;
    
    // Fill stack with test values
    for (0..16) |i| {
        stack[top] = @intCast(i + 100);
        top += 1;
    }
    
    // Simulate DUP operations (DUP1, DUP2, DUP16)
    const dup_depths = [_]usize{ 1, 2, 4, 8, 16 };
    for (dup_depths) |depth| {
        if (top >= depth) {
            const value = stack[top - depth];
            stack[top] = value;
            top += 1;
        }
    }
    
    // Simulate SWAP operations
    for (dup_depths) |depth| {
        if (top > depth) {
            const temp = stack[top - 1];
            stack[top - 1] = stack[top - 1 - depth];
            stack[top - 1 - depth] = temp;
        }
    }
}

/// Stack thrashing patterns - alternating push/pop
fn benchmark_stack_thrashing_patterns(allocator: std.mem.Allocator) void {
    _ = allocator;
    var stack = [_]u256{0} ** 1024;
    var top: usize = 0;
    
    // Thrashing pattern: push multiple, pop multiple
    for (0..100) |cycle| {
        // Push phase
        for (0..10) |i| {
            if (top < stack.len) {
                stack[top] = @intCast(cycle * 10 + i);
                top += 1;
            }
        }
        
        // Pop phase
        for (0..10) |_| {
            if (top > 0) {
                top -= 1;
                _ = stack[top];
            }
        }
    }
}

// ============================================================================
// Cryptographic and Hashing Operations
// ============================================================================

/// KECCAK256 with different input sizes
fn benchmark_keccak256_different_sizes(allocator: std.mem.Allocator) void {
    const input_sizes = [_]usize{ 0, 32, 64, 128, 256, 512, 1024, 2048 };
    
    for (input_sizes) |size| {
        const input = allocator.alloc(u8, size) catch continue;
        defer allocator.free(input);
        
        // Fill with pattern
        for (input, 0..) |*byte, i| {
            byte.* = @truncate(i);
        }
        
        const hash = crypto.Hash.keccak256(input);
        _ = hash; // Prevent optimization
    }
}

/// Sequential hashing operations
fn benchmark_keccak256_sequential_hashing(allocator: std.mem.Allocator) void {
    var current_hash = [_]u8{0} ** 32;
    
    // Chain hashing: hash(hash(hash(...)))
    for (0..50) |_| {
        const new_hash = crypto.Hash.keccak256(&current_hash);
        current_hash = new_hash;
    }
    
    _ = allocator; // Suppress unused warning
}

/// Address computation patterns
fn benchmark_address_computation(allocator: std.mem.Allocator) void {
    _ = allocator;
    const sender = primitives.Address.from_u256(0x1234567890abcdef1234567890abcdef12345678);
    
    // CREATE address computation
    for (0..100) |nonce| {
        const address = primitives.Address.get_contract_address(sender, nonce);
        _ = address;
    }
    
    // CREATE2 address computation
    const init_code = [_]u8{0x60, 0x80, 0x60, 0x40, 0x52}; // Simple init code
    for (0..100) |i| {
        const salt: [32]u8 = @bitCast(@as(u256, i));
        const init_code_hash = crypto.Hash.keccak256(&init_code);
        const address = primitives.Address.get_create2_address(sender, salt, init_code_hash);
        _ = address;
    }
}

// ============================================================================
// Real-World Contract Patterns
// ============================================================================

/// Mapping slot calculation (Solidity storage layout)
fn benchmark_mapping_slot_calculation(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    // Simulate mapping[address] storage slot calculation
    // slot = keccak256(abi.encodePacked(key, slot))
    const mapping_slot: u256 = 5; // Storage slot of mapping
    const keys = [_]u256{ 0x1234, 0x5678, 0x9abc, 0xdef0, 0x1111, 0x2222, 0x3333, 0x4444 };
    
    for (keys) |key| {
        var input: [64]u8 = undefined;
        std.mem.writeInt(u256, input[0..32], key, .big);
        std.mem.writeInt(u256, input[32..64], mapping_slot, .big);
        
        const slot_hash = crypto.Hash.keccak256(&input);
        _ = slot_hash;
    }
}

/// Dynamic array access patterns
fn benchmark_dynamic_array_access(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    // Dynamic array slot calculation: slot = keccak256(array_slot) + index
    const array_slot: u256 = 10;
    var slot_bytes: [32]u8 = undefined;
    std.mem.writeInt(u256, &slot_bytes, array_slot, .big);
    const base_slot_hash = crypto.Hash.keccak256(&slot_bytes);
    const base_slot = std.mem.readInt(u256, &base_slot_hash, .big);
    
    // Access multiple array elements
    for (0..50) |index| {
        const element_slot = base_slot +% @as(u256, index);
        _ = element_slot;
    }
}

/// Struct packing/unpacking operations
fn benchmark_struct_encode_decode(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    // Simulate struct with multiple fields packed into storage slots
    const values = [_]u256{ 0x1234, 0x5678, 0x9abc, 0xdef0 };
    
    // Pack multiple values into single slot (like Solidity tight packing)
    for (0..25) |_| {
        var packed_value: u256 = 0;
        for (values, 0..) |value, shift| {
            const shifted_value = (value & 0xFFFF) << @intCast(shift * 16);
            packed_value |= shifted_value;
        }
        
        // Unpack values
        for (0..4) |i| {
            const shift: u8 = @intCast(i * 16);
            const unpacked = (packed_value >> shift) & 0xFFFF;
            _ = unpacked;
        }
    }
}

// ============================================================================
// Gas-Heavy Operations  
// ============================================================================

/// MODEXP operation simulation
fn benchmark_modexp_operations(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    // Simulate small MODEXP operations
    const base: u256 = 0x123456789abcdef;
    const exponent: u256 = 0x10001; // Common RSA exponent
    const modulus: u256 = 0xffffffffffffffffc90fdaa22168c234c4c6628b80dc1cd1;
    
    for (0..10) |_| {
        // Simple modular exponentiation (not cryptographically secure)
        var result: u256 = 1;
        var exp = exponent;
        var base_mod = base % modulus;
        
        while (exp > 0) {
            if (exp & 1 == 1) {
                result = (result *% base_mod) % modulus;
            }
            base_mod = (base_mod *% base_mod) % modulus;
            exp >>= 1;
        }
        _ = &result;
    }
}

/// ECRECOVER simulation (signature recovery pattern)
fn benchmark_ecrecover_operations(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    // Simulate the computational pattern of ECRECOVER
    const hash = [_]u8{0x12, 0x34, 0x56, 0x78} ** 8; // 32 bytes
    const signatures = [_][64]u8{
        ([_]u8{0xaa} ** 32) ++ ([_]u8{0xbb} ** 32),
        ([_]u8{0xcc} ** 32) ++ ([_]u8{0xdd} ** 32),
        ([_]u8{0xee} ** 32) ++ ([_]u8{0xff} ** 32),
    };
    
    for (signatures) |sig| {
        // Simulate signature verification computations
        var combined: [96]u8 = undefined;
        @memcpy(combined[0..32], &hash);
        @memcpy(combined[32..96], &sig);
        
        const verification_hash = crypto.Hash.keccak256(&combined);
        _ = verification_hash;
    }
}

/// CREATE2 address computation under load
fn benchmark_create2_address_computation(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    const deployer = primitives.Address.from_u256(0x1234567890abcdef1234567890abcdef12345678);
    const init_codes = [_][]const u8{
        &[_]u8{0x60, 0x80, 0x60, 0x40, 0x52}, // Constructor pattern 1
        &[_]u8{0x60, 0x00, 0x60, 0x00, 0xfd}, // Constructor pattern 2  
        &[_]u8{0x60, 0x20, 0x60, 0x10, 0xf3}, // Constructor pattern 3
    };
    
    for (init_codes, 0..) |init_code, code_idx| {
        const init_code_hash = crypto.Hash.keccak256(init_code);
        
        for (0..33) |salt_val| { // 33 iterations per init code
            const salt: [32]u8 = @bitCast(@as(u256, salt_val + code_idx * 100));
            const address = primitives.Address.get_create2_address(deployer, salt, init_code_hash);
            _ = address;
        }
    }
}

// ============================================================================
// EVM-Specific Optimizations
// ============================================================================

/// Bytecode planning overhead measurement
fn benchmark_bytecode_planning_overhead(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    // Simulate bytecode analysis patterns
    const bytecodes = [_][]const u8{
        &[_]u8{0x60, 0x01, 0x60, 0x02, 0x01, 0x00}, // PUSH1 1, PUSH1 2, ADD, STOP
        &[_]u8{0x60, 0x10, 0x80, 0x91, 0x90, 0x01, 0x00}, // PUSH1 16, DUP1, SWAP2, SWAP1, ADD, STOP  
        &[_]u8{0x5b, 0x60, 0x01, 0x80, 0x56, 0x5b, 0x00}, // JUMPDEST, PUSH1 1, DUP1, JUMP, JUMPDEST, STOP
    };
    
    for (bytecodes) |bytecode| {
        // Simulate jump destination analysis
        var jump_dests = std.bit_set.IntegerBitSet(256).initEmpty();
        
        var pc: usize = 0;
        while (pc < bytecode.len) {
            const opcode = bytecode[pc];
            
            // Mark JUMPDEST
            if (opcode == 0x5b) {
                jump_dests.set(pc);
            }
            
            // Handle PUSH instructions (skip immediate data)
            if (opcode >= 0x60 and opcode <= 0x7f) {
                const push_size = opcode - 0x5f;
                pc += push_size;
            }
            
            pc += 1;
        }
        
        _ = jump_dests.count(); // Prevent optimization
    }
}

/// Fused vs separate opcode comparison
fn benchmark_fused_vs_separate_opcodes(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    const test_values = [_]u256{ 100, 200, 300, 400, 500 };
    
    // Separate operations: PUSH + ADD
    for (test_values) |value| {
        var stack = [_]u256{0} ** 16;
        var top: usize = 1;
        stack[0] = 50; // Initial stack value
        
        // PUSH operation
        stack[top] = value;
        top += 1;
        
        // ADD operation  
        top -= 1;
        const b = stack[top];
        const a = stack[top - 1];
        stack[top - 1] = a +% b;
        
        _ = stack[0]; // Prevent optimization
    }
    
    // Fused operation: PUSH_ADD (simulated)
    for (test_values) |value| {
        var stack = [_]u256{0} ** 16;
        stack[0] = 50; // Initial stack value
        
        // Fused PUSH_ADD operation
        const a = stack[0];
        stack[0] = a +% value;
        
        _ = stack[0]; // Prevent optimization
    }
}

/// Stack implementation comparison
fn benchmark_stack_implementations(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    // Array-based stack (current)
    var array_stack = [_]u256{0} ** 32;
    var array_top: usize = 0;
    
    for (0..100) |i| {
        // Push
        array_stack[array_top] = @intCast(i);
        array_top += 1;
        
        // Occasional pop
        if (i % 10 == 0 and array_top > 0) {
            array_top -= 1;
            _ = array_stack[array_top];
        }
    }
    
    // Pointer-based stack simulation
    var pointer_stack = [_]u256{0} ** 32;
    var pointer_top: usize = 32;
    
    for (0..100) |i| {
        // Push (pointer moves down)
        if (pointer_top > 0) {
            pointer_top -= 1;
            pointer_stack[pointer_top] = @intCast(i);
        }
        
        // Occasional pop
        if (i % 10 == 0 and pointer_top < 32) {
            _ = pointer_stack[pointer_top];
            pointer_top += 1;
        }
    }
}

// ============================================================================
// Microbenchmarks for Optimization
// ============================================================================

/// u256 arithmetic implementation comparison
fn benchmark_u256_arithmetic_implementations(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    const values = [_]u256{ 
        0x123456789abcdef0123456789abcdef0,
        0xfedcba0987654321fedcba0987654321,
        0x1111111111111111111111111111111,
        0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa,
    };
    
    // Addition patterns
    for (values) |a| {
        for (values) |b| {
            // Wrapping addition (EVM semantics)
            const result_wrap = a +% b;
            _ = result_wrap;
            
            // Overflow checking addition
            const result_check = @addWithOverflow(a, b);
            _ = result_check;
        }
    }
    
    // Multiplication patterns
    for (values[0..2]) |a| { // Limit to prevent overflow
        for (values[0..2]) |b| {
            const result = a *% b;
            _ = result;
        }
    }
    
    // Division patterns
    for (values) |a| {
        for (values[1..]) |b| { // Skip zero
            const result = a / b;
            _ = result;
        }
    }
}

/// Memory access pattern optimization
fn benchmark_memory_access_patterns(allocator: std.mem.Allocator) void {
    const memory = allocator.alloc(u8, 4096) catch return;
    defer allocator.free(memory);
    
    // Sequential access
    for (0..memory.len) |i| {
        memory[i] = @truncate(i);
    }
    
    // Random access pattern
    const offsets = [_]usize{ 0, 512, 1024, 1536, 2048, 2560, 3072, 3584 };
    for (offsets) |offset| {
        if (offset + 32 <= memory.len) {
            // Simulate 32-byte EVM word access
            const word_bytes = memory[offset..offset + 32];
            var sum: u32 = 0;
            for (word_bytes) |byte| {
                sum +%= byte;
            }
            memory[offset] = @truncate(sum);
        }
    }
    
    // Strided access pattern (cache unfriendly)
    var stride_offset: usize = 0;
    while (stride_offset < memory.len) {
        memory[stride_offset] = 0xFF;
        stride_offset += 256; // Large stride
    }
}

/// Opcode dispatch method comparison
fn benchmark_opcode_dispatch_methods(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    const opcodes = [_]u8{ 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a };
    
    // Switch-based dispatch
    var switch_result: u32 = 0;
    for (opcodes) |opcode| {
        switch (opcode) {
            0x01 => switch_result +%= 1,  // ADD
            0x02 => switch_result +%= 2,  // MUL
            0x03 => switch_result +%= 3,  // SUB
            0x04 => switch_result +%= 4,  // DIV
            0x05 => switch_result +%= 5,  // SDIV
            0x06 => switch_result +%= 6,  // MOD
            0x07 => switch_result +%= 7,  // SMOD
            0x08 => switch_result +%= 8,  // ADDMOD
            0x09 => switch_result +%= 9,  // MULMOD
            0x0a => switch_result +%= 10, // EXP
            else => switch_result +%= 0,
        }
    }
    
    // Function pointer table dispatch (simulated)
    const dispatch_table = [_]u8{ 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 };
    var table_result: u32 = 0;
    for (opcodes) |opcode| {
        if (opcode >= 0x01 and opcode <= 0x0a) {
            table_result +%= dispatch_table[opcode - 0x01];
        }
    }
    
    _ = switch_result + table_result; // Prevent optimization
}

// ============================================================================
// Integration Benchmarks
// ============================================================================

/// Storage access pattern simulation
fn benchmark_storage_access_patterns(allocator: std.mem.Allocator) void {
    
    // Simulate different storage access patterns
    var storage_map = std.HashMap(u256, u256, std.hash_map.AutoContext(u256), 80).init(allocator);
    defer storage_map.deinit();
    
    // Sequential slot access
    for (0..50) |i| {
        const slot: u256 = i;
        const value: u256 = i * 1000;
        storage_map.put(slot, value) catch continue;
    }
    
    // Random slot access  
    const random_slots = [_]u256{ 0x1000, 0x2000, 0x3000, 0x4000, 0x5000 };
    for (random_slots, 0..) |slot, i| {
        const value: u256 = @intCast(i + 5000);
        storage_map.put(slot, value) catch continue;
    }
    
    // Read access patterns
    for (0..25) |i| {
        const slot: u256 = i;
        _ = storage_map.get(slot);
    }
}

/// Account state operation patterns
fn benchmark_account_state_operations(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    const accounts = [_]Address{
        primitives.Address.from_u256(0x1111111111111111111111111111111111111111),
        primitives.Address.from_u256(0x2222222222222222222222222222222222222222),
        primitives.Address.from_u256(0x3333333333333333333333333333333333333333),
        primitives.Address.from_u256(0x4444444444444444444444444444444444444444),
    };
    
    // Simulate account balance and nonce updates
    for (accounts, 0..) |account, i| {
        // Balance calculations
        const base_balance: u256 = @intCast((i + 1) * 1000000);
        const transfer_amount: u256 = @intCast(i * 100);
        const new_balance = base_balance -% transfer_amount;
        
        // Nonce calculations
        const current_nonce: u64 = @intCast(i * 10);
        const new_nonce = current_nonce + 1;
        
        _ = account;
        _ = new_balance;
        _ = new_nonce;
    }
}

/// Transient storage simulation (EIP-1153)
fn benchmark_transient_storage_operations(allocator: std.mem.Allocator) void {
    // Transient storage simulation using HashMap
    var transient_storage = std.HashMap(u256, u256, std.hash_map.AutoContext(u256), 80).init(allocator);
    defer transient_storage.deinit();
    
    // TSTORE/TLOAD pattern
    const slots = [_]u256{ 0, 1, 2, 3, 4, 5, 6, 7 };
    
    // Store phase
    for (slots, 0..) |slot, i| {
        const value: u256 = @intCast(i * 100 + 42);
        transient_storage.put(slot, value) catch continue;
    }
    
    // Load phase  
    for (slots) |slot| {
        _ = transient_storage.get(slot);
    }
    
    // Clear phase (transaction end simulation)
    transient_storage.clearAndFree();
}

// ============================================================================
// Regression Testing Benchmarks
// ============================================================================

/// Baseline EVM operations for regression detection
fn benchmark_baseline_evm_operations(allocator: std.mem.Allocator) void {
    _ = allocator;
    
    // Core arithmetic baseline
    const a: u256 = 0x123456789abcdef0123456789abcdef0;
    const b: u256 = 0xfedcba0987654321fedcba0987654321;
    
    // Basic operations that should remain fast
    _ = a +% b;  // ADD
    _ = a -% b;  // SUB  
    _ = a *% b;  // MUL
    _ = a / (b | 1); // DIV (ensure non-zero)
    _ = a % (b | 1); // MOD
    _ = a & b;   // AND
    _ = a | b;   // OR
    _ = a ^ b;   // XOR
    _ = ~a;      // NOT
    
    // Comparison operations
    _ = if (a < b) 1 else 0; // LT
    _ = if (a > b) 1 else 0; // GT  
    _ = if (a == b) 1 else 0; // EQ
    _ = if (a == 0) 1 else 0; // ISZERO
}

/// Allocation pattern tracking
fn benchmark_allocation_patterns(allocator: std.mem.Allocator) void {
    // Test different allocation patterns that EVM operations use
    
    // Small frequent allocations (like temporary buffers)
    for (0..50) |_| {
        const small_buffer = allocator.alloc(u8, 32) catch continue;
        defer allocator.free(small_buffer);
        small_buffer[0] = 0xAA;
    }
    
    // Medium allocations (like contract code)
    for (0..10) |_| {
        const medium_buffer = allocator.alloc(u8, 1024) catch continue;
        defer allocator.free(medium_buffer);
        medium_buffer[0] = 0xBB;
        medium_buffer[1023] = 0xCC;
    }
    
    // Large allocations (like memory expansion)
    for (0..3) |_| {
        const large_buffer = allocator.alloc(u8, 16384) catch continue;
        defer allocator.free(large_buffer);
        large_buffer[0] = 0xDD;
        large_buffer[16383] = 0xEE;
    }
}

// ============================================================================
// Main Benchmark Runner
// ============================================================================

pub fn main() !void {
    var stdout_buffer: [4096]u8 = undefined;
    var stdout_writer = std.fs.File.stdout().writer(&stdout_buffer);
    const stdout = &stdout_writer.interface;
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var bench = zbench.Benchmark.init(allocator, .{});
    defer bench.deinit();

    try stdout.print("\n🚀 EVM Comprehensive Performance Benchmarks\n", .{});
    try stdout.print("============================================\n\n", .{});
    try stdout.flush();

    // Performance-Critical EVM Operations
    try bench.add("Memory Expansion Patterns", benchmark_memory_expansion_patterns, .{});
    try bench.add("Large Memory Copies", benchmark_large_memory_copies, .{});
    try bench.add("Memory Zeroing", benchmark_memory_zeroing, .{});
    try bench.add("Deep Stack DUP/SWAP", benchmark_deep_stack_dup_swap, .{});
    try bench.add("Stack Thrashing Patterns", benchmark_stack_thrashing_patterns, .{});

    // Cryptographic and Hashing Operations
    try bench.add("KECCAK256 Different Sizes", benchmark_keccak256_different_sizes, .{});
    try bench.add("KECCAK256 Sequential", benchmark_keccak256_sequential_hashing, .{});
    try bench.add("Address Computation", benchmark_address_computation, .{});

    // Real-World Contract Patterns
    try bench.add("Mapping Slot Calculation", benchmark_mapping_slot_calculation, .{});
    try bench.add("Dynamic Array Access", benchmark_dynamic_array_access, .{});
    try bench.add("Struct Encode/Decode", benchmark_struct_encode_decode, .{});

    // Gas-Heavy Operations
    try bench.add("MODEXP Operations", benchmark_modexp_operations, .{});
    try bench.add("ECRECOVER Operations", benchmark_ecrecover_operations, .{});
    try bench.add("CREATE2 Address Computation", benchmark_create2_address_computation, .{});

    // EVM-Specific Optimizations
    try bench.add("Bytecode Planning Overhead", benchmark_bytecode_planning_overhead, .{});
    try bench.add("Fused vs Separate Opcodes", benchmark_fused_vs_separate_opcodes, .{});
    try bench.add("Stack Implementations", benchmark_stack_implementations, .{});

    // Microbenchmarks for Optimization
    try bench.add("u256 Arithmetic Implementations", benchmark_u256_arithmetic_implementations, .{});
    try bench.add("Memory Access Patterns", benchmark_memory_access_patterns, .{});
    try bench.add("Opcode Dispatch Methods", benchmark_opcode_dispatch_methods, .{});

    // Integration Benchmarks
    try bench.add("Storage Access Patterns", benchmark_storage_access_patterns, .{});
    try bench.add("Account State Operations", benchmark_account_state_operations, .{});
    try bench.add("Transient Storage Operations", benchmark_transient_storage_operations, .{});

    // Regression Testing Benchmarks
    try bench.add("Baseline EVM Operations", benchmark_baseline_evm_operations, .{});
    try bench.add("Allocation Patterns", benchmark_allocation_patterns, .{});

    try stdout.print("Running comprehensive EVM performance benchmarks...\n\n", .{});
    try stdout.flush();
    try bench.run(stdout);
    
    try stdout.print("\n✅ Comprehensive EVM benchmarks completed!\n", .{});
    try stdout.print("\nBenchmark Categories:\n", .{});
    try stdout.flush();
    try stdout.print("• Performance-Critical: Memory, stack operations under stress\n", .{});
    try stdout.print("• Cryptographic: Hashing, address computation patterns\n", .{});
    try stdout.print("• Real-World: Solidity storage patterns, contract interactions\n", .{});
    try stdout.print("• Gas-Heavy: Expensive operations like MODEXP, ECRECOVER\n", .{});
    try stdout.print("• EVM-Specific: Optimization strategies and architectural benefits\n", .{});
    try stdout.print("• Microbenchmarks: Low-level optimization opportunities\n", .{});
    try stdout.print("• Integration: Database, storage, account state patterns\n", .{});
    try stdout.print("• Regression: Baseline performance tracking\n", .{});
}

test "comprehensive benchmark compilation" {
    // Test that our benchmarks compile correctly
    const allocator = std.testing.allocator;
    
    // Test a few representative benchmarks
    benchmark_baseline_evm_operations(allocator);
    benchmark_keccak256_sequential_hashing(allocator);
    benchmark_stack_thrashing_patterns(allocator);
    
    // Test primitives integration
    const addr = primitives.Address.from_u256(0x1234);
    const addr2 = primitives.Address.get_contract_address(addr, 1);
    try std.testing.expect(!primitives.Address.equals(addr, addr2));
}