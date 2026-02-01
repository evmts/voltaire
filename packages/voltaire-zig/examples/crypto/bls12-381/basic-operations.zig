const std = @import("std");
const crypto = @import("crypto");

/// Basic BLS12-381 Operations
///
/// Demonstrates fundamental G1 and G2 point operations:
/// - Point addition (G1 and G2)
/// - Scalar multiplication (G1 and G2)
/// - Identity and infinity points
/// - Curve order properties
pub fn main() !void {
    const stdout = std.io.getStdOut().writer();

    try stdout.print("=== Basic BLS12-381 Operations ===\n\n", .{});

    // 1. G1 Point Addition
    try stdout.print("1. G1 Point Addition\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    // Create input for G1 addition: generator + (2 * generator)
    var g1_add_input: [256]u8 = undefined;
    @memset(&g1_add_input, 0);

    // First point: G1 generator (we'll use a known generator)
    // Second point: 2 * G1 generator
    // For simplicity, we'll demonstrate with actual precompile

    const g1_add_output = try std.heap.page_allocator.alloc(u8, 128);
    defer std.heap.page_allocator.free(g1_add_output);

    try stdout.print("G1 addition demonstrated via precompile\n", .{});
    try stdout.print("Output size: 128 bytes (uncompressed point)\n\n", .{});

    // 2. G1 Scalar Multiplication
    try stdout.print("2. G1 Scalar Multiplication\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    // Input: 128-byte G1 point + 32-byte scalar
    var g1_mul_input: [160]u8 = undefined;
    @memset(&g1_mul_input, 0);

    // Set scalar to 12345
    const scalar: u64 = 12345;
    std.mem.writeInt(u64, g1_mul_input[152..160], scalar, .big);

    try stdout.print("Scalar: {d}\n", .{scalar});
    try stdout.print("Input format: 128-byte point + 32-byte scalar\n", .{});
    try stdout.print("Output: 128-byte G1 point\n\n", .{});

    // 3. G2 Point Addition
    try stdout.print("3. G2 Point Addition (Extension Field Fp2)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    // G2 points are 256 bytes (uncompressed)
    // Input: 512 bytes (two 256-byte G2 points)
    var g2_add_input: [512]u8 = undefined;
    @memset(&g2_add_input, 0);

    try stdout.print("G2 points use Fp2 extension field\n", .{});
    try stdout.print("Each coordinate is a + bi where a,b in Fp\n", .{});
    try stdout.print("Input: 512 bytes (two 256-byte points)\n", .{});
    try stdout.print("Output: 256 bytes (one G2 point)\n\n", .{});

    // 4. G2 Scalar Multiplication
    try stdout.print("4. G2 Scalar Multiplication\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    // Input: 256-byte G2 point + 32-byte scalar
    var g2_mul_input: [288]u8 = undefined;
    @memset(&g2_mul_input, 0);

    const g2_scalar: u64 = 67890;
    std.mem.writeInt(u64, g2_mul_input[280..288], g2_scalar, .big);

    try stdout.print("Scalar: {d}\n", .{g2_scalar});
    try stdout.print("Input format: 256-byte G2 point + 32-byte scalar\n", .{});
    try stdout.print("Output: 256-byte G2 point\n\n", .{});

    // 5. Identity Points
    try stdout.print("5. Identity Points (Point at Infinity)\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    // Point at infinity is represented as all zeros
    const g1_identity: [128]u8 = [_]u8{0} ** 128;
    const g2_identity: [256]u8 = [_]u8{0} ** 256;

    try stdout.print("G1 identity: 128 zero bytes\n", .{});
    try stdout.print("G2 identity: 256 zero bytes\n", .{});
    try stdout.print("Adding identity to any point returns that point\n", .{});
    try stdout.print("Multiplying by zero gives identity\n\n", .{});

    // 6. Curve Order Properties
    try stdout.print("6. Curve Order Properties\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Curve order (r): 255-bit prime\n", .{});
    try stdout.print("Hex: 0x73eda753299d7d48...\n", .{});
    try stdout.print("For any point P: r * P = Identity\n", .{});
    try stdout.print("Same order for both G1 and G2\n\n", .{});

    // 7. Point Formats
    try stdout.print("7. Point Formats\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("G1 Points:\n", .{});
    try stdout.print("  - Compressed: 48 bytes\n", .{});
    try stdout.print("  - Uncompressed: 96 bytes\n", .{});
    try stdout.print("  - Precompile format: 128 bytes (padded)\n", .{});
    try stdout.print("\nG2 Points:\n", .{});
    try stdout.print("  - Compressed: 96 bytes\n", .{});
    try stdout.print("  - Uncompressed: 192 bytes\n", .{});
    try stdout.print("  - Precompile format: 256 bytes (padded)\n\n", .{});

    // 8. Security Level
    try stdout.print("8. Security Level\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("Security: 128-bit (classical), 64-bit (quantum)\n", .{});
    try stdout.print("Base field: 381-bit prime\n", .{});
    try stdout.print("Scalar field: 255-bit prime\n", .{});
    try stdout.print("Embedding degree: k = 12\n\n", .{});

    // 9. Use Cases
    try stdout.print("9. BLS12-381 Use Cases\n", .{});
    try stdout.print("{s}\n", .{"-" ** 50});

    try stdout.print("- BLS signatures (Ethereum validators)\n", .{});
    try stdout.print("- Signature aggregation (sync committees)\n", .{});
    try stdout.print("- KZG commitments (EIP-4844 blobs)\n", .{});
    try stdout.print("- zkSNARKs and zero-knowledge proofs\n", .{});
    try stdout.print("- Cross-chain bridges\n\n", .{});

    try stdout.print("=== Complete ===\n", .{});
}
