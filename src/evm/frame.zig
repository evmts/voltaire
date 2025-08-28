//! Compatibility shim: Frame now aliases StackFrame.
//!
//! The old frame implementation has been replaced by `stack_frame.zig`.
//! This file preserves the import path (`@import("frame.zig")`) while
//! delegating to the new implementation to avoid widespread churn.

pub const FrameConfig = @import("frame_config.zig").FrameConfig;

pub fn Frame(comptime config: FrameConfig) type {
    return @import("stack_frame.zig").StackFrame(config);
}

