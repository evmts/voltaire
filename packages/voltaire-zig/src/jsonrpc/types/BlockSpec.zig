const std = @import("std");

/// BlockSpec is the union of BlockTag | Hash | Quantity per execution-apis.
/// We model it here minimally as a pass-through JSON value container so
/// generated method wrappers can compile; higher layers perform validation.
pub const BlockSpec = struct {
    value: std.json.Value,

    pub fn jsonStringify(self: BlockSpec, jws: *std.json.Stringify) !void {
        try jws.write(self.value);
    }

    pub fn jsonParseFromValue(_: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !BlockSpec {
        return .{ .value = source };
    }
};
