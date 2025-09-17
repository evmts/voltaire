/// Host interface and implementations for MinimalEvm
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

/// Host interface for system operations
pub const HostInterface = struct {
    ptr: *anyopaque,
    vtable: *const VTable,

    pub const VTable = struct {
        inner_call: *const fn (ptr: *anyopaque, gas: u64, address: Address, value: u256, input: []const u8, call_type: CallType) CallResult,
        get_balance: *const fn (ptr: *anyopaque, address: Address) u256,
        get_code: *const fn (ptr: *anyopaque, address: Address) []const u8,
        get_storage: *const fn (ptr: *anyopaque, address: Address, slot: u256) u256,
        set_storage: *const fn (ptr: *anyopaque, address: Address, slot: u256, value: u256) void,
    };

    pub const CallType = enum {
        Call,
        CallCode,
        DelegateCall,
        StaticCall,
        Create,
        Create2,
    };

    pub fn innerCall(self: HostInterface, gas: u64, address: Address, value: u256, input: []const u8, call_type: CallType) CallResult {
        return self.vtable.inner_call(self.ptr, gas, address, value, input, call_type);
    }

    pub fn getBalance(self: HostInterface, address: Address) u256 {
        return self.vtable.get_balance(self.ptr, address);
    }

    pub fn getCode(self: HostInterface, address: Address) []const u8 {
        return self.vtable.get_code(self.ptr, address);
    }

    pub fn getStorage(self: HostInterface, address: Address, slot: u256) u256 {
        return self.vtable.get_storage(self.ptr, address, slot);
    }

    pub fn setStorage(self: HostInterface, address: Address, slot: u256, value: u256) void {
        self.vtable.set_storage(self.ptr, address, slot, value);
    }
};

/// Call result type
pub const CallResult = struct {
    success: bool,
    gas_left: u64,
    output: []const u8,
};

/// Host implementation that reads from real EVM
pub const Host = struct {
    const Self = @This();
    allocator: std.mem.Allocator,

    pub fn init(allocator: std.mem.Allocator) Self {
        return .{ .allocator = allocator };
    }

    pub fn hostInterface(self: *Self) HostInterface {
        return .{
            .ptr = self,
            .vtable = &.{
                .inner_call = innerCall,
                .get_balance = getBalance,
                .get_code = getCode,
                .get_storage = getStorage,
                .set_storage = setStorage,
            },
        };
    }

    fn innerCall(ptr: *anyopaque, gas: u64, address: Address, value: u256, input: []const u8, call_type: HostInterface.CallType) CallResult {
        _ = ptr;
        _ = address;
        _ = value;
        _ = input;
        _ = call_type;
        // For now, just return success (this would normally delegate to the real EVM)
        return .{
            .success = true,
            .gas_left = gas,
            .output = &[_]u8{},
        };
    }

    fn getBalance(ptr: *anyopaque, address: Address) u256 {
        _ = ptr;
        _ = address;
        return 0;
    }

    fn getCode(ptr: *anyopaque, address: Address) []const u8 {
        _ = ptr;
        _ = address;
        return &[_]u8{};
    }

    fn getStorage(ptr: *anyopaque, address: Address, slot: u256) u256 {
        _ = ptr;
        _ = address;
        _ = slot;
        return 0;
    }

    fn setStorage(ptr: *anyopaque, address: Address, slot: u256, value: u256) void {
        _ = ptr;
        _ = address;
        _ = slot;
        _ = value;
    }
};
