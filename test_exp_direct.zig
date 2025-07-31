const std = @import("std");
const testing = std.testing;

test "EXP calculation" {
    // Test: 2^3 = 8
    var result: u256 = 1;
    var b: u256 = 2;
    var e: u256 = 3;
    
    while (e > 0) {
        if ((e & 1) == 1) {
            const mul_result = @mulWithOverflow(result, b);
            result = mul_result[0];
        }
        if (e > 1) {
            const square_result = @mulWithOverflow(b, b);
            b = square_result[0];
        }
        e >>= 1;
    }
    
    std.debug.print("\nEXP: 2^3 = {}\n", .{result});
    try testing.expectEqual(@as(u256, 8), result);
}