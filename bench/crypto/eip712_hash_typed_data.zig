const std = @import("std");
const crypto = @import("crypto");

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

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

    const hash = try crypto.Eip712.unaudited_hashTypedData(allocator, &typed_data);
    _ = hash;
}
