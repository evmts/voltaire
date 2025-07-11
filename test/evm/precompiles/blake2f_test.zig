const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const blake2f = evm.precompiles.blake2f;
const PrecompileOutput = evm.precompiles.PrecompileOutput;

// Test basic BLAKE2f functionality with the official test vector from EIP-152
test "BLAKE2f official test vector" {
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    
    // Test vector from EIP-152:
    // rounds = 12 (0x0000000c in big-endian)
    // h = [0x48c9bdf267e6096a3ba7ca8485ae67bb2bf894fe72f36e3cf1361d5f3af54fa5,
    //      0xd182e6ad7f520e511f6c3e2b8c68059b6bbd41fbabd9831f79217e1319cde05b]
    // m = all zeros except first 3 bytes are "abc"
    // t_0 = 3, t_1 = 0, f = 1
    
    var input = try allocator.alloc(u8, 213);
    defer allocator.free(input);
    @memset(input, 0);
    
    // Set rounds = 12 (big-endian)
    input[3] = 12;
    
    // Set h (8 x 64-bit little-endian words)
    // Default BLAKE2b-512 IV values
    const h0: u64 = 0x6a09e667f3bcc908;
    const h1: u64 = 0xbb67ae8584caa73b;
    const h2: u64 = 0x3c6ef372fe94f82b;
    const h3: u64 = 0xa54ff53a5f1d36f1;
    const h4: u64 = 0x510e527fade682d1;
    const h5: u64 = 0x9b05688c2b3e6c1f;
    const h6: u64 = 0x1f83d9abfb41bd6b;
    const h7: u64 = 0x5be0cd19137e2179;
    
    // Write h values as little-endian
    std.mem.writeInt(u64, input[4..12], h0, .little);
    std.mem.writeInt(u64, input[12..20], h1, .little);
    std.mem.writeInt(u64, input[20..28], h2, .little);
    std.mem.writeInt(u64, input[28..36], h3, .little);
    std.mem.writeInt(u64, input[36..44], h4, .little);
    std.mem.writeInt(u64, input[44..52], h5, .little);
    std.mem.writeInt(u64, input[52..60], h6, .little);
    std.mem.writeInt(u64, input[60..68], h7, .little);
    
    // Set m (message block - "abc" followed by zeros)
    input[68] = 'a';
    input[69] = 'b';
    input[70] = 'c';
    // Rest of m is already zero
    
    // Set t_0 = 3 (little-endian)
    input[196] = 3;
    
    // Set t_1 = 0 (already zero)
    
    // Set f = 1 (final block flag)
    input[212] = 1;
    
    const output = try allocator.alloc(u8, 64);
    defer allocator.free(output);
    
    const result = blake2f.execute(input, output, 10000);
    
    // For now, just test that execution doesn't fail
    // We'll add the expected output once we implement the compression
    try testing.expect(result.is_success());
    try testing.expectEqual(@as(usize, 64), result.get_output_size());
}

// Test BLAKE2f with invalid input size (too short)
test "BLAKE2f invalid input size" {
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    
    const input = try allocator.alloc(u8, 100); // Too short, should be 213
    defer allocator.free(input);
    @memset(input, 0);
    
    const output = try allocator.alloc(u8, 64);
    defer allocator.free(output);
    
    const result = blake2f.execute(input, output, 10000);
    
    try testing.expect(result.is_failure());
}

// Test BLAKE2f with invalid final flag
test "BLAKE2f invalid final flag" {
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    
    var input = try allocator.alloc(u8, 213);
    defer allocator.free(input);
    @memset(input, 0);
    
    // Set valid rounds
    input[3] = 12;
    
    // Set invalid final flag (should be 0 or 1)
    input[212] = 2;
    
    const output = try allocator.alloc(u8, 64);
    defer allocator.free(output);
    
    const result = blake2f.execute(input, output, 10000);
    
    try testing.expect(result.is_failure());
}

// Test BLAKE2f gas calculation
test "BLAKE2f gas calculation" {
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    
    var input = try allocator.alloc(u8, 213);
    defer allocator.free(input);
    @memset(input, 0);
    
    // Set rounds = 12
    input[3] = 12;
    
    // Set valid final flag
    input[212] = 1;
    
    const output = try allocator.alloc(u8, 64);
    defer allocator.free(output);
    
    const result = blake2f.execute(input, output, 10000);
    
    try testing.expect(result.is_success());
    // Gas should be 12 * 1 = 12
    try testing.expectEqual(@as(u64, 12), result.get_gas_used());
}

// Test BLAKE2f insufficient gas
test "BLAKE2f insufficient gas" {
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    
    var input = try allocator.alloc(u8, 213);
    defer allocator.free(input);
    @memset(input, 0);
    
    // Set rounds = 100 (requires 100 gas)
    input[2] = 0;
    input[3] = 100;
    
    // Set valid final flag
    input[212] = 1;
    
    const output = try allocator.alloc(u8, 64);
    defer allocator.free(output);
    
    // Try with insufficient gas
    const result = blake2f.execute(input, output, 50); // Only 50 gas available
    
    try testing.expect(result.is_failure());
}

// Test BLAKE2f output buffer too small
test "BLAKE2f output buffer too small" {
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    
    var input = try allocator.alloc(u8, 213);
    defer allocator.free(input);
    @memset(input, 0);
    
    // Set valid input
    input[3] = 12;
    input[212] = 1;
    
    const output = try allocator.alloc(u8, 32); // Too small, should be 64
    defer allocator.free(output);
    
    const result = blake2f.execute(input, output, 10000);
    
    try testing.expect(result.is_failure());
}

// Test BLAKE2f with zero rounds
test "BLAKE2f zero rounds" {
    var arena = std.heap.ArenaAllocator.init(testing.allocator);
    defer arena.deinit();
    const allocator = arena.allocator();
    
    var input = try allocator.alloc(u8, 213);
    defer allocator.free(input);
    @memset(input, 0);
    
    // Set rounds = 0 (should be valid and return input state)
    // rounds is already 0 from memset
    
    // Set valid final flag
    input[212] = 1;
    
    const output = try allocator.alloc(u8, 64);
    defer allocator.free(output);
    
    const result = blake2f.execute(input, output, 10000);
    
    try testing.expect(result.is_success());
    // Gas should be 0 * 1 = 0, but there might be a minimum
    try testing.expectEqual(@as(u64, 0), result.get_gas_used());
}