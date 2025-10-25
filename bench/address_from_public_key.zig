const primitives = @import("primitives");

pub fn main() !void {
    const public_key_x: u256 = 0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75;
    const public_key_y: u256 = 0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5;
    _ = primitives.Address.fromPublicKey(public_key_x, public_key_y);
}
