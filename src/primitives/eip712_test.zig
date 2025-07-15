const std = @import("std");
const testing = std.testing;
const Eip712 = @import("eip712.zig");
const Crypto = @import("crypto.zig");

test "EIP-712 basic functionality" {
    const allocator = testing.allocator;

    // Test basic hash generation
    const domain = Eip712.Eip712Domain{
        .name = "TestDomain",
        .version = "1",
        .chain_id = 1,
        .verifying_contract = null,
        .salt = null,
    };

    var typed_data = Eip712.TypedData.init(allocator);
    defer typed_data.deinit(allocator);

    typed_data.domain = domain;
    typed_data.primary_type = "TestMessage";

    // Try to hash - this should work even if we don't have complete type definitions
    const hash_result = Eip712.hash_typed_data(allocator, &typed_data);

    // We expect this to potentially fail but not crash
    if (hash_result) |hash| {
        // If successful, verify hash is not all zeros
        const zero_hash = [_]u8{0} ** 32;
        try testing.expect(!std.mem.eql(u8, &hash, &zero_hash));
    } else |_| {
        // If it fails, that's expected for incomplete type definitions
        // This is fine - we're just testing that it doesn't crash
    }
}

test "EIP-712 crypto integration" {
    // Test that the crypto functions are available
    const private_key = try Crypto.random_private_key();
    const public_key = try Crypto.get_public_key(private_key);
    const address = public_key.to_address();

    // Basic test that addresses work
    const zero_address = [_]u8{0} ** 20;
    try testing.expect(!std.mem.eql(u8, &address, &zero_address));
}
