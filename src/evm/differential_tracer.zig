const std = @import("std");
const evm = @import("root.zig");
const primitives = @import("primitives");
const log = @import("log.zig");
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
                .enable_tracing = config.write_trace_files, // Enable tracing based on config
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

        /// Execute call on both EVMs and compare results
        pub fn call(self: *@This(), params: CallParams) !CallResult {
            var errors = std.ArrayList([]const u8){};
            defer {
                for (errors.items) |err_msg| {
                    self.allocator.free(err_msg);
                }
                errors.deinit(self.allocator);
            }

            // Execute on both EVMs
            const revm_result = try self.executeRevm(params);
            defer if (revm_result) |*r| {
                var mutable = r.*;
                mutable.deinit();
            };

            const guillotine_result = try self.executeGuillotine(params);

            // Compare results
            try self.compareResults(revm_result, guillotine_result, &errors, self.allocator);

            // If there were differences, report them
            if (errors.items.len > 0) {
                log.err("\n❌ DIFFERENTIAL TEST FAILED: Found {} differences", .{errors.items.len});
                for (errors.items) |err_msg| {
                    log.err("  • {s}", .{err_msg});
                }

                if (self.config.write_trace_files) {
                    try self.writeTraceFiles(revm_result, guillotine_result);
                }

                return Error.ExecutionDivergence;
            }

            log.info("✅ DIFFERENTIAL TEST PASSED: EVMs produced identical results", .{});
            return guillotine_result;
        }

        /// Execute on REVM
        fn executeRevm(self: *@This(), params: CallParams) !?revm_module.CallResult {
            // Convert EVM CallParams to REVM CallParams
            const revm_params = switch (params) {
                .call => |p| revm_module.CallParams{ .call = .{
                    .caller = p.caller,
                    .to = p.to,
                    .value = p.value,
                    .input = p.input,
                    .gas = p.gas,
                } },
                .callcode => |p| revm_module.CallParams{ .callcode = .{
                    .caller = p.caller,
                    .to = p.to,
                    .value = p.value,
                    .input = p.input,
                    .gas = p.gas,
                } },
                .delegatecall => |p| revm_module.CallParams{ .delegatecall = .{
                    .caller = p.caller,
                    .to = p.to,
                    .input = p.input,
                    .gas = p.gas,
                } },
                .staticcall => |p| revm_module.CallParams{ .staticcall = .{
                    .caller = p.caller,
                    .to = p.to,
                    .input = p.input,
                    .gas = p.gas,
                } },
                .create => |p| revm_module.CallParams{ .create = .{
                    .caller = p.caller,
                    .value = p.value,
                    .init_code = p.init_code,
                    .gas = p.gas,
                } },
                .create2 => |p| revm_module.CallParams{ .create2 = .{
                    .caller = p.caller,
                    .value = p.value,
                    .init_code = p.init_code,
                    .salt = p.salt,
                    .gas = p.gas,
                } },
            };
            
            // REVM will automatically trace if enable_tracing was set during init
            return try self.revm_vm.call(revm_params);
        }

        /// Execute on Guillotine
        fn executeGuillotine(self: *@This(), params: CallParams) !CallResult {
            return self.guillotine_evm.call(params);
        }

        /// Compare execution results between REVM and Guillotine
        fn compareResults(
            self: *@This(),
            revm_result: ?revm_module.CallResult,
            guillotine_result: CallResult,
            errors: *std.ArrayList([]const u8),
            allocator: std.mem.Allocator,
        ) !void {
            if (revm_result == null) {
                try errors.append(allocator, try std.fmt.allocPrint(
                    allocator,
                    "REVM returned null result",
                    .{},
                ));
                return;
            }

            const revm_res = revm_result.?;

            // Compare success status
            if (revm_res.success != guillotine_result.success) {
                try errors.append(allocator, try std.fmt.allocPrint(
                    allocator,
                    "SUCCESS MISMATCH: REVM={}, Guillotine={}",
                    .{ revm_res.success, guillotine_result.success },
                ));
            }

            // Compare gas usage (both now have gas_left)
            if (revm_res.gas_left != guillotine_result.gas_left) {
                try errors.append(allocator, try std.fmt.allocPrint(
                    allocator,
                    "GAS MISMATCH: REVM gas_left={}, Guillotine gas_left={}",
                    .{ revm_res.gas_left, guillotine_result.gas_left },
                ));
            }

            // Compare output
            if (!std.mem.eql(u8, revm_res.output, guillotine_result.output)) {
                try errors.append(allocator, try std.fmt.allocPrint(
                    allocator,
                    "OUTPUT MISMATCH: REVM len={}, Guillotine len={}",
                    .{ revm_res.output.len, guillotine_result.output.len },
                ));

                // Show first few bytes of output for debugging
                if (revm_res.output.len > 0) {
                    const preview_len = @min(32, revm_res.output.len);
                    log.debug("  REVM output (first {} bytes): {x}", .{ preview_len, revm_res.output[0..preview_len] });
                }
                if (guillotine_result.output.len > 0) {
                    const preview_len = @min(32, guillotine_result.output.len);
                    log.debug("  Guillotine output (first {} bytes): {x}", .{ preview_len, guillotine_result.output[0..preview_len] });
                }
            }

            // Compare traces if available
            if (guillotine_result.trace) |g_trace| {
                try self.compareTraces(revm_res, g_trace, errors, allocator);
            }
        }

        /// Compare execution traces in detail
        fn compareTraces(
            self: *@This(),
            revm_result: ?revm_module.CallResult,
            guillotine_trace: @import("call_result.zig").ExecutionTrace,
            errors: *std.ArrayList([]const u8),
            allocator: std.mem.Allocator,
        ) !void {
            _ = self;
            _ = revm_result;
            _ = errors;
            
            // Import the trace comparer
            const TraceComparer = @import("trace_comparer.zig").TraceComparer;
            
            var comparer = TraceComparer.init(allocator);
            defer comparer.deinit();
            
            // Parse Guillotine trace
            const guillotine_steps = try comparer.parseGuillotineTrace(guillotine_trace);
            defer {
                for (guillotine_steps) |step| {
                    allocator.free(step.opcode_name);
                    allocator.free(step.stack);
                    allocator.free(step.memory);
                }
                allocator.free(guillotine_steps);
            }
            
            // Try to parse REVM trace if available
            if (std.fs.cwd().openFile("revm_trace.json", .{})) |file| {
                file.close();
                const revm_steps = try comparer.parseRevmTraceFile("revm_trace.json");
                defer {
                    for (revm_steps) |step| {
                        allocator.free(step.opcode_name);
                        if (step.stack.len > 0) allocator.free(step.stack);
                        if (step.memory.len > 0) allocator.free(step.memory);
                    }
                    allocator.free(revm_steps);
                }
                
                // Compare and log
                try comparer.compareAndLogDivergence(revm_steps, guillotine_steps);
            } else |_| {
                // No REVM trace file, just log Guillotine trace
                log.info("\n📊 Guillotine Trace ({} steps):", .{guillotine_trace.steps.len});
                const max_steps = @min(20, guillotine_trace.steps.len);
                for (guillotine_trace.steps[0..max_steps], 0..) |step, i| {
                    log.info("  Step {:4}: PC={:5} Op=0x{x:0>2} ({s:12}) Gas={:10} Stack=[{}]", .{
                        i, step.pc, step.opcode, step.opcode_name, step.gas, step.stack.len
                    });
                    
                    // Show stack values for important operations
                    if (step.stack.len > 0 and step.stack.len <= 3) {
                        for (step.stack, 0..) |val, j| {
                            log.debug("           Stack[{}]: 0x{x}", .{ j, val });
                        }
                    }
                }
                
                if (guillotine_trace.steps.len > max_steps) {
                    log.info("  ... {} more steps", .{guillotine_trace.steps.len - max_steps});
                }
            }
        }

        /// Write trace files for debugging
        fn writeTraceFiles(
            self: *@This(),
            revm_result: ?revm_module.CallResult,
            guillotine_result: CallResult,
        ) !void {
            const timestamp = std.time.milliTimestamp();

            // Write Guillotine trace
            if (guillotine_result.trace) |trace| {
                const g_filename = try std.fmt.allocPrint(
                    self.allocator,
                    "guillotine_trace_{}.json",
                    .{timestamp},
                );
                defer self.allocator.free(g_filename);

                const g_file = try std.fs.cwd().createFile(g_filename, .{});
                defer g_file.close();

                // Write trace steps as JSON
                try g_file.writeAll("[\n");
                for (trace.steps, 0..) |step, i| {
                    if (i > 0) try g_file.writeAll(",\n");
                    const line = try std.fmt.allocPrint(
                        self.allocator,
                        "  {{\"pc\": {}, \"opcode\": {}, \"gas\": {}, \"stack_size\": {}, \"memory_size\": {}}}",
                        .{ step.pc, step.opcode, step.gas, step.stack.len, step.memory.len },
                    );
                    defer self.allocator.free(line);
                    try g_file.writeAll(line);
                }
                try g_file.writeAll("\n]\n");

                log.info("Guillotine trace written to: {s}", .{g_filename});
            }

            // Write REVM result summary
            if (revm_result) |revm_res| {
                const r_filename = try std.fmt.allocPrint(
                    self.allocator,
                    "revm_result_{}.json",
                    .{timestamp},
                );
                defer self.allocator.free(r_filename);

                const r_file = try std.fs.cwd().createFile(r_filename, .{});
                defer r_file.close();

                const json = try std.fmt.allocPrint(
                    self.allocator,
                    "{{\"success\": {}, \"gas_left\": {}, \"output_len\": {}}}",
                    .{ revm_res.success, revm_res.gas_left, revm_res.output.len },
                );
                defer self.allocator.free(json);
                try r_file.writeAll(json);

                log.info("REVM result written to: {s}", .{r_filename});
            }
        }

        /// Sync database state from Guillotine to REVM
        fn syncDatabaseState(
            database: *evm.Database,
            revm_vm: anytype,
            allocator: std.mem.Allocator,
            initial_address: primitives.Address,
        ) !void {
            _ = allocator;

            // Sync initial account
            if (try database.get_account(initial_address.bytes)) |account| {
                try revm_vm.setBalance(initial_address, account.balance);

                // If account has code, sync it
                if (!std.mem.eql(u8, &account.code_hash, &([_]u8{0} ** 32))) {
                    const code = try database.get_code(account.code_hash);
                    try revm_vm.setCode(initial_address, code);
                }
            }

            // Additional accounts could be synced here if needed
            // This is a simplified version - a full implementation would
            // sync all touched accounts and storage
        }
    };
}
