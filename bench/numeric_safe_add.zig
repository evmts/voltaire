const primitives = @import("primitives");

pub fn main() !void {
    _ = primitives.Numeric.safeAdd(1000000, 2000000);
}
