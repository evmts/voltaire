const std = @import("std");

pub const Hash = struct {
    bytes: [32]u8,

    pub fn jsonStringify(self: Hash, jws: *std.json.Stringify) !void {
        var buf: [66]u8 = undefined;
        buf[0] = '0';
        buf[1] = 'x';
        const hex = std.fmt.bytesToHex(&self.bytes, .lower);
        @memcpy(buf[2..], &hex);
        try jws.print("\"{s}\"", .{buf});
    }

    pub fn jsonParseFromValue(_: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !Hash {
        switch (source) {
            .string => |s| {
                if (s.len != 66 or s[0] != '0' or (s[1] != 'x' and s[1] != 'X'))
                    return error.InvalidHash;
                var out: [32]u8 = undefined;
                _ = std.fmt.hexToBytes(&out, s[2..]) catch return error.InvalidHash;
                return .{ .bytes = out };
            },
            else => return error.InvalidHash,
        }
    }
};
