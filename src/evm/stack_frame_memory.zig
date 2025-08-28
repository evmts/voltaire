const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("log.zig");
const memory_mod = @import("memory.zig");
const GasConstants = @import("primitives").GasConstants;

/// Memory operation handlers for the EVM stack frame.
/// These are generic structs that return static handlers for a given FrameType.
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;

        /// MLOAD opcode (0x51) - Load word from memory.
        /// Pops memory offset from stack and pushes the 32-byte word at that offset.
        pub fn mload(self: FrameType, dispatch: Dispatch) Error!Success {
            // MLOAD loads a 32-byte word from memory
            const offset = try self.stack.pop();
            
            // Check if offset fits in usize
            if (offset > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }
            const offset_usize = @as(usize, @intCast(offset));
            
            // Calculate gas cost for memory expansion
            const memory_expansion_cost = try self.memory.expansion_cost(offset_usize, 32);
            if (self.gas_remaining < GasConstants.GasFastestStep + memory_expansion_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(GasConstants.GasFastestStep + memory_expansion_cost);
            
            // Read 32 bytes from memory (EVM-compliant with automatic expansion)
            const value_u256 = self.memory.get_u256_evm(offset_usize) catch |err| switch (err) {
                memory_mod.MemoryError.OutOfBounds => return Error.OutOfBounds,
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            
            // Convert to WordType (truncate if necessary for smaller word types)
            const value = @as(WordType, @truncate(value_u256));
            try self.stack.push(value);
            
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// MSTORE opcode (0x52) - Store word to memory.
        /// Pops memory offset and value from stack, stores 32 bytes at that offset.
        pub fn mstore(self: FrameType, dispatch: Dispatch) Error!Success {
            // MSTORE stores a 32-byte word to memory
            const offset = try self.stack.pop();
            const value = try self.stack.pop();
            
            // Check if offset fits in usize
            if (offset > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }
            const offset_usize = @as(usize, @intCast(offset));
            
            // Calculate gas cost for memory expansion
            const memory_expansion_cost = try self.memory.expansion_cost(offset_usize, 32);
            if (self.gas_remaining < GasConstants.GasFastestStep + memory_expansion_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(GasConstants.GasFastestStep + memory_expansion_cost);
            
            // Convert to u256 if necessary and store
            const value_u256 = @as(u256, value);
            self.memory.set_u256_evm(offset_usize, value_u256) catch |err| switch (err) {
                memory_mod.MemoryError.OutOfBounds => return Error.OutOfBounds,
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// MSTORE8 opcode (0x53) - Store byte to memory.
        /// Pops memory offset and value from stack, stores the least significant byte at that offset.
        pub fn mstore8(self: FrameType, dispatch: Dispatch) Error!Success {
            const offset = try self.stack.pop();
            const value = try self.stack.pop();
            
            // Check if offset fits in usize
            if (offset > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }
            const offset_usize = @as(usize, @intCast(offset));
            
            // Calculate gas cost for memory expansion
            const memory_expansion_cost = try self.memory.expansion_cost(offset_usize, 1);
            if (self.gas_remaining < GasConstants.GasFastestStep + memory_expansion_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(GasConstants.GasFastestStep + memory_expansion_cost);
            
            // Store the least significant byte
            const byte_value = @as(u8, @truncate(value));
            self.memory.set_byte_evm(offset_usize, byte_value) catch |err| switch (err) {
                memory_mod.MemoryError.OutOfBounds => return Error.OutOfBounds,
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// MSIZE opcode (0x59) - Get size of active memory.
        /// Pushes the size of active memory in bytes onto the stack.
        pub fn msize(self: FrameType, dispatch: Dispatch) Error!Success {
            const size = self.memory.len();
            try self.stack.push(@as(WordType, @intCast(size)));
            
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// MCOPY opcode (0x5e) - Memory copy operation (EIP-5656).
        /// Copies memory from one location to another.
        pub fn mcopy(self: FrameType, dispatch: Dispatch) Error!Success {
            const dest_offset = try self.stack.pop();
            const src_offset = try self.stack.pop();
            const size = try self.stack.pop();
            
            // Check if offsets and size fit in usize
            if (dest_offset > std.math.maxInt(usize) or 
                src_offset > std.math.maxInt(usize) or 
                size > std.math.maxInt(usize)) {
                return Error.OutOfBounds;
            }
            
            const dest_usize = @as(usize, @intCast(dest_offset));
            const src_usize = @as(usize, @intCast(src_offset));
            const size_usize = @as(usize, @intCast(size));
            
            if (size_usize == 0) {
                // No operation for zero size
                const next = dispatch.getNext();
                return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
            }
            
            // Calculate gas cost
            const words = (size_usize + 31) / 32;
            const copy_gas_cost = GasConstants.GasFastestStep + words * GasConstants.GasCopy;
            
            // Calculate memory expansion cost for both source and destination
            const src_expansion_cost = try self.memory.expansion_cost(src_usize, size_usize);
            const dest_expansion_cost = try self.memory.expansion_cost(dest_usize, size_usize);
            const memory_expansion_cost = @max(src_expansion_cost, dest_expansion_cost);
            
            const total_gas_cost = copy_gas_cost + memory_expansion_cost;
            if (self.gas_remaining < total_gas_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(total_gas_cost);
            
            // Perform the memory copy
            self.memory.copy_evm(dest_usize, src_usize, size_usize) catch |err| switch (err) {
                memory_mod.MemoryError.OutOfBounds => return Error.OutOfBounds,
                memory_mod.MemoryError.MemoryOverflow => return Error.OutOfBounds,
                else => return Error.AllocationError,
            };
            
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }
    };
}

// ====== TESTS ======

const testing = std.testing;
const StackFrame = @import("stack_frame.zig").StackFrame;
const dispatch_mod = @import("stack_frame_dispatch.zig");
const NoOpTracer = @import("tracer.zig").NoOpTracer;
const bytecode_mod = @import("bytecode.zig");

// Test configuration
const test_config = FrameConfig{
    .stack_size = 1024,
    .WordType = u256,
    .max_bytecode_size = 1024,
    .block_gas_limit = 30_000_000,
    .has_database = false,
    .TracerType = NoOpTracer,
    .memory_initial_capacity = 4096,
    .memory_limit = 0xFFFFFF,
};

const TestFrame = StackFrame(test_config);
const TestBytecode = bytecode_mod.Bytecode(.{ .max_bytecode_size = test_config.max_bytecode_size });

fn createTestFrame(allocator: std.mem.Allocator) !TestFrame {
    const bytecode = TestBytecode.initEmpty();
    return try TestFrame.init(allocator, bytecode, 1_000_000, null, null);
}

// Mock dispatch that simulates successful execution flow
fn createMockDispatch() TestFrame.Dispatch {
    const mock_handler = struct {
        fn handler(frame: TestFrame, dispatch: TestFrame.Dispatch) TestFrame.Error!TestFrame.Success {
            _ = frame;
            _ = dispatch;
            return TestFrame.Success.stop;
        }
    }.handler;
    
    var schedule: [1]dispatch_mod.ScheduleElement(TestFrame) = undefined;
    schedule[0] = .{ .opcode_handler = &mock_handler };
    
    return TestFrame.Dispatch{
        .schedule = &schedule,
        .bytecode_length = 0,
    };
}

test "MLOAD opcode - basic load" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Store a value at offset 0
    frame.memory.set_u256_evm(0, 0x1234567890ABCDEF) catch unreachable;
    
    // Load from offset 0
    try frame.stack.push(0);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.mload(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0x1234567890ABCDEF), try frame.stack.pop());
}

test "MLOAD opcode - load from uninitialized memory" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Load from offset 64 (uninitialized, should return 0)
    try frame.stack.push(64);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.mload(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0), try frame.stack.pop());
}

test "MSTORE opcode - basic store" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Store 0xDEADBEEF at offset 32
    try frame.stack.push(32); // offset
    try frame.stack.push(0xDEADBEEF); // value
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.mstore(frame, dispatch);
    
    // Verify the value was stored
    const stored_value = frame.memory.get_u256_evm(32) catch unreachable;
    try testing.expectEqual(@as(u256, 0xDEADBEEF), stored_value);
}

test "MSTORE8 opcode - store single byte" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Store byte 0xFF at offset 0
    try frame.stack.push(0); // offset
    try frame.stack.push(0x11FF); // value (only 0xFF will be stored)
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.mstore8(frame, dispatch);
    
    // Verify only the least significant byte was stored
    const stored_byte = frame.memory.get_byte(0) catch unreachable;
    try testing.expectEqual(@as(u8, 0xFF), stored_byte);
}

test "MSIZE opcode - memory size tracking" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Initial memory size should be 0
    var dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.msize(frame, dispatch);
    try testing.expectEqual(@as(u256, 0), try frame.stack.pop());
    
    // Store at offset 31 - should expand memory to 32 bytes
    frame.memory.set_byte_evm(31, 0xFF) catch unreachable;
    
    dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.msize(frame, dispatch);
    try testing.expectEqual(@as(u256, 32), try frame.stack.pop());
    
    // Store at offset 63 - should expand memory to 64 bytes
    frame.memory.set_byte_evm(63, 0xFF) catch unreachable;
    
    dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.msize(frame, dispatch);
    try testing.expectEqual(@as(u256, 64), try frame.stack.pop());
}

test "MCOPY opcode - basic copy" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Store some data at source location
    frame.memory.set_u256_evm(0, 0x1234567890ABCDEF) catch unreachable;
    
    // Copy from offset 0 to offset 32, size 32 bytes
    try frame.stack.push(32); // dest
    try frame.stack.push(0);  // src
    try frame.stack.push(32); // size
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.mcopy(frame, dispatch);
    
    // Verify the data was copied
    const copied_value = frame.memory.get_u256_evm(32) catch unreachable;
    try testing.expectEqual(@as(u256, 0x1234567890ABCDEF), copied_value);
}

test "MCOPY opcode - overlapping copy" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Store pattern at offset 0
    frame.memory.set_u256_evm(0, 0x1111111111111111) catch unreachable;
    frame.memory.set_u256_evm(32, 0x2222222222222222) catch unreachable;
    
    // Copy from offset 0 to offset 16, size 48 bytes (overlapping)
    try frame.stack.push(16); // dest
    try frame.stack.push(0);  // src
    try frame.stack.push(48); // size
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.mcopy(frame, dispatch);
    
    // Check results
    const val1 = frame.memory.get_u256_evm(0) catch unreachable;
    const val2 = frame.memory.get_u256_evm(16) catch unreachable;
    
    try testing.expectEqual(@as(u256, 0x1111111111111111), val1);
    try testing.expectEqual(@as(u256, 0x1111111111111111), val2);
}

test "MCOPY opcode - zero size" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Copy with size 0 should be no-op
    try frame.stack.push(100); // dest
    try frame.stack.push(200); // src
    try frame.stack.push(0);   // size
    
    const initial_msize = frame.memory.len();
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.mcopy(frame, dispatch);
    
    // Memory size should not change
    try testing.expectEqual(initial_msize, frame.memory.len());
}

test "memory operations - gas consumption" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Set initial gas
    frame.gas_remaining = 100_000;
    const initial_gas = frame.gas_remaining;
    
    // MLOAD from offset 0
    try frame.stack.push(0);
    var dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.mload(frame, dispatch);
    
    // Gas should be consumed
    try testing.expect(frame.gas_remaining < initial_gas);
    
    // MLOAD from large offset should consume more gas due to memory expansion
    const gas_before_expansion = frame.gas_remaining;
    try frame.stack.push(10000);
    dispatch = createMockDispatch();
    _ = try TestFrame.MemoryHandlers.mload(frame, dispatch);
    
    const gas_consumed = gas_before_expansion - frame.gas_remaining;
    try testing.expect(gas_consumed > GasConstants.GasFastestStep);
}

test "MSTORE opcode - out of gas" {
    var frame = try createTestFrame(testing.allocator);
    defer frame.deinit(testing.allocator);

    // Set very low gas
    frame.gas_remaining = 1;
    
    // Try to store at offset that requires memory expansion
    try frame.stack.push(1000); // offset
    try frame.stack.push(42);   // value
    
    const dispatch = createMockDispatch();
    const result = TestFrame.MemoryHandlers.mstore(frame, dispatch);
    
    try testing.expectError(TestFrame.Error.OutOfGas, result);
}