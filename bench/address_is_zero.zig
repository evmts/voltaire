const primitives = @import("primitives");

pub fn main() !void {
    const addr = primitives.Address.ZERO;
    _ = addr.isZero();
}
