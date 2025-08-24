const std = @import("std");

test "simple test" {
    try std.testing.expectEqual(@as(u32, 42), 42);
}