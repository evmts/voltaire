const std = @import("std");
const webui = @import("webui/webui.zig");
const assets = @import("assets.zig");

const App = @This();

window: webui,

// Hello world handler function
fn helloWorldHandler(e: *webui.Event) void {
    const name = e.get_string(); // Get the name parameter from JavaScript
    
    // Create a response message
    var buffer: [256]u8 = undefined;
    const response = std.fmt.bufPrint(&buffer, "Hello from Zig, {s}! The backend is working.", .{name}) catch "Hello from Zig! Buffer overflow.";
    
    // Return the response to JavaScript
    // We need to convert the response to a null-terminated string
    var null_terminated_buffer: [256:0]u8 = undefined;
    const len = @min(response.len, 255);
    @memcpy(null_terminated_buffer[0..len], response[0..len]);
    null_terminated_buffer[len] = 0;
    
    e.return_string(null_terminated_buffer[0..len :0]);
}

pub fn init() App {
    const window = webui.new_window();
    webui.set_config(.multi_client, true);
    return App{ .window = window };
}

pub fn deinit() void {
    webui.clean();
}

pub fn handler(filename: []const u8) ?[]const u8 {
    // If requesting root, serve index.html
    const path = if (std.mem.eql(u8, filename, "/")) "/index.html" else filename;
    
    const asset = assets.get_asset(path);
    return asset.response;
}

pub fn run(self: *App) !void {
    self.window.set_file_handler(handler);
    
    // Bind the hello world function so JavaScript can call it
    _ = try self.window.bind("hello_world", helloWorldHandler);
    
    // Try using the embedded file directly with @embedFile
    const html_content = @embedFile("dist/index.html");
    try self.window.show(html_content);
    webui.wait();
}
