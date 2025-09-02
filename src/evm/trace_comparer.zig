const std = @import("std");
const evm = @import("root.zig");
const primitives = @import("primitives");
const log = @import("log.zig");

/// Step-by-step trace comparer for debugging EVM differences
pub const TraceComparer = struct {
    allocator: std.mem.Allocator,
    
    pub const TraceStep = struct {
        step_num: usize,
        pc: u64,
        opcode: u8,
        opcode_name: []const u8,
        gas: i64,
        stack: []const u256,
        memory: []const u8,
        storage_changes: ?[]const StorageChange = null,
        
        pub const StorageChange = struct {
            key: u256,
            value: u256,
        };
    };
    
    pub fn init(allocator: std.mem.Allocator) TraceComparer {
        return .{ .allocator = allocator };
    }
    
    /// Compare two traces and log divergence point with context
    pub fn compareAndLogDivergence(
        self: *TraceComparer,
        revm_trace: []const TraceStep,
        guillotine_trace: []const TraceStep,
    ) !void {
        log.info("\n" ++ "=" ** 100, .{});
        log.info("                                    EXECUTION TRACE COMPARISON", .{});
        log.info("=" ** 100, .{});
        log.info("\nREVM steps: {} | Guillotine steps: {}\n", .{ revm_trace.len, guillotine_trace.len });
        
        const min_steps = @min(revm_trace.len, guillotine_trace.len);
        var divergence_step: ?usize = null;
        var divergence_reason: []const u8 = "";
        
        // Print header
        log.info("Step |  PC  | Opcode       | Gas       | Stack                                           | Memory", .{});
        log.info("-----|------|--------------|-----------|------------------------------------------------|--------", .{});
        
        // Print unified trace until divergence
        for (0..min_steps) |i| {
            const r = revm_trace[i];
            const g = guillotine_trace[i];
            
            // Check if traces match
            const pc_match = r.pc == g.pc;
            const op_match = r.opcode == g.opcode;
            const stack_match = r.stack.len == g.stack.len and stacksEqual(r.stack, g.stack);
            const mem_match = r.memory.len == g.memory.len and std.mem.eql(u8, r.memory, g.memory);
            _ = @abs(@as(i64, @intCast(r.gas)) - @as(i64, @intCast(g.gas))); // Gas difference (not checked for now)
            
            if (pc_match and op_match and stack_match and mem_match) {
                // Traces match - show unified line
                self.printUnifiedStep(i, r);
            } else {
                // Traces diverge - show both
                if (divergence_step == null) {
                    divergence_step = i;
                    if (!pc_match) {
                        divergence_reason = "PC mismatch";
                    } else if (!op_match) {
                        divergence_reason = "Opcode mismatch";
                    } else if (!stack_match) {
                        divergence_reason = "Stack mismatch";
                    } else if (!mem_match) {
                        divergence_reason = "Memory mismatch";
                    }
                    
                    log.err("\n>>> DIVERGENCE at step {} ({s}) <<<\n", .{ i, divergence_reason });
                }
                
                // Print both traces
                self.printDivergentStep(i, r, "REVM");
                self.printDivergentStep(i, g, "GUIL");
                
                // Only show first 3 divergent steps
                if (i > divergence_step.? + 2) {
                    log.info("\n... ({} more divergent steps) ...", .{min_steps - i - 1});
                    break;
                }
            }
        }
        
        // Check if one trace is longer
        if (divergence_step == null) {
            if (revm_trace.len != guillotine_trace.len) {
                divergence_step = min_steps;
                divergence_reason = if (revm_trace.len > guillotine_trace.len) 
                    "Guillotine trace ended early" 
                else 
                    "REVM trace ended early";
                log.err("\n>>> DIVERGENCE: {s} <<<\n", .{divergence_reason});
                
                // Show remaining steps from the longer trace
                if (revm_trace.len > guillotine_trace.len) {
                    log.info("Remaining REVM steps:", .{});
                    for (min_steps..revm_trace.len) |i| {
                        self.printUnifiedStep(i, revm_trace[i]);
                    }
                } else if (guillotine_trace.len > revm_trace.len) {
                    log.info("Remaining Guillotine steps:", .{});
                    for (min_steps..guillotine_trace.len) |i| {
                        self.printUnifiedStep(i, guillotine_trace[i]);
                    }
                }
            } else {
                log.info("\n✅ All {} steps match perfectly!", .{min_steps});
            }
        }
    }
    
    fn stacksEqual(revm_stack: []const u256, guil_stack: []const u256) bool {
        if (revm_stack.len != guil_stack.len) return false;
        // REVM stores stack with top at end, Guillotine with top at beginning
        // So we need to compare them in reverse order
        for (0..revm_stack.len) |i| {
            const revm_val = revm_stack[revm_stack.len - 1 - i];
            const guil_val = guil_stack[i];
            if (revm_val != guil_val) return false;
        }
        return true;
    }
    
    fn printUnifiedStep(self: *TraceComparer, step: usize, trace: TraceStep) void {
        _ = self;
        
        // Format stack (show top 4 items)
        var stack_buf: [256]u8 = undefined;
        var fbs = std.io.fixedBufferStream(&stack_buf);
        const writer = fbs.writer();
        
        writer.print("[", .{}) catch {};
        const max_stack = @min(4, trace.stack.len);
        for (0..max_stack) |j| {
            if (j > 0) writer.print(", ", .{}) catch {};
            // REVM stores stack with top at the end (read backwards)
            // Guillotine stores stack with top at the beginning (read forwards)
            const val = if (trace.opcode_name.len > 0 and trace.opcode_name[0] != 'U') // REVM has actual opcode names
                trace.stack[trace.stack.len - 1 - j]  // REVM: read backwards from end
            else
                trace.stack[j];  // Guillotine (UNKNOWN): read forwards from start
            if (val < 256) {
                writer.print("{}", .{val}) catch {};
            } else {
                writer.print("0x{x}", .{val}) catch {};
            }
        }
        if (trace.stack.len > max_stack) {
            writer.print(", ...+{}", .{trace.stack.len - max_stack}) catch {};
        }
        writer.print("]", .{}) catch {};
        
        const stack_str = fbs.getWritten();
        
        // Format memory size
        var mem_buf: [32]u8 = undefined;
        const mem_str = if (trace.memory.len > 0)
            std.fmt.bufPrint(&mem_buf, "{}b", .{trace.memory.len}) catch "?"
        else
            "0";
        
        log.info("{:4} | {:4} | {s:12} | {:9} | {s:47} | {s}", .{
            step,
            trace.pc,
            trace.opcode_name,
            trace.gas,
            stack_str,
            mem_str,
        });
    }
    
    fn printDivergentStep(self: *TraceComparer, step: usize, trace: TraceStep, label: []const u8) void {
        _ = self;
        
        // Format stack (show top 4 items)
        var stack_buf: [256]u8 = undefined;
        var fbs = std.io.fixedBufferStream(&stack_buf);
        const writer = fbs.writer();
        
        writer.print("[", .{}) catch {};
        const max_stack = @min(4, trace.stack.len);
        for (0..max_stack) |j| {
            if (j > 0) writer.print(", ", .{}) catch {};
            // REVM stores stack with top at the end (read backwards)
            // Guillotine stores stack with top at the beginning (read forwards)
            const val = if (trace.opcode_name.len > 0 and trace.opcode_name[0] != 'U') // REVM has actual opcode names
                trace.stack[trace.stack.len - 1 - j]  // REVM: read backwards from end
            else
                trace.stack[j];  // Guillotine (UNKNOWN): read forwards from start
            if (val < 256) {
                writer.print("{}", .{val}) catch {};
            } else {
                writer.print("0x{x}", .{val}) catch {};
            }
        }
        if (trace.stack.len > max_stack) {
            writer.print(", ...+{}", .{trace.stack.len - max_stack}) catch {};
        }
        writer.print("]", .{}) catch {};
        
        const stack_str = fbs.getWritten();
        
        // Format memory size
        var mem_buf: [32]u8 = undefined;
        const mem_str = if (trace.memory.len > 0)
            std.fmt.bufPrint(&mem_buf, "{}b", .{trace.memory.len}) catch "?"
        else
            "0";
        
        log.err("{s} {:4} | {:4} | 0x{x:0>2} {s:8} | {:9} | {s:47} | {s}", .{
            label,
            step,
            trace.pc,
            trace.opcode,
            trace.opcode_name,
            trace.gas,
            stack_str,
            mem_str,
        });
    }
    
    /// Parse Guillotine trace into our format
    pub fn parseGuillotineTrace(
        self: *TraceComparer,
        trace: @import("call_result.zig").ExecutionTrace,
    ) ![]TraceStep {
        var steps = try self.allocator.alloc(TraceStep, trace.steps.len);
        
        for (trace.steps, 0..) |step, i| {
            // Deep copy stack
            const stack_copy = try self.allocator.dupe(u256, step.stack);
            
            // Deep copy memory
            const memory_copy = try self.allocator.dupe(u8, step.memory);
            
            // Copy opcode name
            const opcode_name = try self.allocator.dupe(u8, step.opcode_name);
            
            steps[i] = .{
                .step_num = i,
                .pc = step.pc,
                .opcode = step.opcode,
                .opcode_name = opcode_name,
                .gas = @intCast(step.gas),
                .stack = stack_copy,
                .memory = memory_copy,
            };
        }
        
        return steps;
    }
    
    /// Parse REVM trace from JSON file
    pub fn parseRevmTraceFile(
        self: *TraceComparer,
        file_path: []const u8,
    ) ![]TraceStep {
        const trace_data = try std.fs.cwd().readFileAlloc(self.allocator, file_path, 100 * 1024 * 1024);
        defer self.allocator.free(trace_data);
        
        var steps = std.ArrayList(TraceStep){};
        defer steps.deinit(self.allocator);
        
        // Parse each line of newline-delimited JSON
        var lines = std.mem.tokenizeScalar(u8, trace_data, '\n');
        var step_num: usize = 0;
        
        while (lines.next()) |line| {
            if (line.len == 0) continue;
            
            // Skip lines that don't have an "op" field (like the final summary line)
            if (std.mem.indexOf(u8, line, "\"op\":") == null) continue;
            
            // Parse PC
            var pc: u64 = 0;
            if (std.mem.indexOf(u8, line, "\"pc\":")) |pc_start| {
                const pc_val_start = pc_start + 5;
                var pc_val_end = pc_val_start;
                while (pc_val_end < line.len and line[pc_val_end] != ',' and line[pc_val_end] != '}') : (pc_val_end += 1) {}
                pc = std.fmt.parseInt(u64, line[pc_val_start..pc_val_end], 10) catch 0;
            }
            
            // Parse opcode
            var opcode: u8 = 0;
            if (std.mem.indexOf(u8, line, "\"op\":")) |op_start| {
                const op_val_start = op_start + 5;
                var op_val_end = op_val_start;
                while (op_val_end < line.len and line[op_val_end] != ',' and line[op_val_end] != '}') : (op_val_end += 1) {}
                opcode = std.fmt.parseInt(u8, line[op_val_start..op_val_end], 10) catch 0;
            }
            
            // Parse opcode name
            var opcode_name: []const u8 = "UNKNOWN";
            if (std.mem.indexOf(u8, line, "\"opName\":")) |name_start| {
                const quote_start = std.mem.indexOfScalarPos(u8, line, name_start + 9, '"').? + 1;
                const quote_end = std.mem.indexOfScalarPos(u8, line, quote_start, '"').?;
                opcode_name = line[quote_start..quote_end];
            }
            
            // Parse gas (as hex string)
            var gas: i64 = 0;
            if (std.mem.indexOf(u8, line, "\"gas\":")) |gas_start| {
                const quote_start = std.mem.indexOfScalarPos(u8, line, gas_start + 6, '"');
                if (quote_start) |qs| {
                    const quote_end = std.mem.indexOfScalarPos(u8, line, qs + 1, '"').?;
                    const gas_str = line[qs + 1..quote_end];
                    // Parse hex string (starts with 0x)
                    if (gas_str.len > 2 and gas_str[0] == '0' and gas_str[1] == 'x') {
                        gas = @intCast(std.fmt.parseInt(u64, gas_str[2..], 16) catch 0);
                    } else {
                        gas = @intCast(std.fmt.parseInt(u64, gas_str, 16) catch 0);
                    }
                }
            }
            
            // Parse stack
            var stack_items = std.ArrayList(u256){};
            defer stack_items.deinit(self.allocator);
            
            if (std.mem.indexOf(u8, line, "\"stack\":[")) |stack_start| {
                var pos = stack_start + 9;
                while (pos < line.len and line[pos] != ']') {
                    // Find next string value
                    if (line[pos] == '"') {
                        const val_start = pos + 1;
                        const val_end = std.mem.indexOfScalarPos(u8, line, val_start, '"').?;
                        const val_str = line[val_start..val_end];
                        
                        // Parse hex value
                        var value: u256 = 0;
                        if (val_str.len > 2 and val_str[0] == '0' and val_str[1] == 'x') {
                            value = std.fmt.parseInt(u256, val_str[2..], 16) catch 0;
                        } else {
                            value = std.fmt.parseInt(u256, val_str, 16) catch 0;
                        }
                        try stack_items.append(self.allocator, value);
                        pos = val_end + 1;
                    } else {
                        pos += 1;
                    }
                }
            }
            
            const stack_copy = try self.allocator.dupe(u256, stack_items.items);
            const opcode_name_copy = try self.allocator.dupe(u8, opcode_name);
            
            try steps.append(self.allocator, .{
                .step_num = step_num,
                .pc = pc,
                .opcode = opcode,
                .opcode_name = opcode_name_copy,
                .gas = gas,
                .stack = stack_copy,
                .memory = &.{},
            });
            step_num += 1;
        }
        
        return steps.toOwnedSlice(self.allocator);
    }
    
    pub fn deinit(self: *TraceComparer) void {
        _ = self;
        // Cleanup if needed
    }
};