const primitives = @import("primitives");

pub fn main() !void {
    _ = try primitives.Numeric.convertUnits(1, .ether, .gwei);
}
