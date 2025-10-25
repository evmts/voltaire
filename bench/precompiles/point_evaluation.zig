const std = @import("std");
const precompiles = @import("precompiles");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Initialize KZG trusted setup
    try crypto.kzg_setup.init();
    defer crypto.kzg_setup.deinit(allocator);

    // Test vector: point at infinity
    var input = [_]u8{0} ** 192;

    // Commitment (48 bytes) - point at infinity
    input[96] = 0xc0;

    // Proof (48 bytes) - point at infinity
    input[144] = 0xc0;

    // Compute versioned hash
    var computed_hash: [32]u8 = undefined;
    try crypto.keccak_asm.keccak256(input[96..144], &computed_hash);
    computed_hash[0] = 0x01;

    // Set versioned hash
    @memcpy(input[0..32], &computed_hash);

    const result = try precompiles.point_evaluation.execute(allocator, &input, 1000000);
    defer result.deinit(allocator);
    _ = &result;
}
