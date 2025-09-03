const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");
// Tracer removed for benchmark accuracy and minimal overhead

fn hex_decode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const trimmed = std.mem.trim(u8, clean_hex, &std.ascii.whitespace);
    if (trimmed.len == 0) return allocator.alloc(u8, 0);

    const result = try allocator.alloc(u8, trimmed.len / 2);
    var i: usize = 0;
    while (i < trimmed.len) : (i += 2) {
        const byte_str = trimmed[i .. i + 2];
        result[i / 2] = std.fmt.parseInt(u8, byte_str, 16) catch {
            std.debug.print("Failed to parse hex at position {}: '{s}'\n", .{ i, byte_str });
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
    var expected_output_hex: ?[]const u8 = null;
    var min_gas_opt: ?u64 = null;

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
        } else if (std.mem.eql(u8, args[i], "--expected-output")) {
            if (i + 1 >= args.len) {
                std.debug.print("Error: --expected-output requires a hex value\n", .{});
                std.process.exit(1);
            }
            expected_output_hex = args[i + 1];
            i += 1;
        } else if (std.mem.eql(u8, args[i], "--min-gas")) {
            if (i + 1 >= args.len) {
                std.debug.print("Error: --min-gas requires a number\n", .{});
                std.process.exit(1);
            }
            min_gas_opt = std.fmt.parseInt(u64, args[i + 1], 10) catch {
                std.debug.print("Error: --min-gas must be a number\n", .{});
                std.process.exit(1);
            };
            i += 1;
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
        .number = 20_000_000, // Ensure after all fork blocks
        .timestamp = 1_800_000_000, // Ensure after Shanghai
        .difficulty = 0,
        .gas_limit = 2_100_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 7,
        .prev_randao = [_]u8{0} ** 32,
        .blob_base_fee = 1000000000,
        .blob_versioned_hashes = &.{},
    };

    const tx_context = evm.TransactionContext{
        .gas_limit = 2_100_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };

    // Prefer CREATE deployment to extract true runtime code; fallback to direct install if it fails
    var contract_address: primitives.Address = undefined;
    var runtime_code: []const u8 = undefined;

    if (verbose) {
        std.debug.print("Bytecode len={} (attempting CREATE first)\n", .{init_code.len});
    }

    var did_deploy: bool = false;
    {
        var deploy_evm = try evm.Evm(.{}).init(allocator, &database, block_info, tx_context, 0, caller_address, .CANCUN);
        defer deploy_evm.deinit();
        const create_params = evm.CallParams{ .create = .{ .caller = caller_address, .value = 0, .init_code = init_code, .gas = 500_000_000 } };
        const deploy_result = deploy_evm.call(create_params);
        if (verbose) {
            std.debug.print("CREATE result: success={}, output_len={}, gas_left={}\n", .{ deploy_result.success, deploy_result.output.len, deploy_result.gas_left });
        }
        if (deploy_result.success) {
            // For CREATE, we need to get the code from the created contract, not from output
            contract_address = primitives.Address.get_contract_address(caller_address, 0);
            const created_account = database.get_account(contract_address.bytes) catch null;
            if (created_account) |acc| {
                const code = database.get_code(acc.code_hash) catch null;
                if (code) |c| {
                    if (c.len > 0) {
                        did_deploy = true;
                        runtime_code = c;
                        if (verbose) {
                            std.debug.print("Found deployed contract code: len={}\n", .{c.len});
                        }
                    }
                }
            }
        }
    }

    if (!did_deploy) {
        // Fallback: treat provided code as runtime and install directly
        if (verbose) std.debug.print("CREATE failed or returned no code; installing as runtime\n", .{});
        contract_address = primitives.Address{ .bytes = [_]u8{0x42} ++ [_]u8{0} ** 19 };
        runtime_code = init_code;
        const code_hash = try database.set_code(runtime_code);
        try database.set_account(contract_address.bytes, .{ .balance = 0, .nonce = 1, .code_hash = code_hash, .storage_root = [_]u8{0} ** 32 });
    }

    // Verify contract is ready
    const contract_account = database.get_account(contract_address.bytes) catch null;
    if (contract_account == null) {
        std.debug.print("❌ Contract not found\n", .{});
        @panic("Contract setup failed");
    }

    // Run benchmarks - create fresh EVM for each run
    for (0..num_runs) |run_idx| {
        // Create EVM instance for benchmark execution with tracing
        var evm_instance = try evm.Evm(.{}).init(allocator, &database, block_info, tx_context, 0, caller_address, .CANCUN);
        defer evm_instance.deinit();

        // Setup call parameters
        const provided_gas: u64 = 1_000_000_000;
        const call_params = evm.CallParams{
            .call = .{
                .caller = caller_address,
                .to = contract_address,
                .value = 0,
                .input = calldata,
                .gas = provided_gas, // High gas to avoid OOG in heavy cases
            },
        };

        // Measure execution time
        const start = std.time.Instant.now() catch @panic("Failed to get time");
        const result = evm_instance.call(call_params);
        const end = std.time.Instant.now() catch @panic("Failed to get time");

        if (!result.success) {
            std.debug.print("❌ Execution failed: gas_left={}, output_len={}\n", .{ result.gas_left, result.output.len });
            if (result.error_info) |err_info| {
                std.debug.print("Error info: {s}\n", .{err_info});
            }
            if (result.output.len > 0) {
                std.debug.print("Output: {x}\n", .{result.output});
            }
            @panic("Benchmark execution failed");
        }

        // Calculate duration in milliseconds
        const duration_ns = end.since(start);
        const duration_ms = @as(f64, @floatFromInt(duration_ns)) / 1_000_000.0;

        // Gas and correctness guards
        const gas_used: u64 = if (result.gas_left <= provided_gas) (provided_gas - result.gas_left) else 0;
        var min_expected_gas: u64 = 0;
        if (calldata.len >= 4) {
            const selector: u32 = (@as(u32, calldata[0]) << 24) | (@as(u32, calldata[1]) << 16) | (@as(u32, calldata[2]) << 8) | @as(u32, calldata[3]);
            min_expected_gas = switch (selector) {
                0xa9059cbb => 50_000, // transfer
                0x095ea7b3 => 45_000, // approve
                0x40c10f19 => 55_000, // mint
                0x30627b7c => 100_000, // snailtracer
                else => 21_000,
            };
            if (expected_output_hex == null and (selector == 0xa9059cbb or selector == 0x095ea7b3 or selector == 0x40c10f19)) {
                if (result.output.len != 32) {
                    std.debug.print("❌ Invalid return length: {} (expected 32)\n", .{result.output.len});
                    std.process.exit(2);
                }
                var is_true = true;
                var idx: usize = 0;
                while (idx < 31) : (idx += 1) {
                    if (result.output[idx] != 0) is_true = false;
                }
                if (result.output[31] != 1) is_true = false;
                if (!is_true) {
                    std.debug.print("❌ Boolean result was false\n", .{});
                    std.process.exit(2);
                }
            }
            // Snailtracer doesn't need to return output, just needs to consume gas
        }
        if (min_gas_opt) |eg| {
            if (gas_used < eg) {
                std.debug.print("❌ Gas too low: used={}, expected_at_least={}\n", .{ gas_used, eg });
                std.process.exit(2);
            }
        } else {
            if (gas_used < min_expected_gas) {
                std.debug.print("❌ Gas too low: used={}, min_expected={}\n", .{ gas_used, min_expected_gas });
                std.process.exit(2);
            }
        }

        if (expected_output_hex) |hex_out| {
            const exp_trim = std.mem.trim(u8, hex_out, " \t\n\r");
            const exp_bytes = hex_decode(allocator, exp_trim) catch {
                std.debug.print("❌ Failed to parse --expected-output\n", .{});
                std.process.exit(2);
                @panic("unreachable");
            };
            defer allocator.free(exp_bytes);
            if (!std.mem.eql(u8, exp_bytes, result.output)) {
                std.debug.print("❌ Output mismatch: got {} bytes, expected {} bytes\n", .{ result.output.len, exp_bytes.len });
                std.process.exit(2);
            }
        }

        // Output timing in milliseconds (one per line as expected by orchestrator)
        std.debug.print("{d:.6}\n", .{duration_ms});

        // Tracer disabled: no JSON-RPC trace emitted to avoid overhead

        if (verbose) {
            std.debug.print("Run {}: {d:.6}ms, gas_used={}\n", .{ run_idx + 1, duration_ms, gas_used });
        }
    }

    // Explicitly exit to avoid any cleanup issues
    std.process.exit(0);
}
