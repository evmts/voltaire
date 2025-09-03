const std = @import("std");
const evm = @import("evm");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    if (args.len < 2) {
        std.debug.print("Usage: {s} <fixture_dir>\n", .{args[0]});
        std.process.exit(1);
    }

    var runner = try evm.FixtureRunner.init(allocator);
    defer runner.deinit();

    const res = runner.loadAndRunFixture(args[1], true) catch |err| {
        std.debug.print("Fixture run failed: {}\n", .{err});
        std.process.exit(2);
        return;
    };

    std.debug.print("success={}, gas_used={}, output_len={}\n", .{ res.success, res.gas_used, res.output.len });
}

