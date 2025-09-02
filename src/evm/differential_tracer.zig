const std = @import("std");
const evm = @import("root.zig");
const primitives = @import("primitives");
const log = @import("log");
const CallParams = @import("call_params.zig").CallParams;
const CallResult = @import("call_result.zig").CallResult;
const revm = @import("revm");

/// Configuration for differential testing
pub const DifferentialConfig = struct {
    /// Number of opcodes to show before divergence
    context_before: usize = 10,
    /// Number of opcodes to show after divergence
    context_after: usize = 10,
    /// Whether to write traces to files for debugging
    write_trace_files: bool = false,
    /// Maximum differences to report before stopping
    max_differences: usize = 10,
};

/// Differential tracer that runs both REVM and Guillotine EVMs
/// and compares their execution traces for correctness testing
pub fn DifferentialTracer(comptime revm_module: type) type {
    return struct {
        allocator: std.mem.Allocator,
        guillotine_evm: *evm.Evm(.{ .TracerType = evm.tracer.JSONRPCTracer }),
        revm_vm: *revm_module.Revm,
        config: DifferentialConfig,

    /// Errors that can occur during differential testing
    pub const Error = error{
        /// The EVMs produced different results
        ExecutionDivergence,
        /// REVM execution failed
        RevmExecutionFailed,
        /// Guillotine execution failed
        GuillotineExecutionFailed,
        /// Memory allocation failed
        OutOfMemory,
        /// Invalid call parameters
        InvalidCallParams,
        /// Trace comparison failed
        TraceComparisonFailed,
    };

    /// Initialize differential tracer with both EVMs
    pub fn init(
        allocator: std.mem.Allocator,
        database: *evm.Database,
        block_info: evm.BlockInfo,
        tx_context: evm.TransactionContext,
        caller: primitives.Address,
        config: DifferentialConfig,
    ) !@This() {
        // Create Guillotine EVM with JSON-RPC tracing
        const guillotine = try allocator.create(evm.Evm(.{ .TracerType = evm.tracer.JSONRPCTracer }));
        errdefer allocator.destroy(guillotine);
        
        guillotine.* = try evm.Evm(.{ .TracerType = evm.tracer.JSONRPCTracer }).init(
            allocator,
            database,
            block_info,
            tx_context,
            0, // initial_refund
            caller,
            .CANCUN,
        );
        errdefer guillotine.deinit();
        
        // Create REVM instance
        const revm_vm = try allocator.create(revm_module.Revm);
        errdefer allocator.destroy(revm_vm);
        
        revm_vm.* = try revm_module.Revm.init(allocator, .{
            .gas_limit = tx_context.gas_limit,
            .chain_id = block_info.chain_id,
            .block_number = block_info.number,
            .block_timestamp = block_info.timestamp,
            .block_gas_limit = block_info.gas_limit,
            .block_difficulty = @intCast(block_info.difficulty),
            .block_basefee = @intCast(block_info.base_fee),
            .coinbase = block_info.coinbase,
        });
        errdefer revm_vm.deinit();
        
        // Sync initial state from Guillotine database to REVM
        try syncDatabaseState(database, revm_vm, allocator, caller);
        
        return @This(){
            .allocator = allocator,
            .guillotine_evm = guillotine,
            .revm_vm = revm_vm,
            .config = config,
        };
    }
    
    /// Deinitialize and clean up resources
    pub fn deinit(self: *@This()) void {
        self.guillotine_evm.deinit();
        self.allocator.destroy(self.guillotine_evm);
        self.revm_vm.deinit();
        self.allocator.destroy(self.revm_vm);
    }
    
    /// Execute a call on both EVMs and compare results
    pub fn call(self: *@This(), params: CallParams) Error!CallResult {
        var errors = std.ArrayList([]const u8).init(self.allocator);
        defer errors.deinit();
        
        // Convert CallParams to REVM format and execute
        const revm_result = self.executeRevm(params) catch |err| {
            const msg = try std.fmt.allocPrint(self.allocator, "REVM execution failed: {}", .{err});
            try errors.append(msg);
            return Error.RevmExecutionFailed;
        };
        defer if (revm_result) |*r| {
            r.deinit();
        };
        
        // Execute on Guillotine
        const guillotine_result = self.executeGuillotine(params) catch |err| {
            const msg = try std.fmt.allocPrint(self.allocator, "Guillotine execution failed: {}", .{err});
            try errors.append(msg);
            
            // Log all accumulated errors
            for (errors.items) |error_msg| {
                log.err("{s}", .{error_msg});
                self.allocator.free(error_msg);
            }
            
            return Error.GuillotineExecutionFailed;
        };
        errdefer guillotine_result.deinit(self.allocator);
        
        // Compare results and traces
        const comparison_result = self.compareResults(
            if (revm_result) |r| &r else null,
            guillotine_result,
            params,
            &errors,
        ) catch |err| {
            // Log all accumulated errors
            for (errors.items) |error_msg| {
                log.err("{s}", .{error_msg});
                self.allocator.free(error_msg);
            }
            return err;
        };
        _ = comparison_result;
        
        // If we have any errors, report them
        if (errors.items.len > 0) {
            log.err("=== DIFFERENTIAL TESTING FAILED ===", .{});
            for (errors.items) |msg| {
                log.err("{s}", .{msg});
                self.allocator.free(msg);
            }
            return Error.ExecutionDivergence;
        }
        
        return guillotine_result;
    }
    
    /// Execute call on REVM
    fn executeRevm(self: *@This(), params: CallParams) !?revm_module.ExecutionResult {
        switch (params) {
            .call => |call_params| {
                // Generate trace file path
                const trace_file = try std.fmt.allocPrint(
                    self.allocator,
                    "/tmp/revm_differential_trace_{}.json",
                    .{std.time.milliTimestamp()},
                );
                defer self.allocator.free(trace_file);
                
                const result = try self.revm_vm.callWithTrace(
                    call_params.caller,
                    call_params.to,
                    call_params.value,
                    call_params.input,
                    call_params.gas,
                    trace_file,
                );
                
                // Parse and store trace for comparison
                if (self.config.write_trace_files) {
                    log.info("REVM trace written to: {s}", .{trace_file});
                } else {
                    // Clean up trace file if not keeping
                    std.fs.deleteFileAbsolute(trace_file) catch {};
                }
                
                return result;
            },
            .create => |create_params| {
                // Generate trace file path
                const trace_file = try std.fmt.allocPrint(
                    self.allocator,
                    "/tmp/revm_differential_trace_{}.json",
                    .{std.time.milliTimestamp()},
                );
                defer self.allocator.free(trace_file);
                
                const result = try self.revm_vm.executeWithTrace(
                    create_params.caller,
                    null, // null for CREATE
                    create_params.value,
                    create_params.init_code,
                    create_params.gas,
                    trace_file,
                );
                
                // Parse and store trace for comparison
                if (self.config.write_trace_files) {
                    log.info("REVM trace written to: {s}", .{trace_file});
                } else {
                    // Clean up trace file if not keeping
                    std.fs.deleteFileAbsolute(trace_file) catch {};
                }
                
                return result;
            },
            else => {
                // Other call types not yet supported for differential testing
                return null;
            },
        }
    }
    
    /// Execute call on Guillotine
    fn executeGuillotine(self: *DifferentialTracer, params: CallParams) !CallResult {
        return self.guillotine_evm.call(params);
    }
    
    /// Compare execution results and traces
    fn compareResults(
        self: *DifferentialTracer,
        revm_result: ?*const revm_module.ExecutionResult,
        guillotine_result: CallResult,
        params: CallParams,
        errors: *std.ArrayList([]const u8),
    ) !void {
        // If REVM didn't execute (unsupported operation), skip comparison
        if (revm_result == null) {
            return;
        }
        
        const revm_res = revm_result.?;
        
        // Compare success status
        if (revm_res.success != guillotine_result.success) {
            const msg = try std.fmt.allocPrint(
                self.allocator,
                "Success mismatch: REVM={}, Guillotine={}",
                .{ revm_res.success, guillotine_result.success },
            );
            try errors.append(msg);
        }
        
        // Compare gas usage
        const guillotine_gas_used = guillotine_result.gasConsumed(
            switch (params) {
                .call => |p| p.gas,
                .create => |p| p.gas,
                else => 0,
            }
        );
        
        if (revm_res.gas_used != guillotine_gas_used) {
            const msg = try std.fmt.allocPrint(
                self.allocator,
                "Gas usage mismatch: REVM={}, Guillotine={}",
                .{ revm_res.gas_used, guillotine_gas_used },
            );
            try errors.append(msg);
        }
        
        // Compare output
        if (!std.mem.eql(u8, revm_res.output, guillotine_result.output)) {
            const msg = try std.fmt.allocPrint(
                self.allocator,
                "Output mismatch: REVM len={}, Guillotine len={}",
                .{ revm_res.output.len, guillotine_result.output.len },
            );
            try errors.append(msg);
            
            // Show first few bytes of difference
            const max_show = @min(32, @max(revm_res.output.len, guillotine_result.output.len));
            if (revm_res.output.len >= max_show) {
                const revm_hex = try std.fmt.allocPrint(
                    self.allocator,
                    "REVM output (first {} bytes): {x}",
                    .{ max_show, revm_res.output[0..max_show] },
                );
                try errors.append(revm_hex);
            }
            if (guillotine_result.output.len >= max_show) {
                const guillotine_hex = try std.fmt.allocPrint(
                    self.allocator,
                    "Guillotine output (first {} bytes): {x}",
                    .{ max_show, guillotine_result.output[0..max_show] },
                );
                try errors.append(guillotine_hex);
            }
        }
        
        // Compare traces if available
        try self.compareTraces(guillotine_result, errors);
    }
    
    /// Compare execution traces in detail
    fn compareTraces(
        self: *@This(),
        guillotine_result: CallResult,
        errors: *std.ArrayList([]const u8),
    ) !void {
        _ = guillotine_result;
        // Get Guillotine trace from the tracer
        const guillotine_trace = self.guillotine_evm.tracer.getTraceSteps();
        
        if (guillotine_trace.len == 0) {
            const msg = try std.fmt.allocPrint(
                self.allocator,
                "No trace steps captured from Guillotine",
                .{},
            );
            try errors.append(msg);
            return;
        }
        
        // Report trace info
        log.info("Comparing traces: Guillotine has {} steps", .{guillotine_trace.len});
        
        // Check each step for debugging
        var divergence_found = false;
        for (guillotine_trace, 0..) |step, idx| {
            // Log each step for debugging
            if (idx < 20 or divergence_found) { // Show first 20 steps or after divergence
                log.debug("Step {}: PC={}, Opcode={s}, Gas={}, GasCost={}", .{
                    idx,
                    step.pc,
                    step.op,
                    step.gas,
                    step.gasCost,
                });
                
                // Show stack if not empty
                if (step.stack.len > 0) {
                    log.debug("  Stack (top {} items):", .{@min(4, step.stack.len)});
                    for (step.stack[0..@min(4, step.stack.len)], 0..) |val, i| {
                        log.debug("    [{}]: 0x{x}", .{ i, val });
                    }
                }
                
                // If we detect an issue, report it
                if (step.gasCost > step.gas) {
                    const msg = try std.fmt.allocPrint(
                        self.allocator,
                        "Suspicious gas usage at step {}: cost={} > available={}",
                        .{ idx, step.gasCost, step.gas },
                    );
                    try errors.append(msg);
                    divergence_found = true;
                }
            }
        }
        
        // Try to load and parse REVM trace for detailed comparison
        if (self.config.write_trace_files) {
            // Find the most recent REVM trace file
            var dir = try std.fs.openDirAbsolute("/tmp", .{ .iterate = true });
            defer dir.close();
            
            var newest_trace: ?[]const u8 = null;
            var newest_time: i128 = 0;
            
            var iter = dir.iterate();
            while (try iter.next()) |entry| {
                if (std.mem.startsWith(u8, entry.name, "revm_differential_trace_") and
                    std.mem.endsWith(u8, entry.name, ".json")) {
                    const stat = try dir.statFile(entry.name);
                    if (stat.mtime > newest_time) {
                        newest_time = stat.mtime;
                        if (newest_trace) |old| self.allocator.free(old);
                        newest_trace = try self.allocator.dupe(u8, entry.name);
                    }
                }
            }
            
            if (newest_trace) |trace_name| {
                defer self.allocator.free(trace_name);
                const full_path = try std.fmt.allocPrint(self.allocator, "/tmp/{s}", .{trace_name});
                defer self.allocator.free(full_path);
                
                log.info("Loading REVM trace from: {s}", .{full_path});
                try self.performDetailedTraceComparison(full_path, guillotine_trace, errors);
            }
        }
    }
    
    /// Perform detailed comparison between REVM and Guillotine traces
    fn performDetailedTraceComparison(
        self: *DifferentialTracer,
        revm_trace_path: []const u8,
        guillotine_trace: []const evm.tracer.JSONRPCTracer.JSONRPCStep,
        errors: *std.ArrayList([]const u8),
    ) !void {
        // Read REVM trace file
        const file = try std.fs.openFileAbsolute(revm_trace_path, .{});
        defer file.close();
        
        const trace_content = try file.readToEndAlloc(self.allocator, 100 * 1024 * 1024);
        defer self.allocator.free(trace_content);
        
        // Parse REVM trace lines (simple line-by-line comparison for now)
        var line_count: usize = 0;
        var iter = std.mem.tokenizeScalar(u8, trace_content, '\n');
        
        log.info("\n=== DETAILED TRACE COMPARISON ===", .{});
        
        while (iter.next()) |line| : (line_count += 1) {
            if (line_count >= guillotine_trace.len) {
                const msg = try std.fmt.allocPrint(
                    self.allocator,
                    "REVM has more steps ({}) than Guillotine ({})",
                    .{ line_count + 1, guillotine_trace.len },
                );
                try errors.append(msg);
                break;
            }
            
            const guillotine_step = guillotine_trace[line_count];
            
            // Parse basic info from REVM trace line (simplified)
            // Format expected: {"pc":0,"op":"PUSH1","gas":999999,...}
            if (std.mem.indexOf(u8, line, "\"pc\":")) |pc_start| {
                const pc_str = line[pc_start + 5..];
                if (std.mem.indexOfScalar(u8, pc_str, ',')) |pc_end| {
                    const revm_pc = std.fmt.parseInt(u32, pc_str[0..pc_end], 10) catch continue;
                    
                    if (revm_pc != guillotine_step.pc) {
                        const msg = try std.fmt.allocPrint(
                            self.allocator,
                            "PC divergence at step {}: REVM={}, Guillotine={}",
                            .{ line_count, revm_pc, guillotine_step.pc },
                        );
                        try errors.append(msg);
                        
                        // Show context around divergence
                        try self.showDivergenceContext(line_count, revm_trace_path, guillotine_trace, errors);
                        break; // Stop at first divergence
                    }
                }
            }
            
            // Parse opcode from REVM trace
            if (std.mem.indexOf(u8, line, "\"op\":\"")) |op_start| {
                const op_str = line[op_start + 6..];
                if (std.mem.indexOfScalar(u8, op_str, '"')) |op_end| {
                    const revm_op = op_str[0..op_end];
                    
                    if (!std.mem.eql(u8, revm_op, guillotine_step.op)) {
                        const msg = try std.fmt.allocPrint(
                            self.allocator,
                            "Opcode divergence at step {}: REVM={s}, Guillotine={s}",
                            .{ line_count, revm_op, guillotine_step.op },
                        );
                        try errors.append(msg);
                        
                        // Show context around divergence
                        try self.showDivergenceContext(line_count, revm_trace_path, guillotine_trace, errors);
                        break; // Stop at first divergence
                    }
                }
            }
        }
        
        if (line_count < guillotine_trace.len) {
            const msg = try std.fmt.allocPrint(
                self.allocator,
                "Guillotine has more steps ({}) than REVM ({})",
                .{ guillotine_trace.len, line_count },
            );
            try errors.append(msg);
        }
    }
    
    /// Show context around a divergence point
    fn showDivergenceContext(
        self: *DifferentialTracer,
        divergence_step: usize,
        revm_trace_path: []const u8,
        guillotine_trace: []const evm.tracer.JSONRPCTracer.JSONRPCStep,
        errors: *std.ArrayList([]const u8),
    ) !void {
        _ = revm_trace_path;
        
        const msg = try std.fmt.allocPrint(
            self.allocator,
            "\n=== DIVERGENCE AT STEP {} ===",
            .{divergence_step},
        );
        try errors.append(msg);
        
        // Show context before divergence
        const start = if (divergence_step > self.config.context_before) 
            divergence_step - self.config.context_before 
        else 
            0;
        
        const before_msg = try std.fmt.allocPrint(
            self.allocator,
            "\nContext before divergence (steps {}-{}):",
            .{ start, divergence_step },
        );
        try errors.append(before_msg);
        
        var i = start;
        while (i < divergence_step and i < guillotine_trace.len) : (i += 1) {
            const step = guillotine_trace[i];
            const step_msg = try std.fmt.allocPrint(
                self.allocator,
                "  Step {}: PC={}, Op={s}, Gas={}, Cost={}",
                .{ i, step.pc, step.op, step.gas, step.gasCost },
            );
            try errors.append(step_msg);
        }
        
        // Show the diverging instruction in detail
        if (divergence_step < guillotine_trace.len) {
            const div_step = guillotine_trace[divergence_step];
            const div_msg = try std.fmt.allocPrint(
                self.allocator,
                "\n>>> DIVERGING STEP {}: PC={}, Op={s}, Gas={}, Cost={} <<<",
                .{ divergence_step, div_step.pc, div_step.op, div_step.gas, div_step.gasCost },
            );
            try errors.append(div_msg);
            
            // Show stack state
            if (div_step.stack.len > 0) {
                const stack_msg = try std.fmt.allocPrint(
                    self.allocator,
                    "Stack (top {} items):",
                    .{@min(8, div_step.stack.len)},
                );
                try errors.append(stack_msg);
                
                for (div_step.stack[0..@min(8, div_step.stack.len)], 0..) |val, idx| {
                    const val_msg = try std.fmt.allocPrint(
                        self.allocator,
                        "  [{}]: 0x{x}",
                        .{ idx, val },
                    );
                    try errors.append(val_msg);
                }
            }
        }
        
        // Show context after divergence
        const end = @min(divergence_step + self.config.context_after, guillotine_trace.len);
        if (divergence_step + 1 < end) {
            const after_msg = try std.fmt.allocPrint(
                self.allocator,
                "\nContext after divergence (steps {}-{}):",
                .{ divergence_step + 1, end },
            );
            try errors.append(after_msg);
            
            i = divergence_step + 1;
            while (i < end) : (i += 1) {
                const step = guillotine_trace[i];
                const step_msg = try std.fmt.allocPrint(
                    self.allocator,
                    "  Step {}: PC={}, Op={s}, Gas={}, Cost={}",
                    .{ i, step.pc, step.op, step.gas, step.gasCost },
                );
                try errors.append(step_msg);
            }
        }
    }
    
    /// Sync database state from Guillotine to REVM
    fn syncDatabaseState(
        database: *evm.Database,
        revm_vm: *revm_module.Revm,
        allocator: std.mem.Allocator,
        caller: primitives.Address,
    ) !void {
        _ = allocator;
        
        // Get caller account from Guillotine database
        if (try database.get_account(caller.bytes)) |account| {
            // Set balance in REVM
            try revm_vm.setBalance(caller, account.balance);
            
            // If account has code, set it
            if (!std.mem.eql(u8, &account.code_hash, &([_]u8{0} ** 32))) {
                const code = try database.get_code(account.code_hash);
                try revm_vm.setCode(caller, code);
            }
        }
        
        // Sync other accounts as needed
        // This would require iterating through all accounts in the database
        // For now, we just sync the caller which is sufficient for most tests
    }
    };
}

// Tests
test "DifferentialTracer initialization" {
    const allocator = std.testing.allocator;
    
    // Create a simple database
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    const block_info = evm.BlockInfo{
        .chain_id = 1,
        .number = 1000000,
        .timestamp = 1234567890,
        .difficulty = 0,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 7,
        .prev_randao = [_]u8{0} ** 32,
        .blob_base_fee = 1000000000,
        .blob_versioned_hashes = &.{},
    };
    
    const tx_context = evm.TransactionContext{
        .gas_limit = 1_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    const caller = primitives.Address{ .bytes = [_]u8{0x01} ** 20 };
    
    const DiffTracer = DifferentialTracer(revm);
    var tracer = try DiffTracer.init(
        allocator,
        &database,
        block_info,
        tx_context,
        caller,
        .{},
    );
    defer tracer.deinit();
}

test "DifferentialTracer simple ADD operation" {
    const allocator = std.testing.allocator;
    
    // Create a simple database
    var database = evm.Database.init(allocator);
    defer database.deinit();
    
    const caller = primitives.Address{ .bytes = [_]u8{0x01} ** 20 };
    const contract = primitives.Address{ .bytes = [_]u8{0x02} ** 20 };
    
    // Set up accounts
    try database.set_account(caller.bytes, .{
        .balance = 1000000,
        .nonce = 0,
        .code_hash = [_]u8{0} ** 32,
        .storage_root = [_]u8{0} ** 32,
    });
    
    // Simple ADD bytecode: PUSH1 0x02, PUSH1 0x03, ADD, STOP
    const bytecode = [_]u8{ 0x60, 0x02, 0x60, 0x03, 0x01, 0x00 };
    const code_hash = try database.set_code(&bytecode);
    try database.set_account(contract.bytes, .{
        .balance = 0,
        .nonce = 1,
        .code_hash = code_hash,
        .storage_root = [_]u8{0} ** 32,
    });
    
    const block_info = evm.BlockInfo{
        .chain_id = 1,
        .number = 1000000,
        .timestamp = 1234567890,
        .difficulty = 0,
        .gas_limit = 30_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .base_fee = 7,
        .prev_randao = [_]u8{0} ** 32,
        .blob_base_fee = 1000000000,
        .blob_versioned_hashes = &.{},
    };
    
    const tx_context = evm.TransactionContext{
        .gas_limit = 1_000_000,
        .coinbase = primitives.ZERO_ADDRESS,
        .chain_id = 1,
    };
    
    const DiffTracer = DifferentialTracer(revm);
    var tracer = try DiffTracer.init(
        allocator,
        &database,
        block_info,
        tx_context,
        caller,
        .{ .write_trace_files = true },
    );
    defer tracer.deinit();
    
    // Set up REVM with same state
    try tracer.revm_vm.setBalance(caller, 1000000);
    try tracer.revm_vm.setCode(contract, &bytecode);
    
    const params = CallParams{
        .call = .{
            .caller = caller,
            .to = contract,
            .value = 0,
            .input = &.{},
            .gas = 100000,
        },
    };
    
    var result = tracer.call(params) catch |err| {
        std.debug.print("Differential test failed: {}\n", .{err});
        return err;
    };
    defer result.deinit(allocator);
    
    try std.testing.expect(result.success);
}