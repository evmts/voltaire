const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");
const log = std.log;

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

test "ERC20 deployment - REVM vs Guillotine differential testing with simple tracer" {
    std.testing.log_level = .debug;
    const allocator = std.testing.allocator;
    
    // Read the ERC20 transfer bytecode
    const bytecode_file = try std.fs.cwd().openFile("src/evm/fixtures/erc20-transfer/bytecode.txt", .{});
    defer bytecode_file.close();
    const bytecode_hex = try bytecode_file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    defer allocator.free(bytecode_hex);
    
    const init_code = try hex_decode(allocator, bytecode_hex);
    defer allocator.free(init_code);
    
    log.info("Testing ERC20 deployment bytecode: {} bytes", .{init_code.len});
    
    // Use the differential tracer from the EVM module
    const DifferentialTracer = evm.differential_tracer.DifferentialTracer(revm);
    
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
    
    var tracer = try DifferentialTracer.init(
        allocator,
        &database,
        block_info,
        tx_context,
        caller_address,
        .{ .write_trace_files = true } // Enable trace files for debugging
    );
    defer tracer.deinit();
    
    try tracer.revm_vm.setBalance(caller_address, std.math.maxInt(u256));
    
    // Use high gas to rule out gas issues
    const gas_amount: u64 = 10_000_000;
    
    const create_params = evm.CallParams{
        .create = .{
            .caller = caller_address,
            .value = 0,
            .init_code = init_code,
            .gas = gas_amount,
        },
    };
    
    // This will show us exactly where they diverge
    var result = try tracer.call(create_params);
    defer result.deinit(allocator);
    
    try std.testing.expect(result.success);
    log.info("✅ ERC20 differential test passed!", .{});
}

fn testRevmDeployment(allocator: std.mem.Allocator, init_code: []const u8) !void {
    // Kept for reference - tests REVM deployment directly
    
    log.info("ERC20 bytecode loaded: {} bytes", .{init_code.len});
    
    // Check if it's deployment bytecode
    const is_deployment_code = init_code.len > 4 and 
        init_code[0] == 0x60 and init_code[1] == 0x80 and 
        init_code[2] == 0x60 and init_code[3] == 0x40;
    
    log.info("Is deployment code: {}", .{is_deployment_code});
    try std.testing.expect(is_deployment_code);
    
    // Setup EVM state
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
    
    // Create differential tracer
    log.info("\n=== Starting Differential Testing: REVM vs Guillotine ===", .{});
    
    const DifferentialTracer = evm.differential_tracer.DifferentialTracer(revm);
    
    var tracer = try DifferentialTracer.init(
        allocator,
        &database,
        block_info,
        tx_context,
        caller_address,
        .{
            .write_trace_files = true,
            .context_before = 20,
            .context_after = 20,
        },
    );
    defer tracer.deinit();
    
    // Set up REVM with same state
    try tracer.revm_vm.setBalance(caller_address, std.math.maxInt(u256));
    
    // Test with gas amount that should work
    // Using 10M gas to ensure we have plenty
    const gas_amount: u64 = 10_000_000;
    
    log.info("\nTesting ERC20 deployment with {} gas", .{gas_amount});
    
    // Create deployment params
    const create_params = evm.CallParams{
        .create = .{
            .caller = caller_address,
            .value = 0,
            .init_code = init_code,
            .gas = gas_amount,
        },
    };
    
    // Run differential test
    var result = tracer.call(create_params) catch |err| {
        log.err("\n❌ DIFFERENTIAL TEST FAILED: {}", .{err});
        log.err("This indicates that Guillotine and REVM produced different results!", .{});
        log.err("Check the error messages above for details on where they diverged.", .{});
        
        // The differential tracer will handle trace comparison internally
        // and report detailed divergence information
        
        return err;
    };
    defer result.deinit(allocator);
    
    if (result.success) {
        log.info("\n✅ DIFFERENTIAL TEST PASSED!", .{});
        log.info("Both REVM and Guillotine successfully deployed the ERC20 contract", .{});
        log.info("Gas used: {}", .{result.gasConsumed(gas_amount)});
        log.info("Output (runtime code) length: {} bytes", .{result.output.len});
    } else {
        log.warn("\n⚠️ Both EVMs failed, but in the same way (which is consistent)", .{});
    }
}

fn testRevmDeploymentDirect(allocator: std.mem.Allocator, init_code: []const u8) !void {
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

test "Simple contract differential test" {
    std.testing.log_level = .debug;
    const allocator = std.testing.allocator;
    
    // Use a very simple contract that just stores 42 and returns empty code
    const init_code = &[_]u8{
        0x60, 0x2a, // PUSH1 42
        0x60, 0x00, // PUSH1 0
        0x55, // SSTORE
        0x60, 0x00, // PUSH1 0 (return data size)
        0x60, 0x00, // PUSH1 0 (return data offset)
        0xF3, // RETURN
    };
    
    log.info("Simple contract bytecode: {} bytes", .{init_code.len});
    
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
    
    const DifferentialTracer = evm.differential_tracer.DifferentialTracer(revm);
    
    var tracer = try DifferentialTracer.init(
        allocator,
        &database,
        block_info,
        tx_context,
        caller_address,
        .{
            .write_trace_files = true, // Enable tracing to see divergence
        },
    );
    defer tracer.deinit();
    
    try tracer.revm_vm.setBalance(caller_address, std.math.maxInt(u256));
    
    const gas_amount: u64 = 1_000_000;
    
    log.info("\nTesting simple contract with {} gas", .{gas_amount});
    
    const create_params = evm.CallParams{
        .create = .{
            .caller = caller_address,
            .value = 0,
            .init_code = init_code,
            .gas = gas_amount,
        },
    };
    
    var result = try tracer.call(create_params);
    defer result.deinit(allocator);
    
    try std.testing.expect(result.success);
    log.info("✅ Simple contract differential test passed!", .{});
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