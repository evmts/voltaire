const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const primitives = @import("primitives");
const Address = primitives.Address;
const CallParams = evm.CallParams;
const revm_wrapper = @import("revm");

fn minimal_dispatcher_runtime() []const u8 {
    // Same minimal dispatcher as interpreter test:
    // selector 0x11223344 -> return 32-byte 0x01, else revert
    return &[_]u8{
        0x60, 0x00,
        0x35,
        0x60, 0xe0,
        0x1c,
        0x63, 0x11, 0x22, 0x33, 0x44,
        0x14,
        0x60, 0x16,
        0x57,
        0x60, 0x00,
        0x60, 0x00,
        0xfd,
        0x5b,
        0x60, 0x01,
        0x60, 0x1f,
        0x52,
        0x60, 0x20,
        0x60, 0x00,
        0xf3,
    };
}

test "differential: minimal dispatcher parity for match and no-match" {
    const allocator = testing.allocator;

    const bytecode = minimal_dispatcher_runtime();
    const selector_match = [_]u8{ 0x11, 0x22, 0x33, 0x44 };
    const selector_nomatch = [_]u8{ 0xaa, 0xbb, 0xcc, 0xdd };

    // REVM setup
    const revm_settings = revm_wrapper.RevmSettings{};
    var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);
    defer revm_vm.deinit();
    const revm_deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");
    const contract = try Address.from_hex("0x2222222222222222222222222222222222222222");
    try revm_vm.setBalance(revm_deployer, 1_000_000_000_000);
    try revm_vm.setCode(contract, bytecode);

    // Guillotine setup
    const MemoryDatabase = evm.MemoryDatabase;
    var memory_db = MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    const db_interface = memory_db.to_database_interface();
    var vm_instance = try evm.Evm.init(allocator, db_interface, null, null, null, 0, false, null);
    defer vm_instance.deinit();
    try vm_instance.state.set_code(contract, bytecode);

    const gas: u64 = 1_000_000;

    // Case: match
    var revm_match = try revm_vm.call(revm_deployer, contract, 0, &selector_match, gas);
    defer revm_match.deinit();
    const call_match = CallParams{ .call = .{ .caller = contract, .to = contract, .value = 0, .input = &selector_match, .gas = gas } };
    const guillotine_match = try vm_instance.call(call_match);
    defer if (guillotine_match.output) |o| allocator.free(o);

    try testing.expectEqual(revm_match.success, guillotine_match.success);
    if (revm_match.success) {
        try testing.expect(guillotine_match.output != null);
        try testing.expectEqual(@as(usize, revm_match.output.len), guillotine_match.output.?.len);
        try testing.expectEqualSlices(u8, revm_match.output, guillotine_match.output.?);
    }

    // Case: no-match
    var revm_nomatch = try revm_vm.call(revm_deployer, contract, 0, &selector_nomatch, gas);
    defer revm_nomatch.deinit();
    const call_nomatch = CallParams{ .call = .{ .caller = contract, .to = contract, .value = 0, .input = &selector_nomatch, .gas = gas } };
    const guillotine_nomatch = try vm_instance.call(call_nomatch);
    defer if (guillotine_nomatch.output) |o| allocator.free(o);

    try testing.expectEqual(revm_nomatch.success, guillotine_nomatch.success);
    if (revm_nomatch.success) {
        try testing.expect(guillotine_nomatch.output != null);
        try testing.expectEqual(@as(usize, revm_nomatch.output.len), guillotine_nomatch.output.?.len);
        try testing.expectEqualSlices(u8, revm_nomatch.output, guillotine_nomatch.output.?);
    }
}


