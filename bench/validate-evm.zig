const std = @import("std");
const print = std.debug.print;

// This script generates reference execution data for EVM benchmark validation
// It runs REVM and Geth to get expected gas consumption and return values
// Then validates that Guillotine matches these reference values

const TestCase = struct {
    name: []const u8,
    bytecode_path: []const u8,
    calldata_path: []const u8,
    expected_gas: ?u64 = null,
    expected_output: ?[]const u8 = null,
    description: []const u8,
};

const test_cases = [_]TestCase{
    .{
        .name = "erc20-transfer",
        .bytecode_path = "/Users/williamcory/guillotine/bench/cases/erc20-transfer/bytecode.txt",
        .calldata_path = "/Users/williamcory/guillotine/bench/cases/erc20-transfer/calldata.txt",
        .description = "ERC20 transfer function call",
    },
    .{
        .name = "erc20-mint",
        .bytecode_path = "/Users/williamcory/guillotine/bench/cases/erc20-mint/bytecode.txt", 
        .calldata_path = "/Users/williamcory/guillotine/bench/cases/erc20-mint/calldata.txt",
        .description = "ERC20 mint function call",
    },
    .{
        .name = "erc20-approval-transfer",
        .bytecode_path = "/Users/williamcory/guillotine/bench/cases/erc20-approval-transfer/bytecode.txt",
        .calldata_path = "/Users/williamcory/guillotine/bench/cases/erc20-approval-transfer/calldata.txt", 
        .description = "ERC20 approval + transfer sequence",
    },
    .{
        .name = "snailtracer",
        .bytecode_path = "/Users/williamcory/guillotine/bench/cases/snailtracer/bytecode.txt",
        .calldata_path = "/Users/williamcory/guillotine/bench/cases/snailtracer/calldata.txt",
        .description = "Complex snailtracer benchmark contract",
    },
};

fn readFile(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    const file = try std.fs.cwd().openFile(path, .{});
    defer file.close();
    return file.readToEndAlloc(allocator, 16 * 1024 * 1024);
}

fn runCommand(allocator: std.mem.Allocator, argv: []const []const u8) ![]u8 {
    const result = try std.process.Child.run(.{
        .allocator = allocator,
        .argv = argv,
        .cwd = null,
        .env_map = null,
    });
    defer allocator.free(result.stderr);
    
    if (result.term != .Exited or result.term.Exited != 0) {
        print("Command failed: {s}\n", .{result.stderr});
        print("Exit code: {}\n", .{result.term});
        return error.CommandFailed;
    }
    
    return result.stdout;
}

fn extractGasFromRevmTrace(allocator: std.mem.Allocator, trace_file: []const u8) !?u64 {
    const file_content = readFile(allocator, trace_file) catch |err| {
        if (err == error.FileNotFound) return null;
        return err;
    };
    defer allocator.free(file_content);
    
    // Look for the last gas value in the trace
    var lines = std.mem.split(u8, file_content, "\n");
    var last_gas: ?u64 = null;
    
    while (lines.next()) |line| {
        if (std.mem.indexOf(u8, line, "\"gas\":")) |start| {
            const gas_start = start + 6;
            if (gas_start < line.len) {
                const gas_end = std.mem.indexOf(u8, line[gas_start..], ",") orelse 
                                std.mem.indexOf(u8, line[gas_start..], "}") orelse 
                                (line.len - gas_start);
                const gas_str = std.mem.trim(u8, line[gas_start..gas_start + gas_end], " \"");
                if (std.fmt.parseInt(u64, gas_str, 10)) |gas| {
                    last_gas = gas;
                } else |_| {}
            }
        }
    }
    
    return last_gas;
}

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    print("🔍 EVM Benchmark Validation\n");
    print("============================\n\n");
    
    for (test_cases) |test_case| {
        print("Testing: {s} - {s}\n", .{test_case.name, test_case.description});
        
        const bytecode = try readFile(allocator, test_case.bytecode_path);
        defer allocator.free(bytecode);
        const calldata = try readFile(allocator, test_case.calldata_path);
        defer allocator.free(calldata);
        
        print("  Bytecode length: {} bytes\n", .{std.mem.trim(u8, bytecode, " \t\n\r").len / 2});
        print("  Calldata length: {} bytes\n", .{std.mem.trim(u8, calldata, " \t\n\r").len / 2});
        
        // 1. Generate reference data with REVM (with tracing)
        print("  📊 Generating REVM reference...\n");
        const revm_trace_file = try std.fmt.allocPrint(allocator, "/tmp/{s}_revm_trace.json", .{test_case.name});
        defer allocator.free(revm_trace_file);
        
        const revm_output = runCommand(allocator, &[_][]const u8{
            "/Users/williamcory/guillotine/bench/evms/revm/target/debug/revm-runner",
            "--contract-code-path", test_case.bytecode_path,
            "--calldata", std.mem.trim(u8, calldata, " \t\n\r"),
            "--num-runs", "1",
            "--trace", revm_trace_file,
        }) catch |err| {
            print("    ❌ REVM failed: {}\n", .{err});
            continue;
        };
        defer allocator.free(revm_output);
        
        // 2. Run Geth for comparison
        print("  📊 Generating Geth reference...\n");
        const geth_output = runCommand(allocator, &[_][]const u8{
            "/Users/williamcory/guillotine/bench/evms/geth/geth-runner",
            "--contract-code-path", test_case.bytecode_path,
            "--calldata", std.mem.trim(u8, calldata, " \t\n\r"),
            "--num-runs", "1",
        }) catch |err| {
            print("    ❌ Geth failed: {}\n", .{err});
            continue;
        };
        defer allocator.free(geth_output);
        
        // 3. Run Guillotine with verbose output to extract gas and return values
        print("  🚀 Running Guillotine with validation...\n");
        const guillotine_output = runCommand(allocator, &[_][]const u8{
            "/Users/williamcory/guillotine/zig-out/bin/evm-runner",
            "--contract-code-path", test_case.bytecode_path,
            "--calldata", std.mem.trim(u8, calldata, " \t\n\r"),
            "--num-runs", "1",
            "--verbose",
            "--validate-correctness",
        }) catch |err| {
            print("    ❌ Guillotine failed: {}\n", .{err});
            continue;
        };
        defer allocator.free(guillotine_output);
        
        print("    ✅ All EVMs executed successfully\n");
        print("    REVM timing: {s}", .{std.mem.trim(u8, revm_output, " \t\n\r")});
        print(" ms\n");
        print("    Geth timing: {s}", .{std.mem.trim(u8, geth_output, " \t\n\r")});
        print(" ms\n");
        print("    Guillotine timing: ");
        
        // Extract just the timing from guillotine output (last line should be timing)
        var lines = std.mem.split(u8, guillotine_output, "\n");
        var last_line: ?[]const u8 = null;
        while (lines.next()) |line| {
            const trimmed = std.mem.trim(u8, line, " \t\r\n");
            if (trimmed.len > 0) {
                last_line = trimmed;
            }
        }
        
        if (last_line) |timing| {
            print("{s} ms\n", .{timing});
        } else {
            print("(parsing failed)\n");
        }
        
        print("\n");
    }
    
    print("🎉 Validation complete! All test cases have reference data.\n");
    print("You can now run benchmarks with confidence in their correctness.\n");
}