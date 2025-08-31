const std = @import("std");
const evm = @import("evm");
const FixtureRunner = evm.FixtureRunner;

pub const std_options: std.Options = .{
    .log_level = .err,
};

fn hex_decode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const trimmed = std.mem.trim(u8, clean_hex, &std.ascii.whitespace);
    if (trimmed.len == 0) return allocator.alloc(u8, 0);
    
    const result = try allocator.alloc(u8, trimmed.len / 2);
    var i: usize = 0;
    while (i < trimmed.len) : (i += 2) {
        const byte_str = trimmed[i .. i + 2];
        result[i / 2] = std.fmt.parseInt(u8, byte_str, 16) catch {
            return error.InvalidHexCharacter;
        };
    }
    return result;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer {
        const leak = gpa.deinit();
        if (leak == .leak) {
            std.debug.print("Memory leak detected!\n", .{});
        }
    }
    const allocator = gpa.allocator();

    // Parse command line arguments
    const args = try std.process.argsAlloc(allocator);
    defer std.process.argsFree(allocator, args);

    if (args.len < 5) {
        std.debug.print("Usage: {s} --contract-code-path <path> --calldata <hex> [OPTIONS]\n", .{args[0]});
        std.debug.print("Options:\n", .{});
        std.debug.print("  --num-runs <n>           Number of runs (default: 1)\n", .{});
        std.debug.print("  --verbose                Enable verbose output\n", .{});
        std.process.exit(1);
    }

    var contract_code_path: ?[]const u8 = null;
    var calldata_hex: ?[]const u8 = null;
    var num_runs: u32 = 1;
    var verbose: bool = false;

    var i: usize = 1;
    while (i < args.len) : (i += 1) {
        if (std.mem.eql(u8, args[i], "--contract-code-path")) {
            if (i + 1 >= args.len) {
                std.debug.print("Error: --contract-code-path requires a value\n", .{});
                std.process.exit(1);
            }
            contract_code_path = args[i + 1];
            i += 1;
        } else if (std.mem.eql(u8, args[i], "--calldata")) {
            if (i + 1 >= args.len) {
                std.debug.print("Error: --calldata requires a value\n", .{});
                std.process.exit(1);
            }
            calldata_hex = args[i + 1];
            i += 1;
        } else if (std.mem.eql(u8, args[i], "--num-runs")) {
            if (i + 1 >= args.len) {
                std.debug.print("Error: --num-runs requires a value\n", .{});
                std.process.exit(1);
            }
            num_runs = std.fmt.parseInt(u32, args[i + 1], 10) catch {
                std.debug.print("Error: --num-runs must be a number\n", .{});
                std.process.exit(1);
            };
            i += 1;
        } else if (std.mem.eql(u8, args[i], "--verbose")) {
            verbose = true;
        } else if (std.mem.eql(u8, args[i], "--validate-correctness") or 
                   std.mem.eql(u8, args[i], "--expected-gas") or
                   std.mem.eql(u8, args[i], "--expected-output") or
                   std.mem.eql(u8, args[i], "--min-gas")) {
            // Skip these for now, they're not used with FixtureRunner
            if (std.mem.eql(u8, args[i], "--expected-gas") or 
                std.mem.eql(u8, args[i], "--expected-output") or
                std.mem.eql(u8, args[i], "--min-gas")) {
                i += 1; // Skip the value
            }
        } else {
            std.debug.print("Error: Unknown argument {s}\n", .{args[i]});
            std.process.exit(1);
        }
    }

    if (contract_code_path == null or calldata_hex == null) {
        std.debug.print("Error: --contract-code-path and --calldata are required\n", .{});
        std.process.exit(1);
    }

    // Read init bytecode from file
    const init_code_file = try std.fs.cwd().openFile(contract_code_path.?, .{});
    defer init_code_file.close();
    const init_code_hex = try init_code_file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    defer allocator.free(init_code_hex);
    const trimmed_init_hex = std.mem.trim(u8, init_code_hex, " \t\n\r");
    const init_code = try hex_decode(allocator, trimmed_init_hex);
    defer allocator.free(init_code);

    // Decode calldata
    const trimmed_calldata = std.mem.trim(u8, calldata_hex.?, " \t\n\r");
    const calldata = try hex_decode(allocator, trimmed_calldata);
    defer allocator.free(calldata);

    // Run benchmarks - create fresh FixtureRunner for each run to ensure consistent state
    for (0..num_runs) |_| {
        var runner = FixtureRunner.init(allocator) catch |err| {
            std.debug.print("Failed to init FixtureRunner: {}\n", .{err});
            @panic("FixtureRunner init failed");
        };
        defer runner.deinit();

        const result = runner.runFixture(init_code, calldata, verbose) catch |err| {
            std.debug.print("❌ Fixture execution failed: {}\n", .{err});
            switch (err) {
                error.NoCodeAtTarget => {
                    std.debug.print("  No code found at target address\n", .{});
                    std.debug.print("  This indicates deployment failed or contract was not properly installed\n", .{});
                },
                error.ExecutionFailed => {
                    std.debug.print("  EVM execution failed\n", .{});
                },
                error.UnrealisticGasUsage => {
                    std.debug.print("  Unrealistic gas usage detected\n", .{});
                },
                error.InsufficientGasUsage => {
                    std.debug.print("  Operation didn't consume expected gas\n", .{});
                },
                error.InvalidReturnLength => {
                    std.debug.print("  ERC20 operation returned wrong output length\n", .{});
                },
                error.OperationReturnedFalse => {
                    std.debug.print("  ERC20 operation did not return true\n", .{});
                },
                error.NoReturnData => {
                    std.debug.print("  Benchmark returned no data\n", .{});
                },
                else => {},
            }
            @panic("Benchmark execution failed");
        };

        if (verbose) {
            std.debug.print("✓ Execution succeeded, gas_used={}\n", .{result.gas_used});
        }
    }

    // Explicitly exit to avoid any cleanup issues
    std.process.exit(0);
}
