const std = @import("std");
const testing = std.testing;

// Test the contract code loading pattern directly
test "contract code loading logic" {
    const allocator = testing.allocator;
    
    // Simulate contract code storage
    var code_storage = std.HashMap([32]u8, []const u8, HashContext, std.hash_map.default_max_load_percentage).init(allocator);
    defer code_storage.deinit();
    
    // Test bytecode
    const bytecode = [_]u8{0x00, 0x60, 0x01, 0x60, 0x00, 0xF3}; // STOP PUSH1 1 PUSH1 0 RETURN
    
    // Calculate hash
    var hash: [32]u8 = undefined;
    std.crypto.hash.sha3.Keccak256.hash(&bytecode, &hash, .{});
    
    // Store code
    try code_storage.put(hash, &bytecode);
    
    // Retrieve code (simulating database get_code_by_address behavior)
    const retrieved_code = code_storage.get(hash) orelse &.{};
    
    try testing.expectEqualSlices(u8, &bytecode, retrieved_code);
}

test "empty code handling" {
    const allocator = testing.allocator;
    
    var code_storage = std.HashMap([32]u8, []const u8, HashContext, std.hash_map.default_max_load_percentage).init(allocator);
    defer code_storage.deinit();
    
    // Test with non-existent hash
    const fake_hash = [_]u8{0xFF} ** 32;
    const retrieved_code = code_storage.get(fake_hash) orelse &.{};
    
    try testing.expectEqualSlices(u8, &.{}, retrieved_code);
}

const HashContext = struct {
    pub fn hash(self: @This(), s: [32]u8) u64 {
        _ = self;
        return std.hash_map.hashString(@as([]const u8, &s));
    }
    pub fn eql(self: @This(), a: [32]u8, b: [32]u8) bool {
        _ = self;
        return std.mem.eql(u8, &a, &b);
    }
};