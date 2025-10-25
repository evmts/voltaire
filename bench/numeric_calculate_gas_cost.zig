const primitives = @import("primitives");

pub fn main() !void {
    const gas_used: u64 = 21000;
    const gas_price_gwei: u256 = 20;
    _ = primitives.Numeric.calculateGasCost(gas_used, gas_price_gwei);
}
