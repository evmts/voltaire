const primitives = @import("primitives");

pub fn main() !void {
    _ = try primitives.Numeric.parseGwei("20");
}
