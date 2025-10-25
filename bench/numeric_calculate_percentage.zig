const primitives = @import("primitives");

pub fn main() !void {
    _ = primitives.Numeric.calculatePercentage(1000000, 15);
}
