const std = @import("std");

test "Check ArrayList init" {
    const allocator = std.testing.allocator;
    
    // Try different ways to initialize ArrayList
    var list = std.ArrayList(u8).init(allocator);
    defer list.deinit();
    
    try list.append('a');
    try std.testing.expect(list.items.len == 1);
}