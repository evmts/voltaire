const std = @import("std");
const testing = std.testing;
const evm = @import("root.zig");
const primitives = @import("primitives");
const Address = primitives.Address;
const revm_wrapper = @import("revm");

test {
    std.testing.log_level = .warn;
}

/// Execution result from any EVM implementation
pub const ExecutionResult = struct {
    success: bool,
    gas_left: u64,
    output: ?[]const u8,
    allocator: std.mem.Allocator,

    pub fn deinit(self: *ExecutionResult) void {
        if (self.output) |output| {
            self.allocator.free(output);
        }
    }
};

/// Differential test results comparing all three EVM implementations
pub const DifferentialResult = struct {
    revm: ExecutionResult,
    simple: ExecutionResult,
    advanced: ExecutionResult,

    pub fn deinit(self: *DifferentialResult) void {
        self.revm.deinit();
        self.simple.deinit();
        self.advanced.deinit();
    }

    /// Verify that all three implementations produce identical results
    pub fn assertEqual(self: *const DifferentialResult) !void {
        // All should have same success status
        try testing.expectEqual(self.revm.success, self.simple.success);
        try testing.expectEqual(self.revm.success, self.advanced.success);

        // If successful, all should have same output
        if (self.revm.success and self.simple.success and self.advanced.success) {
            const revm_output = self.revm.output orelse &[_]u8{};
            const simple_output = self.simple.output orelse &[_]u8{};
            const advanced_output = self.advanced.output orelse &[_]u8{};

            // All outputs should have same length
            try testing.expectEqual(revm_output.len, simple_output.len);
            try testing.expectEqual(revm_output.len, advanced_output.len);

            // All outputs should have same content
            try testing.expectEqualSlices(u8, revm_output, simple_output);
            try testing.expectEqualSlices(u8, revm_output, advanced_output);
        }
    }
};

/// Single abstraction for running the same test on all three EVM implementations
pub const DifferentialTestHarness = struct {
    allocator: std.mem.Allocator,
    revm_vm: revm_wrapper.Revm,
    simple_vm: evm.Evm,
    advanced_vm: evm.Evm,

    /// Initialize the test harness with all three EVM implementations
    pub fn init(allocator: std.mem.Allocator) !DifferentialTestHarness {
        // Initialize REVM
        const revm_settings = revm_wrapper.RevmSettings{};
        var revm_vm = try revm_wrapper.Revm.init(allocator, revm_settings);

        // Initialize simple EVM (minimal interpreter)
        var simple_memory_db = evm.MemoryDatabase.init(allocator);
        var simple_vm = try evm.Evm.init(
            allocator, 
            simple_memory_db.to_database_interface(), 
            null, 
            null, 
            null, 
            null
        );

        // Initialize advanced EVM (advanced interpreter) 
        var advanced_memory_db = evm.MemoryDatabase.init(allocator);
        var advanced_vm = try evm.Evm.init(
            allocator, 
            advanced_memory_db.to_database_interface(), 
            null, 
            null, 
            null, 
            null
        );

        return DifferentialTestHarness{
            .allocator = allocator,
            .revm_vm = revm_vm,
            .simple_vm = simple_vm,
            .advanced_vm = advanced_vm,
        };
    }

    pub fn deinit(self: *DifferentialTestHarness) void {
        self.revm_vm.deinit();
        self.simple_vm.deinit();
        self.advanced_vm.deinit();
    }

    /// Execute the same transaction on all three EVMs and return comparative results
    pub fn execute(
        self: *DifferentialTestHarness,
        caller: Address,
        to: Address,
        value: u256,
        input: []const u8,
        gas_limit: u64,
    ) !DifferentialResult {
        // Setup: Fund caller and set bytecode on all three EVMs
        try self.revm_vm.setBalance(caller, 10_000_000);
        try self.simple_vm.state.set_balance(caller, 10_000_000);
        try self.advanced_vm.state.set_balance(caller, 10_000_000);

        // Execute on REVM (baseline)
        var revm_result = try self.revm_vm.call(caller, to, value, input, gas_limit);
        const revm_output_copy = if (revm_result.output.len > 0) 
            try self.allocator.dupe(u8, revm_result.output) 
        else 
            null;
        defer revm_result.deinit();
        const revm_execution = ExecutionResult{
            .success = revm_result.success,
            .gas_left = gas_limit - revm_result.gas_used,
            .output = revm_output_copy,
            .allocator = self.allocator,
        };

        // Execute on simple EVM
        const simple_params = evm.CallParams{ .call = .{
            .caller = caller,
            .to = to,
            .value = value,
            .input = input,
            .gas = gas_limit,
        } };
        const simple_result = try self.simple_vm.call(simple_params);
        const simple_output_copy = if (simple_result.output) |output| 
            try self.allocator.dupe(u8, output) 
        else 
            null;
        const simple_execution = ExecutionResult{
            .success = simple_result.success,
            .gas_left = simple_result.gas_left,
            .output = simple_output_copy,
            .allocator = self.allocator,
        };

        // Execute on advanced EVM
        const advanced_params = evm.CallParams{ .call = .{
            .caller = caller,
            .to = to,
            .value = value,
            .input = input,
            .gas = gas_limit,
        } };
        const advanced_result = try self.advanced_vm.call(advanced_params);
        const advanced_output_copy = if (advanced_result.output) |output| 
            try self.allocator.dupe(u8, output) 
        else 
            null;
        const advanced_execution = ExecutionResult{
            .success = advanced_result.success,
            .gas_left = advanced_result.gas_left,
            .output = advanced_output_copy,
            .allocator = self.allocator,
        };

        return DifferentialResult{
            .revm = revm_execution,
            .simple = simple_execution,
            .advanced = advanced_execution,
        };
    }

    /// Set bytecode for a contract address on all three EVMs
    pub fn setCode(self: *DifferentialTestHarness, address: Address, code: []const u8) !void {
        try self.revm_vm.setCode(address, code);
        try self.simple_vm.state.set_code(address, code);
        try self.advanced_vm.state.set_code(address, code);
    }

    /// Deploy a contract on all three EVMs and return the address
    pub fn deployContract(
        self: *DifferentialTestHarness,
        deployer: Address,
        init_code: []const u8,
        gas_limit: u64,
    ) !struct { address: Address, results: DifferentialResult } {
        // Setup: Fund deployer
        try self.revm_vm.setBalance(deployer, 10_000_000);
        try self.simple_vm.state.set_balance(deployer, 10_000_000);
        try self.advanced_vm.state.set_balance(deployer, 10_000_000);

        // Deploy on REVM (baseline)
        var revm_create = try self.revm_vm.create(deployer, 0, init_code, gas_limit);
        const revm_output_copy = if (revm_create.output.len > 0)
            try self.allocator.dupe(u8, revm_create.output)
        else
            null;
        defer revm_create.deinit();
        const revm_execution = ExecutionResult{
            .success = revm_create.success,
            .gas_left = gas_limit - revm_create.gas_used,
            .output = revm_output_copy,
            .allocator = self.allocator,
        };

        // Deploy on simple EVM
        const simple_create_result = try self.simple_vm.create_contract(deployer, 0, init_code, gas_limit);
        const simple_output_copy = if (simple_create_result.output) |output|
            try self.allocator.dupe(u8, output)
        else
            null;
        const simple_execution = ExecutionResult{
            .success = simple_create_result.success,
            .gas_left = simple_create_result.gas_left,
            .output = simple_output_copy,
            .allocator = self.allocator,
        };

        // Deploy on advanced EVM
        const advanced_create_result = try self.advanced_vm.create_contract(deployer, 0, init_code, gas_limit);
        const advanced_output_copy = if (advanced_create_result.output) |output|
            try self.allocator.dupe(u8, output)
        else
            null;
        const advanced_execution = ExecutionResult{
            .success = advanced_create_result.success,
            .gas_left = advanced_create_result.gas_left,
            .output = advanced_output_copy,
            .allocator = self.allocator,
        };

        // Use the address from the simple EVM (they should all be the same)
        const contract_address = simple_create_result.address;

        return .{
            .address = contract_address,
            .results = DifferentialResult{
                .revm = revm_execution,
                .simple = simple_execution,
                .advanced = advanced_execution,
            },
        };
    }
};

/// Helper function for reading case files
fn readCaseFile(allocator: std.mem.Allocator, case_name: []const u8, file_name: []const u8) ![]u8 {
    const path = try std.fmt.allocPrint(allocator, "/Users/williamcory/guillotine/bench/official/cases/{s}/{s}", .{ case_name, file_name });
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

/// Helper function for hex decoding
fn hexDecode(allocator: std.mem.Allocator, hex_str: []const u8) ![]u8 {
    const clean_hex = if (std.mem.startsWith(u8, hex_str, "0x")) hex_str[2..] else hex_str;
    const result = try allocator.alloc(u8, clean_hex.len / 2);
    _ = try std.fmt.hexToBytes(result, clean_hex);
    return result;
}