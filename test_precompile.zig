const std = @import("std");
const precompiles = @import("src/precompiles/precompiles.zig");
const primitives = @import("primitives");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Test case: ecadd_0-0_0-0_25000_64
    // This is adding the point at infinity (0,0) with itself
    const input = [_]u8{0} ** 64; // 64 bytes of zeros
    
    std.debug.print("Testing ecadd with 64 bytes of zeros (point at infinity + point at infinity)\n", .{});
    std.debug.print("Input length: {d}\n", .{input.len});
    
    const result = try precompiles.execute_ecadd(allocator, &input, 25000);
    defer allocator.free(result.output);
    
    std.debug.print("Success: {}\n", .{result.success});
    std.debug.print("Gas used: {d}\n", .{result.gas_used});
    std.debug.print("Output length: {d}\n", .{result.output.len});
    std.debug.print("Output: ", .{});
    for (result.output) |byte| {
        std.debug.print("{x:0>2}", .{byte});
    }
    std.debug.print("\n", .{});
    
    // Expected output should be 64 bytes of zeros (point at infinity)
    var expected_all_zeros = true;
    for (result.output) |byte| {
        if (byte != 0) {
            expected_all_zeros = false;
            break;
        }
    }
    
    if (expected_all_zeros) {
        std.debug.print("✓ Test passed: Output is point at infinity (all zeros)\n", .{});
    } else {
        std.debug.print("✗ Test failed: Expected all zeros, got non-zero output\n", .{});
    }
}