const std = @import("std");

// Import all debug method modules
const debug_getBadBlocks = @import("getBadBlocks/debug_getBadBlocks.zig");
const debug_getRawBlock = @import("getRawBlock/debug_getRawBlock.zig");
const debug_getRawHeader = @import("getRawHeader/debug_getRawHeader.zig");
const debug_getRawReceipts = @import("getRawReceipts/debug_getRawReceipts.zig");
const debug_getRawTransaction = @import("getRawTransaction/debug_getRawTransaction.zig");

/// Tagged union of all debug namespace methods
/// Maps method names to their corresponding parameter and result types
pub const DebugMethod = union(enum) {
    debug_getBadBlocks: struct {
        params: debug_getBadBlocks.Params,
        result: debug_getBadBlocks.Result,
    },
    debug_getRawBlock: struct {
        params: debug_getRawBlock.Params,
        result: debug_getRawBlock.Result,
    },
    debug_getRawHeader: struct {
        params: debug_getRawHeader.Params,
        result: debug_getRawHeader.Result,
    },
    debug_getRawReceipts: struct {
        params: debug_getRawReceipts.Params,
        result: debug_getRawReceipts.Result,
    },
    debug_getRawTransaction: struct {
        params: debug_getRawTransaction.Params,
        result: debug_getRawTransaction.Result,
    },

    /// Get the method name string from the union tag
    pub fn methodName(self: DebugMethod) []const u8 {
        return switch (self) {
            .debug_getBadBlocks => debug_getBadBlocks.method,
            .debug_getRawBlock => debug_getRawBlock.method,
            .debug_getRawHeader => debug_getRawHeader.method,
            .debug_getRawReceipts => debug_getRawReceipts.method,
            .debug_getRawTransaction => debug_getRawTransaction.method,
        };
    }

    /// Parse method name string to enum tag
    pub fn fromMethodName(method_name: []const u8) !std.meta.Tag(DebugMethod) {
        const map = std.StaticStringMap(std.meta.Tag(DebugMethod)).initComptime(.{
            .{ "debug_getBadBlocks", .debug_getBadBlocks },
            .{ "debug_getRawBlock", .debug_getRawBlock },
            .{ "debug_getRawHeader", .debug_getRawHeader },
            .{ "debug_getRawReceipts", .debug_getRawReceipts },
            .{ "debug_getRawTransaction", .debug_getRawTransaction },
        });

        return map.get(method_name) orelse error.UnknownMethod;
    }
};
