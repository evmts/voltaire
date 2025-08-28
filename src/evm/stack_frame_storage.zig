const std = @import("std");
const FrameConfig = @import("frame_config.zig").FrameConfig;
const log = @import("log.zig");
const GasConstants = @import("primitives").GasConstants;
const Address = @import("primitives").Address.Address;

/// Storage operation handlers for the EVM stack frame.
/// These are generic structs that return static handlers for a given FrameType.
pub fn Handlers(comptime FrameType: type) type {
    return struct {
        pub const Error = FrameType.Error;
        pub const Success = FrameType.Success;
        pub const Dispatch = FrameType.Dispatch;
        pub const WordType = FrameType.WordType;

        /// SLOAD opcode (0x54) - Load from storage.
        /// Loads value from storage slot and pushes it onto the stack.
        pub fn sload(self: FrameType, dispatch: Dispatch) Error!Success {
            // SLOAD loads a value from storage
            if (comptime !FrameType.config.has_database) {
                return Error.InvalidOpcode;
            }

            const slot = try self.stack.pop();
            
            // Use the currently executing contract's address
            const contract_addr = self.contract_address;
            
            // Access the storage slot for warm/cold accounting (EIP-2929)
            _ = self.host.access_storage_slot(contract_addr, slot) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
            
            // Load value from storage
            const value = self.host.get_storage(contract_addr, slot);
            try self.stack.push(value);
            
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// SSTORE opcode (0x55) - Store to storage.
        /// Stores value to storage slot. Subject to gas refunds and write protection checks.
        pub fn sstore(self: FrameType, dispatch: Dispatch) Error!Success {
            // SSTORE stores a value to storage
            if (comptime !FrameType.config.has_database) {
                return Error.InvalidOpcode;
            }

            // Check for write protection (static call context)
            if (self.is_static) {
                return Error.WriteProtection;
            }

            const slot = try self.stack.pop();
            const value = try self.stack.pop();
            
            // Use the currently executing contract's address
            const contract_addr = self.contract_address;
            
            // Access the storage slot for warm/cold accounting (EIP-2929)
            _ = self.host.access_storage_slot(contract_addr, slot) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
            
            // Get current value for gas calculation
            const current_value = self.host.get_storage(contract_addr, slot);
            
            // Calculate gas cost based on EIP-2200
            // This is simplified - actual implementation would need to consider:
            // - Original value (for refunds)
            // - Cold vs warm access
            // - Net gas metering
            var gas_cost: u64 = GasConstants.GasStorageSet;
            if (current_value != 0 and value == 0) {
                // Clearing storage - eligible for refund
                gas_cost = GasConstants.GasStorageClear;
                // Note: Actual refund would be added to gas_refund field
            } else if (current_value == value) {
                // No-op
                gas_cost = GasConstants.GasStorageSet / 5; // Warm storage cost
            }
            
            if (self.gas_remaining < gas_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(gas_cost);
            
            // Store the value
            self.host.set_storage(contract_addr, slot, value) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
            
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// TLOAD opcode (0x5c) - Load from transient storage (EIP-1153).
        /// Loads value from transient storage slot and pushes it onto the stack.
        pub fn tload(self: FrameType, dispatch: Dispatch) Error!Success {
            if (comptime !FrameType.config.has_database) {
                return Error.InvalidOpcode;
            }

            const slot = try self.stack.pop();
            
            // Use the currently executing contract's address
            const contract_addr = self.contract_address;
            
            // Load value from transient storage
            const value = self.host.get_transient_storage(contract_addr, slot) catch |err| switch (err) {
                else => return Error.AllocationError,
            };
            
            try self.stack.push(value);
            
            const next = dispatch.getNext();
            return @call(.always_tail, next.schedule[0].opcode_handler, .{ self, next });
        }

        /// TSTORE opcode (0x5d) - Store to transient storage (EIP-1153).
        /// Stores value to transient storage slot (cleared after transaction).
        pub fn tstore(self: FrameType, dispatch: Dispatch) Error!Success {
            if (comptime !FrameType.config.has_database) {
                return Error.InvalidOpcode;
            }

            // Check for write protection (static call context)
            if (self.is_static) {
                return Error.WriteProtection;
            }

            const slot = try self.stack.pop();
            const value = try self.stack.pop();
            
            // Use the currently executing contract's address
            const contract_addr = self.contract_address;
            
            // Transient storage has fixed gas cost
            const gas_cost = GasConstants.GasWarmStorageRead; // 100 gas
            if (self.gas_remaining < gas_cost) {
                return Error.OutOfGas;
            }
            self.gas_remaining -= @intCast(gas_cost);
            
            // Store the value in transient storage
            self.host.set_transient_storage(contract_addr, slot, value) catch |err| switch (err) {
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
const Host = @import("host.zig").Host;

// Test configuration with database enabled
const test_config = FrameConfig{
    .stack_size = 1024,
    .WordType = u256,
    .max_bytecode_size = 1024,
    .block_gas_limit = 30_000_000,
    .has_database = true,  // Enable storage operations
    .TracerType = NoOpTracer,
    .memory_initial_capacity = 4096,
    .memory_limit = 0xFFFFFF,
};

const TestFrame = StackFrame(test_config);
const TestBytecode = bytecode_mod.Bytecode(.{ .max_bytecode_size = test_config.max_bytecode_size });

// Mock host for testing
const MockHost = struct {
    storage: std.AutoHashMap(StorageKey, u256),
    transient_storage: std.AutoHashMap(StorageKey, u256),
    accessed_slots: std.AutoHashMap(StorageKey, void),

    const StorageKey = struct {
        address: Address,
        slot: u256,
    };

    pub fn init(allocator: std.mem.Allocator) MockHost {
        return .{
            .storage = std.AutoHashMap(StorageKey, u256).init(allocator),
            .transient_storage = std.AutoHashMap(StorageKey, u256).init(allocator),
            .accessed_slots = std.AutoHashMap(StorageKey, void).init(allocator),
        };
    }

    pub fn deinit(self: *MockHost) void {
        self.storage.deinit();
        self.transient_storage.deinit();
        self.accessed_slots.deinit();
    }

    pub fn access_storage_slot(self: *MockHost, address: Address, slot: u256) !void {
        const key = StorageKey{ .address = address, .slot = slot };
        try self.accessed_slots.put(key, {});
    }

    pub fn get_storage(self: *MockHost, address: Address, slot: u256) u256 {
        const key = StorageKey{ .address = address, .slot = slot };
        return self.storage.get(key) orelse 0;
    }

    pub fn set_storage(self: *MockHost, address: Address, slot: u256, value: u256) !void {
        const key = StorageKey{ .address = address, .slot = slot };
        try self.storage.put(key, value);
    }

    pub fn get_transient_storage(self: *MockHost, address: Address, slot: u256) !u256 {
        const key = StorageKey{ .address = address, .slot = slot };
        return self.transient_storage.get(key) orelse 0;
    }

    pub fn set_transient_storage(self: *MockHost, address: Address, slot: u256, value: u256) !void {
        const key = StorageKey{ .address = address, .slot = slot };
        try self.transient_storage.put(key, value);
    }
};

fn createTestFrame(allocator: std.mem.Allocator, host: *MockHost) !TestFrame {
    const bytecode = TestBytecode.initEmpty();
    const host_interface = Host{
        .ptr = host,
        .vtable = &.{
            .access_storage_slot = @ptrCast(&MockHost.access_storage_slot),
            .get_storage = @ptrCast(&MockHost.get_storage),
            .set_storage = @ptrCast(&MockHost.set_storage),
            .get_transient_storage = @ptrCast(&MockHost.get_transient_storage),
            .set_transient_storage = @ptrCast(&MockHost.set_transient_storage),
        },
    };
    return try TestFrame.init(allocator, bytecode, 1_000_000, null, host_interface);
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

test "SLOAD opcode - load from empty slot" {
    var host = MockHost.init(testing.allocator);
    defer host.deinit();
    
    var frame = try createTestFrame(testing.allocator, &host);
    defer frame.deinit(testing.allocator);

    // Load from slot 0 (empty, should return 0)
    try frame.stack.push(0);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.StorageHandlers.sload(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0), try frame.stack.pop());
}

test "SLOAD opcode - load existing value" {
    var host = MockHost.init(testing.allocator);
    defer host.deinit();
    
    // Pre-store a value
    const contract_addr = Address{ .bytes = .{0} ** 20 };
    try host.set_storage(contract_addr, 42, 0xDEADBEEF);
    
    var frame = try createTestFrame(testing.allocator, &host);
    defer frame.deinit(testing.allocator);
    frame.contract_address = contract_addr;

    // Load from slot 42
    try frame.stack.push(42);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.StorageHandlers.sload(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0xDEADBEEF), try frame.stack.pop());
}

test "SSTORE opcode - basic store" {
    var host = MockHost.init(testing.allocator);
    defer host.deinit();
    
    var frame = try createTestFrame(testing.allocator, &host);
    defer frame.deinit(testing.allocator);
    frame.is_static = false; // Ensure not in static context

    // Store value 0x1234 at slot 100
    try frame.stack.push(100);   // slot
    try frame.stack.push(0x1234); // value
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.StorageHandlers.sstore(frame, dispatch);
    
    // Verify the value was stored
    const stored_value = host.get_storage(frame.contract_address, 100);
    try testing.expectEqual(@as(u256, 0x1234), stored_value);
}

test "SSTORE opcode - write protection in static call" {
    var host = MockHost.init(testing.allocator);
    defer host.deinit();
    
    var frame = try createTestFrame(testing.allocator, &host);
    defer frame.deinit(testing.allocator);
    frame.is_static = true; // Set static context

    // Try to store in static context
    try frame.stack.push(0);    // slot
    try frame.stack.push(42);   // value
    
    const dispatch = createMockDispatch();
    const result = TestFrame.StorageHandlers.sstore(frame, dispatch);
    
    try testing.expectError(TestFrame.Error.WriteProtection, result);
}

test "TLOAD opcode - transient storage load" {
    var host = MockHost.init(testing.allocator);
    defer host.deinit();
    
    // Pre-store a transient value
    const contract_addr = Address{ .bytes = .{0} ** 20 };
    try host.set_transient_storage(contract_addr, 5, 0xABCD);
    
    var frame = try createTestFrame(testing.allocator, &host);
    defer frame.deinit(testing.allocator);
    frame.contract_address = contract_addr;

    // Load from transient slot 5
    try frame.stack.push(5);
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.StorageHandlers.tload(frame, dispatch);
    
    try testing.expectEqual(@as(u256, 0xABCD), try frame.stack.pop());
}

test "TSTORE opcode - transient storage store" {
    var host = MockHost.init(testing.allocator);
    defer host.deinit();
    
    var frame = try createTestFrame(testing.allocator, &host);
    defer frame.deinit(testing.allocator);
    frame.is_static = false;

    // Store value 0x5678 at transient slot 10
    try frame.stack.push(10);     // slot
    try frame.stack.push(0x5678); // value
    
    const dispatch = createMockDispatch();
    _ = try TestFrame.StorageHandlers.tstore(frame, dispatch);
    
    // Verify the value was stored
    const stored_value = try host.get_transient_storage(frame.contract_address, 10);
    try testing.expectEqual(@as(u256, 0x5678), stored_value);
}

test "TSTORE opcode - write protection in static call" {
    var host = MockHost.init(testing.allocator);
    defer host.deinit();
    
    var frame = try createTestFrame(testing.allocator, &host);
    defer frame.deinit(testing.allocator);
    frame.is_static = true; // Set static context

    // Try to store in static context
    try frame.stack.push(0);    // slot
    try frame.stack.push(42);   // value
    
    const dispatch = createMockDispatch();
    const result = TestFrame.StorageHandlers.tstore(frame, dispatch);
    
    try testing.expectError(TestFrame.Error.WriteProtection, result);
}

test "storage operations - gas consumption" {
    var host = MockHost.init(testing.allocator);
    defer host.deinit();
    
    var frame = try createTestFrame(testing.allocator, &host);
    defer frame.deinit(testing.allocator);
    frame.is_static = false;

    // Set initial gas
    frame.gas_remaining = 100_000;
    const initial_gas = frame.gas_remaining;
    
    // SSTORE to new slot (cold, expensive)
    try frame.stack.push(1000);  // slot
    try frame.stack.push(42);    // value
    
    var dispatch = createMockDispatch();
    _ = try TestFrame.StorageHandlers.sstore(frame, dispatch);
    
    // Should consume significant gas
    const gas_consumed = initial_gas - frame.gas_remaining;
    try testing.expect(gas_consumed > 0);
    
    // TSTORE has fixed lower cost
    const gas_before_tstore = frame.gas_remaining;
    try frame.stack.push(2000);  // slot
    try frame.stack.push(99);    // value
    
    dispatch = createMockDispatch();
    _ = try TestFrame.StorageHandlers.tstore(frame, dispatch);
    
    const tstore_gas = gas_before_tstore - frame.gas_remaining;
    try testing.expect(tstore_gas == GasConstants.GasWarmStorageRead);
}

test "SLOAD/SSTORE - multiple operations" {
    var host = MockHost.init(testing.allocator);
    defer host.deinit();
    
    var frame = try createTestFrame(testing.allocator, &host);
    defer frame.deinit(testing.allocator);
    frame.is_static = false;

    // Store multiple values
    const test_data = [_]struct { slot: u256, value: u256 }{
        .{ .slot = 0, .value = 111 },
        .{ .slot = 1, .value = 222 },
        .{ .slot = 100, .value = 333 },
    };
    
    for (test_data) |data| {
        try frame.stack.push(data.slot);
        try frame.stack.push(data.value);
        const dispatch = createMockDispatch();
        _ = try TestFrame.StorageHandlers.sstore(frame, dispatch);
    }
    
    // Read back and verify
    for (test_data) |data| {
        try frame.stack.push(data.slot);
        const dispatch = createMockDispatch();
        _ = try TestFrame.StorageHandlers.sload(frame, dispatch);
        try testing.expectEqual(data.value, try frame.stack.pop());
    }
}