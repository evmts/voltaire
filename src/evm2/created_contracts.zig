/// Tracks contracts created during transaction execution
/// Used for EIP-6780 SELFDESTRUCT behavior in Cancun+
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

pub const CreatedContracts = struct {
    created: std.AutoHashMap(Address, void),
    allocator: std.mem.Allocator,

    pub inline fn init(allocator: std.mem.Allocator) CreatedContracts {
        return CreatedContracts{
            .created = std.AutoHashMap(Address, void).init(allocator),
            .allocator = allocator,
        };
    }

    pub inline fn deinit(self: *CreatedContracts) void {
        self.created.deinit();
    }

    pub inline fn mark_created(self: *CreatedContracts, address: Address) !void {
        try self.created.put(address, {});
    }

    pub inline fn was_created_in_tx(self: *const CreatedContracts, address: Address) bool {
        return self.created.contains(address);
    }
};
