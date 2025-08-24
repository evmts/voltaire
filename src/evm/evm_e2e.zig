const std = @import("std");
const testing = std.testing;
const evm = @import("root.zig");
const primitives = @import("primitives");
const Address = primitives.Address;

test {
    std.testing.log_level = .warn;
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

// Helper to create address from hex string
fn addressFromHex(hex: []const u8) Address {
    const clean_hex = if (std.mem.startsWith(u8, hex, "0x")) hex[2..] else hex;
    var addr: [20]u8 = undefined;
    _ = std.fmt.hexToBytes(&addr, clean_hex) catch unreachable;
    return addr;
}

fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(result, clean_hex);
    return result;
}

fn readCaseFile(allocator: std.mem.Allocator, comptime case_name: []const u8, comptime file_name: []const u8) ![]u8 {
    const path = "/Users/williamcory/guillotine/bench/official/cases/" ++ case_name ++ "/" ++ file_name;
    const file = try std.fs.openFileAbsolute(path, .{});
    defer file.close();
    const content = try file.readToEndAlloc(allocator, 16 * 1024 * 1024);
    const trimmed = std.mem.trim(u8, content, " \t\n\r");
    if (trimmed.ptr == content.ptr and trimmed.len == content.len) {
        return content;
    }
    defer allocator.free(content);
    const result = try allocator.alloc(u8, trimmed.len);
    @memcpy(result, trimmed);
    return result;
}

fn deploy(vm: *evm.Evm, caller: Address, bytecode: []const u8) !Address {
    const create_result = try vm.create_contract(caller, 0, bytecode, 10_000_000);
    if (!create_result.success) {
        std.debug.print("TEST FAILURE: deploy failed, success=false, gas_left={}\n", .{create_result.gas_left});
        return error.DeploymentFailed;
    }
    return create_result.address;
}

// E2E Tests migrated from legacy test files

test "E2E: snailtracer benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case
    const bytecode_hex = try readCaseFile(allocator, "snailtracer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "snailtracer", "calldata.txt");
    defer allocator.free(calldata_hex);

    const bytecode = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(bytecode);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    if (!call_result.success) {
        evm.Log.debug("[snailtracer-e2e] Call failed with gas_left={d}", .{call_result.gas_left});
        evm.Log.debug("[snailtracer-e2e] Contract deployed at: {x}", .{Address.to_u256(contract_address)});
        evm.Log.debug("[snailtracer-e2e] Calldata length: {d}", .{calldata.len});
        if (calldata.len >= 4) {
            evm.Log.debug("[snailtracer-e2e] Function selector: 0x{x:0>8}", .{std.mem.readInt(u32, calldata[0..4], .big)});
        }
    }

    try std.testing.expect(call_result.success);
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 0);

    // Snailtracer should produce output
    if (call_result.output) |output| {
        try std.testing.expect(output.len > 0);
    } else {
        return error.NoOutput;
    }
}

test "E2E: snailtracer high gas consumption" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata
    const bytecode_hex = try readCaseFile(allocator, "snailtracer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "snailtracer", "calldata.txt");
    defer allocator.free(calldata_hex);

    const bytecode = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(bytecode);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    const caller = Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call with gas tracking
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);

    // Snailtracer is computationally intensive - should use significant gas
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 1_000_000); // Should use at least 1M gas
}

test "E2E: ten-thousand-hashes benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case
    const bytecode_hex = try readCaseFile(allocator, "ten-thousand-hashes", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "ten-thousand-hashes", "calldata.txt");
    defer allocator.free(calldata_hex);

    const bytecode = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(bytecode);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = 1_000_000_000,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);
}

test "E2E: ten-thousand-hashes gas consumption" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata
    const bytecode_hex = try readCaseFile(allocator, "ten-thousand-hashes", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "ten-thousand-hashes", "calldata.txt");
    defer allocator.free(calldata_hex);

    const bytecode = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(bytecode);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    const caller = Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 10_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);

    // Verify significant gas was consumed (10,000 hashes should use substantial gas)
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 100_000); // Should use at least 100k gas
}

test "E2E: erc20 transfer benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case (erc20-transfer)
    const bytecode_hex = try readCaseFile(allocator, "erc20-transfer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "erc20-transfer", "calldata.txt");
    defer allocator.free(calldata_hex);

    const bytecode = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(bytecode);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    if (!call_result.success) {
        evm.Log.debug("[erc20-e2e] Call failed with gas_left={d}, initial_gas={d}", .{ call_result.gas_left, initial_gas });
        evm.Log.debug("[erc20-e2e] Contract deployed at: {x}", .{Address.to_u256(contract_address)});
        evm.Log.debug("[erc20-e2e] Calldata length: {d}", .{calldata.len});
        if (calldata.len >= 4) {
            evm.Log.debug("[erc20-e2e] Function selector: 0x{x:0>8}", .{std.mem.readInt(u32, calldata[0..4], .big)});
        }
    }

    try std.testing.expect(call_result.success);
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 0);

    // transfer(address,uint256) should return 32-byte true
    if (call_result.output) |output| {
        try std.testing.expect(output.len >= 32);
        try std.testing.expect(output[output.len - 1] == 1);
    } else {
        return error.MissingReturnData;
    }
}

test "E2E: erc20 mint benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case (erc20-mint)
    const bytecode_hex = try readCaseFile(allocator, "erc20-mint", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "erc20-mint", "calldata.txt");
    defer allocator.free(calldata_hex);

    const bytecode = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(bytecode);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 0);

    // Many mint implementations return bool; accept either true or empty (if non-standard)
    if (call_result.output) |output| {
        if (output.len > 0) {
            try std.testing.expect(output.len >= 32);
            try std.testing.expect(output[output.len - 1] == 1);
        }
    }
}

test "E2E: erc20 approval-transfer benchmark executes successfully" {
    const allocator = std.testing.allocator;

    // Load bytecode and calldata from official case (erc20-approval-transfer)
    const bytecode_hex = try readCaseFile(allocator, "erc20-approval-transfer", "bytecode.txt");
    defer allocator.free(bytecode_hex);
    const calldata_hex = try readCaseFile(allocator, "erc20-approval-transfer", "calldata.txt");
    defer allocator.free(calldata_hex);

    const bytecode = try hexDecode(allocator, bytecode_hex);
    defer allocator.free(bytecode);
    const calldata = try hexDecode(allocator, calldata_hex);
    defer allocator.free(calldata);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Caller and funding
    const caller = primitives.Address.from_u256(0x1000000000000000000000000000000000000001);
    try vm.state.set_balance(caller, std.math.maxInt(u256));

    // Deploy and call
    const contract_address = try deploy(&vm, caller, bytecode);
    const initial_gas: u64 = 100_000_000;
    const params = evm.CallParams{ .call = .{
        .caller = caller,
        .to = contract_address,
        .value = 0,
        .input = calldata,
        .gas = initial_gas,
    } };
    const call_result = try vm.call(params);

    try std.testing.expect(call_result.success);
    const gas_used = initial_gas - call_result.gas_left;
    try std.testing.expect(gas_used > 0);

    // approve->transfer flow should return bool true on the last call
    if (call_result.output) |output| {
        try std.testing.expect(output.len >= 32);
        try std.testing.expect(output[output.len - 1] == 1);
    } else {
        return error.MissingReturnData;
    }
}

// =============================================================================
// REAL-WORLD MAINNET CONTRACT TESTS
// =============================================================================

test "E2E Real-World: USDC balanceOf call" {
    const allocator = std.testing.allocator;

    // USDC contract bytecode (simplified - real contract is much larger)
    // This is a minimal ERC20 implementation for testing purposes
    const usdc_bytecode_hex = \"608060405234801561001057600080fd5b50600436106100575760003560e01c806306fdde031461005c57806318160ddd1461007a57806370a08231146100945780638da5cb5b146100c4578063a9059cbb146100e2575b600080fd5b610064610112565b6040516100719190610199565b60405180910390f35b610082610149565b60405161008e9190610219565b60405180910390f35b6100ae60048036038101906100a9919061026a565b61014f565b6040516100bb9190610219565b60405180910390f35b6100cc610197565b6040516100d991906102a6565b60405180910390f35b6100fc60048036038101906100f791906102f7565b6101bd565b6040516101099190610352565b60405180910390f35b60606040518060400160405280600881526020017f555344436f696e000000000000000000000000000000000000000000000000008152509050919050565b60005490565b60016020528060005260406000206000915090505481565b600060019054906101000a900473ffffffffffffffffffffffffffffffffffffffff1681565b6000816001600085815260200190815260200160002060008282546101e29190610396565b925050819055508160016000600a815260200190815260200160002054610209919061040a565b9050809150509392505050565b6000819050919050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b600061024c82610221565b9050919050565b61025c81610241565b811461026757600080fd5b50565b60008135905061027981610253565b92915050565b6000819050919050565b6102928161027f565b811461029d57600080fd5b50565b6000813590506102af81610289565b92915050565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061036082610289565b915061036b83610289565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff038211156103a05761039f610331565b5b828201905092915050565b60006103b682610289565b91506103c183610289565b9250828210156103d4576103d3610331565b5b828203905092915050565b6000819050919050565b60006103f4826103df565b91506103ff836103df565b92508261040f5761040e610408565b5b828204905092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601260045260246000fd5b600061045482610289565b915061045f83610289565b92508261046f5761046e610408565b5b82820490509291505056\";
    const usdc_bytecode = try hexDecode(allocator, usdc_bytecode_hex);
    defer allocator.free(usdc_bytecode);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Deploy USDC-like contract
    const deployer = addressFromHex(\"0x1234567890123456789012345678901234567890\");
    try vm.state.set_balance(deployer, std.math.maxInt(u256));
    const usdc_address = try deploy(&vm, deployer, usdc_bytecode);

    // Test balanceOf(address) call - function signature: balanceOf(address) -> uint256
    const test_address_hex = \"000000000000000000000000a0b86a33e6ba3b2a6b14b1a0b5b2c1234567890\";
    const calldata = try encodeFunctionCall(allocator, \"balanceOf(address)\", &[_][]const u8{test_address_hex});
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

test "E2E Real-World: WETH deposit simulation" {
    const allocator = std.testing.allocator;

    // Simplified WETH contract bytecode for testing
    const weth_bytecode_hex = \"608060405234801561001057600080fd5b50600436106100575760003560e01c806306fdde0314610055806309048a07146100735780632e1a7d4d1461008f57806370a08231146100ab57806395d89b41146100db575b005b61005d6100f9565b60405161006a9190610199565b60405180910390f35b61007b610130565b6040516100889190610219565b60405180910390f35b6100a960048036038101906100a4919061026a565b610136565b005b6100c560048036038101906100c0919061029f565b61019a565b6040516100d29190610219565b60405180910390f35b6100e36101b2565b6040516100f09190610199565b60405180910390f35b60606040518060400160405280600d81526020017f57726170706564204574686572000000000000000000000000000000000000008152509050919050565b60005481565b806000803373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461018491906102ea565b925050819055506101943461031e565b50505050565b60006020528060005260406000206000915090505481565b60606040518060400160405280600481526020017f574554480000000000000000000000000000000000000000000000000000000081525090509190910190565b600080fd5b600080fd5b6000819050919050565b610209816101f6565b811461021457600080fd5b50565b60008135905061022681610200565b92915050565b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b60006102578261022c565b9050919050565b6102678161024c565b811461027257600080fd5b50565b60008135905061028481610253565b92915050565b6000819050919050565b61029d8161028a565b81146102a857600080fd5b50565b6000813590506102ba81610294565b92915050565b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b600080fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b60006102f5826101f6565b9150610300836101f6565b92508282101561031357610312610331565b5b828203905092915050565b6000610329826101f6565b9150610334836101f6565b9250827fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0382111561036957610368610331565b5b828201905092915050505600\";
    const weth_bytecode = try hexDecode(allocator, weth_bytecode_hex);
    defer allocator.free(weth_bytecode);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Deploy WETH-like contract
    const user = addressFromHex(\"0x742d35Cc6664C97e65Fa3e1F2F6F2b4f4b7e0c11\");
    try vm.state.set_balance(user, std.math.maxInt(u256));
    const weth_address = try deploy(&vm, user, weth_bytecode);

    // Test deposit by sending ETH to the contract (payable fallback)
    const deposit_params = evm.CallParams{ .call = .{
        .caller = user,
        .to = weth_address,
        .value = 1000000000000000000, // 1 ETH in wei
        .input = &[_]u8{}, // Empty calldata triggers fallback
        .gas = 100_000,
    } };
    const deposit_result = try vm.call(deposit_params);

    try std.testing.expect(deposit_result.success);

    // Test balanceOf after deposit
    const balance_calldata = try encodeFunctionCall(allocator, \"balanceOf(address)\", &[_][]const u8{\"742d35Cc6664C97e65Fa3e1F2F6F2b4f4b7e0c11\"});
    defer allocator.free(balance_calldata);

    const balance_params = evm.CallParams{ .call = .{
        .caller = user,
        .to = weth_address,
        .value = 0,
        .input = balance_calldata,
        .gas = 100_000,
    } };
    const balance_result = try vm.call(balance_params);

    try std.testing.expect(balance_result.success);
    if (balance_result.output) |output| {
        try std.testing.expect(output.len >= 32);
        // Balance should be > 0 after deposit
        var is_zero = true;
        for (output[0..32]) |byte| {
            if (byte != 0) {
                is_zero = false;
                break;
            }
        }
        try std.testing.expect(!is_zero);
    }
}

test "E2E Real-World: Uniswap V2 getAmountsOut simulation" {
    const allocator = std.testing.allocator;

    // Simplified Uniswap V2 Router bytecode for testing getAmountsOut
    const uniswap_bytecode_hex = \"608060405234801561001057600080fd5b50600436106100365760003560e01c8063d06ca61f1461003b578063f305d719146100595780638a13c97e14610077575b600080fd5b610043610095565b60405161005091906100d1565b60405180910390f35b61006161009a565b60405161006e91906100d1565b60405180910390f35b61007f61009f565b60405161008c91906100d1565b60405180910390f35b606090565b606090565b606090505600a165627a7a72305820abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890\";
    const uniswap_bytecode = try hexDecode(allocator, uniswap_bytecode_hex);
    defer allocator.free(uniswap_bytecode);

    // Set up VM
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();

    var vm = try evm.Evm.init(allocator, db_interface, null, null, null, null);
    defer vm.deinit();

    // Deploy Uniswap-like router
    const deployer = addressFromHex(\"0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D\"); // Uniswap V2 Router on mainnet
    try vm.state.set_balance(deployer, std.math.maxInt(u256));
    const router_address = try deploy(&vm, deployer, uniswap_bytecode);

    // Test getAmountsOut call (simplified)
    const amount_in = \"0de0b6b3a7640000\"; // 1 ETH in hex
    const path_token1 = \"C02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\"; // WETH
    const path_token2 = \"A0b86a33E6Ba3b2a6b14b1a0b5b2c1234567890\"; // USDC
    
    const calldata = try encodeFunctionCall(allocator, \"getAmountsOut(uint256,address[])\", &[_][]const u8{ amount_in, path_token1, path_token2 });
    defer allocator.free(calldata);

    const params = evm.CallParams{ .call = .{
        .caller = deployer,
        .to = router_address,
        .value = 0,
        .input = calldata,
        .gas = 200_000,
    } };
    const result = try vm.call(params);

    try std.testing.expect(result.success);
    if (result.output) |output| {
        try std.testing.expect(output.len >= 32); // Should return uint256[] array
    }
}