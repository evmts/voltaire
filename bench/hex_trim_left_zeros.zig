const primitives = @import("primitives");

pub fn main() !void {
    const bytes = [_]u8{ 0x00, 0x00, 0x12, 0x34, 0x56 };
    _ = primitives.Hex.trimLeftZeros(&bytes);
}
