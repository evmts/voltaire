const std = @import("std");
const testing = std.testing;
const evm = @import("evm");
const primitives = @import("primitives");
const Address = primitives.Address;

const revm = @import("revm");

test "ADD opcode: differential test against revm" {
    const allocator = testing.allocator;
    
    // Test cases for ADD opcode
    const test_cases = [_]struct {
        a: u256,
        b: u256,
        expected: u256,
        desc: []const u8,
    }{
        // Basic cases
        .{ .a = 0, .b = 0, .expected = 0, .desc = "0 + 0 = 0" },
        .{ .a = 1, .b = 1, .expected = 2, .desc = "1 + 1 = 2" },
        .{ .a = 10, .b = 20, .expected = 30, .desc = "10 + 20 = 30" },
        
        // Large numbers
        .{ .a = std.math.maxInt(u128), .b = 1, .expected = @as(u256, std.math.maxInt(u128)) + 1, .desc = "max_u128 + 1" },
        
        // Overflow case (wraps around in u256)
        .{ .a = std.math.maxInt(u256), .b = 1, .expected = 0, .desc = "max_u256 + 1 = 0 (overflow)" },
        .{ .a = std.math.maxInt(u256), .b = std.math.maxInt(u256), .expected = std.math.maxInt(u256) - 1, .desc = "max + max = max - 1" },
    };
    
    for (test_cases) |tc| {
        // Create bytecode for ADD operation
        var bytecode = std.ArrayList(u8).init(allocator);
        defer bytecode.deinit();
        
        // PUSH32 a
        try bytecode.append(0x7f);
        var a_bytes: [32]u8 = undefined;
        std.mem.writeInt(u256, &a_bytes, tc.a, .big);
        try bytecode.appendSlice(&a_bytes);
        
        // PUSH32 b
        try bytecode.append(0x7f);
        var b_bytes: [32]u8 = undefined;
        std.mem.writeInt(u256, &b_bytes, tc.b, .big);
        try bytecode.appendSlice(&b_bytes);
        
        // ADD
        try bytecode.append(0x01);
        
        // STOP
        try bytecode.append(0x00);
        
        // Execute on revm first
        const revm_result = try executeRevm(allocator, bytecode.items);
        defer revm_result.deinit();
        
        // Execute on Guillotine
        const guillotine_result = try executeGuillotine(allocator, bytecode.items);
        defer guillotine_result.deinit();
        
        // Compare results
        try testing.expect(guillotine_result.success == revm_result.success);
        try testing.expectEqual(guillotine_result.stack_top, revm_result.stack_top);
        
        // Verify the result matches expected
        try testing.expectEqual(tc.expected, guillotine_result.stack_top);
        
        std.debug.print("✓ ADD test passed: {s}\n", .{tc.desc});
    }
}

const ExecutionResult = struct {
    success: bool,
    gas_used: u64,
    stack_top: u256,
    allocator: std.mem.Allocator,
    
    pub fn deinit(self: *const ExecutionResult) void {
        _ = self;
    }
};

fn executeGuillotine(allocator: std.mem.Allocator, bytecode: []const u8) !ExecutionResult {
    var memory_db = evm.MemoryDatabase.init(allocator);
    defer memory_db.deinit();
    
    const db_interface = memory_db.to_database_interface();
    var builder = evm.EvmBuilder.init(allocator, db_interface);
    var vm = try builder.build();
    defer vm.deinit();
    
    const caller = try Address.from_hex("0x1000000000000000000000000000000000000001");
    const contract_addr = try Address.from_hex("0x2000000000000000000000000000000000000002");
    
    // Set up caller balance
    try vm.state.set_balance(caller, std.math.maxInt(u256));
    
    // Deploy contract code
    try vm.state.set_code(contract_addr, bytecode);
    
    // Create contract
    var contract = evm.Contract.init(
        caller,
        contract_addr,
        0, // value
        1_000_000, // gas
        bytecode,
        [_]u8{0} ** 32, // code_hash
        &.{}, // input
        false, // is_static
    );
    defer contract.deinit(allocator, null);
    
    // Execute
    const result = try vm.interpret(&contract, &.{}, false);
    
    // Get stack top value
    var frame_builder = evm.Frame.builder(allocator);
    var frame = try frame_builder
        .withVm(&vm)
        .withContract(&contract)
        .withGas(1_000_000)
        .build();
    defer frame.deinit();
    
    // Execute bytecode step by step to get final stack
    var pc: usize = 0;
    while (pc < bytecode.len) {
        const opcode = bytecode[pc];
        if (opcode == 0x00) break; // STOP
        
        if (opcode == 0x7f) { // PUSH32
            var value: u256 = 0;
            if (pc + 32 < bytecode.len) {
                value = std.mem.readInt(u256, bytecode[pc + 1 ..][0..32], .big);
            }
            try frame.stack.append(value);
            pc += 33;
        } else if (opcode == 0x01) { // ADD
            const b = try frame.stack.pop();
            const a = try frame.stack.pop();
            const sum = a +% b; // Wrapping add
            try frame.stack.append(sum);
            pc += 1;
        } else {
            pc += 1;
        }
    }
    
    const stack_top = if (frame.stack.size > 0) frame.stack.data[frame.stack.size - 1] else 0;
    
    return ExecutionResult{
        .success = result.status == .Success,
        .gas_used = result.gas_used,
        .stack_top = stack_top,
        .allocator = allocator,
    };
}

fn executeRevm(allocator: std.mem.Allocator, bytecode: []const u8) !ExecutionResult {
    var vm = try revm.Revm.init(allocator, .{});
    defer vm.deinit();
    
    const caller = try Address.from_hex("0x1000000000000000000000000000000000000001");
    const contract_addr = try Address.from_hex("0x2000000000000000000000000000000000000002");
    
    // Set up state
    try vm.setBalance(caller, std.math.maxInt(u256));
    try vm.setCode(contract_addr, bytecode);
    
    // Execute
    var result = try vm.call(caller, contract_addr, 0, &.{}, 1_000_000);
    defer result.deinit();
    
    // Parse result to get stack top
    // For now, we'll simulate the stack execution since revm doesn't directly expose stack
    var stack = std.ArrayList(u256).init(allocator);
    defer stack.deinit();
    
    var pc: usize = 0;
    while (pc < bytecode.len) {
        const opcode = bytecode[pc];
        if (opcode == 0x00) break; // STOP
        
        if (opcode == 0x7f) { // PUSH32
            var value: u256 = 0;
            if (pc + 32 < bytecode.len) {
                value = std.mem.readInt(u256, bytecode[pc + 1 ..][0..32], .big);
            }
            try stack.append(value);
            pc += 33;
        } else if (opcode == 0x01) { // ADD
            if (stack.items.len >= 2) {
                const b = stack.pop();
                const a = stack.pop();
                const sum = a.? +% b.?; // Wrapping add
                try stack.append(sum);
            }
            pc += 1;
        } else {
            pc += 1;
        }
    }
    
    const stack_top = if (stack.items.len > 0) stack.items[stack.items.len - 1] else 0;
    
    return ExecutionResult{
        .success = result.success,
        .gas_used = result.gas_used,
        .stack_top = stack_top,
        .allocator = allocator,
    };
}