const primitives = @import("primitives");

pub fn main() !void {
    const deployer = try primitives.Address.fromHex("0xa0cf798816d4b9b9866b5330eea46a18382f251e");
    const salt = [_]u8{0} ** 32;
    const init_code_hash = [_]u8{0} ** 32;

    _ = primitives.Address.getCreate2Address(deployer, salt, init_code_hash);
}
