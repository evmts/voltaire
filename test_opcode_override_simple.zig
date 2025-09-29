const std = @import("std");
const testing = std.testing;

// Minimal test to verify opcode override mechanism compiles and works
test "opcode overrides compile correctly" {
    const EvmConfig = @import("src/evm_config.zig").EvmConfig;
    
    // Test that we can create a config with opcode overrides
    const config = EvmConfig{
        .opcode_overrides = &[_]EvmConfig.OpcodeOverride{
            .{
                .opcode = 0x01, // ADD
                .handler = @as(*const anyopaque, @ptrFromInt(0x1234)), // Dummy handler
            },
            .{
                .opcode = 0xFE, // Invalid opcode
                .handler = @as(*const anyopaque, @ptrFromInt(0x5678)), // Dummy handler  
            },
        },
    };
    
    // Verify the config has the overrides
    try testing.expectEqual(@as(usize, 2), config.opcode_overrides.len);
    try testing.expectEqual(@as(u8, 0x01), config.opcode_overrides[0].opcode);
    try testing.expectEqual(@as(u8, 0xFE), config.opcode_overrides[1].opcode);
    
    // Test that frame_config includes the overrides
    const frame_config = config.frame_config();
    try testing.expectEqual(@as(usize, 2), frame_config.opcode_overrides.len);
    try testing.expectEqual(@as(u8, 0x01), frame_config.opcode_overrides[0].opcode);
}

// Test that frame handlers actually apply overrides
test "frame handlers apply overrides" {
    const frame_handlers = @import("src/frame/frame_handlers.zig");
    
    // Create a minimal test frame type
    const TestFrame = struct {
        pub const OpcodeHandler = *const fn () void;
        pub const Dispatch = struct {
            pub const Item = u8;
        };
        pub const Error = error{TestError};
    };
    
    // Create test handlers
    const testHandler1 = struct {
        fn handler() void {}
    }.handler;
    
    const testHandler2 = struct {
        fn handler() void {}
    }.handler;
    
    // Get handlers without overrides
    const handlers_default = frame_handlers.getOpcodeHandlers(TestFrame);
    
    // Get handlers with overrides
    const overrides = [_]struct { opcode: u8, handler: *const anyopaque }{
        .{ .opcode = 0x01, .handler = &testHandler1 },
        .{ .opcode = 0xFE, .handler = &testHandler2 },
    };
    const handlers_with_overrides = frame_handlers.getOpcodeHandlers(TestFrame, &overrides);
    
    // Verify overrides were applied
    try testing.expectEqual(@as(TestFrame.OpcodeHandler, &testHandler1), handlers_with_overrides[0x01]);
    try testing.expectEqual(@as(TestFrame.OpcodeHandler, &testHandler2), handlers_with_overrides[0xFE]);
    
    // Verify other opcodes are not affected (they should have the same handler as default)
    try testing.expectEqual(handlers_default[0x02], handlers_with_overrides[0x02]);
}