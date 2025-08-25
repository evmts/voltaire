const std = @import("std");
const print = std.debug.print;
const evm = @import("evm");
const primitives = @import("primitives");
const Address = primitives.Address.Address;

pub const std_options: std.Options = .{
    .log_level = .err,
};

fn hex_decode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    var i: usize = 0;
    while (i < clean_hex.len) : (i += 2) {
        const byte_str = clean_hex[i .. i + 2];
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
        std.debug.print("Usage: {s} --contract-code-path <path> --calldata <hex> [--num-runs <n>]\n", .{args[0]});
        std.process.exit(1);
    }

    var contract_code_path: ?[]const u8 = null;
    var calldata_hex: ?[]const u8 = null;
    var num_runs: u32 = 1;
    var min_gas: u64 = 0;
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
        } else if (std.mem.eql(u8, args[i], "--min-gas")) {
            if (i + 1 >= args.len) {
                std.debug.print("Error: --min-gas requires a value\n", .{});
                std.process.exit(1);
            }
            min_gas = std.fmt.parseInt(u64, args[i + 1], 10) catch {
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

    // Set up EVM infrastructure
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = evm.DatabaseInterface.init(&memory_db);

    const block_info = evm.BlockInfo{
        .number = 1,
        .timestamp = 1000,
        .difficulty = 100,
        .gas_limit = 30000000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 1000000000,
        .prev_randao = [_]u8{0} ** 32,
    };

    const context = evm.TransactionContext{
        .gas_limit = 30000000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };

    var evm_instance = try evm.DefaultEvm.init(allocator, db_interface, block_info, context, 0, primitives.ZERO_ADDRESS, .CANCUN);
    defer evm_instance.deinit();

    // We attempt to deploy via CREATE first. If the provided bytecode is actually
    // runtime (not init) and CREATE produces empty runtime code, we fall back to
    // directly installing it as runtime code.
    // deploy_address is determined per-run depending on CREATE success

    // Run benchmarks - create fresh EVM instance for each run to ensure consistent state
    for (0..num_runs) |run_idx| {
        // Create fresh EVM instance for each run to avoid state corruption
        var fresh_memory_db = evm.MemoryDatabase.init(allocator);
        defer fresh_memory_db.deinit();
        const fresh_db_interface = evm.DatabaseInterface.init(&fresh_memory_db);

        var fresh_evm = try evm.DefaultEvm.init(allocator, fresh_db_interface, block_info, context, 0, primitives.ZERO_ADDRESS, .CANCUN);
        defer fresh_evm.deinit();

        // 1) Try CREATE deployment path with provided bytecode as init code
        var target_address: Address = [_]u8{0} ** 20;
        var use_direct_install = false;
        {
            const create_params = evm.DefaultEvm.CallParams{
                .create = .{
                    .caller = primitives.ZERO_ADDRESS,
                    .value = 0,
                    .init_code = init_code,
                    .gas = 10_000_000,
                },
            };

            const maybe_create_result: ?evm.CallResult = blk: {
                const r = fresh_evm.call(create_params) catch |err| {
                    if (verbose) std.debug.print("CREATE failed with error: {}. Falling back to direct install.\n", .{err});
                    break :blk null;
                };
                break :blk r;
            };

            if (maybe_create_result) |create_result| {
                if (!create_result.success) {
                    if (verbose) std.debug.print("CREATE failed: success=false, gas_left={}, output_len={}\n", 
                        .{create_result.gas_left, create_result.output.len});
                    use_direct_install = true;
                } else if (create_result.output.len == 0) {
                    // CREATE succeeded but returned no address - this is expected for init code
                    // The address should be calculated deterministically
                    const nonce: u64 = 0;
                    target_address = try primitives.Address.calculate_create_address(allocator, primitives.ZERO_ADDRESS, nonce);
                    const deployed_code = fresh_evm.get_code(target_address);
                    if (deployed_code.len == 0) {
                        if (verbose) std.debug.print("CREATE succeeded but no code at computed address {x}\n", 
                            .{target_address});
                        use_direct_install = true;
                    } else {
                        if (verbose) std.debug.print("CREATE deployed contract at {x} with code_len={}\n",
                            .{target_address, deployed_code.len});
                    }
                } else if (create_result.output.len == 20) {
                    // Old-style CREATE that returns address
                    @memcpy(&target_address, create_result.output[0..20]);
                    const deployed_code = fresh_evm.get_code(target_address);
                    if (deployed_code.len == 0) {
                        if (verbose) std.debug.print("CREATE returned address but no code found\n", .{});
                        use_direct_install = true;
                    }
                } else {
                    if (verbose) std.debug.print("CREATE returned unexpected output length: {}\n", .{create_result.output.len});
                    use_direct_install = true;
                }
            } else {
                use_direct_install = true;
            }
        }

        if (use_direct_install) {
            // Directly install provided bytecode as runtime
            const fresh_code_hash = try fresh_memory_db.set_code(init_code);
            // Choose a fixed address for direct install
            // Use a non-precompile address (avoid 0x01..0x0a)
            target_address = [_]u8{0} ** 19 ++ [_]u8{0x11};
            try fresh_memory_db.set_account(target_address, evm.Account{
                .nonce = 0,
                .balance = 0,
                .code_hash = fresh_code_hash,
                .storage_root = [_]u8{0} ** 32,
            });
            if (verbose) std.debug.print("Direct install at address: {x}, code_len={}, code_hash={x}\n",
                .{ target_address, init_code.len, fresh_code_hash });
        }

        // 2) Invoke the contract runtime via CALL
        const call_params = evm.DefaultEvm.CallParams{
            .call = .{
                .caller = primitives.ZERO_ADDRESS,
                .to = target_address,
                .value = 0,
                .input = calldata,
                .gas = 10_000_000,
            },
        };

        const start_time = std.time.nanoTimestamp();
        const result = fresh_evm.call(call_params) catch |err| {
            std.debug.print("EVM execution error: {}\n", .{err});
            std.process.exit(1);
        };
        const end_time = std.time.nanoTimestamp();
        
        // Debug: Print gas usage info
        if (verbose and run_idx == 0) {
            const gas_provided = 10000000;
            const gas_used = gas_provided - result.gas_left;
            std.debug.print("success={}, gas_provided={}, gas_left={}, gas_used={}, output_len={}\n", 
                .{result.success, gas_provided, result.gas_left, gas_used, result.output.len});
            if (result.output.len > 0 and result.output.len <= 64) {
                std.debug.print("output={x}\n", .{result.output});
            }
            std.debug.print("calldata={x}\n", .{calldata});
        }

        // Optional validation: enforce minimum gas consumption to catch trivial runs
        if (min_gas > 0) {
            const gas_provided: u64 = 10_000_000;
            const gas_used: u64 = gas_provided - result.gas_left;
            if (gas_used < min_gas) {
                std.debug.print("Error: gas_used={} < min_gas={} (likely trivial execution)\n", .{ gas_used, min_gas });
                std.process.exit(2);
            }
        }

        // Do not free result.output here. Ownership is managed by the EVM.
        // Freeing it caused an invalid free/double free under the debug allocator
        // and crashes during hyperfine warmup.
        
        if (!result.success) {
            std.debug.print("Contract execution failed\n", .{});
            std.process.exit(1);
        }
        
        const elapsed_ns = @as(u64, @intCast(end_time - start_time));
        const elapsed_ms = @as(f64, @floatFromInt(elapsed_ns)) / 1_000_000.0;
        print("{d:.6}\n", .{elapsed_ms});
    }
    
    // Explicitly exit to avoid any cleanup issues
    std.process.exit(0);
}
