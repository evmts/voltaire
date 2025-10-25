const primitives = @import("primitives");

pub fn main() !void {
    const addr = try primitives.Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    _ = addr.toHex();
}
