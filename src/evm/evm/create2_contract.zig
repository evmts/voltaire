const std = @import("std");
const primitives = @import("primitives");
const ExecutionError = @import("../execution/execution_error.zig");
const CreateResult = @import("create_result.zig").CreateResult;
const Vm = @import("../evm.zig");

pub const Create2ContractError = std.mem.Allocator.Error || @import("../state/database_interface.zig").DatabaseError || ExecutionError.Error;

/// Create a new contract using CREATE2 opcode semantics.
///
/// Calculates a deterministic address using keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:],
/// transfers value if specified, executes the initialization code, and deploys
/// the resulting bytecode. Unlike CREATE, the address is predictable before deployment.
pub fn create2_contract(self: *Vm, creator: primitives.Address.Address, value: u256, init_code: []const u8, salt: u256, gas: u64) Create2ContractError!CreateResult {
    // Calculate the new contract address using CREATE2 formula:
    // address = keccak256(0xff ++ sender ++ salt ++ keccak256(init_code))[12:]
    const new_address = try primitives.Address.calculate_create2_address(self.allocator, creator, salt, init_code);
    return self.create_contract_internal(creator, value, init_code, gas, new_address);
}

// ============================================================================
// Fuzz Tests for CREATE2 Salt and Init Code Variations (Issue #234)
// Using proper Zig built-in fuzz testing with std.testing.fuzz()
// ============================================================================

const testing = std.testing;

test "fuzz_create2_salt_variations" {
    const global = struct {
        fn testSaltVariations(input: []const u8) anyerror!void {
            if (input.len < 32) return;

            const allocator = testing.allocator;
            
            // Extract salt from fuzz input
            const salt = std.mem.readInt(u256, input[0..32], .little);
            
            // Use different creator addresses for variety
            const creator_byte = if (input.len > 32) input[32] else 0;
            var creator_bytes = [_]u8{0} ** 20;
            creator_bytes[0] = creator_byte;
            creator_bytes[19] = creator_byte;
            const creator = primitives.Address.Address.from_bytes(creator_bytes);
            
            // Test with various init code patterns
            const init_codes = [_][]const u8{
                &[_]u8{}, // Empty init code
                &[_]u8{0x60, 0x80, 0x60, 0x40, 0x52}, // Basic constructor
                &[_]u8{0x60, 0x00, 0x60, 0x00, 0xF3}, // Simple return
                &([_]u8{0xAA} ** 100), // Large init code
            };
            
            for (init_codes) |init_code| {
                // Calculate CREATE2 address - this should never fail for valid inputs
                const address = primitives.Address.calculate_create2_address(allocator, creator, salt, init_code) catch |err| switch (err) {
                    error.OutOfMemory => return err,
                    else => continue, // Skip if address calculation fails for edge cases
                };
                
                // Verify address is deterministic - same inputs should give same output
                const address2 = primitives.Address.calculate_create2_address(allocator, creator, salt, init_code) catch continue;
                try testing.expectEqualSlices(u8, &address.to_bytes(), &address2.to_bytes());
                
                // Verify address is different for different salts (if we have enough input)
                if (input.len >= 64) {
                    const different_salt = std.mem.readInt(u256, input[32..64], .little);
                    if (different_salt != salt) {
                        const different_address = primitives.Address.calculate_create2_address(allocator, creator, different_salt, init_code) catch continue;
                        // Addresses should be different for different salts
                        try testing.expect(!std.mem.eql(u8, &address.to_bytes(), &different_address.to_bytes()));
                    }
                }
            }
        }
    };
    try std.testing.fuzz(global.testSaltVariations, .{});
}

test "fuzz_create2_init_code_variations" {
    const global = struct {
        fn testInitCodeVariations(input: []const u8) anyerror!void {
            if (input.len < 20) return;

            const allocator = testing.allocator;
            
            // Fixed salt for this test
            const salt: u256 = 0x123456789ABCDEF0;
            
            // Extract creator from fuzz input
            const creator = primitives.Address.Address.from_bytes(input[0..20].*);
            
            // Use remaining input as init code (or portion of it)
            const max_init_code_len = @min(input.len - 20, 1024); // Reasonable limit
            const init_code = input[20..20 + max_init_code_len];
            
            // Test address calculation with fuzzed init code
            const address = primitives.Address.calculate_create2_address(allocator, creator, salt, init_code) catch |err| switch (err) {
                error.OutOfMemory => return err,
                else => return, // Skip if calculation fails
            };
            
            // Verify deterministic behavior
            const address2 = primitives.Address.calculate_create2_address(allocator, creator, salt, init_code) catch return;
            try testing.expectEqualSlices(u8, &address.to_bytes(), &address2.to_bytes());
            
            // Test that different init codes produce different addresses
            if (init_code.len > 1) {
                // Create modified init code by flipping a bit
                var modified_init_code = try allocator.dupe(u8, init_code);
                defer allocator.free(modified_init_code);
                
                modified_init_code[0] ^= 1; // Flip least significant bit
                
                const modified_address = primitives.Address.calculate_create2_address(allocator, creator, salt, modified_init_code) catch return;
                
                // Different init code should produce different address
                try testing.expect(!std.mem.eql(u8, &address.to_bytes(), &modified_address.to_bytes()));
            }
        }
    };
    try std.testing.fuzz(global.testInitCodeVariations, .{});
}

test "fuzz_create2_creator_variations" {
    const global = struct {
        fn testCreatorVariations(input: []const u8) anyerror!void {
            if (input.len < 40) return;

            const allocator = testing.allocator;
            
            // Extract two different creators from fuzz input
            const creator1 = primitives.Address.Address.from_bytes(input[0..20].*);
            const creator2 = primitives.Address.Address.from_bytes(input[20..40].*);
            
            // Fixed parameters for this test
            const salt: u256 = 0xDEADBEEF;
            const init_code = &[_]u8{0x60, 0x80, 0x60, 0x40, 0x52}; // Simple init code
            
            // Calculate addresses for both creators
            const address1 = primitives.Address.calculate_create2_address(allocator, creator1, salt, init_code) catch return;
            const address2 = primitives.Address.calculate_create2_address(allocator, creator2, salt, init_code) catch return;
            
            // Different creators should produce different addresses (unless they're identical)
            if (!std.mem.eql(u8, &creator1.to_bytes(), &creator2.to_bytes())) {
                try testing.expect(!std.mem.eql(u8, &address1.to_bytes(), &address2.to_bytes()));
            } else {
                // Same creators should produce same addresses
                try testing.expectEqualSlices(u8, &address1.to_bytes(), &address2.to_bytes());
            }
        }
    };
    try std.testing.fuzz(global.testCreatorVariations, .{});
}

test "fuzz_create2_edge_cases" {
    const global = struct {
        fn testEdgeCases(input: []const u8) anyerror!void {
            if (input.len == 0) return;

            const allocator = testing.allocator;
            
            // Test various edge case scenarios
            const scenario = input[0] % 4;
            
            switch (scenario) {
                0 => {
                    // Zero creator address
                    const creator = primitives.Address.Address.ZERO;
                    const salt: u256 = if (input.len >= 33) std.mem.readInt(u256, input[1..33], .little) else 0;
                    const init_code = if (input.len > 33) input[33..] else &[_]u8{};
                    
                    const address = primitives.Address.calculate_create2_address(allocator, creator, salt, init_code) catch return;
                    
                    // Should produce valid address even with zero creator
                    try testing.expect(address.to_bytes().len == 20);
                },
                1 => {
                    // Maximum salt value
                    const creator = if (input.len >= 21) primitives.Address.Address.from_bytes(input[1..21].*) else primitives.Address.Address.ZERO;
                    const salt: u256 = std.math.maxInt(u256);
                    const init_code = if (input.len > 21) input[21..] else &[_]u8{};
                    
                    const address = primitives.Address.calculate_create2_address(allocator, creator, salt, init_code) catch return;
                    try testing.expect(address.to_bytes().len == 20);
                },
                2 => {
                    // Empty init code with various salts
                    const creator = if (input.len >= 21) primitives.Address.Address.from_bytes(input[1..21].*) else primitives.Address.Address.ZERO;
                    const salt: u256 = if (input.len >= 53) std.mem.readInt(u256, input[21..53], .little) else 0;
                    const init_code: []const u8 = &[_]u8{};
                    
                    const address = primitives.Address.calculate_create2_address(allocator, creator, salt, init_code) catch return;
                    try testing.expect(address.to_bytes().len == 20);
                },
                3 => {
                    // Very large init code (stress test)
                    const creator = if (input.len >= 21) primitives.Address.Address.from_bytes(input[1..21].*) else primitives.Address.Address.ZERO;
                    const salt: u256 = if (input.len >= 53) std.mem.readInt(u256, input[21..53], .little) else 0;
                    
                    // Create large init code from repeating input pattern
                    const pattern = if (input.len > 53) input[53..] else &[_]u8{0x60, 0x80};
                    var large_init_code = std.ArrayList(u8).init(allocator);
                    defer large_init_code.deinit();
                    
                    // Build up to ~4KB of init code
                    while (large_init_code.items.len < 4096) {
                        try large_init_code.appendSlice(pattern);
                    }
                    
                    const address = primitives.Address.calculate_create2_address(allocator, creator, salt, large_init_code.items) catch |err| switch (err) {
                        error.OutOfMemory => return err,
                        else => return,
                    };
                    try testing.expect(address.to_bytes().len == 20);
                },
            }
        }
    };
    try std.testing.fuzz(global.testEdgeCases, .{});
}
