const std = @import("std");
const fs = std.fs;
const mem = std.mem;
const process = std.process;

const TestResult = struct {
    file: []const u8,
    success: bool,
    duration_ms: u64,
};

/// Recursively find all .zig files in a directory
fn findZigFiles(allocator: mem.Allocator, dir_path: []const u8, files: *std.ArrayList([]const u8)) !void {
    var dir = try fs.cwd().openDir(dir_path, .{ .iterate = true });
    defer dir.close();

    var iter = dir.iterate();
    while (try iter.next()) |entry| {
        if (entry.kind == .directory) {
            // Recursively search subdirectories
            const sub_path = try fs.path.join(allocator, &[_][]const u8{ dir_path, entry.name });
            defer allocator.free(sub_path);
            try findZigFiles(allocator, sub_path, files);
        } else if (entry.kind == .file and mem.endsWith(u8, entry.name, ".zig")) {
            // Skip test files and this test runner itself
            if (mem.endsWith(u8, entry.name, ".test.zig") or mem.eql(u8, entry.name, "test-examples.zig")) {
                continue;
            }

            // Add full path
            const full_path = try fs.path.join(allocator, &[_][]const u8{ dir_path, entry.name });
            try files.append(full_path);
        }
    }
}

/// Run a single Zig example file
fn runExample(allocator: mem.Allocator, file: []const u8) !TestResult {
    const start = std.time.milliTimestamp();

    // Build and run: zig run <file>
    var child = std.process.Child.init(&[_][]const u8{ "zig", "run", file }, allocator);
    child.stdout_behavior = .Ignore;
    child.stderr_behavior = .Ignore;

    const term = child.spawnAndWait() catch |err| {
        const duration_ms: u64 = @intCast(std.time.milliTimestamp() - start);
        std.debug.print("Error spawning: {}\n", .{err});
        return TestResult{
            .file = file,
            .success = false,
            .duration_ms = duration_ms,
        };
    };

    const duration_ms: u64 = @intCast(std.time.milliTimestamp() - start);

    const success = switch (term) {
        .Exited => |code| code == 0,
        else => false,
    };

    return TestResult{
        .file = file,
        .success = success,
        .duration_ms = duration_ms,
    };
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const stdout = std.io.getStdOut().writer();

    try stdout.print("🔍 Discovering Zig examples...\n\n", .{});

    // Find all .zig files in examples/
    var files = std.ArrayList([]const u8).init(allocator);
    defer {
        for (files.items) |file| {
            allocator.free(file);
        }
        files.deinit();
    }

    try findZigFiles(allocator, "examples", &files);

    // Sort files for consistent output
    std.mem.sort([]const u8, files.items, {}, struct {
        fn lessThan(_: void, a: []const u8, b: []const u8) bool {
            return std.mem.order(u8, a, b) == .lt;
        }
    }.lessThan);

    try stdout.print("Found {} Zig examples\n\n", .{files.items.len});
    try stdout.print("🧪 Running examples...\n\n", .{});

    var results = std.ArrayList(TestResult).init(allocator);
    defer results.deinit();

    var passed: usize = 0;
    var failed: usize = 0;

    // Run examples sequentially
    for (files.items) |file| {
        // Get relative path from examples/
        const rel_path = if (mem.startsWith(u8, file, "examples/"))
            file[9..]
        else
            file;

        try stdout.print("  {s} ... ", .{rel_path});

        const result = try runExample(allocator, file);
        try results.append(result);

        if (result.success) {
            try stdout.print("✅ ({}ms)\n", .{result.duration_ms});
            passed += 1;
        } else {
            try stdout.print("❌ ({}ms)\n", .{result.duration_ms});
            failed += 1;
        }
    }

    // Summary
    try stdout.print("\n", .{});
    try stdout.print("================================================================================\n", .{});
    try stdout.print("📊 Test Summary\n\n", .{});
    try stdout.print("  Total:  {}\n", .{files.items.len});
    try stdout.print("  Passed: {} ✅\n", .{passed});
    try stdout.print("  Failed: {} ❌\n", .{failed});
    try stdout.print("================================================================================\n", .{});

    // Show failures
    if (failed > 0) {
        try stdout.print("\n❌ Failed Examples:\n\n", .{});

        for (results.items) |result| {
            if (!result.success) {
                const rel_path = if (mem.startsWith(u8, result.file, "examples/"))
                    result.file[9..]
                else
                    result.file;

                try stdout.print("  {s}\n", .{rel_path});
            }
        }
        try stdout.print("\n", .{});
    }

    // Exit with appropriate code
    process.exit(if (failed > 0) 1 else 0);
}
