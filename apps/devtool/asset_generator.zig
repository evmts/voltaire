const std = @import("std");

// Asset generation step for devtool
pub const GenerateAssetsStep = struct {
    step: std.Build.Step,
    dist_path: []const u8,
    out_path: []const u8,

    pub fn init(b: *std.Build, dist_path: []const u8, out_path: []const u8) *GenerateAssetsStep {
        const self = b.allocator.create(GenerateAssetsStep) catch @panic("OOM");
        self.* = GenerateAssetsStep{
            .step = std.Build.Step.init(.{
                .id = .custom,
                .name = "generate assets",
                .owner = b,
                .makeFn = make,
            }),
            .dist_path = b.dupe(dist_path),
            .out_path = b.dupe(out_path),
        };
        return self;
    }

    fn make(step: *std.Build.Step, options: std.Build.Step.MakeOptions) !void {
        _ = options;
        const self: *GenerateAssetsStep = @fieldParentPtr("step", step);
        const b = step.owner;

        var file = try std.fs.cwd().createFile(self.out_path, .{});
        defer file.close();

        try file.writeAll("// This file is auto-generated. Do not edit manually.\n");
        try file.writeAll("const std = @import(\"std\");\n\n");
        try file.writeAll("const Self = @This();\n\n");
        try file.writeAll("path: []const u8,\n");
        try file.writeAll("content: []const u8,\n");
        try file.writeAll("mime_type: []const u8,\n");
        try file.writeAll("response: [:0]const u8,\n\n");

        try file.writeAll("pub fn init(\n");
        try file.writeAll("    comptime path: []const u8,\n");
        try file.writeAll("    comptime content: []const u8,\n");
        try file.writeAll("    comptime mime_type: []const u8,\n");
        try file.writeAll(") Self {\n");
        try file.writeAll("    var buf: [20]u8 = undefined;\n");
        try file.writeAll("    const n = std.fmt.bufPrint(&buf, \"{d}\", .{content.len}) catch unreachable;\n");
        try file.writeAll("    const content_length = buf[0..n.len];\n");
        try file.writeAll("    const response = \"HTTP/1.1 200 OK\\n\" ++\n");
        try file.writeAll("        \"Content-Type: \" ++ mime_type ++ \"\\n\" ++\n");
        try file.writeAll("        \"Content-Length: \" ++ content_length ++ \"\\n\" ++\n");
        try file.writeAll("        \"\\n\" ++\n");
        try file.writeAll("        content;\n");
        try file.writeAll("    return Self{\n");
        try file.writeAll("        .path = path,\n");
        try file.writeAll("        .content = content,\n");
        try file.writeAll("        .mime_type = mime_type,\n");
        try file.writeAll("        .response = response,\n");
        try file.writeAll("    };\n");
        try file.writeAll("}\n\n");

        try file.writeAll("pub const not_found_asset = Self.init(\n");
        try file.writeAll("    \"/notfound.html\",\n");
        try file.writeAll("    \"<div>Page not found</div>\",\n");
        try file.writeAll("    \"text/html\",\n");
        try file.writeAll(");\n\n");

        try file.writeAll("pub const assets = [_]Self{\n");

        // Helper function to get MIME type from file extension
        const getMimeType = struct {
            fn get(path: []const u8) []const u8 {
                if (std.mem.endsWith(u8, path, ".html")) return "text/html";
                if (std.mem.endsWith(u8, path, ".css")) return "text/css";
                if (std.mem.endsWith(u8, path, ".js")) return "application/javascript";
                if (std.mem.endsWith(u8, path, ".svg")) return "image/svg+xml";
                if (std.mem.endsWith(u8, path, ".png")) return "image/png";
                if (std.mem.endsWith(u8, path, ".jpg") or std.mem.endsWith(u8, path, ".jpeg")) return "image/jpeg";
                if (std.mem.endsWith(u8, path, ".ico")) return "image/x-icon";
                return "application/octet-stream";
            }
        }.get;

        // Recursively walk the dist directory and generate assets
        var dist_dir = try std.fs.cwd().openDir(self.dist_path, .{ .iterate = true });
        defer dist_dir.close();

        var walker = try dist_dir.walk(b.allocator);
        defer walker.deinit();

        while (try walker.next()) |entry| {
            if (entry.kind != .file) continue;

            const web_path = try std.fmt.allocPrint(b.allocator, "/{s}", .{entry.path});
            const embed_path = try std.fmt.allocPrint(b.allocator, "dist/{s}", .{entry.path});
            const mime_type = getMimeType(entry.path);

            var s = try std.fmt.allocPrint(b.allocator, "    Self.init(\n", .{});
            defer b.allocator.free(s);
            try file.writeAll(s);
            s = try std.fmt.allocPrint(b.allocator, "        \"{s}\",\n", .{web_path});
            try file.writeAll(s);
            b.allocator.free(s);
            s = try std.fmt.allocPrint(b.allocator, "        @embedFile(\"{s}\"),\n", .{embed_path});
            try file.writeAll(s);
            b.allocator.free(s);
            s = try std.fmt.allocPrint(b.allocator, "        \"{s}\",\n", .{mime_type});
            try file.writeAll(s);
            b.allocator.free(s);
            try file.writeAll("    ),\n");
        }

        try file.writeAll("};\n\n");

        try file.writeAll("pub fn get_asset(path: []const u8) Self {\n");
        try file.writeAll("    for (assets) |asset| {\n");
        try file.writeAll("        if (std.mem.eql(u8, asset.path, path)) {\n");
        try file.writeAll("            return asset;\n");
        try file.writeAll("        }\n");
        try file.writeAll("    }\n");
        try file.writeAll("    return not_found_asset;\n");
        try file.writeAll("}\n");

        // File writer auto-flushes on close
    }

    fn get_mime_type(filename: []const u8) []const u8 {
        if (std.mem.endsWith(u8, filename, ".html")) return "text/html";
        if (std.mem.endsWith(u8, filename, ".js")) return "application/javascript";
        if (std.mem.endsWith(u8, filename, ".css")) return "text/css";
        if (std.mem.endsWith(u8, filename, ".svg")) return "image/svg+xml";
        if (std.mem.endsWith(u8, filename, ".png")) return "image/png";
        if (std.mem.endsWith(u8, filename, ".jpg") or std.mem.endsWith(u8, filename, ".jpeg")) return "image/jpeg";
        if (std.mem.endsWith(u8, filename, ".gif")) return "image/gif";
        if (std.mem.endsWith(u8, filename, ".ico")) return "image/x-icon";
        if (std.mem.endsWith(u8, filename, ".woff")) return "font/woff";
        if (std.mem.endsWith(u8, filename, ".woff2")) return "font/woff2";
        if (std.mem.endsWith(u8, filename, ".ttf")) return "font/ttf";
        if (std.mem.endsWith(u8, filename, ".otf")) return "font/otf";
        if (std.mem.endsWith(u8, filename, ".json")) return "application/json";
        if (std.mem.endsWith(u8, filename, ".xml")) return "application/xml";
        if (std.mem.endsWith(u8, filename, ".pdf")) return "application/pdf";
        if (std.mem.endsWith(u8, filename, ".txt")) return "text/plain";
        return "application/octet-stream";
    }
};