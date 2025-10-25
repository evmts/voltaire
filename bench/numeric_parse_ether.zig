const primitives = @import("primitives");

pub fn main() !void {
    _ = try primitives.Numeric.parseEther("1.5");
}
