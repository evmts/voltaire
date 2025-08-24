const std = @import("std");
const primitives = @import("primitives");
const GasConstants = primitives.GasConstants;
const Address = primitives.Address.Address;
const frame_mod = @import("evm");
const Frame = frame_mod.Frame;
const DatabaseInterface = @import("evm").DatabaseInterface;
const MemoryDatabase = @import("evm").MemoryDatabase;

const MockHost = struct {
    call_result: CallResult = CallResult.success_empty(0),

    const CallResult = struct {
        success: bool,
        gas_refunded: u64,
        return_value: []const u8,

        pub fn success_empty(gas_refunded: u64) CallResult {
            return CallResult{
                .success = true,
                .gas_refunded = gas_refunded,
                .return_value = &[_]u8{},
            };
        }
    };

    pub fn init() MockHost {
        return MockHost{};
    }

    pub fn to_host(self: *MockHost) frame_mod.Host {
        return frame_mod.Host{
            .call = @ptrCast(&mock_call),
            .ptr = @ptrCast(self),
        };
    }

    fn mock_call(ptr: *anyopaque, params: *const frame_mod.CallParams) anyerror!frame_mod.CallResult {
        const self: *MockHost = @ptrCast(@alignCast(ptr));
        _ = params;
        return frame_mod.CallResult{
            .success = self.call_result.success,
            .gas_refunded = self.call_result.gas_refunded,
            .return_value = self.call_result.return_value,
        };
    }
};

test "_calculate_call_gas new account costs - nonexistent account" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    
    var mock_host = MockHost.init();
    const host = mock_host.to_host();
    
    const F = Frame(.{ .has_database = true });
    const bytecode = [_]u8{0x00}; // STOP
    var frame = try F.init(allocator, &bytecode, 100000, db_interface, host);
    defer frame.deinit(allocator);

    // Test with a completely new address that doesn't exist in database
    const nonexistent_address = Address.from_u256(0x12345);
    const gas_cost = frame._calculate_call_gas(nonexistent_address, 0, false);
    
    // Calling non-existent account should include new account cost
    const expected = GasConstants.CALL_BASE_COST + GasConstants.CALL_NEW_ACCOUNT_COST;
    try std.testing.expectEqual(expected, gas_cost);
}

test "_calculate_call_gas existing account costs - account with balance" {
    const allocator = std.testing.allocator;
    
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    // Pre-create an account with non-zero balance
    const existing_address = Address.from_u256(0x54321);
    const account = DatabaseInterface.Account{
        .nonce = 1,
        .balance = 1000,
        .code_hash = primitives.EMPTY_CODE_HASH,
        .storage_root = primitives.EMPTY_TRIE_ROOT,
    };
    try memory_db.set_account(existing_address, account);

    const db_interface = memory_db.to_database_interface();
    
    var mock_host = MockHost.init();
    const host = mock_host.to_host();
    
    const F = Frame(.{ .has_database = true });
    const bytecode = [_]u8{0x00}; // STOP
    var frame = try F.init(allocator, &bytecode, 100000, db_interface, host);
    defer frame.deinit(allocator);

    const gas_cost = frame._calculate_call_gas(existing_address, 0, false);
    
    // Calling existing account should not include new account cost
    const expected = GasConstants.CALL_BASE_COST;
    try std.testing.expectEqual(expected, gas_cost);
}