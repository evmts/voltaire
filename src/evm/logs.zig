const primitives = @import("primitives");
const Address = primitives.Address.Address;

/// Simple log structure for Frame
pub const Log = struct {
    address: Address,
    topics: []const u256,
    data: []const u8,
};
