const std = @import("std");
const clap = @import("clap");
const process = std.process;
const print = std.debug.print;

const BenchmarkMode = enum {
    basic,
    detailed,
    comparison,
    @"export",
    all,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const params = comptime clap.parseParamsComptime(
        \\-h, --help             Display this help and exit.
        \\-m, --mode <MODE>      Benchmark mode: basic, detailed, comparison, export, all (default: all)
        \\-r, --runs <NUM>       Number of runs for detailed mode (default: 50)
        \\
    );

    const parsers = comptime .{
        .MODE = clap.parsers.enumeration(BenchmarkMode),
        .NUM = clap.parsers.int(u32, 10),
    };

    var diag = clap.Diagnostic{};
    var res = clap.parse(clap.Help, &params, parsers, .{
        .diagnostic = &diag,
        .allocator = allocator,
    }) catch |err| {
        diag.report(std.io.getStdErr().writer(), err) catch {};
        return err;
    };
    defer res.deinit();

    if (res.args.help != 0) {
        try printHelp();
        return;
    }

    const mode = res.args.mode orelse .all;
    const num_runs = res.args.runs orelse 50;

    // Build the Rust program first
    print("Building the Rust program...\n", .{});
    const build_result = try std.process.Child.run(.{
        .allocator = allocator,
        .argv = &[_][]const u8{ "cargo", "build", "--release" },
    });
    defer allocator.free(build_result.stdout);
    defer allocator.free(build_result.stderr);

    if (build_result.term.Exited != 0) {
        print("Build failed:\n{s}\n", .{build_result.stderr});
        return error.BuildFailed;
    }

    // Determine the binary path relative to workspace root
    const release_bin = "../../target/release/hyperfine-bench";
    const debug_bin = "../../target/debug/hyperfine-bench";

    switch (mode) {
        .basic => try runBasicBenchmark(allocator, release_bin),
        .detailed => try runDetailedBenchmark(allocator, release_bin, num_runs),
        .comparison => try runComparisonBenchmark(allocator, debug_bin, release_bin),
        .@"export" => try runExportBenchmark(allocator, release_bin),
        .all => {
            try runBasicBenchmark(allocator, release_bin);
            try runDetailedBenchmark(allocator, release_bin, num_runs);
            try runComparisonBenchmark(allocator, debug_bin, release_bin);
            try runExportBenchmark(allocator, release_bin);
        },
    }
}

fn printHelp() !void {
    const stdout = std.io.getStdOut().writer();
    try stdout.print(
        \\Zig Benchmark Runner
        \\
        \\This tool runs hyperfine benchmarks on the hello world Rust program.
        \\
        \\Options:
        \\  -h, --help             Display this help and exit
        \\  -m, --mode <MODE>      Benchmark mode: basic, detailed, comparison, export, all (default: all)
        \\  -r, --runs <NUM>       Number of runs for detailed mode (default: 50)
        \\
        \\Examples:
        \\  benchmark               Run all benchmarks
        \\  benchmark -m basic      Run only basic benchmark
        \\  benchmark -m detailed -r 100  Run detailed benchmark with 100 runs
        \\
    , .{});
}

fn runBasicBenchmark(allocator: std.mem.Allocator, release_bin: []const u8) !void {
    print("\n=== Basic Hello World Benchmark ===\n", .{});
    
    const result = try std.process.Child.run(.{
        .allocator = allocator,
        .argv = &[_][]const u8{ "hyperfine", release_bin },
    });
    defer allocator.free(result.stdout);
    defer allocator.free(result.stderr);

    print("{s}", .{result.stdout});
    if (result.stderr.len > 0) {
        print("{s}", .{result.stderr});
    }
}

fn runDetailedBenchmark(allocator: std.mem.Allocator, release_bin: []const u8, num_runs: u32) !void {
    print("\n=== Benchmark with {} runs ===\n", .{num_runs});
    
    var runs_str_buf: [32]u8 = undefined;
    const runs_str = try std.fmt.bufPrint(&runs_str_buf, "{}", .{num_runs});
    
    const result = try std.process.Child.run(.{
        .allocator = allocator,
        .argv = &[_][]const u8{ "hyperfine", "--runs", runs_str, release_bin },
    });
    defer allocator.free(result.stdout);
    defer allocator.free(result.stderr);

    print("{s}", .{result.stdout});
    if (result.stderr.len > 0) {
        print("{s}", .{result.stderr});
    }
}

fn runComparisonBenchmark(allocator: std.mem.Allocator, debug_bin: []const u8, release_bin: []const u8) !void {
    print("\n=== Debug vs Release Comparison ===\n", .{});
    
    // Build debug version first
    const debug_result = try std.process.Child.run(.{
        .allocator = allocator,
        .argv = &[_][]const u8{ "cargo", "build" },
    });
    defer allocator.free(debug_result.stdout);
    defer allocator.free(debug_result.stderr);

    if (debug_result.term.Exited != 0) {
        print("Debug build failed:\n{s}\n", .{debug_result.stderr});
        return error.DebugBuildFailed;
    }

    const result = try std.process.Child.run(.{
        .allocator = allocator,
        .argv = &[_][]const u8{
            "hyperfine",
            "--warmup", "3",
            "-n", "debug build",
            debug_bin,
            "-n", "release build",
            release_bin,
        },
    });
    defer allocator.free(result.stdout);
    defer allocator.free(result.stderr);

    print("{s}", .{result.stdout});
    if (result.stderr.len > 0) {
        print("{s}", .{result.stderr});
    }
}

fn runExportBenchmark(allocator: std.mem.Allocator, release_bin: []const u8) !void {
    print("\n=== Exporting Results ===\n", .{});
    
    const result = try std.process.Child.run(.{
        .allocator = allocator,
        .argv = &[_][]const u8{
            "hyperfine",
            "--runs", "20",
            "--export-markdown", "results.md",
            "--export-json", "results.json",
            release_bin,
        },
    });
    defer allocator.free(result.stdout);
    defer allocator.free(result.stderr);

    print("{s}", .{result.stdout});
    if (result.stderr.len > 0) {
        print("{s}", .{result.stderr});
    }
    
    print("\nBenchmark complete! Results saved to results.md and results.json\n", .{});
}