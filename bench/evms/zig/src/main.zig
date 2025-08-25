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

    // Deploy contract using CREATE by executing init code
    const deploy_params = evm.DefaultEvm.CallParams{ .create = .{
        .caller = primitives.ZERO_ADDRESS,
        .value = 0,
        .init_code = init_code,
        .gas = 10_000_000,
    }};
    var used_create: bool = false;
    var deploy_address: Address = undefined;
    const deploy_result = evm_instance.call(deploy_params) catch |err| blk: {
        if (verbose) std.debug.print("EVM create error (will fallback to direct install): {}\n", .{err});
        break :blk evm.CallResult.failure(0);
    };
    if (deploy_result.success and deploy_result.output.len >= 20) {
        @memcpy(&deploy_address, deploy_result.output[0..20]);
        used_create = true;
        if (verbose) std.debug.print("Deployed contract at address: {x}, code_len={}\n", 
            .{std.fmt.fmtSliceHexLower(&deploy_address), init_code.len});
    } else {
        // Fallback: treat provided code as runtime and install directly
        deploy_address = [_]u8{0} ** 19 ++ [_]u8{1};
        const code_hash = try memory_db.set_code(init_code);
        try memory_db.set_account(deploy_address, evm.Account{
            .nonce = 0,
            .balance = 0,
            .code_hash = code_hash,
            .storage_root = [_]u8{0} ** 32,
        });
        if (verbose) std.debug.print("Fallback install at address: {x}, code_len={}, code_hash={x}\n", 
            .{ std.fmt.fmtSliceHexLower(&deploy_address), init_code.len, std.fmt.fmtSliceHexLower(&code_hash) });
    }

    // Run benchmarks
    for (0..num_runs) |run_idx| {
        const call_params = evm.DefaultEvm.CallParams{
            .call = .{
                .caller = primitives.ZERO_ADDRESS,
                .to = deploy_address,
                .value = 0,
                .input = calldata,
                .gas = 10000000, // Increased from 100k to 10M
            },
        };

        const start_time = std.time.nanoTimestamp();
        const result = evm_instance.call(call_params) catch |err| {
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
                std.debug.print("output={x}\n", .{std.fmt.fmtSliceHexLower(result.output)});
            }
            std.debug.print("calldata={x}\n", .{std.fmt.fmtSliceHexLower(calldata)});
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
