const std = @import("std");

pub const BlockTag = struct {
    value: std.json.Value,

    pub fn jsonStringify(self: BlockTag, jws: *std.json.Stringify) !void {
        try jws.write(self.value);
    }

    pub fn jsonParseFromValue(_: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !BlockTag {
        return .{ .value = source };
    }
};
