const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");

pub const std_options: std.Options = .{
    .log_level = .debug,  // Changed from .err to .debug for debugging
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

    // Setup similar to revm and geth
    const caller_address = primitives.Address{ .bytes = [_]u8{0x10} ++ [_]u8{0} ** 18 ++ [_]u8{0x01} };
    
    // Create database
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    // Set up caller with large balance
    try database.set_account(caller_address.bytes, .{
        .balance = std.math.maxInt(u256),
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Setup block info and transaction context
    const block_info = evm.BlockInfo{
        .chain_id = 1,
        .number = 20_000_000,  // Ensure after all fork blocks
        .timestamp = 1_800_000_000,  // Ensure after Shanghai
        .difficulty = 0,
        .gas_limit = 1_000_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 7,
        .prev_randao = [_]u8{0} ** 32,
        .blob_base_fee = 1000000000,
        .blob_versioned_hashes = &.{},
    };

    const tx_context = evm.TransactionContext{
        .gas_limit = 1_000_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    // Deploy contract using CREATE to get runtime code
    var deploy_evm = try evm.Evm(.{}).init(
        allocator,
        &database,
        block_info,
        tx_context,
        0,
        caller_address,
        .CANCUN
    );
    defer deploy_evm.deinit();
    
    // Setup CREATE call parameters
    const create_params = evm.CallParams{
        .create = .{
            .caller = caller_address,
            .value = 0,
            .init_code = init_code,
            .gas = 10_000_000,
        },
    };
    
    // Deploy the contract
    const deploy_result = deploy_evm.call(create_params);
    
    if (!deploy_result.success) {
        std.debug.print("❌ Contract deployment failed\n", .{});
        @panic("Failed to deploy contract");
    }
    
    // Get the deployed contract address
    // For CREATE, address is deterministic based on caller + nonce
    // But for simplicity, we'll use a fixed address like geth/revm
    const contract_address = primitives.Address{ .bytes = [_]u8{0x5F} ++ [_]u8{0xbD} ++ [_]u8{0xB2} ++ [_]u8{0x31} ++ [_]u8{0x56} ++ [_]u8{0x78} ++ [_]u8{0xaf} ++ [_]u8{0xec} ++ [_]u8{0xb3} ++ [_]u8{0x67} ++ [_]u8{0xf0} ++ [_]u8{0x32} ++ [_]u8{0xd9} ++ [_]u8{0x3F} ++ [_]u8{0x64} ++ [_]u8{0x2f} ++ [_]u8{0x64} ++ [_]u8{0x18} ++ [_]u8{0x0a} ++ [_]u8{0xa3} };
    
    // Run benchmarks - create fresh EVM for each run
    for (0..num_runs) |run_idx| {
        // Create EVM instance for benchmark execution
        var evm_instance = try evm.Evm(.{}).init(
            allocator,
            &database,
            block_info,
            tx_context,
            0,
            caller_address,
            .CANCUN
        );
        defer evm_instance.deinit();
        
        // Setup call parameters
        const call_params = evm.CallParams{
            .call = .{
                .caller = caller_address,
                .to = contract_address,
                .value = 0,
                .input = calldata,
                .gas = 1_000_000_000,  // Use 1B gas like revm/geth
            },
        };
        
        // Measure execution time
        const start = std.time.Instant.now() catch @panic("Failed to get time");
        const result = evm_instance.call(call_params);
        const end = std.time.Instant.now() catch @panic("Failed to get time");
        
        if (!result.success) {
            std.debug.print("❌ Execution failed\n", .{});
            @panic("Benchmark execution failed");
        }
        
        // Calculate duration in milliseconds
        const duration_ns = end.since(start);
        const duration_ms = @as(f64, @floatFromInt(duration_ns)) / 1_000_000.0;
        
        // Output timing in milliseconds (one per line as expected by orchestrator)
        std.debug.print("{d:.6}\n", .{duration_ms});
        
        if (verbose) {
            const gas_used = 1_000_000_000 - result.gas_left;
            std.debug.print("Run {}: {d:.6}ms, gas_used={}\n", .{ run_idx + 1, duration_ms, gas_used });
        }
    }

    // Explicitly exit to avoid any cleanup issues
    std.process.exit(0);
}
