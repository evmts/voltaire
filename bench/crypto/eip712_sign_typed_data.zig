const std = @import("std");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const private_key = [_]u8{
        0xac, 0x09, 0x74, 0xbe, 0xc3, 0x9a, 0x17, 0xe3,
        0x6b, 0xa4, 0xa6, 0xb4, 0xd2, 0x38, 0xff, 0x24,
        0x4e, 0x21, 0xdb, 0x63, 0x5c, 0x51, 0xcb, 0x29,
        0x36, 0x49, 0x5a, 0xf7, 0x42, 0x2f, 0xba, 0x41,
    };

    const domain = crypto.Eip712.Eip712Domain{
        .name = "TestDomain",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = null,
        .salt = null,
    };

    var typed_data = crypto.Eip712.TypedData.init(allocator);
    defer typed_data.deinit(allocator);

    typed_data.domain = domain;
    typed_data.primary_type = "TestMessage";

    const signature = try crypto.Eip712.unaudited_signTypedData(allocator, &typed_data, private_key);
    _ = signature;
}
