const std = @import("std");
const log = @import("log");

/// Simple tracer that logs every opcode execution with stack state
pub const OpcodeTracer = struct {
    opcode_count: usize = 0,
    max_opcodes: usize = 20, // Limit to first 20 opcodes for clarity
    steps: std.ArrayList(struct {
        pc: u32,
        opcode: u8,
        opcode_name: []const u8,
        gas_after: i64,
        stack: []u256,
        stack_after: []u256,  // Add this field
        memory: []const u8,
        storage: ?std.AutoHashMap(u256, u256),
        depth: u32,
        refund: u64,
        error_msg: ?[]const u8,
    }) = undefined, // Dummy field to satisfy EVM interface
    
    pub fn init() OpcodeTracer {
        return .{};
    }
    
    pub fn deinit(self: *OpcodeTracer) void {
        _ = self;
    }
    
    pub fn beforeOp(self: *OpcodeTracer, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        if (self.opcode_count >= self.max_opcodes) return;
        
        // Get stack contents (need to cast away const)
        const stack_slice = @constCast(&frame.stack).get_slice();
        
        // Map opcode to name for readability
        const opcode_name = switch (opcode) {
            0x00 => "STOP",
            0x01 => "ADD",
            0x15 => "ISZERO",
            0x34 => "CALLVALUE",
            0x50 => "POP",
            0x52 => "MSTORE",
            0x57 => "JUMPI",
            0x5b => "JUMPDEST",
            0x5f => "PUSH0",
            0x60 => "PUSH1",
            0x61 => "PUSH2",
            0x80 => "DUP1",
            0xfd => "REVERT",
            else => "UNKNOWN",
        };
        
        // Log the opcode and stack state
        log.warn("Op[{}] PC={x:0>4} Opcode=0x{x:0>2}({s}) Stack(len={}):", .{
            self.opcode_count,
            pc,
            opcode,
            opcode_name,
            stack_slice.len,
        });
        
        // Log stack contents (top to bottom, max 5 items)
        const items_to_show = @min(stack_slice.len, 5);
        if (items_to_show > 0) {
            var i: usize = 0;
            while (i < items_to_show) : (i += 1) {
                log.warn("  [{d}]: 0x{x}", .{ i, stack_slice[i] });
            }
            if (stack_slice.len > 5) {
                log.warn("  ... {} more items", .{stack_slice.len - 5});
            }
        } else {
            log.warn("  (empty)", .{});
        }
        
        self.opcode_count += 1;
    }
    
    pub fn afterOp(self: *OpcodeTracer, pc: u32, opcode: u8, comptime FrameType: type, frame: *const FrameType) void {
        _ = self;
        _ = pc;
        _ = opcode;
        _ = frame;
        // We log before op, so nothing needed after
    }
    
    pub fn onError(self: *OpcodeTracer, pc: u32, opcode: u8, err: anyerror, comptime FrameType: type, frame: *const FrameType) void {
        _ = pc;
        _ = opcode;
        _ = frame;
        log.warn("TRACER: Execution failed after {} opcodes with error: {}", .{ self.opcode_count, err });
    }
};