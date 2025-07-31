const std = @import("std");
const testing = std.testing;

test "SIGNEXTEND logic" {
    // Test case: extend 0xFF from byte 0
    const x: u256 = 0xFF;
    const byte_num: u256 = 0;
    
    var result: u256 = undefined;
    
    if (byte_num >= 31) {
        result = x;
    } else {
        const byte_index = @as(u8, @intCast(byte_num));
        const sign_bit_pos = byte_index * 8 + 7;
        
        const sign_bit = (x >> @intCast(sign_bit_pos)) & 1;
        
        const keep_bits = sign_bit_pos + 1;
        
        std.debug.print("\nbyte_num={}, x=0x{x}, byte_index={}, sign_bit_pos={}, sign_bit={}, keep_bits={}\n", .{
            byte_num, x, byte_index, sign_bit_pos, sign_bit, keep_bits
        });
        
        if (sign_bit == 1) {
            // Sign bit is 1, extend with 1s
            if (keep_bits >= 256) {
                result = x;
            } else {
                const shift_amount = @as(u9, 256) - @as(u9, keep_bits);
                const ones_mask = ~(@as(u256, 0) >> @intCast(shift_amount));
                result = x | ones_mask;
                std.debug.print("shift_amount={}, ones_mask=0x{x}, result=0x{x}\n", .{
                    shift_amount, ones_mask, result
                });
            }
        } else {
            // Sign bit is 0, extend with 0s
            if (keep_bits >= 256) {
                result = x;
            } else {
                const zero_mask = (@as(u256, 1) << @intCast(keep_bits)) - 1;
                result = x & zero_mask;
            }
        }
    }
    
    std.debug.print("Final result: 0x{x}, expected: 0x{x}\n", .{ result, std.math.maxInt(u256) });
    try testing.expectEqual(std.math.maxInt(u256), result);
}