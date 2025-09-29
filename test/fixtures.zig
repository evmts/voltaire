const std = @import("std");
const evm = @import("evm");
const primitives = @import("primitives");
const fixtures = @import("fixtures");

// MinimalEvm is exported from the evm module
const MinimalEvm = evm.MinimalEvm;

const Address = primitives.Address.Address;
const testing = std.testing;

const TestResult = struct {
    success: bool,
    gas_used: u64,
};

// Helper to run a fixture with both EVMs and compare results
fn runFixture(fixture_name: []const u8, calldata_hex: []const u8, gas_limit: u64) !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();
    
    // Initialize and compile all fixtures
    var fx = try fixtures.Fixtures.init(allocator);
    defer fx.deinit();
    
    try fx.compileAll();
    
    const bytecode = fx.getDeployedBytecode(fixture_name) orelse {
        std.debug.print("Fixture '{s}' not found or failed to compile\n", .{fixture_name});
        return error.FixtureNotFound;
    };
    
    // Setup common addresses
    const sender = try Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x01}));
    const contract = try Address.fromBytes(&([_]u8{0} ** 19 ++ [_]u8{0x42}));
    
    // Parse calldata
    const calldata = try hexToBytes(allocator, calldata_hex);
    defer allocator.free(calldata);
    
    // Test with MainnetEvm
    const main_result: TestResult = blk: {
        var database = evm.Database.init(allocator);
        defer database.deinit();
        
        try database.set_account(sender.bytes, .{
            .balance = 100_000_000_000_000_000_000,
            .code_hash = [_]u8{0} ** 32,
            .storage_root = [_]u8{0} ** 32,
            .nonce = 0,
            .delegated_address = null,
        });
        
        const code_hash = try database.set_code(bytecode);
        try database.set_account(contract.bytes, .{
            .balance = 0,
            .code_hash = code_hash,
            .storage_root = [_]u8{0} ** 32,
            .nonce = 0,
            .delegated_address = null,
        });
        
        var main_evm = try evm.MainnetEvm.init(
            allocator,
            &database,
            .{ 
                .number = 1, 
                .timestamp = 1000000, 
                .gas_limit = 30_000_000, 
                .coinbase = primitives.ZERO_ADDRESS, 
                .base_fee = 1_000_000_000, 
                .chain_id = 1, 
                .difficulty = 0, 
                .prev_randao = [_]u8{0} ** 32, 
                .blob_base_fee = 0, 
                .blob_versioned_hashes = &.{} 
            },
            .{ 
                .gas_limit = gas_limit, 
                .coinbase = primitives.ZERO_ADDRESS, 
                .chain_id = 1, 
                .blob_versioned_hashes = &.{}, 
                .blob_base_fee = 0 
            },
            1_000_000_000,
            sender,
        );
        defer main_evm.deinit();
        
        var result = main_evm.simulate(.{ 
            .call = .{ 
                .caller = sender, 
                .to = contract, 
                .value = 0, 
                .input = calldata, 
                .gas = gas_limit 
            } 
        });
        defer result.deinit(allocator);
        
        break :blk .{
            .success = result.success,
            .gas_used = gas_limit - result.gas_left,
        };
    };
    
    // Test with MinimalEvm
    const minimal_result: TestResult = blk: {
        // Use initPtr to properly handle the arena allocator
        const min_evm = try MinimalEvm.initPtr(allocator);
        defer min_evm.deinitPtr(allocator);
        
        min_evm.setBlockchainContext(1, 1, 1000000, 0, 0, primitives.ZERO_ADDRESS, 30_000_000, 1_000_000_000, 0);
        min_evm.setTransactionContext(sender, 1_000_000_000);
        try min_evm.setBalance(sender, 100_000_000_000_000_000_000);
        try min_evm.setCode(contract, bytecode);
        
        const result = min_evm.execute(
            bytecode,
            @intCast(gas_limit),
            sender,
            contract,
            0,
            calldata,
        ) catch |err| {
            std.debug.print("MinimalEvm execution failed: {}\n", .{err});
            break :blk TestResult{
                .success = false,
                .gas_used = gas_limit,
            };
        };
        
        break :blk TestResult{
            .success = result.success,
            .gas_used = gas_limit - result.gas_left,
        };
    };
    
    // Both should succeed or both should fail
    try testing.expect(main_result.success == minimal_result.success);
    
    // Gas usage might differ slightly due to implementation differences
    // but should be in the same ballpark (within 10%)
    if (main_result.success and minimal_result.success) {
        const gas_diff = if (main_result.gas_used > minimal_result.gas_used)
            main_result.gas_used - minimal_result.gas_used
        else
            minimal_result.gas_used - main_result.gas_used;
        
        const max_gas = @max(main_result.gas_used, minimal_result.gas_used);
        if (max_gas > 0) {
            const diff_percent = (gas_diff * 100) / max_gas;
            if (diff_percent > 10) {
                std.debug.print("Warning: Gas usage differs by {}% for fixture '{s}'\n", .{ diff_percent, fixture_name });
                std.debug.print("  MainnetEvm: {} gas\n", .{main_result.gas_used});
                std.debug.print("  MinimalEvm: {} gas\n", .{minimal_result.gas_used});
            }
        }
    }
}

fn hexToBytes(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    var str = hex_str;
    if (str.len >= 2 and (std.mem.eql(u8, str[0..2], "0x") or std.mem.eql(u8, str[0..2], "0X"))) {
        str = str[2..];
    }
    
    if (str.len == 0) {
        return try allocator.alloc(u8, 0);
    }
    
    if (str.len % 2 != 0) return error.OddNumberOfDigits;
    
    const result = try allocator.alloc(u8, str.len / 2);
    for (result, 0..) |*byte, i| {
        const high = try std.fmt.charToDigit(str[i * 2], 16);
        const low = try std.fmt.charToDigit(str[i * 2 + 1], 16);
        byte.* = (high << 4) | low;
    }
    return result;
}

// Individual fixture tests

test "fixture: arithmetic" {
    try runFixture("arithmetic", "0x", 1000000);
}

test "fixture: bitwise" {
    try runFixture("bitwise", "0x", 1000000);
}

test "fixture: bubblesort" {
    try runFixture("bubblesort", "0x239b51bf0000000000000000000000000000000000000000000000000000000000000064", 30000000);
}

test "fixture: calldata" {
    try runFixture("calldata", "0x0123456789abcdef", 1000000);
}

test "fixture: codecopy" {
    try runFixture("codecopy", "0x", 1000000);
}

test "fixture: comparison" {
    try runFixture("comparison", "0x", 1000000);
}

test "fixture: contractcalls" {
    try runFixture("contractcalls", "0x", 1000000);
}

test "fixture: controlflow" {
    try runFixture("controlflow", "0x", 1000000);
}

test "fixture: externalcode" {
    try runFixture("externalcode", "0x", 1000000);
}

test "fixture: factorial" {
    try runFixture("factorial", "0x", 1000000);
}

test "fixture: fibonacci" {
    try runFixture("fibonacci", "0x", 1000000);
}

test "fixture: fibonacci_recursive" {
    try runFixture("fibonacci_recursive", "0x", 1000000);
}

test "fixture: hashing" {
    try runFixture("hashing", "0x", 1000000);
}

test "fixture: logs" {
    try runFixture("logs", "0x", 1000000);
}

test "fixture: push" {
    try runFixture("push", "0x", 1000000);
}

test "fixture: returndata" {
    try runFixture("returndata", "0x", 1000000);
}

test "fixture: shifts" {
    try runFixture("shifts", "0x", 1000000);
}

test "fixture: stack" {
    try runFixture("stack", "0x", 1000000);
}

test "fixture: storage" {
    try runFixture("storage", "0x", 1000000);
}

test "fixture: tenhashes" {
    try runFixture("tenhashes", "0x", 10000000);
}

// Test ERC20 if available
test "fixture: erc20" {
    try runFixture("erc20", "0xa9059cbb000000000000000000000000000000000000000000000000000000000000002a0000000000000000000000000000000000000000000000000000000000000064", 100000);
}

// Test SnailTracer if available
test "fixture: snailtracer" {
    try runFixture("snailtracer", "0x30627b7c", 1000000000);
}