const std = @import("std");
const testing = std.testing;
const Evm = @import("evm");
const Address = @import("Address").Address;

test {
    std.testing.log_level = .debug;
}

fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x"))
        hex_str[2..]
    else
        hex_str;

    const result = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(result, clean_hex);
    return result;
}

fn readHexFile(allocator: std.mem.Allocator, path: []const u8) ![]u8 {
    const file_content = try std.fs.cwd().readFileAlloc(allocator, path, 1024 * 1024);
    defer allocator.free(file_content);
    
    return hexDecode(allocator, std.mem.trim(u8, file_content, " \n\r\t"));
}

fn deployAndCall(allocator: std.mem.Allocator, bytecode: []const u8, calldata: []const u8) !bool {
    var memory_db = Evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();

    const db_interface = memory_db.to_database_interface();
    var builder = Evm.EvmBuilder.init(allocator, db_interface);
    var vm = try builder.build();
    defer vm.deinit();

    const caller = Address.from_u256(0x1000000000000000000000000000000000000001);
    const caller_balance = std.math.maxInt(u256);
    try vm.state.set_balance(caller, caller_balance);

    // Deploy contract
    const create_result = try vm.create_contract(
        caller,
        0,
        bytecode,
        10_000_000
    );
    defer if (create_result.output) |output| allocator.free(output);

    if (!create_result.success) {
        std.log.debug("Deployment failed - gas_left: {}, success: {}", .{create_result.gas_left, create_result.success});
        return false;
    }

    const contract_address = create_result.address;
    std.log.debug("Contract deployed at: {any}", .{contract_address});

    // Call contract
    const call_result = try vm.call_contract(
        caller,
        contract_address,
        0,
        calldata,
        100_000_000, // 100M gas
        false
    );
    defer if (call_result.output) |output| allocator.free(output);

    std.log.debug("Call result - gas_left: {}, success: {}, output_len: {}", .{
        call_result.gas_left, 
        call_result.success, 
        if (call_result.output) |output| output.len else 0
    });

    return call_result.success;
}

test "benchmark: ten-thousand-hashes (working)" {
    const allocator = testing.allocator;
    
    const bytecode = try readHexFile(allocator, "test/evm/ten_thousand_hashes.hex");
    defer allocator.free(bytecode);
    
    const calldata = try hexDecode(allocator, "30627b7c");
    defer allocator.free(calldata);
    
    const success = try deployAndCall(allocator, bytecode, calldata);
    try testing.expect(success);
}

test "benchmark: erc20.mint (failing)" {
    const allocator = testing.allocator;
    
    const bytecode = try readHexFile(allocator, "test/evm/erc20_mint.hex");
    defer allocator.free(bytecode);
    
    const calldata = try hexDecode(allocator, "30627b7c");
    defer allocator.free(calldata);
    
    const success = try deployAndCall(allocator, bytecode, calldata);
    try testing.expect(success);
}

test "benchmark: erc20.transfer (failing)" {
    const allocator = testing.allocator;
    
    const bytecode = try readHexFile(allocator, "test/evm/erc20_transfer.hex");
    defer allocator.free(bytecode);
    
    const calldata = try hexDecode(allocator, "30627b7c");
    defer allocator.free(calldata);
    
    const success = try deployAndCall(allocator, bytecode, calldata);
    try testing.expect(success);
}

test "benchmark: erc20.approval-transfer (failing)" {
    const allocator = testing.allocator;
    
    const bytecode = try readHexFile(allocator, "test/evm/erc20_approval_transfer.hex");
    defer allocator.free(bytecode);
    
    const calldata = try hexDecode(allocator, "30627b7c");
    defer allocator.free(calldata);
    
    const success = try deployAndCall(allocator, bytecode, calldata);
    try testing.expect(success);
}

test "benchmark: snailtracer (failing)" {
    const allocator = testing.allocator;
    
    const bytecode = try readHexFile(allocator, "test/evm/snailtracer.hex");
    defer allocator.free(bytecode);
    
    const calldata = try hexDecode(allocator, "30627b7c");
    defer allocator.free(calldata);
    
    const success = try deployAndCall(allocator, bytecode, calldata);
    try testing.expect(success);
}