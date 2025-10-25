const std = @import("std");
const crypto = @import("crypto");
const HashUtils = crypto.HashUtils;

pub fn main() !void {
    const data = "Hello, WASM!";
    const hash = HashUtils.keccak256(data);
    _ = hash;
}
