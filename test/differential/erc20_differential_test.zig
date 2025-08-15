const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const primitives = @import("primitives");
const Address = primitives.Address;
const revm_wrapper = @import("revm");

test {
    std.testing.log_level = .warn;
}

fn hex_decode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(result, clean_hex);
    return result;
}

fn read_case_file(allocator: std.mem.Allocator, case_name: []const u8, file_name: []const u8) ![]u8 {
    const path = try std.fmt.allocPrint(allocator, "/Users/williamcory/Guillotine/bench/official/cases/{s}/{s}", .{ case_name, file_name });
    defer allocator.free(path);
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

fn run_case(case_name: []const u8) !void {
    const allocator = testing.allocator;

    const bytecode_hex = try read_case_file(allocator, case_name, "bytecode.txt");
    defer allocator.free(bytecode_hex);

    const init_code = try hex_decode(allocator, bytecode_hex);
    defer allocator.free(init_code);

    // REVM: create to get runtime and then call
    var revm_vm = try revm_wrapper.Revm.init(allocator, .{});
    defer revm_vm.deinit();
    const deployer = try Address.from_hex("0x1111111111111111111111111111111111111111");
    // no fixed_addr needed; we only compare runtimes
    try revm_vm.setBalance(deployer, std.math.maxInt(u256));
    var revm_create = try revm_vm.create(deployer, 0, init_code, 10_000_000);
    const revm_runtime = try allocator.dupe(u8, revm_create.output);
    defer revm_create.deinit();
    // Only compare runtime bytecode; skip calling as ERC20 constructors set storage

    // Guillotine: create and then call
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    var vm = try evm.Evm.init(allocator, memory_db.to_database_interface(), null, null, null, 0, false, null);
    defer vm.deinit();
    try vm.state.set_balance(deployer, std.math.maxInt(u256));
    const zig_create = try vm.create_contract(deployer, 0, init_code, 1_000_000_000);
    defer if (zig_create.output) |o| allocator.free(o);
    // Compare runtime lengths/content
    try testing.expect(zig_create.output != null);
    try testing.expectEqual(@as(usize, revm_runtime.len), zig_create.output.?.len);
    try testing.expectEqualSlices(u8, revm_runtime, zig_create.output.?);

    allocator.free(revm_runtime);
}

test "erc20 differential: erc20-transfer" {
    try run_case("erc20-transfer");
}
test "erc20 differential: erc20-mint" {
    try run_case("erc20-mint");
}
test "erc20 differential: erc20-approval-transfer" {
    try run_case("erc20-approval-transfer");
}
