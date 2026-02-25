const std = @import("std");

/// Minimal JSON-RPC Address wrapper for OpenRPC-generated methods.
/// Accepts hex `0x` 20-byte strings and serializes identically.
pub const Address = struct {
    bytes: [20]u8,

    pub fn jsonStringify(self: Address, jws: *std.json.Stringify) !void {
        var buf: [42]u8 = undefined;
        buf[0] = '0';
        buf[1] = 'x';
        const hex = std.fmt.bytesToHex(&self.bytes, .lower);
        @memcpy(buf[2..], &hex);
        try jws.print("\"{s}\"", .{buf});
    }

    pub fn jsonParseFromValue(allocator: std.mem.Allocator, source: std.json.Value, _: std.json.ParseOptions) !Address {
        _ = allocator;
        switch (source) {
            .string => |s| {
                var slice = s;
                if (slice.len != 42 or slice[0] != '0' or (slice[1] != 'x' and slice[1] != 'X'))
                    return error.InvalidAddress;
                var out: [20]u8 = undefined;
                _ = std.fmt.hexToBytes(&out, slice[2..]) catch return error.InvalidAddress;
                return .{ .bytes = out };
            },
            else => return error.InvalidAddress,
        }
    }
};
