const std = @import("std");
const App = @import("app.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    var app = try App.init(allocator);
    defer app.deinit();
    try app.run();
}
