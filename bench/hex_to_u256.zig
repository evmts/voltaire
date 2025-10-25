const primitives = @import("primitives");

pub fn main() !void {
    _ = try primitives.Hex.hexToU256("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
}
