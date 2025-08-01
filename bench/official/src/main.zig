const std = @import("std");
const clap = @import("clap");
const process = std.process;
const print = std.debug.print;

const TestCase = struct {
    name: []const u8,
    bytecode_path: []const u8,
    calldata_path: []const u8,
};

// Get the directory containing this source file
fn getSourceDir() []const u8 {
    return std.fs.path.dirname(@src().file) orelse ".";
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const params = comptime clap.parseParamsComptime(
        \\-h, --help             Display this help and exit.
        \\-e, --evm <NAME>       EVM implementation to benchmark (default: revm)
        \\-n, --num-runs <NUM>   Number of runs per test case (default: 10)
        \\
    );

    const parsers = comptime .{
        .NAME = clap.parsers.string,
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

    const evm_name = res.args.evm orelse "revm";
    const num_runs = res.args.@"num-runs" orelse 10;

    // Discover all test cases
    const test_cases = try discoverTestCases(allocator);
    defer {
        for (test_cases) |tc| {
            allocator.free(tc.bytecode_path);
            allocator.free(tc.calldata_path);
        }
        allocator.free(test_cases);
    }

    // Run benchmarks for each test case
    for (test_cases) |test_case| {
        print("\n=== Benchmarking {s} ===\n", .{test_case.name});
        try runBenchmark(allocator, evm_name, test_case, num_runs);
    }
}

fn printHelp() !void {
    const stdout = std.io.getStdOut().writer();
    try stdout.print(
        \\EVM Benchmark Runner
        \\
        \\This tool runs benchmarks on various EVM implementations using test cases.
        \\
        \\Options:
        \\  -h, --help             Display this help and exit
        \\  -e, --evm <NAME>       EVM implementation to benchmark (default: revm)
        \\  -n, --num-runs <NUM>   Number of runs per test case (default: 10)
        \\
        \\Examples:
        \\  benchmark              Run benchmarks with revm
        \\  benchmark -e revm      Explicitly use revm
        \\  benchmark -n 50        Run 50 iterations per test case
        \\
    , .{});
}


fn discoverTestCases(allocator: std.mem.Allocator) ![]TestCase {
    // Cases are in bench/official/cases relative to project root
    const cases_path = "bench/official/cases";
    
    const cases_dir = try std.fs.cwd().openDir(cases_path, .{ .iterate = true });
    
    var test_cases = std.ArrayList(TestCase).init(allocator);
    defer test_cases.deinit();

    var it = cases_dir.iterate();
    while (try it.next()) |entry| {
        if (entry.kind != .directory) continue;

        const bytecode_path = try std.fs.path.join(allocator, &[_][]const u8{ cases_path, entry.name, "bytecode.txt" });
        errdefer allocator.free(bytecode_path);
        
        const calldata_path = try std.fs.path.join(allocator, &[_][]const u8{ cases_path, entry.name, "calldata.txt" });
        errdefer allocator.free(calldata_path);

        // Verify files exist
        if (std.fs.cwd().openFile(bytecode_path, .{})) |file| {
            file.close();
        } else |err| {
            print("Warning: Missing bytecode file for {s}: {}\n", .{ entry.name, err });
            allocator.free(bytecode_path);
            allocator.free(calldata_path);
            continue;
        }
        
        if (std.fs.cwd().openFile(calldata_path, .{})) |file| {
            file.close();
        } else |err| {
            print("Warning: Missing calldata file for {s}: {}\n", .{ entry.name, err });
            allocator.free(bytecode_path);
            allocator.free(calldata_path);
            continue;
        }

        try test_cases.append(.{
            .name = entry.name,
            .bytecode_path = bytecode_path,
            .calldata_path = calldata_path,
        });
    }

    return test_cases.toOwnedSlice();
}

fn runBenchmark(allocator: std.mem.Allocator, evm_name: []const u8, test_case: TestCase, num_runs: u32) !void {
    // Read calldata to pass directly
    const calldata_file = try std.fs.cwd().openFile(test_case.calldata_path, .{});
    defer calldata_file.close();
    
    const calldata = try calldata_file.readToEndAlloc(allocator, 1024 * 1024); // 1MB max
    defer allocator.free(calldata);
    
    // Trim whitespace
    const trimmed_calldata = std.mem.trim(u8, calldata, " \t\n\r");
    
    // Build the runner path
    const runner_name = try std.fmt.allocPrint(allocator, "{s}-runner", .{evm_name});
    defer allocator.free(runner_name);
    
    const runner_path = if (std.mem.eql(u8, evm_name, "zig"))
        try allocator.dupe(u8, "zig-out/bin/zig-runner")
    else
        try std.fmt.allocPrint(allocator, "bench/official/evms/{s}/target/release/{s}", .{evm_name, runner_name});
    defer allocator.free(runner_path);
    
    const num_runs_str = try std.fmt.allocPrint(allocator, "{}", .{num_runs});
    defer allocator.free(num_runs_str);
    
    // Build hyperfine command
    const hyperfine_cmd = try std.fmt.allocPrint(
        allocator,
        "{s} --contract-code-path {s} --calldata {s} --num-runs 1",
        .{ runner_path, test_case.bytecode_path, trimmed_calldata }
    );
    defer allocator.free(hyperfine_cmd);

    const result = try std.process.Child.run(.{
        .allocator = allocator,
        .argv = &[_][]const u8{
            "hyperfine",
            "--runs", num_runs_str,
            "--warmup", "3",
            hyperfine_cmd,
        },
    });
    defer allocator.free(result.stdout);
    defer allocator.free(result.stderr);

    print("{s}", .{result.stdout});
    if (result.stderr.len > 0) {
        print("Errors:\n{s}", .{result.stderr});
    }
}