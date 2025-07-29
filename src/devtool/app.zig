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
    
    // Debug: print what file is being requested
    std.debug.print("🔍 File requested: '{s}' -> mapped to: '{s}'\n", .{ filename, path });
    
    const asset = assets.get_asset(path);
    
    // Debug: print asset info with more detail
    if (std.mem.eql(u8, asset.path, "/notfound.html")) {
        std.debug.print("❌ Asset NOT FOUND: '{s}' - returning 404\n", .{path});
    } else {
        std.debug.print("✅ Asset found: path='{s}', content_len={d}, mime_type='{s}'\n", .{ asset.path, asset.content.len, asset.mime_type });
    }
    
    // Return just the content, not the full HTTP response
    // WebUI will handle the HTTP headers
    return asset.content;
}

pub fn run(self: *App) !void {
    // Don't set file handler for simple test
    // self.window.set_file_handler(handler);
    
    // Bind the hello world function so JavaScript can call it
    _ = try self.window.bind("hello_world", helloWorldHandler);
    
    // Create a simple test HTML that doesn't need external assets
    const simple_html = 
        \\<!DOCTYPE html>
        \\<html>
        \\<head>
        \\    <title>WebUI Test</title>
        \\    <script src="/webui.js"></script>
        \\    <style>
        \\        body {
        \\            font-family: Arial, sans-serif;
        \\            max-width: 600px;
        \\            margin: 50px auto;
        \\            padding: 20px;
        \\            background: #f0f0f0;
        \\        }
        \\        button {
        \\            padding: 10px 20px;
        \\            font-size: 16px;
        \\            cursor: pointer;
        \\        }
        \\        #result {
        \\            margin-top: 20px;
        \\            padding: 10px;
        \\            background: white;
        \\            border: 1px solid #ccc;
        \\            min-height: 50px;
        \\        }
        \\    </style>
        \\</head>
        \\<body>
        \\    <h1>WebUI Communication Test</h1>
        \\    <button onclick="testHello()">Test Hello World</button>
        \\    <div id="result">Click the button to test Zig backend communication</div>
        \\    
        \\    <script>
        \\        async function testHello() {
        \\            const resultDiv = document.getElementById('result');
        \\            try {
        \\                resultDiv.innerHTML = 'Calling Zig backend...';
        \\                const response = await hello_world('TestUser');
        \\                resultDiv.innerHTML = '<strong>✅ SUCCESS:</strong> ' + response;
        \\                console.log('Success:', response);
        \\            } catch (error) {
        \\                resultDiv.innerHTML = '<strong>❌ ERROR:</strong> ' + error;
        \\                console.error('Error:', error);
        \\            }
        \\        }
        \\        
        \\        // Test on page load
        \\        window.onload = () => {
        \\            console.log('Page loaded, WebUI should be available');
        \\            console.log('hello_world function exists:', typeof hello_world !== 'undefined');
        \\        };
        \\    </script>
        \\</body>
        \\</html>
    ;
    
    try self.window.show(simple_html);
    webui.wait();
}
