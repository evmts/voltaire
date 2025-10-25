const primitives = @import("primitives");

pub fn main() !void {
    _ = primitives.Address.isValid("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
}
