const std = @import("std");
const testing = std.testing;
const evm = @import("root.zig");
const primitives = @import("primitives");
const Address = primitives.Address;

test {
    std.testing.log_level = .warn;
}

// Helper to decode hex strings
fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(result, clean_hex);
    return result;
}

// Helper to create address from hex string
fn addressFromHex(hex: []const u8) Address {
    const clean_hex = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
    var addr: [20]u8 = undefined;
    _ = std.fmt.hexToBytes(&addr, clean_hex) catch unreachable;
    return addr;
}

// Helper to encode function calls using Keccak256
fn encodeFunctionCall(allocator: std.mem.Allocator, signature: []const u8, args: []const []const u8) ![]u8 {
    // Calculate function selector (first 4 bytes of keccak256 hash)
    var hasher = std.crypto.hash.sha3.Keccak256.init(.{});
    hasher.update(signature);
    var hash: [32]u8 = undefined;
    hasher.final(&hash);
    
    var calldata = std.ArrayList(u8).init(allocator);
    try calldata.appendSlice(hash[0..4]); // Function selector
    
    // Append encoded arguments (simplified ABI encoding)
    for (args) |arg| {
        const decoded = try hexDecode(allocator, arg);
        defer allocator.free(decoded);
        
        // Pad to 32 bytes (right-padded for addresses, left-padded for numbers)
        var padded = [_]u8{0} ** 32;
        if (decoded.len <= 32) {
            @memcpy(padded[32 - decoded.len..], decoded);
        }
        try calldata.appendSlice(&padded);
    }
    
    return calldata.toOwnedSlice();
}

fn deploy(vm: *evm.Evm, caller: Address, bytecode: []const u8) !Address {
    const create_result = try vm.create_contract(caller, 0, bytecode, 10_000_000);
    if (!create_result.success) {
        std.debug.print("TEST FAILURE: deploy failed, success=false, gas_left={}\n", .{create_result.gas_left});
        return error.DeploymentFailed;
    }
    return create_result.address;
}

test "E2E Real-World: USDC balanceOf call" {
    const allocator = std.testing.allocator;

    // USDC contract bytecode (simplified - real contract is much larger)
    // This is a minimal ERC20 implementation for testing purposes
    const usdc_bytecode_hex = "608060405234801561001057600080fd5b50600436106100575760003560e01c806306fdde031461005c57806318160ddd1461007a57806370a08231146100945780638da5cb5b146100c4578063a9059cbb146100e2575b600080fd5b610064610112565b6040516100719190610199565b60405180910390f35b610082610149565b60405161008e9190610219565b60405180910390f35b6100ae60048036038101906100a9919061026a565b61014f565b6040516100bb9190610219565b60405180910390f35b6100cc610197565b6040516100d991906102a6565b60405180910390f35b6100fc60048036038101906100f791906102f7565b6101bd565b6040516101099190610352565b60405180910390f35b60606040518060400160405280600881526020017f555344436f696e000000000000000000000000000000000000000000000000008152509050919050565b60005490565b60016020528060005260406000206000915090505481565b600060019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000816001600085815260200190815260200160002060008282546101e29190610396565b925050819055508160016000600a815260200190815260200160002054610209919061040a565b9050809150509392505050565b6000819050919050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061024c82610221565b9050919050565b61025c81610241565b811461026757600080fd5b50565b60008135905061027981610253565b92915050565b6000819050919050565b6102928161027f565b811461029d57600080fd5b50565b6000813590506102af81610289565b92915050565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061036082610289565b915061036b83610289565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156103a05761039f610331565b5b828201905092915050565b60006103b682610289565b91506103c183610289565b9250828210156103d4576103d3610331565b5b828203905092915050565b6000819050919050565b60006103f4826103df565b91506103ff836103df565b92508261040f5761040e610408565b5b828204905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b600061045482610289565b915061045f83610289565b92508261046f5761046e610408565b5b82820490509291505056";
    const usdc_bytecode = try hexDecode(allocator, usdc_bytecode_hex);
    defer allocator.free(usdc_bytecode);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Deploy USDC-like contract
    const deployer = addressFromHex("0x1234567890123456789012345678901234567890");
    try vm.state.set_balance(deployer, std.math.maxInt(u256));
    const usdc_address = try deploy(&vm, deployer, usdc_bytecode);

    // Test balanceOf(address) call - function signature: balanceOf(address) -> uint256
    const test_address_hex = "000000000000000000000000a0b86a33e6ba3b2a6b14b1a0b5b2c1234567890";
    const calldata = try encodeFunctionCall(allocator, "balanceOf(address)", &[_][]const u8{test_address_hex});
    defer allocator.free(calldata);

    const params = evm.CallParams{ .call = .{
        .caller = deployer,
        .to = usdc_address,
        .value = 0,
        .input = calldata,
        .gas = 100_000,
    } };
    const result = try vm.call(params);

    try std.testing.expect(result.success);
    if (result.output) |output| {
        try std.testing.expect(output.len >= 32); // Should return uint256 (32 bytes)
    }
}