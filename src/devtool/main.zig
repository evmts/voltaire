const std = @import("std");
const App = @import("app.zig");

extern fn createApplicationMenu() void;

pub export var main_window: usize = 0;

pub fn main() !void {
    if (@import("builtin").target.os.tag == .macos) {
        createApplicationMenu();
    }
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    var app = try App.init(allocator);
    defer app.deinit();

    main_window = app.window.window_handle;

    try app.run();
}
