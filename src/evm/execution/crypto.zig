const std = @import("std");
const Operation = @import("../opcodes/operation.zig");
const ExecutionError = @import("execution_error.zig");
const Stack = @import("../stack/stack.zig");
const Frame = @import("../frame/frame.zig");
const Vm = @import("../evm.zig");
const primitives = @import("primitives");

// Stack buffer sizes for common hash operations
const SMALL_BUFFER_SIZE = 64;   // Most common (addresses, small data)
const MEDIUM_BUFFER_SIZE = 256; // Common for event data
const LARGE_BUFFER_SIZE = 1024; // Reasonable max for stack allocation

/// Optimized hash function using tiered stack buffers for small inputs.
/// Falls back to memory system for larger inputs.
inline fn hash_with_stack_buffer(data: []const u8) [32]u8 {
    var hash: [32]u8 = undefined;
    
    if (data.len <= SMALL_BUFFER_SIZE) {
        @branchHint(.likely); // Most common case - addresses and small data
        var buffer: [SMALL_BUFFER_SIZE]u8 = undefined;
        @memcpy(buffer[0..data.len], data);
        std.crypto.hash.sha3.Keccak256.hash(buffer[0..data.len], &hash, .{});
    } else if (data.len <= MEDIUM_BUFFER_SIZE) {
        @branchHint(.likely); // Common case - event data and medium-sized inputs
        var buffer: [MEDIUM_BUFFER_SIZE]u8 = undefined;
        @memcpy(buffer[0..data.len], data);
        std.crypto.hash.sha3.Keccak256.hash(buffer[0..data.len], &hash, .{});
    } else if (data.len <= LARGE_BUFFER_SIZE) {
        @branchHint(.unlikely); // Less common but still reasonable for stack
        var buffer: [LARGE_BUFFER_SIZE]u8 = undefined;
        @memcpy(buffer[0..data.len], data);
        std.crypto.hash.sha3.Keccak256.hash(buffer[0..data.len], &hash, .{});
    } else {
        @branchHint(.cold); // Very large data - hash directly from memory
        std.crypto.hash.sha3.Keccak256.hash(data, &hash, .{});
    }
    
    return hash;
}

pub fn op_sha3(pc: usize, interpreter: *Operation.Interpreter, state: *Operation.State) ExecutionError.Error!Operation.ExecutionResult {
    _ = pc;

    const frame = @as(*Frame, @ptrCast(@alignCast(state)));
    const vm = @as(*Vm, @ptrCast(@alignCast(interpreter)));

    const offset = try frame.stack.pop();
    const size = try frame.stack.pop();

    // Check bounds before anything else
    if (offset > std.math.maxInt(usize) or size > std.math.maxInt(usize)) {
        @branchHint(.unlikely);
        return ExecutionError.Error.OutOfOffset;
    }

    if (size == 0) {
        @branchHint(.unlikely);
        // Even with size 0, we need to validate the offset is reasonable
        if (offset > 0) {
            // Check if offset is beyond reasonable memory limits
            const offset_usize = @as(usize, @intCast(offset));
            const memory_limits = @import("../constants/memory_limits.zig");
            if (offset_usize > memory_limits.MAX_MEMORY_SIZE) {
                @branchHint(.unlikely);
                return ExecutionError.Error.OutOfOffset;
            }
        }
        // Hash of empty data = keccak256("")
        const empty_hash: u256 = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        try frame.stack.append(empty_hash);
        return Operation.ExecutionResult{};
    }

    const offset_usize = @as(usize, @intCast(offset));
    const size_usize = @as(usize, @intCast(size));

    // Check if offset + size would overflow
    const end = std.math.add(usize, offset_usize, size_usize) catch {
        @branchHint(.unlikely);
        return ExecutionError.Error.OutOfOffset;
    };

    // Check if the end position exceeds reasonable memory limits
    const memory_limits = @import("../constants/memory_limits.zig");
    if (end > memory_limits.MAX_MEMORY_SIZE) {
        @branchHint(.unlikely);
        return ExecutionError.Error.OutOfOffset;
    }

    // Dynamic gas cost for hashing
    const word_size = (size_usize + 31) / 32;
    const gas_cost = 6 * word_size;
    _ = vm;
    try frame.consume_gas(gas_cost);

    // Ensure memory is available
    _ = try frame.memory.ensure_context_capacity(offset_usize + size_usize);

    // Get data and hash using optimized stack buffer approach
    const data = try frame.memory.get_slice(offset_usize, size_usize);

    // Calculate keccak256 hash using optimized tiered stack buffers
    const hash = hash_with_stack_buffer(data);

    // Convert hash to u256 using std.mem for efficiency
    const result = std.mem.readInt(u256, &hash, .big);

    try frame.stack.append(result);

    return Operation.ExecutionResult{};
}

// Alias for backwards compatibility
pub const op_keccak256 = op_sha3;

// Fuzz testing functions for crypto operations
pub fn fuzz_crypto_operations(allocator: std.mem.Allocator, operations: []const FuzzCryptoOperation) !void {
    const Memory = @import("../memory/memory.zig");
    const MemoryDatabase = @import("../state/memory_database.zig");
    const Contract = @import("../frame/contract.zig");
    _ = primitives.Address;
    
    for (operations) |op| {
        var memory = try Memory.init_default(allocator);
        defer memory.deinit();
        
        var db = MemoryDatabase.init(allocator);
        defer db.deinit();
        
        var vm = try Vm.init(allocator, db.to_database_interface(), null, null);
        defer vm.deinit();
        
        var contract = try Contract.init(allocator, &[_]u8{0x01}, .{});
        defer contract.deinit(allocator, null);
        
        var frame = try Frame.init(allocator, &vm, 1000000, contract, primitives.Address.ZERO, &.{});
        defer frame.deinit();
        
        // Set up memory with test data
        if (op.data.len > 0) {
            try frame.memory.set_data(op.offset, op.data);
        }
        
        // Push offset and size onto stack
        try frame.stack.append(op.offset);
        try frame.stack.append(op.size);
        
        // Execute SHA3/KECCAK256 operation
        const result = op_sha3(0, @ptrCast(&vm), @ptrCast(&frame));
        
        // Verify the result
        try validate_crypto_result(&frame, op, result);
    }
}

const FuzzCryptoOperation = struct {
    offset: usize,
    size: usize,
    data: []const u8,
};

fn validate_crypto_result(frame: *const Frame, op: FuzzCryptoOperation, result: anyerror!Operation.ExecutionResult) !void {
    const testing = std.testing;
    const memory_limits = @import("../constants/memory_limits.zig");
    
    // Check if operation should have failed
    if (op.offset > std.math.maxInt(usize) or 
        op.size > std.math.maxInt(usize) or
        op.offset > memory_limits.MAX_MEMORY_SIZE or
        (op.size > 0 and op.offset + op.size > memory_limits.MAX_MEMORY_SIZE)) {
        try testing.expectError(ExecutionError.Error.OutOfOffset, result);
        return;
    }
    
    // Operation should have succeeded
    try result;
    
    // Stack should have exactly one result (the hash)
    try testing.expectEqual(@as(usize, 1), frame.stack.size);
    
    const hash = frame.stack.data[0];
    
    if (op.size == 0) {
        // Empty data hash should be the keccak256 of empty string
        const expected_empty_hash: u256 = 0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        try testing.expectEqual(expected_empty_hash, hash);
    } else if (op.size <= op.data.len) {
        // Verify hash is correct for the data
        const actual_data = op.data[0..op.size];
        var expected_hash: [32]u8 = undefined;
        std.crypto.hash.sha3.Keccak256.hash(actual_data, &expected_hash, .{});
        const expected_hash_u256 = std.mem.readInt(u256, &expected_hash, .big);
        try testing.expectEqual(expected_hash_u256, hash);
    } else {
        // Hash with zero padding - need to create the padded data
        var padded_data = std.ArrayList(u8).init(testing.allocator);
        defer padded_data.deinit();
        
        try padded_data.appendSlice(op.data);
        const padding_needed = op.size - op.data.len;
        try padded_data.appendNTimes(0, padding_needed);
        
        var expected_hash: [32]u8 = undefined;
        std.crypto.hash.sha3.Keccak256.hash(padded_data.items, &expected_hash, .{});
        const expected_hash_u256 = std.mem.readInt(u256, &expected_hash, .big);
        try testing.expectEqual(expected_hash_u256, hash);
    }
}

test "fuzz_crypto_basic_operations" {
    const allocator = std.testing.allocator;
    const test_data = "Hello, World!";
    
    const operations = [_]FuzzCryptoOperation{
        .{ .offset = 0, .size = 0, .data = "" },
        .{ .offset = 0, .size = test_data.len, .data = test_data },
        .{ .offset = 0, .size = 32, .data = "Short" },
        .{ .offset = 10, .size = 5, .data = "Hello, World!" },
    };
    
    try fuzz_crypto_operations(allocator, &operations);
}

test "fuzz_crypto_edge_cases" {
    const allocator = std.testing.allocator;
    
    const operations = [_]FuzzCryptoOperation{
        .{ .offset = 0, .size = 0, .data = "" },
        .{ .offset = 0, .size = 1, .data = "a" },
        .{ .offset = 0, .size = 32, .data = "0123456789abcdef0123456789abcdef" },
        .{ .offset = std.math.maxInt(usize) - 100, .size = 10, .data = "test" },
        .{ .offset = 0, .size = std.math.maxInt(usize), .data = "test" },
    };
    
    try fuzz_crypto_operations(allocator, &operations);
}

test "fuzz_crypto_random_operations" {
    const allocator = std.testing.allocator;
    var prng = std.Random.DefaultPrng.init(42);
    const random = prng.random();
    
    var operations = std.ArrayList(FuzzCryptoOperation).init(allocator);
    defer operations.deinit();
    
    var test_data_storage = std.ArrayList([]u8).init(allocator);
    defer {
        for (test_data_storage.items) |data| {
            allocator.free(data);
        }
        test_data_storage.deinit();
    }
    
    var i: usize = 0;
    while (i < 50) : (i += 1) {
        const data_len = random.intRangeAtMost(usize, 0, 100);
        const data = try allocator.alloc(u8, data_len);
        random.bytes(data);
        try test_data_storage.append(data);
        
        const offset = random.intRangeAtMost(usize, 0, 1000);
        const size = random.intRangeAtMost(usize, 0, 200);
        
        try operations.append(.{ .offset = offset, .size = size, .data = data });
    }
    
    try fuzz_crypto_operations(allocator, operations.items);
}

test "fuzz_crypto_known_vectors" {
    const allocator = std.testing.allocator;
    
    const operations = [_]FuzzCryptoOperation{
        .{ .offset = 0, .size = 0, .data = "" },
        .{ .offset = 0, .size = 3, .data = "abc" },
        .{ .offset = 0, .size = 56, .data = "abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq" },
        .{ .offset = 0, .size = 4, .data = "test" },
        .{ .offset = 0, .size = 11, .data = "hello world" },
    };
    
    try fuzz_crypto_operations(allocator, &operations);
}

test "fuzz_crypto_memory_edge_cases" {
    const allocator = std.testing.allocator;
    
    const operations = [_]FuzzCryptoOperation{
        .{ .offset = 0, .size = 0, .data = "" },
        .{ .offset = 1000, .size = 0, .data = "" },
        .{ .offset = 0, .size = 1000, .data = "small" },
        .{ .offset = 500, .size = 100, .data = "test data for memory operations" },
    };
    
    try fuzz_crypto_operations(allocator, &operations);
}

test "fuzz_crypto_alignment_patterns" {
    const allocator = std.testing.allocator;
    
    var operations = std.ArrayList(FuzzCryptoOperation).init(allocator);
    defer operations.deinit();
    
    const test_data = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    
    // Test various alignment patterns
    const alignments = [_]usize{ 1, 2, 4, 8, 16, 32 };
    
    for (alignments) |alignment| {
        try operations.append(.{ .offset = alignment, .size = 32, .data = test_data });
        try operations.append(.{ .offset = 0, .size = alignment, .data = test_data });
    }
    
    try fuzz_crypto_operations(allocator, operations.items);
}

test "crypto_stack_buffer_benchmarks" {
    const Timer = std.time.Timer;
    var timer = try Timer.start();
    const allocator = std.testing.allocator;
    
    // Setup test environment
    var memory_db = @import("../state/memory_database.zig").MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    var vm = try Vm.init(allocator, db_interface, null, null);
    defer vm.deinit();
    
    const iterations = 10000; // Reduced for crypto operations due to complexity
    
    // Benchmark 1: Small data (address-sized, 20-32 bytes) - should use SMALL_BUFFER
    timer.reset();
    var i: usize = 0;
    while (i < iterations) : (i += 1) {
        var contract = try @import("../frame/contract.zig").Contract.init(allocator, &[_]u8{0x20}, .{ .address = [_]u8{0} ** 20 });
        defer contract.deinit(allocator, null);
        var frame = try Frame.init(allocator, &vm, 1000000, contract, [_]u8{0} ** 20, &.{});
        defer frame.deinit();
        
        // Set up 32 bytes of data in memory (typical address + padding)
        const test_data = [_]u8{0x42} ** 32;
        try frame.memory.set_data(0, &test_data);
        
        // Push offset=0, size=32 for KECCAK256
        try frame.stack.append(0);
        try frame.stack.append(32);
        
        _ = try op_sha3(0, @ptrCast(&vm), @ptrCast(&frame));
    }
    const small_buffer_ns = timer.read();
    
    // Benchmark 2: Medium data (128 bytes) - should use MEDIUM_BUFFER
    timer.reset();
    i = 0;
    while (i < iterations) : (i += 1) {
        var contract = try @import("../frame/contract.zig").Contract.init(allocator, &[_]u8{0x20}, .{ .address = [_]u8{0} ** 20 });
        defer contract.deinit(allocator, null);
        var frame = try Frame.init(allocator, &vm, 1000000, contract, [_]u8{0} ** 20, &.{});
        defer frame.deinit();
        
        // Set up 128 bytes of data in memory (event data size)
        const test_data = [_]u8{0x37} ** 128;
        try frame.memory.set_data(0, &test_data);
        
        // Push offset=0, size=128 for KECCAK256
        try frame.stack.append(0);
        try frame.stack.append(128);
        
        _ = try op_sha3(0, @ptrCast(&vm), @ptrCast(&frame));
    }
    const medium_buffer_ns = timer.read();
    
    // Benchmark 3: Large data (512 bytes) - should use LARGE_BUFFER
    timer.reset();
    i = 0;
    while (i < iterations) : (i += 1) {
        var contract = try @import("../frame/contract.zig").Contract.init(allocator, &[_]u8{0x20}, .{ .address = [_]u8{0} ** 20 });
        defer contract.deinit(allocator, null);
        var frame = try Frame.init(allocator, &vm, 1000000, contract, [_]u8{0} ** 20, &.{});
        defer frame.deinit();
        
        // Set up 512 bytes of data in memory
        const test_data = [_]u8{0x73} ** 512;
        try frame.memory.set_data(0, &test_data);
        
        // Push offset=0, size=512 for KECCAK256
        try frame.stack.append(0);
        try frame.stack.append(512);
        
        _ = try op_sha3(0, @ptrCast(&vm), @ptrCast(&frame));
    }
    const large_buffer_ns = timer.read();
    
    // Benchmark 4: Very large data (2048 bytes) - should hash directly from memory
    timer.reset();
    i = 0;
    while (i < iterations / 10) : (i += 1) { // Fewer iterations for large data
        var contract = try @import("../frame/contract.zig").Contract.init(allocator, &[_]u8{0x20}, .{ .address = [_]u8{0} ** 20 });
        defer contract.deinit(allocator, null);
        var frame = try Frame.init(allocator, &vm, 1000000, contract, [_]u8{0} ** 20, &.{});
        defer frame.deinit();
        
        // Set up 2048 bytes of data in memory
        const test_data = [_]u8{0x99} ** 2048;
        try frame.memory.set_data(0, &test_data);
        
        // Push offset=0, size=2048 for KECCAK256
        try frame.stack.append(0);
        try frame.stack.append(2048);
        
        _ = try op_sha3(0, @ptrCast(&vm), @ptrCast(&frame));
    }
    const very_large_ns = timer.read();
    
    // Benchmark 5: Direct hash function comparison
    const direct_test_data = [_]u8{0x42} ** 64;
    
    // Using optimized stack buffer
    timer.reset();
    i = 0;
    while (i < iterations * 10) : (i += 1) {
        _ = hash_with_stack_buffer(&direct_test_data);
    }
    const optimized_direct_ns = timer.read();
    
    // Using standard library directly
    timer.reset();
    i = 0;
    while (i < iterations * 10) : (i += 1) {
        var hash: [32]u8 = undefined;
        std.crypto.hash.sha3.Keccak256.hash(&direct_test_data, &hash, .{});
    }
    const standard_direct_ns = timer.read();
    
    // Benchmark 6: Common Ethereum use cases
    timer.reset();
    
    // Address hashing (20 bytes) - very common
    const address_data = [_]u8{0x12} ** 20;
    i = 0;
    while (i < iterations) : (i += 1) {
        _ = hash_with_stack_buffer(&address_data);
    }
    const address_hash_ns = timer.read();
    
    // Function signature hashing (4 bytes) - extremely common
    timer.reset();
    const sig_data = [_]u8{0xab, 0xcd, 0xef, 0x12};
    i = 0;
    while (i < iterations) : (i += 1) {
        _ = hash_with_stack_buffer(&sig_data);
    }
    const signature_hash_ns = timer.read();
    
    // Print benchmark results
    std.log.debug("Crypto Stack Buffer Benchmarks:", .{});
    std.log.debug("  Small buffer (32 bytes, {} ops): {} ns", .{ iterations, small_buffer_ns });
    std.log.debug("  Medium buffer (128 bytes, {} ops): {} ns", .{ iterations, medium_buffer_ns });
    std.log.debug("  Large buffer (512 bytes, {} ops): {} ns", .{ iterations, large_buffer_ns });
    std.log.debug("  Very large (2048 bytes, {} ops): {} ns", .{ iterations / 10, very_large_ns });
    
    std.log.debug("  Direct function comparison ({} ops):", .{ iterations * 10 });
    std.log.debug("    Optimized stack buffer: {} ns", .{optimized_direct_ns});
    std.log.debug("    Standard library: {} ns", .{standard_direct_ns});
    
    std.log.debug("  Common Ethereum use cases:");
    std.log.debug("    Address hashing (20 bytes): {} ns", .{address_hash_ns});
    std.log.debug("    Function signature (4 bytes): {} ns", .{signature_hash_ns});
    
    // Performance analysis
    const avg_small_ns = small_buffer_ns / iterations;
    const avg_medium_ns = medium_buffer_ns / iterations;
    const avg_large_ns = large_buffer_ns / iterations;
    const avg_very_large_ns = (very_large_ns * 10) / iterations; // Adjust for fewer iterations
    
    std.log.debug("  Average timings:");
    std.log.debug("    Small (32B): {} ns/op", .{avg_small_ns});
    std.log.debug("    Medium (128B): {} ns/op", .{avg_medium_ns});
    std.log.debug("    Large (512B): {} ns/op", .{avg_large_ns});
    std.log.debug("    Very Large (2048B): {} ns/op", .{avg_very_large_ns});
    
    const avg_optimized_direct = optimized_direct_ns / (iterations * 10);
    const avg_standard_direct = standard_direct_ns / (iterations * 10);
    
    std.log.debug("    Optimized direct: {} ns/op", .{avg_optimized_direct});
    std.log.debug("    Standard direct: {} ns/op", .{avg_standard_direct});
    
    // Verify optimization effectiveness for small data
    if (avg_optimized_direct <= avg_standard_direct) {
        std.log.debug("✓ Stack buffer optimization shows expected performance benefit");
    }
    
    // Verify tiered approach effectiveness
    if (avg_small_ns <= avg_medium_ns and avg_medium_ns <= avg_large_ns) {
        std.log.debug("✓ Tiered stack buffer approach showing expected scaling");
    }
}
