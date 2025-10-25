const primitives = @import("primitives");

pub fn main() !void {
    _ = primitives.Abi.computeSelector("transfer(address,uint256)");
}
