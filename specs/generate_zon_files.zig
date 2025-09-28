const std = @import("std");

const TestCaseMetadata = struct {
    test_name: []const u8,
    file_path: []const u8,
    zon_path: []const u8,
    test_path: []const u8,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);
    
    if (args.len < 3) {
        std.debug.print("Usage: {s} <source_dir> <output_dir>\n", .{args[0]});
        return;
    }
    
    const source_dir = args[1];
    const output_dir = args[2];
    
    // Create output directory if it doesn't exist
    std.fs.cwd().makePath(output_dir) catch {};
    
    // List to store all test case metadata for the manifest
    var manifest_entries = std.ArrayList(TestCaseMetadata){};
    defer manifest_entries.deinit(allocator);
    
    // Walk through source directory
    var source = try std.fs.cwd().openDir(source_dir, .{ .iterate = true });
    defer source.close();
    
    var walker = try source.walk(allocator);
    defer walker.deinit();
    
    var file_count: usize = 0;
    var test_case_count: usize = 0;
    
    while (try walker.next()) |entry| {
        // Skip non-files
        if (entry.kind != .file) continue;
        
        // Check if it's a JSON or YAML file
        const is_json = std.mem.endsWith(u8, entry.basename, ".json");
        const is_yaml = std.mem.endsWith(u8, entry.basename, ".yml") or 
                       std.mem.endsWith(u8, entry.basename, ".yaml");
        
        if (!is_json and !is_yaml) continue;
        
        file_count += 1;
        
        // Read the file
        const full_path = try std.fs.path.join(allocator, &.{ source_dir, entry.path });
        defer allocator.free(full_path);
        
        const content = std.fs.cwd().readFileAlloc(allocator, full_path, 100 * 1024 * 1024) catch |err| {
            std.debug.print("Failed to read {s}: {}\n", .{ full_path, err });
            continue;
        };
        defer allocator.free(content);
        
        // Parse JSON to extract test cases
        if (is_json) {
            const parsed = std.json.parseFromSlice(std.json.Value, allocator, content, .{}) catch |err| {
                std.debug.print("Failed to parse {s}: {}\n", .{ full_path, err });
                continue;
            };
            defer parsed.deinit();
            
            // If it's an object with test cases
            if (parsed.value == .object) {
                // Create output directory structure
                const dir_path = std.fs.path.dirname(entry.path) orelse ".";
                const output_subdir = try std.fs.path.join(allocator, &.{ output_dir, dir_path });
                defer allocator.free(output_subdir);
                
                std.fs.cwd().makePath(output_subdir) catch {};
                
                // Create a .zon file for each test case
                var it = parsed.value.object.iterator();
                while (it.next()) |kv| {
                    const test_name = kv.key_ptr.*;
                    test_case_count += 1;
                    
                    // Create .zon filename
                    const base_name = if (std.mem.lastIndexOf(u8, entry.basename, ".")) |idx|
                        entry.basename[0..idx]
                    else
                        entry.basename;
                    
                    const zon_name = try std.fmt.allocPrint(allocator, "{s}_{s}.zon", .{ base_name, test_name });
                    defer allocator.free(zon_name);
                    
                    const zon_relative_path = try std.fs.path.join(allocator, &.{ dir_path, zon_name });
                    defer allocator.free(zon_relative_path);
                    
                    const output_path = try std.fs.path.join(allocator, &.{ output_dir, zon_relative_path });
                    defer allocator.free(output_path);
                    
                    // We'll add to manifest after generating test file
                    
                    // Build the .zon content by converting JSON to ZON format
                    var zon_content = std.ArrayList(u8){};
                    defer zon_content.deinit(allocator);
                    
                    try zon_content.appendSlice(allocator, ".{\n");
                    try zon_content.writer(allocator).print("    .test_name = \"{s}\",\n", .{test_name});
                    try zon_content.writer(allocator).print("    .source_file = \"{s}\",\n", .{entry.path});
                    try zon_content.writer(allocator).print("    .test_index = {},\n", .{test_case_count - 1});
                    
                    // Convert the JSON test case to ZON format
                    try zon_content.appendSlice(allocator, "    .data = ");
                    try writeJsonAsZon(&zon_content, allocator, kv.value_ptr.*, 1);
                    try zon_content.appendSlice(allocator, ",\n}");
                    
                    // Write .zon file
                    var file = try std.fs.cwd().createFile(output_path, .{});
                    defer file.close();
                    try file.writeAll(zon_content.items);
                    
                    // Generate test file alongside the .zon file
                    const test_file_name = try std.mem.replaceOwned(u8, allocator, zon_name, ".zon", "_test.zig");
                    defer allocator.free(test_file_name);
                    
                    const test_relative_path = try std.fs.path.join(allocator, &.{ dir_path, test_file_name });
                    defer allocator.free(test_relative_path);
                    
                    const test_output_path = try std.fs.path.join(allocator, &.{ output_dir, test_relative_path });
                    defer allocator.free(test_output_path);
                    
                    // Generate test file content that parses JSON directly
                    var test_content = std.ArrayList(u8){};
                    defer test_content.deinit(allocator);
                    
                    try test_content.appendSlice(allocator, "const std = @import(\"std\");\n");
                    try test_content.appendSlice(allocator, "const testing = std.testing;\n");
                    try test_content.appendSlice(allocator, "const runner = @import(\"runner\");\n\n");
                    
                    // Calculate absolute path to the original JSON file from project root
                    const json_path = try std.fs.path.join(allocator, &.{ "specs/execution-specs/tests", entry.path });
                    defer allocator.free(json_path);
                    
                    // Create the test function that parses JSON and calls the runner
                    try test_content.writer(allocator).print("test \"{s}\" {{\n", .{test_name});
                    try test_content.appendSlice(allocator, "    const allocator = testing.allocator;\n");
                    try test_content.appendSlice(allocator, "    \n");
                    try test_content.appendSlice(allocator, "    // Read and parse the JSON test file\n");
                    try test_content.writer(allocator).print("    const json_path = \"{s}\";\n", .{json_path});
                    try test_content.appendSlice(allocator, "    const json_content = try std.fs.cwd().readFileAlloc(allocator, json_path, 100 * 1024 * 1024);\n");
                    try test_content.appendSlice(allocator, "    defer allocator.free(json_content);\n");
                    try test_content.appendSlice(allocator, "    \n");
                    try test_content.appendSlice(allocator, "    const parsed = try std.json.parseFromSlice(std.json.Value, allocator, json_content, .{});\n");
                    try test_content.appendSlice(allocator, "    defer parsed.deinit();\n");
                    try test_content.appendSlice(allocator, "    \n");
                    try test_content.appendSlice(allocator, "    // Get the specific test case\n");
                    try test_content.writer(allocator).print("    const test_case = parsed.value.object.get(\"{s}\").?;\n", .{test_name});
                    try test_content.appendSlice(allocator, "    \n");
                    try test_content.appendSlice(allocator, "    // Run the test\n");
                    try test_content.appendSlice(allocator, "    try runner.runJsonTest(allocator, test_case);\n");
                    try test_content.appendSlice(allocator, "}\n");
                    
                    // Write test file
                    var test_file = try std.fs.cwd().createFile(test_output_path, .{});
                    defer test_file.close();
                    try test_file.writeAll(test_content.items);
                    
                    // Add to manifest
                    try manifest_entries.append(allocator, TestCaseMetadata{
                        .test_name = try allocator.dupe(u8, test_name),
                        .file_path = try allocator.dupe(u8, entry.path),
                        .zon_path = try allocator.dupe(u8, zon_relative_path),
                        .test_path = try allocator.dupe(u8, test_relative_path),
                    });
                    
                    if (test_case_count % 100 == 0) {
                        std.debug.print("Generated {} test cases...\n", .{test_case_count});
                    }
                }
            }
        }
        // TODO: Handle YAML files if needed
    }
    
    // Write manifest file
    const manifest_path = try std.fs.path.join(allocator, &.{ output_dir, "manifest.zon" });
    defer allocator.free(manifest_path);
    
    var manifest_file = try std.fs.cwd().createFile(manifest_path, .{});
    defer manifest_file.close();
    
    var manifest_content = std.ArrayList(u8){};
    defer manifest_content.deinit(allocator);
    
    try manifest_content.appendSlice(allocator, ".{\n");
    try manifest_content.writer(allocator).print("    .total_files = {},\n", .{file_count});
    try manifest_content.writer(allocator).print("    .total_test_cases = {},\n", .{test_case_count});
    try manifest_content.appendSlice(allocator, "    .test_cases = .{\n");
    
    for (manifest_entries.items) |entry| {
        try manifest_content.appendSlice(allocator, "        .{\n");
        try manifest_content.writer(allocator).print("            .test_name = \"{s}\",\n", .{entry.test_name});
        try manifest_content.writer(allocator).print("            .source_file = \"{s}\",\n", .{entry.file_path});
        try manifest_content.writer(allocator).print("            .zon_file = \"{s}\",\n", .{entry.zon_path});
        try manifest_content.writer(allocator).print("            .test_file = \"{s}\",\n", .{entry.test_path});
        try manifest_content.appendSlice(allocator, "        },\n");
    }
    
    try manifest_content.appendSlice(allocator, "    },\n}");
    try manifest_file.writeAll(manifest_content.items);
    
    // Generate root.zig file with all test imports
    const root_path = try std.fs.path.join(allocator, &.{ output_dir, "root.zig" });
    defer allocator.free(root_path);
    
    var root_file = try std.fs.cwd().createFile(root_path, .{});
    defer root_file.close();
    
    var root_content = std.ArrayList(u8){};
    defer root_content.deinit(allocator);
    
    try root_content.appendSlice(allocator, "// Auto-generated root file that imports all test files\n");
    try root_content.appendSlice(allocator, "// Generated by generate_zon_files.zig\n\n");
    try root_content.appendSlice(allocator, "const std = @import(\"std\");\n\n");
    try root_content.appendSlice(allocator, "// Suppress debug logging for tests to keep output clean\n");
    try root_content.appendSlice(allocator, "pub const std_options = std.Options{\n");
    try root_content.appendSlice(allocator, "    .log_level = .err,\n");
    try root_content.appendSlice(allocator, "};\n\n");
    try root_content.appendSlice(allocator, "test {\n");
    try root_content.appendSlice(allocator, "    // Import all test files\n");
    
    for (manifest_entries.items) |entry| {
        try root_content.writer(allocator).print("    _ = @import(\"{s}\");\n", .{entry.test_path});
    }
    
    try root_content.appendSlice(allocator, "}\n");
    
    try root_file.writeAll(root_content.items);
    
    std.debug.print("\nGeneration complete!\n", .{});
    std.debug.print("  Files processed: {}\n", .{file_count});
    std.debug.print("  Test cases generated: {}\n", .{test_case_count});
    std.debug.print("  Manifest written to: {s}\n", .{manifest_path});
    std.debug.print("  Root file written to: {s}\n", .{root_path});
    
    // Clean up allocated strings
    for (manifest_entries.items) |entry| {
        allocator.free(entry.test_name);
        allocator.free(entry.file_path);
        allocator.free(entry.zon_path);
        allocator.free(entry.test_path);
    }
}

// Convert JSON Value to ZON format
fn writeJsonAsZon(zon_content: *std.ArrayList(u8), allocator: std.mem.Allocator, value: std.json.Value, indent_level: usize) !void {
    const indent = "    ";
    
    switch (value) {
        .null => try zon_content.appendSlice(allocator, "null"),
        .bool => |b| try zon_content.writer(allocator).print("{}", .{b}),
        .integer => |i| {
            // Negative numbers need parentheses in ZON syntax when used as values
            if (i < 0) {
                try zon_content.writer(allocator).print("@as(i64, {})", .{i});
            } else {
                try zon_content.writer(allocator).print("{}", .{i});
            }
        },
        .float => |f| try zon_content.writer(allocator).print("{d}", .{f}),
        .number_string => |s| try zon_content.writer(allocator).print("{s}", .{s}),
        .string => |s| {
            // Write string with proper escaping
            try zon_content.append(allocator, '"');
            for (s) |c| {
                switch (c) {
                    '\n' => try zon_content.appendSlice(allocator, "\\n"),
                    '\r' => try zon_content.appendSlice(allocator, "\\r"),
                    '\t' => try zon_content.appendSlice(allocator, "\\t"),
                    '"' => try zon_content.appendSlice(allocator, "\\\""),
                    '\\' => try zon_content.appendSlice(allocator, "\\\\"),
                    else => try zon_content.append(allocator, c),
                }
            }
            try zon_content.append(allocator, '"');
        },
        .array => |arr| {
            if (arr.items.len == 0) {
                // Empty array
                try zon_content.appendSlice(allocator, ".{}");
            } else {
                try zon_content.appendSlice(allocator, ".[\n");
                for (arr.items, 0..) |item, i| {
                    // Add indent
                    for (0..indent_level + 1) |_| {
                        try zon_content.appendSlice(allocator, indent);
                    }
                    try writeJsonAsZon(zon_content, allocator, item, indent_level + 1);
                    if (i < arr.items.len - 1) {
                        try zon_content.append(allocator, ',');
                    }
                    try zon_content.append(allocator, '\n');
                }
                // Add closing indent
                for (0..indent_level) |_| {
                    try zon_content.appendSlice(allocator, indent);
                }
                try zon_content.append(allocator, ']');
            }
        },
        .object => |obj| {
            if (obj.count() == 0) {
                // Empty object
                try zon_content.appendSlice(allocator, ".{}");
            } else {
                try zon_content.appendSlice(allocator, ".{\n");
                var it = obj.iterator();
                var first = true;
                while (it.next()) |kv| {
                    if (!first) {
                        try zon_content.appendSlice(allocator, ",\n");
                    }
                    first = false;
                    
                    // Add indent
                    for (0..indent_level + 1) |_| {
                        try zon_content.appendSlice(allocator, indent);
                    }
                    
                    // Write key (as identifier if possible, otherwise as string)
                    if (isValidZigIdentifier(kv.key_ptr.*)) {
                        try zon_content.writer(allocator).print(".{s} = ", .{kv.key_ptr.*});
                    } else {
                        try zon_content.writer(allocator).print(".@\"{s}\" = ", .{kv.key_ptr.*});
                    }
                    
                    try writeJsonAsZon(zon_content, allocator, kv.value_ptr.*, indent_level + 1);
                }
                if (!first) {
                    try zon_content.append(allocator, '\n');
                }
                // Add closing indent
                for (0..indent_level) |_| {
                    try zon_content.appendSlice(allocator, indent);
                }
                try zon_content.append(allocator, '}');
            }
        },
    }
}

fn isValidZigIdentifier(name: []const u8) bool {
    if (name.len == 0) return false;
    
    // Check if it starts with a letter or underscore
    if (!std.ascii.isAlphabetic(name[0]) and name[0] != '_') return false;
    
    // Check rest of characters
    for (name[1..]) |c| {
        if (!std.ascii.isAlphanumeric(c) and c != '_') return false;
    }
    
    // Check if it's a keyword
    const keywords = [_][]const u8{
        "addrspace", "align", "allowzero", "and", "anyframe", "anytype", "asm",
        "async", "await", "break", "catch", "comptime", "const", "continue",
        "defer", "else", "enum", "errdefer", "error", "export", "extern",
        "fn", "for", "if", "inline", "noalias", "noinline", "nosuspend", "opaque",
        "or", "orelse", "packed", "pub", "resume", "return", "linksection",
        "struct", "suspend", "switch", "test", "threadlocal", "try", "union",
        "unreachable", "usingnamespace", "var", "volatile", "while",
    };
    
    for (keywords) |keyword| {
        if (std.mem.eql(u8, name, keyword)) return false;
    }
    
    return true;
}