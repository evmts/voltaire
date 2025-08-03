const std = @import("std");
const clap = @import("clap");
const Orchestrator = @import("Orchestrator.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const params = comptime clap.parseParamsComptime(
        \\-h, --help                 Display this help and exit.
        \\-e, --evm <NAME>           EVM implementation to benchmark (default: zig)
        \\-n, --num-runs <NUM>       Number of runs per test case (default: 10)
        \\--js-runs <NUM>            Number of runs for JavaScript/EthereumJS (defaults to --num-runs value)
        \\--internal-runs <NUM>      Number of internal runs per hyperfine execution (default: 50)
        \\--js-internal-runs <NUM>   Number of internal runs for JavaScript (defaults to --internal-runs value)
        \\--export <FORMAT>          Export results (json, markdown)
        \\--compare                  Compare all available EVM implementations
        \\
    );

    const parsers = comptime .{
        .NAME = clap.parsers.string,
        .NUM = clap.parsers.int(u32, 10),
        .FORMAT = clap.parsers.string,
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

    const evm_name = res.args.evm orelse "zig";
    const num_runs = res.args.@"num-runs" orelse 50;
    const js_runs = res.args.@"js-runs" orelse num_runs;
    const internal_runs = res.args.@"internal-runs" orelse 100;
    const js_internal_runs = res.args.@"js-internal-runs" orelse internal_runs;
    const export_format = res.args.@"export";
    const compare_mode = res.args.compare != 0;

    if (compare_mode) {
        // Compare mode: run benchmarks for all available EVMs
        const evms = [_][]const u8{ "zig", "revm", "ethereumjs", "geth", "evmone" };
        
        var all_results = std.ArrayList(Orchestrator.BenchmarkResult).init(allocator);
        defer all_results.deinit();
        
        for (evms) |evm| {
            std.debug.print("\n=== Running benchmarks for {s} ===\n", .{evm});
            
            var orchestrator = try Orchestrator.init(allocator, evm, num_runs, internal_runs, js_runs, js_internal_runs);
            defer orchestrator.deinit();
            
            try orchestrator.discoverTestCases();
            try orchestrator.runBenchmarks();
            
            // Collect results
            for (orchestrator.results.items) |result| {
                try all_results.append(.{
                    .test_case = try std.fmt.allocPrint(allocator, "{s} ({s})", .{ result.test_case, evm }),
                    .mean_ms = result.mean_ms,
                    .min_ms = result.min_ms,
                    .max_ms = result.max_ms,
                    .std_dev_ms = result.std_dev_ms,
                    .median_ms = result.median_ms,
                    .runs = result.runs,
                });
            }
        }
        
        // Export comparison results
        if (export_format) |format| {
            if (std.mem.eql(u8, format, "markdown")) {
                try exportComparisonMarkdown(allocator, all_results.items, num_runs, js_runs);
            }
        }
        
        // Free allocated memory
        for (all_results.items) |result| {
            allocator.free(result.test_case);
        }
    } else {
        // Single EVM mode
        var orchestrator = try Orchestrator.init(allocator, evm_name, num_runs, internal_runs, js_runs, js_internal_runs);
        defer orchestrator.deinit();

        // Discover test cases
        try orchestrator.discoverTestCases();
        
        std.debug.print("Discovered {} test cases\n", .{orchestrator.test_cases.len});

        // Run benchmarks
        try orchestrator.runBenchmarks();

        // Print summary
        orchestrator.printSummary();

        // Export results if requested
        if (export_format) |format| {
            try orchestrator.exportResults(format);
        }
    }
}

fn exportComparisonMarkdown(allocator: std.mem.Allocator, results: []const Orchestrator.BenchmarkResult, num_runs: u32, js_runs: u32) !void {
    // Create the file in bench/official/results.md
    var exe_dir_buf: [std.fs.max_path_bytes]u8 = undefined;
    const exe_path = try std.fs.selfExeDirPath(&exe_dir_buf);
    
    const project_root = try std.fs.path.resolve(allocator, &[_][]const u8{ exe_path, "..", ".." });
    defer allocator.free(project_root);
    
    const results_path = try std.fs.path.join(allocator, &[_][]const u8{ project_root, "bench", "official", "results.md" });
    defer allocator.free(results_path);
    
    const file = try std.fs.createFileAbsolute(results_path, .{});
    defer file.close();
    
    // Get current timestamp
    const timestamp = std.time.timestamp();
    const seconds = @as(u64, @intCast(timestamp));
    
    // Write header
    try file.writer().print("# EVM Benchmark Comparison Results\n\n", .{});
    try file.writer().print("## Summary\n\n", .{});
    if (js_runs != num_runs) {
        try file.writer().print("**Test Runs per Case**: {} (EthereumJS: {})\n", .{num_runs, js_runs});
    } else {
        try file.writer().print("**Test Runs per Case**: {}\n", .{num_runs});
    }
    try file.writer().print("**EVMs Compared**: Guillotine (Zig), REVM (Rust), EthereumJS (JavaScript), Geth (Go), evmone (C++)\n", .{});
    try file.writer().print("**Timestamp**: {} (Unix epoch)\n\n", .{seconds});
    
    // Group results by test case
    try file.writer().print("## Performance Comparison\n\n", .{});
    
    // Write comparison tables for each test case
    const test_cases = [_][]const u8{
        "erc20-approval-transfer",
        "erc20-mint",
        "erc20-transfer",
        "ten-thousand-hashes",
        "snailtracer",
        "opcodes-arithmetic",
        "opcodes-arithmetic-advanced",
        "opcodes-bitwise",
        "opcodes-block-1",
        "opcodes-block-2",
        "opcodes-comparison",
        "opcodes-control",
        "opcodes-crypto",
        "opcodes-data",
        "opcodes-dup",
        "opcodes-environmental-1",
        "opcodes-environmental-2",
        "opcodes-jump-basic",
        "opcodes-memory",
        "opcodes-push-pop",
        "opcodes-storage-cold",
        "opcodes-storage-warm",
        "opcodes-swap",
        "precompile-blake2f",
        "precompile-bn256add",
        "precompile-bn256mul",
        "precompile-bn256pairing",
        "precompile-ecrecover",
        "precompile-identity",
        "precompile-modexp",
        "precompile-ripemd160",
        "precompile-sha256",
    };
    
    for (test_cases) |test_case| {
        try file.writer().print("### {s}\n\n", .{test_case});
        try file.writeAll("| EVM | Mean (ms) | Median (ms) | Min (ms) | Max (ms) | Std Dev (ms) |\n");
        try file.writeAll("|-----|-----------|-------------|----------|----------|-------------|\n");
        
        // Find results for this test case
        for (results) |result| {
            if (std.mem.indexOf(u8, result.test_case, test_case) != null) {
                const evm_name = if (std.mem.indexOf(u8, result.test_case, "(zig)") != null) 
                    "Guillotine" 
                else if (std.mem.indexOf(u8, result.test_case, "(revm)") != null) 
                    "REVM"
                else if (std.mem.indexOf(u8, result.test_case, "(ethereumjs)") != null)
                    "EthereumJS"
                else if (std.mem.indexOf(u8, result.test_case, "(geth)") != null)
                    "Geth"
                else 
                    "evmone";
                try file.writer().print("| {s:<11} | {d:>9.2} | {d:>11.2} | {d:>8.2} | {d:>8.2} | {d:>11.2} |\n", .{
                    evm_name,
                    result.mean_ms,
                    result.median_ms,
                    result.min_ms,
                    result.max_ms,
                    result.std_dev_ms,
                });
            }
        }
        
        try file.writer().print("\n", .{});
    }
    
    // Add summary statistics
    try file.writer().print("## Overall Performance Summary\n\n", .{});
    try file.writeAll("| Test Case | Guillotine (ms) | REVM (ms) | EthereumJS (ms) | Geth (ms) | evmone (ms) |\n");
    try file.writeAll("|-----------|-----------------|-----------|-----------|-----------|-------------|\n");
    
    for (test_cases) |test_case| {
        var zig_mean: f64 = 0;
        var revm_mean: f64 = 0;
        var ethereumjs_mean: f64 = 0;
        var geth_mean: f64 = 0;
        var evmone_mean: f64 = 0;
        
        for (results) |result| {
            if (std.mem.indexOf(u8, result.test_case, test_case) != null) {
                if (std.mem.indexOf(u8, result.test_case, "(zig)") != null) {
                    zig_mean = result.mean_ms;
                } else if (std.mem.indexOf(u8, result.test_case, "(revm)") != null) {
                    revm_mean = result.mean_ms;
                } else if (std.mem.indexOf(u8, result.test_case, "(ethereumjs)") != null) {
                    ethereumjs_mean = result.mean_ms;
                } else if (std.mem.indexOf(u8, result.test_case, "(geth)") != null) {
                    geth_mean = result.mean_ms;
                } else if (std.mem.indexOf(u8, result.test_case, "(evmone)") != null) {
                    evmone_mean = result.mean_ms;
                }
            }
        }
        
        try file.writer().print("| {s:<25} | {d:>15.2} | {d:>9.2} | {d:>9.2} | {d:>9.2} | {d:>11.2} |\n", .{
            test_case,
            zig_mean,
            revm_mean,
            ethereumjs_mean,
            geth_mean,
            evmone_mean,
        });
    }
    
    // Add notes
    try file.writeAll("\n## Notes\n\n");
    try file.writeAll("- All implementations use optimized builds:\n");
    try file.writeAll("  - Zig: ReleaseFast\n");
    try file.writeAll("  - Rust (REVM): --release\n");
    try file.writeAll("  - JavaScript (EthereumJS): Bun runtime\n");
    try file.writeAll("  - Go (geth): -O3 optimizations\n");
    try file.writeAll("  - C++ (evmone): -O3 -march=native\n");
    try file.writeAll("- All times are in milliseconds (ms)\n");
    try file.writeAll("- Lower values indicate better performance\n");
    try file.writeAll("- These benchmarks measure the full execution time including contract deployment\n\n");
    
    try file.writeAll("---\n\n");
    try file.writeAll("*Generated by Guillotine Benchmark Orchestrator*\n");
    
    std.debug.print("Comparison results exported to bench/official/results.md\n", .{});
}

fn printHelp() !void {
    const stdout = std.io.getStdOut().writer();
    try stdout.print(
        \\EVM Benchmark Orchestrator
        \\
        \\This tool orchestrates benchmarks across various EVM implementations using hyperfine.
        \\
        \\Usage: orchestrator [OPTIONS]
        \\
        \\Options:
        \\  -h, --help                 Display this help and exit
        \\  -e, --evm <NAME>           EVM implementation to benchmark (default: zig)
        \\  -n, --num-runs <NUM>       Number of runs per test case (default: 50)
        \\  --js-runs <NUM>            Number of runs for JavaScript/EthereumJS (defaults to --num-runs)
        \\  --internal-runs <NUM>      Number of internal runs per hyperfine execution (default: 100)
        \\  --js-internal-runs <NUM>   Number of internal runs for JavaScript (defaults to --internal-runs)
        \\  --export <FORMAT>          Export results (json, markdown)
        \\
        \\Examples:
        \\  orchestrator                    Run benchmarks with Zig EVM
        \\  orchestrator -e zig -n 50       Run 50 iterations per test case
        \\  orchestrator --export json      Export results to JSON
        \\  orchestrator --export markdown  Export results to Markdown
        \\  orchestrator --compare --export markdown  Compare all EVMs and export
        \\  orchestrator --compare --js-runs 1  Compare EVMs with only 1 run for JavaScript
        \\
    , .{});
}