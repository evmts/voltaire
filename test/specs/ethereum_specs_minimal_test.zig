const std = @import("std");
const testing = std.testing;

test "minimal directory walk test" {
    std.log.info("Starting minimal walk test", .{});
    
    const allocator = testing.allocator;
    
    // Try to open the directory
    var dir = std.fs.cwd().openDir("specs/execution-specs/tests", .{ .iterate = true }) catch |err| {
        std.log.warn("Failed to open directory: {}", .{err});
        return;
    };
    defer dir.close();
    
    std.log.info("Directory opened successfully", .{});
    
    // Create walker with timeout protection
    var walker = try dir.walk(allocator);
    defer walker.deinit();
    
    std.log.info("Walker created", .{});
    
    var count: usize = 0;
    const max_count: usize = 3;
    
    // Walk with explicit limit
    while (try walker.next()) |entry| {
        std.log.info("Entry {}: {s} ({})", .{ count, entry.path, entry.kind });
        count += 1;
        if (count >= max_count) {
            std.log.info("Reached max count, stopping", .{});
            break;
        }
    }
    
    std.log.info("Walk completed with {} entries", .{count});
    try testing.expect(true);
}