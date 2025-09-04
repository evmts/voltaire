const std = @import("std");
const clap = @import("clap");
const Runner = @import("Runner.zig");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer {
        const leak = gpa.deinit();
        if (leak == .leak) {
            std.debug.print("Memory leak detected!\n", .{});
        }
    }
    const allocator = gpa.allocator();
    
    // Parse command line arguments using clap
    const params = comptime clap.parseParamsComptime(
        \\-h, --help                          Display help and exit
        \\--contract-code-path <PATH>         Path to contract bytecode file
        \\--calldata <HEX>                    Calldata in hex format
        \\--num-runs <NUM>                    Number of runs (default: 1)
        \\--verbose                           Enable verbose output
        \\--expected-output <HEX>             Expected output in hex format
        \\--min-gas <NUM>                     Minimum expected gas usage
        \\
    );
    
    const parsers = comptime .{
        .PATH = clap.parsers.string,
        .HEX = clap.parsers.string,
        .NUM = clap.parsers.int(u64, 10),
    };
    
    var diag = clap.Diagnostic{};
    var res = clap.parse(clap.Help, &params, parsers, .{
        .diagnostic = &diag,
        .allocator = allocator,
    }) catch |err| {
        const stderr = std.fs.File{ .handle = 2 };
        diag.reportToFile(stderr, err) catch {};
        return err;
    };
    defer res.deinit();
    
    if (res.args.help != 0) {
        try printHelp();
        return;
    }
    
    const contract_code_path = res.args.@"contract-code-path" orelse {
        std.debug.print("Error: --contract-code-path is required\n", .{});
        std.process.exit(1);
    };
    
    const calldata_path = res.args.calldata orelse {
        std.debug.print("Error: --calldata is required\n", .{});
        std.process.exit(1);
    };
    
    const num_runs = res.args.@"num-runs" orelse 1;
    const verbose = res.args.verbose != 0;
    const expected_output_hex = res.args.@"expected-output";
    const min_gas = res.args.@"min-gas";
    
    // Read init bytecode from file
    const init_code_file = try std.fs.cwd().openFile(contract_code_path, .{});
    defer init_code_file.close();
    const init_code_hex = try init_code_file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    defer allocator.free(init_code_hex);
    
    const trimmed_init_hex = std.mem.trim(u8, init_code_hex, " \t\n\r");
    const init_code = try Runner.hexDecode(allocator, trimmed_init_hex);
    defer allocator.free(init_code);
    
    // Read calldata from file
    const calldata_file = try std.fs.cwd().openFile(calldata_path, .{});
    defer calldata_file.close();
    const calldata_hex = try calldata_file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    defer allocator.free(calldata_hex);
    
    // Decode calldata
    const trimmed_calldata = std.mem.trim(u8, calldata_hex, " \t\n\r");
    const calldata = try Runner.hexDecode(allocator, trimmed_calldata);
    defer allocator.free(calldata);
    
    // Decode expected output if provided
    var expected_output: ?[]const u8 = null;
    if (expected_output_hex) |hex| {
        const trimmed = std.mem.trim(u8, hex, " \t\n\r");
        expected_output = try Runner.hexDecode(allocator, trimmed);
    }
    defer if (expected_output) |output| allocator.free(output);
    
    // Initialize runner
    var runner = try Runner.init(allocator, verbose);
    defer runner.deinit();
    
    // Prepare contract (deploy once)
    const prepared_contract = try runner.prepare(init_code);
    
    // Verify contract is ready
    const contract_account = runner.database.get_account(prepared_contract.address.bytes) catch null;
    if (contract_account == null) {
        std.debug.print("❌ Contract not found\n", .{});
        return error.ContractSetupFailed;
    }
    
    // Run benchmarks
    const config = Runner.RunnerConfig{
        .verbose = verbose,
        .min_gas = min_gas,
        .expected_output = expected_output,
    };
    
    for (0..num_runs) |run_idx| {
        const result = runner.runBenchmark(prepared_contract.address, calldata, config) catch |err| {
            if (err == Runner.RunnerError.ExecutionFailed) {
                std.debug.print("❌ Execution failed\n", .{});
                std.process.exit(2);
            } else if (err == Runner.RunnerError.OutputMismatch) {
                std.debug.print("❌ Output mismatch\n", .{});
                std.process.exit(2);
            } else if (err == Runner.RunnerError.GasTooLow) {
                std.debug.print("❌ Gas too low\n", .{});
                std.process.exit(2);
            }
            return err;
        };
        
        // Output timing in milliseconds (one per line as expected by orchestrator)
        std.debug.print("{d:.6}\n", .{result.duration_ms});
        
        if (verbose) {
            std.debug.print("Run {}: {d:.6}ms, gas_used={}\n", .{ 
                run_idx + 1, 
                result.duration_ms, 
                result.gas_used 
            });
        }
    }
    
    // Explicitly exit to avoid any cleanup issues
    std.process.exit(0);
}

fn printHelp() !void {
    const stdout_file = std.fs.File{ .handle = 1 };
    var stdout_buffer: [4096]u8 = undefined;
    var writer = stdout_file.writer(&stdout_buffer);
    try writer.interface.print(
        \\EVM Benchmark Runner
        \\
        \\Usage: evm-runner --contract-code-path <path> --calldata <hex> [OPTIONS]
        \\
        \\Required Arguments:
        \\  --contract-code-path <PATH>  Path to contract bytecode file
        \\  --calldata <HEX>            Calldata in hex format
        \\
        \\Options:
        \\  -h, --help                  Display this help and exit
        \\  --num-runs <NUM>           Number of runs (default: 1)
        \\  --verbose                  Enable verbose output
        \\  --expected-output <HEX>    Expected output in hex format
        \\  --min-gas <NUM>           Minimum expected gas usage
        \\
        \\Examples:
        \\  evm-runner --contract-code-path bytecode.txt --calldata 0x123456
        \\  evm-runner --contract-code-path test.bin --calldata 0xabcdef --num-runs 10 --verbose
        \\
    , .{});
    try writer.interface.flush();
}