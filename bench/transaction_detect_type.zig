const primitives = @import("primitives");

pub fn main() !void {
    const data = [_]u8{0x02} ++ [_]u8{0} ** 10;
    _ = primitives.Transaction.detectTransactionType(&data);
}
