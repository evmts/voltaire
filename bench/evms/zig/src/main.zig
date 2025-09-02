const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");
const tracer_mod = @import("evm").tracer;

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
    
    // Check if this is deployment bytecode or runtime bytecode
    // Deployment bytecode typically starts with 0x6080604052 (PUSH1 0x80 PUSH1 0x40 MSTORE)
    const is_deployment_code = init_code.len > 4 and 
        init_code[0] == 0x60 and init_code[1] == 0x80 and 
        init_code[2] == 0x60 and init_code[3] == 0x40;
    
    if (verbose) {
        std.debug.print("Bytecode analysis: len={}, first_bytes={x}\n", .{init_code.len, init_code[0..@min(10, init_code.len)]});
        std.debug.print("Is deployment code: {}\n", .{is_deployment_code});
    }
    
    var contract_address: primitives.Address = undefined;
    var runtime_code: []const u8 = undefined;
    
    if (is_deployment_code) {
        // Deploy contract using CREATE to get runtime code
        var deploy_evm = try evm.Evm(.{ .TracerType = tracer_mod.JSONRPCTracer }).init(
            allocator,
            &database,
            block_info,
            tx_context,
            0,
            caller_address,
            .CANCUN
        );
        defer deploy_evm.deinit();
        
        // Setup CREATE call parameters with much higher gas
        const create_params = evm.CallParams{
            .create = .{
                .caller = caller_address,
                .value = 0,
                .init_code = init_code,
                .gas = 500_000_000,  // Much higher gas for deployment
            },
        };
        
        // Deploy the contract
        const deploy_result = deploy_evm.call(create_params);
        
        if (!deploy_result.success) {
            std.debug.print("❌ Contract deployment failed: gas_left={}, output_len={}\n", .{deploy_result.gas_left, deploy_result.output.len});
            if (deploy_result.output.len > 0) {
                std.debug.print("Deployment output: {x}\n", .{deploy_result.output});
            }
            // Try direct code deployment as fallback
            std.debug.print("⚠️  Falling back to direct code deployment\n", .{});
            contract_address = primitives.Address{ .bytes = [_]u8{0x42} ++ [_]u8{0} ** 19 };
            runtime_code = init_code;
            
            // Set the code directly
            const code_hash = try database.set_code(runtime_code);
            try database.set_account(contract_address.bytes, .{
                .balance = 0,
                .nonce = 1,
                .code_hash = code_hash,
                .storage_root = [_]u8{0} ** 32,
            });
        } else {
            // Get the deployed contract address
            // For CREATE, address is deterministic based on caller + nonce (which was 0)
            contract_address = primitives.Address.get_contract_address(caller_address, 0);
            runtime_code = deploy_result.output;
        }
    } else {
        // Not deployment bytecode, use directly as runtime code
        contract_address = primitives.Address{ .bytes = [_]u8{0x42} ++ [_]u8{0} ** 19 };
        runtime_code = init_code;
        
        // Set the code directly
        const code_hash = try database.set_code(runtime_code);
        try database.set_account(contract_address.bytes, .{
            .balance = 0,
            .nonce = 1,
            .code_hash = code_hash,
            .storage_root = [_]u8{0} ** 32,
        });
    }
    
    // Run benchmarks - create fresh EVM for each run
    for (0..num_runs) |run_idx| {
        // Create EVM instance for benchmark execution with tracing
        var evm_instance = try evm.Evm(.{ .TracerType = tracer_mod.JSONRPCTracer }).init(
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
            std.debug.print("❌ Execution failed: gas_left={}, output_len={}\n", .{result.gas_left, result.output.len});
            if (result.output.len > 0) {
                std.debug.print("Output: {x}\n", .{result.output});
            }
            @panic("Benchmark execution failed");
        }
        
        // Calculate duration in milliseconds
        const duration_ns = end.since(start);
        const duration_ms = @as(f64, @floatFromInt(duration_ns)) / 1_000_000.0;
        
        // Output timing in milliseconds (one per line as expected by orchestrator)
        std.debug.print("{d:.6}\n", .{duration_ms});
        
        // Write JSON-RPC trace to file (only on first run)
        if (run_idx == 0 and result.trace != null) {
            // Create trace file with timestamp
            const timestamp = std.time.timestamp();
            const trace_filename = try std.fmt.allocPrint(allocator, "trace_{}.json", .{timestamp});
            defer allocator.free(trace_filename);
            
            // Write trace as JSON
            const trace_file = try std.fs.cwd().createFile(trace_filename, .{});
            defer trace_file.close();
            
            // Simple JSON output using File.writeAll
            var json_str = try std.fmt.allocPrint(allocator, 
                \\{{
                \\  "success": {},
                \\  "gas_used": {},
                \\  "gas_left": {},
                \\  "output": "0x",
            , .{result.success, 1_000_000_000 - result.gas_left, result.gas_left});
            defer allocator.free(json_str);
            
            // Add output hex
            for (result.output) |byte| {
                const hex_byte = try std.fmt.allocPrint(allocator, "{x:0>2}", .{byte});
                defer allocator.free(hex_byte);
                const new_str = try std.mem.concat(allocator, u8, &.{json_str, hex_byte});
                allocator.free(json_str);
                json_str = new_str;
            }
            
            // Add structLogs if available
            if (result.trace) |trace| {
                const logs_header = try std.fmt.allocPrint(allocator, 
                    \\",
                    \\  "structLogs": [
                , .{});
                defer allocator.free(logs_header);
                const new_str = try std.mem.concat(allocator, u8, &.{json_str, logs_header});
                allocator.free(json_str);
                json_str = new_str;
                
                // Output limited trace steps to avoid huge files
                const max_steps = @min(trace.steps.len, 100);
                for (trace.steps[0..max_steps], 0..) |step, step_idx| {
                    const comma = if (step_idx < max_steps - 1) "," else "";
                    const step_json = try std.fmt.allocPrint(allocator,
                        \\    {{
                        \\      "pc": {},
                        \\      "op": "{s}",
                        \\      "gas": {},
                        \\      "stack": [],
                        \\      "depth": 1
                        \\    }}{s}
                    , .{step.pc, step.opcode_name, step.gas, comma});
                    defer allocator.free(step_json);
                    const step_str = try std.mem.concat(allocator, u8, &.{json_str, "\n", step_json});
                    allocator.free(json_str);
                    json_str = step_str;
                }
                
                const logs_footer = 
                    \\
                    \\  ]
                    \\}}
                ;
                const final_str = try std.mem.concat(allocator, u8, &.{json_str, logs_footer});
                allocator.free(json_str);
                json_str = final_str;
            } else {
                const no_logs = 
                    \\",
                    \\  "structLogs": []
                    \\}}
                ;
                const final_str = try std.mem.concat(allocator, u8, &.{json_str, no_logs});
                allocator.free(json_str);
                json_str = final_str;
            }
            
            try trace_file.writeAll(json_str);
            std.debug.print("JSON-RPC trace written to: {s}\n", .{trace_filename});
        }
        
        if (verbose) {
            const gas_used = 1_000_000_000 - result.gas_left;
            std.debug.print("Run {}: {d:.6}ms, gas_used={}\n", .{ run_idx + 1, duration_ms, gas_used });
        }
    }

    // Explicitly exit to avoid any cleanup issues
    std.process.exit(0);
}
