const primitives = @import("primitives");

pub fn main() !void {
    _ = primitives.Numeric.safeMul(1000000, 1000);
}
