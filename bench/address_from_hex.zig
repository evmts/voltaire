const std = @import("std");
const primitives = @import("primitives");
const Address = primitives.Address;

pub fn main() !void {
    const addr_hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    const addr = try Address.fromHex(addr_hex);
    _ = addr;
}
