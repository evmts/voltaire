/// Tracks contracts created during transaction execution
/// Used for EIP-6780 SELFDESTRUCT behavior in Cancun+
const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

pub const CreatedContracts = struct {
    created: std.HashMap(Address, void, AddressContext, std.hash_map.default_max_load_percentage),
    allocator: std.mem.Allocator,

    const AddressContext = struct {
        pub fn hash(self: @This(), address: Address) u64 {
            _ = self;
            var hasher = std.hash.Wyhash.init(0);
            hasher.update(&address);
            return hasher.final();
        }

        pub fn eql(self: @This(), a: Address, b: Address) bool {
            _ = self;
            return std.mem.eql(u8, &a, &b);
        }
    };

    pub fn init(allocator: std.mem.Allocator) CreatedContracts {
        return CreatedContracts{
            .created = std.HashMap(Address, void, AddressContext, std.hash_map.default_max_load_percentage).init(allocator),
            .allocator = allocator,
        };
    }

    pub fn deinit(self: *CreatedContracts) void {
        self.created.deinit();
    }

    pub fn mark_created(self: *CreatedContracts, address: Address) !void {
        try self.created.put(address, {});
    }

    pub fn was_created_in_tx(self: *const CreatedContracts, address: Address) bool {
        return self.created.contains(address);
    }
};