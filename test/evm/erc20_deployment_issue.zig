const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");
const log = @import("log");
const revm = @import("revm");

test {
    std.testing.log_level = .debug;
}

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

test "ERC20 deployment - REVM vs Guillotine comparison with tracing" {
    std.testing.log_level = .debug;
    const allocator = std.testing.allocator;
    
    // Read the ERC20 transfer bytecode that's failing
    const bytecode_file = try std.fs.cwd().openFile("src/evm/fixtures/erc20-transfer/bytecode.txt", .{});
    defer bytecode_file.close();
    const bytecode_hex = try bytecode_file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    defer allocator.free(bytecode_hex);
    
    const init_code = try hex_decode(allocator, bytecode_hex);
    defer allocator.free(init_code);
    
    log.info("ERC20 bytecode loaded: {} bytes", .{init_code.len});
    
    // Check if it's deployment bytecode
    const is_deployment_code = init_code.len > 4 and 
        init_code[0] == 0x60 and init_code[1] == 0x80 and 
        init_code[2] == 0x60 and init_code[3] == 0x40;
    
    log.info("Is deployment code: {}", .{is_deployment_code});
    try std.testing.expect(is_deployment_code);
    
    // First test with REVM to verify it works
    log.info("\n=== Testing with REVM (reference implementation) ===", .{});
    try testRevmDeployment(allocator, init_code);
    
    // Parse and pretty print the bytecode to understand what we're executing
    const BytecodeType = evm.Bytecode(.{});
    var bytecode_analyzed = try BytecodeType.init(allocator, init_code);
    defer bytecode_analyzed.deinit();
    
    // Pretty print the bytecode
    const bytecode_pretty = try bytecode_analyzed.pretty_print(allocator);
    defer allocator.free(bytecode_pretty);
    
    // Write bytecode analysis to file
    const bytecode_file_out = try std.fs.cwd().createFile("erc20_bytecode_analysis.txt", .{});
    defer bytecode_file_out.close();
    try bytecode_file_out.writeAll(bytecode_pretty);
    log.info("Bytecode analysis written to erc20_bytecode_analysis.txt", .{});
    
    // Setup EVM
    const caller_address = primitives.Address{ .bytes = [_]u8{0x10} ++ [_]u8{0} ** 18 ++ [_]u8{0x01} };
    
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    // Set up caller with large balance
    try database.set_account(caller_address.bytes, .{
        .balance = std.math.maxInt(u256),
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const block_info = evm.BlockInfo{
        .chain_id = 1,
        .number = 20_000_000,
        .timestamp = 1_800_000_000,
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
    
    // Gas amounts array not needed since we're using fixed amount
    
    // Now test with Guillotine
    log.info("\n=== Testing with Guillotine ===", .{});
    
    // Test with same gas amount that worked for REVM
    const gas_amount: u64 = 1_000_000;
    
    log.info("\n=== Testing Guillotine with gas: {} (with DebuggingTracer) ===", .{gas_amount});
    
    // Create EVM with debugging tracer  
    const EvmWithTracer = evm.Evm(.{
        .TracerType = evm.DebuggingTracer,
    });
    
    var deploy_evm = try EvmWithTracer.init(
        allocator,
        &database,
        block_info,
        tx_context,
        0,
        caller_address,
        .CANCUN
    );
    defer deploy_evm.deinit();
        
    // Try to deploy the contract
    const create_params = evm.CallParams{
        .create = .{
            .caller = caller_address,
            .value = 0,
            .init_code = init_code,
            .gas = gas_amount,
        },
    };
    
    var deploy_result = deploy_evm.call(create_params);
    defer deploy_result.deinit(allocator);
    
    log.info("Deployment result: success={}, gas_left={}, output_len={}", .{
        deploy_result.success,
        deploy_result.gas_left,
        deploy_result.output.len,
    });
    
    // Log trace summary if available
    if (deploy_result.trace) |trace| {
        log.info("Guillotine trace has {} steps", .{trace.steps.len});
    }
    
    if (!deploy_result.success) {
        log.warn("❌ Deployment failed with {} gas", .{gas_amount});
        if (deploy_result.output.len > 0) {
            log.info("Revert data: {x}", .{deploy_result.output});
            // Try to decode panic code if it's a Solidity panic
            if (deploy_result.output.len >= 36) {
                const panic_selector = deploy_result.output[0..4];
                const expected_selector = [_]u8{ 0x4e, 0x48, 0x7b, 0x71 }; // Panic(uint256)
                if (std.mem.eql(u8, panic_selector, &expected_selector)) {
                    const panic_code = std.mem.readInt(u256, deploy_result.output[4..36], .big);
                    log.info("Solidity panic code: 0x{x} ({})", .{ panic_code, panic_code });
                    // 0x41 = arithmetic overflow/underflow
                }
            }
        }
        
    } else {
        log.info("✅ Deployment succeeded with {} gas", .{gas_amount});
        log.info("Gas used: {}", .{gas_amount - deploy_result.gas_left});
    }
}

fn testRevmDeployment(allocator: std.mem.Allocator, init_code: []const u8) !void {
    // Setup REVM
    var revm_vm = try revm.Revm.init(allocator, .{
        .gas_limit = 1_000_000_000,
        .chain_id = 1,
    });
    defer revm_vm.deinit();
    
    const caller_address = primitives.Address{ .bytes = [_]u8{0x10} ++ [_]u8{0} ** 18 ++ [_]u8{0x01} };
    try revm_vm.setBalance(caller_address, std.math.maxInt(u256));
    
    // Test with different gas amounts
    const gas_amounts = [_]u64{
        100_000,       // Low
        1_000_000,     // 1M
        10_000_000,    // 10M  
        100_000_000,   // 100M
        500_000_000,   // 500M (what the runner uses)
        1_000_000_000, // 1B
    };
    
    for (gas_amounts) |gas_amount| {
        log.info("\nTesting REVM deployment with gas: {}", .{gas_amount});
        
        // Deploy contract using REVM's create functionality  
        // First do a normal create to test if it works
        var result = revm_vm.create(
            caller_address,
            0, // value
            init_code,
            gas_amount
        ) catch |err| {
            log.err("REVM create failed with error: {}", .{err});
            continue;
        };
        defer result.deinit();
        
        if (result.success) {
            log.info("✅ REVM deployment succeeded with {} gas", .{gas_amount});
            log.info("   Gas used: {}", .{result.gas_used});
            log.info("   Output (runtime code) length: {} bytes", .{result.output.len});
            
            
            // Get trace for successful deployment with 1M gas
            if (gas_amount == 1_000_000) {
                log.info("\n🎉 REVM successfully deploys ERC20 with 1,000,000 gas!", .{});
                
                // Now get a trace for this successful deployment
                log.info("\n=== Getting full trace of REVM deployment ===", .{});
                try getRevmDeploymentTrace(allocator, init_code, gas_amount);
                
                break;
            }
        } else {
            log.warn("❌ REVM deployment failed with {} gas", .{gas_amount});
            if (result.output.len > 0) {
                log.info("   Revert data: {x}", .{result.output});
            }
        }
    }
}

fn getRevmDeploymentTrace(allocator: std.mem.Allocator, init_code: []const u8, gas_limit: u64) !void {
    // For now, we'll use executeWithTrace from the REVM wrapper
    // Since we need to trace a CREATE operation, we'll need to use the wrapper's tracing
    
    var revm_vm = try revm.Revm.init(allocator, .{
        .gas_limit = gas_limit,
        .chain_id = 1,
    });
    defer revm_vm.deinit();
    
    const caller_address = primitives.Address{ .bytes = [_]u8{0x10} ++ [_]u8{0} ** 18 ++ [_]u8{0x01} };
    try revm_vm.setBalance(caller_address, std.math.maxInt(u256));
    
    // Generate trace file path
    const trace_file = try std.fmt.allocPrint(allocator, "/tmp/revm_erc20_trace_{}.json", .{std.time.milliTimestamp()});
    defer allocator.free(trace_file);
    
    log.info("Executing deployment with tracing...", .{});
    log.info("Trace will be written to: {s}", .{trace_file});
    
    // Use executeWithTrace to get full trace
    var result = revm_vm.executeWithTrace(
        caller_address,
        null, // null = CREATE operation
        0,    // value
        init_code,
        gas_limit,
        trace_file
    ) catch |err| {
        log.err("REVM executeWithTrace failed: {}", .{err});
        return;
    };
    defer result.deinit();
    
    if (result.success) {
        log.info("✅ Traced deployment succeeded", .{});
        log.info("   Gas used: {}", .{result.gas_used});
        log.info("   Output length: {} bytes", .{result.output.len});
        
        // Read the trace file
        const file = std.fs.openFileAbsolute(trace_file, .{}) catch |err| {
            log.err("Failed to open trace file: {}", .{err});
            return;
        };
        defer file.close();
        
        const trace_content = file.readToEndAlloc(allocator, 100 * 1024 * 1024) catch |err| {
            log.err("Failed to read trace file: {}", .{err});
            return;
        };
        defer allocator.free(trace_content);
        
        // Count trace lines
        var line_count: usize = 0;
        var iter = std.mem.tokenizeScalar(u8, trace_content, '\n');
        while (iter.next()) |_| {
            line_count += 1;
        }
        
        log.info("   Trace contains {} steps", .{line_count});
        
        // Save to persistent file
        const persistent_trace = try std.fs.cwd().createFile("revm_erc20_deployment_trace.json", .{});
        defer persistent_trace.close();
        try persistent_trace.writeAll(trace_content);
        log.info("\n📝 Full REVM trace saved to: revm_erc20_deployment_trace.json", .{});
        
        // Display first few lines of trace
        log.info("\nFirst 10 lines of trace:", .{});
        var line_iter = std.mem.tokenizeScalar(u8, trace_content, '\n');
        var i: usize = 0;
        while (line_iter.next()) |line| : (i += 1) {
            if (i >= 10) break;
            log.info("{s}", .{line});
        }
    } else {
        log.err("❌ Traced deployment failed", .{});
        if (result.output.len > 0) {
            log.info("   Revert data: {x}", .{result.output});
        }
    }
    
    // Clean up trace file
    std.fs.deleteFileAbsolute(trace_file) catch {};
}

test "Snailtracer deployment comparison" {
    std.testing.log_level = .debug;
    const allocator = std.testing.allocator;
    
    // Test with snailtracer which we know works
    const bytecode_file = try std.fs.cwd().openFile("src/evm/fixtures/snailtracer/bytecode.txt", .{});
    defer bytecode_file.close();
    const bytecode_hex = try bytecode_file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    defer allocator.free(bytecode_hex);
    
    const init_code = try hex_decode(allocator, bytecode_hex);
    defer allocator.free(init_code);
    
    log.info("Snailtracer bytecode loaded: {} bytes", .{init_code.len});
    
    const caller_address = primitives.Address{ .bytes = [_]u8{0x10} ++ [_]u8{0} ** 18 ++ [_]u8{0x01} };
    
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    try database.set_account(caller_address.bytes, .{
        .balance = std.math.maxInt(u256),
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const block_info = evm.BlockInfo{
        .chain_id = 1,
        .number = 20_000_000,
        .timestamp = 1_800_000_000,
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
    
    const create_params = evm.CallParams{
        .create = .{
            .caller = caller_address,
            .value = 0,
            .init_code = init_code,
            .gas = 500_000_000,
        },
    };
    
    var deploy_result = deploy_evm.call(create_params);
    defer deploy_result.deinit(allocator);
    
    log.info("Snailtracer deployment: success={}, gas_left={}, gas_used={}", .{
        deploy_result.success,
        deploy_result.gas_left,
        500_000_000 - deploy_result.gas_left,
    });
    
    try std.testing.expect(deploy_result.success);
}