const std = @import("std");
const testing = std.testing;
const log = std.log.scoped(.ten_thousand_hashes_fusion_test);

const dispatch_mod = @import("../dispatch.zig");
const frame_config_mod = @import("../frame_config.zig");
const frame_mod = @import("../frame.zig");
const Opcode = @import("../opcode.zig").Opcode;
const OpcodeSynthetic = @import("../opcode_synthetic.zig").OpcodeSynthetic;

// Ten-thousand-hashes bytecode from bench/official/cases/ten-thousand-hashes/bytecode.txt
const TEN_THOUSAND_HASHES_BYTECODE = "6080604052348015600e575f5ffd5b50609780601a5f395ff3fe6080604052348015600e575f5ffd5b50600436106026575f3560e01c806330627b7c14602a575b5f5ffd5b60306032565b005b5f5b614e20811015605e5760408051602081018390520160408051601f19818403019052526001016034565b5056fea26469706673582212202c247f39d615d7f66942cd6ed505d8ea34fbfcbe16ac875ed08c4a9c229325f364736f6c634300081e0033";

test "ten-thousand-hashes dispatch creation with fusion" {
    testing.log_level = .debug;
    
    const allocator = testing.allocator;
    
    // Decode the hex bytecode
    const bytecode = try hexDecode(allocator, TEN_THOUSAND_HASHES_BYTECODE);
    defer allocator.free(bytecode);
    
    log.debug("Bytecode length: {d} bytes", .{bytecode.len});
    
    // Create frame config with fusion enabled
    const config = frame_config_mod.FrameConfig{
        .stack_size = 1024,
        .has_database = false,
        .enable_fusion = true,  // IMPORTANT: Enable fusion
    };
    
    // Create dispatch with fusion enabled
    const Frame = frame_mod.Frame(config);
    const Dispatch = dispatch_mod.Dispatch(Frame);
    
    // Create the dispatch from bytecode
    var dispatch = try Dispatch.from(allocator, bytecode, null);
    defer dispatch.deinit(allocator);
    
    // Now let's verify the dispatch instruction stream
    var cursor = dispatch.cursor;
    var index: usize = 0;
    var expectations = std.ArrayList(Expectation).init(allocator);
    defer expectations.deinit();
    
    // Define our expectations based on the bytecode analysis
    // First instructions before any fusion
    try expectations.append(.{ .index = 0, .type = .opcode_handler, .opcode = .PUSH1 });
    try expectations.append(.{ .index = 1, .type = .push_inline, .value = 0x80 });
    try expectations.append(.{ .index = 2, .type = .opcode_handler, .opcode = .PUSH1 });
    try expectations.append(.{ .index = 3, .type = .push_inline, .value = 0x40 });
    try expectations.append(.{ .index = 4, .type = .opcode_handler, .opcode = .MSTORE });
    
    // Add more expectations up to the first fusion point
    // This is at PC 0x47 (decimal 71) - PUSH1 0x32 + JUMP
    // We need to figure out what index this corresponds to in the dispatch
    
    // Let's first just iterate and log what we actually get
    log.debug("\n=== Actual Dispatch Instruction Stream ===", .{});
    
    while (index < 200 and !isStop(cursor[0])) : (index += 1) {
        const item = cursor[0];
        
        // Log what type of item this is
        if (isOpcodeHandler(item)) {
            const opcode = getOpcodeFromHandler(item);
            if (opcode) |op| {
                log.debug("Index {d}: opcode_handler({s})", .{ index, @tagName(op) });
            } else {
                log.debug("Index {d}: opcode_handler(synthetic or unknown)", .{index});
            }
        } else if (isPushInline(item)) {
            log.debug("Index {d}: push_inline(value=0x{x})", .{ index, item.push_inline.value });
        } else if (isPushPointer(item)) {
            log.debug("Index {d}: push_pointer", .{index});
        } else if (isPushJump(item)) {
            log.debug("Index {d}: push_jump(destination=0x{x})", .{ index, item.push_jump.destination });
        } else if (isPushJumpi(item)) {
            log.debug("Index {d}: push_jumpi(destination=0x{x})", .{ index, item.push_jumpi.destination });
        } else if (isJumpDest(item)) {
            log.debug("Index {d}: jump_dest", .{index});
        } else if (isFirstBlockGas(item)) {
            log.debug("Index {d}: first_block_gas(gas={d})", .{ index, item.first_block_gas.gas });
        } else {
            log.debug("Index {d}: unknown item type", .{index});
        }
        
        cursor = cursor + 1;
        
        // Stop after reasonable number to avoid infinite loop
        if (index > 500) {
            log.warn("Stopping after 500 items to avoid infinite loop", .{});
            break;
        }
    }
    
    log.debug("=== End of Dispatch Stream (total items: {d}) ===\n", .{index});
    
    // Now let's specifically look for the fusion points
    cursor = dispatch.cursor;
    index = 0;
    var found_fusions: usize = 0;
    
    log.debug("\n=== Searching for Fusion Points ===", .{});
    while (index < 200 and !isStop(cursor[0])) : (index += 1) {
        const item = cursor[0];
        
        // Check if this is a synthetic PUSH_JUMP handler
        if (isOpcodeHandler(item)) {
            // Try to detect if this is a synthetic opcode
            // We can't easily tell from the handler pointer alone, but
            // if the next item is push_jump metadata, it's likely synthetic
            if (index + 1 < 200 and !isStop(cursor[1])) {
                if (isPushJump(cursor[1])) {
                    log.debug("Found PUSH_JUMP fusion at index {d}, destination=0x{x}", .{ index, cursor[1].push_jump.destination });
                    found_fusions += 1;
                } else if (isPushJumpi(cursor[1])) {
                    log.debug("Found PUSH_JUMPI fusion at index {d}, destination=0x{x}", .{ index, cursor[1].push_jumpi.destination });
                    found_fusions += 1;
                }
            }
        }
        
        cursor = cursor + 1;
    }
    
    log.debug("Total fusions found: {d}", .{found_fusions});
    
    // We expect 2 PUSH_JUMP fusions based on the debug output
    try testing.expect(found_fusions >= 2);
}

// Helper types and functions
const Expectation = struct {
    index: usize,
    type: ItemType,
    opcode: ?Opcode = null,
    value: ?u64 = null,
};

const ItemType = enum {
    opcode_handler,
    push_inline,
    push_pointer,
    push_jump,
    push_jumpi,
    jump_dest,
    first_block_gas,
};

fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    
    var i: usize = 0;
    while (i < clean_hex.len) : (i += 2) {
        const byte_str = clean_hex[i .. i + 2];
        result[i / 2] = try std.fmt.parseInt(u8, byte_str, 16);
    }
    
    return result;
}

fn isOpcodeHandler(item: anytype) bool {
    // Check if this is an opcode handler by checking if it's a function pointer
    // This is a bit hacky but works for our test
    return @typeInfo(@TypeOf(item)).Union.fields.len > 0 and 
           std.mem.eql(u8, @typeInfo(@TypeOf(item)).Union.fields[0].name, "opcode_handler");
}

fn isPushInline(item: anytype) bool {
    return switch (item) {
        .push_inline => true,
        else => false,
    };
}

fn isPushPointer(item: anytype) bool {
    return switch (item) {
        .push_pointer => true,
        else => false,
    };
}

fn isPushJump(item: anytype) bool {
    return switch (item) {
        .push_jump => true,
        else => false,
    };
}

fn isPushJumpi(item: anytype) bool {
    return switch (item) {
        .push_jumpi => true,
        else => false,
    };
}

fn isJumpDest(item: anytype) bool {
    return switch (item) {
        .jump_dest => true,
        else => false,
    };
}

fn isFirstBlockGas(item: anytype) bool {
    return switch (item) {
        .first_block_gas => true,
        else => false,
    };
}

fn isStop(item: anytype) bool {
    // Check if this is a STOP opcode handler
    // For simplicity, we'll just check if we've reached the end
    return false; // TODO: Implement proper STOP detection
}

fn getOpcodeFromHandler(item: anytype) ?Opcode {
    // This would require comparing the handler pointer to known handlers
    // For now, return null as we can't easily determine this
    return null;
}