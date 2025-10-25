const primitives = @import("primitives");

pub fn main() !void {
    _ = primitives.Hex.isHex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef");
}
